// api/send-completion-sms.js - Zoko WhatsApp Implementation for Payment Completion Messages
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
      smsType: 'completion',
      provider: 'Zoko WhatsApp'
    });
  }

  try {
    console.log('📱 Zoko WhatsApp Payment Completion Message Request:', {
      bodyKeys: Object.keys(req.body || {}),
      timestamp: new Date().toISOString()
    });

    const { 
      phoneNumber, 
      customerName, 
      orderNumber, 
      finalAmount,
      billToken 
    } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: phoneNumber, customerName, orderNumber',
        smsType: 'completion',
        provider: 'Zoko WhatsApp'
      });
    }

    if (finalAmount === undefined || finalAmount === null || isNaN(finalAmount)) {
      return res.status(400).json({
        success: false,
        error: 'Valid final payment amount is required',
        smsType: 'completion',
        provider: 'Zoko WhatsApp'
      });
    }

    // Clean and validate phone number
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Indian mobile number. Must be 10 digits starting with 6, 7, 8, or 9.',
        smsType: 'completion',
        provider: 'Zoko WhatsApp'
      });
    }

    // Format for WhatsApp (with country code)
    const whatsappNumber = `91${cleanNumber}`;

    // Validate final amount
    const finalPayment = Number(finalAmount);
    
    if (finalPayment <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Final payment amount must be greater than zero',
        smsType: 'completion',
        provider: 'Zoko WhatsApp'
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

    // Create payment completion WhatsApp message for pottery business
    const message = `🎉 *Mitti Arts - Payment Completed!*

Dear ${customerName.trim()},

Congratulations! Your payment has been completed successfully. 💰✅

*Order Details:*
📋 Order: ${orderNumber.trim()}
💰 Final Payment: *₹${finalPayment.toFixed(2)}*
✅ Status: *PAID IN FULL*

*Download Final Invoice:*
${billLink}

🏺 *Your handcrafted pottery order is ready for pickup/delivery!*

*Next Steps:*
🎯 Your pottery masterpiece is ready
📦 Please collect at your convenience
🕒 Store timings: 9 AM - 8 PM
📝 Bring this message for reference

*Collection Details:*
🏪 *Mitti Arts Showroom*
📍 Opp. Romoji Film City, Main Gate
📍 Near Maisamma Temple, Hyderabad
📞 Call before visit: 9441550927 / 7382150250

*Care Instructions:*
💧 Handle pottery with care
🌿 Eco-friendly - made with love
🎨 Perfect for home decoration

Thank you for choosing Mitti Arts and supporting traditional Indian pottery craftsmanship! 🙏

*Share Your Experience:*
📸 Tag us in your pottery photos
⭐ Leave a review to help others
🔄 Recommend us to friends & family

*Mitti Arts Team*
_Handcrafted with Love 🎨_

*Visit again for more beautiful pottery creations!* 🏺`;

    console.log('📱 Sending completion WhatsApp message to:', `${cleanNumber.slice(0, 5)}*****`);
    console.log('📝 Message length:', message.length, 'characters');
    console.log('💰 Final payment:', finalPayment);

    // Validate message length for WhatsApp
    if (message.length > 4096) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. WhatsApp limit is 4096 characters.',
        messageLength: message.length,
        smsType: 'completion',
        provider: 'Zoko WhatsApp'
      });
    }

    // Zoko WhatsApp API Configuration
    const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    const ZOKO_API_URL = 'https://api.zoko.io/v2/message/send';

    // Prepare WhatsApp message payload for Zoko
    const payload = {
      channel: 'whatsapp',
      recipient: whatsappNumber,
      type: 'text',
      message: {
        text: message
      }
    };

    console.log('📡 Calling Zoko WhatsApp API for payment completion...');

    // Send WhatsApp message via Zoko API
    const response = await fetch(ZOKO_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ZOKO_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('📊 Zoko Response Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Zoko API Error Response:', errorText);
      throw new Error(`Zoko WhatsApp API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📊 Zoko Response Data:', data);

    // Handle successful Zoko response
    if (data.success || data.id || data.message_id) {
      console.log('✅ Payment completion WhatsApp message sent successfully via Zoko');
      
      return res.status(200).json({
        success: true,
        messageId: data.id || data.message_id || data.request_id,
        message: 'Payment completion WhatsApp message sent successfully',
        smsType: 'completion',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Zoko WhatsApp',
        channel: 'WhatsApp',
        sentAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        whatsappNumber: whatsappNumber,
        cost: 'Per message pricing',
        
        // Payment completion specific data
        completionDetails: {
          finalAmount: finalPayment,
          orderNumber: orderNumber.trim(),
          paymentStatus: 'COMPLETED',
          completionTime: new Date().toISOString(),
          invoiceGenerated: !!billToken,
          customerName: customerName.trim(),
          readyForPickup: true
        },
        
        // WhatsApp specific data
        whatsappData: {
          messageId: data.id || data.message_id,
          status: data.status || 'sent',
          recipient: whatsappNumber,
          messageType: 'text',
          characters: message.length
        },

        // Store information for customer
        storeInfo: {
          name: 'Mitti Arts Showroom',
          address: 'Opp. Romoji Film City, Main Gate, Near Maisamma Temple, Hyderabad',
          phone: '9441550927 / 7382150250',
          timings: '9 AM - 8 PM',
          email: 'info@mittiarts.com'
        }
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
      
      console.error('❌ Zoko WhatsApp Completion Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `Zoko WhatsApp API Error: ${errorMsg}`,
        smsType: 'completion',
        provider: 'Zoko WhatsApp',
        channel: 'WhatsApp',
        attemptedAt: new Date().toISOString(),
        phoneNumber: `+91${cleanNumber}`,
        whatsappNumber: whatsappNumber,
        zokoResponse: data,
        
        completionContext: {
          finalAmount: finalPayment,
          orderNumber: orderNumber.trim(),
          billToken: billToken || null
        }
      });
    }

  } catch (error) {
    console.error('❌ Completion WhatsApp Handler Error:', error);
    
    // Determine error type and appropriate response
    let errorMessage = 'Failed to send payment completion WhatsApp message';
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
    } else if (error.message?.includes('400')) {
      errorMessage = 'Bad request to Zoko WhatsApp API. Please check message format.';
      statusCode = 400;
      errorCode = 'BAD_REQUEST';
    } else if (error.message?.includes('422')) {
      errorMessage = 'Unprocessable entity. Message content may be invalid.';
      statusCode = 422;
      errorCode = 'UNPROCESSABLE_ENTITY';
    } else if (error.message?.includes('500')) {
      errorMessage = 'Zoko WhatsApp API internal server error. Please try again later.';
      statusCode = 502;
      errorCode = 'UPSTREAM_ERROR';
    } else if (error.message) {
      errorMessage = error.message;
      errorCode = 'API_ERROR';
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      errorCode: errorCode,
      smsType: 'completion',
      provider: 'Zoko WhatsApp',
      channel: 'WhatsApp',
      attemptedAt: new Date().toISOString(),
      
      completionContext: {
        finalAmount: req.body.finalAmount,
        orderNumber: req.body.orderNumber,
        billToken: req.body.billToken
      },

      // Troubleshooting guide
      troubleshooting: {
        possibleCauses: [
          'Invalid Zoko API key',
          'Network connectivity issues',
          'Invalid phone number format',
          'Message content violates WhatsApp policies',
          'Rate limiting exceeded',
          'Zoko service temporarily unavailable'
        ],
        recommendations: [
          'Verify Zoko API key is correct',
          'Check internet connection',
          'Ensure phone number is valid Indian mobile number',
          'Review message content for policy compliance',
          'Wait before retrying if rate limited',
          'Contact Zoko support if persistent issues'
        ],
        support: {
          mittiArts: 'info@mittiarts.com',
          zoko: 'https://zoko.io/support'
        }
      }
    });
  }
}