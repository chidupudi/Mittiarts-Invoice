// src/services/smsService.js - Updated SMS Service using Vercel API endpoints
import axios from 'axios';

class SMSService {
  constructor() {
    // Base URL for your Vercel deployment - update this to your actual domain
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://invoice.mittiarts.com//api' 
      : 'http://localhost:3001/api';
    
    this.timeout = 30000; // 30 seconds timeout for API calls
  }

  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    try {
      console.log('📱 Sending bill SMS via API...');
      
      const response = await axios.post(`${this.baseURL}/send-sms`, {
        phoneNumber,
        customerName,
        orderNumber,
        billToken,
        totalAmount
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Bill SMS sent successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to send bill SMS');
      }
    } catch (error) {
      console.error('❌ Bill SMS sending failed:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send bill SMS',
        smsType: 'bill'
      };
    }
  }

  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    try {
      console.log('📱 Sending advance SMS via API...');
      
      const response = await axios.post(`${this.baseURL}/send-advance-sms`, {
        phoneNumber,
        customerName,
        orderNumber,
        advanceAmount,
        remainingAmount,
        billToken
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Advance SMS sent successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to send advance SMS');
      }
    } catch (error) {
      console.error('❌ Advance SMS sending failed:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send advance SMS',
        smsType: 'advance'
      };
    }
  }

  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    try {
      console.log('📱 Sending completion SMS via API...');
      
      const response = await axios.post(`${this.baseURL}/send-completion-sms`, {
        phoneNumber,
        customerName,
        orderNumber,
        finalAmount,
        billToken
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        console.log('✅ Completion SMS sent successfully:', response.data);
        return response.data;
      } else {
        throw new Error(response.data.error || 'Failed to send completion SMS');
      }
    } catch (error) {
      console.error('❌ Completion SMS sending failed:', error);
      
      if (error.response?.data) {
        return error.response.data;
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send completion SMS',
        smsType: 'completion'
      };
    }
  }

  // 🆕 Send reminder SMS for pending advance payments
  async sendAdvanceReminderSMS(phoneNumber, customerName, orderNumber, remainingAmount, daysOverdue = 0) {
    try {
      console.log('📱 Sending reminder SMS via API...');
      
      // For now, use custom SMS endpoint (you can create a separate endpoint later)
      const overdueText = daysOverdue > 0 ? `(${daysOverdue} days overdue)` : '';
      
      const message = `🏺 Dear ${customerName},

Reminder: Pending payment for Mitti Arts order

Order: ${orderNumber}
Pending Amount: ₹${remainingAmount.toFixed(2)} ${overdueText}

Please complete your payment at your earliest convenience.

Contact us: 9441550927
- Mitti Arts Team`;

      const result = await this.sendCustomSMS(phoneNumber, message);
      
      if (result.success) {
        return {
          ...result,
          smsType: 'reminder'
        };
      } else {
        throw new Error(result.error || 'Failed to send reminder SMS');
      }
    } catch (error) {
      console.error('❌ Reminder SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reminder SMS',
        smsType: 'reminder'
      };
    }
  }

  // 🆕 Send custom SMS (you can create a separate API endpoint for this)
  async sendCustomSMS(phoneNumber, message) {
    try {
      // For custom SMS, we'll use a simple message format
      // You can create a separate API endpoint if needed
      console.log('📱 Sending custom SMS...');
      
      const response = await axios.post(`${this.baseURL}/send-sms`, {
        phoneNumber,
        customerName: 'Customer',
        orderNumber: 'CUSTOM',
        billToken: 'none',
        totalAmount: 0,
        customMessage: message
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        return {
          ...response.data,
          smsType: 'custom'
        };
      } else {
        throw new Error(response.data.error || 'Failed to send custom SMS');
      }
    } catch (error) {
      console.error('❌ Custom SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send custom SMS',
        smsType: 'custom'
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

  // Check API status
  async checkAPIStatus() {
    try {
      const response = await axios.get(`${this.baseURL}/status`, {
        timeout: 5000
      });
      
      return {
        success: true,
        status: 'API is working',
        ...response.data
      };
    } catch (error) {
      return {
        success: false,
        error: 'API not responding',
        details: error.message
      };
    }
  }

  // Update base URL for production
  updateBaseURL(newURL) {
    this.baseURL = newURL;
    console.log('📱 SMS Service base URL updated to:', newURL);
  }
}

export default new SMSService();