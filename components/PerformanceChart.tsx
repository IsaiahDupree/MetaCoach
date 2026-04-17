'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export interface PerformanceData {
  date: string
  spend: number
  conversions: number
  impressions: number
  clicks: number
}

interface PerformanceChartProps {
  data: PerformanceData[]
  metric?: 'spend' | 'conversions' | 'impressions' | 'clicks'
  timeframe?: '7d' | '30d' | '90d'
  onTimeframeChange?: (timeframe: '7d' | '30d' | '90d') => void
}

export function PerformanceChart({
  data,
  metric = 'spend',
  timeframe = '30d',
  onTimeframeChange,
}: PerformanceChartProps) {
  const [selectedMetric, setSelectedMetric] = useState(metric)

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data.map((item) => ({
      ...item,
      dateLabel: new Date(item.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
    }))
  }, [data])

  if (!chartData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-600">No data available for the selected period</p>
      </div>
    )
  }

  const metricConfig = {
    spend: {
      label: 'Spend ($)',
      color: '#3b82f6',
      dataKey: 'spend',
      yAxisLabel: 'USD',
    },
    conversions: {
      label: 'Conversions',
      color: '#10b981',
      dataKey: 'conversions',
      yAxisLabel: 'Count',
    },
    impressions: {
      label: 'Impressions',
      color: '#f59e0b',
      dataKey: 'impressions',
      yAxisLabel: 'Count',
    },
    clicks: {
      label: 'Clicks',
      color: '#8b5cf6',
      dataKey: 'clicks',
      yAxisLabel: 'Count',
    },
  }

  const config = metricConfig[selectedMetric as keyof typeof metricConfig]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold">Performance Over Time</h2>
        <div className="flex gap-2">
          <select
            value={selectedMetric}
            onChange={(e) =>
              setSelectedMetric(
                e.target.value as 'spend' | 'conversions' | 'impressions' | 'clicks'
              )
            }
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="spend">Spend</option>
            <option value="impressions">Impressions</option>
            <option value="clicks">Clicks</option>
            <option value="conversions">Conversions</option>
          </select>

          {onTimeframeChange && (
            <select
              value={timeframe}
              onChange={(e) => onTimeframeChange(e.target.value as '7d' | '30d' | '90d')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="dateLabel"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            label={{ value: config.yAxisLabel, angle: -90, position: 'insideLeft' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
            }}
            formatter={(value: number) => {
              if (selectedMetric === 'spend') {
                return `$${value.toFixed(2)}`
              }
              return value.toLocaleString()
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey={config.dataKey}
            stroke={config.color}
            name={config.label}
            dot={false}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Chart Summary */}
      <div className="mt-6 pt-6 border-t grid grid-cols-2 sm:grid-cols-4 gap-4">
        {chartData.length > 0 && (
          <>
            <div>
              <p className="text-xs text-gray-600 uppercase">Avg {config.label}</p>
              <p className="text-lg font-semibold mt-1">
                {selectedMetric === 'spend'
                  ? `$${(
                      chartData.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0) /
                      chartData.length
                    ).toFixed(2)}`
                  : Math.round(
                      chartData.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0) /
                        chartData.length
                    ).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Peak {config.label}</p>
              <p className="text-lg font-semibold mt-1">
                {selectedMetric === 'spend'
                  ? `$${Math.max(...chartData.map((d) => d[selectedMetric] || 0)).toFixed(2)}`
                  : Math.max(...chartData.map((d) => d[selectedMetric] || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Total {config.label}</p>
              <p className="text-lg font-semibold mt-1">
                {selectedMetric === 'spend'
                  ? `$${chartData.reduce((sum, d) => sum + (d[selectedMetric] || 0), 0).toFixed(2)}`
                  : chartData
                      .reduce((sum, d) => sum + (d[selectedMetric] || 0), 0)
                      .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 uppercase">Data Points</p>
              <p className="text-lg font-semibold mt-1">{chartData.length}</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
