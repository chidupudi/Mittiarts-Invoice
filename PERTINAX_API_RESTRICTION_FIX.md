# Pertinax API Restriction Error - Troubleshooting Guide

## Current Issue

**Error:** `api restriction` (HTTP 400)
**Location:** `/api/send-advance-sms` endpoint
**API Response:** `{status: 400, error: 'api restriction'}`

---

## Possible Causes

### 1. IP Address Restriction
Pertinax might be blocking requests from Vercel's IP addresses.

**Solution:**
- Login to Pertinax dashboard
- Check "API Settings" or "Security Settings"
- Look for "Whitelisted IPs" or "Allowed IPs"
- Either:
  - Disable IP restriction (for testing)
  - Add Vercel's IP ranges (not practical - Vercel uses dynamic IPs)
  - Set to "Allow all IPs"

### 2. Domain/Referrer Restriction
Pertinax might only allow requests from specific domains.

**Solution:**
- Check Pertinax dashboard for "Allowed Domains" or "CORS Settings"
- Add your domain: `invoice.mittiarts.com`
- Add for testing: `*.vercel.app`

### 3. API Key Not Activated
The API key might not be fully activated or has restrictions.

**Solution:**
- Contact Pertinax support
- Verify API key status: `2ogC0TMtJkioQY1eLYAt4w`
- Check if key is active for:
  - Transactional SMS
  - API access (not just dashboard)
  - Your account has sufficient balance

### 4. Account Type Restriction
Your Pertinax account might be in "test mode" or requires upgrade.

**Solution:**
- Check account type in Pertinax dashboard
- Upgrade to production/API access tier if needed
- Verify account is not suspended or in test mode

### 5. Template Not Approved for API Use
DLT template might be approved for dashboard but not API.

**Solution:**
- Login to Pertinax dashboard
- Check template status for API access
- Template ID: `1207176268898361869`
- Sender ID: `MTARTS`

---

## Immediate Testing Steps

### Step 1: Test Pertinax API Balance Check

This tests basic API connectivity:

```bash
curl "http://pertinaxsolution.com/api/mt/GetBalance?APIKey=2ogC0TMtJkioQY1eLYAt4w"
```

**Expected Response:**
```json
{
  "ErrorCode": "0",
  "ErrorMessage": "Done",
  "Balance": "Promo:XXXX|Trans:YYYY"
}
```

**If this fails:** API key or account issue

### Step 2: Test SMS Send Directly

Test sending SMS bypassing Vercel:

```bash
curl -X GET "http://pertinaxsolution.com/api/mt/SendSMS?APIKey=2ogC0TMtJkioQY1eLYAt4w&senderid=MTARTS&channel=Trans&DCS=0&flashsms=0&number=919441550927&text=Test%20message%20from%20API&DLTTemplateId=1207176268898361869"
```

**Expected Response:**
```json
{
  "ErrorCode": "000",
  "ErrorMessage": "Done",
  "JobId": "12345",
  "MessageData": [...]
}
```

**Possible Error Responses:**
- `"api restriction"` - IP/Domain restriction
- `"invalid api key"` - API key issue
- `"insufficient balance"` - No credits
- `"invalid template"` - Template not approved

### Step 3: Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Your Project → "Deployments" → Latest deployment
3. Click "Functions" tab
4. Find `/api/send-advance-sms`
5. Check logs for actual Pertinax response

Look for:
```
📊 Pertinax Raw Response: ...
```

This will show the exact error from Pertinax.

---

## Solutions by Error Type

### Error: "api restriction"

**Most Likely Cause:** IP or domain restriction

**Fix:**
1. Login to Pertinax account
2. Go to Settings → API Settings → Security
3. Options:
   - **Best:** Set "Allowed IPs" to `0.0.0.0/0` (allow all)
   - **Alternative:** Add referrer domain `invoice.mittiarts.com`
4. Save changes
5. Test again

### Error: "invalid api key"

**Fix:**
1. Verify API key in Pertinax dashboard
2. Check if key is active
3. Regenerate API key if needed
4. Update Vercel environment variables with new key

### Error: "insufficient balance"

**Fix:**
1. Check balance: Step 1 above
2. Recharge account at Pertinax
3. Minimum balance: ₹100 recommended

### Error: "invalid template" or "template not registered"

**Fix:**
1. Login to JIO DLT Portal
2. Check template status: `1207176268898361869`
3. Verify template is approved
4. Check sender ID `MTARTS` is registered
5. Ensure template content matches exactly:
   ```
   Dear {#var#}, advance payment of Rs.{#var#} received. View invoice: {#var#} Thank you! - Mitti Arts
   ```

---

## Contact Pertinax Support

If none of the above work, contact Pertinax:

**Email Template:**

```
Subject: API Restriction Error - API Key 2ogC0TMt...

Hello Pertinax Support Team,

I'm getting an "api restriction" error when calling your SMS API from my application.

Details:
- API Key: 2ogC0TMtJkioQY1eLYAt4w (first 8 chars)
- Endpoint: http://pertinaxsolution.com/api/mt/SendSMS
- Error: "api restriction" (HTTP 400)
- Sender ID: MTARTS
- DLT Template ID: 1207176268898361869
- Application Domain: invoice.mittiarts.com
- Hosting: Vercel (serverless)

The API works when tested from my local machine but fails from Vercel servers.

Could you please:
1. Check if there are IP restrictions on my account
2. Verify if my API key is active for serverless/cloud hosting
3. Confirm if I need to whitelist any domains

Thank you!
```

---

## Temporary Workaround

While fixing the API restriction, you can:

### Option 1: Use Direct SMS (No API)
Manually send SMS from Pertinax dashboard

### Option 2: Create Local Proxy
Run a local server that calls Pertinax API:
- Deploy a small Node.js server on a VPS (DigitalOcean, etc.)
- This server calls Pertinax API
- Vercel calls your VPS instead
- VPS forwards to Pertinax

### Option 3: Use Different SMS Provider Temporarily
- Fast2SMS
- MSG91
- Twilio
Until Pertinax issue is resolved

---

## Environment Variable Check

Ensure these are set in Vercel:

```bash
# Required
REACT_APP_PERTINAX_API_KEY=2ogC0TMtJkioQY1eLYAt4w
REACT_APP_PERTINAX_SENDER_ID=MTARTS
REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID=1207176268898361869
REACT_APP_SMS_CHANNEL=Trans
REACT_APP_PERTINAX_API_URL=http://pertinaxsolution.com/api/mt/SendSMS

# Build config
CI=false
```

---

## Testing Checklist

- [ ] Balance check API works
- [ ] Direct SMS API works (from terminal)
- [ ] API key is active
- [ ] Account has balance
- [ ] DLT template is approved
- [ ] Sender ID is registered
- [ ] IP restrictions disabled/configured
- [ ] Domain restrictions disabled/configured
- [ ] Vercel environment variables are set
- [ ] Latest code is deployed to Vercel

---

## Expected Timeline

- **API restriction fix:** Immediate (if you have dashboard access)
- **Pertinax support response:** 24-48 hours
- **Template approval:** Already done ✅
- **Alternative solution:** 1-2 hours

---

## Next Steps

1. **Run Step 1 & 2 tests above** to identify exact error
2. **Check Pertinax dashboard** for security settings
3. **If not resolved:** Contact Pertinax support
4. **Meanwhile:** Code is ready, just waiting for API access

---

**Last Updated:** January 11, 2025
**Status:** Investigating API restriction error
**Code Status:** ✅ Ready and deployed
**API Status:** ⏳ Pending Pertinax configuration
