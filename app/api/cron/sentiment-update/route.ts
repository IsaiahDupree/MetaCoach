import { NextRequest, NextResponse } from 'next/server'
import { MetaClient } from '@/lib/meta'
import { analyzeCommentsSentiment, aggregateSentiment } from '@/lib/sentiment'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * Scheduled job to update sentiment for recent posts
 * Can be called by Vercel Cron, GitHub Actions, or any external scheduler
 * 
 * Security: Verify cron secret token
 * POST /api/cron/sentiment-update
 * Headers: Authorization: Bearer {CRON_SECRET}
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify authorization (cron secret)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // 2. Get all active Meta connections from database
    const supabase = supabaseAdmin()
    const { data: connections, error: connectionsError } = await supabase
      .from('meta_connections')
      .select('*')
      .not('access_token', 'is', null)

    if (connectionsError) {
      throw new Error(`Failed to fetch connections: ${connectionsError.message}`)
    }

    if (!connections || connections.length === 0) {
      return NextResponse.json({
        message: 'No active connections found',
        processed: 0,
      })
    }

    const results = []

    // 3. Process each tenant's posts
    for (const connection of connections) {
      try {
        const client = new MetaClient(connection.access_token)
        
        // Get recent media (last 12 posts)
        const mediaItems = await client.getMedia(connection.ig_user_id, 12)

        for (const media of mediaItems) {
          try {
            // Fetch comments
            const comments = await client.getMediaComments(media.id, 100)

            if (comments.length === 0) {
              continue
            }

            // Analyze sentiment
            const sentiments = await analyzeCommentsSentiment(comments)
            const aggregated = aggregateSentiment(sentiments)

            // Store results
            const { data: existingPost } = await supabase
              .from('posts')
              .select('id')
              .eq('platform_post_id', media.id)
              .single()

            let postId = existingPost?.id

            if (!postId) {
              const { data: newPost } = await supabase
                .from('posts')
                .insert({
                  tenant_id: connection.tenant_id,
                  platform: 'instagram',
                  platform_post_id: media.id,
                  caption: media.caption,
                  media_type: media.media_type,
                  permalink: media.permalink,
                  posted_at: media.timestamp,
                  status: 'posted',
                })
                .select('id')
                .single()

              postId = newPost?.id
            }

            if (postId) {
              // Upsert comments with sentiment
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

              // Insert new sentiment snapshot
              await supabase.from('post_metrics').insert({
                post_id: postId,
                sentiment: aggregated.average_sentiment,
                comments_count: aggregated.total_count,
                json_raw: {
                  sentiment_breakdown: {
                    positive: aggregated.positive_count,
                    neutral: aggregated.neutral_count,
                    negative: aggregated.negative_count,
                    positive_percentage: aggregated.positive_percentage,
                    neutral_percentage: aggregated.neutral_percentage,
                    negative_percentage: aggregated.negative_percentage,
                  },
                },
              })

              results.push({
                tenant_id: connection.tenant_id,
                media_id: media.id,
                comments_analyzed: comments.length,
                sentiment: aggregated.average_sentiment,
              })
            }
          } catch (mediaError: any) {
            console.error(`Error processing media ${media.id}:`, mediaError)
            results.push({
              tenant_id: connection.tenant_id,
              media_id: media.id,
              error: mediaError.message,
            })
          }
        }
      } catch (connectionError: any) {
        console.error(`Error processing connection ${connection.id}:`, connectionError)
        results.push({
          tenant_id: connection.tenant_id,
          error: connectionError.message,
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.filter((r) => !r.error).length,
      errors: results.filter((r) => r.error).length,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Error in sentiment update cron:', error)
    return NextResponse.json(
      {
        error: 'Failed to update sentiment',
        details: error.message,
      },
      { status: 500 }
    )
  }
}

/**
 * Health check for cron job
 * GET /api/cron/sentiment-update
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    endpoint: '/api/cron/sentiment-update',
    method: 'POST',
    description: 'Scheduled job to update sentiment for recent posts',
    auth: 'Bearer token required (CRON_SECRET env var)',
  })
}
