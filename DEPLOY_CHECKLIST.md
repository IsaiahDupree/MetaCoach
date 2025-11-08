# 🚀 Deployment Checklist

## ✅ Step 1: GitHub (DONE!)
- [x] Code pushed to https://github.com/IsaiahDupree/MetaCoach

---

## 📦 Step 2: Deploy to Vercel

### Quick Deploy
1. Go to https://vercel.com/new
2. Import from GitHub: `IsaiahDupree/MetaCoach`
3. Click **Deploy**
4. Wait for deployment to complete
5. Note your URL (e.g., `metacoach-xyz.vercel.app`)

### Or use CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

---

## ⚙️ Step 3: Configure Vercel Environment Variables

Go to: **Project Settings → Environment Variables**

Add these (required):
```
META_APP_ID=602248125600338
META_APP_SECRET=576fc7ec240b308263fcd1b79ec830ec
META_REDIRECT_URL=https://YOUR-APP.vercel.app/api/meta/business-login/callback
PUBLIC_BASE_URL=https://YOUR-APP.vercel.app
```

Optional (for direct API testing):
```
INSTAGRAM_ACCESS_TOKEN=<your-token>
FACEBOOK_ADS_ACCESS_TOKEN=<your-token>
AD_ACCOUNT_ID=act_1130334212412487
WHATSAPP_ACCESS_TOKEN=<your-token>
WHATSAPP_PHONE_NUMBER_ID=851190418074116
```

**⚠️ Replace `YOUR-APP` with your actual Vercel domain!**

After adding env vars, click **Redeploy** for changes to take effect.

---

## 🔐 Step 4: Update Meta App Settings

Go to: https://developers.facebook.com/apps/602248125600338

### A. Add Products (if not already added)
1. **Facebook Login for Business** → Set Up
2. **Instagram Graph API** → Set Up

### B. Configure Valid OAuth Redirect URIs

In **Facebook Login for Business → Settings**:
```
https://YOUR-APP.vercel.app/api/meta/business-login/callback
https://YOUR-APP.vercel.app/api/meta/oauth/callback
```

### C. Update App Domains

In **Settings → Basic → App Domains**:
```
YOUR-APP.vercel.app
```

### D. Update Site URL

In **Settings → Basic → Site URL**:
```
https://YOUR-APP.vercel.app
```

### E. Save Changes
Click **Save Changes** at the bottom!

---

## 🧪 Step 5: Test the Deployment

1. Visit `https://YOUR-APP.vercel.app`
2. Click **🚀 Quick Setup (Recommended)**
3. Complete Facebook Login for Business flow
4. Should redirect back to your dashboard!

### Test Endpoints
- `/api/meta/me` - Get your pages
- `/api/meta/media?ig_user_id=<ID>` - Get Instagram posts
- `/api/meta/ads/accounts` - Get ad accounts

---

## 🐛 Troubleshooting

### "Invalid OAuth Redirect URI"
- ✅ Check Meta app settings have correct Vercel URL
- ✅ Ensure URLs use `https://` (not `http://`)
- ✅ No trailing slashes in URLs

### "App Not Set Up"
- ✅ Add Facebook Login for Business product to Meta app
- ✅ Add Instagram Graph API product to Meta app

### "Environment Variables Not Working"
- ✅ Click **Redeploy** in Vercel after adding env vars
- ✅ Check spelling (no typos)
- ✅ Wait 1-2 minutes for deployment to finish

### "CORS Errors"
- ✅ Ensure `PUBLIC_BASE_URL` matches your Vercel domain
- ✅ Check Meta app's App Domains setting

---

## 📊 Monitor Your Deployment

### Vercel Dashboard
- View logs: `vercel logs`
- Check analytics
- Monitor errors

### Meta App Dashboard  
- Check API usage
- View error logs
- Monitor rate limits

---

## 🎉 Success Criteria

✅ App loads at Vercel URL  
✅ OAuth flow completes successfully  
✅ Dashboard displays Instagram posts  
✅ All API endpoints responding  
✅ No errors in Vercel logs  

---

## 🔒 Security Notes

- Never commit `.env.local` to Git (already gitignored)
- Tokens stored in Vercel environment variables (encrypted)
- httpOnly cookies prevent XSS attacks
- OAuth state validation prevents CSRF

---

## 📞 Need Help?

- **Vercel Docs**: https://vercel.com/docs
- **Meta Developers**: https://developers.facebook.com/docs
- **Check Logs**: `vercel logs YOUR-APP.vercel.app`

---

**Your deployment URL will be**: `https://metacoach-[random].vercel.app`

Good luck! 🚀
