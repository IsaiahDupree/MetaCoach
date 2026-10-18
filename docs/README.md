# MetaCoach Documentation

Welcome to the MetaCoach documentation! This folder contains comprehensive guides for implementing and maintaining the OAuth authentication system.

## 📚 Documentation Index

### Quick Start
- **[OAuth Quick Reference](./OAUTH_QUICK_REFERENCE.md)** - Start here! TL;DR of the most important patterns and fixes

### Deep Dives
- **[OAuth Architecture](./OAUTH_ARCHITECTURE.md)** - Complete system architecture, components, and best practices
- **[OAuth Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md)** - The debugging journey and lessons learned from implementation

### Configuration Guides
- **[Meta App Configuration](../META_APP_CONFIGURATION.md)** - Step-by-step Meta App settings configuration
- **[Meta App Basic Settings](../META_APP_BASIC_SETTINGS.md)** - Basic settings for Meta Developer App
- **[Vercel Environment Setup](../VERCEL_ENV_SETUP.md)** - Setting up environment variables in Vercel
- **[Custom Domain Setup](../SETUP_CUSTOM_DOMAIN.md)** - Configuring custom domain on Vercel

## 🎯 Which Doc Should I Read?

### "I need to implement OAuth quickly"
→ Start with [OAuth Quick Reference](./OAUTH_QUICK_REFERENCE.md)

### "I want to understand how everything works"
→ Read [OAuth Architecture](./OAUTH_ARCHITECTURE.md)

### "I'm debugging OAuth issues"
→ Check [OAuth Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md)

### "I need to configure Meta App settings"
→ Follow [Meta App Configuration](../META_APP_CONFIGURATION.md)

### "I'm deploying to production"
→ Use [Vercel Environment Setup](../VERCEL_ENV_SETUP.md) and [Custom Domain Setup](../SETUP_CUSTOM_DOMAIN.md)

## 🚀 Key Learnings Summary

### The Three Critical Issues We Solved

1. **CORS Errors**
   - **Problem**: Next.js `<Link>` components trigger fetch requests
   - **Solution**: Use regular `<a>` tags for OAuth redirects

2. **URL Fragment Loss**
   - **Problem**: Server-side redirects lose URL fragments
   - **Solution**: Return HTML with JavaScript to preserve fragments

3. **Cookie State Verification**
   - **Problem**: Cookies don't persist through OAuth redirects
   - **Solution**: Use sessionStorage for state management

### Quick Patterns

```tsx
// ✅ Correct OAuth button
<a href="/api/meta/business-login/start">Login</a>

// ❌ Wrong - causes CORS
<Link href="/api/meta/business-login/start">Login</Link>
```

```typescript
// ✅ Correct callback (preserves fragments)
const html = `<!DOCTYPE html>
<html><head><script>
  window.location.href = '/callback' + window.location.hash;
</script></head></html>`;

// ❌ Wrong - loses fragments
return NextResponse.redirect('/callback');
```

```typescript
// ✅ Correct state management
sessionStorage.setItem('oauth_state', state);

// ❌ Wrong - unreliable through redirects
response.cookies.set('oauth_state', state);
```

## 🔧 Common Issues & Solutions

