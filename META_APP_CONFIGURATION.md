# Meta App Configuration Guide

## 📱 App Information

**App ID**: `453049510987286`  
**App Mode**: Development (switch to Live after App Review)  
**App Type**: Business  
**Dashboard**: https://developers.facebook.com/apps/453049510987286

---

## ⚠️ Important Notice

### Facebook Login for Business - Advanced Access Required

Your app currently has **standard access** to `public_profile`. 

**Before going Live**, you need to:
1. Click **Get Advanced Access** 
2. Complete **Business Verification**
3. Submit **App Review** for required permissions

**For Development/Testing**: You can ignore this and test with app roles (Admin/Developer/Tester accounts).

---

## 🔐 Client OAuth Settings Configuration

### Required Settings (Enable All)

#### ✅ Client OAuth Login
**Status**: ENABLED  
**Purpose**: Enables the standard OAuth client token flow

#### ✅ Web OAuth Login  
**Status**: ENABLED  
**Purpose**: Enables web-based Client OAuth Login

#### ✅ Enforce HTTPS
**Status**: ENABLED  
**Purpose**: Enforce HTTPS for redirect URIs and JavaScript SDK  
**⚠️ STRONGLY RECOMMENDED** - Never disable in production

#### ✅ Use Strict Mode for Redirect URIs
**Status**: ENABLED  
**Purpose**: Only allow exact matches for redirect URIs  
**⚠️ STRONGLY RECOMMENDED** - Prevents redirect URI hijacking

### Optional Settings (Leave Disabled Unless Needed)

#### ❌ Force Web OAuth Reauthentication
**Status**: DISABLED  
**Purpose**: Prompts password entry each time (only enable if required by security policy)

#### ❌ Embedded Browser OAuth Login
**Status**: DISABLED  
**Purpose**: Enable webview redirect URIs  
**Note**: Only enable if your app uses in-app browsers/webviews

#### ❌ Login from Devices
**Status**: DISABLED  
**Purpose**: OAuth flow for smart TVs, IoT devices  
**Note**: Only enable if targeting device platforms

#### ❌ Login with JavaScript SDK
**Status**: DISABLED (for now)  
**Purpose**: Client-side Login via JS SDK  
**Note**: Enable later if you add client-side authentication

---

## 🌐 Valid OAuth Redirect URIs

### Production (www.matrixloop.app)

```
https://www.matrixloop.app/api/meta/oauth/callback
https://www.matrixloop.app/api/meta/business-login/callback
```

### Development (localhost)

```
http://localhost:3000/api/meta/oauth/callback
http://localhost:3000/api/meta/business-login/callback
```

### Vercel Preview (optional - for testing)

```
https://metacoach-2jfjzcdjn-isaiahduprees-projects.vercel.app/api/meta/oauth/callback
https://metacoach-2jfjzcdjn-isaiahduprees-projects.vercel.app/api/meta/business-login/callback
```

