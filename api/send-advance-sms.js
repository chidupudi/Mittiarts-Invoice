// api/send-advance-sms.js - Twilio Version for Mitti Arts Advance Payments
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
      smsType: 'advance'
    });
  }

  try {
    console.log('📱 Received advance SMS request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {})
    });

    // Your Twilio credentials
    const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || 'AC6a1f33b6d6b01ebba791ae6356de8b1f';
    const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || '048dd504aaf6abdaac8e6ae26eb52855';
    const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER || '+12178338469';

    const { phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        smsType: 'advance'
      });
    }

    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        smsType: 'advance'
      });
    }

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Order number is required',
        smsType: 'advance'
      });
    }

    if (advanceAmount === undefined || advanceAmount === null) {
      return res.status(400).json({
        success: false,
        error: 'Advance amount is required',
        smsType: 'advance'
      });
    }

    if (remainingAmount === undefined || remainingAmount === null) {
      return res.status(400).json({
        success: false,
        error: 'Remaining amount is required',
        smsType: 'advance'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number.',
        smsType: 'advance'
      });
    }

    // Format phone number for Twilio
    const formattedNumber = `+91${cleanNumber}`;

    // Validate amounts
    const advance = Number(advanceAmount);
    const remaining = Number(remainingAmount);
    
    if (isNaN(advance) || advance < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid advance amount',
        smsType: 'advance'
      });
    }

    if (isNaN(remaining) || remaining < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid remaining amount',
        smsType: 'advance'
      });
    }

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

    const billLink = billToken ? `${origin}/public/invoice/${billToken}` : `${origin}`;

    // Create advance payment SMS message for pottery business
    const message = `🏺 Dear ${customerName},

Advance payment received for Mitti Arts!

Order: ${orderNumber}
Advance Paid: ₹${advance.toFixed(2)}
Balance Due: ₹${remaining.toFixed(2)}

View & Download Invoice: ${billLink}

Thank you for choosing Mitti Arts!
- Team Mitti Arts`;

    console.log('📱 Sending advance SMS to:', formattedNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length
    if (message.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'advance'
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
        smsType: 'advance',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Twilio',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        status: twilioData.status,
        price: twilioData.price,
        priceUnit: twilioData.price_unit,
        advanceAmount: advance,
        remainingAmount: remaining
      });
    } else {
      // Twilio returned an error
      const errorMsg = twilioData?.message || twilioData?.error_message || 'Unknown Twilio API error';
      console.error('❌ Twilio Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Twilio API Error: ${errorMsg}`,
        smsType: 'advance',
        provider: 'Twilio',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        twilioResponse: twilioData
      });
    }

  } catch (error) {
    console.error('❌ Advance SMS Handler Error:', error);
    
    let errorMessage = 'Failed to send advance SMS';
    let statusCode = 500;
    
    if (error.message?.includes('fetch')) {
      errorMessage = 'SMS request failed. Please check your internet connection.';
      statusCode = 503;
    } else if (error.message?.includes('auth')) {
      errorMessage = 'SMS API authentication failed. Please check Twilio credentials.';
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'advance',
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