// src/services/smsService.js - Pertinax SMS Service with DLT Template Support
import { generateShortToken, generateShortUrl } from '../utils/shortUrl';

class SMSService {
  constructor() {
    this.baseURL = '/api';
    this.timeout = 30000; // 30 seconds
    this.provider = 'Pertinax SMS';

    // Pertinax API Configuration
    this.pertinaxApiUrl = 'http://pertinaxsolution.com/api/mt/SendSMS';
    this.apiKey = '2ogC0TMtJkioQY1eLYAt4w';
    this.senderId = 'MTARTS';
    this.channel = 'Trans'; // Transactional SMS

    // DLT Template Configuration
    this.templates = {
      advancePayment: {
        id: '1207176268898361869',
        name: 'advance--payments',
        template: 'Dear {#var#}, advance payment of Rs.{#var#} received. View invoice: {#var#} Thank you! - Mitti Arts',
        variables: ['customerName', 'advanceAmount', 'invoiceLink']
      }
      // Future templates will be added here:
      // fullPayment: { id: '', name: 'invoice_full_payment', ... },
      // paymentComplete: { id: '', name: 'invoice_payment_complete', ... }
    };
  }

  /**
   * Send advance payment SMS using DLT template
   * @param {string} phoneNumber - Customer phone number (10 digits)
   * @param {string} customerName - Customer name
   * @param {number} advanceAmount - Advance payment amount
   * @param {string} invoiceLink - Invoice URL
   * @returns {Promise} Response object
   */
  async sendAdvancePaymentSMS(phoneNumber, customerName, advanceAmount, invoiceLink) {
    console.log('📱 Sending advance payment SMS via Pertinax...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      advance: advanceAmount
    });

