// Media Engagement Card for Everreach
// Displays engagement metrics alongside video/image analysis

'use client';

import { useState } from 'react';

interface MediaEngagementData {
  media_id: string;
  media_type: 'VIDEO' | 'IMAGE' | 'CAROUSEL_ALBUM';
  caption?: string;
  posted_at: string;
  thumbnail_url?: string;
  permalink?: string;
  
  // Engagement metrics
  engagement: {
    reach?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    saved?: number;
    video_views?: number;
    impressions?: number;
  };
  
  // AI Analysis
  hookAnalysis?: {
    score: number;
    strengths: string[];
    weaknesses: string[];
  };
  
  contentQuality?: {
    overallScore: number;
    visualAppeal: number;
    engagement: number;
  };
  
  thumbnailAnalysis?: {
    score: number;
    clarity: number;
    composition: number;
    attention: number;
  };
}

interface Props {
  data: MediaEngagementData;
  onViewDetails?: (mediaId: string) => void;
}

export function MediaEngagementCard({ data, onViewDetails }: Props) {
  const [expanded, setExpanded] = useState(false);
  
  const formatNumber = (num?: number): string => {
    if (!num) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getEngagementRate = (): string => {
    const { reach, likes, comments, shares, saved } = data.engagement;
    if (!reach || reach === 0) return '0%';
    const totalEngagement = (likes || 0) + (comments || 0) + (shares || 0) + (saved || 0);
    return `${((totalEngagement / reach) * 100).toFixed(1)}%`;
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Header with Thumbnail */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex gap-4">
          {/* Thumbnail */}
          {data.thumbnail_url && (
            <div className="flex-shrink-0">
              <img
                src={data.thumbnail_url}
                alt="Media thumbnail"
                className="w-24 h-24 object-cover rounded-lg"
              />
            </div>
          )}
          
          {/* Caption & Metadata */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700">
                {data.media_type}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(data.posted_at).toLocaleDateString()}
              </span>
            </div>
            
            <p className="text-sm text-gray-700 line-clamp-2 mb-2">
              {data.caption || 'No caption'}
            </p>
            
            {data.permalink && (
              <a
                href={data.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                View on Instagram →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics Grid */}
      <div className="p-4 bg-gray-50">
        <h4 className="text-xs font-semibold text-gray-600 uppercase mb-3">
          Engagement Metrics
        </h4>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          <MetricBox 
            label="Reach" 
            value={formatNumber(data.engagement.reach)} 
            icon="👥" 
          />
          <MetricBox 
            label="Likes" 
            value={formatNumber(data.engagement.likes)} 
            icon="❤️" 
          />
          <MetricBox 
            label="Comments" 
            value={formatNumber(data.engagement.comments)} 
            icon="💬" 
          />
          <MetricBox 
            label="Shares" 
            value={formatNumber(data.engagement.shares)} 
            icon="🔄" 
          />
          <MetricBox 
            label="Saved" 
            value={formatNumber(data.engagement.saved)} 
            icon="🔖" 
          />
          <MetricBox 
            label="Eng. Rate" 
            value={getEngagementRate()} 
            icon="📊" 
            highlight 
          />
        </div>
        
        {data.media_type === 'VIDEO' && data.engagement.video_views && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <MetricBox 
              label="Video Views" 
              value={formatNumber(data.engagement.video_views)} 
              icon="📹" 
            />
          </div>
        )}
      </div>

      {/* AI Analysis Scores */}
      {(data.hookAnalysis || data.contentQuality || data.thumbnailAnalysis) && (
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-semibold text-gray-600 uppercase">
              AI Analysis
            </h4>
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {expanded ? 'Hide Details' : 'Show Details'}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {data.hookAnalysis && (
              <ScoreCard 
                label="Hook" 
                score={data.hookAnalysis.score} 
                icon="🎣" 
              />
            )}
            
            {data.contentQuality && (
              <ScoreCard 
                label="Quality" 
                score={data.contentQuality.overallScore} 
                icon="⭐" 
              />
            )}
            
            {data.thumbnailAnalysis && (
              <ScoreCard 
                label="Thumbnail" 
                score={data.thumbnailAnalysis.score} 
                icon="🖼️" 
              />
            )}
          </div>

          {/* Expanded Details */}
          {expanded && (
            <div className="mt-4 space-y-3 pt-3 border-t border-gray-200">
              {data.hookAnalysis && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Hook Analysis:
                  </p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {data.hookAnalysis.strengths.map((strength, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-green-500">✓</span>
                        {strength}
                      </li>
                    ))}
                    {data.hookAnalysis.weaknesses.map((weakness, i) => (
                      <li key={i} className="flex items-start gap-1">
                        <span className="text-red-500">✗</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {data.contentQuality && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Content Quality Breakdown:
                  </p>
                  <div className="space-y-2">
                    <ProgressBar 
                      label="Visual Appeal" 
                      value={data.contentQuality.visualAppeal} 
                    />
                    <ProgressBar 
                      label="Engagement" 
                      value={data.contentQuality.engagement} 
                    />
                  </div>
                </div>
              )}

              {data.thumbnailAnalysis && (
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-2">
                    Thumbnail Analysis:
                  </p>
                  <div className="space-y-2">
                    <ProgressBar 
                      label="Clarity" 
                      value={data.thumbnailAnalysis.clarity} 
                    />
                    <ProgressBar 
                      label="Composition" 
                      value={data.thumbnailAnalysis.composition} 
                    />
                    <ProgressBar 
                      label="Attention" 
                      value={data.thumbnailAnalysis.attention} 
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button
          onClick={() => onViewDetails?.(data.media_id)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          View Full Analysis
        </button>
      </div>
    </div>
  );
}

// Helper Components
function MetricBox({ 
  label, 
  value, 
  icon, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  icon: string; 
  highlight?: boolean; 
}) {
  return (
    <div className={`text-center p-2 rounded-lg ${
      highlight ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'
    }`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className={`text-lg font-bold ${highlight ? 'text-blue-900' : 'text-gray-900'}`}>
        {value}
      </div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function ScoreCard({ 
  label, 
  score, 
  icon 
}: { 
  label: string; 
  score: number; 
  icon: string; 
}) {
  const getColor = (score: number): string => {
    if (score >= 80) return 'border-green-300 bg-green-50';
    if (score >= 60) return 'border-yellow-300 bg-yellow-50';
    return 'border-red-300 bg-red-50';
  };

  const getTextColor = (score: number): string => {
    if (score >= 80) return 'text-green-900';
    if (score >= 60) return 'text-yellow-900';
    return 'text-red-900';
  };

  return (
    <div className={`p-3 rounded-lg border ${getColor(score)}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-lg">{icon}</span>
      </div>
      <div className={`text-2xl font-bold ${getTextColor(score)}`}>
        {score}/100
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  const getColor = (value: number): string => {
    if (value >= 80) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-medium text-gray-900">{value}/100</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${getColor(value)}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