**⚠️ Important**: 
- Each URI must be an **exact match** (including https://)
- No trailing slashes
- One URI per line
- Click **Save Changes** after adding

---

## 🌍 Allowed Domains for JavaScript SDK

If you enable JS SDK login later, add:

```
matrixloop.app
www.matrixloop.app
localhost
```

**For now**: Leave empty since we're using server-side OAuth.

---

## 🔓 Deauthorize Callback URL

**URL**: `https://www.matrixloop.app/api/facebook/deauthorize`

**Purpose**: Facebook calls this when a user removes your app.

**Your Implementation**: Already created at `/app/api/facebook/deauthorize/route.ts`

---

## 🗑️ Data Deletion Request URL

**URL**: `https://www.matrixloop.app/api/facebook/data-deletion`

**Purpose**: Facebook calls this when a user requests data deletion (GDPR/privacy compliance).

**Your Implementation**: Already created at `/app/api/facebook/data-deletion/route.ts`

**Response Format**: Must return `{ "url": "https://...", "confirmation_code": "..." }`

---

## 💬 Login Connect with Messenger

**Status**: NOT CONFIGURED (optional)

**Purpose**: Allow users to opt into Messenger messages during login.

**To Enable**:
1. Add at least one Facebook Page
2. Enable the Page for Messenger
3. Request `pages_messaging` permission in App Review

**For MVP**: Skip this feature (not required for Instagram analytics).

---

## 📄 App Settings - Basic

### Required Settings

**App Domains**:
```
matrixloop.app
www.matrixloop.app
localhost
```

**Privacy Policy URL**:
```
https://www.matrixloop.app/legal/privacy
```

**Terms of Service URL**:
```
https://www.matrixloop.app/legal/terms
```

**User Data Deletion URL**:
```
https://www.matrixloop.app/api/facebook/data-deletion
```

---

## 🎯 Redirect URI Validator (Testing Tool)

### How to Use

1. Enter a redirect URI in the validator
2. Click **Check**
3. If invalid, add it to **Valid OAuth Redirect URIs** above

### Example Valid URIs

✅ `https://www.matrixloop.app/api/meta/oauth/callback`  
✅ `http://localhost:3000/api/meta/oauth/callback`  

### Example Invalid URIs

❌ `https://www.matrixloop.app/api/meta/oauth/callback/` (trailing slash)  
❌ `http://www.matrixloop.app/api/meta/oauth/callback` (http instead of https)  
❌ `https://matrixloop.app/api/meta/oauth/callback` (missing www)

---

## 📊 Current Configuration Summary

### ✅ Configured Correctly

- [x] Client OAuth Login: ENABLED
- [x] Web OAuth Login: ENABLED
- [x] Enforce HTTPS: ENABLED
- [x] Strict Mode: ENABLED
- [x] Valid OAuth Redirect URIs: Added (www.matrixloop.app)
- [x] Deauthorize URL: Set
- [x] Data Deletion URL: Set

### ⏳ To Configure

- [ ] Add localhost URIs (for development)
- [ ] Add Privacy Policy page
- [ ] Add Terms of Service page
- [ ] Update App Domains list
- [ ] Test redirect URIs with validator

### 🔮 Future (Before Going Live)

- [ ] Request Advanced Access for `public_profile`
- [ ] Complete Business Verification
- [ ] Submit App Review for all required scopes
- [ ] Switch app from Development → Live mode

---

## 🔍 Required Permissions (App Review)

### Standard Access (Already Have)

- ✅ `public_profile` - Basic user info

### Advanced Access (Need to Request)

Submit App Review for:

1. **instagram_basic** - Read Instagram account info
2. **instagram_manage_insights** - Read Instagram metrics
3. **instagram_manage_comments** - Read/moderate comments
4. **pages_show_list** - Read user's Pages
5. **pages_read_engagement** - Read Page engagement
6. **business_management** - Access business assets
7. **ads_read** - Read ads data

### App Review Requirements

- ✅ Privacy Policy (public URL)
- ✅ Terms of Service (public URL)
- ✅ Data Deletion endpoint (working)
- ⏳ Screencast demo (record your OAuth flow)
- ⏳ Written explanation of how you use each permission
- ⏳ Test user credentials (for reviewers)

---

## 🧪 Testing Your Configuration

### 1. Test OAuth Flow

```bash
# Start your app
npm run dev

# Visit
http://localhost:3000

# Click "Quick Setup"
# Should redirect to Facebook
# After auth, should redirect back to http://localhost:3000/api/meta/oauth/callback
```

### 2. Test Redirect URI Validator

In the Meta App dashboard:
1. Enter: `https://www.matrixloop.app/api/meta/oauth/callback`
2. Should show: ✅ "This is a valid redirect URI"

### 3. Test Production

```bash
# After deployment
# Visit: https://www.matrixloop.app
# Complete OAuth flow
# Should work without errors
```

---

## 🚨 Common Issues

### "Can't Load URL: Domain not Allowed"

**Fix**: Add domain to **App Domains** in Basic Settings

### "URL Blocked: Redirect URI Mismatch"

**Fix**: Add exact URI to **Valid OAuth Redirect URIs** list

### "Invalid Redirect URI for this Application"

**Causes**:
- URI not in the list
- Typo (http vs https, trailing slash, etc.)
- Using IP address instead of domain

**Fix**: Add exact matching URI to the list

### "This App is in Development Mode"

**Status**: Normal for testing  
**Fix**: Only switch to Live after App Review approval

---

## 📋 Quick Setup Checklist

Use this when configuring a new environment:

### Development
- [ ] Add `http://localhost:3000/api/meta/oauth/callback`
- [ ] Add `http://localhost:3000/api/meta/business-login/callback`
- [ ] Add `localhost` to App Domains
- [ ] Test OAuth flow locally

### Production
- [ ] Add `https://www.matrixloop.app/api/meta/oauth/callback`
- [ ] Add `https://www.matrixloop.app/api/meta/business-login/callback`
- [ ] Add `matrixloop.app` and `www.matrixloop.app` to App Domains
- [ ] Set Deauthorize URL
- [ ] Set Data Deletion URL
- [ ] Deploy Privacy Policy page
- [ ] Deploy Terms page
- [ ] Test OAuth flow on production

---

## 🔗 Quick Links

- **App Dashboard**: https://developers.facebook.com/apps/453049510987286
- **Settings → Basic**: https://developers.facebook.com/apps/453049510987286/settings/basic/
- **Facebook Login**: https://developers.facebook.com/apps/453049510987286/fb-login/settings/
- **App Review**: https://developers.facebook.com/apps/453049510987286/app-review/
- **Roles**: https://developers.facebook.com/apps/453049510987286/roles/

---

**Your Meta App**: Ready for development testing!  
**Next Step**: Configure redirect URIs and test OAuth flow 🚀
