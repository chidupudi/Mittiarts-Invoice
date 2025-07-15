// api/send-sms.js - Fast2SMS Non-DLT Version for Mitti Arts
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

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

  // Initialize variables at the top
  let cleanNumber = '';
  let formattedNumber = '';

  try {
    console.log('📱 Received SMS request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {})
    });

    // Your Fast2SMS API key
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';

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
    cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    formattedNumber = `+91${cleanNumber}`;
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number.',
        smsType: 'bill'
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

    const billLink = billToken && billToken !== 'none' ? `${origin}/public/invoice/${billToken}` : `${origin}`;

    // Create SMS message
   // Create SMS message (removed emojis for Fast2SMS compatibility)
let message;
if (customMessage) {
  message = customMessage;
} else {
  message = `Dear ${customerName}, Thank you for choosing Mitti Arts! Order: ${orderNumber} Amount: Rs.${(totalAmount || 0).toFixed(2)} View Invoice: ${billLink} - Mitti Arts Team`;
}

    console.log('📱 Sending SMS to:', cleanNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'bill'
      });
    }
// Send SMS via Fast2SMS Quick Route (Non-DLT)
// Send SMS via Fast2SMS API
const fast2smsResponse = await fetch('https://www.fast2sms.com/dev/bulkV2', {
  method: 'POST',
  headers: {
    'authorization': FAST2SMS_API_KEY,
    'Content-Type': 'application/x-www-form-urlencoded',
    'cache-control': 'no-cache'
  },
  body: new URLSearchParams({
    message: message,
    route: 'p', // Promotional route instead of 'q'
    numbers: cleanNumber,
    language: 'english'
  })
});
    const fast2smsData = await fast2smsResponse.json();

    console.log('📊 Fast2SMS Response Status:', fast2smsResponse.status);
    console.log('📊 Fast2SMS Response Data:', fast2smsData);

    // Handle successful response
    if (fast2smsData.return === true) {
      return res.status(200).json({
        success: true,
        messageId: fast2smsData.request_id,
        message: message,
        smsType: 'bill',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        route: 'quick'
      });
    } else {
      // Fast2SMS returned an error
      const errorMsg = fast2smsData.message?.[0] || 'Unknown Fast2SMS API error';
      console.error('❌ Fast2SMS Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        smsType: 'bill',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        fast2smsResponse: fast2smsData
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
      errorMessage = 'SMS API authentication failed. Please check API key.';
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'bill',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: formattedNumber || 'Invalid',
      errorCode: error.code || 'UNKNOWN'
    });
  }
}