import { NextRequest, NextResponse } from 'next/server'

// Handle Facebook Login for Business redirect
export async function GET(req: NextRequest) {
  try {
    // Check if user canceled
    const error = req.nextUrl.searchParams.get('error')
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/connect?error=login_canceled', req.url)
      )
    }

    // Business Login returns tokens in URL fragment (#), which is client-side only
    // Server-side redirects lose the fragment, so we return HTML with JavaScript
    // that preserves the fragment and navigates to the callback page
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Completing login...</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f9fafb;
    }
    .loading {
      text-align: center;
    }
    .spinner {
      border: 3px solid #e5e7eb;
      border-top: 3px solid #2563eb;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="loading">
    <div class="spinner"></div>
    <p>Completing login...</p>
  </div>
  <script>
    // Preserve the URL fragment and navigate to the callback page
    const fragment = window.location.hash;
    window.location.replace('/connect/business-callback' + fragment);
  </script>
</body>
</html>
`
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error: any) {
    console.error('Business Login callback error:', error)
    const errorMessage = error?.message || 'Unknown error'
    const detailsParam = encodeURIComponent(errorMessage)
    return NextResponse.redirect(
      new URL(`/connect?error=business_login_failed&details=${detailsParam}`, req.url)
    )
  }
}
