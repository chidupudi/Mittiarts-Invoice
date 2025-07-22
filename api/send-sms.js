// api/send-sms.js - CORRECTED Zoko WhatsApp API with proper endpoint and authentication
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
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
    console.log('📱 Corrected Zoko WhatsApp Invoice Message Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      billToken,
      totalAmount 
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.'
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

    // Create WhatsApp message for Zoko
    const whatsappMessage = `🏺 *Mitti Arts - Invoice Generated*

Dear ${customerName.trim()},

Thank you for choosing our handcrafted pottery! 

*Order Details:*
📋 Order Number: ${orderNumber.trim()}
💰 Amount: ₹${(totalAmount || 0).toFixed(2)}

*View & Download Your Invoice:*
${billLink}

Your beautiful pottery pieces are ready! 🎨

*Contact & Location:*
📞 9441550927 / 7382150250
🏪 Opp. Romoji Film City, Hyderabad
📧 info@mittiarts.com

*Mitti Arts Team*
_Handcrafted with Love 🎨_`;

    console.log('📱 Attempting Corrected Zoko WhatsApp API...');

    // Try Corrected Zoko WhatsApp API first
    try {
      const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
      const ZOKO_API_URL = 'https://chat.zoko.io/v2/message'; // CORRECTED URL
      const whatsappNumber = `91${cleanNumber}`;

      // CORRECTED Payload Format (based on Zoko docs)
      const zokoPayload = {
        channel: 'whatsapp',
        recipient: whatsappNumber,
        type: 'text',
        message: whatsappMessage  // Direct message field, not nested
      };

      console.log('📡 Calling CORRECTED Zoko WhatsApp API...');
      console.log('🔧 Using endpoint:', ZOKO_API_URL);
      console.log('📱 Recipient:', whatsappNumber);

      const zokoResponse = await fetch(ZOKO_API_URL, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'content-type': 'application/json',
          'apikey': ZOKO_API_KEY  // CORRECTED Header format
        },
        body: JSON.stringify(zokoPayload)
      });

      console.log('📊 Corrected Zoko Response Status:', zokoResponse.status);

      if (zokoResponse.ok) {
        const zokoData = await zokoResponse.json();
        console.log('📊 Corrected Zoko Response Data:', zokoData);

        // Check for success in Zoko response
        if (zokoData && (zokoData.success !== false)) {
          console.log('✅ Success with CORRECTED Zoko WhatsApp API');
          
          return res.status(200).json({
            success: true,
            messageId: zokoData.id || zokoData.messageId || Date.now().toString(),
            message: 'WhatsApp message sent successfully via Corrected Zoko API',
            provider: 'Zoko WhatsApp (Corrected)',
            channel: 'WhatsApp',
            sentAt: new Date().toISOString(),
            phoneNumber: `+91${cleanNumber}`,
            whatsappNumber: whatsappNumber,
            billLink: billLink,
            cost: 'Per message pricing',
            zokoResponse: zokoData
          });
        }
      }

      // If Zoko fails, get response text for debugging
      const errorText = await zokoResponse.text();
      console.log('❌ Corrected Zoko API failed:', zokoResponse.status, errorText);
      throw new Error(`Corrected Zoko API returned status ${zokoResponse.status}: ${errorText}`);

    } catch (zokoError) {
      console.log('❌ Corrected Zoko WhatsApp failed:', zokoError.message);
      console.log('🔄 Falling back to Fast2SMS...');
      
      // Fallback to Fast2SMS
      try {
        const smsMessage = `Mitti Arts Invoice
Dear ${customerName.trim()},
Order: ${orderNumber.trim()}
Amount: Rs.${(totalAmount || 0).toFixed(2)}
Invoice: ${billLink}
Contact: 9441550927
- Mitti Arts Team`;

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

        const fast2smsData = await fast2smsResponse.json();
        console.log('📊 Fast2SMS Response:', fast2smsData);

        if (fast2smsResponse.ok && fast2smsData.return === true) {
          console.log('✅ Success with Fast2SMS fallback');
          
          return res.status(200).json({
            success: true,
            messageId: fast2smsData.request_id,
            message: 'SMS sent successfully via Fast2SMS (fallback after Zoko correction attempt)',
            provider: 'Fast2SMS (Fallback)',
            channel: 'SMS',
            sentAt: new Date().toISOString(),
            phoneNumber: `+91${cleanNumber}`,
            billLink: billLink,
            cost: 'SMS pricing',
            fallbackReason: 'Corrected Zoko WhatsApp still unavailable',
            zokoAttempt: 'Corrected API format attempted'
          });
        }

        throw new Error(`Fast2SMS error: ${JSON.stringify(fast2smsData)}`);

      } catch (fast2smsError) {
        console.log('❌ Fast2SMS also failed:', fast2smsError.message);
        
        // Both providers failed
        return res.status(503).json({
          success: false,
          error: 'All messaging providers are currently unavailable',
          attempts: [
            {
              provider: 'Zoko WhatsApp (Corrected API)',
              endpoint: 'https://chat.zoko.io/v2/message',
              error: zokoError.message,
              timestamp: new Date().toISOString()
            },
            {
              provider: 'Fast2SMS',
              error: fast2smsError.message,
              timestamp: new Date().toISOString()
            }
          ],
          troubleshooting: {
            zokoCorrections: [
              'Used correct endpoint: https://chat.zoko.io/v2/message',
              'Used correct header format: apikey instead of Authorization Bearer',
              'Used correct payload format: direct message field',
              'Still experiencing connectivity issues'
            ],
            nextSteps: [
              'Verify Zoko account is active and API key is valid',
              'Check if WhatsApp number is properly configured in Zoko',
              'Contact Zoko support for API connectivity issues',
              'Fast2SMS working as reliable backup'
            ]
          },
          fallbackOptions: {
            manual: {
              whatsappLink: `https://wa.me/91${cleanNumber}?text=${encodeURIComponent(whatsappMessage)}`,
              customerPhone: `+91${cleanNumber}`
            }
          }
        });
      }
    }

  } catch (error) {
    console.error('❌ Handler error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}