/**
 * Test script to verify media access with Instagram Graph API
 * 
 * Usage:
 *   npm run test-media
 * 
 * This will:
 * 1. Fetch your Instagram media
 * 2. Download a sample video/image
 * 3. Test AI analysis pipeline
 */

// Load environment variables from .env.local
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs/promises'
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { MetaClient } from '../lib/meta'
import { downloadMediaWithMetadata, isMediaDownloadable } from '../lib/instagram-media'
import { analyzeContent } from '../lib/ai-analysis'

async function testMediaAccess() {
  console.log('=== MetaCoach Media Access Test ===\n')

  // 1. Check environment variables
  console.log('📋 Checking configuration...')
  if (!process.env.META_APP_ID || !process.env.META_APP_SECRET) {
    console.error('❌ Missing META_APP_ID or META_APP_SECRET in environment')
    process.exit(1)
  }
  console.log('✅ Environment variables configured\n')

  // 2. Get access token
  // NOTE: In a real scenario, you'd get this from the OAuth flow
  // For testing, you need to manually get a token from your app
  const accessToken = process.env.META_ACCESS_TOKEN
  if (!accessToken) {
    console.error('❌ META_ACCESS_TOKEN not found in environment')
    console.error('Please add your access token to .env.local:')
    console.error('META_ACCESS_TOKEN=your_token_here\n')
    console.error('Get a token by:')
    console.error('1. Running the app: npm run dev')
    console.error('2. Going to http://localhost:3000/connect')
    console.error('3. Completing OAuth flow')
    console.error('4. Copying the token from cookies (meta_access_token)')
    process.exit(1)
  }

  const client = new MetaClient(accessToken)

  // 3. Get Instagram User ID
  console.log('📱 Fetching Instagram account...')
  try {
    // First, get Facebook pages
    const pages = await client.getPages()
    if (!pages || pages.length === 0) {
      console.error('❌ No Facebook Pages found')
      console.error('Make sure your account has a Facebook Page connected to Instagram Business')
      process.exit(1)
    }

    const page = pages[0]
    console.log(`✅ Found Page: ${page.name} (${page.id})`)

    // Get Instagram Business Account
    const igUserId = await client.getInstagramBusinessAccountId(page.id)
    if (!igUserId) {
      console.error('❌ No Instagram Business Account linked to this Page')
      process.exit(1)
    }

    console.log(`✅ Instagram Business Account ID: ${igUserId}\n`)

    // 4. Fetch media
    console.log('🎬 Fetching recent media...')
    const media = await client.getMedia(igUserId, 10)
    console.log(`✅ Found ${media.length} media items\n`)

    if (media.length === 0) {
      console.log('⚠️ No media found. Post something to your Instagram account first!')
      process.exit(0)
    }

    // Display media summary
    console.log('📊 Media Summary:')
    media.forEach((m, i) => {
      const downloadable = isMediaDownloadable(m) ? '✅' : '❌'
      console.log(`  ${i + 1}. ${m.media_type} ${downloadable} ${m.caption?.substring(0, 50) || 'No caption'}...`)
    })
    console.log()

    // 5. Find a downloadable video
    console.log('🔍 Looking for a downloadable video...')
    const videoMedia = media.find((m) => m.media_type === 'VIDEO' && isMediaDownloadable(m))
    
    if (!videoMedia) {
      console.log('⚠️ No downloadable video found')
      console.log('Trying with an image instead...')
      
      const imageMedia = media.find((m) => m.media_type === 'IMAGE' && isMediaDownloadable(m))
      if (!imageMedia) {
        console.log('⚠️ No downloadable media found')
        console.log('This might mean:')
        console.log('  - Media contains copyrighted material')
        console.log('  - Media is still processing')
        console.log('  - API permissions issue')
        process.exit(0)
      }

      await testWithImage(imageMedia)
      return
    }

    await testWithVideo(videoMedia)

  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.response?.data) {
      console.error('API Error:', JSON.stringify(error.response.data, null, 2))
    }
    process.exit(1)
  }
}

