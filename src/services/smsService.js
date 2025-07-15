// src/services/smsService.js - Complete Updated SMS Service with robust error handling
import axios from 'axios';

class SMSService {
  constructor() {
    // Use your actual domain
    this.baseURL = process.env.NODE_ENV === 'production' 
      ? 'https://invoice.mittiarts.com/api' 
      : 'http://localhost:3001/api';
    
    this.timeout = 30000; // 30 seconds timeout for API calls
    this.retryAttempts = 2; // Number of retry attempts
    this.retryDelay = 2000; // Delay between retries in ms
  }

  // Main SMS sending method with retry logic
  async sendSMSWithRetry(endpoint, payload, retries = this.retryAttempts) {
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        console.log(`📱 SMS API attempt ${attempt}/${retries + 1} to ${endpoint}`);
        
        const response = await axios.post(`${this.baseURL}${endpoint}`, payload, {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'MittiArts-POS/1.0'
          },
          validateStatus: function (status) {
            return status < 500; // Don't throw on 4xx errors
          }
        });

        console.log(`📊 SMS API Response (${response.status}):`, response.data);

        // Handle successful response
        if (response.status === 200 && response.data && response.data.success) {
          console.log('✅ SMS sent successfully');
          return {
            success: true,
            messageId: response.data.messageId,
            message: response.data.message,
            billToken: response.data.billToken,
            billLink: response.data.billLink,
            provider: response.data.provider || 'Fast2SMS',
            sentAt: response.data.sentAt || new Date().toISOString(),
            phoneNumber: response.data.phoneNumber,
            cost: response.data.cost || 0
          };
        }

