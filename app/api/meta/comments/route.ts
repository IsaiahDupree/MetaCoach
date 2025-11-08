import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch comments for a specific media item
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const mediaId = req.nextUrl.searchParams.get('media_id')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!mediaId) {
      return NextResponse.json(
        { error: 'Missing media_id parameter' },
        { status: 400 }
      )
    }

    const client = new MetaClient(token)
    const comments = await client.getMediaComments(mediaId, 50)

    return NextResponse.json({
      comments,
      total: comments.length,
    })
  } catch (error: any) {
    console.error('Error fetching comments:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch comments', details: error.response?.data },
      { status: 500 }
    )
  }
}