async function testWithVideo(media: any) {
  console.log(`✅ Found video: ${media.id}`)
  console.log(`   Caption: ${media.caption?.substring(0, 100) || 'No caption'}...`)
  console.log(`   URL: ${media.media_url?.substring(0, 50)}...`)
  console.log()

  // 6. Download video
  console.log('⬇️ Downloading video...')
  const { buffer, metadata } = await downloadMediaWithMetadata(media)
  console.log(`✅ Downloaded ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`)

  // Save to disk for inspection
  const outputPath = path.join(process.cwd(), 'test-output')
  await fs.mkdir(outputPath, { recursive: true })
  const videoPath = path.join(outputPath, `test-video-${media.id}.mp4`)
  await fs.writeFile(videoPath, buffer)
  console.log(`💾 Saved to: ${videoPath}\n`)

  // 7. Test AI Analysis
  if (process.env.OPENAI_API_KEY) {
    console.log('🤖 Running AI analysis...')
    console.log('This may take 1-2 minutes...\n')

    try {
      const analysis = await analyzeContent(buffer, metadata)

      console.log('✅ AI Analysis Complete!\n')
      console.log('=== RESULTS ===')
      
      if (analysis.transcript) {
        console.log(`\n📝 Transcript (${analysis.transcript.text.length} chars):`)
        console.log(`   "${analysis.transcript.text.substring(0, 200)}..."\n`)
      }

      if (analysis.hookAnalysis) {
        console.log(`🎣 Hook Analysis:`)
        console.log(`   Score: ${analysis.hookAnalysis.score}/100`)
        console.log(`   Strengths: ${analysis.hookAnalysis.strengths.join(', ')}`)
        console.log(`   Weaknesses: ${analysis.hookAnalysis.weaknesses.join(', ')}`)
        console.log()
      }

      if (analysis.contentQuality) {
        console.log(`⭐ Content Quality:`)
        console.log(`   Overall: ${analysis.contentQuality.overallScore}/100`)
        console.log(`   Visual Appeal: ${analysis.contentQuality.visualAppeal}/100`)
        console.log(`   Engagement: ${analysis.contentQuality.engagement}/100`)
        console.log()
      }

      // Save full analysis
      const analysisPath = path.join(outputPath, `analysis-${media.id}.json`)
      await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2))
      console.log(`💾 Full analysis saved to: ${analysisPath}`)

    } catch (error: any) {
      console.error('❌ AI analysis failed:', error.message)
      console.error('This is normal if:')
      console.error('  - ffmpeg is not installed')
      console.error('  - OpenAI API quota exceeded')
      console.error('  - Video is too large/long')
    }
  } else {
    console.log('⚠️ Skipping AI analysis (OPENAI_API_KEY not set)')
  }

  console.log('\n✅ Test completed successfully! 🎉')
}

async function testWithImage(media: any) {
  console.log(`✅ Found image: ${media.id}`)
  console.log(`   Caption: ${media.caption?.substring(0, 100) || 'No caption'}...`)
  console.log()

  // Download image
  console.log('⬇️ Downloading image...')
  const { buffer, metadata } = await downloadMediaWithMetadata(media)
  console.log(`✅ Downloaded ${(buffer.length / 1024).toFixed(2)} KB\n`)

  // Save to disk
  const outputPath = path.join(process.cwd(), 'test-output')
  await fs.mkdir(outputPath, { recursive: true })
  const imagePath = path.join(outputPath, `test-image-${media.id}.jpg`)
  await fs.writeFile(imagePath, buffer)
  console.log(`💾 Saved to: ${imagePath}\n`)

  // Test AI analysis
  if (process.env.OPENAI_API_KEY) {
    console.log('🤖 Running AI analysis...')

    try {
      const analysis = await analyzeContent(buffer, metadata)

      console.log('✅ AI Analysis Complete!\n')

      if (analysis.thumbnailAnalysis) {
        console.log(`🖼️ Thumbnail Analysis:`)
        console.log(`   Score: ${analysis.thumbnailAnalysis.score}/100`)
        console.log(`   Clarity: ${analysis.thumbnailAnalysis.clarity}/100`)
        console.log(`   Composition: ${analysis.thumbnailAnalysis.composition}/100`)
        console.log(`   Attention: ${analysis.thumbnailAnalysis.attention}/100`)
        console.log()
      }

      // Save analysis
      const analysisPath = path.join(outputPath, `analysis-${media.id}.json`)
      await fs.writeFile(analysisPath, JSON.stringify(analysis, null, 2))
      console.log(`💾 Full analysis saved to: ${analysisPath}`)

    } catch (error: any) {
      console.error('❌ AI analysis failed:', error.message)
    }
  }

  console.log('\n✅ Test completed successfully! 🎉')
}

// Run the test
testMediaAccess().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
