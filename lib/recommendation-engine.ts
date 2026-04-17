import { supabaseAdmin } from './supabase'

export interface Recommendation {
  id: string
  meta_account_id: string
  recommendation_type: 'budget' | 'creative' | 'audience' | 'targeting'
  title: string
  description: string
  confidence_score: number
  estimated_impact: number
  estimated_effort: 'low' | 'medium' | 'high'
  implementation_instructions: string
  priority: 'high' | 'medium' | 'low'
}

export interface PerformanceData {
  impressions: number
  clicks: number
  spend: number
  actions: number
  action_value: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}

export class RecommendationEngine {
  private supabase = supabaseAdmin()

  /**
   * Generate recommendations for an ad account
   */
  async generateRecommendations(accountId: string): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []

    // Get ad performance data for the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: metrics } = await this.supabase
      .from('meta_ad_performance')
      .select(
        `
        meta_ad_id,
        date,
        impressions,
        clicks,
        spend,
        actions,
        action_value,
        ctr,
        cpc,
        cpa,
        roas,
        meta_ads(
          id,
          meta_ad_set_id,
          meta_ad_sets(
            meta_account_id
          )
        )
      `
      )
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    if (!metrics || metrics.length === 0) {
      return recommendations
    }

    // Analyze performance and generate recommendations
    recommendations.push(...this.generateBudgetRecommendations(metrics))
    recommendations.push(...this.generateCreativeRecommendations(metrics))
    recommendations.push(...this.generateAudienceRecommendations(metrics))

