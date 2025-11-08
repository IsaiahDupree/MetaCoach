import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getBusinessLoginUrl } from '@/lib/meta-business-login'

// Start Facebook Login for Business flow
export async function GET() {
  // Generate CSRF state
  const state = nanoid(32)

  // Get Business Login URL
  const loginUrl = getBusinessLoginUrl(state)

  // Return HTML that saves state to sessionStorage, then redirects
  // This is more reliable than cookies for cross-domain OAuth flows
  const html = `<!DOCTYPE html>
<html>
<head>
  <title>Starting login...</title>
  <script>
    // Save state to sessionStorage for verification after OAuth
    sessionStorage.setItem('oauth_state', '${state}');
    // Redirect to Facebook OAuth
    window.location.href = '${loginUrl}';
  </script>
</head>
<body>
  <p>Redirecting to Facebook...</p>
</body>
</html>
`

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  })
}
