import { supabaseAdmin } from './supabase'

export interface ReportMetrics {
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  avg_ctr: number
  avg_cpc: number
  avg_cpa: number
  avg_roas: number
}

export interface CampaignSummary {
  id: string
  name: string
  status: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
}

export interface Recommendation {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  estimated_impact: number
  implementation_instructions: string
}

export interface PerformanceData {
  date: string
  spend: number
  conversions: number
  impressions: number
  clicks: number
}

export interface ClientReport {
  id: string
  account_id: string
  generated_date: string
  date_range: {
    from: string
    to: string
  }
  summary: ReportMetrics
  executive_summary: {
    period: string
    key_achievements: string[]
    recommendations_count: number
    action_items: string[]
  }
  top_campaigns: CampaignSummary[]
  performance_data: PerformanceData[]
  recommendations: Recommendation[]
  charts: {
    type: string
    title: string
    data: any[]
  }[]
}

export class ReportGenerator {
  private supabase = supabaseAdmin()

  /**
   * Generate a comprehensive client report
   */
  async generateReport(accountId: string, fromDate: string, toDate: string): Promise<ClientReport> {
    const reportId = `report_${Date.now()}`

    // Fetch metrics for the period
    const metrics = await this.fetchMetrics(accountId, fromDate, toDate)

    // Fetch campaign summaries
    const campaigns = await this.fetchTopCampaigns(accountId, fromDate, toDate)

    // Fetch performance data for charts
    const performanceData = await this.fetchPerformanceData(accountId, fromDate, toDate)

    // Fetch recommendations
    const recommendations = await this.fetchRecommendations(accountId)

    // Generate executive summary
    const executiveSummary = this.generateExecutiveSummary(metrics, campaigns, recommendations)

    // Generate charts data
    const charts = this.generateCharts(performanceData, campaigns)

    const report: ClientReport = {
      id: reportId,
      account_id: accountId,
      generated_date: new Date().toISOString(),
      date_range: { from: fromDate, to: toDate },
      summary: metrics,
      executive_summary: executiveSummary,
      top_campaigns: campaigns,
      performance_data: performanceData,
      recommendations,
      charts,
    }

    // Store report in database
    await this.storeReport(report)

    return report
  }

