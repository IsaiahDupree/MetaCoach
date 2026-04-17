import { supabaseAdmin } from './supabase'

export interface CloneOptions {
  newName: string
  newBudget?: number
  newStatus?: 'ACTIVE' | 'PAUSED'
  modifyAudience?: {
    expand?: number // percentage to expand audience by
    interests?: string[]
    locations?: string[]
  }
  startDate?: string
}

export interface ABTestRecommendation {
  id: string
  campaign_id: string
  test_name: string
  variation_type: 'creative' | 'audience' | 'budget' | 'bid_strategy'
  description: string
  hypothesis: string
  test_duration_days: number
  sample_size_needed: number
  success_metrics: string[]
  estimated_duration: string
  implementation_steps: string[]
  confidence_level: number
}

export interface CompetitorInsight {
  id: string
  competitor_name: string
  ad_count: number
  platforms: string[]
  primary_objective: string
  creative_themes: string[]
  call_to_action_types: string[]
  estimated_budget: string
  performance_benchmarks: {
    avg_cpc?: number
    avg_ctr?: number
    avg_engagement?: number
  }
}

export interface BudgetReallocationPlan {
  id: string
  account_id: string
  from_campaign_id: string
  to_campaign_id: string
  reallocation_amount: number
  from_campaign_name: string
  to_campaign_name: string
  expected_roas_improvement: number
  rollout_duration_days: number
  rollback_available: boolean
  approval_status: 'pending' | 'approved' | 'rejected' | 'executed'
}

export class CampaignCloner {
  private supabase = supabaseAdmin()

  /**
   * Clone an existing campaign
   */
  async cloneCampaign(campaignId: string, options: CloneOptions): Promise<string> {
    // Fetch original campaign
    const { data: originalCampaign } = await this.supabase
      .from('meta_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    if (!originalCampaign) throw new Error('Campaign not found')

    const clonedCampaignId = `clone_${Date.now()}`

    // Create new campaign in database
    const clonedCampaign = {
      id: clonedCampaignId,
      meta_account_id: originalCampaign.meta_account_id,
      name: options.newName,
      status: options.newStatus || 'PAUSED',
      objective: originalCampaign.objective,
      daily_budget: options.newBudget || originalCampaign.daily_budget,
      start_date: options.startDate || new Date().toISOString(),
      source_campaign_id: campaignId,
    }

    const { error } = await this.supabase.from('meta_campaigns').insert([clonedCampaign])

    if (error) throw error

    // Clone ad sets and ads if provided
    if (originalCampaign) {
      const { data: adSets } = await this.supabase
        .from('meta_ad_sets')
        .select('*')
        .eq('meta_campaign_id', campaignId)

      if (adSets) {
        for (const adSet of adSets) {
          await this.cloneAdSet(adSet, clonedCampaignId, options.modifyAudience)
        }
      }
    }

    return clonedCampaignId
  }

  /**
   * Clone an ad set with optional audience modifications
   */
  private async cloneAdSet(
    originalAdSet: any,
    newCampaignId: string,
    audienceModifications?: CloneOptions['modifyAudience']
  ): Promise<string> {
    const clonedAdSetId = `adset_${Date.now()}`

    let targeting = originalAdSet.targeting || {}

    // Modify audience if requested
    if (audienceModifications?.expand) {
      targeting.audience_expansion_percent = audienceModifications.expand
    }
    if (audienceModifications?.interests) {
      targeting.interests = audienceModifications.interests
    }
    if (audienceModifications?.locations) {
      targeting.locations = audienceModifications.locations
    }

    const clonedAdSet = {
      id: clonedAdSetId,
      meta_campaign_id: newCampaignId,
      name: `${originalAdSet.name} - Clone`,
      status: 'PAUSED',
      daily_budget: originalAdSet.daily_budget,
      optimization_goal: originalAdSet.optimization_goal,
      targeting,
      source_ad_set_id: originalAdSet.id,
    }

    await this.supabase.from('meta_ad_sets').insert([clonedAdSet])

    return clonedAdSetId
  }
}

export class ABTestRecommender {
  private supabase = supabaseAdmin()

