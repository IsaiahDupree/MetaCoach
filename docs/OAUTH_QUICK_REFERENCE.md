# OAuth Implementation Quick Reference

## TL;DR - What We Learned

✅ **Use `<a>` tags, not `<Link>`, for OAuth redirects** (prevents CORS)  
✅ **Preserve URL fragments with HTML+JS** (server redirects lose them)  
✅ **Use sessionStorage for OAuth state** (cookies unreliable through external redirects)

## Quick Checklist for OAuth Implementation

### ✅ Navigation Links
- [ ] Use `<a href="...">` for OAuth start URLs
- [ ] Remove `<Link>` components from OAuth buttons
- [ ] Verify Network tab shows 307 redirect, not OPTIONS

### ✅ Fragment Handling
- [ ] Return HTML+JavaScript from callback routes
- [ ] Use `window.location.hash` to read fragments
- [ ] Navigate client-side to preserve fragments
- [ ] Include `<!DOCTYPE html>` on first line

### ✅ State Verification
- [ ] Save state to sessionStorage before redirect
- [ ] Verify state client-side after OAuth
- [ ] Clear sessionStorage after verification
- [ ] Don't rely on httpOnly cookies for OAuth state

### ✅ Token Storage
- [ ] Use httpOnly cookies for access tokens
- [ ] Set `secure: true` in production
- [ ] Set `path: '/'` explicitly
- [ ] Store expiration timestamp

### ✅ Testing
- [ ] Test with cleared cookies/sessionStorage
- [ ] Test in incognito mode
- [ ] Check DevTools → Network for CORS errors
- [ ] Check DevTools → Application for cookies/storage
- [ ] Check DevTools → Console for errors

## Code Patterns

### ❌ Wrong: Link Component
```tsx
<Link href="/api/meta/business-login/start">
  Start OAuth
</Link>
// Results in CORS error
```

### ✅ Right: Anchor Tag
```tsx
<a href="/api/meta/business-login/start">
  Start OAuth
</a>
// Full-page redirect, no CORS
```

### ❌ Wrong: Server Redirect with Fragment
```typescript
export async function GET(req: NextRequest) {
  return NextResponse.redirect('/callback')
  // Fragment is lost!
}
```

### ✅ Right: HTML Preservation
```typescript
export async function GET(req: NextRequest) {
  return new NextResponse(`<!DOCTYPE html>
<html>
<head>
  <script>
    const fragment = window.location.hash;
    window.location.href = '/callback' + fragment;
  </script>
</head>
<body>Processing...</body>
</html>`, {
    headers: { 'Content-Type': 'text/html' },
  })
}
```

### ❌ Wrong: Cookie-Based State
```typescript
// Start
response.cookies.set('oauth_state', state, {
  httpOnly: true,
  sameSite: 'lax',
})

// Callback
const storedState = req.cookies.get('oauth_state')?.value
// Cookie may be missing!
```

### ✅ Right: sessionStorage State
```typescript
// Start (return HTML)
sessionStorage.setItem('oauth_state', '${state}')

// Callback (client-side)
const storedState = sessionStorage.getItem('oauth_state')
sessionStorage.removeItem('oauth_state')
// Reliable across redirects
```

## File Structure

```
app/
├── api/
│   └── meta/
│       ├── oauth/
│       │   ├── start/route.ts       # Standard OAuth start
│       │   └── callback/route.ts    # Standard OAuth callback
│       └── business-login/
│           ├── start/route.ts       # Business Login start
│           ├── callback/route.ts    # Business Login callback
│           └── store-token/route.ts # Token storage API
└── connect/
    ├── page.tsx                     # Connection UI
    └── business-callback/
        └── page.tsx                 # Client-side token handler
```

## Environment Variables

```bash
META_APP_ID=453049510987286
META_APP_SECRET=576fc7ec240b308263fcd1b79ec830ec
META_REDIRECT_URL=https://domain.com/api/meta/oauth/callback
PUBLIC_BASE_URL=https://domain.com
```

## Debugging Commands

```javascript
// Check if fragment exists
console.log(window.location.hash)

// Check sessionStorage
console.log(sessionStorage.getItem('oauth_state'))

// Check cookies (won't show httpOnly)
console.log(document.cookie)
```

```bash
# Test redirect response
curl -I https://yourapp.com/api/meta/business-login/start

# Check Vercel logs
vercel logs --follow
```

## Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| CORS Missing Allow Origin | Using Link/fetch | Use `<a>` tag |
| Invalid state parameter | Cookie not sent | Use sessionStorage |
| No tokens received | Fragment lost | Use HTML+JS redirect |
| Quirks Mode warning | Missing DOCTYPE | Add `<!DOCTYPE html>` first |
| Connection failed | Various | Check error details param |

## OAuth Flow Diagram (Simplified)

```
User clicks button
  ↓
<a> tag navigation (full page)
  ↓
HTML saves state to sessionStorage
  ↓
Redirect to Facebook
  ↓
User authorizes
  ↓
Facebook redirects with #tokens
  ↓
HTML+JS preserves fragment
  ↓
Client page parses tokens
  ↓
Verify state from sessionStorage
  ↓
POST to /store-token API
  ↓
Store in httpOnly cookies
  ↓
Redirect to dashboard
```

## Meta App Configuration URLs

### Development
- **OAuth Redirect URI**: `http://localhost:3000/api/meta/oauth/callback`
- **Business Login Redirect URI**: `http://localhost:3000/api/meta/business-login/callback`

### Production
- **OAuth Redirect URI**: `https://www.matrixloop.app/api/meta/oauth/callback`
- **Business Login Redirect URI**: `https://www.matrixloop.app/api/meta/business-login/callback`
- **Data Deletion**: `https://www.matrixloop.app/api/facebook/data-deletion`
- **App Domains**: `matrixloop.app`, `www.matrixloop.app`

## Required Scopes

```
instagram_basic
instagram_content_publish
instagram_manage_comments
instagram_manage_insights
pages_show_list
pages_read_engagement
business_management
pages_read_user_content
ads_read
read_insights
```

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Configure redirect URIs in Meta App
- [ ] Add app domains in Meta App
- [ ] Test both OAuth flows
- [ ] Verify tokens persist after login
- [ ] Check error handling with invalid state
- [ ] Test login cancellation flow

## Key Takeaways

1. **URL fragments are client-side only** - fundamental HTTP limitation
2. **OAuth redirects must be full-page** - no fetch/XHR allowed
3. **Cookies unreliable through OAuth** - use sessionStorage for state
4. **Always test in production-like environment** - HTTPS matters
5. **Document your implementation** - future you will thank you

## Further Reading

- [Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-login)
- [MDN: URL Fragment](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash)
- [MDN: Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)
- [MDN: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
- Full documentation: `docs/OAUTH_ARCHITECTURE.md`, `docs/OAUTH_DEBUGGING_LESSONS.md`
