// src/services/smsService.js - Updated with enhanced error handling and better templates
import axios from 'axios';

class SMSService {
  constructor() {
    this.apiKey = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    this.baseURL = 'https://www.fast2sms.com/dev/bulkV2';
    this.timeout = 15000; // 15 seconds timeout
  }

  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    try {
      // Remove any country code and ensure it's a 10-digit number
      const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      // Generate the shareable bill link
      const billLink = `${window.location.origin}/public/bill/${billToken}`;
      
      // Create the SMS message with better formatting
      const message = `🏺 Dear ${customerName},

Thank you for your purchase at Mitti Arts!

Order: ${orderNumber}
Amount: ₹${totalAmount.toFixed(2)}

View your bill: ${billLink}

We appreciate your business!
- Mitti Arts Team`;

      // Send SMS via Fast2SMS
      const result = await this._sendSMS(cleanNumber, message);
      
      if (result.success) {
        console.log('Bill SMS sent successfully:', result);
        return {
          success: true,
          messageId: result.messageId,
          message: 'Bill SMS sent successfully',
          smsType: 'bill',
          billToken: billToken,
          billLink: billLink
        };
      } else {
        throw new Error(result.error || 'Failed to send bill SMS');
      }
    } catch (error) {
      console.error('Bill SMS sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bill SMS',
        smsType: 'bill'
      };
    }
  }

  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      const billLink = `${window.location.origin}/public/bill/${billToken}`;
      
      // Enhanced advance payment message
      const message = `🏺 Dear ${customerName},

Advance payment received for Mitti Arts!

Order: ${orderNumber}
Advance Paid: ₹${advanceAmount.toFixed(2)}
Balance Due: ₹${remainingAmount.toFixed(2)}

View bill: ${billLink}

Thank you for choosing Mitti Arts!
- Team Mitti Arts`;

      const result = await this._sendSMS(cleanNumber, message);

      if (result.success) {
        console.log('Advance payment SMS sent successfully:', result);
        return {
          success: true,
          messageId: result.messageId,
          message: 'Advance payment SMS sent successfully',
          smsType: 'advance',
          billToken: billToken,
          billLink: billLink
        };
      } else {
        throw new Error(result.error || 'Failed to send advance payment SMS');
      }
    } catch (error) {
      console.error('Advance payment SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send advance payment SMS',
        smsType: 'advance'
      };
    }
  }

  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      const billLink = `${window.location.origin}/public/bill/${billToken}`;
      
      // Enhanced completion message with celebratory tone
      const message = `🏺 Dear ${customerName},

🎉 Payment completed for Mitti Arts order!

Order: ${orderNumber}
Final Payment: ₹${finalAmount.toFixed(2)}
Status: PAID IN FULL ✅

Final bill: ${billLink}

Thank you for your business!
- Mitti Arts Team`;

      const result = await this._sendSMS(cleanNumber, message);

      if (result.success) {
        console.log('Payment completion SMS sent successfully:', result);
        return {
          success: true,
          messageId: result.messageId,
          message: 'Payment completion SMS sent successfully',
          smsType: 'completion',
          billToken: billToken,
          billLink: billLink
        };
      } else {
        throw new Error(result.error || 'Failed to send payment completion SMS');
      }
    } catch (error) {
      console.error('Payment completion SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send payment completion SMS',
        smsType: 'completion'
      };
    }
  }

  // 🆕 NEW: Send reminder SMS for pending advance payments
  async sendAdvanceReminderSMS(phoneNumber, customerName, orderNumber, remainingAmount, daysOverdue = 0) {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      const overdueText = daysOverdue > 0 ? `(${daysOverdue} days overdue)` : '';
      
      const message = `🏺 Dear ${customerName},

Reminder: Pending payment for Mitti Arts order

Order: ${orderNumber}
Pending Amount: ₹${remainingAmount.toFixed(2)} ${overdueText}

Please complete your payment at your earliest convenience.

Contact us: 9441550927
- Mitti Arts Team`;

      const result = await this._sendSMS(cleanNumber, message);

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: 'Reminder SMS sent successfully',
          smsType: 'reminder'
        };
      } else {
        throw new Error(result.error || 'Failed to send reminder SMS');
      }
    } catch (error) {
      console.error('Reminder SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reminder SMS',
        smsType: 'reminder'
      };
    }
  }

  // 🆕 NEW: Send custom SMS
  async sendCustomSMS(phoneNumber, message) {
    try {
      const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
      
      if (cleanNumber.length !== 10) {
        throw new Error('Invalid phone number format');
      }

      const result = await this._sendSMS(cleanNumber, message);

      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          message: 'Custom SMS sent successfully',
          smsType: 'custom'
        };
      } else {
        throw new Error(result.error || 'Failed to send custom SMS');
      }
    } catch (error) {
      console.error('Custom SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send custom SMS',
        smsType: 'custom'
      };
    }
  }

  // Core SMS sending method with enhanced error handling
  async _sendSMS(phoneNumber, message) {
    try {
      console.log('📱 Sending SMS to:', phoneNumber);
      console.log('📝 Message length:', message.length, 'characters');
      
      if (!this.apiKey) {
        throw new Error('Fast2SMS API key not configured');
      }

      if (!phoneNumber || !message) {
        throw new Error('Phone number and message are required');
      }

      if (message.length > 1600) {
        throw new Error('Message too long. Maximum 1600 characters allowed.');
      }

      // Fast2SMS API request with enhanced configuration
      const response = await axios.post(this.baseURL, {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: phoneNumber
      }, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: this.timeout,
        validateStatus: function (status) {
          return status >= 200 && status < 300; // Default
        }
      });

      console.log('📊 Fast2SMS Response:', response.data);

      if (response.data && response.data.return === true) {
        return {
          success: true,
          messageId: response.data.request_id,
          message: response.data.message || 'SMS sent successfully',
          provider: 'Fast2SMS',
          sentAt: new Date().toISOString(),
          phoneNumber: phoneNumber,
          cost: response.data.cost || 0
        };
      } else {
        throw new Error(response.data?.message || 'Unknown error from Fast2SMS API');
      }
    } catch (error) {
      console.error('❌ Fast2SMS Error:', error.response?.data || error.message);
      
      // Enhanced error handling with specific error messages
      let errorMessage = 'Failed to send SMS';
      
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
      
      return {
        success: false,
        error: errorMessage,
        provider: 'Fast2SMS',
        attemptedAt: new Date().toISOString(),
        phoneNumber: phoneNumber,
        errorCode: error.response?.status || 'UNKNOWN'
      };
    }
  }

  // Generate a secure, complex token for bill sharing
  generateBillToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 15);
    const extraRandom = Math.random().toString(36).substr(2, 10);
    return `mitti_${timestamp}_${randomPart}_${extraRandom}`.toUpperCase();
  }

  // Validate phone number
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  // Clean phone number for display
  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
    }
    return phoneNumber;
  }

  // Get SMS character count and cost estimation
  getMessageInfo(message) {
    const length = message.length;
    const smsCount = Math.ceil(length / 160);
    const estimatedCost = smsCount * 0.50; // Estimated cost per SMS in INR
    
    return {
      length,
      smsCount,
      estimatedCost: estimatedCost.toFixed(2),
      isLong: length > 160
    };
  }

  // Batch SMS sending (useful for marketing/reminders)
  async sendBatchSMS(phoneNumbers, message, delayBetweenSMS = 1000) {
    const results = [];
    
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i];
      
      try {
        const result = await this.sendCustomSMS(phoneNumber, message);
        results.push({
          phoneNumber,
          ...result
        });
        
        // Add delay between SMS to avoid rate limiting
        if (i < phoneNumbers.length - 1 && delayBetweenSMS > 0) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenSMS));
        }
      } catch (error) {
        results.push({
          phoneNumber,
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    return {
      total: phoneNumbers.length,
      successful,
      failed,
      results
    };
  }

  // Check API balance (mock function - implement if Fast2SMS provides this)
  async checkBalance() {
    try {
      // This would require Fast2SMS balance check API if available
      console.log('Balance check not implemented in Fast2SMS API');
      return {
        success: false,
        message: 'Balance check not available'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default new SMSService();