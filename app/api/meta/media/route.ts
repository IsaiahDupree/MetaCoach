import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'

// Fetch Instagram media (posts)
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const igUserId = req.nextUrl.searchParams.get('ig_user_id')

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!igUserId) {
      return NextResponse.json(
        { error: 'Missing ig_user_id parameter' },
        { status: 400 }
      )
    }

    const client = new MetaClient(token)
    const media = await client.getMedia(igUserId, 12) // Fetch 12 most recent posts

    // Fetch insights for each media item
    const mediaWithInsights = await Promise.all(
      media.map(async (item) => {
        try {
          const insights = await client.getMediaInsights(item.id)
          return { ...item, insights }
        } catch (error) {
          console.error(`Failed to fetch insights for ${item.id}:`, error)
          return { ...item, insights: null }
        }
      })
    )

    return NextResponse.json({
      media: mediaWithInsights,
      total: mediaWithInsights.length,
    })
  } catch (error: any) {
    console.error('Error fetching media:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch media', details: error.response?.data },
      { status: 500 }
    )
  }
}
