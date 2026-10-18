import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SentimentBadgeProps {
  sentiment: number | null
  breakdown?: {
    positive: number
    neutral: number
    negative: number
    positive_percentage?: number
    neutral_percentage?: number
    negative_percentage?: number
  }
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function SentimentBadge({
  sentiment,
  breakdown,
  size = 'md',
  showDetails = false,
}: SentimentBadgeProps) {
  if (sentiment === null || sentiment === undefined) {
    return (
      <div className="text-gray-400 text-sm">
        No sentiment data
      </div>
    )
  }

  // Categorize sentiment
  const category =
    sentiment > 0.2 ? 'positive' : sentiment < -0.2 ? 'negative' : 'neutral'

  const colors = {
    positive: 'bg-green-100 text-green-800 border-green-200',
    neutral: 'bg-gray-100 text-gray-800 border-gray-200',
    negative: 'bg-red-100 text-red-800 border-red-200',
  }

  const icons = {
    positive: TrendingUp,
    neutral: Minus,
    negative: TrendingDown,
  }

  const Icon = icons[category]
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  }

  return (
    <div className="space-y-2">
      <div
        className={`inline-flex items-center gap-1.5 rounded-full border ${colors[category]} ${sizeClasses[size]} font-medium`}
      >
        <Icon size={size === 'sm' ? 14 : 16} />
        <span className="capitalize">{category}</span>
        <span className="text-xs opacity-75">
          ({sentiment > 0 ? '+' : ''}
          {sentiment.toFixed(2)})
        </span>
      </div>

      {showDetails && breakdown && (
        <div className="flex gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>
              {breakdown.positive_percentage?.toFixed(0) ||
                Math.round((breakdown.positive / (breakdown.positive + breakdown.neutral + breakdown.negative)) * 100)}
              % Positive
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-500"></div>
            <span>
              {breakdown.neutral_percentage?.toFixed(0) ||
                Math.round((breakdown.neutral / (breakdown.positive + breakdown.neutral + breakdown.negative)) * 100)}
              % Neutral
            </span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            <span>
              {breakdown.negative_percentage?.toFixed(0) ||
                Math.round((breakdown.negative / (breakdown.positive + breakdown.neutral + breakdown.negative)) * 100)}
              % Negative
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
