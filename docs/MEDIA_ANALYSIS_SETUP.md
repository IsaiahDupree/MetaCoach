# Media Analysis Setup Guide

## Overview

MetaCoach can now download and analyze Instagram media using AI! This guide walks you through setting up and testing the new features.

## ✅ What's Been Implemented

### 1. Media Download (`lib/instagram-media.ts`)
- Download videos and images from Instagram
- Batch download with concurrency control
- Automatic filtering and validation
- No special permissions needed (works with `instagram_basic`!)

### 2. AI Analysis Pipeline (`lib/ai-analysis.ts`)
- **Video Analysis**:
  - Transcript generation (Whisper)
  - Hook analysis (first 3-5 seconds)
  - Frame quality scoring
  - Content quality assessment
  
- **Image Analysis**:
  - Thumbnail quality scoring
  - Clarity, composition, attention metrics
  - Actionable recommendations

### 3. Video Processing (`lib/video-utils.ts`)
- Frame extraction from videos
- Thumbnail generation
- Video metadata extraction
- GIF preview generation

## 🔧 Prerequisites

### 1. ffmpeg (Required for video processing)

**Windows:**
```bash
choco install ffmpeg
# OR download from https://ffmpeg.org/download.html
```

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt-get install ffmpeg
```

Verify installation:
```bash
ffmpeg -version
```

### 2. Environment Variables

Add to your `.env.local`:

```bash
# Meta (Instagram) API
META_APP_ID=your_app_id
META_APP_SECRET=your_app_secret
META_REDIRECT_URL=http://localhost:3000/api/meta/oauth/callback
PUBLIC_BASE_URL=http://localhost:3000

# OpenAI API (for AI analysis)
OPENAI_API_KEY=your_openai_api_key

# For testing only (get this from OAuth flow)
META_ACCESS_TOKEN=your_test_token
```

### 3. Install Dependencies

```bash
npm install
# OR
npm install tsx --save-dev  # For running test scripts
```

## 🧪 Testing the Implementation

### Step 1: Get an Access Token

1. Start the dev server:
```bash
npm run dev
```

2. Navigate to `http://localhost:3000/connect`

3. Complete the OAuth flow (Business Login recommended)

4. After successful authentication, open DevTools → Application → Cookies

5. Copy the value of `meta_access_token`

6. Add it to `.env.local`:
```bash
META_ACCESS_TOKEN=paste_token_here
```

### Step 2: Run the Test Script

```bash
npm run test-media
```

This will:
1. ✅ Connect to Instagram API
2. ✅ Fetch your recent media
3. ✅ Download a video or image
4. ✅ Run AI analysis (if OpenAI API key present)
5. ✅ Save results to `test-output/` directory

### Expected Output

```
=== MetaCoach Media Access Test ===

📋 Checking configuration...
✅ Environment variables configured

📱 Fetching Instagram account...
✅ Found Page: Your Page Name (123456789)
✅ Instagram Business Account ID: 17841401234567890

🎬 Fetching recent media...
✅ Found 10 media items

📊 Media Summary:
  1. VIDEO ✅ Check out this awesome video...
  2. IMAGE ✅ Beautiful sunset photo...
  3. VIDEO ✅ Tutorial on how to...

🔍 Looking for a downloadable video...
✅ Found video: 17895695668004550
   Caption: Check out this awesome video...
   URL: https://video.cdninstagram.com/...

⬇️ Downloading video...
✅ Downloaded 12.34 MB

💾 Saved to: C:\...\test-output\test-video-17895695668004550.mp4

🤖 Running AI analysis...
This may take 1-2 minutes...

✅ AI Analysis Complete!

=== RESULTS ===

📝 Transcript (1234 chars):
   "Hey everyone, in this video I'm going to show you..."

🎣 Hook Analysis:
   Score: 85/100
   Strengths: Strong visual impact, Clear message
   Weaknesses: Could be more concise
   
⭐ Content Quality:
   Overall: 78/100
   Visual Appeal: 82/100
   Engagement: 75/100

💾 Full analysis saved to: test-output\analysis-17895695668004550.json

✅ Test completed successfully! 🎉
```

## 📁 Output Files

After running the test, check the `test-output/` directory:

```
test-output/
├── test-video-17895695668004550.mp4    # Downloaded video
├── analysis-17895695668004550.json     # Full AI analysis results
├── test-image-17895695123456789.jpg    # Downloaded image (if testing images)
└── analysis-17895695123456789.json     # Image analysis
```

## 🚀 Using in Your App

### Example: Download and Analyze a Video

```typescript
import { MetaClient } from '@/lib/meta'
import { downloadMediaWithMetadata } from '@/lib/instagram-media'
import { analyzeContent } from '@/lib/ai-analysis'

async function analyzeUserContent(accessToken: string, igUserId: string) {
  const client = new MetaClient(accessToken)
  
  // 1. Fetch recent videos
  const media = await client.getMedia(igUserId, 10)
  const videos = media.filter(m => m.media_type === 'VIDEO')
  
  // 2. Download first video
  const { buffer, metadata } = await downloadMediaWithMetadata(videos[0])
  
  // 3. Analyze with AI
  const analysis = await analyzeContent(buffer, metadata)
  
  // 4. Use results
  console.log(`Hook Score: ${analysis.hookAnalysis?.score}/100`)
  console.log(`Transcript: ${analysis.transcript?.text}`)
  console.log(`Recommendations:`, analysis.hookAnalysis?.recommendations)
  
  return analysis
}
```

