import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { getBusinessLoginUrl } from '@/lib/meta-business-login'

// Start Facebook Login for Business flow
export async function GET() {
  // Generate CSRF state
  const state = nanoid(32)

  // Get Business Login URL
  const loginUrl = getBusinessLoginUrl(state)

  // Store state in cookie for verification
  const response = NextResponse.redirect(loginUrl)
  response.cookies.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  })

  return response
}
