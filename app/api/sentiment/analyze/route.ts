import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'
import { analyzeCommentsSentiment, aggregateSentiment } from '@/lib/sentiment'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Analyze sentiment for a specific post's comments
 * GET /api/sentiment/analyze?media_id={id}
 */
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

    // 1. Fetch comments from Meta API
    const client = new MetaClient(token)
    const comments = await client.getMediaComments(mediaId, 100)

    if (comments.length === 0) {
      return NextResponse.json({
        media_id: mediaId,
        comments: [],
        sentiment: {
          average_sentiment: 0,
          positive_count: 0,
          neutral_count: 0,
          negative_count: 0,
          total_count: 0,
          positive_percentage: 0,
          neutral_percentage: 0,
          negative_percentage: 0,
          confidence: 0,
        },
        message: 'No comments found for this post',
      })
    }

    // 2. Analyze sentiment using OpenAI
    const sentiments = await analyzeCommentsSentiment(comments)

    // 3. Calculate aggregated metrics
    const aggregated = aggregateSentiment(sentiments)

    // 4. Store in database (if Supabase is configured)
    try {
      const supabase = supabaseAdmin()

      // First, ensure the post exists in our DB
      const { data: existingPost } = await supabase
        .from('posts')
        .select('id')
        .eq('platform_post_id', mediaId)
        .single()

      let postId = existingPost?.id

      // If post doesn't exist, create it
      if (!postId) {
        const { data: newPost, error: postError } = await supabase
          .from('posts')
          .insert({
            tenant_id: '00000000-0000-0000-0000-000000000000', // TODO: Get from session
            platform: 'instagram',
            platform_post_id: mediaId,
            status: 'posted',
          })
          .select('id')
          .single()

        if (postError) {
          console.error('Error creating post:', postError)
        } else {
          postId = newPost.id
        }
      }

      if (postId) {
        // Store comments with sentiment
        const commentsToInsert = sentiments.map((s) => ({
          post_id: postId,
          platform_comment_id: s.comment_id,
          author: comments.find((c) => c.id === s.comment_id)?.username,
          text: s.text,
          sentiment: s.sentiment,
        }))

        await supabase
          .from('comments')
          .upsert(commentsToInsert, {
            onConflict: 'post_id,platform_comment_id',
          })

        // Store aggregated sentiment in post_metrics
        await supabase.from('post_metrics').insert({
          post_id: postId,
          sentiment: aggregated.average_sentiment,
          comments_count: aggregated.total_count,
          json_raw: {
            sentiment_breakdown: {
              positive: aggregated.positive_count,
              neutral: aggregated.neutral_count,
              negative: aggregated.negative_count,
            },
          },
        })
      }
    } catch (dbError) {
      console.error('Database error (continuing without storage):', dbError)
      // Continue even if DB storage fails
    }

    // 5. Return results
    return NextResponse.json({
      media_id: mediaId,
      comments: sentiments,
      sentiment: aggregated,
      stored: true,
      analyzed_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error analyzing sentiment:', error)
    return NextResponse.json(
      {
        error: 'Failed to analyze sentiment',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Analyze sentiment for multiple posts
 * POST /api/sentiment/analyze
 * Body: { media_ids: string[] }
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value
    const body = await req.json()
    const { media_ids } = body

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (!media_ids || !Array.isArray(media_ids)) {
      return NextResponse.json(
        { error: 'Missing or invalid media_ids array' },
        { status: 400 }
      )
    }

    // Analyze each post
    const results = []
    for (const mediaId of media_ids) {
      try {
        const client = new MetaClient(token)
        const comments = await client.getMediaComments(mediaId, 100)

        if (comments.length > 0) {
          const sentiments = await analyzeCommentsSentiment(comments)
          const aggregated = aggregateSentiment(sentiments)

          results.push({
            media_id: mediaId,
            sentiment: aggregated,
            comments_analyzed: comments.length,
          })
        } else {
          results.push({
            media_id: mediaId,
            sentiment: null,
            comments_analyzed: 0,
            message: 'No comments found',
          })
        }
      } catch (error: any) {
        results.push({
          media_id: mediaId,
          error: error.message,
        })
      }
    }

    return NextResponse.json({
      results,
      analyzed_at: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in batch sentiment analysis:', error)
    return NextResponse.json(
      { error: 'Failed to analyze sentiment', details: error.message },
      { status: 500 }
    )
  }
}
