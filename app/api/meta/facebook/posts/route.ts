import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch Facebook Page posts
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const pageId = req.nextUrl.searchParams.get('page_id')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!pageId) {
      return NextResponse.json(
        { error: 'Missing page_id parameter' },
        { status: 400 }
      )
    }

    const client = new MetaClient(token)
    const posts = await client.getFacebookPagePosts(pageId, 12)

    return NextResponse.json({
      posts,
      total: posts.length,
    })
  } catch (error: any) {
    console.error('Error fetching Facebook posts:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch Facebook posts', details: error.response?.data },
      { status: 500 }
    )
  }
}
