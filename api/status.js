// api/status.js - API status check endpoint
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const FAST2SMS_API_KEY = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    
    return res.status(200).json({
      success: true,
      status: 'Mitti Arts SMS API is running',
      timestamp: new Date().toISOString(),
      endpoints: {
        'send-sms': 'Regular bill SMS',
        'send-advance-sms': 'Advance payment SMS', 
        'send-completion-sms': 'Payment completion SMS',
        'status': 'API status check'
      },
      provider: 'Fast2SMS',
      apiConfigured: !!FAST2SMS_API_KEY,
      version: '1.0.0'
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}