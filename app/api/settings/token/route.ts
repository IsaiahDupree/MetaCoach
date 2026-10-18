import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// Get the user's meta access token (for display/copy in settings)
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('meta_access_token')?.value

    if (!token) {
      return NextResponse.json(
        { error: 'Not authenticated. Please connect your Meta account first.' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      token,
      message: 'Keep this token secure. Only share with trusted systems.'
    })
  } catch (error: any) {
    console.error('Error fetching token:', error)
    return NextResponse.json(
      { error: 'Failed to fetch token' },
      { status: 500 }
    )
  }
}
