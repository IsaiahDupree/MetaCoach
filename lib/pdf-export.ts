import type { ClientReport } from './report-generator'

export interface PDFExportOptions {
  includeCharts?: boolean
  includeBranding?: boolean
  paperSize?: 'A4' | 'Letter'
}

export class PDFExporter {
  private defaultOptions: PDFExportOptions = {
    includeCharts: true,
    includeBranding: true,
    paperSize: 'A4',
  }

  /**
   * Convert report to HTML for PDF generation
   */
  private generateHTML(report: ClientReport, options: PDFExportOptions): string {
    const now = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 850px;
      margin: 0 auto;
      padding: 40px;
    }
    .header {
      border-bottom: 2px solid #007bff;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0;
      color: #007bff;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0 0 0;
      color: #666;
      font-size: 14px;
    }
    .section {
      margin-bottom: 40px;
      page-break-inside: avoid;
    }
    .section h2 {
      font-size: 20px;
      color: #333;
      border-bottom: 1px solid #eee;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 20px;
    }
    .metric-card {
      border: 1px solid #eee;
      padding: 15px;
      border-radius: 4px;
      background: #f9f9f9;
    }
    .metric-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }
    .achievements {
      background: #f0f8ff;
      border-left: 4px solid #007bff;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .achievements ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .achievements li {
      margin-bottom: 8px;
    }
    .table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .table th {
      background: #f9f9f9;
      padding: 12px;
      text-align: left;
      border-bottom: 2px solid #ddd;
      font-weight: 600;
      font-size: 13px;
    }
    .table td {
      padding: 12px;
      border-bottom: 1px solid #eee;
    }
    .table tbody tr:hover {
      background: #f9f9f9;
    }
    .recommendations {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin-bottom: 15px;
      border-radius: 4px;
    }
    .recommendation-item {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #ffe8a1;
    }
    .recommendation-item:last-child {
      border-bottom: none;
      margin-bottom: 0;
      padding-bottom: 0;
    }
    .recommendation-title {
      font-weight: bold;
      color: #333;
      margin-bottom: 5px;
    }
    .recommendation-priority {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      font-weight: 600;
      margin-bottom: 8px;
    }
    .priority-high {
      background: #f8d7da;
      color: #721c24;
    }
    .priority-medium {
      background: #fff3cd;
      color: #856404;
    }
    .priority-low {
      background: #d1ecf1;
      color: #0c5460;
    }
    .chart-placeholder {
      background: #f9f9f9;
      border: 1px solid #eee;
      padding: 40px;
      text-align: center;
      color: #999;
      margin-bottom: 20px;
      border-radius: 4px;
      min-height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #eee;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .date-range {
      color: #666;
      font-size: 14px;
      margin-bottom: 10px;
    }
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Performance Report</h1>
    <p>${report.account_id}</p>
    <p class="date-range">Period: ${report.date_range.from} to ${report.date_range.to}</p>
    <p class="date-range">Generated: ${now}</p>
  </div>

  <!-- Executive Summary -->
  <div class="section">
    <h2>Executive Summary</h2>
    <p><strong>Period:</strong> ${report.executive_summary.period}</p>

    ${
      report.executive_summary.key_achievements.length > 0
        ? `
    <div class="achievements">
      <strong>Key Achievements:</strong>
      <ul>
        ${report.executive_summary.key_achievements.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }

    ${
      report.executive_summary.action_items.length > 0
        ? `
    <div class="recommendations">
      <strong>Priority Action Items:</strong>
      <ul>
        ${report.executive_summary.action_items.map((item) => `<li>${item}</li>`).join('')}
      </ul>
    </div>
    `
        : ''
    }
  </div>

  <!-- Performance Metrics -->
  <div class="section">
    <h2>Performance Metrics</h2>
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Spend</div>
        <div class="metric-value">$${report.summary.total_spend.toFixed(2)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Impressions</div>
        <div class="metric-value">${report.summary.total_impressions.toLocaleString()}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Conversions</div>
        <div class="metric-value">${Math.round(report.summary.total_conversions)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">ROAS</div>
        <div class="metric-value">${report.summary.avg_roas.toFixed(2)}x</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">CTR</div>
        <div class="metric-value">${(report.summary.avg_ctr * 100).toFixed(2)}%</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">CPC</div>
        <div class="metric-value">$${report.summary.avg_cpc.toFixed(2)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">CPA</div>
        <div class="metric-value">$${report.summary.avg_cpa.toFixed(2)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Click Through Rate</div>
        <div class="metric-value">${report.summary.total_clicks.toLocaleString()}</div>
      </div>
    </div>
  </div>

  <!-- Charts -->
  ${
    options.includeCharts && report.charts.length > 0
      ? `
  <div class="section">
    <h2>Performance Trends</h2>
    ${report.charts
      .map(
        (chart) => `
      <div>
        <h3 style="font-size: 16px; margin-bottom: 10px;">${chart.title}</h3>
        <div class="chart-placeholder">Chart: ${chart.title}</div>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <!-- Top Campaigns -->
  ${
    report.top_campaigns.length > 0
      ? `
  <div class="section">
    <h2>Top Performing Campaigns</h2>
    <table class="table">
      <thead>
        <tr>
          <th>Campaign Name</th>
          <th>Spend</th>
          <th>Conversions</th>
          <th>ROAS</th>
        </tr>
      </thead>
      <tbody>
        ${report.top_campaigns
          .slice(0, 10)
          .map(
            (c) => `
          <tr>
            <td>${c.name}</td>
            <td>$${c.spend.toFixed(2)}</td>
            <td>${Math.round(c.conversions)}</td>
            <td>${c.roas.toFixed(2)}x</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>
  `
      : ''
  }

  <!-- Recommendations -->
  ${
    report.recommendations.length > 0
      ? `
  <div class="section">
    <h2>Recommendations</h2>
    ${report.recommendations
      .slice(0, 5)
      .map(
        (rec) => `
      <div class="recommendation-item">
        <div class="recommendation-priority priority-${rec.priority}">${rec.priority.toUpperCase()}</div>
        <div class="recommendation-title">${rec.title}</div>
        <p style="margin: 5px 0; color: #666;">${rec.description}</p>
        <p style="margin: 5px 0; font-size: 13px; color: #999;">
          <strong>Implementation:</strong> ${rec.implementation_instructions}
        </p>
        <p style="margin: 5px 0; font-size: 13px; color: #999;">
          <strong>Estimated Impact:</strong> ${rec.estimated_impact}%
        </p>
      </div>
    `
      )
      .join('')}
  </div>
  `
      : ''
  }

  <div class="footer">
    <p>MetaCoach &bull; Automated Performance Report</p>
    <p>For questions or support, contact your account manager.</p>
  </div>
</body>
</html>
    `
  }

  /**
   * Export report as PDF
   * Note: In a real implementation, you would use a library like pdfkit or html2pdf
   * For now, this returns the HTML that can be converted to PDF
   */
  async exportAsPDF(report: ClientReport, options?: PDFExportOptions): Promise<Blob> {
    const mergedOptions = { ...this.defaultOptions, ...options }
    const html = this.generateHTML(report, mergedOptions)

    // In a real implementation, you would use a PDF library here
    // For now, we're returning a Blob that contains the HTML
    // In production, use: html2pdf, pdfkit, or call a server-side PDF conversion service

    const htmlBlob = new Blob([html], { type: 'text/html' })
    return htmlBlob
  }

  /**
   * Generate PDF as data URI (for downloads)
   */
  async generatePDFDataUri(report: ClientReport, options?: PDFExportOptions): Promise<string> {
    const blob = await this.exportAsPDF(report, options)
    return URL.createObjectURL(blob)
  }

  /**
   * Validate PDF before delivery
   */
  validatePDF(pdfData: Blob): {
    isValid: boolean
    fileSizeKB: number
    issues: string[]
  } {
    const issues: string[] = []
    const fileSizeKB = pdfData.size / 1024

    if (fileSizeKB > 5000) {
      issues.push('PDF file size exceeds 5MB limit')
    }

    if (pdfData.size === 0) {
      issues.push('PDF is empty')
    }

    if (!pdfData.type.includes('pdf') && !pdfData.type.includes('octet-stream')) {
      issues.push('Invalid PDF file type')
    }

    return {
      isValid: issues.length === 0,
      fileSizeKB,
      issues,
    }
  }
}

export default new PDFExporter()
