// api/send-sms.js - Fixed Fast2SMS for Mitti Arts
export default async function handler(req, res) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    console.log('📱 SMS Request received:', req.body);

    const { phoneNumber, customerName, orderNumber, billToken, totalAmount } = req.body;

    // Basic validation
    if (!phoneNumber || !customerName || !orderNumber) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Clean phone number (remove +91, keep only digits)
    const cleanNumber = phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number'
      });
    }

    // Create simple message
    const message = `Dear ${customerName}, Thank you for Mitti Arts order ${orderNumber}. Amount Rs.${(totalAmount || 0).toFixed(2)}. Thank you!`;

    // Fast2SMS API call (GET method) - FIXED: Complete API key
    const apiKey = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    
    const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&message=${encodeURIComponent(message)}&route=q&numbers=${cleanNumber}&flash=0`;
    
    console.log('📞 Calling Fast2SMS...');
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'cache-control': 'no-cache'
      }
    });

    const data = await response.json();
    console.log('📊 Fast2SMS Response:', data);

    if (data.return === true) {
      return res.status(200).json({
        success: true,
        messageId: data.request_id,
        message: 'SMS sent successfully',
        provider: 'Fast2SMS'
      });
    } else {
      // FIXED: Proper error message handling
      const errorMsg = data.message?.[0] || data.message || 'SMS failed';
      
      return res.status(422).json({
        success: false,
        error: errorMsg,
        provider: 'Fast2SMS',
        fast2smsResponse: data
      });
    }

  } catch (error) {
    console.error('❌ SMS Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'SMS service failed',
      details: error.message
    });
  }
}