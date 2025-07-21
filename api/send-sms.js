// api/send-sms.js - Updated for Zoko WhatsApp API
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
      error: 'Method not allowed. Use POST method.',
      provider: 'Zoko WhatsApp'
    });
  }

  try {
    console.log('📱 Zoko WhatsApp Invoice Message Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { phoneNumber, customerName, orderNumber, billToken, totalAmount } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber',
        provider: 'Zoko WhatsApp'
      });
    }

    // Clean and validate phone number for WhatsApp (international format)
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        provider: 'Zoko WhatsApp'
      });
    }

    // Format for WhatsApp (with country code)
    const whatsappNumber = `91${cleanNumber}`; // India country code

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

    // Create WhatsApp message for Mitti Arts
    const message = `🏺 *Mitti Arts - Invoice Generated*

Dear ${customerName.trim()},

Thank you for choosing our handcrafted pottery! 

*Order Details:*
📋 Order Number: ${orderNumber.trim()}
💰 Amount: ₹${(totalAmount || 0).toFixed(2)}

*View & Download Your Invoice:*
${billLink}

For any assistance, contact us:
📞 9441550927
📧 info@mittiarts.com

*Mitti Arts Team*
_Handcrafted with Love 🎨_`;

    console.log('📱 Sending WhatsApp message to:', `${cleanNumber.slice(0, 5)}*****`);
    console.log('📝 Message length:', message.length, 'characters');

    // Validate message length for WhatsApp
    if (message.length > 4096) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. WhatsApp limit is 4096 characters.',
        messageLength: message.length,
        provider: 'Zoko WhatsApp'
      });
    }

    // Zoko WhatsApp API Configuration
    const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    const ZOKO_API_URL = 'https://api.zoko.io/v2/message/send';

    // Prepare WhatsApp message payload for Zoko
    const payload = {
      channel: 'whatsapp',
      recipient: whatsappNumber,
      type: 'text',
      message: {
        text: message
      }
    };

    console.log('📡 Calling Zoko WhatsApp API...');

    // Send WhatsApp message via Zoko API
    const response = await fetch(ZOKO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZOKO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Zoko Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Zoko API Error Response:', errorText);
      throw new Error(`Zoko WhatsApp API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Zoko Response Data:', data);

    // Handle successful Zoko response
    if (data.success || data.id || data.message_id) {
      console.log('✅ WhatsApp message sent successfully via Zoko');
      
      return res.status(200).json({
        success: true,
        messageId: data.id || data.message_id || data.request_id,
        message: 'WhatsApp invoice message sent successfully',
        provider: 'Zoko WhatsApp',
        channel: 'WhatsApp',
        billToken: billToken || null,
        billLink: billLink,
        sentAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        whatsappNumber: whatsappNumber,
        cost: 'Per message pricing',
        
        // WhatsApp specific data
        whatsappData: {
          messageId: data.id || data.message_id,
          status: data.status || 'sent',
          recipient: whatsappNumber
        },
        
        // Zoko response data
        zokoResponse: data
      });
    } else {
      // Zoko returned error
      let errorMsg = 'Unknown Zoko WhatsApp API error';
      
      if (data.error) {
        errorMsg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
      } else if (data.message) {
        errorMsg = data.message;
      } else if (data.errors) {
        errorMsg = Array.isArray(data.errors) ? data.errors.join(', ') : JSON.stringify(data.errors);
      }
      
      console.error('❌ Zoko WhatsApp Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Zoko WhatsApp API Error: ${errorMsg}`,
        provider: 'Zoko WhatsApp',
        channel: 'WhatsApp',
        attemptedAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        whatsappNumber: whatsappNumber,
        zokoResponse: data
      });
    }

  } catch (error) {
    console.error('❌ WhatsApp Handler Error:', error);
    
    // Determine error type and appropriate response
    let errorMessage = 'Failed to send WhatsApp invoice message';
    let statusCode = 500;
    let errorCode = 'UNKNOWN';
    
    if (error.message?.includes('fetch')) {
      errorMessage = 'Failed to connect to Zoko WhatsApp API. Please check internet connection.';
      statusCode = 503;
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'WhatsApp message request timed out. Please try again.';
      statusCode = 504;
      errorCode = 'TIMEOUT';
    } else if (error.message?.includes('401') || error.message?.includes('403')) {
      errorMessage = 'Zoko WhatsApp API authentication failed. Please check API key.';
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
    } else if (error.message?.includes('429')) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
      statusCode = 429;
      errorCode = 'RATE_LIMIT';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = 'API_ERROR';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      provider: 'Zoko WhatsApp',
      channel: 'WhatsApp',
      attemptedAt: new Date().toISOString()
    });
  }
}