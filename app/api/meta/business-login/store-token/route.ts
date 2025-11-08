import { NextRequest, NextResponse } from 'next/server'

// Store long-lived token from Business Login
export async function POST(req: NextRequest) {
  try {
    const { longLivedToken, expiresIn, state } = await req.json()

    if (!longLivedToken) {
      return NextResponse.json(
        { error: 'Missing long-lived token' },
        { status: 400 }
      )
    }

    // Verify state for CSRF protection
    const storedState = req.cookies.get('oauth_state')?.value
    if (!state || !storedState || state !== storedState) {
      return NextResponse.json(
        { error: 'Invalid state parameter' },
        { status: 400 }
      )
    }

    // Calculate expiration (default 60 days)
    const expiresAt = new Date()
    expiresAt.setSeconds(expiresAt.getSeconds() + (expiresIn || 5184000))

    // Store in httpOnly cookie
    const response = NextResponse.json({ success: true })
    
    response.cookies.set('meta_access_token', longLivedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn || 5184000,
    })
    
    response.cookies.set('meta_token_expires', expiresAt.toISOString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn || 5184000,
    })

    // Clear the state cookie
    response.cookies.delete('oauth_state')

    return response
  } catch (error: any) {
    console.error('Error storing token:', error)
    return NextResponse.json(
      { error: 'Failed to store token' },
      { status: 500 }
    )
  }
}
