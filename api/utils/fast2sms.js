// 4. api/utils/fast2sms.js
// =============================================================================

import axios from 'axios';

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY || 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
const FAST2SMS_BASE_URL = 'https://www.fast2sms.com/dev/bulkV2';

export async function sendSMS(phoneNumber, message) {
  try {
    console.log('Sending SMS to:', phoneNumber);
    console.log('Message length:', message.length);
    
    if (!FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key not configured');
    }

    if (!phoneNumber || !message) {
      throw new Error('Phone number and message are required');
    }

    // Validate and clean phone number
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    
    if (!/^[6-9]\d{9}$/.test(cleanNumber)) {
      throw new Error('Invalid Indian mobile number format');
    }

    // Fast2SMS API request
    const response = await axios.post(FAST2SMS_BASE_URL, {
      route: 'q',
      message: message,
      language: 'english',
      flash: 0,
      numbers: cleanNumber
    }, {
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 seconds timeout
    });

    console.log('Fast2SMS Response:', response.data);

    if (response.data && response.data.return === true) {
      return {
        success: true,
        messageId: response.data.request_id,
        message: 'SMS sent successfully',
        provider: 'Fast2SMS',
        sentAt: new Date().toISOString(),
        phoneNumber: cleanNumber
      };
    } else {
      throw new Error(response.data?.message || 'Unknown error from Fast2SMS');
    }
  } catch (error) {
    console.error('Fast2SMS Error:', error.response?.data || error.message);
    
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to send SMS',
      provider: 'Fast2SMS',
      attemptedAt: new Date().toISOString(),
      phoneNumber: phoneNumber
    };
  }
}

export function formatMessage(template, variables) {
  let message = template;
  
  Object.keys(variables).forEach(key => {
    const placeholder = `{${key}}`;
    message = message.replace(new RegExp(placeholder, 'g'), variables[key] || '');
  });
  
  return message;
}
