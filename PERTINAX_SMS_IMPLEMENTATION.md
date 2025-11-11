# Pertinax SMS Integration - Implementation Guide

## Overview
Successfully migrated from Zoko WhatsApp to **Pertinax SMS Gateway** with **TRAI DLT Compliance** for Mitti Arts POS System.

**Provider:** Pertinax Solution
**API Key:** 2ogC0TMtJkioQY1eLYAt4w
**Sender ID:** MTARTS
**Channel:** Transactional (Trans)
**Compliance:** TRAI DLT Approved

---

## Current Implementation Status

### ✅ Completed
- [x] Pertinax SMS service module created
- [x] Environment configuration files (.env, .env.local)
- [x] Vercel serverless function for advance payment SMS
- [x] API status endpoint updated
- [x] Removed Zoko WhatsApp dependencies
- [x] Added backward compatibility methods

### ⏳ Pending
- [ ] Test SMS sending with real phone number
- [ ] Register remaining 2 DLT templates
- [ ] Implement full payment and completion SMS

---

## DLT Template Status

### 1. Advance Payment SMS ✅ ACTIVE
**Template ID:** `1207176268898361869`
**Template Name:** `advance--payments`
**Status:** ✅ Approved and Registered

**Template:**
```
Dear {#var#}, advance payment of Rs.{#var#} received. View invoice: {#var#} Thank you! - Mitti Arts
```

**Variables:**
1. Customer Name (max 40 chars)
2. Advance Amount (e.g., "2000.00")
3. Invoice Link (URL)

**API Endpoint:** `/api/send-advance-sms`

---

### 2. Full Payment Invoice SMS ⏳ PENDING
**Template Name:** `invoice_full_payment`
**Status:** ⏳ Not Registered Yet

**Template:**
```
Dear {#var#}, your Mitti Arts invoice of Rs.{#var#} is ready. View invoice: {#var#} - MTARTS
```

**Next Steps:**
1. Go to JIO TrueConnect DLT Portal
2. Register this template
3. Get Template ID (19 digits)
4. Update smsService.js with template ID
5. Enable `sendBillSMS()` method

---

### 3. Payment Completion SMS ⏳ PENDING
**Template Name:** `invoice_payment_complete`
**Status:** ⏳ Not Registered Yet

**Template:**
```
Dear {#var#}, final payment of Rs.{#var#} received. Invoice: {#var#} Order complete. Thank you! - MTARTS
```

**Next Steps:**
1. Go to JIO TrueConnect DLT Portal
2. Register this template
3. Get Template ID (19 digits)
4. Update smsService.js with template ID
5. Enable `sendPaymentCompletionSMS()` method

---

## Files Modified

### 1. Service Layer
**File:** `src/services/smsService.js`
- Replaced Zoko WhatsApp with Pertinax SMS
- Added DLT template management
- Added backward compatibility methods
- Current methods:
  - `sendAdvancePaymentSMS()` - ✅ Active
  - `sendBillSMS()` - ⏳ Returns error (template not registered)
  - `sendPaymentCompletionSMS()` - ⏳ Returns error (template not registered)
  - `sendAdvanceReminderSMS()` - ⏳ Returns error (template not registered)
  - `testConnection()` - Test Pertinax connection
  - `generateBillToken()` - Generate invoice share token
  - `cleanPhoneNumber()` - Sanitize phone numbers
  - `isValidPhoneNumber()` - Validate Indian mobile numbers

### 2. Serverless Functions
**File:** `api/send-advance-sms.js`
- New Pertinax SMS implementation
- Handles advance payment SMS
- Full DLT compliance
- Error handling and troubleshooting

**File:** `api/status.js`
- Updated to show Pertinax status
- Health check endpoint
- Balance check support
- Template registration status

**Files (Deprecated):**
- `api/send-sms.js` - Zoko (deprecated)
- `api/send-completion-sms.js` - Zoko (deprecated)

### 3. Configuration
**File:** `.env`
```env
REACT_APP_PERTINAX_API_KEY=2ogC0TMtJkioQY1eLYAt4w
REACT_APP_PERTINAX_SENDER_ID=MTARTS
REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID=1207176268898361869
REACT_APP_SMS_CHANNEL=Trans
REACT_APP_PERTINAX_API_URL=http://pertinaxsolution.com/api/mt/SendSMS
```

---

## How It Works

