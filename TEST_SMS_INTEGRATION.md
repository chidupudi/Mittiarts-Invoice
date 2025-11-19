# SMS Integration - Testing & Verification Guide

## ✅ Prerequisites Completed

- ✅ Firestore rules updated with `shortToken` support
- ✅ IP Validation disabled in Pertinax dashboard

## 🧪 Test Plan

### Test 1: Create New Order with Advance Payment

**Steps:**
1. Login to your application
2. Go to Billing page
3. Create a new order with:
   - Customer with valid phone number (10 digits)
   - Select products
   - Choose **Advance Payment**
   - Enter advance amount
   - Complete order

**Expected Results:**
- ✅ Order created successfully
- ✅ Console shows: `🔗 Short token generated: XXXX`
- ✅ Console shows: `📱 Using short URL for SMS: invoice.mittiarts.com/i/XXXX (28 chars)`
- ✅ SMS sent successfully (check console for success message)
- ✅ Customer receives SMS with short URL

**Check Console Logs:**
```
✅ Mitti Arts order created successfully: [order-id]
✅ 🔗 Share token generated: [token]
✅ 🔗 Short token generated: [4-char-token]
✅ 📱 Using short URL for SMS: invoice.mittiarts.com/i/XXXX (28 chars)
✅ SMS sent successfully: [message-id]
```

---

### Test 2: Test Short URL Redirect (Logged Out)

**Steps:**
1. Note the short URL from the SMS or console: `invoice.mittiarts.com/i/XXXX`
2. **Logout** from the application
3. Open new browser tab (incognito/private mode)
4. Navigate to: `https://invoice.mittiarts.com/i/XXXX` (replace XXXX with actual token)

**Expected Results:**
- ✅ Loading screen appears briefly
- ✅ Console shows: `🔗 Resolving short URL token: XXXX`
- ✅ Console shows: `✅ Redirecting to full invoice: [shareToken]`
- ✅ Invoice page loads without requiring login
- ✅ Full invoice details visible

**If Error Occurs:**
- ❌ "Missing or insufficient permissions" → Firestore rules not applied correctly
- ❌ "Invoice not found" → Short token not stored in database
- ❌ "Invoice link is incomplete" → ShareToken missing

---

### Test 3: Share Existing Invoice

**Steps:**
1. Login to application
2. Go to **Invoices** page
3. Open any existing invoice
4. Click **"Share Invoice"** button (green button with share icon)

**Expected Results:**
- ✅ Button shows loading state briefly
- ✅ Success message: "🎉 Short link copied to clipboard!"
- ✅ Console shows: `🔧 Generating short token for existing order...` (if no token exists)
- ✅ Console shows: `✅ Short token generated: XXXX`
- ✅ Console shows: `✅ Tokens saved to Firebase`
- ✅ Short URL copied to clipboard

**Verify Clipboard:**
1. Paste from clipboard (Ctrl+V / Cmd+V)
2. Should show: `invoice.mittiarts.com/i/XXXX`
3. URL length should be exactly **28 characters**

---

### Test 4: Manual API Test (Optional)

**Test Pertinax API directly:**

#### Check Balance
```bash
curl "http://pertinaxsolution.com/api/mt/GetBalance?APIKey=2ogC0TMtJkioQY1eLYAt4w"
```

**Expected Response:**
```json
{
  "ErrorCode": "0",
  "ErrorMessage": "Done",
  "Balance": "Promo:XXXX|Trans:XXXX"
}
```

#### Send Test SMS
```bash
curl "http://pertinaxsolution.com/api/mt/SendSMS?APIKey=2ogC0TMtJkioQY1eLYAt4w&senderid=MTARTS&channel=Trans&DCS=0&flashsms=0&number=919441550927&text=Dear%20Test,%20advance%20payment%20of%20Rs.100.00%20received.%20View%20invoice:%20invoice.mittiarts.com/i/TEST%20Thank%20you!%20-%20Mitti%20Arts&DLTTemplateId=1207176268898361869"
```

**Expected Response:**
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

---

## 🐛 Troubleshooting

### Issue 1: "api restriction" Error
**Status**: Should be fixed (IP Validation disabled)

**Verify:**
1. Check Pertinax dashboard → Settings → IP Validation
2. Ensure it's **DISABLED**
3. Try test SMS again

---

### Issue 2: "Missing or insufficient permissions"
**Status**: Should be fixed (Firestore rules updated)

**Verify Firestore Rules:**
1. Go to Firebase Console
2. Firestore Database → Rules tab
3. Check line with `match /orders/{orderId}`
4. Should include: `resource.data.shortToken != null`

**Correct Rule:**
```javascript
match /orders/{orderId} {
  allow read: if resource.data.shareToken != null ||
                resource.data.billToken != null ||
                resource.data.shortToken != null;
  // ... rest
}
```

**If Still Failing:**
- Click **Publish** again in Firebase Console
- Wait 1-2 minutes for rules to propagate
- Clear browser cache
- Try in incognito mode

