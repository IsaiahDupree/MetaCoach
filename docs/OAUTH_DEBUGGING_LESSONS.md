# OAuth Implementation: Debugging Lessons Learned

## Executive Summary

This document chronicles the debugging journey for implementing Meta (Facebook) OAuth authentication in MetaCoach. The implementation faced three major challenges related to browser behavior with URL fragments, cross-origin requests, and cookie persistence through OAuth redirects.

**Final Solution**: Use sessionStorage for state management and client-side verification, combined with HTML responses to preserve URL fragments.

---

## The Three Critical Issues

### 1. CORS Errors with OAuth URLs

#### Problem
```
Cross-Origin Request Blocked: The Same Origin Policy disallows reading 
the remote resource at https://www.facebook.com/v21.0/dialog/oauth...
(Reason: CORS header 'Access-Control-Allow-Origin' missing). Status code: 400.

XHR OPTIONS https://www.facebook.com/v21.0/dialog/oauth...
CORS Missing Allow Origin
```

#### Root Cause
Next.js `<Link>` components use client-side navigation, which triggers `fetch()` requests instead of full-page redirects. Facebook's OAuth endpoints don't support CORS for security reasons.

#### Why It Happened
```tsx
// ❌ BAD: Triggers client-side fetch
<Link href="/api/meta/business-login/start">
  Quick Setup
</Link>
```

When clicked, Next.js intercepts the navigation and makes an AJAX request:
1. Browser sends OPTIONS preflight request to Facebook
2. Facebook doesn't respond with CORS headers (intentionally)
3. Browser blocks the request
4. OAuth flow fails

#### Solution
```tsx
// ✅ GOOD: Full-page redirect
<a href="/api/meta/business-login/start">
  Quick Setup
</a>
```

Regular anchor tags trigger browser navigation:
1. Browser directly navigates to the URL
2. Server responds with 307 redirect
3. Browser follows redirect to Facebook
4. No CORS check required

#### Key Learnings
- **OAuth flows must use full-page redirects**, not fetch/XHR
- Next.js Link components are for internal app navigation only
- Always use `<a>` tags for external OAuth redirects
- Check Network tab: should see 307 redirect, not OPTIONS request

---

### 2. URL Fragment Loss During Server Redirects

#### Problem
```
Business Login callback error: Error: Invalid state parameter
No tokens received
```

Facebook returns tokens in the URL fragment (the part after `#`):
```
https://yourapp.com/callback#access_token=ABC123&state=xyz&expires_in=5184000
```

#### Root Cause
URL fragments are **never sent to the server**. They exist only in the browser.

When using server-side redirect:
```typescript
// ❌ BAD: Loses the URL fragment
export async function GET(req: NextRequest) {
  // req.url = https://yourapp.com/callback (no fragment!)
  return NextResponse.redirect(new URL('/connect/business-callback', req.url))
  // Result: https://yourapp.com/connect/business-callback (tokens lost!)
}
```

#### Why Fragments Are Lost
1. Facebook redirects to: `https://yourapp.com/callback#access_token=ABC`
2. Browser makes request to server: `https://yourapp.com/callback` (fragment stripped)
3. Server sees only: `https://yourapp.com/callback`
4. Server issues redirect to: `https://yourapp.com/connect/business-callback`
5. **Tokens in fragment are gone forever**

#### Solution
Return HTML with JavaScript that preserves the fragment:

```typescript
// ✅ GOOD: Preserves URL fragment
export async function GET(req: NextRequest) {
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Completing login...</title>
  <script>
    // window.location.hash contains the fragment!
    const fragment = window.location.hash;
    // Navigate client-side, preserving the fragment
    window.location.href = '/connect/business-callback' + fragment;
  </script>
</head>
<body>
  <p>Processing your login...</p>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
```