  /**
   * Generate A/B test recommendations for a campaign
   */
  async generateTestRecommendations(campaignId: string): Promise<ABTestRecommendation[]> {
    const recommendations: ABTestRecommendation[] = []

    // Get campaign performance data
    const { data: campaign } = await this.supabase
      .from('meta_campaigns')
      .select('*, meta_ad_performance(*)')
      .eq('id', campaignId)
      .single()

    if (!campaign || !campaign.meta_ad_performance) return recommendations

    const avgRoas = campaign.meta_ad_performance.reduce((sum: number, p: any) => sum + (p.roas || 0), 0) /
      campaign.meta_ad_performance.length
    const totalSpend = campaign.meta_ad_performance.reduce((sum: number, p: any) => sum + (p.spend || 0), 0)

    // Recommendation 1: Creative variations test
    recommendations.push({
      id: `test_creative_${campaignId}`,
      campaign_id: campaignId,
      test_name: 'Creative Variations A/B Test',
      variation_type: 'creative',
      description:
        'Test different creative assets (images, videos, headlines) to identify top performers',
      hypothesis: 'Different creative variations will have different engagement rates and ROAS',
      test_duration_days: 14,
      sample_size_needed: Math.max(1000, Math.ceil(totalSpend / 5)),
      success_metrics: ['CTR', 'CPC', 'ROAS', 'Conversion Rate'],
      estimated_duration: '2-3 weeks',
      implementation_steps: [
        'Create 3-5 variations of the current creative',
        'Set equal budgets for each variation',
        'Run for 7-14 days',
        'Analyze performance metrics',
        'Scale winner with 25-50% budget increase',
      ],
      confidence_level: 0.85,
    })

    // Recommendation 2: Audience expansion test
    if (avgRoas > 2.0) {
      recommendations.push({
        id: `test_audience_${campaignId}`,
        campaign_id: campaignId,
        test_name: 'Lookalike Audience Test',
        variation_type: 'audience',
        description: 'Test lookalike audiences against current core audience',
        hypothesis: 'Lookalike audiences will maintain ROAS while increasing reach',
        test_duration_days: 21,
        sample_size_needed: Math.max(5000, Math.ceil(totalSpend / 2)),
        success_metrics: ['Reach', 'CPA', 'ROAS'],
        estimated_duration: '3-4 weeks',
        implementation_steps: [
          'Create 1% and 2% lookalike audiences from top converters',
          'Split budget equally between core and lookalike audiences',
          'Run for 14-21 days',
          'Compare CPA and ROAS metrics',
          'Roll out winner to 50% of budget',
        ],
        confidence_level: 0.8,
      })
    }

    // Recommendation 3: Bid strategy test
    recommendations.push({
      id: `test_bid_${campaignId}`,
      campaign_id: campaignId,
      test_name: 'Bid Strategy Optimization',
      variation_type: 'bid_strategy',
      description: 'Test different bid strategies to optimize cost per conversion',
      hypothesis: 'Dynamic bid strategies will achieve lower CPA than manual bidding',
      test_duration_days: 14,
      sample_size_needed: Math.max(500, Math.ceil(totalSpend / 10)),
      success_metrics: ['CPA', 'Conversion Rate', 'ROAS'],
      estimated_duration: '2-3 weeks',
      implementation_steps: [
        'Create control: Keep current bid strategy',
        'Create variant: Switch to TargetCPA strategy',
        'Run with equal budgets for 7-14 days',
        'Compare CPA performance',
        'Roll out winner to full budget',
      ],
      confidence_level: 0.75,
    })

    return recommendations
  }

  /**
   * Calculate sample size needed for test
   */
  calculateSampleSize(
    currentConversionRate: number,
    minDetectableEffect: number,
    confidence: number = 0.95,
    power: number = 0.8
  ): number {
    // Using simple sample size formula
    // In production, use more sophisticated statistical methods
    const z_alpha = confidence === 0.95 ? 1.96 : 2.576
    const z_beta = power === 0.8 ? 0.84 : 1.28

    const n = ((z_alpha + z_beta) ** 2 * currentConversionRate * (1 - currentConversionRate)) /
      (minDetectableEffect ** 2)

    return Math.ceil(n * 2) // multiply by 2 for both control and treatment
  }
}

export class CompetitiveAnalyzer {
  /**
   * Get competitor insights (simplified version)
   * In production, integrate with Meta Ads Library or other data sources
   */
  async analyzeCompetitors(industry: string): Promise<CompetitorInsight[]> {
    // This is a placeholder implementation
    // In production, fetch from Meta Ads Archive or competitive intelligence APIs

    const insights: CompetitorInsight[] = [
      {
        id: 'comp_1',
        competitor_name: 'Competitor A',
        ad_count: 45,
        platforms: ['Facebook', 'Instagram'],
        primary_objective: 'OUTCOME_TRAFFIC',
        creative_themes: ['Lifestyle', 'Problem-Solution', 'Social Proof'],
        call_to_action_types: ['Learn More', 'Sign Up', 'Get Started'],
        estimated_budget: '$5,000-$10,000/month',
        performance_benchmarks: {
          avg_cpc: 1.2,
          avg_ctr: 1.8,
        },
      },
      {
        id: 'comp_2',
        competitor_name: 'Competitor B',
        ad_count: 32,
        platforms: ['Facebook', 'Instagram', 'Messenger'],
        primary_objective: 'OUTCOME_LEADS',
        creative_themes: ['Educational', 'Case Study', 'Feature Highlight'],
        call_to_action_types: ['Request Demo', 'Download', 'Contact Us'],
        estimated_budget: '$10,000-$20,000/month',
        performance_benchmarks: {
          avg_cpc: 0.8,
          avg_ctr: 2.1,
        },
      },
    ]

    return insights
  }

