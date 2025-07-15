// api/send-completion-sms.js - Updated with better error handling
import axios from 'axios';

const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

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

    // Validate final amount
    const finalPayment = Number(finalAmount);
    
    if (isNaN(finalPayment) || finalPayment < 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid final amount',
        smsType: 'completion'
      });
    }

    // Validate API key
    if (!FAST2SMS_API_KEY) {
      console.error('❌ Fast2SMS API key not configured');
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

    console.log('📱 Sending completion SMS to:', cleanNumber);
    console.log('📝 Message length:', message.length);

    // Validate message length
    if (message.length > 1600) {
      return res.status(400).json({
        success: false,
        error: 'Message too long. Please reduce message length.',
        smsType: 'completion'
      });
    }

    // Send SMS via Fast2SMS with better error handling
    const smsResponse = await axios.post(FAST2SMS_URL, {
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: cleanNumber
    }, {
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      },
      timeout: 15000,
      validateStatus: function (status) {
        return status < 500; // Don't throw on 4xx errors
      }
    });

    console.log('📊 Fast2SMS Response Status:', smsResponse.status);
    console.log('📊 Fast2SMS Response Data:', smsResponse.data);

    // Handle different response scenarios
    if (smsResponse.status === 200 && smsResponse.data && smsResponse.data.return === true) {
      // Success case
      return res.status(200).json({
        success: true,
        messageId: smsResponse.data.request_id || `msg_${Date.now()}`,
        message: message,
        smsType: 'completion',
        billToken: billToken || null,
        billLink: billLink,
        provider: 'Fast2SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: cleanNumber,
        cost: smsResponse.data.cost || 0,
        smsCount: Math.ceil(message.length / 160),
        finalAmount: finalPayment
      });
    } else {
      // Fast2SMS returned an error
      const errorMsg = smsResponse.data?.message || smsResponse.data?.error || 'Unknown SMS API error';
      console.error('❌ Fast2SMS Error:', errorMsg);
      
      return res.status(422).json({
        success: false,
        error: `SMS API Error: ${errorMsg}`,
        smsType: 'completion',
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: cleanNumber,
        apiResponse: smsResponse.data
      });
    }

  } catch (error) {
    console.error('❌ Completion SMS Handler Error:', error);
    
    let errorMessage = 'Failed to send completion SMS';
    let statusCode = 500;
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'SMS request timed out. Please try again.';
      statusCode = 408;
    } else if (error.response?.status === 401) {
      errorMessage = 'SMS API authentication failed. Invalid API key.';
      statusCode = 401;
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Invalid SMS request data';
      statusCode = 400;
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many SMS requests. Please wait and try again.';
      statusCode = 429;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
      statusCode = error.response.status || 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      smsType: 'completion',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: cleanPhoneNumber(req.body?.phoneNumber || ''),
      errorCode: error.response?.status || 'UNKNOWN',
      ...(process.env.NODE_ENV === 'development' && { 
        debug: {
          originalError: error.message,
          stack: error.stack
        }
      })
    });
  }
}