#### How It Works
1. Facebook redirects: `https://yourapp.com/callback#access_token=ABC`
2. Server returns HTML (doesn't need the fragment)
3. Browser executes JavaScript
4. JavaScript reads `window.location.hash` (the fragment!)
5. JavaScript navigates to callback page WITH fragment
6. Client-side page parses tokens from fragment

#### Key Learnings
- **URL fragments are client-side only**
- Server-side redirects always lose fragments
- Use HTML+JavaScript to preserve fragments
- `window.location.hash` is the only way to access fragments
- This is a fundamental limitation of HTTP, not a Next.js issue

---

### 3. Cookie State Verification Failure

#### Problem
```
XHR POST https://www.matrixloop.app/api/meta/business-login/store-token
Status: 400 Bad Request
Response: {"error":"Invalid state parameter"}
```

The `oauth_state` cookie wasn't being sent with the fetch request.

#### Root Cause
Cookies set during redirects through external domains (Facebook) don't reliably persist, especially with strict browser security settings.

#### Why Cookies Failed

**Attempt 1: `sameSite: 'lax'`**
```typescript
// ❌ Doesn't work for POST fetch requests
response.cookies.set('oauth_state', state, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',  // ← The problem
});
```

`sameSite: 'lax'` cookies aren't sent with cross-site POST requests, and the complex redirect flow through Facebook confuses browser's "same-site" detection.

**Attempt 2: `sameSite: 'none'`**
```typescript
// ❌ Better, but still unreliable
response.cookies.set('oauth_state', state, {
  httpOnly: true,
  secure: true,
  sameSite: 'none',  // ← Allows cross-site, but...
});
```

Even with `sameSite: 'none'`, cookies set before redirecting to Facebook may not persist after returning. Browsers are increasingly strict about cookie handling during complex redirect flows.

#### Solution
Use `sessionStorage` for state verification:

**Step 1: Save state before OAuth redirect**
```typescript
// /app/api/meta/business-login/start/route.ts
export async function GET() {
  const state = nanoid(32);
  const loginUrl = getBusinessLoginUrl(state);

  // Return HTML that saves state to sessionStorage
  const html = `<!DOCTYPE html>
<html>
<head>
  <script>
    sessionStorage.setItem('oauth_state', '${state}');
    window.location.href = '${loginUrl}';
  </script>
</head>
<body><p>Redirecting...</p></body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}
```

**Step 2: Verify state client-side after OAuth**
```typescript
// /app/connect/business-callback/page.tsx
const storedState = sessionStorage.getItem('oauth_state');
if (!storedState || tokens.state !== storedState) {
  setError('Invalid state parameter - CSRF check failed');
  return;
}

// Clear the state after verification
sessionStorage.removeItem('oauth_state');

// Now safe to store tokens
await fetch('/api/meta/business-login/store-token', { ... });
```

#### Why sessionStorage Works
- **Persists across redirects** within the same tab
- **Survives navigation** to external sites (Facebook)
- **Accessible client-side** for verification
- **Automatic cleanup** when tab closes
- **Not sent with requests** (no privacy concerns)
- **Same-origin only** (secure by default)

#### Key Learnings
- **Don't rely on cookies for OAuth state in complex redirect flows**
- sessionStorage is more reliable for transient CSRF tokens
- httpOnly cookies still important for long-lived access tokens
- Client-side state verification is acceptable when done correctly
- Always clear sessionStorage after use

---

## The Complete Fix

### Before (Broken)

1. User clicks `<Link>` → CORS error
2. Server redirects with fragment → Fragment lost
3. Cookie state verification → Cookie missing

### After (Working)

1. User clicks `<a>` → Full-page redirect ✅
2. HTML+JS preserves fragment → Fragment preserved ✅
3. sessionStorage state verification → State verified ✅

### Final Architecture

```
[User clicks button]
         ↓
[Regular <a> tag navigation]
         ↓
[/api/meta/business-login/start]
         ↓
[HTML saves state to sessionStorage]
         ↓
[JavaScript redirects to Facebook]
         ↓
[User authorizes on Facebook]
         ↓
