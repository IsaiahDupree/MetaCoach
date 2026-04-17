import { GET as healthHandler } from '@/app/api/health/route'
import { NextRequest } from 'next/server'

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabaseAdmin: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  })),
}))

describe('GET /api/health', () => {
  it('should return healthy status when database is accessible', async () => {
    const req = new NextRequest('http://localhost:4545/api/health', {
      method: 'GET',
    })

    const response = await healthHandler(req)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.status).toBe('healthy')
    expect(data.timestamp).toBeDefined()
    expect(data.version).toBe('1.0.0')
    expect(data.services).toBeDefined()
    expect(data.services.database).toBeDefined()
    expect(data.services.database.status).toBe('up')
    expect(data.services.database.latency_ms).toBeDefined()
  })

  it('should return database latency metric', async () => {
    const req = new NextRequest('http://localhost:4545/api/health', {
      method: 'GET',
    })

    const response = await healthHandler(req)
    const data = await response.json()

    expect(typeof data.services.database.latency_ms).toBe('number')
    expect(data.services.database.latency_ms).toBeGreaterThanOrEqual(0)
  })

  it('should include uptime metric', async () => {
    const req = new NextRequest('http://localhost:4545/api/health', {
      method: 'GET',
    })

    const response = await healthHandler(req)
    const data = await response.json()

    expect(data.uptime_ms).toBeDefined()
    expect(typeof data.uptime_ms).toBe('number')
  })
})
