import '@testing-library/jest-dom'

// Mock environment variables for tests
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret'
process.env.META_APP_ID = 'test-app-id'
process.env.META_APP_SECRET = 'test-app-secret'
process.env.META_REDIRECT_URL = 'http://localhost:4545/api/meta/oauth/callback'
process.env.PUBLIC_BASE_URL = 'http://localhost:4545'