[Facebook redirects to /callback#tokens]
         ↓
[HTML with JS preserves fragment]
         ↓
[Navigate to /business-callback#tokens]
         ↓
[Client-side React page]
         ↓
[Parse tokens from fragment]
         ↓
[Verify state from sessionStorage]
         ↓
[POST tokens to /store-token API]
         ↓
[Store in httpOnly cookies]
         ↓
[Redirect to dashboard]
```

---

## Testing Checklist

### Before Deploying OAuth Changes

- [ ] Test with cleared cookies
- [ ] Test with cleared sessionStorage
- [ ] Test in incognito mode
- [ ] Test in different browsers (Chrome, Firefox, Safari)
- [ ] Check Network tab for:
  - [ ] No OPTIONS requests to Facebook
  - [ ] 307 redirects (not 200 with fetch)
  - [ ] Cookies being set correctly
- [ ] Check Application tab for:
  - [ ] sessionStorage contains `oauth_state`
  - [ ] Cookies contain `meta_access_token`
  - [ ] Cookie attributes (Secure, HttpOnly, SameSite, Path)
- [ ] Check Console for:
  - [ ] No CORS errors
  - [ ] No JavaScript errors
  - [ ] No "Quirks Mode" warnings

### Specific Error Cases to Test

- [ ] Cancel OAuth on Facebook
- [ ] Deny permissions on Facebook
- [ ] Refresh page during callback
- [ ] Navigate back during OAuth flow
- [ ] Invalid/expired state parameter
- [ ] Missing environment variables

---

## Common Debugging Techniques

### Check Fragment Preservation
```javascript
// In browser console on callback page
console.log(window.location.hash);
// Should show: #access_token=ABC123&state=xyz&expires_in=5184000
```

### Check sessionStorage
```javascript
// In browser console
console.log(sessionStorage.getItem('oauth_state'));
// Should show: your_state_value
```

### Check Cookies
```javascript
// In browser console (won't show httpOnly cookies)
console.log(document.cookie);

// Better: DevTools → Application → Cookies
// Should show: meta_access_token with HttpOnly=true
```

### Check Network Requests
1. Open DevTools → Network tab
2. Clear network log
3. Click OAuth button
4. Look for:
   - **307 Temporary Redirect** (good!)
   - **OPTIONS** request (bad - CORS issue)
   - **200 OK** from fetch (bad - should be redirect)

### Check HTML Response
```bash
curl -I https://yourapp.com/api/meta/business-login/start
# Should show:
# Content-Type: text/html
# (For start route with sessionStorage approach)
```

---

## Best Practices Moving Forward

### 1. Always Test OAuth Flows in Production-Like Environment
- Use HTTPS even in development (ngrok, localhost.run)
- Test with actual OAuth provider (not mocked)
- Use browser privacy mode to simulate new users

### 2. Understand Browser Behavior
- Read MDN docs on cookies, CORS, URL fragments
- Test in multiple browsers (they differ!)
- Stay updated on browser security changes

### 3. Plan for OAuth Complexity
- OAuth is inherently complex with redirects
- Budget extra time for testing and debugging
- Document your implementation thoroughly

### 4. Implement Comprehensive Logging
```typescript
// Server-side
console.log('OAuth callback received:', {
  query: req.nextUrl.searchParams.toString(),
  // Note: fragments won't appear here!
  headers: req.headers,
});

// Client-side
console.log('Processing tokens:', {
  fragment: window.location.hash,
  storedState: sessionStorage.getItem('oauth_state'),
  tokenState: tokens.state,
});
```

### 5. Show Detailed Error Messages (in Development)
```typescript
const details = error.message;
router.push(`/connect?error=callback_failed&details=${encodeURIComponent(details)}`);
```

### 6. Have Fallback Mechanisms
- Show clear error messages
- Provide "try again" buttons
- Link to help documentation
- Capture errors for monitoring (Sentry, etc.)

---

## Resources

### Documentation Read
- [Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-login)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)
- [MDN: Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

### Key Insights Gained
1. URL fragments are client-side only - fundamental HTTP limitation
2. OAuth with fragments requires client-side handling
3. Complex redirect flows break cookie-based state management
4. sessionStorage is more reliable for OAuth CSRF tokens
5. Next.js Link components don't work for external OAuth

### Tools Used for Debugging
- Chrome DevTools (Network, Application, Console)
- Firefox DevTools (different cookie behavior)
- curl (testing HTTP responses)
- Browser incognito mode (fresh state)
- Vercel logs (production debugging)

---

## Conclusion

The working OAuth implementation required understanding three core web technologies:

1. **CORS** - Why full-page redirects are required
2. **URL Fragments** - Why server-side redirects fail
3. **Cookie Persistence** - Why sessionStorage is more reliable

Each issue individually seemed simple, but together they created a complex debugging challenge. The key was systematically testing each component and understanding browser behavior at a fundamental level.

**Time Investment**: ~4 hours of debugging
**Commits**: 5 major iterations
**Key Breakthrough**: Realizing cookies don't persist reliably through OAuth redirects

**Final Working Solution**: sessionStorage + HTML fragment preservation + anchor tag navigation = ✅ Working OAuth Flow
