import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getBusinessLoginUrl } from '@/lib/meta-business-login'
import { verifyAuth } from '@/lib/auth-middleware'

// Start Facebook Login for Business flow
export async function GET(req: NextRequest) {
  const auth = await verifyAuth(req)
  if (!auth.authenticated) return NextResponse.json({ error: 'Sign in to connect an account' }, { status: 401 })
  if (process.env.METACOACH_META_OAUTH_ENABLED !== '1') {
    return NextResponse.json({ error: 'Account connection is currently unavailable' }, { status: 503 })
  }
  // Generate CSRF state
  const state = nanoid(32)

  // Get Business Login URL
  const loginUrl = getBusinessLoginUrl(state)

  // Return HTML that saves state to both sessionStorage AND localStorage
  // localStorage persists better across OAuth redirects
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Starting login...</title>
  <script>
    // Save state to both storages for reliability
    sessionStorage.setItem('oauth_state', '${state}');
    localStorage.setItem('oauth_state', '${state}');
    localStorage.setItem('oauth_state_timestamp', Date.now().toString());
    // Redirect to Facebook OAuth
    window.location.href = '${loginUrl}';
  </script>
</head>
<body>
  <p>Redirecting to Facebook...</p>
</body>
</html>
`

  const response = new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
  response.cookies.set('business_oauth_state', state, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 600,
  })
  return response
}