### SMS Flow for Advance Payment

1. **User creates advance payment invoice in POS**
2. **System calls:** `smsService.sendAdvancePaymentSMS(phone, name, amount, link)`
3. **Service builds SMS text:** Replaces template variables with actual data
4. **Serverless function called:** `/api/send-advance-sms`
5. **Pertinax API request:**
   ```
   GET http://pertinaxsolution.com/api/mt/SendSMS?
     APIKey=2ogC0TMtJkioQY1eLYAt4w&
     senderid=MTARTS&
     channel=Trans&
     number=91XXXXXXXXXX&
     text=Dear Rajesh, advance payment of Rs.2000.00 received. View invoice: https://... Thank you! - Mitti Arts&
     DLTTemplateId=1207176268898361869
   ```
6. **Pertinax response:**
   ```json
   {
     "ErrorCode": "000",
     "ErrorMessage": "Done",
     "JobId": "20047",
     "MessageData": [
       {
         "Number": "91XXXXXXXXXX",
         "MessageId": "abc123xyz"
       }
     ]
   }
   ```
7. **Success response to frontend**

---

## Testing Instructions

### 1. Test API Status
```bash
# Check if Pertinax API is configured
curl http://localhost:3000/api/status

# Test Pertinax connectivity
curl http://localhost:3000/api/status?testConnection=true
```

### 2. Test Advance Payment SMS

**Method 1: Using Frontend**
1. Open your POS application
2. Create a new order with advance payment
3. Enter customer phone number (10 digits, starting with 6-9)
4. Complete the advance payment
5. SMS will be sent automatically

**Method 2: Using API Directly**
```bash
curl -X POST http://localhost:3000/api/send-advance-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9441550927",
    "customerName": "Test User",
    "advanceAmount": "500.00",
    "invoiceLink": "https://your-domain.com/invoice/test123"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "messageId": "mvHdpSyS7UOs9hjxixQLvw",
  "jobId": "20047",
  "message": "Advance payment SMS sent successfully via Pertinax",
  "provider": "Pertinax SMS",
  "channel": "SMS",
  "phoneNumber": "+919441550927",
  "templateInfo": {
    "templateId": "1207176268898361869",
    "templateName": "advance--payments",
    "senderId": "MTARTS"
  }
}
```

**Expected Response (Error):**
```json
{
  "success": false,
  "error": "Insufficient balance in Pertinax account",
  "errorCode": "123",
  "troubleshooting": {
    "possibleIssues": [...],
    "recommendations": [...]
  }
}
```

### 3. Test from React DevTools Console

Open browser console on your POS app:
```javascript
// Import SMS service
import smsService from './services/smsService';

// Test connection
const result = await smsService.testConnection('9441550927');
console.log(result);

// Test advance payment SMS
const smsResult = await smsService.sendAdvancePaymentSMS(
  '9441550927',
  'Test Customer',
  '1000.00',
  'https://test.link'
);
console.log(smsResult);
```

---

## Troubleshooting

### Error: "Template not approved"
**Cause:** DLT template not registered or approved yet
**Solution:**
1. Check template status in JIO DLT Portal
2. Verify Template ID is correct: `1207176268898361869`
3. Wait 24-48 hours after registration

### Error: "Sender ID not registered"
**Cause:** MTARTS sender ID not approved
**Solution:**
1. Register MTARTS on Pertinax account
2. Verify sender ID in Pertinax dashboard

### Error: "Invalid phone number"
**Cause:** Phone number format incorrect
**Solution:**
- Must be 10 digits
- Must start with 6, 7, 8, or 9
- No country code needed (system adds +91)

### Error: "Insufficient balance"
**Cause:** No SMS credits in Pertinax account
**Solution:**
1. Check balance: `GET /api/mt/GetBalance?APIKey=...`
2. Recharge Pertinax account

### Error: "SMS text does not match template"
**Cause:** Variable replacement created text that doesn't match DLT template
**Solution:**
- Variables must be 3-40 characters
- Amount format: "2000.00" (no commas)
- Check for extra spaces or special characters

---

## Next Steps

### 1. Register Remaining Templates (High Priority)

