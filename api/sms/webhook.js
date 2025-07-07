// 8. api/sms/webhook.js
// =============================================================================

import { withCors } from '../utils/cors.js';

async function webhookHandler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const webhookData = req.body;
    
    console.log('SMS Webhook received:', JSON.stringify(webhookData, null, 2));

    // Fast2SMS webhook structure (customize based on their documentation)
    const {
      request_id,
      mobile,
      status,
      delivered_at,
      message_id
    } = webhookData;

    // Log webhook data for debugging
    console.log('SMS Status Update:', {
      requestId: request_id,
      mobile: mobile,
      status: status,
      deliveredAt: delivered_at,
      messageId: message_id
    });

    // Here you can update your database with delivery status
    // For now, we'll just log it
    
    // Example Firebase update (uncomment if needed):
    /*
    if (request_id) {
      try {
        // Update order SMS delivery status in Firebase
        const orders = await firebaseService.getAll('orders', {
          where: [{ 
            field: 'smsDelivery.messageId', 
            operator: '==', 
            value: request_id 
          }]
        });
        
        if (orders.length > 0) {
          await firebaseService.update('orders', orders[0].id, {
            'smsDelivery.deliveryStatus': status,
            'smsDelivery.deliveredAt': delivered_at ? new Date(delivered_at) : new Date(),
            'smsDelivery.webhookReceivedAt': new Date()
          });
        }
      } catch (error) {
        console.error('Failed to update SMS delivery status:', error);
      }
    }
    */

    // Respond to Fast2SMS
    res.status(200).json({
      success: true,
      message: 'Webhook received successfully',
      processed: true
    });

  } catch (error) {
    console.error('SMS Webhook Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withCors(webhookHandler);