  /**
   * Get industry benchmarks
   */
  getIndustryBenchmarks(industry: string): {
    avg_cpc: number
    avg_ctr: number
    avg_cpa: number
    avg_roas: number
  } {
    // Simplified benchmarks - in production, use real industry data
    const benchmarks: { [key: string]: any } = {
      ecommerce: { avg_cpc: 1.2, avg_ctr: 1.5, avg_cpa: 45, avg_roas: 2.5 },
      saas: { avg_cpc: 2.5, avg_ctr: 1.2, avg_cpa: 75, avg_roas: 3.0 },
      services: { avg_cpc: 1.8, avg_ctr: 1.4, avg_cpa: 60, avg_roas: 2.8 },
      default: { avg_cpc: 1.5, avg_ctr: 1.5, avg_cpa: 50, avg_roas: 2.5 },
    }

    return benchmarks[industry] || benchmarks.default
  }
}

export class BudgetReallocator {
  private supabase = supabaseAdmin()

  /**
   * Identify reallocation opportunities
   */
  async identifyReallocationOpportunities(
    accountId: string
  ): Promise<BudgetReallocationPlan[]> {
    const plans: BudgetReallocationPlan[] = []

    // Get all campaigns with performance metrics
    const { data: campaigns } = await this.supabase
      .from('meta_campaigns')
      .select('*, meta_ad_performance(*)')
      .eq('meta_account_id', accountId)

    if (!campaigns || campaigns.length < 2) return plans

    // Calculate average ROAS per campaign
    const roasData = campaigns.map((c: any) => ({
      id: c.id,
      name: c.name,
      roas: c.meta_ad_performance.reduce((sum: number, p: any) => sum + (p.roas || 0), 0) /
        c.meta_ad_performance.length,
      spend: c.meta_ad_performance.reduce((sum: number, p: any) => sum + (p.spend || 0), 0),
      daily_budget: c.daily_budget,
    }))

    // Find high and low performers
    const sorted = [...roasData].sort((a, b) => b.roas - a.roas)
    const highPerformers = sorted.slice(0, Math.ceil(sorted.length / 3))
    const lowPerformers = sorted.slice(-Math.ceil(sorted.length / 3))

    // Create reallocation plans
    for (const winner of highPerformers) {
      for (const loser of lowPerformers) {
        if (winner.roas > loser.roas * 1.5 && loser.spend > 100) {
          const reallocationAmount = Math.min(loser.spend * 0.25, 500)

          plans.push({
            id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            account_id: accountId,
            from_campaign_id: loser.id,
            to_campaign_id: winner.id,
            reallocation_amount: reallocationAmount,
            from_campaign_name: loser.name,
            to_campaign_name: winner.name,
            expected_roas_improvement: ((winner.roas - loser.roas) / loser.roas) * 100,
            rollout_duration_days: 7,
            rollback_available: true,
            approval_status: 'pending',
          })
        }
      }
    }

    return plans
  }

  /**
   * Apply budget reallocation plan
   */
  async applyReallocationPlan(planId: string): Promise<void> {
    // Update campaign budgets and mark plan as executed
    const { data: plan } = await this.supabase
      .from('meta_budget_reallocation_plans')
      .select('*')
      .eq('id', planId)
      .single()

    if (!plan) throw new Error('Plan not found')

    // This would update budgets in Meta API and database
    await this.supabase
      .from('meta_budget_reallocation_plans')
      .update({ approval_status: 'executed' })
      .eq('id', planId)
  }
}

export const campaignCloner = new CampaignCloner()
export const abTestRecommender = new ABTestRecommender()
export const competitiveAnalyzer = new CompetitiveAnalyzer()
export const budgetReallocator = new BudgetReallocator()
