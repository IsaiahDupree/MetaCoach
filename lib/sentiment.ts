import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface CommentSentiment {
  comment_id: string
  text: string
  sentiment: number // -1.0 (negative) to 1.0 (positive)
  category: 'positive' | 'neutral' | 'negative'
  confidence: number // 0.0 to 1.0
}

export interface AggregatedSentiment {
  average_sentiment: number
  positive_count: number
  neutral_count: number
  negative_count: number
  total_count: number
  positive_percentage: number
  neutral_percentage: number
  negative_percentage: number
  confidence: number
}

/**
 * Analyze sentiment of a batch of comments using OpenAI
 */
export async function analyzeCommentsSentiment(
  comments: Array<{ id: string; text: string }>
): Promise<CommentSentiment[]> {
  if (comments.length === 0) return []

  // Batch comments for efficiency (max 50 at a time)
  const batchSize = 50
  const results: CommentSentiment[] = []

  for (let i = 0; i < comments.length; i += batchSize) {
    const batch = comments.slice(i, i + batchSize)
    const batchResults = await analyzeBatch(batch)
    results.push(...batchResults)
  }

  return results
}

async function analyzeBatch(
  comments: Array<{ id: string; text: string }>
): Promise<CommentSentiment[]> {
  try {
    const prompt = `Analyze the sentiment of these Instagram comments. For each comment, return a JSON object with:
- comment_id: the ID from the input
- sentiment: a number from -1.0 (very negative) to 1.0 (very positive)
- category: "positive", "neutral", or "negative"
- confidence: 0.0 to 1.0 indicating how confident you are

Comments to analyze:
${comments.map((c, idx) => `${idx + 1}. [ID: ${c.id}] ${c.text}`).join('\n')}

Return ONLY a JSON array, no other text. Format: [{"comment_id": "...", "sentiment": 0.5, "category": "positive", "confidence": 0.9}, ...]`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a sentiment analysis expert. Analyze Instagram comments and return accurate sentiment scores. Be objective and consider emojis, slang, and context.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Parse JSON response
    const results = JSON.parse(content) as Array<{
      comment_id: string
      sentiment: number
      category: 'positive' | 'neutral' | 'negative'
      confidence: number
    }>

    // Merge with original comment text
    return results.map((r) => {
      const original = comments.find((c) => c.id === r.comment_id)
      return {
        comment_id: r.comment_id,
        text: original?.text || '',
        sentiment: r.sentiment,
        category: r.category,
        confidence: r.confidence,
      }
    })
  } catch (error) {
    console.error('Error analyzing sentiment batch:', error)
    // Return neutral sentiment as fallback
    return comments.map((c) => ({
      comment_id: c.id,
      text: c.text,
      sentiment: 0,
      category: 'neutral' as const,
      confidence: 0,
    }))
  }
}

/**
 * Calculate aggregated sentiment metrics from analyzed comments
 */
export function aggregateSentiment(
  sentiments: CommentSentiment[]
): AggregatedSentiment {
  if (sentiments.length === 0) {
    return {
      average_sentiment: 0,
      positive_count: 0,
      neutral_count: 0,
      negative_count: 0,
      total_count: 0,
      positive_percentage: 0,
      neutral_percentage: 0,
      negative_percentage: 0,
      confidence: 0,
    }
  }

  const total = sentiments.length
  const positive = sentiments.filter((s) => s.category === 'positive').length
  const neutral = sentiments.filter((s) => s.category === 'neutral').length
  const negative = sentiments.filter((s) => s.category === 'negative').length

  const avgSentiment =
    sentiments.reduce((sum, s) => sum + s.sentiment, 0) / total
  const avgConfidence =
    sentiments.reduce((sum, s) => sum + s.confidence, 0) / total

  return {
    average_sentiment: Number(avgSentiment.toFixed(3)),
    positive_count: positive,
    neutral_count: neutral,
    negative_count: negative,
    total_count: total,
    positive_percentage: Number(((positive / total) * 100).toFixed(1)),
    neutral_percentage: Number(((neutral / total) * 100).toFixed(1)),
    negative_percentage: Number(((negative / total) * 100).toFixed(1)),
    confidence: Number(avgConfidence.toFixed(3)),
  }
}

/**
 * Categorize a sentiment score into positive/neutral/negative
 */
export function categorizeSentiment(
  score: number
): 'positive' | 'neutral' | 'negative' {
  if (score > 0.2) return 'positive'
  if (score < -0.2) return 'negative'
  return 'neutral'
}
