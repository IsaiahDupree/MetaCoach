# Setup Custom Domain: www.matrixloop.app

## 🌐 Step 1: Add Domain in Vercel

1. Go to: https://vercel.com/isaiahduprees-projects/metacoach/settings/domains
2. Click **Add Domain**
3. Enter: `www.matrixloop.app`
4. Click **Add**

Vercel will provide DNS records to configure.

---

## 📋 Step 2: Configure DNS

In your domain registrar (where you bought matrixloop.app):

### Add CNAME Record:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: Auto (or 3600)
```

**Wait 5-10 minutes for DNS propagation**

---

## ⚙️ Step 3: Update Environment Variables

Go to: https://vercel.com/isaiahduprees-projects/metacoach/settings/environment-variables

Update or add these variables for **Production**:

### Update META_REDIRECT_URL:
```
Key: META_REDIRECT_URL
Value: https://www.matrixloop.app/api/meta/oauth/callback
Environment: Production ✓
```

### Update PUBLIC_BASE_URL:
```
Key: PUBLIC_BASE_URL
Value: https://www.matrixloop.app
Environment: Production ✓
```

### Ensure these exist too:
```
META_APP_ID=453049510987286
META_APP_SECRET=576fc7ec240b308263fcd1b79ec830ec
```

---

## 🔐 Step 4: Update Meta App Settings

Go to: https://developers.facebook.com/apps/453049510987286/settings/basic

### Update Valid OAuth Redirect URIs:
Add:
```
https://www.matrixloop.app/api/meta/oauth/callback
https://www.matrixloop.app/api/meta/business-login/callback
```

### Update App Domains:
Add:
```
matrixloop.app
www.matrixloop.app
```

### Update Site URL:
```
https://www.matrixloop.app
```

### Update Data Deletion URL:
```
https://www.matrixloop.app/api/facebook/data-deletion
```

**Click Save Changes!**

---

## 🚀 Step 5: Redeploy

After all settings are updated, redeploy:

```bash
$env:VERCEL_TOKEN='sOEzpkIKX1hC2QOKIVcDnxF9'; vercel --prod --yes
```

Or click **Redeploy** in Vercel dashboard.

---

## ✅ Verify Deployment

1. Visit: https://www.matrixloop.app
2. Click **🚀 Quick Setup**
3. Complete OAuth flow
4. Should redirect back successfully to your dashboard

---

## 🔄 Alternative: Use Apex Domain (matrixloop.app)

If you prefer without www:

### Vercel:
- Add `matrixloop.app` instead of `www.matrixloop.app`

### DNS:
```
Type: A
Name: @
Value: 76.76.21.21
```

### Environment Variables:
```
META_REDIRECT_URL=https://matrixloop.app/api/meta/oauth/callback
PUBLIC_BASE_URL=https://matrixloop.app
```

---

**Your custom domain**: https://www.matrixloop.app 🚀
