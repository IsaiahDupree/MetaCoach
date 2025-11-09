import OpenAI from 'openai'

// Lazy initialization to allow environment variables to load first
let _openai: OpenAI | null = null

export const openai = new Proxy({} as OpenAI, {
  get(target, prop) {
    if (!_openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing env.OPENAI_API_KEY')
      }
      _openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }
    return (_openai as any)[prop]
  }
})

// Cost tracking helper
export function estimateCost(model: string, promptTokens: number, completionTokens: number): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'whisper-1': { input: 0.006, output: 0 }, // per minute
  }
  
  const rates = pricing[model] || { input: 0, output: 0 }
  return (promptTokens / 1000) * rates.input + (completionTokens / 1000) * rates.output
}
