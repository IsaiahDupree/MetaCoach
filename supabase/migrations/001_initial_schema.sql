-- Creator Coach Initial Schema
-- Privacy-first: No media storage, only metadata and metrics

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tenants: your brand + customer creators
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('owner', 'creator')),
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meta connections (encrypted tokens)
CREATE TABLE meta_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  fb_page_id TEXT,
  ig_user_id TEXT,
  access_token TEXT NOT NULL, -- Encrypt at rest
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, ig_user_id)
);

-- Policy flags per tenant
CREATE TABLE policy_flags (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  allow_autopost BOOLEAN DEFAULT FALSE,
  allow_ephemeral_media_download BOOLEAN DEFAULT TRUE,
  keep_metrics_history BOOLEAN DEFAULT TRUE,
  store_media_permanently BOOLEAN DEFAULT FALSE, -- MUST stay false
  checkback_profile TEXT DEFAULT 'meta_default',
  max_analysis_cost_per_month_usd NUMERIC DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals per tenant
CREATE TABLE goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  focus TEXT NOT NULL CHECK (focus IN ('link_clicks', 'engagement', 'followers', 'views', 'revenue')),
  target NUMERIC, -- e.g., +15 (% lift)
  timeframe TEXT, -- e.g., 'next_7_days'
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts (metadata only, NO media storage)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'facebook')),
  platform_post_id TEXT NOT NULL,
  caption TEXT,
  media_type TEXT, -- 'IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'
  permalink TEXT,
  posted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('posted', 'needs_iteration', 'draft', 'scheduled', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, platform, platform_post_id)
);

CREATE INDEX idx_posts_tenant ON posts(tenant_id);
CREATE INDEX idx_posts_status ON posts(status);

-- Post metrics snapshots
CREATE TABLE post_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  reach BIGINT,
  media_views BIGINT, -- replaces deprecated 'impressions'
  likes BIGINT,
  comments_count BIGINT,
  shares BIGINT,
  saves BIGINT,
  clicks BIGINT,
  ctr NUMERIC,
  watch_time_seconds NUMERIC,
  sentiment NUMERIC, -- aggregated from comments
  json_raw JSONB -- full response from Graph API
);

CREATE INDEX idx_metrics_post ON post_metrics(post_id, fetched_at DESC);

-- Comments (for sentiment analysis)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  platform_comment_id TEXT,
  author TEXT,
  text TEXT,
  sentiment NUMERIC, -- -1.0 to 1.0
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, platform_comment_id)
);

CREATE INDEX idx_comments_post ON comments(post_id);

-- Check-backs schedule
CREATE TABLE check_backs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'done', 'failed')),
  attempt INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checkbacks_due ON check_backs(status, run_at);

-- Ephemeral analysis jobs
CREATE TABLE analysis_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'done', 'failed', 'deleted')),
  media_temp_path TEXT, -- temp only; cleared after done
  transcript TEXT,
  hook_score NUMERIC, -- 0-100
  pacing_seconds NUMERIC,
  thumb_quality NUMERIC, -- 0-100
  findings JSONB,
  cost_usd NUMERIC DEFAULT 0,
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_analysis_tenant ON analysis_jobs(tenant_id);
CREATE INDEX idx_analysis_status ON analysis_jobs(status);

-- Coach suggestions
CREATE TABLE coach_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  goal_focus TEXT NOT NULL,
  one_line_diagnosis TEXT NOT NULL,
  new_hook_line TEXT,
  thumbnail_brief TEXT,
  caption_variants TEXT[],
  experiment JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_suggestions_post ON coach_suggestions(post_id);

-- Shortlinks (for attribution)
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  target_url TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_links_code ON links(code);

-- Click events
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID REFERENCES links(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  ip INET,
  ua TEXT,
  referer TEXT,
  ph_distinct_id TEXT,
  geo JSONB
);

CREATE INDEX idx_clicks_link ON clicks(link_id);
CREATE INDEX idx_clicks_ph ON clicks(ph_distinct_id);

-- Visitors (PostHog integration)
CREATE TABLE visitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ph_distinct_id TEXT UNIQUE,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  warmth NUMERIC DEFAULT 0
);

-- Memberships (Run Digitaler signups)
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  visitor_id UUID REFERENCES visitors(id),
  product TEXT NOT NULL DEFAULT 'run_digitaler',
  status TEXT NOT NULL CHECK (status IN ('trial', 'active', 'canceled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  source_click_id UUID REFERENCES clicks(id)
);

CREATE INDEX idx_memberships_visitor ON memberships(visitor_id);

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER meta_connections_updated_at BEFORE UPDATE ON meta_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER policy_flags_updated_at BEFORE UPDATE ON policy_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
