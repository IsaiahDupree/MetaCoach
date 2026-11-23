import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, MetaClient } from '@/lib/meta'
import { verifyAuth } from '@/lib/auth-middleware'
import { saveMetaAccounts } from '@/lib/save-meta-accounts'

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const storedState = req.cookies.get('oauth_state')?.value

    // Verify state for CSRF protection
    if (!state || !storedState || state !== storedState) {
      return NextResponse.redirect(
        new URL('/connect?error=invalid_state', req.url)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/connect?error=no_code', req.url)
      )
    }

    const auth = await verifyAuth(req)
    if (!auth.authenticated || !auth.userId) {
      return NextResponse.redirect(new URL('/connect?error=authentication_required', req.url))
    }
    if (process.env.METACOACH_META_OAUTH_ENABLED !== '1') {
      return NextResponse.json({ error: 'Account connection is currently unavailable' }, { status: 503 })
    }

    // Exchange code for short-lived token
    const tokenResponse = await exchangeCodeForToken(code)

    // Exchange for long-lived token (60 days)
    const longLivedToken = await MetaClient.exchangeForLongLivedToken(
      tokenResponse.access_token
    )

    // Calculate token expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (longLivedToken.expires_in || 5184000)) // 60 days default

    // Get ad accounts for this connection
    const client = new MetaClient(longLivedToken.access_token)
    const adAccounts = await client.getAdAccounts()

    if (adAccounts?.length) await saveMetaAccounts(auth.userId, adAccounts, longLivedToken.access_token, expiresAt.toISOString())

    const response = NextResponse.redirect(new URL('/dashboard', req.url))

    // Store access token in httpOnly cookie as backup
    response.cookies.set('meta_access_token', longLivedToken.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longLivedToken.expires_in || 5184000, // 60 days
    })

    response.cookies.set('meta_token_expires', expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: longLivedToken.expires_in || 5184000,
    })

    // Clear the state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error: any) {
    console.error('OAuth callback failed')
    return NextResponse.redirect(
      new URL('/connect?error=callback_failed', req.url)
    )
  }
}
