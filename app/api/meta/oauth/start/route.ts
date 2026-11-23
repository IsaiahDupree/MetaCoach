import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getMetaAuthUrl } from '@/lib/meta'
import { verifyAuth } from '@/lib/auth-middleware'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyAuth(req)
    if (!auth.authenticated) return NextResponse.json({ error: 'Sign in to connect an account' }, { status: 401 })
    if (process.env.METACOACH_META_OAUTH_ENABLED !== '1') {
      return NextResponse.json({ error: 'Account connection is currently unavailable' }, { status: 503 })
    }
    // Generate a random state for CSRF protection
    const state = nanoid(32)
    
    // Store state in a cookie for verification in callback
    const response = NextResponse.redirect(getMetaAuthUrl(state))
    response.cookies.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/',
      maxAge: 600, // 10 minutes
    })
    
    return response
  } catch (error) {
    console.error('OAuth start error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth flow' },
      { status: 500 }
    )
  }
}
