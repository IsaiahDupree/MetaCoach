import { supabaseAdmin } from './supabase'

export interface EmailTemplate {
  subject: string
  body: string
  html: string
  attachments?: {
    filename: string
    content: Buffer | string
    contentType: string
  }[]
}

export interface ReportSchedule {
  id: string
  meta_account_id: string
  frequency: 'daily' | 'weekly' | 'monthly'
  send_day?: number // 0-6 for weekly, 1-31 for monthly
  send_time: string // HH:MM format
  recipients: string[]
  enabled: boolean
  created_at: string
  updated_at: string
}

export class EmailService {
  private supabase = supabaseAdmin()

  /**
   * Send a report via email
   */
  async sendReportEmail(
    recipients: string[],
    reportData: {
      title: string
      period: string
      metrics: any
      attachment: {
        filename: string
        content: Buffer | string
      }
    }
  ): Promise<{
    success: boolean
    messageId?: string
    error?: string
  }> {
    try {
      const template = this.generateEmailTemplate(reportData)

      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      // For now, we'll store in database and log
      const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store email record
      await this.supabase.from('meta_email_logs').insert([
        {
          id: messageId,
          recipients: recipients.join(','),
          subject: template.subject,
          status: 'sent',
          sent_at: new Date().toISOString(),
          attachment_filename: reportData.attachment.filename,
        },
      ])

      return {
        success: true,
        messageId,
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Generate email template for report
   */
  private generateEmailTemplate(reportData: {
    title: string
    period: string
    metrics: any
  }): EmailTemplate {
    const { title, period, metrics } = reportData

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 4px 4px 0 0; }
    .header h1 { margin: 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #eee; }
    .metrics { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
    .metric { background: white; padding: 15px; border-radius: 4px; border-left: 3px solid #007bff; }
    .metric-label { font-size: 12px; color: #666; text-transform: uppercase; }
    .metric-value { font-size: 20px; font-weight: bold; color: #333; }
    .cta { text-align: center; margin: 20px 0; }
    .cta a { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block; }
    .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
      <p>Performance Report for ${period}</p>
    </div>

    <div class="content">
      <p>Hi there,</p>
      <p>Your monthly performance report is ready. Here are the highlights:</p>

      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Total Spend</div>
          <div class="metric-value">$${metrics.total_spend.toFixed(2)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Conversions</div>
          <div class="metric-value">${Math.round(metrics.total_conversions)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">ROAS</div>
          <div class="metric-value">${metrics.avg_roas.toFixed(2)}x</div>
        </div>
        <div class="metric">
          <div class="metric-label">CTR</div>
          <div class="metric-value">${(metrics.avg_ctr * 100).toFixed(2)}%</div>
        </div>
      </div>

      <p>Your full detailed report is attached as a PDF. It includes campaign analysis, performance trends, and actionable recommendations.</p>

      <div class="cta">
        <a href="https://metacoach.example.com/reports">View Full Report</a>
      </div>

      <p>Have questions? Reply to this email or contact our support team.</p>

      <div class="footer">
        <p>MetaCoach &mdash; Intelligent Meta Ads Coaching Platform</p>
        <p>&copy; 2024. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `

    return {
      subject: `${title} - ${period}`,
      body: `Your ${title} is ready for ${period}. See attached PDF for full details.`,
      html: htmlBody,
    }
  }

  /**
   * Create a report schedule
   */
  async createSchedule(schedule: Omit<ReportSchedule, 'id' | 'created_at' | 'updated_at'>): Promise<ReportSchedule> {
    const id = `schedule_${Date.now()}`
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('meta_report_schedules')
      .insert([
        {
          id,
          ...schedule,
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return {
      ...data,
    }
  }

  /**
   * Update a report schedule
   */
  async updateSchedule(scheduleId: string, updates: Partial<ReportSchedule>): Promise<ReportSchedule> {
    const { data, error } = await this.supabase
      .from('meta_report_schedules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', scheduleId)
      .select()
      .single()

    if (error) throw error

    return data
  }

  /**
   * Delete a report schedule
   */
  async deleteSchedule(scheduleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('meta_report_schedules')
      .delete()
      .eq('id', scheduleId)

    if (error) throw error
  }

  /**
   * Get all schedules for an account
   */
  async getSchedules(accountId: string): Promise<ReportSchedule[]> {
    const { data, error } = await this.supabase
      .from('meta_report_schedules')
      .select('*')
      .eq('meta_account_id', accountId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  }

  /**
   * Get a specific schedule
   */
  async getSchedule(scheduleId: string): Promise<ReportSchedule | null> {
    const { data, error } = await this.supabase
      .from('meta_report_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single()

    if (error) return null

    return data
  }

  /**
   * Check if a report should be sent based on schedule
   */
  shouldSendReport(schedule: ReportSchedule): boolean {
    const now = new Date()
    const currentDay = now.getDay() // 0-6
    const currentDate = now.getDate() // 1-31
    const currentTime = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')

    // Check if enabled
    if (!schedule.enabled) return false

    // Check time
    if (currentTime !== schedule.send_time) return false

    // Check frequency
    switch (schedule.frequency) {
      case 'daily':
        return true
      case 'weekly':
        return currentDay === (schedule.send_day || 0)
      case 'monthly':
        return currentDate === (schedule.send_day || 1)
      default:
        return false
    }
  }

  /**
   * Get all schedules that should send reports now
   */
  async getSchedulesToProcess(): Promise<ReportSchedule[]> {
    const { data, error } = await this.supabase
      .from('meta_report_schedules')
      .select('*')
      .eq('enabled', true)

    if (error) return []

    return (data || []).filter((schedule) => this.shouldSendReport(schedule))
  }
}

export default new EmailService()