  /**
   * Fetch aggregated metrics for the period
   */
  private async fetchMetrics(accountId: string, fromDate: string, toDate: string): Promise<ReportMetrics> {
    const { data: metrics } = await this.supabase
      .from('meta_ad_performance')
      .select('spend, impressions, clicks, actions, ctr, cpc, cpa, roas')
      .eq('meta_account_id', accountId)
      .gte('date', fromDate)
      .lte('date', toDate)

    if (!metrics || metrics.length === 0) {
      return {
        total_spend: 0,
        total_impressions: 0,
        total_clicks: 0,
        total_conversions: 0,
        avg_ctr: 0,
        avg_cpc: 0,
        avg_cpa: 0,
        avg_roas: 0,
      }
    }

    const total_spend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0)
    const total_impressions = metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)
    const total_clicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0)
    const total_conversions = metrics.reduce((sum, m) => sum + (m.actions || 0), 0)
    const avg_ctr = metrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / metrics.length
    const avg_cpc = metrics.reduce((sum, m) => sum + (m.cpc || 0), 0) / metrics.length
    const avg_cpa = metrics.reduce((sum, m) => sum + (m.cpa || 0), 0) / metrics.length
    const avg_roas = metrics.reduce((sum, m) => sum + (m.roas || 0), 0) / metrics.length

    return {
      total_spend,
      total_impressions,
      total_clicks,
      total_conversions,
      avg_ctr,
      avg_cpc,
      avg_cpa,
      avg_roas,
    }
  }

  /**
   * Fetch top performing campaigns
   */
  private async fetchTopCampaigns(
    accountId: string,
    fromDate: string,
    toDate: string
  ): Promise<CampaignSummary[]> {
    const { data: campaigns } = await this.supabase
      .from('meta_campaigns')
      .select(
        `
        id,
        name,
        status,
        meta_ad_performance(
          spend,
          impressions,
          clicks,
          actions,
          ctr,
          cpc,
          cpa,
          roas
        )
      `
      )
      .eq('meta_account_id', accountId)

    if (!campaigns) return []

    return campaigns
      .filter((c: any) => c.meta_ad_performance && c.meta_ad_performance.length > 0)
      .map((c: any) => {
        const perf = c.meta_ad_performance
        const spend = perf.reduce((sum: number, p: any) => sum + (p.spend || 0), 0)
        const impressions = perf.reduce((sum: number, p: any) => sum + (p.impressions || 0), 0)
        const clicks = perf.reduce((sum: number, p: any) => sum + (p.clicks || 0), 0)
        const conversions = perf.reduce((sum: number, p: any) => sum + (p.actions || 0), 0)
        const ctr = spend > 0 ? (clicks / impressions) * 100 : 0
        const cpc = clicks > 0 ? spend / clicks : 0
        const cpa = conversions > 0 ? spend / conversions : 0
        const roas = spend > 0 ? conversions / (spend / 100) : 0

        return {
          id: c.id,
          name: c.name,
          status: c.status,
          spend,
          impressions,
          clicks,
          conversions,
          ctr,
          cpc,
          cpa,
          roas,
        }
      })
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10)
  }

  /**
   * Fetch daily performance data for charts
   */
  private async fetchPerformanceData(
    accountId: string,
    fromDate: string,
    toDate: string
  ): Promise<PerformanceData[]> {
    const { data: metrics } = await this.supabase
      .from('meta_ad_performance')
      .select('date, spend, actions, impressions, clicks')
      .eq('meta_account_id', accountId)
      .gte('date', fromDate)
      .lte('date', toDate)
      .order('date', { ascending: true })

    if (!metrics) return []

    return metrics.map((m: any) => ({
      date: m.date,
      spend: m.spend || 0,
      conversions: m.actions || 0,
      impressions: m.impressions || 0,
      clicks: m.clicks || 0,
    }))
  }

  /**
   * Fetch recent recommendations for the account
   */
  private async fetchRecommendations(accountId: string): Promise<Recommendation[]> {
    const { data: recommendations } = await this.supabase
      .from('meta_recommendations')
      .select('*')
      .eq('meta_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (!recommendations) return []

    return recommendations.map((r: any) => ({
      title: r.title,
      description: r.description,
      priority: r.priority,
      estimated_impact: r.estimated_impact,
      implementation_instructions: r.implementation_instructions,
    }))
  }

  /**
   * Generate executive summary from metrics
   */
  private generateExecutiveSummary(
    metrics: ReportMetrics,
    campaigns: CampaignSummary[],
    recommendations: Recommendation[]
  ): ClientReport['executive_summary'] {
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - 30)
    const toDate = new Date()
    const period = `${fromDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`

    const keyAchievements = []

    if (metrics.avg_roas > 2.0) {
      keyAchievements.push(`Achieved ${metrics.avg_roas.toFixed(2)}x ROAS`)
    }
    if (metrics.total_conversions > 0) {
      keyAchievements.push(`Generated ${Math.round(metrics.total_conversions)} conversions`)
    }
    if (metrics.total_spend > 0) {
      keyAchievements.push(`Spent ${metrics.total_spend.toFixed(2)} USD efficiently`)
    }
    if (campaigns.length > 0) {
      keyAchievements.push(`${campaigns.length} active campaigns`)
    }

    const actionItems: string[] = []
    recommendations.forEach((rec) => {
      if (rec.priority === 'high') {
        actionItems.push(rec.title)
      }
    })

    return {
      period,
      key_achievements: keyAchievements,
      recommendations_count: recommendations.length,
      action_items: actionItems.slice(0, 5),
    }
  }

  /**
   * Generate chart data for visualization
   */
  private generateCharts(
    performanceData: PerformanceData[],
    campaigns: CampaignSummary[]
  ): ClientReport['charts'] {
    const charts = []

    // Spend trend chart
    if (performanceData.length > 0) {
      charts.push({
        type: 'line',
        title: 'Spend Over Time',
        data: performanceData.map((d) => ({
          date: d.date,
          spend: d.spend,
        })),
      })

      // Conversions trend chart
      charts.push({
        type: 'line',
        title: 'Conversions Over Time',
        data: performanceData.map((d) => ({
          date: d.date,
          conversions: d.conversions,
        })),
      })
    }

    // Campaign performance chart
    if (campaigns.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Campaign Performance',
        data: campaigns.slice(0, 10).map((c) => ({
          name: c.name,
          spend: c.spend,
          conversions: c.conversions,
          roas: c.roas,
        })),
      })
    }

    return charts
  }

  /**
   * Store report in database
   */
  private async storeReport(report: ClientReport): Promise<void> {
    await this.supabase.from('meta_reports').insert([
      {
        id: report.id,
        meta_account_id: report.account_id,
        generated_date: report.generated_date,
        date_range_from: report.date_range.from,
        date_range_to: report.date_range.to,
        report_data: JSON.stringify(report),
      },
    ])
  }

  /**
   * Retrieve a stored report
   */
  async getReport(reportId: string): Promise<ClientReport | null> {
    const { data } = await this.supabase
      .from('meta_reports')
      .select('report_data')
      .eq('id', reportId)
      .single()

    if (!data || !data.report_data) return null

    return JSON.parse(data.report_data)
  }
}

export default new ReportGenerator()
