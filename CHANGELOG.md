# Changelog


## 2026-05-12 — 2485c5c

feat(sentiment): analysis pipeline (api, cron, settings, badge) + docs

Files changed:
   app/api/cron/sentiment-update/route.ts | 185 ++++++++++++
   app/api/external/sentiment/route.ts    | 231 +++++++++++++++
   app/api/sentiment/analyze/route.ts     | 208 ++++++++++++++
   app/api/settings/token/route.ts        |  28 ++
   app/dashboard/page.tsx                 | 115 +++++++-
   app/settings/page.tsx                  | 181 ++++++++++++
   components/SentimentBadge.tsx          |  97 +++++++
   docs/SENTIMENT_ANALYSIS_SETUP.md       | 502 +++++++++++++++++++++++++++++++++
   docs/SENTIMENT_QUICK_START.md          | 140 +++++++++
   lib/sentiment.ts                       | 169 +++++++++++
   vercel.json                            |   8 +-
   11 files changed, 1862 insertions(+), 2 deletions(-)
