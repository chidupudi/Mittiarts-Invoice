// api/send-advance-sms.js - Corrected Fast2SMS Implementation for Advance Payments
export default async function handler(req, res) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.',
      allowedMethods: ['POST'],
      smsType: 'advance'
    });
  }

  try {
    console.log('📱 Fast2SMS Advance Payment SMS Request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    // Fast2SMS API Configuration (Official)
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

    // Extract and validate request data
    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      advanceAmount,
      remainingAmount,
      billToken 
    } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        field: 'phoneNumber',
        smsType: 'advance'
      });
    }

    if (!customerName || customerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        field: 'customerName',
        smsType: 'advance'
      });
    }

    if (!orderNumber || orderNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order number is required',
        field: 'orderNumber',
        smsType: 'advance'
      });
    }

    if (advanceAmount === undefined || advanceAmount === null || isNaN(advanceAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid advance amount is required',
        field: 'advanceAmount',
        smsType: 'advance'
      });
    }

    if (remainingAmount === undefined || remainingAmount === null || isNaN(remainingAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid remaining amount is required',
        field: 'remainingAmount',
        smsType: 'advance'
      });
    }

    // Clean and validate Indian phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    const formattedNumber = `+91${cleanNumber}`;
    
    // Validate Indian mobile number format (10 digits starting with 6, 7, 8, or 9)
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        phoneNumber: cleanNumber,
        smsType: 'advance'
      });
    }

    // Validate amounts
    const advance = Number(advanceAmount);
    const remaining = Number(remainingAmount);
    
    if (advance < 0 || remaining < 0) {
      return res.status(400).json({
        success: false,
        error: 'Amounts cannot be negative',
        smsType: 'advance'
      });
    }

    if (advance === 0) {
      return res.status(400).json({
        success: false,
        error: 'Advance amount must be greater than zero',
        smsType: 'advance'
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
    
    // Ensure we're using the correct domain
    if (!origin.includes('mittiarts.com') && !origin.includes('localhost') && !origin.includes('vercel.app')) {
      origin = 'https://invoice.mittiarts.com';
    }

    const billLink = billToken && billToken !== 'none' 
      ? `${origin}/public/invoice/${billToken}` 
      : `${origin}`;

    // Create advance payment SMS message for Mitti Arts
    const message = `Dear ${customerName.trim()},

🏺 Advance payment received for Mitti Arts!

Order: ${orderNumber.trim()}
Advance Paid: Rs.${advance.toFixed(2)}
Balance Due: Rs.${remaining.toFixed(2)}

View & Download Invoice:
${billLink}

Thank you for choosing Mitti Arts handcrafted pottery!

Contact: 9441550927
- Mitti Arts Team`;

    console.log('📱 Sending advance SMS to:', `${cleanNumber.slice(0, 5)}*****`);
    console.log('📝 Message length:', message.length, 'characters');
    console.log('💰 Advance:', advance, 'Remaining:', remaining);

    // Validate message length (Fast2SMS limit)
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce to under 1000 characters.',
        messageLength: message.length,
        maxLength: 1000,
        smsType: 'advance'
      });
    }

    // Prepare Fast2SMS API payload (POST method as per official docs)
    const payload = {
      message: message,
      route: 'q', // Quick route (no DLT required)
      numbers: cleanNumber,
      flash: '0'
    };

    // Send SMS via Fast2SMS API (POST method)
    console.log('📡 Calling Fast2SMS API for advance payment...');
    const fast2smsResponse = await fetch(FAST2SMS_URL, {
      method: 'POST',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Fast2SMS Response Status:', fast2smsResponse.status);

    if (!fast2smsResponse.ok) {
      throw new Error(`Fast2SMS API returned status ${fast2smsResponse.status}`);
    }

    const fast2smsData = await fast2smsResponse.json();
    console.log('📊 Fast2SMS Response Data:', fast2smsData);

    // Handle successful Fast2SMS response
    if (fast2smsData.return === true) {
      console.log('✅ Advance payment SMS sent successfully via Fast2SMS');
      
      return res.status(200).json({
        success: true,
        messageId: fast2smsData.request_id,
        message: message,
        smsType: 'advance',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        route: 'Quick SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        cost: 'Rs.5.00 per SMS',
        
        // Advance payment specific data
        paymentDetails: {
          advanceAmount: advance,
          remainingAmount: remaining,
          totalAmount: advance + remaining,
          advancePercentage: ((advance / (advance + remaining)) * 100).toFixed(1)
        },
        
        // Additional Fast2SMS response data
        fast2smsData: {
          requestId: fast2smsData.request_id,
          returnStatus: fast2smsData.return,
          messagesSent: fast2smsData.request_id ? 1 : 0
        }
      });
    } else {
      // Fast2SMS returned error - FIXED: Proper error message handling
      let errorMsg = 'Unknown Fast2SMS API error';
      
      if (fast2smsData.message) {
        if (Array.isArray(fast2smsData.message)) {
          // If message is an array, join all error messages
          errorMsg = fast2smsData.message.join(', ');
        } else {
          // If message is a string
          errorMsg = fast2smsData.message;
        }
      }
      
      console.error('❌ Fast2SMS Advance SMS Error:', errorMsg);
      console.error('❌ Full Fast2SMS Response:', fast2smsData);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        smsType: 'advance',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        fast2smsResponse: fast2smsData,
        
        // Payment context for debugging
        paymentContext: {
          advanceAmount: advance,
          remainingAmount: remaining,
          orderNumber: orderNumber.trim()
        },
        
        troubleshooting: {
          possibleCauses: [
            'Invalid or expired API key',
            'Insufficient Fast2SMS account balance',
            'Invalid phone number format',
            'Message content blocked',
            'API rate limits exceeded'
          ],
          solutions: [
            'Check Fast2SMS account balance',
            'Verify API key is correct and active',
            'Check phone number format',
            'Review message content for prohibited words'
          ],
          checkBalance: 'https://www.fast2sms.com/dashboard',
          documentation: 'https://docs.fast2sms.com'
        }
      });
    }

  } catch (error) {
    console.error('❌ Advance SMS Handler Error:', error);
    
    // Determine error type and appropriate response
    let errorMessage = 'Failed to send advance payment SMS';
    let statusCode = 500;
    let errorCode = 'UNKNOWN';
    
    if (error.message?.includes('fetch')) {
      errorMessage = 'Failed to connect to Fast2SMS. Please check your internet connection.';
      statusCode = 503;
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'SMS request timed out. Please try again.';
      statusCode = 504;
      errorCode = 'TIMEOUT';
    } else if (error.message?.includes('authorization') || error.message?.includes('auth')) {
      errorMessage = 'Fast2SMS authentication failed. Please check API key.';
      statusCode = 401;
      errorCode = 'AUTH_ERROR';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = 'API_ERROR';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      smsType: 'advance',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: formattedNumber || cleanNumber || 'Invalid',
      
      // Payment context for debugging
      paymentContext: {
        advanceAmount: req.body.advanceAmount,
        remainingAmount: req.body.remainingAmount,
        orderNumber: req.body.orderNumber
      },
      
      // Debug information (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        debug: {
          originalError: error.message,
          stack: error.stack,
          requestBody: req.body
        }
      }),
      
      // Helpful troubleshooting information
      troubleshooting: {
        apiStatus: 'https://www.fast2sms.com/dashboard',
        documentation: 'https://docs.fast2sms.com',
        support: 'Check Fast2SMS balance and API key validity'
      }
    });
  }
}