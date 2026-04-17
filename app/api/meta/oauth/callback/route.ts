import { NextRequest, NextResponse } from 'next/server'
import { exchangeCodeForToken, MetaClient } from '@/lib/meta'
import { supabaseAdmin } from '@/lib/supabase'

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

    // Exchange code for short-lived token
    const tokenResponse = await exchangeCodeForToken(code)

    // Exchange for long-lived token (60 days)
    const longLivedToken = await MetaClient.exchangeForLongLivedToken(
      tokenResponse.access_token
    )

    // Calculate token expiration
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (longLivedToken.expires_in || 5184000)) // 60 days default

    // Get the current user from auth session
    // In production, you would get the authenticated user from the session
    const supabase = supabaseAdmin()
    const { data: { user }, error: sessionError } = await supabase.auth.getUser(
      req.headers.get('authorization')?.replace('Bearer ', '') || undefined
    )

    if (!user && !req.cookies.get('auth_token')) {
      // User must be authenticated to link accounts
      return NextResponse.redirect(
        new URL('/auth/login?redirect=/connect', req.url)
      )
    }

    // Use the authenticated user's ID, or store as pending if not authenticated
    const userId = user?.id

    // Get ad accounts for this connection
    const client = new MetaClient(longLivedToken.access_token)
    const adAccounts = await client.getAdAccounts()

    // Store the access token and ad account info in Supabase (only if user is authenticated)
    if (userId && adAccounts && adAccounts.length > 0) {
      // Store each ad account in meta_accounts table
      for (const account of adAccounts) {
        const { error } = await supabase
          .from('meta_accounts')
          .upsert({
            id: account.id,
            user_id: userId,
            account_name: account.name,
            account_currency: account.currency,
            account_timezone: account.timezone_name,
            access_token: longLivedToken.access_token,
            token_expires_at: expiresAt.toISOString(),
            is_active: true,
          }, {
            onConflict: 'id'
          })

        if (error) {
          console.error('Failed to store ad account:', error)
        }
      }
    }

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
    console.error('OAuth callback error:', error)
    const errorMessage = error?.message || 'Unknown error'
    const detailsParam = encodeURIComponent(errorMessage)
    return NextResponse.redirect(
      new URL(`/connect?error=callback_failed&details=${detailsParam}`, req.url)
    )
  }
}