### Example: Batch Process Multiple Videos

```typescript
import { downloadMediaBatch, shouldDownloadMedia } from '@/lib/instagram-media'
import { analyzeContent } from '@/lib/ai-analysis'

async function analyzeBatch(media: InstagramMedia[]) {
  // Filter to only videos from last 7 days
  const recentVideos = media.filter(m => 
    shouldDownloadMedia(m, {
      onlyVideos: true,
      minTimestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    })
  )
  
  // Download all videos (3 at a time)
  const downloads = await downloadMediaBatch(recentVideos, 3)
  
  // Analyze each
  const analyses = []
  for (const { media, buffer } of downloads) {
    if (buffer) {
      const analysis = await analyzeContent(buffer, media)
      analyses.push(analysis)
    }
  }
  
  return analyses
}
```

## 💰 Cost Considerations

### OpenAI API Costs (as of Nov 2025)

**Per Video Analysis:**
- Whisper (transcript): ~$0.006 per minute
- GPT-4o (hook analysis): ~$0.02-0.05
- GPT-4o (content analysis): ~$0.02-0.05
- **Total per video: ~$0.08-0.15**

**Per Image Analysis:**
- GPT-4o Vision: ~$0.01-0.03
- **Total per image: ~$0.01-0.03**

### Rate Limiting

OpenAI has rate limits:
- **RPM (Requests Per Minute)**: 500 for Tier 1
- **TPM (Tokens Per Minute)**: 30,000 for Tier 1

If processing many videos, implement delays between requests or batch processing.

## 🐛 Troubleshooting

### "ffmpeg is not installed"

**Solution**: Install ffmpeg (see Prerequisites above)

### "Invalid scope" error

**Issue**: Using deprecated permissions

**Solution**: Check `docs/PERMISSIONS_2025_UPDATE.md` for current valid permissions

### "Media URL not available (copyrighted content)"

**Issue**: Video contains copyrighted music/content

**Solution**: Only non-copyrighted media can be downloaded. Instagram's API omits the `media_url` field for copyrighted content.

### "429 Too Many Requests" (OpenAI)

**Issue**: Hit OpenAI rate limits

**Solution**: 
- Reduce concurrent requests
- Add delays between API calls
- Upgrade OpenAI tier if needed

### "No Facebook Pages found"

**Issue**: Instagram Business account not linked to Facebook Page

**Solution**: 
1. Go to Instagram settings
2. Link to a Facebook Page
3. Ensure it's a Business or Creator account

### TypeScript errors about Buffer

**Issue**: Node.js type conflicts

**Solution**: Ensure `@types/node` is installed:
```bash
npm install --save-dev @types/node
```

## 📚 API References

### Media Download
- `downloadMedia(url)` - Download single media
- `downloadMediaWithMetadata(media)` - Download with full metadata
- `downloadMediaBatch(media[], concurrency)` - Batch download
- `isMediaDownloadable(media)` - Check if downloadable
- `shouldDownloadMedia(media, options)` - Filter with criteria

### AI Analysis
- `analyzeContent(buffer, media)` - Main analysis function
- `generateTranscript(buffer)` - Whisper transcript
- `analyzeHook(frames, transcript)` - Hook quality scoring
- `analyzeThumbnail(buffer, caption)` - Image analysis

### Video Utils
- `extractVideoFrames(buffer, options)` - Extract multiple frames
- `extractSingleFrame(buffer, timestamp)` - Extract specific frame
- `getVideoMetadata(buffer)` - Get duration, resolution, etc.
- `extractHookFrames(buffer)` - Get first 5 frames
- `generatePreviewGif(buffer, options)` - Create GIF preview

## 🎯 Next Steps

1. ✅ Test media download with your account
2. ✅ Verify AI analysis works correctly
3. ⏭️ Build UI components to display analysis results
4. ⏭️ Implement background job processing for batch analysis
5. ⏭️ Add result caching to avoid re-analyzing same content
6. ⏭️ Create dashboard to view all analyzed content
7. ⏭️ Implement recommendation engine based on analysis

## 📖 Related Documentation

- [PERMISSIONS_2025_UPDATE.md](./PERMISSIONS_2025_UPDATE.md) - Current API permissions
- [OAUTH_ARCHITECTURE.md](./OAUTH_ARCHITECTURE.md) - OAuth implementation
- [OAUTH_QUICK_REFERENCE.md](./OAUTH_QUICK_REFERENCE.md) - Quick API reference

---

**Status**: ✅ Fully implemented and ready to use!  
**Last Updated**: November 8, 2025
