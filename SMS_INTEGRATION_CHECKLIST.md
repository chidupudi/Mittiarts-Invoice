# Pertinax SMS Integration - Complete Checklist

## ✅ Already Implemented

1. **API Integration** - [api/send-advance-sms.js](api/send-advance-sms.js)
   - Uses APIKey authentication: `2ogC0TMtJkioQY1eLYAt4w`
   - Sender ID: `MTARTS`
   - DLT Template ID: `1207176268898361869`
   - Channel: `Trans` (Transactional)
   - API Endpoint: `http://pertinaxsolution.com/api/mt/SendSMS`

2. **Short URL System** - 28 characters (`invoice.mittiarts.com/i/XXXX`)
   - [src/utils/shortUrl.js](src/utils/shortUrl.js) - Token generation
   - [src/components/public/ShortUrlRedirect.js](src/components/public/ShortUrlRedirect.js) - Redirect handler
   - [src/App.js](src/App.js) - Route `/i/:shortToken`

3. **Order Creation** - [src/features/order/orderSlice.js](src/features/order/orderSlice.js)
   - Generates `shareToken` and `shortToken`
   - Sends SMS with short URL when advance payment is made

4. **Invoice Sharing** - [src/components/billing/Invoice.js](src/components/billing/Invoice.js)
   - Generates tokens for old invoices
   - Copies short URL to clipboard

5. **SMS Service** - [src/services/smsService.js](src/services/smsService.js)
   - Pertinax integration
   - DLT template support

## ⚠️ ACTION REQUIRED

### 1. **Update Firestore Security Rules** ⚡ CRITICAL

**Status**: Not yet applied
**File**: Copy from [reference/rules.txt](reference/rules.txt)

**Steps**:
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace with rules from `reference/rules.txt`
5. Click **Publish**

**Key Change**: Added `resource.data.shortToken != null` to allow public access for short URLs

```javascript
match /orders/{orderId} {
  allow read: if resource.data.shareToken != null ||
                resource.data.billToken != null ||
                resource.data.shortToken != null;  // ← Added this line
  // ... rest of rules
}
```

### 2. **Disable IP Validation in Pertinax Dashboard** ⚡ CRITICAL

**Status**: Not yet disabled
**Impact**: SMS API will fail with "api restriction" error if not disabled

