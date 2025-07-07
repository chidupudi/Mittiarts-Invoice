// src/services/smsService.js
import axios from 'axios';

class SMSService {
  constructor() {
    this.apiKey = 'EeFV7lHYx2p4ajcG3MTXd6Lso8fuqJzZbSP9gRhmnIBwOACN15VYMcOadnw37ZboXizT6GEl24U5ruhN';
    this.baseURL = 'https://www.fast2sms.com/dev/bulkV2';
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
      
      // Create the SMS message
      const message = `🏺 Dear ${customerName},

Thank you for your purchase at Mitti Arts!

Order: ${orderNumber}
Amount: ₹${totalAmount.toFixed(2)}

View your bill: ${billLink}

We appreciate your business!
- Mitti Arts Team`;

      // Fast2SMS API request
      const response = await axios.post(this.baseURL, {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanNumber
      }, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        console.log('SMS sent successfully:', response.data);
        return {
          success: true,
          messageId: response.data.request_id,
          message: 'SMS sent successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
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
      
      const message = `🏺 Dear ${customerName},

Advance payment received for Mitti Arts!

Order: ${orderNumber}
Advance Paid: ₹${advanceAmount.toFixed(2)}
Balance Due: ₹${remainingAmount.toFixed(2)}

View bill: ${billLink}

Thank you for choosing Mitti Arts!`;

      const response = await axios.post(this.baseURL, {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanNumber
      }, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        return {
          success: true,
          messageId: response.data.request_id,
          message: 'Advance payment SMS sent successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Advance payment SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
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
      
      const message = `🏺 Dear ${customerName},

Payment completed for Mitti Arts order!

Order: ${orderNumber}
Final Payment: ₹${finalAmount.toFixed(2)}
Status: PAID IN FULL ✅

Final bill: ${billLink}

Thank you for your business!
- Mitti Arts Team`;

      const response = await axios.post(this.baseURL, {
        route: 'q',
        message: message,
        language: 'english',
        flash: 0,
        numbers: cleanNumber
      }, {
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.return === true) {
        return {
          success: true,
          messageId: response.data.request_id,
          message: 'Payment completion SMS sent successfully'
        };
      } else {
        throw new Error(response.data.message || 'Failed to send SMS');
      }
    } catch (error) {
      console.error('Payment completion SMS failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
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
    const cleanNumber = phoneNumber.replace(/^\+91/, '').replace(/\D/g, '');
    return /^[6-9]\d{9}$/.test(cleanNumber);
  }
}

export default new SMSService();