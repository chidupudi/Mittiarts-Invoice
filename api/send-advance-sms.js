// api/send-advance-sms.js - Simplified Fast2SMS Implementation for Advance Payments
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
      smsType: 'advance'
    });
  }

  try {
    console.log('📱 Fast2SMS Advance Payment SMS Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      advanceAmount,
      remainingAmount,
      billToken 
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber',
        smsType: 'advance'
      });
    }

    if (advanceAmount === undefined || advanceAmount === null || isNaN(advanceAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid advance amount is required',
        smsType: 'advance'
      });
    }

    if (remainingAmount === undefined || remainingAmount === null || isNaN(remainingAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid remaining amount is required',
        smsType: 'advance'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        smsType: 'advance'
      });
    }

    // Validate amounts
    const advance = Number(advanceAmount);
    const remaining = Number(remainingAmount);
    
    if (advance <= 0) {
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
    
    const billLink = billToken && billToken !== 'none' 
      ? `${origin}/public/invoice/${billToken}` 
      : `${origin}`;

    // Create advance payment SMS message
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

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce to under 1000 characters.',
        messageLength: message.length,
        smsType: 'advance'
      });
    }

    // Fast2SMS API Configuration
    const API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    const API_URL = 'https://www.fast2sms.com/dev/bulkV2';

    // Prepare POST request payload
    const payload = {
      message: message,
      route: 'q', // Quick route
      numbers: cleanNumber,
      flash: '0'
    };

    console.log('📡 Calling Fast2SMS API for advance payment...');

    // Send SMS via Fast2SMS API
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'authorization': API_KEY,
        'Content-Type': 'application/json',
        'cache-control': 'no-cache'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Fast2SMS Response Status:', response.status);

    if (!response.ok) {
      throw new Error(`Fast2SMS API returned status ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 Fast2SMS Response Data:', data);

    // Handle successful Fast2SMS response
    if (data.return === true) {
      console.log('✅ Advance payment SMS sent successfully via Fast2SMS');
      
      return res.status(200).json({
        success: true,
        messageId: data.request_id,
        message: 'Advance payment SMS sent successfully',
        smsType: 'advance',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        route: 'Quick SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        cost: '₹0.25 per SMS',
        
        // Advance payment specific data
        paymentDetails: {
          advanceAmount: advance,
          remainingAmount: remaining,
          totalAmount: advance + remaining,
          advancePercentage: ((advance / (advance + remaining)) * 100).toFixed(1)
        },
        
        // Additional Fast2SMS response data
        fast2smsData: {
          requestId: data.request_id,
          returnStatus: data.return
        }
      });
    } else {
      // Fast2SMS returned error
      let errorMsg = 'Unknown Fast2SMS API error';
      
      if (data.message) {
        if (Array.isArray(data.message)) {
          errorMsg = data.message.join(', ');
        } else {
          errorMsg = data.message;
        }
      }
      
      console.error('❌ Fast2SMS Advance SMS Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        smsType: 'advance',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        fast2smsResponse: data,
        
        paymentContext: {
          advanceAmount: advance,
          remainingAmount: remaining,
          orderNumber: orderNumber.trim()
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
      errorMessage = 'Failed to connect to Fast2SMS. Please check internet connection.';
      statusCode = 503;
      errorCode = 'NETWORK_ERROR';
    } else if (error.message?.includes('timeout')) {
      errorMessage = 'SMS request timed out. Please try again.';
      statusCode = 504;
      errorCode = 'TIMEOUT';
    } else if (error.message?.includes('authorization')) {
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
      
      paymentContext: {
        advanceAmount: req.body.advanceAmount,
        remainingAmount: req.body.remainingAmount,
        orderNumber: req.body.orderNumber
      }
    });
  }
}