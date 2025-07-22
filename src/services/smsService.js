// src/services/smsService.js - Zoko WhatsApp API Service
class SMSService {
  constructor() {
    this.baseURL = '/api';
    this.timeout = 30000; // 30 seconds for WhatsApp API
    this.provider = 'Zoko WhatsApp';
    this.zokoApiKey = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
    this.zokoApiUrl = 'https://api.zoko.io/v2/message/send';
  }

  // Send regular bill WhatsApp message
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    console.log('📱 Sending bill WhatsApp message via Zoko...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      amount: totalAmount
    });

    const payload = {
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      billToken,
      totalAmount: Number(totalAmount) || 0
    };

    return await this.sendRequest('/send-sms', payload, 'bill');
  }

  // Send advance payment WhatsApp message
  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    console.log('📱 Sending advance payment WhatsApp message via Zoko...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      advance: advanceAmount,
      remaining: remainingAmount
    });

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

  // Send payment completion WhatsApp message
  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    console.log('📱 Sending completion WhatsApp message via Zoko...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      final: finalAmount
    });

    const payload = {
      phoneNumber: this.cleanPhoneNumber(phoneNumber),
      customerName: customerName.trim(),
      orderNumber: orderNumber.trim(),
      finalAmount: Number(finalAmount) || 0,
      billToken
    };

    return await this.sendRequest('/send-completion-sms', payload, 'completion');
  }

  // Generic request handler for Zoko API endpoints
  async sendRequest(endpoint, payload, smsType) {
    try {
      console.log(`📡 Calling ${endpoint} for ${smsType} WhatsApp message...`);

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

      console.log(`📊 ${smsType} WhatsApp Response:`, {
        status: response.status,
        success: data.success,
        messageId: data.messageId,
        error: data.error
      });

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          message: data.message || `${smsType} WhatsApp message sent successfully`,
          provider: 'Zoko WhatsApp',
          channel: 'WhatsApp',
          billLink: data.billLink,
          smsType
        };
      } else {
        return {
          success: false,
          error: data.error || `Failed to send ${smsType} WhatsApp message`,
          httpStatus: response.status,
          provider: 'Zoko WhatsApp',
          smsType
        };
      }
    } catch (error) {
      console.error(`❌ ${smsType} WhatsApp Error:`, error);
      
      let errorMessage = `Failed to send ${smsType} WhatsApp message`;
      if (error.name === 'AbortError') {
        errorMessage = 'WhatsApp message request timed out';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        provider: 'Zoko WhatsApp',
        smsType
      };
    }
  }

  // Direct Zoko API call for testing
  async sendDirectZokoMessage(phoneNumber, message, messageType = 'test') {
    try {
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      if (!this.isValidPhoneNumber(cleanNumber)) {
        throw new Error('Invalid phone number format');
      }

      const whatsappNumber = `91${cleanNumber}`;

      const payload = {
        channel: 'whatsapp',
        recipient: whatsappNumber,
        type: 'text',
        message: {
          text: message
        }
      };

      console.log('📡 Direct Zoko API Call:', { 
        recipient: whatsappNumber,
        messageLength: message.length 
      });

      const response = await fetch(this.zokoApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.zokoApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('📊 Direct Zoko Response:', data);

      if (response.ok && (data.success || data.id || data.message_id)) {
        return {
          success: true,
          messageId: data.id || data.message_id,
          message: 'WhatsApp message sent via direct Zoko API',
          provider: 'Zoko WhatsApp Direct',
          data
        };
      } else {
        throw new Error(data.error || `Zoko API error: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Direct Zoko Error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Zoko WhatsApp Direct'
      };
    }
  }

  // Test Zoko connection
  async testZokoConnection(testPhoneNumber = '9441550927') {
    const testMessage = `🏺 *Mitti Arts - Test Message*

This is a test message from your pottery billing system.

✅ Zoko WhatsApp API is working correctly!

*Test Details:*
📅 Time: ${new Date().toLocaleString('en-IN')}
🔧 System: Mitti Arts POS
📱 Provider: Zoko WhatsApp API

If you received this message, your WhatsApp integration is successful! 🎉

*Mitti Arts Team*
_Handcrafted with Love 🎨_`;

    return await this.sendDirectZokoMessage(testPhoneNumber, testMessage, 'test');
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

  // Check API status
  async checkStatus(testConnection = false) {
    try {
      const url = `${this.baseURL}/status${testConnection ? '?testConnection=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: data.status,
        provider: 'Zoko WhatsApp',
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'Zoko WhatsApp'
      };
    }
  }

  getProviderInfo() {
    return {
      name: 'Zoko WhatsApp Business API',
      apiKey: this.zokoApiKey.slice(0, 8) + '...',
      channel: 'WhatsApp',
      features: [
        'Text Messages',
        'Rich Formatting',
        'Delivery Reports',
        'Business Verification'
      ],
      documentation: 'https://docs.zoko.io'
    };
  }
}

export default new SMSService();