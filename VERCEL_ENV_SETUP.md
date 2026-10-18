# Vercel Environment Variables Setup

## 🔗 Your Vercel Project
**URL**: https://vercel.com/isaiahduprees-projects/metacoach

---

## ⚙️ Add Environment Variables (Via Dashboard - Easiest)

### Step 1: Go to Settings
1. Visit: https://vercel.com/isaiahduprees-projects/metacoach/settings/environment-variables
2. You'll see "Environment Variables" page

### Step 2: Add Each Variable

Click **Add New** and add these one by one:

#### Required Variables (Production):

**1. META_APP_ID**
```
Key: META_APP_ID
Value: 453049510987286
Environment: Production ✓
```

**2. META_APP_SECRET**
```
Key: META_APP_SECRET
Value: 576fc7ec240b308263fcd1b79ec830ec
Environment: Production ✓
```

**3. META_REDIRECT_URL**
```
Key: META_REDIRECT_URL
Value: https://metacoach-sage.vercel.app/api/meta/oauth/callback
Environment: Production ✓
```
*(Note: Update with your actual Vercel URL after first deployment)*

**4. PUBLIC_BASE_URL**
```
Key: PUBLIC_BASE_URL
Value: https://metacoach-sage.vercel.app
Environment: Production ✓
```
*(Note: Update with your actual Vercel URL after first deployment)*

---

## 🚀 Deploy After Adding Variables

Once all variables are added:

```bash
vercel --prod --yes
```

Or just click **Deploy** in the Vercel dashboard!

---

## 🌐 Custom Domain Setup (Optional)

### Add metacoach.matrixloop.app

1. Go to: https://vercel.com/isaiahduprees-projects/metacoach/settings/domains
2. Click **Add Domain**
3. Enter: `metacoach.matrixloop.app`
4. Follow DNS instructions

**Then update environment variables**:
```
META_REDIRECT_URL=https://metacoach.matrixloop.app/api/meta/oauth/callback
PUBLIC_BASE_URL=https://metacoach.matrixloop.app
```

---

## 📋 Complete Variable List (Copy-Paste Ready)

For easy reference, here are all the variables:

```bash
# Required - Meta App
META_APP_ID=453049510987286
META_APP_SECRET=${META_APP_SECRET}
META_REDIRECT_URL=https://metacoach-sage.vercel.app/api/meta/oauth/callback
PUBLIC_BASE_URL=https://metacoach-sage.vercel.app

# Optional - Database (when ready)
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Optional - AI (when ready)
OPENAI_API_KEY=<your-openai-key>

# Optional - Analytics (when ready)
POSTHOG_API_KEY=<your-posthog-key>
POSTHOG_HOST=https://app.posthog.com
```

---

## 🧪 After Deployment

### 1. Get Your Deployment URL
After deploying, Vercel will give you a URL like:
```
https://metacoach-sage.vercel.app
```

### 2. Update Meta App Settings
Go to: https://developers.facebook.com/apps/453049510987286/settings/basic/

**Add to Valid OAuth Redirect URIs**:
```
https://metacoach-sage.vercel.app/api/meta/oauth/callback
https://metacoach-sage.vercel.app/api/meta/business-login/callback
```

**Add to App Domains**:
```
metacoach-sage.vercel.app
```

### 3. Update Environment Variables (if needed)
If your URL is different, update:
- `META_REDIRECT_URL`
- `PUBLIC_BASE_URL`

Then **Redeploy** from Vercel dashboard

---

## ✅ Verification Checklist

After deployment:
- [ ] Visit your Vercel URL
- [ ] Click "Quick Setup" button
- [ ] Complete OAuth flow
- [ ] Should redirect back successfully
- [ ] Dashboard loads with Instagram data

---

## 🐛 Troubleshooting

### "Can't Load URL" Error
→ Check Meta app's Valid OAuth Redirect URIs match exactly

### "Environment Variable Not Found"
→ Redeploy after adding variables (deployments don't auto-update)

### "Invalid OAuth Redirect"
→ Ensure URL uses `https://` and matches Meta app settings

---

## 🔧 Quick Deploy Command

After env vars are set in dashboard:

```bash
# Make sure you're in the project directory
cd c:\Users\Isaia\Documents\Coding\MetaCoach

# Deploy to production
vercel --prod --yes
```

---

**Your Vercel Project**: https://vercel.com/isaiahduprees-projects/metacoach

After adding env vars, just run `vercel --prod --yes` to deploy! 🚀
