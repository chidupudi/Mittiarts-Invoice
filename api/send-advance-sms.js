// api/send-advance-sms.js - Vercel API endpoint for advance payment SMS
import axios from 'axios';

const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken } = req.body;

    // Validate required fields
    if (!phoneNumber || !customerName || !orderNumber || !advanceAmount || !remainingAmount || !billToken) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Clean phone number
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    
    if (cleanNumber.length !== 10) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Get the origin from headers or use fallback
    const origin = req.headers.origin || req.headers.referer || 'https://your-app.vercel.app';
    const billLink = `${origin}/public/invoice/${billToken}`;

    // Create advance payment SMS message
    const message = `🏺 Dear ${customerName},

Advance payment received for Mitti Arts!

Order: ${orderNumber}
Advance Paid: ₹${advanceAmount.toFixed(2)}
Balance Due: ₹${remainingAmount.toFixed(2)}

View & Download Invoice: ${billLink}

Thank you for choosing Mitti Arts!
- Team Mitti Arts`;

    console.log('📱 Sending advance SMS to:', cleanNumber);
    console.log('📝 Message length:', message.length);

    // Send SMS via Fast2SMS
    const response = await axios.post(FAST2SMS_URL, {
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
      timeout: 15000
    });

    console.log('📊 Fast2SMS Response:', response.data);

    if (response.data && response.data.return === true) {
      return res.status(200).json({
        success: true,
        messageId: response.data.request_id,
        message: message,
        smsType: 'advance',
        billToken: billToken,
        billLink: billLink,
        provider: 'Fast2SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: cleanNumber,
        cost: response.data.cost || 0
      });
    } else {
      throw new Error(response.data?.message || 'Unknown error from Fast2SMS API');
    }

  } catch (error) {
    console.error('❌ Advance SMS Error:', error.response?.data || error.message);
    
    let errorMessage = 'Failed to send advance SMS';
    
    if (error.code === 'ECONNABORTED') {
      errorMessage = 'SMS request timed out. Please try again.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Invalid API key. Please check your Fast2SMS configuration.';
    } else if (error.response?.status === 400) {
      errorMessage = error.response.data?.message || 'Invalid request data';
    } else if (error.response?.status === 429) {
      errorMessage = 'Too many SMS requests. Please wait and try again.';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: cleanNumber,
      errorCode: error.response?.status || 'UNKNOWN'
    });
  }
}