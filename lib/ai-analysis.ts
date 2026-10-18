import { openai } from './openai'
import type { InstagramMedia } from './types'
import { extractVideoFrames, extractSingleFrame } from './video-utils'

/**
 * AI-powered content analysis results
 */
export interface ContentAnalysisResult {
  mediaId: string
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  timestamp: string
  
  // Video-specific analysis
  transcript?: {
    text: string
    language: string
    duration: number
  }
  hookAnalysis?: {
    score: number // 0-100
    strengths: string[]
    weaknesses: string[]
    recommendations: string[]
    keyFrames: string[] // Base64 encoded frames
  }
  
  // Image/Thumbnail analysis
  thumbnailAnalysis?: {
    score: number // 0-100
    clarity: number // 0-100
    composition: number // 0-100
    attention: number // 0-100
    recommendations: string[]
  }
  
  // General content analysis
  contentQuality?: {
    overallScore: number // 0-100
    visualAppeal: number
    engagement: number
    relevance: number
    suggestions: string[]
  }
  
  // Metadata
  analyzedAt: string
  processingTimeMs: number
}

/**
 * Main analysis function - routes to appropriate analyzer based on media type
 */
export async function analyzeContent(
  mediaBuffer: Buffer,
  media: InstagramMedia
): Promise<ContentAnalysisResult> {
  const startTime = Date.now()

  console.log(`[AI Analysis] Starting analysis for ${media.media_type} media: ${media.id}`)

  let result: Partial<ContentAnalysisResult> = {
    mediaId: media.id,
    mediaType: media.media_type as any,
    timestamp: media.timestamp || new Date().toISOString(),
  }

  if (media.media_type === 'VIDEO') {
    // Video analysis pipeline
    console.log('[AI Analysis] Processing video...')
    
    // 1. Generate transcript
    const transcript = await generateTranscript(mediaBuffer)
    result.transcript = transcript

    // 2. Extract frames for visual analysis
    const frames = await extractVideoFrames(mediaBuffer, { count: 10 })

    // 3. Analyze hook (first 3-5 seconds)
    const hookFrames = frames.slice(0, 5) // First 5 frames
    const hookAnalysis = await analyzeHook(hookFrames, transcript.text)
    result.hookAnalysis = hookAnalysis

    // 4. Overall content quality
    const contentQuality = await analyzeVideoContent(frames, transcript.text, media.caption)
    result.contentQuality = contentQuality

  } else if (media.media_type === 'IMAGE') {
    // Image analysis pipeline
    console.log('[AI Analysis] Processing image...')
    
    const thumbnailAnalysis = await analyzeThumbnail(mediaBuffer, media.caption)
    result.thumbnailAnalysis = thumbnailAnalysis

    const contentQuality = await analyzeImageContent(mediaBuffer, media.caption)
    result.contentQuality = contentQuality

  } else if (media.media_type === 'CAROUSEL_ALBUM') {
    // Carousel - analyze first image as thumbnail
    console.log('[AI Analysis] Processing carousel album...')
    
    const thumbnailAnalysis = await analyzeThumbnail(mediaBuffer, media.caption)
    result.thumbnailAnalysis = thumbnailAnalysis
  }

  const processingTimeMs = Date.now() - startTime

  console.log(`[AI Analysis] Complete in ${processingTimeMs}ms`)

  return {
    ...result,
    analyzedAt: new Date().toISOString(),
    processingTimeMs,
  } as ContentAnalysisResult
}

/**
 * Generate transcript from video using Whisper
 */
export async function generateTranscript(
  videoBuffer: Buffer
): Promise<{ text: string; language: string; duration: number }> {
  const startTime = Date.now()

  console.log('[Whisper] Generating transcript...')

  try {
    // Create a File-like object for OpenAI
    // Convert Buffer to Blob then to File
    // Need to convert Buffer to Uint8Array for proper Blob construction
    const uint8Array = new Uint8Array(videoBuffer)
    const blob = new Blob([uint8Array], { type: 'video/mp4' })
    const file = new File([blob], 'video.mp4', { type: 'video/mp4' })

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      language: 'en', // Auto-detect or specify
    })

    const duration = Date.now() - startTime

    console.log(`[Whisper] Transcript generated in ${duration}ms`)
    console.log(`[Whisper] Text length: ${transcription.text.length} characters`)

    return {
      text: transcription.text,
      language: (transcription as any).language || 'en',
      duration: duration,
    }
  } catch (error: any) {
    console.error('[Whisper] Error generating transcript:', error.message)
    throw new Error(`Failed to generate transcript: ${error.message}`)
  }
}

