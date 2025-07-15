// api/send-advance-sms.js - Fast2SMS Non-DLT Version for Mitti Arts Advance Payments
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
      smsType: 'advance'
    });
  }

  // Initialize variables at the top
  let cleanNumber = '';
  let formattedNumber = '';

  try {
    console.log('📱 Received advance SMS request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {})
    });

    // Your Fast2SMS API key
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';

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
    cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    formattedNumber = `+91${cleanNumber}`;
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Must be a valid 10-digit Indian mobile number.',
        smsType: 'advance'
      });
    }

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
    const message = ` Dear ${customerName},

Advance payment received for Mitti Arts!

Order: ${orderNumber}
Advance Paid: RS${advance.toFixed(2)}
Balance Due: RS${remaining.toFixed(2)}

View & Download Invoice: ${billLink}

Thank you for choosing Mitti Arts!
- Team Mitti Arts`;

    console.log('📱 Sending advance SMS to:', cleanNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'advance'
      });
    }
// Send SMS via Fast2SMS API (GET method for non-DLT)
const smsParams = new URLSearchParams({
  authorization: FAST2SMS_API_KEY,
  message: message,
  route: 'q',
  numbers: cleanNumber,
  flash: '0'
});

const fast2smsResponse = await fetch(`https://www.fast2sms.com/dev/bulkV2?${smsParams.toString()}`, {
  method: 'GET',
  headers: {
    'cache-control': 'no-cache'
  }
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
        smsType: 'advance',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        route: 'quick',
        advanceAmount: advance,
        remainingAmount: remaining
      });
    } else {
      // Fast2SMS returned an error
      const errorMsg = fast2smsData.message?.[0] || 'Unknown Fast2SMS API error';
      console.error('❌ Fast2SMS Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        smsType: 'advance',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        fast2smsResponse: fast2smsData
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
      errorMessage = 'SMS API authentication failed. Please check Fast2SMS API key.';
      statusCode = 401;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'advance',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: formattedNumber || 'Invalid',
      errorCode: error.code || 'UNKNOWN'
    });
  }
}