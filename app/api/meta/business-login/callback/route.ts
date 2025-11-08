import { NextRequest, NextResponse } from 'next/server'
import { parseBusinessLoginTokens, isBusinessLoginCanceled } from '@/lib/meta-business-login'

// Handle Facebook Login for Business redirect
export async function GET(req: NextRequest) {
  try {
    // Business Login returns tokens in URL fragment (#), which is only accessible client-side
    // So we need to redirect to a client page that will parse the fragment
    
    // Check if user canceled
    const error = req.nextUrl.searchParams.get('error')
    if (error === 'access_denied') {
      return NextResponse.redirect(
        new URL('/connect?error=login_canceled', req.url)
      )
    }

    // Redirect to a client-side page that will handle the fragment
    return NextResponse.redirect(new URL('/connect/business-callback', req.url))
  } catch (error) {
    console.error('Business Login callback error:', error)
    return NextResponse.redirect(
      new URL('/connect?error=business_login_failed', req.url)
    )
  }
}
