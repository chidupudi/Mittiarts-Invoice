// api/send-sms.js - Fixed and Debug-Enhanced Zoko WhatsApp API
export default async function handler(req, res) {
  console.log('🔍 API Handler called:', {
    method: req.method,
    url: req.url,
    headers: Object.keys(req.headers),
    timestamp: new Date().toISOString()
  });

  // Handle CORS with more comprehensive headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS preflight request');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed. Use POST method.`,
      provider: 'Zoko WhatsApp',
      allowedMethods: ['POST'],
      receivedMethod: req.method
    });
  }

  try {
    console.log('📱 Zoko WhatsApp Invoice Message Request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      bodySize: JSON.stringify(req.body || {}).length,
      timestamp: new Date().toISOString()
    });

    const { phoneNumber, customerName, orderNumber, billToken, totalAmount } = req.body || {};

    // Debug request body
    console.log('📋 Request validation:', {
      phoneNumber: phoneNumber ? `${phoneNumber.toString().slice(0, 5)}*****` : 'missing',
      customerName: customerName ? `${customerName.slice(0, 10)}...` : 'missing',
      orderNumber: orderNumber || 'missing',
      billToken: billToken ? 'present' : 'missing',
      totalAmount: totalAmount || 'missing'
    });

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      console.log('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber',
        provider: 'Zoko WhatsApp',
        received: {
          phoneNumber: !!phoneNumber,
          customerName: !!customerName,
          orderNumber: !!orderNumber
        }
      });
    }

    // Clean and validate phone number for WhatsApp (international format)
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    console.log('📞 Phone number processing:', {
      original: `${phoneNumber.toString().slice(0, 5)}*****`,
      cleaned: `${cleanNumber.slice(0, 5)}*****`,
      length: cleanNumber.length
    });
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      console.log('❌ Invalid phone number format:', cleanNumber);
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        provider: 'Zoko WhatsApp',
        phoneNumberFormat: 'Expected: 10 digits starting with 6,7,8,9'
      });
    }

    // Format for WhatsApp (with country code)
    const whatsappNumber = `91${cleanNumber}`;
    console.log('📱 WhatsApp number formatted:', `91${cleanNumber.slice(0, 5)}*****`);

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

    console.log('🔗 Invoice link generated:', billLink);

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

    console.log('📝 Message created:', {
      length: message.length,
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      amount: (totalAmount || 0).toFixed(2)
    });

    // Validate message length for WhatsApp
    if (message.length > 4096) {
      console.log('❌ Message too long:', message.length);
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

    console.log('🔑 API Configuration:', {
      apiUrl: ZOKO_API_URL,
      apiKeyPresent: !!ZOKO_API_KEY,
      apiKeyLength: ZOKO_API_KEY ? ZOKO_API_KEY.length : 0
    });

    // Prepare WhatsApp message payload for Zoko
    const payload = {
      channel: 'whatsapp',
      recipient: whatsappNumber,
      type: 'text',
      message: {
        text: message
      }
    };

    console.log('📡 Payload prepared:', {
      channel: payload.channel,
      recipient: `${whatsappNumber.slice(0, 5)}*****`,
      type: payload.type,
      messageLength: payload.message.text.length
    });

    console.log('📡 Calling Zoko WhatsApp API...');

    // Send WhatsApp message via Zoko API with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after 15 seconds');
      controller.abort();
    }, 15000);

    let response;
    try {
      response = await fetch(ZOKO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZOKO_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Mitti-Arts-POS/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('❌ Fetch Error:', fetchError);
      
      let errorMessage = 'Failed to connect to Zoko WhatsApp API';
      if (fetchError.name === 'AbortError') {
        errorMessage = 'Request to Zoko WhatsApp API timed out';
      } else if (fetchError.message) {
        errorMessage = `Network error: ${fetchError.message}`;
      }
      
      return res.status(503).json({
        success: false,
        error: errorMessage,
        provider: 'Zoko WhatsApp',
        errorType: fetchError.name || 'NetworkError',
        timestamp: new Date().toISOString()
      });
    }

    console.log('📊 Zoko Response Status:', response.status);
    console.log('📊 Zoko Response Headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
        console.error('❌ Zoko API Error Response:', errorText);
      } catch (textError) {
        errorText = 'Unable to read error response';
        console.error('❌ Error reading Zoko response:', textError);
      }
      
      return res.status(response.status).json({
        success: false,
        error: `Zoko WhatsApp API returned status ${response.status}`,
        provider: 'Zoko WhatsApp',
        httpStatus: response.status,
        errorResponse: errorText,
        timestamp: new Date().toISOString()
      });
    }

    let data;
    try {
      data = await response.json();
      console.log('📊 Zoko Response Data:', JSON.stringify(data, null, 2));
    } catch (jsonError) {
      console.error('❌ JSON Parse Error:', jsonError);
      return res.status(502).json({
        success: false,
        error: 'Invalid JSON response from Zoko WhatsApp API',
        provider: 'Zoko WhatsApp',
        timestamp: new Date().toISOString()
      });
    }

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
      attemptedAt: new Date().toISOString(),
      
      // Debug information
      debug: {
        originalError: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        requestMethod: req.method,
        requestUrl: req.url
      }
    });
  }
}