---

### Issue 3: SMS Not Sending

**Check Console Logs:**
```javascript
// Look for these messages:
📱 Sending advance payment SMS via Pertinax...
📡 Calling /api/send-advance-sms for advance SMS...
📊 advance SMS Response: { success: true, ... }
✅ SMS sent successfully: [messageId]
```

**Common Causes:**
1. **Invalid phone number** - Must be 10 digits starting with 6-9
2. **Insufficient balance** - Check balance via API
3. **Template mismatch** - SMS text must match DLT template exactly
4. **Wrong template ID** - Verify: `1207176268898361869`

**Verify SMS Text Format:**
```
Dear [Name], advance payment of Rs.[Amount] received. View invoice: invoice.mittiarts.com/i/[Token] Thank you! - Mitti Arts
```

---

### Issue 4: Short Token Not Generated

**Check Order Document in Firebase:**
1. Go to Firebase Console → Firestore
2. Open `orders` collection
3. Find recent order
4. Check fields:
   - `shareToken` - Should exist (long string)
   - `shortToken` - Should exist (4 characters)

**If Missing:**
- Order was created before short token feature
- Click "Share Invoice" to generate tokens retroactively

---

## ✅ Success Indicators

### Console Logs (Success)
```
✅ Mitti Arts order created successfully
✅ 🔗 Share token generated: [token]
✅ 🔗 Short token generated: K7mX
✅ 📱 Using short URL for SMS: invoice.mittiarts.com/i/K7mX (28 chars)
✅ 📱 Sending advance payment SMS via Pertinax...
✅ 📡 Calling /api/send-advance-sms for advance SMS...
✅ 📊 advance SMS Response: { success: true, messageId: "...", jobId: "..." }
✅ SMS sent successfully: mvHdpSyS7UOs9hjxixQLvw
```

### Firestore Document (Success)
```javascript
{
  orderNumber: "MA-12345678",
  shareToken: "abc123xyz789...",
  shortToken: "K7mX",  // ← 4 characters
  isAdvanceBilling: true,
  advanceAmount: 5000,
  smsDelivery: {
    status: "sent",
    messageId: "mvHdpSyS7UOs9hjxixQLvw",
    sentAt: "2025-01-19T...",
    phoneNumber: "9441550927",
    provider: "Pertinax SMS"
  }
}
```

### SMS Received (Success)
```
Dear John Doe, advance payment of Rs.5000.00 received. View invoice: invoice.mittiarts.com/i/K7mX Thank you! - Mitti Arts

From: MTARTS
```

---

## 📊 Monitoring

### Check SMS Delivery Status

**Via API:**
```bash
# Replace jobid with actual JobId from send response
curl "http://pertinaxsolution.com/api/mt/GetDelivery?APIKey=2ogC0TMtJkioQY1eLYAt4w&jobid=20047"
```

**Response:**
```json
{
  "ErrorCode": "0",
  "ErrorMessage": "Done",
  "DeliveryReports": [
    {
      "MessageId": "mvHdpSyS7UOs9hjxixQLvw",
      "DeliveryStatus": "Delivered",
      "DeliveryDate": "2025-01-19T06:17:00"
    }
  ]
}
```

### Check Pertinax Dashboard
1. Login to [Pertinax Dashboard](http://pertinaxsolution.com)
2. Go to **Reports** or **SMS History**
3. Verify:
   - SMS sent successfully
   - Delivery status
   - Remaining balance

---

## 🎯 Next Steps After Successful Testing

1. **Deploy to Production** (if testing locally)
   ```bash
   git add .
   git commit -m "Implement short URL SMS integration with Pertinax"
   git push
   ```

2. **Monitor First Week**
   - Check SMS delivery rates
   - Monitor Pertinax balance
   - Track short URL click rates
   - Verify customer feedback

3. **Future Enhancements**
   - Register more DLT templates (full payment, reminders)
   - Add SMS analytics dashboard
   - Implement delivery status tracking
   - Add retry mechanism for failed SMS

---

## 📞 Support

**Pertinax Support:**
- Website: http://pertinaxsolution.com
- Check API docs: http://pertinaxsolution.com/Web/WebAPI/

**Firebase Support:**
- Console: https://console.firebase.google.com
- Security rules docs: https://firebase.google.com/docs/firestore/security/get-started

---

## ✅ Final Verification Checklist

- [ ] Test 1: New order with advance payment - SMS sent
- [ ] Test 2: Short URL redirect works without login
- [ ] Test 3: Share existing invoice - URL copied
- [ ] Test 4: Manual API test - Balance checked
- [ ] Console logs show all success messages
- [ ] Firebase document has both tokens
- [ ] Customer received SMS with short URL
- [ ] Short URL is exactly 28 characters
- [ ] Invoice loads correctly from short URL

**All tests passed? 🎉 Your SMS integration is complete!**
