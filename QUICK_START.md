# Pertinax SMS - Quick Start Guide

## 🚀 Ready to Use

Your Mitti Arts POS system is now configured with Pertinax SMS!

### Current Status
- ✅ **Advance Payment SMS** - ACTIVE and ready to use
- ⏳ **Full Payment SMS** - Pending DLT registration
- ⏳ **Completion SMS** - Pending DLT registration

---

## Test Your Integration (3 Steps)

### Step 1: Start Your Application
```bash
npm start
```

### Step 2: Check API Status
Open browser and go to:
```
http://localhost:3000/api/status?testConnection=true
```

You should see:
```json
{
  "status": "healthy",
  "provider": "Pertinax SMS Gateway",
  "pertinaxStatus": {
    "reachable": true,
    "message": "Pertinax SMS API is responding correctly"
  }
}
```

### Step 3: Send Test SMS
```bash
curl -X POST http://localhost:3000/api/send-advance-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "YOUR_PHONE_NUMBER",
    "customerName": "Test Customer",
    "advanceAmount": "100.00",
    "invoiceLink": "https://test.link"
  }'
```

**Replace `YOUR_PHONE_NUMBER` with your actual number (10 digits, no country code)**

Expected SMS:
```
Dear Test Customer, advance payment of Rs.100.00 received. View invoice: https://test.link Thank you! - Mitti Arts
```

---

## Using in Your POS

When creating an advance payment invoice:

1. **Enter customer details** (name and phone number)
2. **Enter advance amount**
3. **Click "Complete Payment"**
4. **SMS sent automatically!**

The system will automatically:
- Validate phone number
- Build DLT-compliant message
- Send via Pertinax
- Show success/error message

---

## Common Issues

### ❌ SMS Not Sending?

**Check these:**

1. **Phone number format**
   - Must be 10 digits
   - Must start with 6, 7, 8, or 9
   - Example: `9441550927` ✅
   - Not: `+919441550927` ❌
   - Not: `09441550927` ❌

2. **Pertinax balance**
   - Check balance: http://pertinaxsolution.com/api/mt/GetBalance?APIKey=2ogC0TMtJkioQY1eLYAt4w
   - Recharge if needed

3. **Template registration**
   - Verify template ID: `1207176268898361869`
   - Check status in JIO DLT Portal

4. **Internet connection**
   - Pertinax API requires internet
   - Check firewall settings

---

## Next Steps

### 📝 Register Remaining Templates

You have 2 more templates to register on JIO DLT Portal:

#### Template 2: Full Payment Invoice
```
Dear {#var#}, your Mitti Arts invoice of Rs.{#var#} is ready. View invoice: {#var#} - MTARTS
```

#### Template 3: Payment Completion
```
Dear {#var#}, final payment of Rs.{#var#} received. Invoice: {#var#} Order complete. Thank you! - MTARTS
```

**How to register:**
1. Go to https://trueconnect.jio.com
2. Login with your credentials
3. Click "Content Template Registration"
4. Fill the form (see reference/referemnce.txt for details)
5. Submit and wait 24-48 hours
6. Get the 19-digit Template ID
7. Update `src/services/smsService.js` with the new template ID

**Need help?** Check [reference/referemnce.txt](reference/referemnce.txt) for complete template details.

---

## Files You Need to Know

### Configuration
- `.env` - API keys and template IDs
- `src/services/smsService.js` - SMS service (all SMS logic)

### API Endpoints
- `/api/send-advance-sms` - Send advance payment SMS ✅
- `/api/status` - Check system status

### Documentation
- `PERTINAX_SMS_IMPLEMENTATION.md` - Complete implementation guide
- `reference/referemnce.txt` - DLT template details
- `reference/docs.txt` - Pertinax API docs

---

## Quick Reference

### API Configuration
```
API Key: 2ogC0TMtJkioQY1eLYAt4w
Sender ID: MTARTS
Template ID: 1207176268898361869
Channel: Trans (Transactional)
```

### Phone Number Validation
```javascript
// Valid
9441550927 ✅
7382150250 ✅
8123456789 ✅

// Invalid
+919441550927 ❌ (has country code)
09441550927 ❌ (starts with 0)
5123456789 ❌ (starts with 5)
944155092 ❌ (only 9 digits)
```

### SMS Costs
- Transactional SMS: ~Rs. 0.15-0.25 per SMS
- Check balance regularly to avoid service interruption

---

## Support Contacts

### Technical Issues
- **Developer:** Check `PERTINAX_SMS_IMPLEMENTATION.md`
- **Logs:** Browser console for frontend errors
- **API Logs:** Check Vercel logs for backend errors

### Pertinax Support
- **Website:** http://pertinaxsolution.com
- **API Docs:** http://pertinaxsolution.com/Web/WebAPI/

### DLT Registration
- **Portal:** https://trueconnect.jio.com
- **Help:** JIO TrueConnect support

### Mitti Arts
- **Email:** info@mittiarts.com
- **Phone:** 9441550927

---

## 💡 Pro Tips

1. **Test with your own number first** before sending to customers
2. **Keep track of Pertinax balance** to avoid SMS failures
3. **Monitor SMS delivery** using Pertinax dashboard
4. **Register other templates ASAP** to enable full functionality
5. **Save customer SMS consent** for compliance

---

**Ready to send your first SMS?** 🎉

Just create an advance payment invoice in your POS and the SMS will be sent automatically!

---

**Last Updated:** January 11, 2025
