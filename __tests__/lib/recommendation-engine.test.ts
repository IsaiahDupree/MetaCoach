import { RecommendationEngine, Recommendation } from '@/lib/recommendation-engine'

jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        gte: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null })),
    })),
  })),
}))

describe('RecommendationEngine', () => {
  describe('scoreRecommendations', () => {
    it('should sort recommendations by calculated score', () => {
      const engine = new RecommendationEngine()
      const recommendations: Recommendation[] = [
        {
          id: '1',
          meta_account_id: 'acc1',
          recommendation_type: 'budget',
          title: 'High Score Rec',
          description: 'High confidence and impact',
          confidence_score: 0.9,
          estimated_impact: 500,
          estimated_effort: 'low',
          implementation_instructions: 'Increase budget to $100',
          priority: 'high',
        },
        {
          id: '2',
          meta_account_id: 'acc1',
          recommendation_type: 'creative',
          title: 'Low Score Rec',
          description: 'Low confidence and impact',
          confidence_score: 0.3,
          estimated_impact: 50,
          estimated_effort: 'high',
          implementation_instructions: 'Refresh creative',
          priority: 'low',
        },
      ]

      const scored = engine.scoreRecommendations(recommendations)

      expect(scored).toHaveLength(2)
      expect(scored[0].id).toBe('1')
      expect(scored[1].id).toBe('2')
    })

    it('should handle empty recommendations list', () => {
      const engine = new RecommendationEngine()
      const recommendations: Recommendation[] = []
      const scored = engine.scoreRecommendations(recommendations)

      expect(scored).toEqual([])
    })

    it('should rank by confidence * impact / effort', () => {
      const engine = new RecommendationEngine()
      const recommendations: Recommendation[] = [
        {
          id: '1',
          meta_account_id: 'acc1',
          recommendation_type: 'budget',
          title: 'Low impact, high confidence',
          description: 'Test',
          confidence_score: 0.9,
          estimated_impact: 100,
          estimated_effort: 'low',
          implementation_instructions: 'Test',
          priority: 'high',
        },
        {
          id: '2',
          meta_account_id: 'acc1',
          recommendation_type: 'creative',
          title: 'High impact, low confidence',
          description: 'Test',
          confidence_score: 0.3,
          estimated_impact: 1000,
          estimated_effort: 'high',
          implementation_instructions: 'Test',
          priority: 'low',
        },
      ]

      const scored = engine.scoreRecommendations(recommendations)

      // Score formula: confidence * impact / effort_multiplier
      // Rec 1: (0.9 * 100) / 1 = 90
      // Rec 2: (0.3 * 1000) / 3 = 100
      // Rec 2 should rank first
      expect(scored[0].id).toBe('2')
    })

    it('should account for effort multiplier in scoring', () => {
      const engine = new RecommendationEngine()
      const lowEffortRec: Recommendation = {
        id: '1',
        meta_account_id: 'acc1',
        recommendation_type: 'budget',
        title: 'Low Effort',
        description: 'Test',
        confidence_score: 0.5,
        estimated_impact: 200,
        estimated_effort: 'low',
        implementation_instructions: 'Test',
        priority: 'high',
      }

      const highEffortRec: Recommendation = {
        id: '2',
        meta_account_id: 'acc1',
        recommendation_type: 'creative',
        title: 'High Effort',
        description: 'Test',
        confidence_score: 0.5,
        estimated_impact: 200,
        estimated_effort: 'high',
        implementation_instructions: 'Test',
        priority: 'low',
      }

      const scored = engine.scoreRecommendations([highEffortRec, lowEffortRec])

      // Low effort should rank higher since effort is in denominator
      // Low effort: (0.5 * 200) / 1 = 100
      // High effort: (0.5 * 200) / 3 = 33.33
      expect(scored[0].id).toBe('1')
      expect(scored[1].id).toBe('2')
    })
  })

  describe('generateRecommendations', () => {
    it('should return an array of recommendations', async () => {
      const engine = new RecommendationEngine()
      const recommendations = await engine.generateRecommendations('test-account-id')

      expect(Array.isArray(recommendations)).toBe(true)
    })

    it('should handle no metrics gracefully', async () => {
      const engine = new RecommendationEngine()
      const recommendations = await engine.generateRecommendations('test-account-id')

      expect(recommendations).toEqual([])
    })
  })
})
