# Vercel Deployment Guide - Mitti Arts POS

## Prerequisites

1. **Vercel Account:** Sign up at https://vercel.com
2. **Vercel CLI:** Install globally
   ```bash
   npm install -g vercel
   ```
3. **Git Repository:** Code should be committed to Git

---

## Step 1: Prepare for Deployment

### 1.1 Verify .gitignore

Ensure `.env` and `.env.local` are in `.gitignore` to prevent exposing secrets:

```gitignore
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

✅ This is already configured in your project.

### 1.2 Create .env.example

A template for other developers (secrets removed):

```bash
# File: .env.example
REACT_APP_PERTINAX_API_KEY=your_pertinax_api_key_here
REACT_APP_PERTINAX_SENDER_ID=MTARTS
REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID=your_template_id_here
```

✅ Already created at `.env.example`

---

## Step 2: Commit Your Changes

```bash
# Remove the 'nul' file (it's a mistake)
rm nul

# Add all changes
git add .

# Commit with a descriptive message
git commit -m "Implement Pertinax SMS integration with DLT compliance

- Migrated from Zoko WhatsApp to Pertinax SMS Gateway
- Added advance payment SMS with DLT template (approved)
- Created serverless functions for SMS sending
- Added comprehensive documentation
- Updated API status endpoint
- Added environment variable configuration"

# Push to your repository
git push origin main
```

---

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Login to Vercel:** https://vercel.com
2. **Import Project:**
   - Click "Add New..." → "Project"
   - Select your GitHub/GitLab repository
   - Click "Import"

3. **Configure Project:**
   - **Framework Preset:** Create React App
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `build` (auto-detected)
   - **Install Command:** `npm install` (auto-detected)

4. **Add Environment Variables:**

   Click "Environment Variables" and add these:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `REACT_APP_PERTINAX_API_KEY` | `2ogC0TMtJkioQY1eLYAt4w` | Production, Preview, Development |
   | `REACT_APP_PERTINAX_SENDER_ID` | `MTARTS` | Production, Preview, Development |
   | `REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID` | `1207176268898361869` | Production, Preview, Development |
   | `REACT_APP_SMS_CHANNEL` | `Trans` | Production, Preview, Development |
   | `REACT_APP_PERTINAX_API_URL` | `http://pertinaxsolution.com/api/mt/SendSMS` | Production, Preview, Development |

   **Note:** For each variable, check all three environments (Production, Preview, Development)

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete (2-5 minutes)
   - You'll get a URL like: `https://your-project.vercel.app`

---

### Option B: Deploy via Vercel CLI

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy (First Time):**
   ```bash
   cd d:\JS\Pos-Mittiarts
   vercel
   ```

   **Answer the prompts:**
   - Set up and deploy? → `Y`
   - Which scope? → Select your account
   - Link to existing project? → `N`
   - What's your project's name? → `mitti-arts-pos` (or your choice)
   - In which directory is your code located? → `./`
   - Want to override settings? → `N`

3. **Add Environment Variables:**
   ```bash
   # Add each environment variable
   vercel env add REACT_APP_PERTINAX_API_KEY
   # When prompted, enter: 2ogC0TMtJkioQY1eLYAt4w
   # Select: Production, Preview, Development (use space to select, enter to confirm)

   vercel env add REACT_APP_PERTINAX_SENDER_ID
   # Enter: MTARTS

   vercel env add REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID
   # Enter: 1207176268898361869

   vercel env add REACT_APP_SMS_CHANNEL
   # Enter: Trans

   vercel env add REACT_APP_PERTINAX_API_URL
   # Enter: http://pertinaxsolution.com/api/mt/SendSMS
   ```

4. **Deploy to Production:**
   ```bash
   vercel --prod
   ```

---

## Step 4: Verify Deployment

### 4.1 Check Build Status

After deployment completes, Vercel will show:
```
✓ Production: https://your-project.vercel.app [copied to clipboard]
```

### 4.2 Test Endpoints

**1. Check API Status:**
```bash
curl https://your-project.vercel.app/api/status
```

Expected response:
```json
{
  "status": "healthy",
  "provider": "Pertinax SMS Gateway",
  "version": "3.0.0"
}
```

**2. Test SMS Sending:**
```bash
curl -X POST https://your-project.vercel.app/api/send-advance-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "9441550927",
    "customerName": "Test User",
    "advanceAmount": "100.00",
    "invoiceLink": "https://test.link"
  }'
```

### 4.3 Check Environment Variables

In Vercel Dashboard:
1. Go to your project
2. Click "Settings" → "Environment Variables"
3. Verify all 5 variables are present

---

## Step 5: Configure Custom Domain (Optional)

1. **Go to Vercel Dashboard** → Your Project → "Settings" → "Domains"
2. **Add Domain:** Enter your domain (e.g., `pos.mittiarts.com`)
3. **Configure DNS:**
   - Type: CNAME
   - Name: pos (or @)
   - Value: cname.vercel-dns.com
4. **Wait for DNS propagation** (5-60 minutes)

---

## Environment Variables Reference

### Required Variables (Must be set)

