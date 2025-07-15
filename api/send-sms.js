// api/send-sms.js - Twilio Version for Mitti Arts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.',
      smsType: 'bill'
    });
  }

  try {
    console.log('📱 Received SMS request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {})
    });

    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

    const { phoneNumber, customerName, orderNumber, billToken, totalAmount, customMessage } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        smsType: 'bill'
      });
    }

    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        smsType: 'bill'
      });
    }

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Order number is required',
        smsType: 'bill'
      });
    }

    // Clean and validate phone number for India
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number.',
        smsType: 'bill'
      });
    }

    // Format phone number for Twilio (add +91 for India)
    const formattedNumber = `+91${cleanNumber}`;

    // Get the origin for bill link
    let origin = req.headers.origin || req.headers.referer;
    if (!origin) {
      const protocol = req.headers['x-forwarded-proto'] || 'https';
      const host = req.headers.host || req.headers['x-forwarded-host'] || 'invoice.mittiarts.com';
      origin = `${protocol}://${host}`;
    }
    origin = origin.replace(/\/$/, '');
    if (!origin.includes('mittiarts.com') && !origin.includes('localhost')) {
      origin = 'https://invoice.mittiarts.com';
    }

    const billLink = billToken && billToken !== 'none' ? `${origin}/public/invoice/${billToken}` : `${origin}`;

    // Create SMS message
    let message;
    if (customMessage) {
      message = customMessage;
    } else {
      message = `🏺 Dear ${customerName},

Thank you for choosing Mitti Arts!

Order: ${orderNumber}
Amount: ₹${(totalAmount || 0).toFixed(2)}

View & Download Invoice: ${billLink}

We appreciate your business!
- Mitti Arts Team`;
    }

    console.log('📱 Sending SMS to:', formattedNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length (Twilio supports up to 1600 characters)
    if (message.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'bill'
      });
    }

    // Create Basic Auth header for Twilio
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // Send SMS via Twilio API
    const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: formattedNumber,
        Body: message
      })
    });

    const twilioData = await twilioResponse.json();

    console.log('📊 Twilio Response Status:', twilioResponse.status);
    console.log('📊 Twilio Response Data:', twilioData);

    // Handle successful response
    if (twilioResponse.status === 201 && twilioData.sid) {
      return res.status(200).json({
        success: true,
        messageId: twilioData.sid,
        message: message,
        smsType: 'bill',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Twilio',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        status: twilioData.status,
        direction: twilioData.direction,
        price: twilioData.price,
        priceUnit: twilioData.price_unit
      });
    } else {
      // Twilio returned an error
      const errorMsg = twilioData?.message || twilioData?.error_message || 'Unknown Twilio API error';
      console.error('❌ Twilio Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Twilio API Error: ${errorMsg}`,
        smsType: 'bill',
        provider: 'Twilio',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        twilioResponse: twilioData
      });
    }

  } catch (error) {
    console.error('❌ SMS Handler Error:', error);
    
    let errorMessage = 'Failed to send SMS';
    let statusCode = 500;
    
    if (error.message?.includes('fetch')) {
      errorMessage = 'SMS request failed. Please check your internet connection.';
      statusCode = 503;
    } else if (error.message?.includes('auth')) {
      errorMessage = 'SMS API authentication failed. Please check credentials.';
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'bill',
      provider: 'Twilio',
      attemptedAt: new Date().toISOString(),
      phoneNumber: formattedNumber,
      errorCode: error.code || 'UNKNOWN',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          originalError: error.message,
          stack: error.stack
        }
      })
    });
  }
}