**Template 2: Full Payment Invoice**
1. Go to https://trueconnect.jio.com (JIO DLT Portal)
2. Login with credentials
3. Navigate to "Content Template Registration"
4. Fill details:
   - Template Type: SMS
   - Type of Communication: Service Implicit
   - Category: Consumer Goods and Automobiles
   - Header: MTARTS
   - Template Name: invoice_full_payment
   - Template Content: `Dear {#var#}, your Mitti Arts invoice of Rs.{#var#} is ready. View invoice: {#var#} - MTARTS`
   - Sample: `Dear Rajesh Kumar, your Mitti Arts invoice of Rs.5000 is ready. View invoice: http://bit.ly/mi123 - MTARTS`
5. Submit and wait for approval (24-48 hours)
6. Note down the 19-digit Template ID
7. Update `src/services/smsService.js`:
   ```javascript
   fullPayment: {
     id: 'YOUR_TEMPLATE_ID_HERE',
     name: 'invoice_full_payment',
     template: 'Dear {#var#}, your Mitti Arts invoice of Rs.{#var#} is ready. View invoice: {#var#} - MTARTS',
     variables: ['customerName', 'totalAmount', 'invoiceLink']
   }
   ```
8. Enable the `sendBillSMS()` method

**Template 3: Payment Completion**
- Follow same steps as above
- Use template content from reference/referemnce.txt

### 2. Test with Real Data
- [ ] Test with actual customer phone number
- [ ] Verify SMS delivery
- [ ] Check SMS content formatting
- [ ] Verify invoice link works
- [ ] Test error scenarios

### 3. Monitor and Optimize
- [ ] Check Pertinax balance regularly
- [ ] Monitor SMS delivery rates
- [ ] Track failed SMS and reasons
- [ ] Optimize template content if needed

### 4. Future Enhancements
- [ ] Add SMS delivery status tracking
- [ ] Implement retry logic for failed SMS
- [ ] Add SMS analytics dashboard
- [ ] Integrate URL shortener for invoice links
- [ ] Add support for bulk SMS campaigns

---

## API Reference

### Pertinax SMS API

**Base URL:** `http://pertinaxsolution.com/api/mt/`

**Authentication:** API Key in query parameter

**Endpoints:**

#### 1. Send SMS
```
GET /SendSMS?
  APIKey={api_key}&
  senderid={sender_id}&
  channel={Trans|Promo}&
  DCS=0&
  flashsms=0&
  number=91XXXXXXXXXX&
  text={message_text}&
  DLTTemplateId={template_id}
```

**Response:**
```json
{
  "ErrorCode": "000",
  "ErrorMessage": "Done",
  "JobId": "20047",
  "MessageData": [
    {
      "Number": "91XXXXXXXXXX",
      "MessageId": "abc123"
    }
  ]
}
```

#### 2. Check Balance
```
GET /GetBalance?APIKey={api_key}
```

**Response:**
```json
{
  "ErrorCode": "0",
  "ErrorMessage": "Done",
  "Balance": "Promo:9988|Trans:0"
}
```

#### 3. Check Delivery
```
GET /GetDelivery?APIKey={api_key}&jobid={job_id}
```

**Response:**
```json
{
  "ErrorCode": "0",
  "ErrorMessage": "Done",
  "DeliveryReports": [
    {
      "MessageId": "abc123",
      "DeliveryStatus": "Delivered",
      "DeliveryDate": "2025-01-11T06:17:00"
    }
  ]
}
```

---

## Support

### Mitti Arts
- **Email:** info@mittiarts.com
- **Phone:** 9441550927 / 7382150250
- **Address:** Opp. Romoji Film City, Hyderabad

### Pertinax Support
- **Website:** http://pertinaxsolution.com
- **Documentation:** http://pertinaxsolution.com/Web/WebAPI/

### DLT Registration
- **Portal:** https://trueconnect.jio.com
- **Support:** JIO TrueConnect Support

---

## Important Notes

1. **DLT Compliance is Mandatory:** All SMS must use registered templates
2. **Variable Length Limits:** Each variable must be 3-40 characters
3. **Phone Number Format:** 10 digits, starting with 6-9 (Indian mobiles only)
4. **SMS Cost:** Approximately Rs. 0.15-0.25 per SMS
5. **Delivery Time:** Usually within 30 seconds
6. **Character Limit:** 160 characters for single SMS, 306 for multi-part
7. **Sender ID:** MTARTS (6 characters, must be registered)

---

**Last Updated:** January 11, 2025
**Implementation By:** Claude Code
**Version:** 3.0.0
