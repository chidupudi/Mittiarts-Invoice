// 9. api/sms/status.js
// =============================================================================

import { withCors } from '../utils/cors.js';

async function statusHandler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { messageId } = req.query;

    if (!messageId) {
      return res.status(400).json({
        success: false,
        error: 'Message ID is required'
      });
    }

    // Here you would typically check the SMS status with Fast2SMS
    // For now, return a mock response
    
    res.status(200).json({
      success: true,
      messageId: messageId,
      status: 'delivered', // delivered, pending, failed
      sentAt: new Date().toISOString(),
      deliveredAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('SMS Status Check Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withCors(statusHandler);