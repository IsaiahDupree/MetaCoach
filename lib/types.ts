// Database types
export interface Tenant {
  id: string
  name: string
  kind: 'owner' | 'creator'
  email?: string
  created_at: string
  updated_at: string
}

export interface MetaConnection {
  id: string
  tenant_id: string
  fb_page_id?: string
  ig_user_id?: string
  access_token: string
  token_expires_at?: string
  scopes: string[]
  created_at: string
  updated_at: string
}

export interface PolicyFlags {
  tenant_id: string
  allow_autopost: boolean
  allow_ephemeral_media_download: boolean
  keep_metrics_history: boolean
  store_media_permanently: boolean
  checkback_profile: 'meta_default' | 'conversation_heavy' | 'long_tail'
  max_analysis_cost_per_month_usd: number
  created_at: string
  updated_at: string
}

export interface Goal {
  id: string
  tenant_id: string
  focus: 'link_clicks' | 'engagement' | 'followers' | 'views' | 'revenue'
  target?: number
  timeframe?: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  tenant_id: string
  platform: 'instagram' | 'facebook'
  platform_post_id: string
  caption?: string
  media_type?: string
  permalink?: string
  posted_at?: string
  status: 'posted' | 'needs_iteration' | 'draft' | 'scheduled' | 'archived'
  created_at: string
  updated_at: string
}

export interface PostMetrics {
  id: string
  post_id: string
  fetched_at: string
  reach?: number
  media_views?: number
  likes?: number
  comments_count?: number
  shares?: number
  saves?: number
  clicks?: number
  ctr?: number
  watch_time_seconds?: number
  sentiment?: number
  json_raw?: Record<string, any>
}

export interface Comment {
  id: string
  post_id: string
  platform_comment_id?: string
  author?: string
  text?: string
  sentiment?: number
  created_at: string
}

export interface AnalysisJob {
  id: string
  tenant_id: string
  post_id: string
  status: 'queued' | 'running' | 'done' | 'failed' | 'deleted'
  media_temp_path?: string
  transcript?: string
  hook_score?: number
  pacing_seconds?: number
  thumb_quality?: number
  findings?: Record<string, any>
  cost_usd: number
  expires_at: string
  created_at: string
  completed_at?: string
}

export interface CoachSuggestion {
  id: string
  post_id: string
  goal_focus: string
  one_line_diagnosis: string
  new_hook_line?: string
  thumbnail_brief?: string
  caption_variants?: string[]
  experiment?: {
    what: string
    why: string
    success_metric: string
    target_lift_pct: number
  }
  created_at: string
  resolved_at?: string
}

// Meta API types
export interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  permalink?: string
  thumbnail_url?: string
  timestamp: string
}

export interface InstagramInsights {
  impressions?: number
  reach?: number
  engagement?: number
  saved?: number
  video_views?: number
  likes?: number
  comments?: number
  shares?: number
}

export interface MetaOAuthTokenResponse {
  access_token: string
  token_type: string
  expires_in?: number
}
