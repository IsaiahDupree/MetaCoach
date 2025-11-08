# MetaCoach Deployment Guide

## 🚀 Deploy to Vercel

### Prerequisites
- GitHub account
- Vercel account (free tier is fine)
- Meta App ID: `602248125600338`

---

## Step 1: Push to GitHub

The code is already configured to push to: https://github.com/IsaiahDupree/MetaCoach

```bash
# Stage all changes
git add .

# Commit
git commit -m "Add Instagram, Facebook, Threads, and Ads API integration"

# Push to GitHub
git push origin master
```

---

## Step 2: Deploy to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/new
2. Click **Import Git Repository**
3. Select `IsaiahDupree/MetaCoach`
4. Click **Deploy**

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Step 3: Configure Environment Variables in Vercel

After deployment, add these environment variables:

1. Go to your project in Vercel Dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following:

### Required Variables

```
META_APP_ID=602248125600338
META_APP_SECRET=576fc7ec240b308263fcd1b79ec830ec
META_REDIRECT_URL=https://your-app.vercel.app/api/meta/business-login/callback
PUBLIC_BASE_URL=https://your-app.vercel.app
```

### Optional (for Direct API Testing)

```
INSTAGRAM_ACCESS_TOKEN=<your-instagram-token>
FACEBOOK_ADS_ACCESS_TOKEN=<your-ads-token>
AD_ACCOUNT_ID=act_1130334212412487
WHATSAPP_ACCESS_TOKEN=<your-whatsapp-token>
WHATSAPP_PHONE_NUMBER_ID=851190418074116
```

**Important**: Replace `your-app.vercel.app` with your actual Vercel domain!

---

## Step 4: Update Meta App Settings

Go to https://developers.facebook.com/apps/602248125600338/settings/basic/

### Update Valid OAuth Redirect URIs

In **Facebook Login for Business → Settings → Valid OAuth Redirect URIs**:

```
https://your-app.vercel.app/api/meta/business-login/callback
https://your-app.vercel.app/api/meta/oauth/callback
```

### Update App Domains

In **Settings → Basic → App Domains**:

```
your-app.vercel.app
```

### Update Site URL

In **Settings → Basic → Site URL**:

```
https://your-app.vercel.app
```

---

## Step 5: Test the Deployment

1. Visit `https://your-app.vercel.app`
2. Click **🚀 Quick Setup**
3. Complete the Facebook Login for Business flow
4. Should redirect back to your dashboard!

---

## Troubleshooting

### "Invalid OAuth Redirect URI"
- Check that the callback URL in Vercel env vars matches Meta app settings
- Ensure both use `https://` (not `http://`)
- Verify App Domains includes your Vercel domain

### "App Not Set Up"
- Make sure **Facebook Login for Business** product is added to your Meta app
- Check that all required permissions are requested

### "Token Not Found"
- Cookies might not be working
- Check browser console for errors
- Verify environment variables are set in Vercel

### "CORS Errors"
- Ensure `PUBLIC_BASE_URL` matches your actual Vercel domain
- Check that Meta app's Site URL is configured

---

## Environment Differences

### Development (localhost:3000)
```
META_REDIRECT_URL=http://localhost:3000/api/meta/business-login/callback
PUBLIC_BASE_URL=http://localhost:3000
```

### Production (Vercel)
```
META_REDIRECT_URL=https://your-app.vercel.app/api/meta/business-login/callback
PUBLIC_BASE_URL=https://your-app.vercel.app
```

You can have **both** URLs configured in Meta's Valid OAuth Redirect URIs!

---

## Monitoring

### Vercel Logs
```bash
vercel logs <deployment-url>
```

### Meta App Dashboard
Check **Products → Webhooks → Recent Deliveries** for API errors

---

## Security Checklist

✅ `.env.local` is gitignored (never committed)  
✅ Environment variables set in Vercel dashboard  
✅ Tokens are stored in httpOnly cookies  
✅ OAuth state validation prevents CSRF  
✅ All API calls use secure HTTPS  

---

## Next Steps After Deployment

1. **Test all endpoints**:
   - Instagram media
   - Facebook posts
   - Ad campaigns
   - Threads posts

2. **Monitor usage**:
   - Check Meta App Dashboard for rate limits
   - Review Vercel analytics

3. **Get App Reviewed** (for public launch):
   - Submit for App Review in Meta Dashboard
   - Required to access data from users outside your app's test users

---

**Ready to deploy!** 🚀

Follow the steps above and your app will be live at https://your-app.vercel.app
