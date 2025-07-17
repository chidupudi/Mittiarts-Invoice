// api/send-completion-sms.js - Fast2SMS Implementation for Mitti Arts Payment Completion
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
      smsType: 'completion'
    });
  }

  // Initialize variables
  let cleanNumber = '';
  let formattedNumber = '';

  try {
    console.log('📱 Fast2SMS Payment Completion SMS Request:', {
      method: req.method,
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    // Fast2SMS API Configuration
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    const FAST2SMS_ROUTE = 'q'; // Quick route (non-DLT)
    const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

    // Extract and validate request data
    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      finalAmount,
      billToken 
    } = req.body;

    // Validate required fields
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Phone number is required',
        field: 'phoneNumber',
        smsType: 'completion'
      });
    }

    if (!customerName || customerName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Customer name is required',
        field: 'customerName',
        smsType: 'completion'
      });
    }

    if (!orderNumber || orderNumber.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Order number is required',
        field: 'orderNumber',
        smsType: 'completion'
      });
    }

    if (finalAmount === undefined || finalAmount === null || isNaN(finalAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid final payment amount is required',
        field: 'finalAmount',
        smsType: 'completion'
      });
    }

    // Clean and validate Indian phone number
    cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    formattedNumber = `+91${cleanNumber}`;
    
    // Validate Indian mobile number format (10 digits starting with 6, 7, 8, or 9)
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        phoneNumber: cleanNumber,
        smsType: 'completion'
      });
    }

    // Validate final amount
    const finalPayment = Number(finalAmount);
    
    if (finalPayment < 0) {
      return res.status(400).json({
        success: false,
        error: 'Final payment amount cannot be negative',
        smsType: 'completion'
      });
    }

    if (finalPayment === 0) {
      return res.status(400).json({
        success: false,
        error: 'Final payment amount must be greater than zero',
        smsType: 'completion'
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

    // Create payment completion SMS message for Mitti Arts pottery business
    const message = `Dear ${customerName.trim()},

🎉 Payment completed for Mitti Arts order!

Order: ${orderNumber.trim()}
Final Payment: Rs.${finalPayment.toFixed(2)}
Status: PAID IN FULL ✅

Download Final Invoice:
${billLink}

Thank you for choosing Mitti Arts handcrafted pottery! Your order is ready for delivery/pickup.

Contact: 9441550927
- Mitti Arts Team`;

    console.log('📱 Sending completion SMS to:', `${cleanNumber.slice(0, 5)}*****`);
    console.log('📝 Message length:', message.length, 'characters');
    console.log('💰 Final payment:', finalPayment);

    // Validate message length (Fast2SMS limit)
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce to under 1000 characters.',
        messageLength: message.length,
        maxLength: 1000,
        smsType: 'completion'
      });
    }

    // Prepare Fast2SMS API parameters (GET method)
    const smsParams = new URLSearchParams({
      authorization: FAST2SMS_API_KEY,
      message: message,
      route: FAST2SMS_ROUTE,
      numbers: cleanNumber,
      flash: '0'
    });

    // Send SMS via Fast2SMS API
    console.log('📡 Calling Fast2SMS API for payment completion...');
    const fast2smsResponse = await fetch(`${FAST2SMS_URL}?${smsParams.toString()}`, {
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
        'User-Agent': 'Mitti-Arts-POS/1.0'
      }
    });

    console.log('📊 Fast2SMS Response Status:', fast2smsResponse.status);

    if (!fast2smsResponse.ok) {
      throw new Error(`Fast2SMS API returned status ${fast2smsResponse.status}`);
    }

    const fast2smsData = await fast2smsResponse.json();
    console.log('📊 Fast2SMS Response Data:', fast2smsData);

    // Handle successful Fast2SMS response
    if (fast2smsData.return === true) {
      console.log('✅ Payment completion SMS sent successfully via Fast2SMS');
      
      return res.status(200).json({
        success: true,
        messageId: fast2smsData.request_id,
        message: message,
        smsType: 'completion',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        route: FAST2SMS_ROUTE,
        sentAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        cost: 'Rs.0.25-0.50 per SMS',
        
        // Payment completion specific data
        completionDetails: {
          finalAmount: finalPayment,
          orderNumber: orderNumber.trim(),
          paymentStatus: 'COMPLETED',
          completionTime: new Date().toISOString(),
          invoiceGenerated: !!billToken
        },
        
        // Additional Fast2SMS response data
        fast2smsData: {
          requestId: fast2smsData.request_id,
          returnStatus: fast2smsData.return,
          messagesSent: fast2smsData.request_id ? 1 : 0
        }
      });
    } else {
      // Fast2SMS returned error
      const errorMsg = fast2smsData.message?.[0] || 
                      fast2smsData.message || 
                      'Unknown Fast2SMS API error';
      
      console.error('❌ Fast2SMS Completion SMS Error:', errorMsg);
      console.error('❌ Full Fast2SMS Response:', fast2smsData);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        smsType: 'completion',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: formattedNumber,
        fast2smsResponse: fast2smsData,
        
        // Payment context for debugging
        completionContext: {
          finalAmount: finalPayment,
          orderNumber: orderNumber.trim(),
          billToken: billToken || null
        },
        
        troubleshooting: {
          possibleCauses: [
            'Invalid API key',
            'Insufficient Fast2SMS balance',
            'Invalid phone number',
            'Route not active',
            'Message content blocked'
          ],
          checkBalance: 'https://www.fast2sms.com/dashboard',
          documentation: 'https://www.fast2sms.com/docs'
        }
      });
    }

  } catch (error) {
    console.error('❌ Completion SMS Handler Error:', error);
    
    // Determine error type and appropriate response
    let errorMessage = 'Failed to send payment completion SMS';
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
      smsType: 'completion',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: formattedNumber || cleanNumber || 'Invalid',
      
      // Payment context for debugging
      completionContext: {
        finalAmount: req.body.finalAmount,
        orderNumber: req.body.orderNumber,
        billToken: req.body.billToken
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
        documentation: 'https://www.fast2sms.com/docs',
        support: 'Check Fast2SMS balance and API key validity'
      }
    });
  }
}