    return recommendations
  }

  /**
   * Generate budget optimization recommendations
   */
  private generateBudgetRecommendations(metrics: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Group metrics by ad set
    const adSetMetrics: { [key: string]: any[] } = {}
    metrics.forEach((metric) => {
      const adSetId = metric.meta_ads?.meta_ad_set_id
      if (adSetId) {
        if (!adSetMetrics[adSetId]) {
          adSetMetrics[adSetId] = []
        }
        adSetMetrics[adSetId].push(metric)
      }
    })

    // Analyze each ad set
    Object.entries(adSetMetrics).forEach(([adSetId, adSetMetrics]) => {
      const avgRoas = adSetMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) / adSetMetrics.length
      const avgCtr = adSetMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / adSetMetrics.length
      const totalSpend = adSetMetrics.reduce((sum, m) => sum + (m.spend || 0), 0)

      // Recommendation: Increase budget for high-performing ad sets
      if (avgRoas > 2.0 && totalSpend < 1000) {
        recommendations.push({
          id: `budget-increase-${adSetId}`,
          meta_account_id: '',
          recommendation_type: 'budget',
          title: 'Increase Budget for High-Performing Ad Set',
          description: `This ad set is showing strong performance with a ${avgRoas.toFixed(2)}x ROAS. Consider increasing the daily budget to scale results.`,
          confidence_score: 0.85,
          estimated_impact: avgRoas > 3 ? 40 : 25,
          estimated_effort: 'low',
          implementation_instructions: `Increase the daily budget by 25-50% in Meta Ads Manager. Monitor for 5-7 days and adjust if performance declines.`,
          priority: 'high',
        })
      }

      // Recommendation: Decrease budget for low-performing ad sets
      if (avgRoas < 1.0 && totalSpend > 500) {
        recommendations.push({
          id: `budget-decrease-${adSetId}`,
          meta_account_id: '',
          recommendation_type: 'budget',
          title: 'Decrease Budget for Underperforming Ad Set',
          description: `This ad set has a ROAS of ${avgRoas.toFixed(2)}x, which is below profitability. Consider reducing the budget or pausing the ad set.`,
          confidence_score: 0.8,
          estimated_impact: -15,
          estimated_effort: 'low',
          implementation_instructions: `Reduce daily budget by 25-50% or pause the ad set entirely. Reallocate budget to higher-performing campaigns.`,
          priority: 'high',
        })
      }

      // Recommendation: Optimize CTR
      if (avgCtr < 1.0) {
        recommendations.push({
          id: `ctr-optimization-${adSetId}`,
          meta_account_id: '',
          recommendation_type: 'budget',
          title: 'Budget Pacing Issue',
          description: `CTR is below 1%, suggesting possible audience fatigue or poor targeting.`,
          confidence_score: 0.7,
          estimated_impact: 20,
          estimated_effort: 'medium',
          implementation_instructions: `Review audience targeting. Consider expanding audience or creating new ad sets with fresh creative.`,
          priority: 'medium',
        })
      }
    })

    return recommendations
  }

  /**
   * Generate creative refresh recommendations
   */
  private generateCreativeRecommendations(metrics: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Group by creative/ad
    const adMetrics: { [key: string]: any[] } = {}
    metrics.forEach((metric) => {
      const adId = metric.meta_ad_id
      if (adId) {
        if (!adMetrics[adId]) {
          adMetrics[adId] = []
        }
        adMetrics[adId].push(metric)
      }
    })

    // Analyze creative performance
    Object.entries(adMetrics).forEach(([adId, creativeMetrics]) => {
      const avgCtr = creativeMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / creativeMetrics.length
      const daysActive = creativeMetrics.length
      const impressions = creativeMetrics.reduce((sum, m) => sum + (m.impressions || 0), 0)

      // Ad fatigue detection
      if (daysActive > 14 && impressions > 100000 && avgCtr < 1.0) {
        recommendations.push({
          id: `creative-fatigue-${adId}`,
          meta_account_id: '',
          recommendation_type: 'creative',
          title: 'Ad Fatigue Detected',
          description: `This creative has been running for ${daysActive} days with ${impressions} impressions. CTR is declining, indicating audience fatigue.`,
          confidence_score: 0.8,
          estimated_impact: 30,
          estimated_effort: 'medium',
          implementation_instructions: `Create 2-3 new variations of this creative with different images, copy, or format. Run A/B tests to identify best performer.`,
          priority: 'high',
        })
      }

      // Low engagement creative
      if (avgCtr < 0.5 && daysActive > 7) {
        recommendations.push({
          id: `low-engagement-${adId}`,
          meta_account_id: '',
          recommendation_type: 'creative',
          title: 'Low Engagement Creative',
          description: `This creative is underperforming with a CTR of ${avgCtr.toFixed(2)}%.`,
          confidence_score: 0.75,
          estimated_impact: 25,
          estimated_effort: 'high',
          implementation_instructions: `Review creative elements. Test different headlines, images, or calls-to-action. Consider pausing if no improvement after 7 more days.`,
          priority: 'medium',
        })
      }
    })

    return recommendations
  }

  /**
   * Generate audience targeting recommendations
   */
  private generateAudienceRecommendations(metrics: any[]): Recommendation[] {
    const recommendations: Recommendation[] = []

    // Analyze by age, gender, or other demographics if available
    // This is a simplified version - in production, you'd have demographic data

    const avgCpa = metrics.reduce((sum, m) => sum + (m.cpa || 0), 0) / metrics.length
    const avgRoas = metrics.reduce((sum, m) => sum + (m.roas || 0), 0) / metrics.length

    if (avgRoas > 2.0) {
      recommendations.push({
        id: 'audience-expansion',
        meta_account_id: '',
        recommendation_type: 'audience',
        title: 'Expand Winning Audience',
        description: `Your campaigns are performing well with an average ROAS of ${avgRoas.toFixed(2)}x. Consider creating lookalike audiences to scale.`,
        confidence_score: 0.8,
        estimated_impact: 35,
        estimated_effort: 'medium',
        implementation_instructions: `Create a 1-2% lookalike audience in Meta Ads Manager based on your best converting customers. Start with a test budget.`,
        priority: 'high',
      })
    }

    if (avgCpa > 100) {
      recommendations.push({
        id: 'audience-refinement',
        meta_account_id: '',
        recommendation_type: 'audience',
        title: 'Refine Targeting to Reduce CPA',
        description: `CPA is high at ${avgCpa.toFixed(2)}. Refining your target audience could improve efficiency.`,
        confidence_score: 0.7,
        estimated_impact: 20,
        estimated_effort: 'medium',
        implementation_instructions: `Review audience demographics and interests. Remove underperforming interests or locations. Test age ranges.`,
        priority: 'medium',
      })
    }

    return recommendations
  }

  /**
   * Score and rank recommendations by estimated impact
   */
  scoreRecommendations(recommendations: Recommendation[]): Recommendation[] {
    return recommendations.sort((a, b) => {
      // Score based on confidence, impact, and effort
      const scoreA = (a.confidence_score * a.estimated_impact) / (a.estimated_effort === 'high' ? 3 : a.estimated_effort === 'medium' ? 2 : 1)
      const scoreB = (b.confidence_score * b.estimated_impact) / (b.estimated_effort === 'high' ? 3 : b.estimated_effort === 'medium' ? 2 : 1)
      return scoreB - scoreA
    })
  }
}

export default new RecommendationEngine()
