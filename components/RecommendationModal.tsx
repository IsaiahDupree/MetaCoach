'use client'

import { X } from 'lucide-react'

export interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  confidence_score: number
  estimated_impact: number
  estimated_effort?: 'low' | 'medium' | 'high'
  implementation_instructions?: string
  recommendation_type?: string
}

interface RecommendationModalProps {
  recommendation: Recommendation | null
  isOpen: boolean
  onClose: () => void
  onImplement?: (id: string) => void
}

export function RecommendationModal({
  recommendation,
  isOpen,
  onClose,
  onImplement,
}: RecommendationModalProps) {
  if (!isOpen || !recommendation) return null

  const priorityColors = {
    high: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      badge: 'bg-red-100 text-red-800',
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      badge: 'bg-yellow-100 text-yellow-800',
    },
    low: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      badge: 'bg-blue-100 text-blue-800',
    },
  }

  const colors = priorityColors[recommendation.priority]

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-0">
        <div className="relative w-full max-w-2xl transform transition-all">
          <div className={`rounded-lg shadow-xl ${colors.bg} border ${colors.border}`}>
            {/* Header */}
            <div className="flex items-start justify-between border-b p-6">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {recommendation.title}
                  </h2>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}
                  >
                    {recommendation.priority.charAt(0).toUpperCase() +
                      recommendation.priority.slice(1)}{' '}
                    Priority
                  </span>
                </div>
                {recommendation.recommendation_type && (
                  <p className="text-sm text-gray-600 mt-2">
                    Type: {recommendation.recommendation_type}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Overview</h3>
                <p className="text-gray-700">{recommendation.description}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Confidence Score</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(recommendation.confidence_score * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Estimated Impact</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {(recommendation.estimated_impact * 100).toFixed(0)}%
                  </p>
                </div>

                {recommendation.estimated_effort && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-600">Implementation Effort</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">
                      {recommendation.estimated_effort.charAt(0).toUpperCase() +
                        recommendation.estimated_effort.slice(1)}
                    </p>
                  </div>
                )}
              </div>

              {/* Implementation Instructions */}
              {recommendation.implementation_instructions && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    How to Implement
                  </h3>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-700 whitespace-pre-line">
                      {recommendation.implementation_instructions}
                    </p>
                  </div>
                </div>
              )}

              {/* Why This Matters */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Why This Matters</h3>
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <p className="text-gray-700">
                    Based on your current performance metrics, implementing this
                    recommendation could improve your results by approximately{' '}
                    <span className="font-semibold">
                      {(recommendation.estimated_impact * 100).toFixed(0)}%
                    </span>
                    .
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 border-t bg-gray-50 px-6 py-4 sm:flex-row">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Dismiss
              </button>
              {onImplement && (
                <button
                  onClick={() => {
                    onImplement(recommendation.id)
                    onClose()
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Mark as Implemented
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
