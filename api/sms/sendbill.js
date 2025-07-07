// 5. api/sms/send-bill.js
// =============================================================================

import { withCors } from '../utils/cors.js';
import { sendSMS, formatMessage } from '../utils/fast2sms.js';
import { validateRequiredFields, validatePhoneNumber, generateBillToken } from '../utils/validation.js';
import { SMS_TEMPLATES } from '../config/constants.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      phoneNumber,
      customerName,
      orderNumber,
      totalAmount,
      billToken
    } = req.body;

    // Validate required fields
    const missingFields = validateRequiredFields(req.body, [
      'phoneNumber', 'customerName', 'orderNumber', 'totalAmount'
    ]);

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        missingFields
      });
    }

    // Validate phone number
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Generate bill token if not provided
    const token = billToken || generateBillToken();
    
    // Create bill link
    const billLink = `${process.env.FRONTEND_URL || 'https://mittiarts.vercel.app'}/public/bill/${token}`;

    // Format message
    const message = formatMessage(SMS_TEMPLATES.BILL.template, {
      customerName,
      orderNumber,
      totalAmount: parseFloat(totalAmount).toFixed(2),
      billLink
    });

    // Send SMS
    const result = await sendSMS(phoneNumber, message);

    // Return result
    res.status(result.success ? 200 : 400).json({
      ...result,
      billToken: token,
      billLink: billLink
    });

  } catch (error) {
    console.error('Send Bill SMS Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
}

export default withCors(handler);