        // Handle API errors
        if (response.status >= 400) {
          const errorMsg = response.data?.error || `HTTP ${response.status} error`;
          console.warn(`⚠️ SMS API error (${response.status}):`, errorMsg);
          
          // Don't retry on client errors (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: errorMsg,
              httpStatus: response.status,
              retryable: false
            };
          }
          
          throw new Error(errorMsg);
        }

        // Handle unexpected response format
        throw new Error(response.data?.error || 'Unexpected API response format');

      } catch (error) {
        console.error(`❌ SMS attempt ${attempt} failed:`, error.message);
        
        // Don't retry on final attempt or non-retryable errors
        if (attempt === retries + 1 || this.isNonRetryableError(error)) {
          return this.formatErrorResponse(error, payload.phoneNumber);
        }
        
        // Wait before retrying
        if (attempt <= retries) {
          console.log(`⏳ Retrying in ${this.retryDelay}ms...`);
          await this.delay(this.retryDelay);
        }
      }
    }
  }

  // Send regular bill SMS
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    try {
      console.log('📱 Sending bill SMS...', {
        phone: this.formatPhoneForDisplay(phoneNumber),
        customer: customerName,
        order: orderNumber,
        amount: totalAmount
      });

      // Validate inputs
      const validation = this.validateSMSInputs(phoneNumber, customerName, orderNumber);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          smsType: 'bill'
        };
      }

      const payload = {
        phoneNumber: this.cleanPhoneNumber(phoneNumber),
        customerName: customerName.trim(),
        orderNumber: orderNumber.trim(),
        billToken,
        totalAmount: Number(totalAmount)
      };

      const result = await this.sendSMSWithRetry('/send-sms', payload);
      return {
        ...result,
        smsType: 'bill'
      };

    } catch (error) {
      console.error('❌ Bill SMS service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send bill SMS',
        smsType: 'bill'
      };
    }
  }

  // Send advance payment SMS
  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    try {
      console.log('📱 Sending advance payment SMS...', {
        phone: this.formatPhoneForDisplay(phoneNumber),
        customer: customerName,
        order: orderNumber,
        advance: advanceAmount,
        remaining: remainingAmount
      });

      // Validate inputs
      const validation = this.validateSMSInputs(phoneNumber, customerName, orderNumber);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          smsType: 'advance'
        };
      }

      const payload = {
        phoneNumber: this.cleanPhoneNumber(phoneNumber),
        customerName: customerName.trim(),
        orderNumber: orderNumber.trim(),
        advanceAmount: Number(advanceAmount),
        remainingAmount: Number(remainingAmount),
        billToken
      };

      const result = await this.sendSMSWithRetry('/send-advance-sms', payload);
      return {
        ...result,
        smsType: 'advance'
      };

    } catch (error) {
      console.error('❌ Advance SMS service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send advance SMS',
        smsType: 'advance'
      };
    }
  }

  // Send payment completion SMS
  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    try {
      console.log('📱 Sending payment completion SMS...', {
        phone: this.formatPhoneForDisplay(phoneNumber),
        customer: customerName,
        order: orderNumber,
        amount: finalAmount
      });

      // Validate inputs
      const validation = this.validateSMSInputs(phoneNumber, customerName, orderNumber);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          smsType: 'completion'
        };
      }

      const payload = {
        phoneNumber: this.cleanPhoneNumber(phoneNumber),
        customerName: customerName.trim(),
        orderNumber: orderNumber.trim(),
        finalAmount: Number(finalAmount),
        billToken
      };

      const result = await this.sendSMSWithRetry('/send-completion-sms', payload);
      return {
        ...result,
        smsType: 'completion'
      };

    } catch (error) {
      console.error('❌ Completion SMS service error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send completion SMS',
        smsType: 'completion'
      };
    }
  }

  // Send reminder SMS for pending advance payments
  async sendAdvanceReminderSMS(phoneNumber, customerName, orderNumber, remainingAmount, daysOverdue = 0) {
    try {
      console.log('📱 Sending reminder SMS...');
      
      const overdueText = daysOverdue > 0 ? `(${daysOverdue} days overdue)` : '';
      
      const message = `🏺 Dear ${customerName},

Reminder: Pending payment for Mitti Arts order

Order: ${orderNumber}
Pending Amount: ₹${remainingAmount.toFixed(2)} ${overdueText}

Please complete your payment at your earliest convenience.

Contact us: 9441550927
- Mitti Arts Team`;

      const result = await this.sendCustomSMS(phoneNumber, message);
      
      return {
        ...result,
        smsType: 'reminder'
      };
    } catch (error) {
      console.error('❌ Reminder SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reminder SMS',
        smsType: 'reminder'
      };
    }
  }

  // Send custom SMS
  async sendCustomSMS(phoneNumber, message) {
    try {
      console.log('📱 Sending custom SMS...');
      
      const payload = {
        phoneNumber: this.cleanPhoneNumber(phoneNumber),
        customerName: 'Customer',
        orderNumber: 'CUSTOM',
        billToken: 'none',
        totalAmount: 0,
        customMessage: message
      };

      const result = await this.sendSMSWithRetry('/send-sms', payload);
      return {
        ...result,
        smsType: 'custom'
      };
    } catch (error) {
      console.error('❌ Custom SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send custom SMS',
        smsType: 'custom'
      };
    }
  }

  // Validation methods
  validateSMSInputs(phoneNumber, customerName, orderNumber) {
    if (!phoneNumber) {
      return { valid: false, error: 'Phone number is required' };
    }
    
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return { valid: false, error: 'Invalid phone number format' };
    }
    
    if (!customerName || customerName.trim().length === 0) {
      return { valid: false, error: 'Customer name is required' };
    }
    
    if (!orderNumber || orderNumber.trim().length === 0) {
      return { valid: false, error: 'Order number is required' };
    }
    
    return { valid: true };
  }

  // Phone number utilities
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
  }

  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    if (cleanNumber.length === 10) {
      return `+91 ${cleanNumber.slice(0, 5)} ${cleanNumber.slice(5)}`;
    }
    return phoneNumber;
  }

  formatPhoneForDisplay(phoneNumber) {
    const clean = this.cleanPhoneNumber(phoneNumber);
    return clean ? `${clean.slice(0, 5)}*****` : 'Invalid';
  }

  // Token generation
  generateBillToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 15);
    const extraRandom = Math.random().toString(36).substr(2, 10);
    return `mitti_${timestamp}_${randomPart}_${extraRandom}`.toUpperCase();
  }

  // Error handling utilities
  isNonRetryableError(error) {
    // Don't retry on validation errors, authentication errors, etc.
    const nonRetryableCodes = ['ENOTFOUND', 'ECONNREFUSED'];
    const nonRetryableMessages = ['Invalid phone number', 'Authentication failed', 'API key'];
    
    return nonRetryableCodes.includes(error.code) ||
           nonRetryableMessages.some(msg => error.message.toLowerCase().includes(msg.toLowerCase()));
  }

  formatErrorResponse(error, phoneNumber = '') {
    let errorMessage = 'SMS service temporarily unavailable';
    
    if (error.response) {
      // Server responded with error status
      errorMessage = error.response.data?.error || `Server error: ${error.response.status}`;
    } else if (error.request) {
      // Request was made but no response received
      errorMessage = 'SMS service is not responding. Please check your internet connection.';
    } else if (error.code === 'ECONNABORTED') {
      errorMessage = 'SMS request timed out. Please try again.';
    } else {
      errorMessage = error.message || 'Unknown SMS error';
    }
    
    return {
      success: false,
      error: errorMessage,
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      timestamp: new Date().toISOString()
    };
  }

  // Utility methods
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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

  // Batch SMS sending
  async sendBatchSMS(phoneNumbers, message, delayBetweenSMS = 1000) {
    const results = [];
    
    console.log(`📱 Starting batch SMS to ${phoneNumbers.length} numbers...`);
    
    for (let i = 0; i < phoneNumbers.length; i++) {
      const phoneNumber = phoneNumbers[i];
      
      try {
        const result = await this.sendCustomSMS(phoneNumber, message);
        results.push({
          phoneNumber: this.formatPhoneForDisplay(phoneNumber),
          ...result
        });
        
        console.log(`📱 Batch SMS ${i + 1}/${phoneNumbers.length}: ${result.success ? 'Success' : 'Failed'}`);
        
        // Add delay between SMS to avoid rate limiting
        if (i < phoneNumbers.length - 1 && delayBetweenSMS > 0) {
          await this.delay(delayBetweenSMS);
        }
      } catch (error) {
        results.push({
          phoneNumber: this.formatPhoneForDisplay(phoneNumber),
          success: false,
          error: error.message
        });
      }
    }
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`📱 Batch SMS completed: ${successful} successful, ${failed} failed`);
    
    return {
      total: phoneNumbers.length,
      successful,
      failed,
      results
    };
  }

  // API status and testing
  async checkAPIStatus() {
    try {
      console.log('🔍 Checking SMS API status...');
      
      const response = await axios.get(`${this.baseURL}/status`, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json'
        }
      });
      
      console.log('✅ SMS API Status Response:', response.data);
      
      return {
        success: true,
        status: 'API is working',
        baseURL: this.baseURL,
        timestamp: new Date().toISOString(),
        ...response.data
      };
    } catch (error) {
      console.error('❌ SMS API status check failed:', error);
      
      return {
        success: false,
        error: 'API not responding',
        details: error.message,
        baseURL: this.baseURL,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Test SMS connection with a dummy message
  async testConnection(testPhoneNumber = '9999999999') {
    try {
      console.log('🧪 Testing SMS connection...');
      
      const testResult = await this.sendCustomSMS(testPhoneNumber, 'Test message from Mitti Arts POS - Please ignore');
      
      return {
        success: testResult.success,
        message: testResult.success ? 'SMS connection test successful' : 'SMS connection test failed',
        details: testResult
      };
    } catch (error) {
      return {
        success: false,
        message: 'SMS connection test failed',
        error: error.message
      };
    }
  }

  // Configuration management
  updateBaseURL(newURL) {
    this.baseURL = newURL;
    console.log('📱 SMS Service base URL updated to:', newURL);
  }

  getConfiguration() {
    return {
      baseURL: this.baseURL,
      timeout: this.timeout,
      retryAttempts: this.retryAttempts,
      retryDelay: this.retryDelay,
      environment: process.env.NODE_ENV
    };
  }

  // Health check for monitoring
  async healthCheck() {
    const startTime = Date.now();
    const status = await this.checkAPIStatus();
    const responseTime = Date.now() - startTime;
    
    return {
      ...status,
      responseTime: `${responseTime}ms`,
      healthy: status.success && responseTime < 5000
    };
  }
}

export default new SMSService();