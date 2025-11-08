# Creator Coach — Build Plan

## Vision
Multi-tenant platform (personal + customer creators) that analyzes Instagram/Facebook content, coaches toward goals (CTR, engagement, followers, views, revenue), and respects privacy by downloading media ephemerally for analysis then deleting it.

## Core Constraints
- **Privacy-first**: Never persist user media; download → analyze → delete
- **Multi-tenant**: Personal account (full features) + customer accounts (configurable via policy flags)
- **Compliance**: Meta Data Deletion Callback, published privacy policy, transparent data retention
- **Cost-aware**: LLM/vision/ASR batching, concurrency limits, per-tenant cost caps

---

## Tech Stack
- **Frontend/Backend**: Next.js 14+ (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Database**: Supabase (Postgres + Auth + Storage)
- **AI**: OpenAI GPT-4 (coaching), Vision (frames/thumbnails), Whisper (transcripts)
- **Automations**: n8n (optional; ingest/check-backs/publish)
- **Analytics**: PostHog (attribution, sessions)
- **Meta**: Instagram Graph API, Facebook Graph API

---

## Build Phases

### Phase 1: Foundation (Week 1)
**Goal**: Connect to Meta, store tokens, pull basic data

#### 1.1 Project Setup
- [x] Initialize from Vercel Admin Dashboard template
- [ ] Configure Supabase project (dev/prod)
- [ ] Add environment variables (.env.local, Vercel)
- [ ] Install dependencies: `@supabase/supabase-js`, `openai`, `axios`

#### 1.2 Supabase Schema
Tables to create:
```sql
-- tenants: your brand + customer creators
-- meta_connections: encrypted tokens, scopes, expiry
-- policy_flags: per-tenant feature toggles
-- posts: metadata only (no media)
-- post_metrics: snapshots from insights API
-- comments: text + sentiment scores
-- analysis_jobs: ephemeral download queue with TTL
-- coach_suggestions: goal-based advice
-- links: shortlinks for attribution
-- clicks: click events
-- visitors: PostHog distinct IDs
-- memberships: Run Digitaler signups
```

#### 1.3 Meta App Configuration
- [ ] Create Facebook App at developers.facebook.com
- [ ] Add Instagram Graph API product
- [ ] Configure OAuth redirect URIs
- [ ] Request permissions: `instagram_basic`, `instagram_manage_insights`, `pages_read_engagement`
- [ ] Add Data Deletion Callback URL
- [ ] Submit for App Review (after testing in Dev mode)

#### 1.4 OAuth Flow
- [ ] `/api/meta/oauth/start` — redirect to Meta Login
- [ ] `/api/meta/oauth/callback` — exchange code for tokens
- [ ] Exchange short-lived for long-lived tokens (60 days)
- [ ] Encrypt and store in `meta_connections`
- [ ] Token refresh logic

#### 1.5 Data Deletion Callback (Meta requirement)
- [ ] `/api/facebook/data-deletion` — verify signed request
- [ ] Mark tenant for deletion, erase tokens/metrics/suggestions
- [ ] Return confirmation URL

**Deliverable**: You can connect your IG account and see tokens stored securely.

---

### Phase 2: Ingest & Metrics (Week 2)
**Goal**: Fetch posts, insights, comments; display in dashboard

#### 2.1 Media & Insights Sync
- [ ] `/api/meta/sync` — fetch user's media list
- [ ] For each media: pull insights (reach, media_views, likes, comments, shares, saves)
- [ ] Upsert `posts` + `post_metrics`
- [ ] Handle pagination, rate limits

#### 2.2 Comments & Sentiment
- [ ] Fetch comments per post
- [ ] Batch sentiment scoring via OpenAI (cost cap per tenant)
- [ ] Store in `comments` table
- [ ] Aggregate sentiment per post

#### 2.3 Check-Back Scheduler
- [ ] Define cadence profiles (meta_default, conversation_heavy, long_tail)
- [ ] On first sync, create check_backs (1h, 6h, 24h, 72h, 7d)
- [ ] Cron job: `/api/cron/checkbacks` (every 15 min)
- [ ] Vercel Cron or Supabase Edge Functions

**Deliverable**: Post Explorer showing live metrics and sentiment trends.

---

### Phase 3: Ephemeral Analysis (Week 3)
**Goal**: Download media temporarily, analyze, generate coach suggestions, delete

#### 3.1 Analysis Worker
- [ ] Queue `analysis_jobs` on sync or manual trigger
- [ ] Fetch short-lived media URL from Graph API
- [ ] Download to `/tmp` or object storage with TTL
- [ ] Run analysis pipeline:
  - **Vision**: keyframes, hook quality (first 3–5s), thumbnail scoring, object/brand detection
  - **Audio**: ASR transcript via Whisper, tone analysis
  - **Text**: caption sentiment, CTA detection, topic extraction
- [ ] Store findings in `analysis_jobs.findings` (JSON)
- [ ] Securely delete media immediately after

#### 3.2 Coach Suggestion Engine
- [ ] Define goal-based prompts (link_clicks, engagement, followers, views, revenue)
- [ ] Input: metrics delta, media analysis, audience notes
- [ ] Output JSON: diagnosis, new_hook_line, thumbnail_brief, caption_variants, experiment
- [ ] Create `coach_suggestions` row per post that needs iteration

#### 3.3 "Needs Iteration" Rules
Auto-flag posts when:
- CTR below median at 24h
- Negative sentiment (score < -0.2)
- Hook retention (first 3s) below threshold
- Thumbnail quality score below target

**Deliverable**: Feedback Queue with actionable suggestions linked to metrics.

---

### Phase 4: Dashboard UI (Week 4)
**Goal**: Clean, fast interface for personal use and customer preview

#### 4.1 Pages
- [ ] **Coach Home**: Top 3 actions, goal progress, hot/cold posts
- [ ] **Post Explorer**: Filters (Posted, Needs iteration, Drafts), metrics cards
- [ ] **Feedback Queue**: One insight per row; "Generate variants" button
- [ ] **Settings**: Connect/disconnect Meta, set goal, policy toggles

#### 4.2 Components
- [ ] PostCard: thumbnail, caption preview, metrics, sentiment chip, coach badge
- [ ] MetricsDelta: show change vs baseline with trend icon
- [ ] CoachSuggestionCard: diagnosis + suggested actions + experiment brief
- [ ] GoalProgress: gauge or bar for current goal

#### 4.3 Design System
- Use shadcn/ui components (already in template)
- TailwindCSS utilities
- Lucide icons
- Responsive (mobile-first for creator use)

**Deliverable**: MVP dashboard you can show and use daily.

---

### Phase 5: Attribution (Optional, Week 5)
**Goal**: Track link clicks → sessions → signups

#### 5.1 Shortlinks
- [ ] `/l/[code]` — Vercel Edge redirect
- [ ] Log click to `clicks` table (IP, UA, referer, ph_distinct_id)
- [ ] Append UTMs if missing
- [ ] Return 302 redirect

#### 5.2 PostHog Integration
- [ ] Add PostHog snippet to site
- [ ] Attach `ph_distinct_id` to shortlinks on click
- [ ] Track events: `link_clicked`, `post_viewed`, `signup_completed`
- [ ] Stitch sessions to visitor profiles

#### 5.3 Run Digitaler Signups
- [ ] Webhook from auth/checkout
- [ ] Create `memberships` row
- [ ] Attribute to `clicks.id` via `ph_distinct_id`
- [ ] Update `visitors.warmth`

**Deliverable**: Attribution report showing post → clicks → sessions → signups.

---

### Phase 6: Automations with n8n (Optional, Week 6)
**Goal**: Auto-iterate and publish content

#### 6.1 n8n Flows
- [ ] **Ingest & Catalog**: Timer → Platform API → Drive → Supabase
- [ ] **Check-Back Processor**: Cron → Fetch due → Pull metrics → Analyze → Insights
- [ ] **Iterate & Re-Publish**: Insight trigger → LLM variants → Drafts → Schedule publish

#### 6.2 Publishing (if enabled)
- [ ] Request `pages_manage_posts`, `instagram_content_publish` scopes
- [ ] Respect Meta limits (30 Reels/day per page)
- [ ] Queue in `posts` with `status: 'scheduled'`

**Deliverable**: One-click iteration and auto-posting.

---

## Meta Graph API — Data Access Checklist

### Permissions Needed (MVP)
- ✅ `instagram_basic` — user profile, media list
- ✅ `instagram_manage_insights` — metrics (reach, impressions, engagement)
- ✅ `pages_read_engagement` — comments, mentions
- ⚠️ `pages_manage_posts` (optional) — publishing
- ⚠️ `instagram_content_publish` (optional) — Reels/posts

### Endpoints We'll Use
1. **User Profile**: `GET /{ig-user-id}?fields=username,profile_picture_url`
2. **Media List**: `GET /{ig-user-id}/media?fields=id,caption,media_type,media_url,thumbnail_url,timestamp,permalink`
3. **Media Insights**: `GET /{ig-media-id}/insights?metric=impressions,reach,engagement,saved,video_views`
   - ⚠️ Note: `impressions` deprecated 2025; use `media_views`
4. **Comments**: `GET /{ig-media-id}/comments?fields=text,username,timestamp`
5. **Short-lived Media URL**: `GET /{ig-media-id}?fields=media_url` (for ephemeral download)

### Insights Metrics (2025 updated)
- `reach` — unique accounts
- `media_views` — total views (replaces impressions)
- `likes`, `comments`, `shares`, `saves`
- `video_views` (for Reels/videos)
- `ig_reels_avg_watch_time`, `ig_reels_video_view_total_time`

### Webhooks (Optional)
Subscribe to:
- `comments` — new comment posted
- `mentions` — tagged in story/post
- `media` — new media published

---

## Policy Flags (Per-Tenant Toggles)

```typescript
interface PolicyFlags {
  allow_autopost: boolean              // default: false (customers), true (you)
  allow_ephemeral_media_download: boolean  // default: true
  keep_metrics_history: boolean        // default: true
  store_media_permanently: boolean     // MUST be false for Meta compliance
  checkback_profile: 'meta_default' | 'conversation_heavy' | 'long_tail'
  max_analysis_cost_per_month_usd: number // LLM/vision budget cap
}
```

---

## Check-Back Cadences

### `meta_default` (IG Reels / FB Reels)
- 1h, 6h, 24h, 72h, 7d

### `conversation_heavy` (stories, live)
- 1h, 3h, 12h, 24h, 3d

### `long_tail` (evergreen posts)
- 6h, 24h, 72h, 7d, 28d

---

## Cost Controls

### Per-Tenant Caps
- Max OpenAI API cost/month: $50 (configurable)
- Max analysis jobs/day: 100
- Pause analysis if budget exceeded

### Batching
- Sentiment: batch 50 comments per LLM call
- Vision: sample 5 keyframes max per video
- Transcript: cap at 10 min of audio per video

---

## Security & Compliance

### Token Storage
- Encrypt `access_token` at rest (Supabase encryption or KMS)
- Store `token_expires_at` and auto-refresh

### Data Deletion
- Implement `/api/facebook/data-deletion`
- Publish instructions URL in privacy policy
- Mark tenant for deletion → async job erases all data

### Privacy Policy (must include)
- What data we collect (metadata, metrics, comments text)
- What we don't store (media files)
- How we use it (coaching suggestions)
- How users can delete their data
- Link to Data Deletion Callback

---

## GTM (Go-to-Market)

### Tiers
1. **Starter** (Free): Insights + Coach (no auto-posting)
2. **Pro** ($29/mo): Adds experiments + scheduled iterations
3. **Studio** ($99/mo): Adds 1:1 human coaching seats + shared dashboards

### Marketing Hooks
- "Your content coach that never sleeps"
- "Stop guessing — let data guide your next post"
- "Coach receipts: every suggestion links to the metric that justified it"

---

## Next Immediate Steps

1. **Initialize app** from Vercel template ✅ (in progress)
2. **Create Supabase project** (dev + prod)
3. **Create Meta App** at developers.facebook.com
4. **Implement OAuth** (`/api/meta/oauth/*`)
5. **Create schema** (run migration)
6. **Test connection** (connect your IG, see tokens)
7. **Build `/api/meta/sync`** (fetch media + insights)

---

## Open Questions

- **Start with IG only, or IG + FB?** → IG first (simpler)
- **n8n now or later?** → Later (manual triggers first)
- **PostHog attribution in MVP?** → Defer to Phase 5
- **Hosting**: Vercel + Supabase (recommended)

---

## Success Criteria (MVP)

- [ ] Connect IG account via OAuth
- [ ] Fetch and display 10 recent posts with metrics
- [ ] Pull comments and show sentiment
- [ ] Queue 1 ephemeral analysis job, see findings
- [ ] Generate 1 coach suggestion
- [ ] Display in dashboard with "Needs iteration" badge

---

_Updated: Nov 7, 2025_
