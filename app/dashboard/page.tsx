'use client'

import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, AlertCircle } from 'lucide-react'
import { formatNumber } from '@/lib/utils'
import { RecommendationModal } from '@/components/RecommendationModal'

interface Account {
  id: string
  name: string
  currency: string
  balance?: number
}

interface Campaign {
  id: string
  name: string
  status: string
  objective?: string
}

interface MetricSummary {
  spend: number | null
  impressions: number | null
  clicks: number | null
  ctr: number | null
  roas: number | null
}

interface Recommendation {
  id: string
  title: string
  description: string
  priority?: 'high' | 'medium' | 'low'
  confidence_score: number
  estimated_impact: number
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [metrics, setMetrics] = useState<MetricSummary | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d')
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null)
  const [showModal, setShowModal] = useState(false)

  // Fetch ad accounts
  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/meta/accounts?cached=1')
        if (!res.ok) throw new Error('Failed to fetch accounts')
        const data = await res.json()
        if (data.data && data.data.length > 0) {
          setAccounts(data.data)
          setSelectedAccount(data.data[0])
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load accounts')
      }
    }
    fetchAccounts()
  }, [])

  // Fetch campaigns and metrics when account is selected
  useEffect(() => {
    if (!selectedAccount) return
    const controller = new AbortController()

    async function fetchData() {
      if (!selectedAccount) return

      setLoading(true)
      setError(null)
      setMetrics(null)
      setCampaigns([])
      setRecommendations([])
      setTruncated(false)
      try {
        const accountId = selectedAccount.id
        const params = new URLSearchParams({ account_id: accountId, period })
        const [dashboardRes, recsRes] = await Promise.all([
          fetch(`/api/meta/dashboard?${params}`, { signal: controller.signal }),
          fetch(`/api/recommendations/list?${new URLSearchParams({ account_id: accountId })}`, { signal: controller.signal }),
        ])
        if (!dashboardRes.ok || !recsRes.ok) throw new Error('Could not load saved dashboard data')
        const [dashboardData, recsData] = await Promise.all([dashboardRes.json(), recsRes.json()])
        if (controller.signal.aborted) return
        setCampaigns(dashboardData.campaigns)
        setMetrics(dashboardData.summary)
        setTruncated(dashboardData.truncated)
        setRecommendations(recsData.recommendations)

      } catch (err: unknown) {
        if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Could not load saved data')
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    fetchData()
    return () => controller.abort()
  }, [selectedAccount, period])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meta Ads Coach</h1>
              <p className="text-gray-600 mt-1">Performance insights & recommendations</p>
            </div>
            <div className="text-right">
              {selectedAccount && (
                <div className="text-sm">
                  <p className="font-semibold">{selectedAccount.name}</p>
                  <p className="text-gray-600">{selectedAccount.currency}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Selector & Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ad Account
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedAccount?.id || ''}
              onChange={(e) => {
                const account = accounts.find((a) => a.id === e.target.value)
                setMetrics(null)
                setCampaigns([])
                setRecommendations([])
                setSelectedAccount(account || null)
              }}
            >
              <option value="">Select account...</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Period
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={period}
              onChange={(e) => {
                setMetrics(null)
                setPeriod(e.target.value as '7d' | '30d' | '90d')
              }}
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>

          <div className="flex items-end">
            {selectedAccount && (
              <button
                onClick={() => window.location.href = '/connect'}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Account
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading performance data...</p>
          </div>
        ) : selectedAccount ? (
          <>
            {/* Performance Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {metrics && (
                <>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Spend</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.spend === null ? '—' : `${selectedAccount.currency || ''} ${formatNumber(metrics.spend)}`}
                        </p>
                      </div>
                      <BarChart3 className="text-blue-500" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">Impressions</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.impressions === null ? '—' : formatNumber(metrics.impressions)}
                        </p>
                      </div>
                      <BarChart3 className="text-green-500" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">ROAS</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.roas === null ? '—' : `${metrics.roas.toFixed(2)}x`}
                        </p>
                      </div>
                      <TrendingUp className="text-purple-500" size={32} />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">CTR</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {metrics.ctr === null ? '—' : `${(metrics.ctr * 100).toFixed(2)}%`}
                        </p>
                      </div>
                      <BarChart3 className="text-orange-500" size={32} />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="mb-8 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
              Showing saved data; it may be out of date. Previously saved metrics may need reconciliation before they are relied on.
              {truncated && ' Some saved results were omitted; performance totals are hidden if incomplete.'}
              {!metrics && !truncated && ' No saved performance data is available for this period.'}
            </div>

            {/* Campaigns Table */}
            <div className="bg-white rounded-lg shadow mb-8">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Campaigns</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">
                        Objective
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.length > 0 ? (
                      campaigns.slice(0, 10).map((campaign) => (
                        <tr key={campaign.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {campaign.name}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                campaign.status === 'ACTIVE'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {campaign.objective || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                          No saved campaigns found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b">
                  <h2 className="text-lg font-semibold">Recommendations</h2>
                </div>
                <div className="divide-y">
                  {recommendations.slice(0, 5).map((rec) => (
                    <div
                      key={rec.id}
                      className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                      onClick={() => {
                        setSelectedRecommendation(rec)
                        setShowModal(true)
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <AlertCircle
                          className={
                            rec.priority === 'high'
                              ? 'text-red-500'
                              : rec.priority === 'medium'
                                ? 'text-yellow-500'
                                : 'text-blue-500'
                          }
                          size={20}
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{rec.title}</p>
                          <p className="text-sm text-gray-600 mt-1">
                            {rec.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                              Confidence: {(rec.confidence_score * 100).toFixed(0)}%
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              Impact: {rec.estimated_impact.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendation Modal */}
            <RecommendationModal
              recommendation={selectedRecommendation}
              isOpen={showModal}
              onClose={() => setShowModal(false)}
            />
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Select an account to view performance data</p>
          </div>
        )}
      </div>
    </div>
  )
}
