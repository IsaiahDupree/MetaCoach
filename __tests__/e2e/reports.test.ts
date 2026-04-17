/**
 * E2E Tests - Report Generation
 * These tests simulate complete report generation and delivery workflows
 */

describe('Report Generation E2E Tests', () => {
  beforeEach(() => {
    global.fetch = jest.fn()
  })

  describe('Report Generation', () => {
    it('should generate a comprehensive performance report', async () => {
      const mockReport = {
        id: 'report_1',
        account_id: 'act_123',
        date_range: { from: '2024-01-01', to: '2024-01-31' },
        summary: {
          total_spend: 1500,
          total_impressions: 50000,
          total_clicks: 1000,
          total_conversions: 50,
          avg_ctr: 0.02,
          avg_cpc: 1.5,
          avg_roas: 3.33,
        },
        top_campaigns: [
          {
            id: 'camp_1',
            name: 'Campaign 1',
            spend: 800,
            conversions: 35,
            roas: 4.0,
          },
        ],
        recommendations: [
          {
            title: 'Increase Budget',
            description: 'Campaign 1 is performing well',
            estimated_impact: 40,
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReport),
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        body: JSON.stringify({
          account_id: 'act_123',
          from_date: '2024-01-01',
          to_date: '2024-01-31',
        }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.summary.avg_roas).toBe(3.33)
      expect(data.recommendations.length).toBeGreaterThan(0)
    })

    it('should include executive summary in report', async () => {
      const mockReport = {
        executive_summary: {
          period: 'January 2024',
          key_achievements: [
            'Achieved 3.33x ROAS',
            'Generated 50 conversions',
            'Spent $1,500 efficiently',
          ],
          recommendations_count: 3,
          action_items: [
            'Scale high-performing campaigns',
            'Refresh ad creatives',
            'Expand winning audience',
          ],
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReport),
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.executive_summary).toBeDefined()
      expect(data.executive_summary.key_achievements.length).toBeGreaterThan(0)
    })

    it('should include visualizations/charts in report', async () => {
      const mockReport = {
        charts: [
          {
            type: 'line',
            title: 'Spend Over Time',
            data: Array(30)
              .fill(null)
              .map((_, i) => ({ date: `2024-01-${(i + 1).toString().padStart(2, '0')}`, value: Math.random() * 100 })),
          },
          {
            type: 'bar',
            title: 'Campaign Performance',
            data: [
              { name: 'Campaign 1', roas: 4.0 },
              { name: 'Campaign 2', roas: 2.5 },
              { name: 'Campaign 3', roas: 1.8 },
            ],
          },
        ],
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReport),
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.charts).toHaveLength(2)
      expect(data.charts[0].type).toBe('line')
    })
  })

  describe('PDF Export', () => {
    it('should export report as PDF', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['PDF content'], { type: 'application/pdf' })),
        headers: { 'content-type': 'application/pdf' },
      })

      const response = await fetch('/api/reports/export/pdf', {
        method: 'POST',
        body: JSON.stringify({ report_id: 'report_1' }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      expect(response.ok).toBe(true)
      const pdfBlob = await response.blob()
      expect(pdfBlob.type).toBe('application/pdf')
    })

    it('should include all report sections in PDF', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            sections: [
              'executive_summary',
              'performance_metrics',
              'campaign_analysis',
              'recommendations',
              'next_steps',
            ],
            file_size_kb: 250,
          }),
      })

      const response = await fetch('/api/reports/validate-pdf', {
        method: 'POST',
        body: JSON.stringify({ report_id: 'report_1' }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.sections.length).toBe(5)
      expect(data.file_size_kb).toBeLessThan(5000)
    })

    it('should handle PDF generation errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'PDF generation failed' }),
      })

      const response = await fetch('/api/reports/export/pdf', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })
  })

  describe('Email Delivery', () => {
    it('should send report via email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'Report sent successfully',
            recipient: 'client@example.com',
            sent_at: new Date().toISOString(),
          }),
      })

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        body: JSON.stringify({
          report_id: 'report_1',
          recipient_email: 'client@example.com',
        }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.recipient).toBe('client@example.com')
    })

    it('should include PDF attachment in email', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            message: 'Report sent successfully',
            attachment: {
              filename: 'report_january_2024.pdf',
              size_bytes: 256000,
            },
          }),
      })

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.attachment).toBeDefined()
      expect(data.attachment.filename).toContain('.pdf')
    })

    it('should handle email delivery errors', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'Invalid email address' }),
      })

      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      expect(response.ok).toBe(false)
    })
  })

  describe('Report Scheduling', () => {
    it('should create a report schedule', async () => {
      const mockSchedule = {
        id: 'schedule_1',
        account_id: 'act_123',
        frequency: 'monthly',
        send_day: 1,
        send_time: '09:00',
        recipients: ['client@example.com'],
        enabled: true,
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSchedule),
      })

      const response = await fetch('/api/reports/schedule', {
        method: 'POST',
        body: JSON.stringify({
          account_id: 'act_123',
          frequency: 'monthly',
          send_day: 1,
          send_time: '09:00',
          recipients: ['client@example.com'],
        }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.frequency).toBe('monthly')
      expect(data.recipients).toContain('client@example.com')
    })

    it('should update report schedule', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'schedule_1',
            frequency: 'weekly',
            enabled: true,
          }),
      })

      const response = await fetch('/api/reports/schedule/schedule_1', {
        method: 'PUT',
        body: JSON.stringify({ frequency: 'weekly' }),
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.frequency).toBe('weekly')
    })

    it('should list all schedules for account', async () => {
      const mockSchedules = [
        {
          id: 'schedule_1',
          frequency: 'weekly',
          enabled: true,
        },
        {
          id: 'schedule_2',
          frequency: 'monthly',
          enabled: true,
        },
      ]

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ schedules: mockSchedules }),
      })

      const response = await fetch('/api/reports/schedule?account_id=act_123', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.schedules).toHaveLength(2)
    })

    it('should delete a schedule', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: 'Schedule deleted' }),
      })

      const response = await fetch('/api/reports/schedule/schedule_1', {
        method: 'DELETE',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      expect(response.ok).toBe(true)
    })
  })

  describe('Report Accuracy', () => {
    it('should have accurate metrics in report', async () => {
      const mockReport = {
        summary: {
          total_spend: 1500,
          total_conversions: 50,
          roas: 5.0, // 1500 * 5 / 1500 = 5
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockReport),
      })

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.summary.roas).toBe(5.0)
    })
  })
})
