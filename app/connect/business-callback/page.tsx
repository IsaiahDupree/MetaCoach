'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseBusinessLoginTokens } from '@/lib/meta-business-login'

export default function BusinessCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      try {
        // Parse tokens from URL fragment
        const fragment = window.location.hash
        
        if (!fragment) {
          setError('No tokens received')
          setStatus('error')
          return
        }

        const tokens = parseBusinessLoginTokens(fragment)
        
        if (!tokens) {
          setError('Failed to parse tokens')
          setStatus('error')
          return
        }

        // Store long-lived token
        const response = await fetch('/api/meta/business-login/store-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: tokens.accessToken,
            longLivedToken: tokens.longLivedToken,
            expiresIn: tokens.expiresIn,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to store token')
        }

        setStatus('success')
        
        // Redirect to dashboard after 1 second
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      } catch (err: any) {
        console.error('Business Login callback error:', err)
        setError(err.message)
        setStatus('error')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow text-center">
        {status === 'processing' && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Connecting your account...</h2>
            <p className="text-gray-600 mt-2">Please wait while we complete the setup</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-green-600 text-5xl mb-4">✓</div>
            <h2 className="text-xl font-semibold">Success!</h2>
            <p className="text-gray-600 mt-2">Redirecting to your dashboard...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-red-600 text-5xl mb-4">✕</div>
            <h2 className="text-xl font-semibold">Connection Failed</h2>
            <p className="text-gray-600 mt-2">{error || 'An error occurred'}</p>
            <button
              onClick={() => router.push('/connect')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </>
        )}
      </div>
    </div>
  )
}
