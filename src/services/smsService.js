// src/services/smsService.js - Updated and Simplified SMS Service for Mitti Arts
// Merged to a simpler localhost-focused implementation using fetch.

class SMSService {
  constructor() {
    // Set the base URL for the local API endpoint
    this.baseURL = 'http://localhost:3000/api';
    this.timeout = 10000; // Request timeout in milliseconds
  }

  // A generic fetch-based sender to reduce code duplication
  async #sendRequest(endpoint, payload, smsType) {
    try {
      // Use AbortController for timeout functionality with fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();
      console.log(`📊 SMS API Response for ${smsType}:`, data);

      if (response.ok && data.success) {
        return {
          success: true,
          messageId: data.messageId,
          message: data.message || `SMS (${smsType}) sent successfully`,
          ...data,
        };
      } else {
        return {
          success: false,
          error: data.error || `Failed to send ${smsType} SMS`,
          httpStatus: response.status,
        };
      }
    } catch (error) {
      console.error(`❌ ${smsType} SMS Service Error:`, error);
      let errorMessage = error.message || `Failed to send ${smsType} SMS due to a network or server error.`;
      if (error.name === 'AbortError') {
        errorMessage = 'SMS request timed out. The server took too long to respond.';
      }
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // Send regular bill SMS
  async sendBillSMS(phoneNumber, customerName, orderNumber, billToken, totalAmount) {
    console.log('📱 Sending bill SMS...', {
      phone: phoneNumber,
      customer: customerName,
      order: orderNumber
    });

    // Validate inputs before sending
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
      totalAmount: Number(totalAmount),
    };

    const result = await this.#sendRequest('/send-sms', payload, 'bill');
    return { ...result, smsType: 'bill' };
  }

  // Send advance payment SMS
  async sendAdvancePaymentSMS(phoneNumber, customerName, orderNumber, advanceAmount, remainingAmount, billToken) {
    console.log('📱 Sending advance payment SMS...', {
      phone: phoneNumber,
      customer: customerName,
      order: orderNumber
    });

    // Validate inputs before sending
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
      billToken,
    };

    const result = await this.#sendRequest('/send-advance-sms', payload, 'advance');
    return { ...result, smsType: 'advance' };
  }

  // --- Utility Functions ---

  // Validate required inputs for sending an SMS
  validateSMSInputs(phoneNumber, customerName, orderNumber) {
    if (!phoneNumber) {
      return { valid: false, error: 'Phone number is required.' };
    }
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return { valid: false, error: 'Invalid phone number format. Please use a 10-digit Indian mobile number.' };
    }
    if (!customerName || customerName.trim().length === 0) {
      return { valid: false, error: 'Customer name is required.' };
    }
    if (!orderNumber || orderNumber.trim().length === 0) {
      return { valid: false, error: 'Order number is required.' };
    }
    return { valid: true };
  }

  // Clean phone number to a 10-digit format
  cleanPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    return phoneNumber.toString().replace(/^\+91/, '').replace(/\D/g, '');
  }

  // Check if the phone number is a valid 10-digit Indian number
  isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;
    const cleanNumber = this.cleanPhoneNumber(phoneNumber);
    // Matches Indian mobile numbers starting with 6, 7, 8, or 9.
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }

  // Generate a simple, unique token for bill links
  generateBillToken() {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    return `MITTI_${timestamp}_${randomPart}`.toUpperCase();
  }
}

export default new SMSService();