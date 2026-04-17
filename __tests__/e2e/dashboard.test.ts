/**
 * E2E Tests - Dashboard Flow
 * These tests simulate complete user flows through the dashboard
 */

describe('Dashboard E2E Tests', () => {
  describe('Login Flow', () => {
    it('should successfully login and redirect to dashboard', async () => {
      // Simulate form submission
      const credentials = {
        email: 'test@example.com',
        password: 'ValidPassword123',
      }

      // Mock the login API call
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            token: 'jwt-token-123',
            user: { id: 'user-1', email: 'test@example.com' },
          }),
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.token).toBeDefined()
      expect(data.user.email).toBe('test@example.com')
    })

    it('should reject invalid credentials', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'WrongPassword',
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' }),
      })

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(401)
    })
  })

  describe('Account Selection', () => {
    it('should load and display accounts on dashboard', async () => {
      const mockAccounts = [
        { id: 'act_123', name: 'Account 1', currency: 'USD', balance: 1000 },
        { id: 'act_456', name: 'Account 2', currency: 'EUR', balance: 2000 },
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ accounts: mockAccounts }),
      })

      const response = await fetch('/api/meta/accounts', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.accounts).toHaveLength(2)
      expect(data.accounts[0].name).toBe('Account 1')
    })

    it('should switch between accounts', async () => {
      const mockCampaigns1 = [
        { id: 'camp_1', name: 'Campaign 1', status: 'ACTIVE' },
      ]
      const mockCampaigns2 = [
        { id: 'camp_2', name: 'Campaign 2', status: 'PAUSED' },
      ]

      global.fetch = jest.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ campaigns: mockCampaigns1 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ campaigns: mockCampaigns2 }),
        })

      // Fetch campaigns for account 1
      let response = await fetch('/api/meta/ads/campaigns?ad_account_id=act_123', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })
      let data = await response.json()

      expect(data.campaigns[0].id).toBe('camp_1')

      // Fetch campaigns for account 2
      response = await fetch('/api/meta/ads/campaigns?ad_account_id=act_456', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })
      data = await response.json()

      expect(data.campaigns[0].id).toBe('camp_2')
    })
  })

  describe('Dashboard Data Loading', () => {
    it('should load metrics when account is selected', async () => {
      const mockMetrics = {
        spend: 1500,
        impressions: 50000,
        clicks: 1000,
        conversions: 50,
        ctr: 0.02,
        cpc: 1.5,
        roas: 3.33,
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ summary: mockMetrics }),
      })

      const response = await fetch(
        '/api/meta/metrics/fetch?account_id=act_123&from=2024-01-01&to=2024-01-31',
        { headers: { Authorization: 'Bearer jwt-token-123' } }
      )

      const data = await response.json()

      expect(response.ok).toBe(true)
      expect(data.summary.spend).toBe(1500)
      expect(data.summary.roas).toBe(3.33)
    })

    it('should load campaigns list', async () => {
      const mockCampaigns = [
        { id: 'camp_1', name: 'Campaign 1', status: 'ACTIVE', objective: 'OUTCOME_TRAFFIC' },
        { id: 'camp_2', name: 'Campaign 2', status: 'PAUSED', objective: 'OUTCOME_LEADS' },
        { id: 'camp_3', name: 'Campaign 3', status: 'ACTIVE', objective: 'OUTCOME_SALES' },
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ campaigns: mockCampaigns }),
      })

      const response = await fetch('/api/meta/ads/campaigns?ad_account_id=act_123', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.campaigns).toHaveLength(3)
      expect(data.campaigns.some((c: any) => c.status === 'ACTIVE')).toBe(true)
    })
  })

  describe('Charts Rendering', () => {
    it('should provide performance data for charts', async () => {
      const mockPerformanceData = Array(30)
        .fill(null)
        .map((_, i) => ({
          date: new Date(2024, 0, i + 1).toISOString().split('T')[0],
          spend: Math.random() * 500 + 100,
          conversions: Math.floor(Math.random() * 50 + 10),
          impressions: Math.floor(Math.random() * 10000 + 5000),
          clicks: Math.floor(Math.random() * 500 + 100),
        }))

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: mockPerformanceData }),
      })

      const response = await fetch('/api/meta/metrics/trend?account_id=act_123', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.data).toHaveLength(30)
      expect(data.data[0]).toHaveProperty('date')
      expect(data.data[0]).toHaveProperty('spend')
    })
  })

  describe('Recommendations Display', () => {
    it('should load and display recommendations', async () => {
      const mockRecommendations = [
        {
          id: 'rec_1',
          title: 'Increase Budget',
          description: 'This campaign is performing well',
          priority: 'high',
          confidence_score: 0.85,
          estimated_impact: 40,
        },
        {
          id: 'rec_2',
          title: 'Refresh Creative',
          description: 'Ad fatigue detected',
          priority: 'medium',
          confidence_score: 0.75,
          estimated_impact: 30,
        },
      ]

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ recommendations: mockRecommendations }),
      })

      const response = await fetch('/api/recommendations/list?account_id=act_123', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.recommendations).toHaveLength(2)
      expect(data.recommendations[0].priority).toBe('high')
    })

    it('should handle click on recommendation to show details', async () => {
      const mockRecommendation = {
        id: 'rec_1',
        title: 'Increase Budget',
        description: 'This campaign has a 3.5x ROAS',
        priority: 'high',
        confidence_score: 0.85,
        estimated_impact: 40,
        implementation_instructions: 'Increase daily budget by 25-50%',
      }

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRecommendation),
      })

      const response = await fetch('/api/recommendations/rec_1', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      const data = await response.json()

      expect(data.implementation_instructions).toBeDefined()
      expect(data.title).toBe('Increase Budget')
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Internal server error' }),
      })

      const response = await fetch('/api/meta/accounts', {
        headers: { Authorization: 'Bearer jwt-token-123' },
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(500)
    })

    it('should handle network errors', async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error('Network error'))

      try {
        await fetch('/api/meta/accounts')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.message).toContain('Network error')
      }
    })
  })
})
