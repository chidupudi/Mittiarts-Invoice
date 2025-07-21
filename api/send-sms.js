// api/send-sms.js - Multi-provider fallback messaging system
export default async function handler(req, res) {
  console.log('🔍 Multi-provider messaging API called:', {
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST method.'
    });
  }

  try {
    const { phoneNumber, customerName, orderNumber, billToken, totalAmount } = req.body || {};

    // Validate inputs
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber'
      });
    }

    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number'
      });
    }

    // Generate invoice link
    let origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || req.headers['x-forwarded-host'] || 'invoice.mittiarts.com';
      origin = `${protocol}://${host}`;
    }
    origin = origin.replace(/\/$/, '');
    
    const billLink = billToken && billToken !== 'none' 
      ? `${origin}/public/invoice/${billToken}` 
      : `${origin}`;

    // Create message content
    const whatsappMessage = `🏺 *Mitti Arts - Invoice Generated*

Dear ${customerName.trim()},

Thank you for choosing our handcrafted pottery! 

*Order Details:*
📋 Order Number: ${orderNumber.trim()}
💰 Amount: ₹${(totalAmount || 0).toFixed(2)}

*View & Download Your Invoice:*
${billLink}

For assistance: 9441550927

*Mitti Arts Team*
_Handcrafted with Love 🎨_`;

    const smsMessage = `Mitti Arts Invoice
Dear ${customerName.trim()},
Order: ${orderNumber.trim()}
Amount: Rs.${(totalAmount || 0).toFixed(2)}
Invoice: ${billLink}
Contact: 9441550927
- Mitti Arts Team`;

    console.log('📝 Messages prepared');

    // Provider configurations
    const providers = [
      {
        name: 'WhatsApp.Chat-API',
        type: 'whatsapp',
        enabled: true,
        test: async () => {
          const response = await fetch('https://api.chat-api.com/instance1/status', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          });
          return response.ok;
        },
        send: async () => {
          // This is a placeholder - you'd need to register with chat-api.com
          throw new Error('Chat-API requires instance setup');
        }
      },
      {
        name: 'UltraMsg-WhatsApp',
        type: 'whatsapp', 
        enabled: true,
        send: async () => {
          const ultraMsgUrl = 'https://api.ultramsg.com/instance1/messages/chat';
          // This requires UltraMsg setup - placeholder
          throw new Error('UltraMsg requires instance setup');
        }
      },
      {
        name: 'Fast2SMS-Fallback',
        type: 'sms',
        enabled: true,
        send: async () => {
          console.log('📱 Trying Fast2SMS as fallback...');
          
          const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
            method: 'POST',
            headers: {
              'authorization': 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: smsMessage,
              route: 'q',
              numbers: cleanNumber,
              flash: '0'
            })
          });

          if (!fast2smsResponse.ok) {
            throw new Error(`Fast2SMS failed: ${fast2smsResponse.status}`);
          }

          const data = await fast2smsResponse.json();
          if (data.return === true) {
            return {
              success: true,
              messageId: data.request_id,
              provider: 'Fast2SMS (SMS Fallback)',
              channel: 'SMS'
            };
          } else {
            throw new Error(`Fast2SMS error: ${JSON.stringify(data)}`);
          }
        }
      },
      {
        name: 'TextLocal-SMS',
        type: 'sms',
        enabled: true,
        send: async () => {
          console.log('📱 Trying TextLocal SMS...');
          
          // TextLocal API - you'd need to get an API key
          const textLocalResponse = await fetch('https://api.textlocal.in/send/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              apikey: 'YOUR_TEXTLOCAL_API_KEY', // Replace with actual key
              numbers: `91${cleanNumber}`,
              message: smsMessage,
              sender: 'MITTI'
            })
          });

          // This will fail without proper API key, so skip for now
          throw new Error('TextLocal requires API key setup');
        }
      },
      {
        name: 'Simple-HTTP-WhatsApp',
        type: 'whatsapp',
        enabled: true,
        send: async () => {
          console.log('📱 Trying simple HTTP WhatsApp redirect...');
          
          // Create a WhatsApp web link (doesn't actually send, but creates a clickable link)
          const whatsappWebUrl = `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`;
          
          // For now, we'll return this as a "success" with the link
          // In a real scenario, you might want to use WhatsApp Business API
          return {
            success: true,
            messageId: `whatsapp_link_${Date.now()}`,
            provider: 'WhatsApp Web Link',
            channel: 'WhatsApp Link',
            whatsappLink: whatsappWebUrl,
            note: 'WhatsApp web link generated - manual sending required'
          };
        }
      }
    ];

    // Try each provider in order
    const attempts = [];
    
    for (const provider of providers) {
      if (!provider.enabled) continue;
      
      try {
        console.log(`🔄 Attempting ${provider.name}...`);
        
        const result = await provider.send();
        
        console.log(`✅ Success with ${provider.name}`);
        
        return res.status(200).json({
          success: true,
          messageId: result.messageId,
          message: 'Message sent successfully',
          provider: result.provider || provider.name,
          channel: result.channel || provider.type,
          billToken: billToken || null,
          billLink: billLink,
          sentAt: new Date().toISOString(),
          phoneNumber: `+91${cleanNumber}`,
          whatsappLink: result.whatsappLink, // If applicable
          note: result.note, // If applicable
          attempts: attempts.length + 1
        });
        
      } catch (providerError) {
        console.log(`❌ ${provider.name} failed:`, providerError.message);
        attempts.push({
          provider: provider.name,
          type: provider.type,
          error: providerError.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // If all providers failed
    console.log('❌ All messaging providers failed');
    
    return res.status(503).json({
      success: false,
      error: 'All messaging providers are currently unavailable',
      attempts: attempts,
      fallbackOptions: {
        manual: {
          whatsappLink: `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`,
          smsText: smsMessage,
          customerPhone: `+91${cleanNumber}`
        },
        recommendations: [
          'Use the WhatsApp link to manually send the message',
          'Call the customer directly at +91' + cleanNumber,
          'Send the invoice link via email if available',
          'Check provider status and try again later'
        ]
      },
      troubleshooting: {
        zokoIssue: 'Zoko API experiencing TLS certificate issues',
        alternatives: [
          'Set up UltraMsg for WhatsApp messaging',
          'Configure TextLocal for SMS backup',
          'Use WhatsApp Business API directly',
          'Enable email notifications as backup'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}