/**
 * Analyze hook quality (first 3-5 seconds of video)
 */
export async function analyzeHook(
  frames: Buffer[],
  transcript: string
): Promise<{
  score: number
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  keyFrames: string[]
}> {
  console.log(`[Hook Analysis] Analyzing ${frames.length} frames...`)

  // Convert frames to base64 for GPT-4 Vision
  const base64Frames = frames.map((frame) => frame.toString('base64'))

  // Analyze with GPT-4 Vision
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert Instagram content analyst. Analyze the hook (first 3-5 seconds) of this video.
        
Evaluate:
1. Visual impact - Does it grab attention immediately?
2. Clarity - Is the message clear within first few seconds?
3. Intrigue - Does it make viewers want to watch more?
4. Composition - Are the visuals well-framed and engaging?

Provide a score (0-100), identify strengths, weaknesses, and specific recommendations.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this video hook. First 5 frames are provided. Transcript of first few seconds: "${transcript.substring(0, 200)}..."`,
          },
          ...base64Frames.slice(0, 3).map((frame) => ({
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame}`,
              detail: 'high' as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 1000,
  })

  // Parse response
  const analysis = response.choices[0].message.content || ''

  // Extract structured data (simple parsing, could be improved with function calling)
  const scoreMatch = analysis.match(/score[:\s]+(\d+)/i)
  const score = scoreMatch ? parseInt(scoreMatch[1]) : 50

  const strengths = extractListItems(analysis, 'strength')
  const weaknesses = extractListItems(analysis, 'weakness')
  const recommendations = extractListItems(analysis, 'recommendation')

  console.log(`[Hook Analysis] Score: ${score}/100`)

  return {
    score,
    strengths,
    weaknesses,
    recommendations,
    keyFrames: base64Frames,
  }
}

/**
 * Analyze image/thumbnail quality
 */
export async function analyzeThumbnail(
  imageBuffer: Buffer,
  caption?: string
): Promise<{
  score: number
  clarity: number
  composition: number
  attention: number
  recommendations: string[]
}> {
  console.log('[Thumbnail Analysis] Analyzing image quality...')

  const base64Image = imageBuffer.toString('base64')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert at analyzing Instagram thumbnails and images.

Evaluate:
1. Clarity (0-100) - Is the image sharp and well-lit?
2. Composition (0-100) - Is it well-framed and balanced?
3. Attention (0-100) - Does it grab attention in a feed?

Provide scores for each dimension and an overall score. Give specific recommendations.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: caption ? `Analyze this image. Caption: "${caption}"` : 'Analyze this image.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 800,
  })

  const analysis = response.choices[0].message.content || ''

  // Extract scores
  const clarityMatch = analysis.match(/clarity[:\s]+(\d+)/i)
  const compositionMatch = analysis.match(/composition[:\s]+(\d+)/i)
  const attentionMatch = analysis.match(/attention[:\s]+(\d+)/i)
  const scoreMatch = analysis.match(/(?:overall\s+)?score[:\s]+(\d+)/i)

  const clarity = clarityMatch ? parseInt(clarityMatch[1]) : 50
  const composition = compositionMatch ? parseInt(compositionMatch[1]) : 50
  const attention = attentionMatch ? parseInt(attentionMatch[1]) : 50
  const score = scoreMatch ? parseInt(scoreMatch[1]) : Math.round((clarity + composition + attention) / 3)

  const recommendations = extractListItems(analysis, 'recommendation')

  console.log(`[Thumbnail Analysis] Score: ${score}/100`)

  return {
    score,
    clarity,
    composition,
    attention,
    recommendations,
  }
}

/**
 * Analyze overall video content quality
 */