**Steps**:
1. Login to [Pertinax Dashboard](http://pertinaxsolution.com)
2. Go to **Settings** or **Security**
3. Find **IP Validation** or **IP Whitelist** section
4. **Disable** IP Validation (or add Vercel IPs)
5. Click **Save**

**Why**: Vercel uses dynamic IPs, so IP validation must be disabled for serverless functions

### 3. **Set Environment Variables in Vercel** ✅ Optional

**Status**: Already set in code (hardcoded)
**Recommendation**: Move to Vercel environment variables for security

**Current Configuration** (in code):
- `PERTINAX_API_KEY`: `2ogC0TMtJkioQY1eLYAt4w`
- `PERTINAX_SENDER_ID`: `MTARTS`
- `DLT_TEMPLATE_ID`: `1207176268898361869`

**To move to environment variables**:
1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `PERTINAX_API_KEY` = `2ogC0TMtJkioQY1eLYAt4w`
   - `PERTINAX_SENDER_ID` = `MTARTS`
   - `DLT_TEMPLATE_ID` = `1207176268898361869`
5. Redeploy

### 4. **Verify DLT Template Approval** ✅ Already Done

**Status**: Confirmed approved
**Template ID**: `1207176268898361869`
**Template Text**: `Dear {#var#}, advance payment of Rs.{#var#} received. View invoice: {#var#} Thank you! - Mitti Arts`
**Sender ID**: `MTARTS` (Header ID: 1205176259328437317)

### 5. **Test SMS Integration**

**Test Cases**:

#### Test 1: New Order with Advance Payment
1. Create new order with advance payment
2. Verify SMS is sent to customer
3. Check SMS contains short URL: `invoice.mittiarts.com/i/XXXX`
4. Click short URL and verify it redirects to invoice
5. Check console logs for success

**Expected SMS**:
```
Dear John Doe, advance payment of Rs.5000.00 received. View invoice: invoice.mittiarts.com/i/K7mX Thank you! - Mitti Arts
```

#### Test 2: Share Existing Invoice
1. Open existing invoice
2. Click "Share Invoice" button
3. Verify short URL copied to clipboard
4. Open short URL in new tab
5. Verify redirect to full invoice

#### Test 3: Short URL Access (Public)
1. Logout from application
2. Open short URL: `https://invoice.mittiarts.com/i/XXXX`
3. Verify invoice loads without login
4. Verify customer can see invoice details

## 📋 Verification Commands

### Check Pertinax API Manually
```bash
# Test SMS send (replace with your data)
curl "http://pertinaxsolution.com/api/mt/SendSMS?APIKey=2ogC0TMtJkioQY1eLYAt4w&senderid=MTARTS&channel=Trans&DCS=0&flashsms=0&number=919441550927&text=Test%20message&DLTTemplateId=1207176268898361869"
```

### Check Balance
```bash
curl "http://pertinaxsolution.com/api/mt/GetBalance?APIKey=2ogC0TMtJkioQY1eLYAt4w"
```

### Check Delivery Status
```bash
# Replace jobid with actual JobId from send response
curl "http://pertinaxsolution.com/api/mt/GetDelivery?APIKey=2ogC0TMtJkioQY1eLYAt4w&jobid=20047"
```

## 🐛 Troubleshooting

### Issue 1: "api restriction" Error
**Cause**: IP Validation enabled in Pertinax dashboard
**Solution**: Disable IP Validation in Pertinax settings

### Issue 2: "Missing or insufficient permissions" (Firestore)
**Cause**: Firestore rules don't allow public `shortToken` queries
**Solution**: Update Firestore rules to include `shortToken` in public read condition

### Issue 3: SMS Text Mismatch
**Cause**: SMS text doesn't exactly match DLT template
**Solution**: Ensure text matches template exactly:
```
Dear {name}, advance payment of Rs.{amount} received. View invoice: {url} Thank you! - Mitti Arts
```

### Issue 4: Invalid Template ID
**Cause**: Wrong DLT Template ID
**Solution**: Use correct ID: `1207176268898361869`

### Issue 5: Invalid Sender ID
**Cause**: Sender ID not approved or wrong
**Solution**: Use approved sender: `MTARTS`

## 📊 API Response Examples

### Success Response
```json
{
  "ErrorCode": "000",
  "ErrorMessage": "Done",
  "JobId": "20047",
  "MessageData": [
    {
      "Number": "919441550927",
      "MessageId": "mvHdpSyS7UOs9hjxixQLvw"
    }
  ]
}
```

### Error Response
```json
{
  "ErrorCode": "10",
  "ErrorMessage": "api restriction"
}
```

## 📝 Important Notes

1. **URL Length**: Short URL is exactly 28 characters - fits within 30-char DLT variable limit
2. **Template Variables**: 3 variables - name (max 40 chars), amount, URL (max 30 chars)
3. **Channel**: Must use `Trans` for transactional SMS
4. **Phone Format**: `91` + 10-digit number (e.g., `919441550927`)
5. **Cost**: Check Pertinax pricing for transactional SMS

## ✅ Final Checklist

- [ ] Firestore rules updated with `shortToken` support
- [ ] IP Validation disabled in Pertinax dashboard
- [ ] Test SMS sent successfully
- [ ] Short URL redirects correctly
- [ ] Public access works without login
- [ ] Invoice share button copies short URL
- [ ] SMS delivery confirmed via Pertinax dashboard

## 🎯 Next Steps After Completion

1. Monitor SMS delivery rates
2. Check Pertinax balance regularly
3. Add more DLT templates (full payment, reminders)
4. Implement delivery status tracking
5. Add SMS analytics dashboard
