import OpenAI from 'openai'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing env.OPENAI_API_KEY')
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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
