# MetaCoach OAuth Architecture

## Overview

MetaCoach implements two OAuth flows for Instagram Business account authentication:
1. **Standard OAuth Flow** - Traditional authorization code flow
2. **Business Login Flow** - Facebook Login for Business (recommended)

## Why Two Flows?

### Standard OAuth (`/api/meta/oauth/*`)
- Traditional OAuth 2.0 Authorization Code flow
- Server-side token exchange
- Best for accounts that are already configured
- More complex setup requirements

### Business Login (`/api/meta/business-login/*`)
- Facebook's simplified onboarding flow
- Includes guided Instagram Business account setup
- Returns long-lived tokens directly in URL fragment
- **Recommended for new users**

## Architecture Diagram

```
User
  │
  ├─→ /connect (connection page)
  │     │
  │     ├─→ Click "Quick Setup" → /api/meta/business-login/start
  │     │     │
  │     │     ├─→ HTML page saves state to sessionStorage
  │     │     └─→ Redirects to Facebook OAuth
  │     │           │
  │     │           └─→ User authorizes
  │     │                 │
  │     │                 └─→ Facebook redirects to /api/meta/business-login/callback
  │     │                       │
  │     │                       └─→ HTML with JavaScript preserves URL fragment
  │     │                             │
  │     │                             └─→ /connect/business-callback (client-side)
  │     │                                   │
  │     │                                   ├─→ Parse tokens from URL fragment
  │     │                                   ├─→ Verify state from sessionStorage
  │     │                                   ├─→ POST to /api/meta/business-login/store-token
  │     │                                   └─→ Redirect to /dashboard
  │     │
  │     └─→ Click "Standard Connection" → /api/meta/oauth/start
  │           │
  │           ├─→ Redirects to Facebook OAuth
  │           └─→ Facebook redirects to /api/meta/oauth/callback
  │                 │
  │                 ├─→ Exchange code for token
  │                 ├─→ Store token in httpOnly cookie
  │                 └─→ Redirect to /dashboard
```

## Key Components

### 1. Start Routes
**Business Login**: `/app/api/meta/business-login/start/route.ts`
- Returns HTML that saves CSRF state to sessionStorage
- Redirects browser to Facebook OAuth URL

**Standard OAuth**: `/app/api/meta/oauth/start/route.ts`
- Generates CSRF state
- Stores state in cookie
- Redirects to Facebook OAuth URL

### 2. Callback Routes
**Business Login**: `/app/api/meta/business-login/callback/route.ts`
- Returns HTML with JavaScript
- Preserves URL fragment (contains tokens)
- Navigates to client-side callback page

**Standard OAuth**: `/app/api/meta/oauth/callback/route.ts`
- Server-side token exchange
- Stores tokens in httpOnly cookies
- Redirects to dashboard

### 3. Client-Side Pages
**Business Callback**: `/app/connect/business-callback/page.tsx`
- Parses tokens from URL fragment
- Verifies CSRF state from sessionStorage
- Sends tokens to store-token API
- Redirects to dashboard

**Connect Page**: `/app/connect/page.tsx`
- Main connection UI
- Uses `<a>` tags (not `<Link>`) to prevent CORS issues
- Displays error messages with details

### 4. Token Storage
**Store Token**: `/app/api/meta/business-login/store-token/route.ts`
- Stores long-lived token in httpOnly cookie
- Sets expiration metadata
- Returns success response

### 5. Utilities
**Meta Library**: `/lib/meta.ts`
- Constructs OAuth URLs
- Handles token exchange
- Defines required scopes

**Business Login Library**: `/lib/meta-business-login.ts`
- Constructs Business Login URLs
- Parses tokens from URL fragment
- Extracts state parameter

## Security Features

### CSRF Protection
- Business Login: State verified client-side using sessionStorage
- Standard OAuth: State verified server-side using httpOnly cookies

### Secure Token Storage
- Tokens stored in httpOnly cookies
- Cannot be accessed by JavaScript
- Automatic HTTPS enforcement in production

### URL Fragment Handling
- Tokens in URL fragments never sent to server
- Client-side parsing only
- Cleared after storage

## Environment Variables