    try {
      // Clean and validate phone number
      const cleanNumber = this.cleanPhoneNumber(phoneNumber);
      if (!this.isValidPhoneNumber(cleanNumber)) {
        throw new Error('Invalid phone number format. Must be 10 digits starting with 6-9.');
      }

      // Prepare template variables
      const variables = {
        customerName: this.sanitizeVariable(customerName, 40),
        advanceAmount: this.formatAmount(advanceAmount),
        invoiceLink: invoiceLink || 'N/A'
      };

      // Build SMS text by replacing template variables
      const smsText = this.buildTemplateText('advancePayment', variables);

      // Send SMS via serverless function
      const payload = {
        phoneNumber: cleanNumber,
        customerName: variables.customerName,
        advanceAmount: variables.advanceAmount,
        invoiceLink: variables.invoiceLink,
        smsText: smsText
      };

      return await this.sendRequest('/send-advance-sms', payload, 'advance');

    } catch (error) {
      console.error('❌ Advance payment SMS error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Pertinax SMS',
        smsType: 'advance'
      };
    }
  }

  /**
   * Build SMS text from DLT template with variable substitution
   * @param {string} templateKey - Template key (e.g., 'advancePayment')
   * @param {Object} variables - Variable values
   * @returns {string} Complete SMS text
   */
  buildTemplateText(templateKey, variables) {
    const template = this.templates[templateKey];
    if (!template) {
      throw new Error(`Template '${templateKey}' not found`);
    }

    let text = template.template;

    // Replace variables in order
    template.variables.forEach(varName => {
      const value = variables[varName] || '';
      text = text.replace('{#var#}', value);
    });

    console.log('📝 Built SMS text:', {
      template: template.name,
      length: text.length,
      preview: text.substring(0, 50) + '...'
    });

    return text;
  }

  /**
   * Send request to serverless API endpoint
   * @param {string} endpoint - API endpoint path
   * @param {Object} payload - Request payload
   * @param {string} smsType - SMS type for logging
   * @returns {Promise} Response object
   */
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
        jobId: data.jobId,
        error: data.error
      });

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          jobId: data.jobId,
          message: data.message || `${smsType} SMS sent successfully`,
          provider: 'Pertinax SMS',
          channel: 'SMS',
          smsType,
          sentAt: data.sentAt
        };
      } else {
        return {
          success: false,
          error: data.error || `Failed to send ${smsType} SMS`,
          httpStatus: response.status,
          provider: 'Pertinax SMS',
          smsType,
          errorCode: data.errorCode
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
        provider: 'Pertinax SMS',
        smsType
      };
    }
  }

  /**
   * Send regular bill/invoice SMS (NOT AVAILABLE - DLT template not registered)
   * @param {string} phoneNumber - Customer phone number
   * @param {string} customerName - Customer name
   * @param {string} orderNumber - Order number
   * @param {string} billToken - Bill token
   * @param {number} totalAmount - Total amount
   * @returns {Promise} Response object
   */
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    console.warn('⚠️ sendBillSMS called but DLT template not registered yet');

    return {
      success: false,
      error: 'Full payment invoice SMS template not registered with DLT yet. Please register the template first.',
      provider: 'Pertinax SMS',
      smsType: 'bill',
      templateStatus: 'not_registered',
      recommendation: 'Use advance payment SMS for now, or register full payment template on JIO DLT Portal'
    };
  }

  /**
   * Send payment completion SMS (NOT AVAILABLE - DLT template not registered)
   * @param {string} phoneNumber - Customer phone number
   * @param {string} customerName - Customer name
   * @param {string} orderNumber - Order number
   * @param {number} finalAmount - Final payment amount
   * @param {string} billToken - Bill token
   * @returns {Promise} Response object
   */
  async sendPaymentCompletionSMS(phoneNumber, customerName, orderNumber, finalAmount, billToken) {
    console.warn('⚠️ sendPaymentCompletionSMS called but DLT template not registered yet');

    return {
      success: false,
      error: 'Payment completion SMS template not registered with DLT yet. Please register the template first.',
      provider: 'Pertinax SMS',
      smsType: 'completion',
      templateStatus: 'not_registered',
      recommendation: 'Register payment completion template on JIO DLT Portal first'
    };
  }

  /**
   * Send advance reminder SMS (NOT AVAILABLE - DLT template not registered)
   * @param {string} phoneNumber - Customer phone number
   * @param {string} customerName - Customer name
   * @param {string} orderNumber - Order number
   * @param {number} remainingAmount - Remaining amount
   * @param {number} daysOverdue - Days overdue
   * @returns {Promise} Response object
   */
  async sendAdvanceReminderSMS(phoneNumber, customerName, orderNumber, remainingAmount, daysOverdue) {
    console.warn('⚠️ sendAdvanceReminderSMS called but DLT template not registered yet');

    return {
      success: false,
      error: 'Advance reminder SMS template not registered with DLT yet. Please register the template first.',
      provider: 'Pertinax SMS',
      smsType: 'reminder',
      templateStatus: 'not_registered',
      recommendation: 'Register advance reminder template on JIO DLT Portal first'
    };
  }

  /**
   * Generate bill token for invoice sharing
   * @returns {string} Bill token
   */
  generateBillToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 11);
    return `MITTI_${timestamp}_${randomPart}`.toUpperCase();
  }

  /**
   * Generate short token and URL for SMS
   * @returns {Object} { shortToken, shortUrl }
   */
  generateShortUrlForSMS() {
    const shortToken = generateShortToken(4);
    const shortUrl = generateShortUrl(shortToken);

    console.log('🔗 Generated short URL for SMS:', {
      shortToken,
      shortUrl,
      length: shortUrl.length
    });

    return { shortToken, shortUrl };
  }

  /**
   * Send advance payment SMS with short URL
   * @param {string} phoneNumber - Customer phone number (10 digits)
   * @param {string} customerName - Customer name
   * @param {number} advanceAmount - Advance payment amount
   * @param {string} shortUrl - Short invoice URL (28 chars max)
   * @returns {Promise} Response object
   */
  async sendAdvancePaymentSMSWithShortUrl(phoneNumber, customerName, advanceAmount, shortUrl) {
    console.log('📱 Sending advance payment SMS with short URL...', {
      phone: `${phoneNumber.slice(0, 5)}*****`,
      customer: customerName,
      advance: advanceAmount,
      urlLength: shortUrl?.length
    });

    // Validate URL length (must be <= 30 chars for DLT variable)
    if (shortUrl && shortUrl.length > 30) {
      console.warn('⚠️ Short URL exceeds 30 chars:', shortUrl.length);
    }

    return this.sendAdvancePaymentSMS(phoneNumber, customerName, advanceAmount, shortUrl);
  }

  /**
   * Test Pertinax SMS connection
   * @param {string} testPhoneNumber - Test phone number
   * @returns {Promise} Response object
   */
  async testConnection(testPhoneNumber = '9441550927') {
    console.log('🧪 Testing Pertinax SMS connection...');

    const testMessage = 'Dear Test User, advance payment of Rs.100 received. View invoice: https://test.link Thank you! - Mitti Arts';

    try {
      const cleanNumber = this.cleanPhoneNumber(testPhoneNumber);
      if (!this.isValidPhoneNumber(cleanNumber)) {
        throw new Error('Invalid test phone number');
      }

      const payload = {
        phoneNumber: cleanNumber,
        customerName: 'Test User',
        advanceAmount: '100',
        invoiceLink: 'https://test.link',
        smsText: testMessage,
        isTest: true
      };

      const result = await this.sendRequest('/send-advance-sms', payload, 'test');

      if (result.success) {
        console.log('✅ Pertinax SMS connection test successful!');
      } else {
        console.error('❌ Pertinax SMS connection test failed:', result.error);
      }

      return result;

    } catch (error) {
      console.error('❌ Connection test error:', error);
      return {
        success: false,
        error: error.message,
        provider: 'Pertinax SMS'
      };
    }
  }

  /**
   * Check API status
   * @returns {Promise} Status object
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.baseURL}/status`);
      const data = await response.json();

      return {
        success: response.ok,
        status: data.status,
        provider: 'Pertinax SMS',
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        provider: 'Pertinax SMS'
      };
    }
  }

  // Utility functions

  /**
   * Clean phone number (remove country code and non-digits)
   * @param {string} phoneNumber - Raw phone number
   * @returns {string} Cleaned phone number
   */
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
  }

  /**
   * Validate Indian phone number
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} Valid or not
   */
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  /**
   * Sanitize template variable (truncate to max length)
   * @param {string} value - Variable value
   * @param {number} maxLength - Maximum allowed length
   * @returns {string} Sanitized value
   */
  sanitizeVariable(value, maxLength = 40) {
    if (!value) return '';
    const cleanValue = value.toString().trim();
    if (cleanValue.length > maxLength) {
      console.warn(`⚠️ Variable truncated from ${cleanValue.length} to ${maxLength} chars`);
      return cleanValue.substring(0, maxLength);
    }
    return cleanValue;
  }

  /**
   * Format amount for SMS (no commas, 2 decimal places)
   * @param {number|string} amount - Amount to format
   * @returns {string} Formatted amount
   */
  formatAmount(amount) {
    const numAmount = Number(amount) || 0;
    return numAmount.toFixed(2);
  }

  /**
   * Get provider information
   * @returns {Object} Provider details
   */
  getProviderInfo() {
    return {
      name: 'Pertinax SMS Gateway',
      apiKey: this.apiKey.slice(0, 8) + '...',
      senderId: this.senderId,
      channel: this.channel,
      templates: {
        registered: ['advance--payments'],
        pending: ['invoice_full_payment', 'invoice_payment_complete']
      },
      features: [
        'DLT Compliant Templates',
        'TRAI Approved',
        'Transactional SMS',
        'Delivery Reports'
      ],
      documentation: 'http://pertinaxsolution.com/Web/WebAPI/'
    };
  }

  /**
   * Get template information
   * @param {string} templateKey - Template key
   * @returns {Object} Template details
   */
  getTemplateInfo(templateKey) {
    const template = this.templates[templateKey];
    if (!template) {
      return { error: `Template '${templateKey}' not found` };
    }

    return {
      id: template.id,
      name: template.name,
      template: template.template,
      variables: template.variables,
      variableCount: template.variables.length,
      characterCount: template.template.length
    };
  }
}

const smsService = new SMSService();
export default smsService;