async function analyzeVideoContent(
  frames: Buffer[],
  transcript: string,
  caption?: string
): Promise<{
  overallScore: number
  visualAppeal: number
  engagement: number
  relevance: number
  suggestions: string[]
}> {
  console.log('[Content Analysis] Analyzing overall video quality...')

  // Sample frames (beginning, middle, end)
  const sampleFrames = [
    frames[0],
    frames[Math.floor(frames.length / 2)],
    frames[frames.length - 1],
  ]

  const base64Frames = sampleFrames.map((f) => f.toString('base64'))

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert Instagram content strategist. Analyze this video for:

1. Visual Appeal (0-100) - Production quality, aesthetics
2. Engagement (0-100) - Likely to keep viewers watching
3. Relevance (0-100) - Clear message, valuable content

Provide scores and actionable suggestions for improvement.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this video content.
            
Caption: ${caption || 'No caption'}

Transcript sample: ${transcript.substring(0, 500)}...

Analyzing ${frames.length} frames (showing beginning, middle, end):`,
          },
          ...base64Frames.map((frame) => ({
            type: 'image_url' as const,
            image_url: {
              url: `data:image/jpeg;base64,${frame}`,
              detail: 'low' as const,
            },
          })),
        ],
      },
    ],
    max_tokens: 1000,
  })

  const analysis = response.choices[0].message.content || ''

  // Extract scores
  const visualMatch = analysis.match(/visual\s+appeal[:\s]+(\d+)/i)
  const engagementMatch = analysis.match(/engagement[:\s]+(\d+)/i)
  const relevanceMatch = analysis.match(/relevance[:\s]+(\d+)/i)

  const visualAppeal = visualMatch ? parseInt(visualMatch[1]) : 50
  const engagement = engagementMatch ? parseInt(engagementMatch[1]) : 50
  const relevance = relevanceMatch ? parseInt(relevanceMatch[1]) : 50
  const overallScore = Math.round((visualAppeal + engagement + relevance) / 3)

  const suggestions = extractListItems(analysis, 'suggestion')

  return {
    overallScore,
    visualAppeal,
    engagement,
    relevance,
    suggestions,
  }
}

/**
 * Analyze image content quality
 */
async function analyzeImageContent(
  imageBuffer: Buffer,
  caption?: string
): Promise<{
  overallScore: number
  visualAppeal: number
  engagement: number
  relevance: number
  suggestions: string[]
}> {
  console.log('[Content Analysis] Analyzing image content...')

  const base64Image = imageBuffer.toString('base64')

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `You are an expert Instagram content strategist. Analyze this image for:

1. Visual Appeal (0-100) - Aesthetic quality, lighting, composition
2. Engagement (0-100) - Likely to get likes, comments, saves
3. Relevance (0-100) - Clear message, valuable to audience

Provide scores and actionable suggestions.`,
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image post.

Caption: ${caption || 'No caption'}`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`,
              detail: 'high',
            },
          },
        ],
      },
    ],
    max_tokens: 800,
  })

  const analysis = response.choices[0].message.content || ''

  // Extract scores
  const visualMatch = analysis.match(/visual\s+appeal[:\s]+(\d+)/i)
  const engagementMatch = analysis.match(/engagement[:\s]+(\d+)/i)
  const relevanceMatch = analysis.match(/relevance[:\s]+(\d+)/i)

  const visualAppeal = visualMatch ? parseInt(visualMatch[1]) : 50
  const engagement = engagementMatch ? parseInt(engagementMatch[1]) : 50
  const relevance = relevanceMatch ? parseInt(relevanceMatch[1]) : 50
  const overallScore = Math.round((visualAppeal + engagement + relevance) / 3)

  const suggestions = extractListItems(analysis, 'suggestion')

  return {
    overallScore,
    visualAppeal,
    engagement,
    relevance,
    suggestions,
  }
}

/**
 * Helper: Extract list items from GPT response
 */
function extractListItems(text: string, keyword: string): string[] {
  const items: string[] = []
  
  // Look for numbered or bulleted lists containing the keyword
  const regex = new RegExp(`(?:^|\\n)\\s*(?:\\d+\\.|[-*•])\\s*(.+${keyword}.+?)(?=$|\\n)`, 'gmi')
  let match
  
  while ((match = regex.exec(text)) !== null) {
    items.push(match[1].trim())
  }

  // If no matches, look for lines containing keyword
  if (items.length === 0) {
    const lines = text.split('\n')
    lines.forEach((line) => {
      if (line.toLowerCase().includes(keyword.toLowerCase())) {
        const cleaned = line.replace(/^[-*•\d.)\s]+/, '').trim()
        if (cleaned) {
          items.push(cleaned)
        }
      }
    })
  }

  return items.slice(0, 5) // Limit to top 5
}
