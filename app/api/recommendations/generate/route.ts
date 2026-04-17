import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createProtectedRoute } from '@/lib/auth-middleware'
import { RecommendationEngine } from '@/lib/recommendation-engine'

const handler = async (req: NextRequest & { userId?: string }) => {
  try {
    if (!req.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = supabaseAdmin()
    const accountId = req.nextUrl.searchParams.get('account_id')

    if (!accountId) {
      return NextResponse.json(
        { error: 'account_id query parameter is required' },
        { status: 400 }
      )
    }

    // Verify account ownership
    const { data: account, error: accountError } = await supabase
      .from('meta_accounts')
      .select('id')
      .eq('id', accountId)
      .eq('user_id', req.userId)
      .single()

    if (accountError || !account) {
      return NextResponse.json(
        { error: 'Account not found or unauthorized' },
        { status: 404 }
      )
    }

    // Generate recommendations using the engine
    const engine = new RecommendationEngine()
    let recommendations = await engine.generateRecommendations(accountId)

    // Score and rank recommendations
    recommendations = engine.scoreRecommendations(recommendations)

    // Store recommendations in database
    const recsToInsert = recommendations.map((rec) => ({
      meta_account_id: accountId,
      recommendation_type: rec.recommendation_type,
      title: rec.title,
      description: rec.description,
      confidence_score: rec.confidence_score,
      estimated_impact: rec.estimated_impact,
      estimated_effort: rec.estimated_effort,
      implementation_instructions: rec.implementation_instructions,
      is_implemented: false,
    }))

    if (recsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('meta_coach_recommendations')
        .insert(recsToInsert)

      if (insertError) {
        console.error('Error storing recommendations:', insertError)
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: recommendations.length,
        recommendations: recommendations.slice(0, 10), // Return top 10
        message: `Generated ${recommendations.length} recommendations`,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Recommendation generation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while generating recommendations' },
      { status: 500 }
    )
  }
}

export const GET = createProtectedRoute(handler)
export const POST = createProtectedRoute(handler)
