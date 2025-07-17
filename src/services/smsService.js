// src/services/smsService.js - Simplified SMS Service for Mitti Arts
class SMSService {
  constructor() {
    this.baseURL = '/api';
    this.timeout = 15000; // Increased timeout
  }

  // Send regular bill SMS
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    console.log('📱 Sending bill SMS...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      amount: totalAmount
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'bill'
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'bill'
      };
    }

    const payload = {
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      billToken,
      totalAmount: Number(totalAmount) || 0
    };

    return await this.sendRequest('/send-sms', payload, 'bill');
  }

  // Send advance payment SMS
  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    console.log('📱 Sending advance payment SMS...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      advance: advanceAmount,
      remaining: remainingAmount
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'advance'
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'advance'
      };
    }

    const payload = {
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      advanceAmount: Number(advanceAmount) || 0,
      remainingAmount: Number(remainingAmount) || 0,
      billToken
    };

    return await this.sendRequest('/send-advance-sms', payload, 'advance');
  }

  // Send payment completion SMS
  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    console.log('📱 Sending completion SMS...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      final: finalAmount
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'completion'
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'completion'
      };
    }

    const payload = {
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      finalAmount: Number(finalAmount) || 0,
      billToken
    };

    return await this.sendRequest('/send-completion-sms', payload, 'completion');
  }

  // Generic request handler
  async sendRequest(endpoint, payload, smsType) {
    try {
      console.log(`📡 Calling ${endpoint} for ${smsType} SMS...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        data = { error: 'Invalid server response' };
      }

      console.log(`📊 ${smsType} SMS Response:`, {
        status: response.status,
        success: data.success,
        messageId: data.messageId,
        error: data.error
      });

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          message: data.message || `${smsType} SMS sent successfully`,
          provider: data.provider || 'Fast2SMS',
          billLink: data.billLink,
          smsType
        };
      } else {
        return {
          success: false,
          error: data.error || `Failed to send ${smsType} SMS`,
          httpStatus: response.status,
          smsType
        };
      }
    } catch (error) {
      console.error(`❌ ${smsType} SMS Error:`, error);
      
      let errorMessage = `Failed to send ${smsType} SMS`;
      if (error.name === 'AbortError') {
        errorMessage = 'SMS request timed out';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        smsType
      };
    }
  }

  // Utility functions
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
  }

  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  generateBillToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `MITTI_${timestamp}_${randomPart}`.toUpperCase();
  }
}

export default new SMSService();