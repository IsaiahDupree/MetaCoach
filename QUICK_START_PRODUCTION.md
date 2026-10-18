# 🚀 Quick Start: Deploy to metacoach.matrixloop.app

## ✅ Prerequisites Complete
- [x] Code on GitHub: https://github.com/IsaiahDupree/MetaCoach
- [x] Domain purchased: `matrixloop.app`
- [x] Meta App ID: `453049510987286`

---

## 🎯 Deploy in 5 Steps

### 1️⃣ Deploy to Vercel (2 min)

```bash
# Option A: Via Dashboard (Recommended)
# Go to: https://vercel.com/new
# Import: IsaiahDupree/MetaCoach
# Click: Deploy

# Option B: Via CLI
npm i -g vercel
vercel login
vercel --prod
```

**Result**: Get temporary URL like `metacoach-xyz.vercel.app`

---

### 2️⃣ Add Custom Domain (5 min)

**In Vercel Dashboard**:
1. Project Settings → Domains
2. Add Domain: `metacoach.matrixloop.app`
3. Copy DNS records

**In Domain Registrar** (matrixloop.app):
```
Type: CNAME
Name: metacoach
Value: cname.vercel-dns.com
```

Wait 5-10 minutes for propagation ✅

---

### 3️⃣ Set Environment Variables (3 min)

**Vercel Dashboard → Settings → Environment Variables**

Copy-paste this (Production environment):

```bash
META_APP_ID=453049510987286
META_APP_SECRET=<your-secret>
META_REDIRECT_URL=https://metacoach.matrixloop.app/api/meta/oauth/callback
PUBLIC_BASE_URL=https://metacoach.matrixloop.app
```

Optional (add if using Supabase/OpenAI):
```bash
NEXT_PUBLIC_SUPABASE_URL=<your-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-key>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
OPENAI_API_KEY=<your-key>
```

**Click Redeploy** after adding!

---

### 4️⃣ Configure Meta App (5 min)

Go to: https://developers.facebook.com/apps/453049510987286

**A. Basic Settings**
```
App Domains: 
  matrixloop.app
  metacoach-xyz.vercel.app
  localhost
```

**B. Facebook Login → Settings**

Valid OAuth Redirect URIs:
```
https://metacoach.matrixloop.app/api/meta/oauth/callback
https://metacoach.matrixloop.app/api/meta/business-login/callback
https://metacoach-xyz.vercel.app/api/meta/oauth/callback
http://localhost:3000/api/meta/oauth/callback
```

Allowed Domains:
```
matrixloop.app
metacoach-xyz.vercel.app
localhost
```

Deauthorize URL:
```
https://metacoach.matrixloop.app/api/facebook/deauthorize
```

**C. Data Deletion**

Settings → Basic → Data Deletion Request URL:
```
https://metacoach.matrixloop.app/api/facebook/data-deletion
```

---

### 5️⃣ Test! (1 min)

1. Visit: https://metacoach.matrixloop.app
2. Click: **🚀 Quick Setup**
3. Complete OAuth flow
4. Should see: Dashboard with Instagram data

---

## 🧪 Test Checklist

```bash
# Test OAuth
curl https://metacoach.matrixloop.app/api/meta/oauth/start

# Test API (after login)
curl https://metacoach.matrixloop.app/api/meta/me

# Test Data Deletion
curl https://metacoach.matrixloop.app/api/facebook/data-deletion
```

---

## 📋 MVP Scopes (Dev Mode)

Currently requesting:
- ✅ `instagram_basic`
- ✅ `instagram_manage_insights`
- ✅ `instagram_manage_comments`
- ✅ `pages_show_list`
- ✅ `pages_read_engagement`
- ✅ `business_management`
- ✅ `ads_read`

---

## 🚨 Common Issues

**"Can't Load URL"**
→ Check redirect URIs match exactly (including https://)

**"App Not Set Up"**  
→ Ensure IG is Professional + connected to FB Page

**"Invalid Token"**  
→ User needs admin role on connected Page

**Domain not resolving**  
→ Wait 10 min for DNS, clear browser cache

---

## 📊 What Works Now

✅ OAuth login (2 flows: Quick Setup + Standard)  
✅ Instagram posts & insights  
✅ Facebook page posts  
✅ Ad campaigns & performance  
✅ Threads posts  
✅ Comments retrieval  
✅ Dashboard UI  

---

## 🎯 Next Phase (After Testing)

### Phase 1: Core Features
- [ ] Pagination for large datasets
- [ ] Rate limit handling
- [ ] Token refresh before expiry
- [ ] Check-back scheduler

### Phase 2: AI Analysis
- [ ] Download media temporarily
- [ ] Analyze with OpenAI (vision/audio)
- [ ] Generate coaching suggestions
- [ ] Delete media after analysis

### Phase 3: App Review
- [ ] Record screencast
- [ ] Request Advanced Access
- [ ] Complete Business Verification
- [ ] Submit for Live mode

---

## 🔒 Security Notes

- Tokens stored in httpOnly cookies
- All OAuth flows use HTTPS
- CSRF protection with state parameter
- Data deletion endpoint implemented
- No media persistence (ephemeral only)

---

## 📞 Support Links

- **Vercel Docs**: https://vercel.com/docs
- **Meta Developer**: https://developers.facebook.com/docs
- **GitHub Repo**: https://github.com/IsaiahDupree/MetaCoach

---

## 🎉 Success Criteria

When deployment is successful:
✅ `https://metacoach.matrixloop.app` loads  
✅ OAuth completes without errors  
✅ Dashboard shows Instagram data  
✅ All API endpoints respond  
✅ No console errors  

---

**Total Setup Time: ~15 minutes**

Your production app: **https://metacoach.matrixloop.app** 🚀
