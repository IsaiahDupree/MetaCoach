import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch Threads posts
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const threadsUserId = req.nextUrl.searchParams.get('threads_user_id')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!threadsUserId) {
      return NextResponse.json(
        { error: 'Missing threads_user_id parameter' },
        { status: 400 }
      )
    }

    const client = new MetaClient(token)
    const threads = await client.getThreadsPosts(threadsUserId, 12)

    // Fetch insights for each thread
    const threadsWithInsights = await Promise.all(
      threads.map(async (thread: any) => {
        try {
          const insights = await client.getThreadsInsights(thread.id)
          return { ...thread, insights }
        } catch (error) {
          return { ...thread, insights: null }
        }
      })
    )

    return NextResponse.json({
      threads: threadsWithInsights,
      total: threadsWithInsights.length,
    })
  } catch (error: any) {
    console.error('Error fetching Threads:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch Threads posts', details: error.response?.data },
      { status: 500 }
    )
  }
}