```bash
# Pertinax SMS API Key (Secret - Do NOT commit to Git)
REACT_APP_PERTINAX_API_KEY=2ogC0TMtJkioQY1eLYAt4w

# Sender ID registered with Pertinax
REACT_APP_PERTINAX_SENDER_ID=MTARTS

# DLT Template ID for advance payment SMS
REACT_APP_DLT_ADVANCE_PAYMENT_TEMPLATE_ID=1207176268898361869

# SMS Channel (Trans = Transactional)
REACT_APP_SMS_CHANNEL=Trans

# Pertinax API URL
REACT_APP_PERTINAX_API_URL=http://pertinaxsolution.com/api/mt/SendSMS
```

### Optional Variables (Not currently used)

```bash
# Future DLT Template IDs
REACT_APP_DLT_FULL_PAYMENT_TEMPLATE_ID=
REACT_APP_DLT_PAYMENT_COMPLETE_TEMPLATE_ID=
```

---

## Troubleshooting

### Build Fails

**Error:** `Module not found`
**Solution:** Run `npm install` locally first to update package-lock.json

**Error:** `Environment variables not available`
**Solution:** Ensure all `REACT_APP_*` variables are set in Vercel dashboard

### SMS Not Sending in Production

**Check:**
1. Environment variables are set correctly in Vercel
2. Pertinax API is accessible from Vercel servers
3. Check Vercel function logs: Dashboard → Project → "Functions" tab
4. Verify API endpoint works: `https://your-project.vercel.app/api/status`

### Serverless Function Timeout

**Error:** `Function execution timed out`
**Solution:**
- Vercel has a 10-second timeout for Hobby plan
- Upgrade to Pro plan for 60-second timeout
- Or optimize SMS API calls

---

## Vercel Configuration Files

### vercel.json (Already in your project)

Check if you have `vercel.json` in your project root:

```json
{
  "functions": {
    "api/**/*.js": {
      "memory": 1024,
      "maxDuration": 10
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ]
}
```

---

## Continuous Deployment

Once set up, Vercel automatically:
- **Builds and deploys** on every `git push` to main branch
- **Creates preview deployments** for pull requests
- **Runs checks** before deploying

### Disable Auto-Deploy (Optional)

In Vercel Dashboard:
1. Project → "Settings" → "Git"
2. Toggle "Production Branch" or "Preview Deployments"

---

## Security Best Practices

### 1. Never Commit Secrets
✅ `.env` files are in `.gitignore`
✅ Use `.env.example` for templates

### 2. Use Vercel Environment Variables
✅ All secrets stored securely in Vercel
✅ Different variables for Production/Preview/Development

### 3. Rotate API Keys
- Change `REACT_APP_PERTINAX_API_KEY` periodically
- Update in Vercel dashboard when changed

### 4. Limit CORS
Currently set to `*` in API endpoints. For production, restrict to your domain:
```javascript
res.setHeader('Access-Control-Allow-Origin', 'https://your-domain.com');
```

---

## Monitoring & Logs

### View Logs

**Vercel Dashboard:**
1. Go to your project
2. Click "Functions" or "Deployments"
3. Click on a function to see logs

**Vercel CLI:**
```bash
vercel logs
```

### Enable Monitoring

Consider integrating:
- **Sentry** - Error tracking
- **LogRocket** - Session replay
- **Vercel Analytics** - Built-in analytics

---

## Cost Estimation

### Vercel Pricing (as of 2025)

**Hobby Plan (Free):**
- 100 GB bandwidth/month
- 100 GB-hours serverless execution
- Good for testing and small traffic

**Pro Plan ($20/month):**
- 1 TB bandwidth/month
- 1000 GB-hours serverless execution
- 60-second function timeout (vs 10s)
- Better for production

### Pertinax SMS Costs
- ~Rs. 0.15-0.25 per SMS
- Monitor usage to avoid unexpected bills

---

## Post-Deployment Checklist

- [ ] All environment variables set in Vercel
- [ ] `/api/status` endpoint returns healthy
- [ ] Test advance payment SMS works
- [ ] Firebase connection works (if using Firebase)
- [ ] Custom domain configured (if applicable)
- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Monitor logs for errors
- [ ] Set up error tracking (Sentry/etc)
- [ ] Configure production CORS settings
- [ ] Update documentation with production URL

---

## Quick Commands Reference

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# List environment variables
vercel env ls

# Pull environment variables to local .env
vercel env pull

# Remove deployment
vercel remove [deployment-url]

# Open project in browser
vercel open
```

---

## Support

### Vercel Support
- **Documentation:** https://vercel.com/docs
- **Community:** https://github.com/vercel/vercel/discussions
- **Support:** support@vercel.com (Pro plan)

### Pertinax Support
- **Website:** http://pertinaxsolution.com
- **Documentation:** http://pertinaxsolution.com/Web/WebAPI/

---

## Next Steps After Deployment

1. **Test thoroughly** with real phone numbers
2. **Monitor SMS delivery** in Pertinax dashboard
3. **Register remaining DLT templates** (full payment, completion)
4. **Set up monitoring** and error tracking
5. **Configure custom domain** for production use
6. **Enable HTTPS** (automatic with Vercel)
7. **Set up CI/CD** for automated testing

---

**Your deployment is ready!** 🚀

Access your app at: `https://your-project.vercel.app`

---

**Last Updated:** January 11, 2025
