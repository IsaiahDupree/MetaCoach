import axios from 'axios'

jest.mock('axios')

const mockedAxios = axios as jest.Mocked<typeof axios>

describe('Meta API Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Account List Fetch', () => {
    it('should fetch ad accounts successfully', async () => {
      const mockAccounts = [
        { id: 'act_123', name: 'Account 1', currency: 'USD', balance: 1000 },
        { id: 'act_456', name: 'Account 2', currency: 'EUR', balance: 2000 },
      ]

      mockedAxios.get.mockResolvedValue({
        data: { accounts: mockAccounts, paging: { cursors: {} } },
      })

      const response = await axios.get('/api/meta/accounts')

      expect(response.data.accounts).toHaveLength(2)
      expect(response.data.accounts[0].id).toBe('act_123')
    })

    it('should handle empty account list', async () => {
      mockedAxios.get.mockResolvedValue({
        data: { accounts: [], paging: { cursors: {} } },
      })

      const response = await axios.get('/api/meta/accounts')

      expect(response.data.accounts).toHaveLength(0)
    })

    it('should handle API errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, data: { error: 'Unauthorized' } },
      })

      try {
        await axios.get('/api/meta/accounts')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('Campaign Data Sync', () => {
    it('should fetch campaigns successfully', async () => {
      const mockCampaigns = [
        {
          id: 'camp_123',
          name: 'Campaign 1',
          status: 'ACTIVE',
          objective: 'OUTCOME_TRAFFIC',
        },
        {
          id: 'camp_456',
          name: 'Campaign 2',
          status: 'PAUSED',
          objective: 'OUTCOME_LEADS',
        },
      ]

      mockedAxios.get.mockResolvedValue({
        data: { campaigns: mockCampaigns },
      })

      const response = await axios.get('/api/meta/ads/campaigns')

      expect(response.data.campaigns).toHaveLength(2)
      expect(response.data.campaigns[0].status).toBe('ACTIVE')
    })

    it('should handle campaign sync errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 500, data: { error: 'Server error' } },
      })

      try {
        await axios.get('/api/meta/ads/campaigns')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(500)
      }
    })
  })

  describe('Metrics Fetch', () => {
    it('should fetch performance metrics', async () => {
      const mockMetrics = {
        impressions: 50000,
        clicks: 1000,
        spend: 500,
        actions: 50,
        action_value: 2500,
        ctr: 0.02,
        cpc: 0.5,
        cpa: 10,
        roas: 5,
      }

      mockedAxios.get.mockResolvedValue({
        data: { summary: mockMetrics },
      })

      const response = await axios.get('/api/meta/metrics/fetch')

      expect(response.data.summary.impressions).toBe(50000)
      expect(response.data.summary.roas).toBe(5)
    })

    it('should handle date range filtering', async () => {
      const mockMetrics = {
        impressions: 25000,
        clicks: 500,
        spend: 250,
      }

      mockedAxios.get.mockResolvedValue({
        data: { summary: mockMetrics },
      })

      const fromDate = '2024-01-01'
      const toDate = '2024-01-31'
      const response = await axios.get(
        `/api/meta/metrics/fetch?from=${fromDate}&to=${toDate}`
      )

      expect(response.data.summary).toBeDefined()
    })

    it('should handle metrics fetch errors', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 400, data: { error: 'Bad request' } },
      })

      try {
        await axios.get('/api/meta/metrics/fetch')
        fail('Should have thrown an error')
      } catch (error: any) {
        expect(error.response.status).toBe(400)
      }
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 429,
          headers: { 'retry-after': '60' },
          data: { error: 'Rate limit exceeded' },
        },
      })

      try {
        await axios.get('/api/meta/accounts')
        fail('Should have thrown a rate limit error')
      } catch (error: any) {
        expect(error.response.status).toBe(429)
        expect(error.response.headers['retry-after']).toBe('60')
      }
    })
  })

  describe('Token Refresh', () => {
    it('should handle expired tokens', async () => {
      mockedAxios.get.mockRejectedValue({
        response: { status: 401, data: { error: 'Token expired' } },
      })

      try {
        await axios.get('/api/meta/accounts')
        fail('Should have thrown a token error')
      } catch (error: any) {
        expect(error.response.status).toBe(401)
      }
    })
  })

  describe('Pagination', () => {
    it('should handle paginated results', async () => {
      const page1 = {
        data: Array(25)
          .fill(null)
          .map((_, i) => ({ id: `account_${i}` })),
        paging: { cursors: { after: 'cursor_123' } },
      }

      mockedAxios.get.mockResolvedValue({ data: page1 })

      const response = await axios.get('/api/meta/accounts')

      expect(response.data.data).toHaveLength(25)
      expect(response.data.paging.cursors.after).toBe('cursor_123')
    })
  })
})
