import { NextRequest, NextResponse } from 'next/server'
import { createProtectedRoute } from '@/lib/auth-middleware'

// Store long-lived token from Business Login
const handler = async (req: NextRequest) => {
  try {
    if (process.env.METACOACH_META_OAUTH_ENABLED !== '1') {
      return NextResponse.json({ error: 'Account connection is currently unavailable' }, { status: 503 })
    }
    const { longLivedToken, expiresIn, state } = await req.json()
    const expectedState = req.cookies.get('business_oauth_state')?.value
    if (typeof state !== 'string' || !expectedState || state !== expectedState) {
      return NextResponse.json({ error: 'Invalid connection state' }, { status: 403 })
    }

    if (typeof longLivedToken !== 'string' || !longLivedToken || longLivedToken.length > 8192) {
      return NextResponse.json(
        { error: 'Missing long-lived token' },
        { status: 400 }
      )
    }

    const seconds = expiresIn == null ? 5184000 : Number(expiresIn)
    if (!Number.isInteger(seconds) || seconds < 1 || seconds > 5184000) {
      return NextResponse.json({ error: 'Invalid token expiry' }, { status: 400 })
    }

    // Calculate expiration (default 60 days)
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + seconds)

    // Store in httpOnly cookie
    const response = NextResponse.json({ success: true })
    
    response.cookies.set('meta_access_token', longLivedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: seconds,
    })
    
    response.cookies.set('meta_token_expires', expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: seconds,
    })
    response.cookies.delete('business_oauth_state')

    return response
  } catch (error: any) {
    console.error('Error storing token:', error)
    return NextResponse.json(
      { error: 'Failed to store token' },
      { status: 500 }
    )
  }
}

export const POST = createProtectedRoute(handler)
