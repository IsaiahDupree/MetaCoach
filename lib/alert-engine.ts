import { supabaseAdmin } from './supabase'

export interface PerformanceAlert {
  id: string
  meta_account_id: string
  alert_type: 'anomaly' | 'budget_overspend' | 'low_performance' | 'high_cpc'
  title: string
  description: string
  severity: 'critical' | 'warning' | 'info'
  metric: string
  current_value: number
  threshold_value: number
  created_at: string
  acknowledged: boolean
}

export interface AlertThreshold {
  id: string
  meta_account_id: string
  alert_type: 'anomaly' | 'budget_overspend' | 'low_performance' | 'high_cpc'
  metric: string
  threshold: number
  operator: '>' | '<' | '=' | '!='
  enabled: boolean
}

export interface AlertConfiguration {
  meta_account_id: string
  email_recipients: string[]
  sms_recipients?: string[]
  enable_performance_alerts: boolean
  enable_budget_alerts: boolean
  performance_alert_delay_minutes?: number
  budget_alert_threshold_percent?: number
}

export class AlertEngine {
  private supabase = supabaseAdmin()

  /**
   * Check for performance anomalies
   */
  async checkPerformanceAnomalies(accountId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = []

    // Fetch current metrics
    const { data: currentMetrics } = await this.supabase
      .from('meta_ad_performance')
      .select('*')
      .eq('meta_account_id', accountId)
      .order('date', { ascending: false })
      .limit(7)

    if (!currentMetrics || currentMetrics.length === 0) return alerts

    // Get historical metrics (30 days ago)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: historicalMetrics } = await this.supabase
      .from('meta_ad_performance')
      .select('*')
      .eq('meta_account_id', accountId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .lte('date', new Date(thirtyDaysAgo.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (!historicalMetrics) return alerts

    // Calculate metrics
    const currentAvg = this.calculateMetricsAverage(currentMetrics)
    const historicalAvg = this.calculateMetricsAverage(historicalMetrics)

    // Check for significant drops
    const ctrDrop = ((historicalAvg.ctr - currentAvg.ctr) / historicalAvg.ctr) * 100
    if (ctrDrop > 20) {
      alerts.push({
        id: `alert_${Date.now()}_ctr`,
        meta_account_id: accountId,
        alert_type: 'anomaly',
        title: 'Significant CTR Drop Detected',
        description: `Click-through rate has dropped ${ctrDrop.toFixed(1)}% compared to 30-day average. This may indicate audience fatigue or targeting issues.`,
        severity: 'warning',
        metric: 'ctr',
        current_value: currentAvg.ctr,
        threshold_value: historicalAvg.ctr,
        created_at: new Date().toISOString(),
        acknowledged: false,
      })
    }

    // Check for ROAS decline
    const roasDrop = ((historicalAvg.roas - currentAvg.roas) / historicalAvg.roas) * 100
    if (roasDrop > 30) {
      alerts.push({
        id: `alert_${Date.now()}_roas`,
        meta_account_id: accountId,
        alert_type: 'low_performance',
        title: 'ROAS Below Average',
        description: `Return on ad spend has declined ${roasDrop.toFixed(1)}%. Consider reviewing targeting, creative, or budget allocation.`,
        severity: 'critical',
        metric: 'roas',
        current_value: currentAvg.roas,
        threshold_value: historicalAvg.roas,
        created_at: new Date().toISOString(),
        acknowledged: false,
      })
    }

    // Check for CPC increase
    const cpcIncrease = ((currentAvg.cpc - historicalAvg.cpc) / historicalAvg.cpc) * 100
    if (cpcIncrease > 25) {
      alerts.push({
        id: `alert_${Date.now()}_cpc`,
        meta_account_id: accountId,
        alert_type: 'high_cpc',
        title: 'Cost Per Click Increased',
        description: `CPC has increased ${cpcIncrease.toFixed(1)}%, indicating higher competition or lower relevance.`,
        severity: 'warning',
        metric: 'cpc',
        current_value: currentAvg.cpc,
        threshold_value: historicalAvg.cpc,
        created_at: new Date().toISOString(),
        acknowledged: false,
      })
    }

    // Store alerts in database
    for (const alert of alerts) {
      await this.storeAlert(alert)
    }

    return alerts
  }

  /**
   * Check for budget overspend
   */
  async checkBudgetOverspend(accountId: string): Promise<PerformanceAlert[]> {
    const alerts: PerformanceAlert[] = []

    // Fetch campaigns with budget data
    const { data: campaigns } = await this.supabase
      .from('meta_campaigns')
      .select('*, meta_ad_performance(spend, actions)')
      .eq('meta_account_id', accountId)

    if (!campaigns) return alerts

    for (const campaign of campaigns) {
      const totalSpend = campaign.meta_ad_performance?.reduce((sum: number, p: any) => sum + (p.spend || 0), 0) || 0

      // Get daily budget if available
      const dailyBudget = (campaign as any).daily_budget || 0
      if (dailyBudget > 0) {
        const daysSinceStart = 1
        const budgetLimit = dailyBudget * daysSinceStart
        const percentOfBudget = (totalSpend / budgetLimit) * 100

        if (percentOfBudget > 100) {
          alerts.push({
            id: `alert_${Date.now()}_budget`,
            meta_account_id: accountId,
            alert_type: 'budget_overspend',
            title: `Budget Overspend - ${campaign.name}`,
            description: `Campaign has spent ${percentOfBudget.toFixed(1)}% of daily budget. Current spend: $${totalSpend.toFixed(2)}, Daily budget: $${dailyBudget.toFixed(2)}.`,
            severity: 'critical',
            metric: 'daily_budget',
            current_value: totalSpend,
            threshold_value: dailyBudget,
            created_at: new Date().toISOString(),
            acknowledged: false,
          })
        } else if (percentOfBudget > 80) {
          alerts.push({
            id: `alert_${Date.now()}_budget_warn`,
            meta_account_id: accountId,
            alert_type: 'budget_overspend',
            title: `Budget Warning - ${campaign.name}`,
            description: `Campaign has spent ${percentOfBudget.toFixed(1)}% of daily budget. Approaching limit.`,
            severity: 'warning',
            metric: 'daily_budget',
            current_value: totalSpend,
            threshold_value: dailyBudget,
            created_at: new Date().toISOString(),
            acknowledged: false,
          })
        }
      }
    }

    // Store alerts
    for (const alert of alerts) {
      await this.storeAlert(alert)
    }

    return alerts
  }

  /**
   * Send alert notifications
   */
  async sendAlertNotifications(alerts: PerformanceAlert[], config: AlertConfiguration): Promise<void> {
    if (alerts.length === 0 || !config.email_recipients.length) return

    const emailBody = this.generateAlertEmailBody(alerts)

    // Log alert notifications for processing by email service
    console.log('Alert notifications to send:', {
      recipients: config.email_recipients,
      alert_count: alerts.length,
      critical_count: alerts.filter((a) => a.severity === 'critical').length,
      body: emailBody,
    })
  }

  /**
   * Generate alert email body
   */
  private generateAlertEmailBody(alerts: PerformanceAlert[]): string {
    let body = 'Performance Alerts\n'
    body += '==================\n\n'

    const criticalAlerts = alerts.filter((a) => a.severity === 'critical')
    const warningAlerts = alerts.filter((a) => a.severity === 'warning')
    const infoAlerts = alerts.filter((a) => a.severity === 'info')

    if (criticalAlerts.length > 0) {
      body += 'CRITICAL ALERTS\n'
      body += criticalAlerts.map((a) => `- ${a.title}: ${a.description}`).join('\n')
      body += '\n\n'
    }

    if (warningAlerts.length > 0) {
      body += 'WARNINGS\n'
      body += warningAlerts.map((a) => `- ${a.title}: ${a.description}`).join('\n')
      body += '\n\n'
    }

    if (infoAlerts.length > 0) {
      body += 'INFO\n'
      body += infoAlerts.map((a) => `- ${a.title}: ${a.description}`).join('\n')
      body += '\n\n'
    }

    return body
  }

  /**
   * Store alert in database
   */
  private async storeAlert(alert: PerformanceAlert): Promise<void> {
    await this.supabase.from('meta_alerts').insert([alert])
  }

  /**
   * Get recent alerts for account
   */
  async getAlerts(accountId: string, limit: number = 10): Promise<PerformanceAlert[]> {
    const { data } = await this.supabase
      .from('meta_alerts')
      .select('*')
      .eq('meta_account_id', accountId)
      .order('created_at', { ascending: false })
      .limit(limit)

    return data || []
  }

  /**
   * Acknowledge an alert
   */
  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.supabase.from('meta_alerts').update({ acknowledged: true }).eq('id', alertId)
  }

  /**
   * Create or update alert threshold
   */
  async setAlertThreshold(threshold: AlertThreshold): Promise<AlertThreshold> {
    const { data, error } = await this.supabase
      .from('meta_alert_thresholds')
      .upsert([threshold], { onConflict: 'id' })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Get alert configuration for account
   */
  async getAlertConfig(accountId: string): Promise<AlertConfiguration | null> {
    const { data } = await this.supabase
      .from('meta_alert_configurations')
      .select('*')
      .eq('meta_account_id', accountId)
      .single()

    return data || null
  }

  /**
   * Update alert configuration
   */
  async updateAlertConfig(accountId: string, config: Partial<AlertConfiguration>): Promise<AlertConfiguration> {
    const { data, error } = await this.supabase
      .from('meta_alert_configurations')
      .update(config)
      .eq('meta_account_id', accountId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Calculate average metrics
   */
  private calculateMetricsAverage(metrics: any[]): {
    ctr: number
    cpc: number
    roas: number
    spend: number
  } {
    if (metrics.length === 0) {
      return { ctr: 0, cpc: 0, roas: 0, spend: 0 }
    }

    const ctr = metrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / metrics.length
    const cpc = metrics.reduce((sum, m) => sum + (m.cpc || 0), 0) / metrics.length
    const roas = metrics.reduce((sum, m) => sum + (m.roas || 0), 0) / metrics.length
    const spend = metrics.reduce((sum, m) => sum + (m.spend || 0), 0)

    return { ctr, cpc, roas, spend }
  }
}

export default new AlertEngine()