| Issue | Quick Fix | Documentation |
|-------|-----------|---------------|
| CORS errors | Use `<a>` tags | [Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md#1-cors-errors-with-oauth-urls) |
| Invalid state | Use sessionStorage | [Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md#3-cookie-state-verification-failure) |
| No tokens received | HTML+JS redirect | [Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md#2-url-fragment-loss-during-server-redirects) |
| Quirks Mode warning | Add `<!DOCTYPE html>` | [Architecture](./OAUTH_ARCHITECTURE.md#common-pitfalls) |

## 📦 Project Structure

```
MetaCoach/
├── app/
│   ├── api/
│   │   └── meta/
│   │       ├── oauth/              # Standard OAuth flow
│   │       └── business-login/     # Business Login flow (recommended)
│   └── connect/
│       ├── page.tsx               # Connection UI
│       └── business-callback/     # Token parsing page
├── lib/
│   ├── meta.ts                    # OAuth utilities
│   └── meta-business-login.ts     # Business Login utilities
└── docs/                          # 👈 You are here!
    ├── README.md
    ├── OAUTH_ARCHITECTURE.md
    ├── OAUTH_DEBUGGING_LESSONS.md
    └── OAUTH_QUICK_REFERENCE.md
```

## 🧪 Testing Your OAuth Implementation

### Before You Start
1. Clear browser cookies and sessionStorage
2. Test in incognito mode
3. Open DevTools (Network, Console, Application tabs)

### What to Check
- [ ] No CORS errors in console
- [ ] Network shows 307 redirect (not OPTIONS)
- [ ] sessionStorage contains `oauth_state`
- [ ] Cookies contain `meta_access_token` (httpOnly)
- [ ] Successful redirect to dashboard

### Quick Debug Commands

```javascript
// Browser console
console.log(window.location.hash);              // Check fragment
console.log(sessionStorage.getItem('oauth_state')); // Check state
```

## 🌐 Production Deployment

### Environment Variables Required

```bash
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URL=https://domain.com/api/meta/oauth/callback
PUBLIC_BASE_URL=https://domain.com
```

### Meta App Settings Required

**Redirect URIs:**
- `https://yourdomain.com/api/meta/oauth/callback`
- `https://yourdomain.com/api/meta/business-login/callback`

**App Domains:**
- `yourdomain.com`
- `www.yourdomain.com`

**Data Deletion:**
- `https://yourdomain.com/api/facebook/data-deletion`

## 📈 Performance & Security

### What We Implemented
✅ httpOnly cookies for token storage (XSS protection)  
✅ CSRF protection with state verification  
✅ Secure cookie flags in production  
✅ Fragment-based token handling (server never sees tokens)  
✅ sessionStorage for transient state (survives redirects)  
✅ Comprehensive error handling and logging  

### Best Practices Followed
✅ No sensitive data in URL query strings  
✅ Short-lived CSRF tokens  
✅ Explicit cookie paths and domains  
✅ Standards-compliant HTML (DOCTYPE)  
✅ Graceful error handling with user-friendly messages  

## 🤝 Contributing

When updating OAuth implementation:

1. **Update the code** - Make your changes
2. **Test thoroughly** - All OAuth flows, error cases
3. **Update docs** - Keep documentation in sync
4. **Add examples** - Show before/after if fixing a bug
5. **Commit with context** - Explain why, not just what

## 📞 Need Help?

### Debugging Steps
1. Check [OAuth Quick Reference](./OAUTH_QUICK_REFERENCE.md) - Common fixes
2. Review [Debugging Lessons](./OAUTH_DEBUGGING_LESSONS.md) - Detailed troubleshooting
3. Inspect browser DevTools - Network, Console, Application tabs
4. Check Vercel logs - `vercel logs --follow`

### Resources
- [Facebook Login for Business](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-login)
- [OAuth 2.0 Specification](https://datatracker.ietf.org/doc/html/rfc6749)
- [MDN: HTTP Cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies)
- [MDN: Window.sessionStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage)

## 🎓 Key Takeaways

The OAuth implementation taught us:

1. **Browser behavior matters** - Fragments, cookies, CORS have nuances
2. **OAuth is complex** - Budget time for testing and debugging  
3. **Documentation is crucial** - Future you will thank present you
4. **Test in production-like environments** - Local dev doesn't catch everything
5. **Understand fundamentals** - Don't just copy-paste solutions

---

**Last Updated**: November 2025  
**Status**: ✅ Working in production at www.matrixloop.app  
**Time Investment**: ~4 hours debugging, ~2 hours documentation  
**Worth It**: Absolutely! 🎉
