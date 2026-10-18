# Custom Domain Setup: metacoach.matrixloop.app

## ✅ Domain Purchased
- **Domain**: `matrixloop.app`
- **Subdomain**: `metacoach.matrixloop.app`
- **Meta App ID**: `453049510987286`

---

## 🚀 Vercel Deployment & Custom Domain

### Step 1: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import `IsaiahDupree/MetaCoach`
3. Deploy (you'll get a temporary URL like `metacoach-abc123.vercel.app`)

### Step 2: Add Custom Domain in Vercel

1. Go to **Project Settings → Domains**
2. Click **Add Domain**
3. Enter: `metacoach.matrixloop.app`
4. Vercel will provide DNS records

### Step 3: Configure DNS (at matrixloop.app registrar)

Add CNAME record:
```
Type: CNAME
Name: metacoach
Value: cname.vercel-dns.com
TTL: Auto
```

**Wait 5-10 minutes for DNS propagation**

### Step 4: Verify Domain

- Vercel will automatically verify once DNS propagates
- You'll see a ✅ next to `metacoach.matrixloop.app`

---

## ⚙️ Environment Variables in Vercel

**Project Settings → Environment Variables**

Add these for **Production**:

```bash
# Meta App (REQUIRED)
META_APP_ID=453049510987286
META_APP_SECRET=${META_APP_SECRET}
META_REDIRECT_URL=https://metacoach.matrixloop.app/api/meta/oauth/callback
PUBLIC_BASE_URL=https://metacoach.matrixloop.app

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Analysis (Optional)
OPENAI_API_KEY=sk-your-key

# Analytics (Optional)
POSTHOG_API_KEY=your-key
POSTHOG_HOST=https://app.posthog.com

# Security
ENCRYPTION_KEY=your-32-byte-encryption-key
```

After adding, click **Redeploy** for changes to take effect.

---

## 🔐 Meta App Configuration

### Go to: https://developers.facebook.com/apps/453049510987286

### A. Basic Settings

**Settings → Basic**

- **App Domains**: 
  ```
  matrixloop.app
  metacoach-abc123.vercel.app
  localhost
  ```

- **Privacy Policy URL**: `https://metacoach.matrixloop.app/legal/privacy`
- **Terms of Service URL**: `https://metacoach.matrixloop.app/legal/terms`
- **User Data Deletion**: `https://metacoach.matrixloop.app/api/facebook/data-deletion`

### B. Facebook Login Settings

**Facebook Login → Settings**

Enable:
- ✅ **Client OAuth Login**: Yes
- ✅ **Web OAuth Login**: Yes
- ✅ **Enforce HTTPS**: Yes
- ✅ **Use Strict Mode for Redirect URIs**: Yes

**Valid OAuth Redirect URIs** (exact matches):
```
https://metacoach.matrixloop.app/api/meta/oauth/callback
https://metacoach.matrixloop.app/api/meta/business-login/callback
https://metacoach-abc123.vercel.app/api/meta/oauth/callback
http://localhost:3000/api/meta/oauth/callback
http://localhost:3000/api/meta/business-login/callback
```

**Allowed Domains for the JavaScript SDK**:
```
matrixloop.app
metacoach-abc123.vercel.app
localhost
```

**Deauthorize Callback URL**:
```
https://metacoach.matrixloop.app/api/facebook/deauthorize
```

### C. Instagram API Settings

**Instagram → API Setup with Facebook Login**

Request these scopes (MVP):
- ✅ `instagram_basic`
- ✅ `instagram_manage_insights`
- ✅ `instagram_manage_comments`
- ✅ `pages_show_list`

### D. Advanced Access (for Live Mode)

Before switching to Live:

1. **Business Verification**: Complete in Business Manager
2. **App Review**: Request Advanced Access for:
   - `public_profile`
   - `instagram_basic`
   - `instagram_manage_insights`
   - `instagram_manage_comments`
   - `pages_show_list`

Required for App Review:
- ✅ Privacy Policy (public)
- ✅ Data Deletion endpoint (working)
- ✅ Screencast demo (end-to-end flow)
- ✅ Test account (add reviewers as testers)

---

## 📋 Development Phase Checklist

### Phase 0: Platform Wiring (Today)
- [x] Deploy to Vercel
- [ ] Add custom domain `metacoach.matrixloop.app`
- [ ] Set environment variables
- [ ] Configure Meta app redirect URIs
- [ ] Test OAuth flow in dev mode
- [ ] Verify data deletion endpoint works

### Phase 1: Read & Store Metrics
- [ ] Media list with pagination
- [ ] Insights (use `views` not deprecated metrics)
- [ ] Comments with sentiment analysis
- [ ] Rate limit handling
- [ ] Check-back scheduler

### Phase 2: Ephemeral Analysis
- [ ] Download media_url temporarily
- [ ] Analyze (vision/whisper/captions via OpenAI)
- [ ] Store findings JSON
- [ ] Delete media file immediately
- [ ] Generate coach suggestions

### Phase 3: App Review Prep
- [ ] Record screencast
- [ ] Write scope justifications
- [ ] Complete Business Verification
- [ ] Submit for Advanced Access
- [ ] Data Use Checkup

### Phase 4: Live Switch
- [ ] Switch app to Live mode
- [ ] Test with non-role users
- [ ] Monitor error rates
- [ ] Optional: Add publishing scopes

---

## 🧪 Testing URLs

### Development
```
http://localhost:3000
```

### Preview (Vercel)
```
https://metacoach-abc123.vercel.app
```

### Production (Custom Domain)
```
https://metacoach.matrixloop.app
```

### Test Endpoints
```
GET https://metacoach.matrixloop.app/api/meta/me
GET https://metacoach.matrixloop.app/api/meta/media?ig_user_id=<ID>
GET https://metacoach.matrixloop.app/api/meta/ads/accounts
```

---

## 🚨 Common Issues & Fixes

### "Can't Load URL" during OAuth
- ✅ Check exact callback URL in Meta app's Valid OAuth Redirect URIs
- ✅ Ensure root domain in App Domains
- ✅ Use HTTPS (not HTTP) for production URLs

### Can't Fetch IG Data
- ✅ Ensure Instagram is **Professional** account
- ✅ IG connected to a Facebook **Page**
- ✅ Your user has **admin** role on that Page
- ✅ Page must be published (not unpublished)

### Comments Failing
- ✅ Add `instagram_manage_comments` to login scopes
- ✅ Don't use `pages_read_engagement` for IG comments
- ✅ Request scope in App Review if Live

### Token Expires
- ✅ Exchange for long-lived token (60 days)
- ✅ Implement token refresh before expiry
- ✅ Store expiry timestamp in database

### Rate Limits
- ✅ Implement exponential backoff
- ✅ Batch requests where possible
- ✅ Cache frequently accessed data
- ✅ Monitor rate limit headers

---

## 🔒 Security Checklist

✅ Environment variables in Vercel (never in code)  
✅ HTTPS enforced for all OAuth flows  
✅ Tokens encrypted at rest (use `ENCRYPTION_KEY`)  
✅ httpOnly cookies for session management  
✅ CSRF protection with state parameter  
✅ Data deletion endpoint implemented  
✅ Privacy policy & terms published  

---

## 📊 Monitoring

### Vercel
- **Logs**: `vercel logs metacoach.matrixloop.app`
- **Analytics**: Dashboard → Analytics
- **Performance**: Edge Network stats

### Meta App Dashboard
- **API Usage**: Overview tab
- **Rate Limits**: Insights
- **Errors**: Error logs section

### PostHog (Optional)
- User flows
- Feature usage
- Error tracking
- A/B testing

---

## 🎯 MVP Scope (Keep It Simple)

**DO Include**:
- Instagram posts & insights
- Comments sentiment
- Basic coach suggestions
- Ephemeral media analysis
- Dashboard with charts

**DON'T Include Yet**:
- WhatsApp messaging
- Live video
- Branded content
- Messenger
- Commerce
- Auto-posting (add later in Phase 4)

---

## 📝 Next Actions

1. **Deploy to Vercel** → Get temporary URL
2. **Add custom domain** → `metacoach.matrixloop.app`
3. **Configure DNS** → CNAME record
4. **Set env vars** → All required variables
5. **Update Meta app** → Add all redirect URIs
6. **Test OAuth** → Complete flow end-to-end
7. **Verify data deletion** → Test the endpoint

---

**Ready to go live!** 🚀

Your production URL: `https://metacoach.matrixloop.app`
