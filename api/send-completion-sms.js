// api/send-completion-sms.js - Complete Twilio Version for Mitti Arts
// Converted from Fast2SMS to Twilio with your credentials

// Your Twilio credentials
const TWILIO_ACCOUNT_SID = 'AC6a1f33b6d6b01ebba791ae6356de8b1f';
const TWILIO_AUTH_TOKEN = '048dd504aaf6abdaac8e6ae26eb52855';
const TWILIO_PHONE_NUMBER = '+12178338469';
const TWILIO_API_URL = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

// Helper function to clean phone number
function cleanPhoneNumber(phoneNumber) {
  if (!phoneNumber) return '';
  return phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
}

// Helper function to validate phone number
function isValidPhoneNumber(phoneNumber) {
  const cleanNumber = cleanPhoneNumber(phoneNumber);
  return /^[6-9]\d{9}$/.test(cleanNumber);
}

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
      smsType: 'completion'
    });
  }

  try {
    console.log('📱 Received completion SMS request:', {
      method: req.method,
      headers: req.headers,
      bodyKeys: Object.keys(req.body || {})
    });

    const { phoneNumber, customerName, orderNumber, finalAmount, billToken } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        smsType: 'completion'
      });
    }

    if (!customerName) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        smsType: 'completion'
      });
    }

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Order number is required',
        smsType: 'completion'
      });
    }

    if (finalAmount === undefined || finalAmount === null) {
      return res.status(400).json({
        success: false,
        error: 'Final amount is required',
        smsType: 'completion'
      });
    }

    // Clean and validate phone number
    const cleanNumber = cleanPhoneNumber(phoneNumber);
    
    if (!isValidPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number.',
        smsType: 'completion'
      });
    }

    // Format phone number for Twilio (add +91 for India)
    const formattedNumber = `+91${cleanNumber}`;

    // Validate final amount
    const finalPayment = Number(finalAmount);
    
    if (isNaN(finalPayment) || finalPayment < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid final amount',
        smsType: 'completion'
      });
    }

    // Validate Twilio credentials
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      console.error('❌ Twilio credentials not configured');
      return res.status(500).json({
        success: false,
        error: 'SMS service not configured properly',
        smsType: 'completion'
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

    // Create payment completion SMS message
    const message = `🏺 Dear ${customerName},

🎉 Payment completed for Mitti Arts order!

Order: ${orderNumber}
Final Payment: ₹${finalPayment.toFixed(2)}
Status: PAID IN FULL ✅

Download Final Invoice: ${billLink}

Thank you for your business!
- Mitti Arts Team`;

    console.log('📱 Sending completion SMS to:', formattedNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length
    if (message.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'completion'
      });
    }

    // Create Basic Auth header for Twilio
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    // Send SMS via Twilio API (replacing Fast2SMS)
    const smsResponse = await fetch(TWILIO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      },
      body: new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: formattedNumber,
        Body: message
      })
    });

    const smsData = await smsResponse.json();

    console.log('📊 Twilio Response Status:', smsResponse.status);
    console.log('📊 Twilio Response Data:', smsData);

    // Handle different response scenarios
    if (smsResponse.status === 201 && smsData && smsData.sid) {
      // Success case - Twilio returns 201 for created messages
      return res.status(200).json({
        success: true,
        messageId: smsData.sid,
        message: message,
        smsType: 'completion',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Twilio',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        status: smsData.status,
        direction: smsData.direction,
        price: smsData.price,
        priceUnit: smsData.price_unit,
        smsCount: Math.ceil(message.length / 160),
        finalAmount: finalPayment
      });
    } else {
      // Twilio returned an error
      const errorMsg = smsData?.message || smsData?.error_message || 'Unknown Twilio API error';
      console.error('❌ Twilio Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Twilio API Error: ${errorMsg}`,
        smsType: 'completion',
        provider: 'Twilio',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        apiResponse: smsData
      });
    }

  } catch (error) {
    console.error('❌ Completion SMS Handler Error:', error);
    
    let errorMessage = 'Failed to send completion SMS';
    let statusCode = 500;
    
    // Handle different error types (similar to your Fast2SMS error handling)
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      errorMessage = 'SMS request timed out. Please try again.';
      statusCode = 408;
    } else if (error.message?.includes('401') || error.message?.includes('authentication')) {
      errorMessage = 'Twilio API authentication failed. Invalid credentials.';
      statusCode = 401;
    } else if (error.message?.includes('400')) {
      errorMessage = 'Invalid SMS request data for Twilio API';
      statusCode = 400;
    } else if (error.message?.includes('429')) {
      errorMessage = 'Too many SMS requests. Please wait and try again.';
      statusCode = 429;
    } else if (error.message?.includes('fetch')) {
      errorMessage = 'Failed to connect to Twilio API. Please check your internet connection.';
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'completion',
      provider: 'Twilio',
      attemptedAt: new Date().toISOString(),
      phoneNumber: cleanPhoneNumber(req.body?.phoneNumber || ''),
      errorCode: statusCode,
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          originalError: error.message,
          stack: error.stack
        }
      })
    });
  }
}