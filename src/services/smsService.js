// src/services/smsService.js - Updated SMS Service for Zoko WhatsApp API
class SMSService {
  constructor() {
    this.baseURL = '/api';
    this.timeout = 20000; // Increased timeout for WhatsApp API
    this.provider = 'Zoko WhatsApp';
  }

  // Send regular bill WhatsApp message
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    console.log('📱 Sending bill WhatsApp message...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      amount: totalAmount,
      provider: this.provider
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'bill',
        provider: this.provider
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'bill',
        provider: this.provider
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

  // Send advance payment WhatsApp message
  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    console.log('📱 Sending advance payment WhatsApp message...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      advance: advanceAmount,
      remaining: remainingAmount,
      provider: this.provider
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'advance',
        provider: this.provider
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'advance',
        provider: this.provider
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

  // Send payment completion WhatsApp message
  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    console.log('📱 Sending completion WhatsApp message...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      final: finalAmount,
      provider: this.provider
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'completion',
        provider: this.provider
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'completion',
        provider: this.provider
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

  // Send advance reminder WhatsApp message
  async sendAdvanceReminderSMS(phoneNumber, customerName, orderNumber, remainingAmount, daysOverdue = 0) {
    console.log('📱 Sending advance reminder WhatsApp message...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      order: orderNumber,
      remaining: remainingAmount,
      overdue: daysOverdue,
      provider: this.provider
    });

    // Validate inputs
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format',
        smsType: 'reminder',
        provider: this.provider
      };
    }

    if (!customerName?.trim() || !orderNumber?.trim()) {
      return {
        success: false,
        error: 'Missing required fields',
        smsType: 'reminder',
        provider: this.provider
      };
    }

    // Create reminder message
    const urgencyEmoji = daysOverdue > 7 ? '🚨' : daysOverdue > 0 ? '⚠️' : '💭';
    const statusText = daysOverdue > 0 ? `OVERDUE by ${daysOverdue} days` : 'Payment Due';
    
    const message = `${urgencyEmoji} *Mitti Arts - Payment Reminder*

Dear ${customerName.trim()},

This is a gentle reminder about your pending payment.

*Order Details:*
📋 Order: ${orderNumber.trim()}
💰 Amount Due: *₹${remainingAmount.toFixed(2)}*
📅 Status: *${statusText}*

Please complete your payment at your earliest convenience.

*Payment Options:*
• Visit our store
• Call us for assistance
• Bank transfer available

Your handcrafted pottery order is ready and waiting for you! 🏺

Contact us:
📞 9441550927
📧 info@mittiarts.com

*Mitti Arts Team*
_Handcrafted with Love 🎨_`;

    // Use direct Zoko API call for reminders
    return await this.sendDirectZokoMessage(phoneNumber, message, 'reminder');
  }

  // Direct Zoko API call for custom messages
  async sendDirectZokoMessage(phoneNumber, message, messageType = 'custom') {
    try {
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      const whatsappNumber = `91${cleanNumber}`;

      const ZOKO_API_KEY = '6c906326-4e7f-4a1a-a61e-9241bec269d4';
      const ZOKO_API_URL = 'https://api.zoko.io/v2/message/send';

      const payload = {
        channel: 'whatsapp',
        recipient: whatsappNumber,
        type: 'text',
        message: {
          text: message
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(ZOKO_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZOKO_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.success || data.id || data.message_id) {
          return {
            success: true,
            messageId: data.id || data.message_id,
            message: `${messageType} WhatsApp message sent successfully`,
            provider: this.provider,
            smsType: messageType
          };
        }
      }

      throw new Error(`Zoko API error: ${response.status}`);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.provider,
        smsType: messageType
      };
    }
  }

  // Generic request handler for API endpoints
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
        error: data.error,
        provider: this.provider
      });

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          message: data.message || `${smsType} WhatsApp message sent successfully`,
          provider: data.provider || this.provider,
          channel: 'WhatsApp',
          billLink: data.billLink,
          smsType,
          whatsappNumber: data.whatsappNumber
        };
      } else {
        return {
          success: false,
          error: data.error || `Failed to send ${smsType} WhatsApp message`,
          httpStatus: response.status,
          provider: this.provider,
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
        provider: this.provider,
        smsType
      };
    }
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
        provider: this.provider,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: this.provider
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

  // Format phone number for WhatsApp (international format)
  formatWhatsAppNumber(phoneNumber) {
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    return `91${cleanNumber}`; // India country code
  }

  // Get provider information
  getProviderInfo() {
    return {
      name: 'Zoko WhatsApp Business API',
      channel: 'WhatsApp',
      features: [
        'Text Messages',
        'Media Support',
        'Message Templates',
        'Delivery Reports',
        'Interactive Messages'
      ],
      advantages: [
        'High delivery rates',
        'Rich message formatting',
        'Customer engagement',
        'Business verification',
        'Global reach'
      ],
      pricing: 'Pay per message',
      supportedCountries: 'Global',
      documentation: 'https://docs.zoko.io'
    };
  }

  // Validate message content for WhatsApp
  validateMessage(message) {
    if (!message || typeof message !== 'string') {
      return { valid: false, error: 'Message must be a non-empty string' };
    }

    if (message.length > 4096) {
      return { valid: false, error: 'Message exceeds WhatsApp limit of 4096 characters' };
    }

    if (message.trim().length === 0) {
      return { valid: false, error: 'Message cannot be empty or only whitespace' };
    }

    return { valid: true };
  }
}

export default new SMSService();