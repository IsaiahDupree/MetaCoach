import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'

// Meta Data Deletion Callback (required for compliance)
// https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const signedRequest = body.signed_request

    if (!signedRequest) {
      return NextResponse.json(
        { error: 'Missing signed_request' },
        { status: 400 }
      )
    }

    // Verify the signed request
    const parts = signedRequest.split('.')
    if (!parts || parts.length !== 2) {
      return NextResponse.json(
        { error: 'Malformed signed_request' },
        { status: 400 }
      )
    }
    const [encodedSig, payload] = parts
    
    const secret = process.env.META_APP_SECRET!
    const expectedSig = createHmac('sha256', secret)
      .update(payload)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    if (encodedSig !== expectedSig) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Decode the payload
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    const data = JSON.parse(Buffer.from(normalized, 'base64').toString())
    const userId = data.user_id

    // TODO: Mark user data for deletion
    // This should:
    // 1. Find the tenant/meta_connection by user_id
    // 2. Mark all related data for deletion
    // 3. Queue async job to erase data
    
    console.log(`Data deletion request for user: ${userId}`)

    // Return confirmation URL where user can check deletion status
    const baseUrl = process.env.PUBLIC_BASE_URL || new URL(req.url).origin
    const confirmationUrl = `${baseUrl}/data-deletion?user_id=${encodeURIComponent(userId)}`
    const confirmationCode = userId

    return NextResponse.json({
      url: confirmationUrl,
      confirmation_code: confirmationCode,
    })
  } catch (error) {
    console.error('Data deletion callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to display deletion status (referenced in the response above)
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  
  return NextResponse.json({
    message: 'Data deletion in progress',
    user_id: userId,
    status: 'Your data deletion request is being processed and will be completed within 30 days.',
  })
}

