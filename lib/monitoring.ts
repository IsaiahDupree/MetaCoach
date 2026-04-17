import { supabaseAdmin } from './supabase'

export interface ErrorLog {
  id: string
  timestamp: string
  severity: 'error' | 'warning' | 'info'
  message: string
  stack_trace?: string
  context?: {
    user_id?: string
    account_id?: string
    endpoint?: string
    [key: string]: any
  }
  resolved: boolean
}

export interface PerformanceMetric {
  id: string
  timestamp: string
  metric_type: 'api_response' | 'database_query' | 'page_load' | 'chart_render'
  duration_ms: number
  endpoint?: string
  status?: number
  success: boolean
  context?: {
    [key: string]: any
  }
}

export class ErrorTracker {
  private supabase = supabaseAdmin()
  private errors: ErrorLog[] = []
  private maxErrors = 100

  /**
   * Log an error
   */
  async logError(
    message: string,
    error?: Error,
    context?: ErrorLog['context']
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity: 'error',
      message,
      stack_trace: error?.stack,
      context,
      resolved: false,
    }

    // Store in memory
    this.errors.push(errorLog)
    if (this.errors.length > this.maxErrors) {
      this.errors.shift()
    }

    // Store in database
    try {
      await this.supabase.from('meta_error_logs').insert([errorLog])
    } catch (dbError) {
      console.error('Failed to log error to database:', dbError)
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error(`[${errorLog.severity.toUpperCase()}] ${message}`, error, context)
    }
  }

  /**
   * Log a warning
   */
  async logWarning(message: string, context?: ErrorLog['context']): Promise<void> {
    const warningLog: ErrorLog = {
      id: `warn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      severity: 'warning',
      message,
      context,
      resolved: false,
    }

    this.errors.push(warningLog)

    try {
      await this.supabase.from('meta_error_logs').insert([warningLog])
    } catch (dbError) {
      console.error('Failed to log warning to database:', dbError)
    }
  }

  /**
   * Get error frequency (for alerting on high error rates)
   */
  getErrorFrequency(timeWindowMinutes: number = 60): {
    total: number
    critical: number
    last_error?: string
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)

    const recentErrors = this.errors.filter(
      (e) => new Date(e.timestamp) > cutoffTime
    )

    return {
      total: recentErrors.length,
      critical: recentErrors.filter((e) => e.severity === 'error').length,
      last_error: recentErrors.length > 0 ? recentErrors[recentErrors.length - 1].message : undefined,
    }
  }

  /**
   * Get logs from database
   */
  async getLogs(
    limit: number = 50,
    severity?: 'error' | 'warning' | 'info'
  ): Promise<ErrorLog[]> {
    let query = this.supabase.from('meta_error_logs').select('*').order('timestamp', { ascending: false }).limit(limit)

    if (severity) {
      query = query.eq('severity', severity)
    }

    const { data } = await query

    return data || []
  }

  /**
   * Mark error as resolved
   */
  async resolveError(errorId: string): Promise<void> {
    await this.supabase.from('meta_error_logs').update({ resolved: true }).eq('id', errorId)
  }

  /**
   * Clear old logs (retention policy)
   */
  async clearOldLogs(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    const { error, data } = await this.supabase
      .from('meta_error_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select()

    if (error) throw error

    return (data as any)?.length || 0
  }
}

export class PerformanceMonitor {
  private supabase = supabaseAdmin()
  private metrics: PerformanceMetric[] = []
  private maxMetrics = 1000

  /**
   * Record API response time
   */
  async recordApiMetric(
    endpoint: string,
    durationMs: number,
    status: number,
    success: boolean
  ): Promise<void> {
    const metric: PerformanceMetric = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric_type: 'api_response',
      duration_ms: durationMs,
      endpoint,
      status,
      success,
    }

    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift()
    }

    // Store in database
    try {
      await this.supabase.from('meta_performance_metrics').insert([metric])
    } catch (dbError) {
      console.error('Failed to log performance metric:', dbError)
    }

    // Alert if response time is too high
    if (durationMs > 1000) {
      console.warn(`[PERF WARN] ${endpoint} took ${durationMs}ms`)
    }
  }

  /**
   * Record database query time
   */
  async recordDatabaseMetric(
    query: string,
    durationMs: number,
    success: boolean
  ): Promise<void> {
    const metric: PerformanceMetric = {
      id: `db_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric_type: 'database_query',
      duration_ms: durationMs,
      success,
      context: { query: query.substring(0, 100) },
    }

    this.metrics.push(metric)

    if (durationMs > 500) {
      console.warn(`[DB WARN] Query took ${durationMs}ms`)
    }
  }

  /**
   * Record page load time
   */
  recordPageLoadMetric(durationMs: number, pagePath: string): void {
    const metric: PerformanceMetric = {
      id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      metric_type: 'page_load',
      duration_ms: durationMs,
      success: durationMs < 3000,
      context: { page: pagePath },
    }

    this.metrics.push(metric)

    if (durationMs > 2000) {
      console.warn(`[PAGE WARN] ${pagePath} took ${durationMs}ms to load`)
    }
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary(timeWindowMinutes: number = 60): {
    avg_response_time_ms: number
    p95_response_time_ms: number
    p99_response_time_ms: number
    error_rate_percent: number
    total_requests: number
  } {
    const cutoffTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000)
    const recent = this.metrics.filter((m) => new Date(m.timestamp) > cutoffTime)

    if (recent.length === 0) {
      return {
        avg_response_time_ms: 0,
        p95_response_time_ms: 0,
        p99_response_time_ms: 0,
        error_rate_percent: 0,
        total_requests: 0,
      }
    }

    const durations = recent.map((m) => m.duration_ms).sort((a, b) => a - b)
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length
    const p95 = durations[Math.floor(durations.length * 0.95)]
    const p99 = durations[Math.floor(durations.length * 0.99)]
    const failures = recent.filter((m) => !m.success).length
    const errorRate = (failures / recent.length) * 100

    return {
      avg_response_time_ms: parseFloat(avg.toFixed(2)),
      p95_response_time_ms: p95,
      p99_response_time_ms: p99,
      error_rate_percent: parseFloat(errorRate.toFixed(2)),
      total_requests: recent.length,
    }
  }

  /**
   * Get metrics from database
   */
  async getMetrics(
    limit: number = 100,
    metricType?: PerformanceMetric['metric_type']
  ): Promise<PerformanceMetric[]> {
    let query = this.supabase
      .from('meta_performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (metricType) {
      query = query.eq('metric_type', metricType)
    }

    const { data } = await query

    return data || []
  }

  /**
   * Get slow endpoints
   */
  getSlowEndpoints(limit: number = 5): {
    endpoint: string
    avg_duration_ms: number
    max_duration_ms: number
    request_count: number
  }[] {
    const apiMetrics = this.metrics.filter((m) => m.metric_type === 'api_response' && m.endpoint)

    const grouped: {
      [key: string]: PerformanceMetric[]
    } = {}

    apiMetrics.forEach((m) => {
      if (m.endpoint) {
        if (!grouped[m.endpoint]) {
          grouped[m.endpoint] = []
        }
        grouped[m.endpoint].push(m)
      }
    })

    return Object.entries(grouped)
      .map(([endpoint, metrics]) => ({
        endpoint,
        avg_duration_ms: parseFloat(
          (metrics.reduce((a, m) => a + m.duration_ms, 0) / metrics.length).toFixed(2)
        ),
        max_duration_ms: Math.max(...metrics.map((m) => m.duration_ms)),
        request_count: metrics.length,
      }))
      .sort((a, b) => b.avg_duration_ms - a.avg_duration_ms)
      .slice(0, limit)
  }

  /**
   * Clear old metrics (retention policy)
   */
  async clearOldMetrics(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)

    const { data } = await this.supabase
      .from('meta_performance_metrics')
      .delete()
      .lt('timestamp', cutoffDate.toISOString())
      .select()

    return (data as any)?.length || 0
  }
}

// Export singleton instances
export const errorTracker = new ErrorTracker()
export const performanceMonitor = new PerformanceMonitor()