```bash
META_APP_ID=your_app_id                  # Meta App ID
META_APP_SECRET=your_app_secret          # Meta App Secret (server-side only)
META_REDIRECT_URL=https://domain/api/meta/oauth/callback  # Standard OAuth callback
PUBLIC_BASE_URL=https://domain           # Base URL for constructing callbacks
```

## Token Lifecycle

1. **Short-lived Token** (Facebook OAuth response)
   - Valid for ~2 hours
   - Returned in URL fragment or query string

2. **Long-lived Token** (exchanged via API)
   - Valid for ~60 days
   - Stored in httpOnly cookie
   - Auto-renewed before expiration

3. **Token Refresh** (future implementation)
   - Automatic background refresh
   - Transparent to user
   - Prevents re-authentication

## Scopes

### Instagram Basic Access
- `instagram_basic` - Read profile info
- `instagram_manage_insights` - Read analytics

### Instagram Content
- `instagram_content_publish` - Publish posts
- `instagram_manage_comments` - Read/reply to comments

### Facebook Pages
- `pages_show_list` - List connected pages
- `pages_read_engagement` - Read page engagement
- `pages_read_user_content` - Read page content

### Business & Ads
- `business_management` - Manage business assets
- `ads_read` - Read ad account data
- `read_insights` - Read insights data

## Best Practices

1. **Always use HTTPS in production** - Required for secure cookies
2. **Validate state parameter** - Prevents CSRF attacks
3. **Use httpOnly cookies for tokens** - Prevents XSS attacks
4. **Clear sensitive data after use** - sessionStorage state cleanup
5. **Handle errors gracefully** - Show user-friendly messages
6. **Log errors server-side** - For debugging production issues
7. **Use anchor tags for OAuth redirects** - Prevents CORS issues
8. **Preserve URL fragments** - Use HTML+JS for redirects, not server redirects

## Common Pitfalls

### ❌ Using `<Link>` for OAuth URLs
**Problem**: Next.js Link components trigger client-side navigation (fetch)
**Solution**: Use regular `<a>` tags for full-page redirects

### ❌ Server-side redirect with URL fragments
**Problem**: URL fragments (#token=...) are never sent to server
**Solution**: Return HTML with JavaScript to preserve fragment

### ❌ Cookies with `sameSite: 'lax'` across domains
**Problem**: Cookies not sent with cross-site requests
**Solution**: Use sessionStorage for cross-domain state persistence

### ❌ Missing DOCTYPE in HTML responses
**Problem**: Browser renders in Quirks Mode
**Solution**: Always include `<!DOCTYPE html>` on first line

### ❌ Hardcoding callback URLs
**Problem**: Different URLs for dev/prod environments
**Solution**: Construct URLs from `PUBLIC_BASE_URL` environment variable

## Testing

### Local Development
```bash
# Set environment variables
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback
PUBLIC_BASE_URL=http://localhost:3000

# Start development server
npm run dev
```

### Production Testing
1. Configure Meta App with production callback URLs
2. Set Vercel environment variables
3. Test both OAuth flows
4. Verify tokens are stored correctly
5. Check error handling

## Troubleshooting

### "Invalid state parameter"
- **Cause**: State mismatch or missing sessionStorage
- **Fix**: Clear browser cookies/storage and retry
- **Check**: DevTools → Application → Session Storage

### CORS errors
- **Cause**: Using `<Link>` or `fetch()` for OAuth URLs
- **Fix**: Use regular `<a href="...">` tags
- **Check**: Network tab should show 307 redirect, not OPTIONS

### "Connection failed"
- **Cause**: Various - check error details parameter
- **Fix**: Look at browser console for specific error
- **Check**: URL query string for `?error=...&details=...`

### Tokens not persisting
- **Cause**: Cookie settings incompatible with browser
- **Fix**: Verify secure/sameSite/path settings
- **Check**: DevTools → Application → Cookies

## Future Enhancements

- [ ] Automatic token refresh before expiration
- [ ] Support for multiple connected accounts
- [ ] Webhook handling for real-time updates
- [ ] Token encryption at rest
- [ ] Admin dashboard for token management
- [ ] Rate limiting and quota monitoring
