// api/send-sms.js - Simplified Fast2SMS Implementation for Mitti Arts
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
      error: 'Method not allowed. Use POST method.' 
    });
  }

  try {
    console.log('📱 Fast2SMS Request received:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { phoneNumber, customerName, orderNumber, billToken, totalAmount } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.'
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

    // Create message for Mitti Arts
    const message = `Dear ${customerName.trim()},

🏺 Thank you for choosing Mitti Arts!

Order: ${orderNumber.trim()}
Amount: Rs.${(totalAmount || 0).toFixed(2)}

View & Download Invoice:
${billLink}

Contact: 9441550927
- Mitti Arts Team`;

    console.log('📝 Message length:', message.length, 'characters');
    console.log('📞 Target number:', `${cleanNumber.slice(0, 5)}*****`);

    // Validate message length
    if (message.length > 1000) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce to under 1000 characters.',
        messageLength: message.length
      });
    }

    // Fast2SMS API Configuration
    const API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    const API_URL = 'https://www.fast2sms.com/dev/bulkV2';

    // Prepare POST request payload
    const payload = {
      message: message,
      route: 'q',  // Quick SMS route
      numbers: cleanNumber,
      flash: '0'
    };

    console.log('📡 Calling Fast2SMS API...');

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

    // Handle Fast2SMS response
    if (data.return === true) {
      console.log('✅ SMS sent successfully via Fast2SMS');
      
      return res.status(200).json({
        success: true,
        messageId: data.request_id,
        message: 'SMS sent successfully',
        provider: 'Fast2SMS',
        route: 'Quick SMS',
        cost: '₹0.25 per SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        billLink: billLink,
        
        // Additional response data
        fast2smsData: {
          requestId: data.request_id,
          returnStatus: data.return
        }
      });
    } else {
      // Handle Fast2SMS error response
      let errorMsg = 'Unknown Fast2SMS API error';
      
      if (data.message) {
        if (Array.isArray(data.message)) {
          errorMsg = data.message.join(', ');
        } else {
          errorMsg = data.message;
        }
      }
      
      console.error('❌ Fast2SMS Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Fast2SMS API Error: ${errorMsg}`,
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        fast2smsResponse: data
      });
    }

  } catch (error) {
    console.error('❌ SMS Handler Error:', error);
    
    // Determine error type and provide appropriate response
    let errorMessage = 'Failed to send SMS';
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
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString()
    });
  }
}