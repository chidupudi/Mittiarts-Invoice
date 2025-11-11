# Vercel Deployment - Quick Checklist ✅

## Before You Deploy

- [x] `.env` files are in `.gitignore`
- [x] `.env.example` created (template without secrets)
- [x] Code tested locally
- [x] All changes committed to Git

---

## Step-by-Step Deployment

### Step 1: Clean Up and Commit

```bash
# Remove temporary file
rm nul

# Check what will be committed
git status

# Add all files
git add .

# Commit
git commit -m "Implement Pertinax SMS integration with DLT compliance"

# Push to repository
git push origin main
```

### Step 2: Deploy to Vercel

**Choose one method:**

#### Method A: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/login
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **Add these environment variables:**

```
REACT_APP_PERTINAX_API_KEY = 2ogC0TMtJkioQY1eLYAt4w
REACT_APP_PERTINAX_SENDER_ID = MTARTS
REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID = 1207176268898361869
REACT_APP_SMS_CHANNEL = Trans
REACT_APP_PERTINAX_API_URL = http://pertinaxsolution.com/api/mt/SendSMS
```

**Important:** Check all three environments (Production, Preview, Development) for each variable

5. Click "Deploy"
6. Wait 2-5 minutes
7. Done! You'll get a URL like `https://mitti-arts-pos.vercel.app`

#### Method B: Vercel CLI (Advanced)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
cd d:\JS\Pos-Mittiarts
vercel

# Add environment variables
vercel env add REACT_APP_PERTINAX_API_KEY
# Enter: 2ogC0TMtJkioQY1eLYAt4w
# Select: Production, Preview, Development

vercel env add REACT_APP_PERTINAX_SENDER_ID
# Enter: MTARTS

vercel env add REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID
# Enter: 1207176268898361869

vercel env add REACT_APP_SMS_CHANNEL
# Enter: Trans

vercel env add REACT_APP_PERTINAX_API_URL
# Enter: http://pertinaxsolution.com/api/mt/SendSMS

# Deploy to production
vercel --prod
```

### Step 3: Test Deployment

1. **Check API Status:**
   ```
   https://YOUR-PROJECT.vercel.app/api/status
   ```
   Should return: `"status": "healthy"`

2. **Test SMS (optional):**
   ```bash
   curl -X POST https://YOUR-PROJECT.vercel.app/api/send-advance-sms \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"9441550927","customerName":"Test","advanceAmount":"100","invoiceLink":"https://test.link"}'
   ```

3. **Open your app:**
   ```
   https://YOUR-PROJECT.vercel.app
   ```

---

## Environment Variables to Set in Vercel

| Variable | Value | Required |
|----------|-------|----------|
| `REACT_APP_PERTINAX_API_KEY` | `2ogC0TMtJkioQY1eLYAt4w` | ✅ Yes |
| `REACT_APP_PERTINAX_SENDER_ID` | `MTARTS` | ✅ Yes |
| `REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID` | `1207176268898361869` | ✅ Yes |
| `REACT_APP_SMS_CHANNEL` | `Trans` | ✅ Yes |
| `REACT_APP_PERTINAX_API_URL` | `http://pertinaxsolution.com/api/mt/SendSMS` | ✅ Yes |

---

## Common Issues

### ❌ "Environment variables not available in build"
**Solution:** Make sure variables start with `REACT_APP_` and are set for all environments

### ❌ "Build failed"
**Solution:** Run `npm run build` locally first to check for errors

### ❌ "SMS not sending in production"
**Solution:** Check Vercel function logs in dashboard

### ❌ "404 on API endpoints"
**Solution:** Ensure `api/` folder is in root directory

---

## After Deployment

- [ ] Test SMS sending with real phone number
- [ ] Check all pages load correctly
- [ ] Verify Firebase connection works
- [ ] Monitor Vercel function logs
- [ ] Check Pertinax SMS balance
- [ ] Set up custom domain (optional)

---

## Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Your Project:** Will be shown after deployment
- **Documentation:** See VERCEL_DEPLOYMENT.md for complete guide

---

**Ready to deploy? Start with Step 1 above!** 🚀
