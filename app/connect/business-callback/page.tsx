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
        
        console.log('[Business Login] Processing callback...')
        console.log('[Business Login] Fragment present:', !!fragment)
        
        if (!fragment) {
          setError('No tokens received from Facebook. Please try again.')
          setStatus('error')
          return
        }

        const tokens = parseBusinessLoginTokens(fragment)
        
        console.log('[Business Login] Tokens parsed:', !!tokens)
        console.log('[Business Login] Has state in token:', !!tokens?.state)
        
        if (!tokens) {
          setError('Failed to parse authentication tokens. Please try again.')
          setStatus('error')
          return
        }

        // Verify state matches what we stored
        // Try sessionStorage first, fallback to localStorage
        let storedState = sessionStorage.getItem('oauth_state')
        let stateSource = 'sessionStorage'
        
        if (!storedState) {
          storedState = localStorage.getItem('oauth_state')
          stateSource = 'localStorage'
          
          // Check if state is not too old (max 10 minutes)
          const timestamp = localStorage.getItem('oauth_state_timestamp')
          if (timestamp) {
            const age = Date.now() - parseInt(timestamp)
            console.log('[Business Login] State age:', age, 'ms')
            if (age > 600000) { // 10 minutes in ms
              console.warn('[Business Login] Stored state is too old')
              storedState = null
            }
          }
        }
        
        console.log('[Business Login] State source:', stateSource)
        console.log('[Business Login] State found:', !!storedState)
        
        if (!storedState || tokens.state !== storedState) {
          console.error('[Business Login] CSRF check failed:', {
            hasStoredState: !!storedState,
            hasTokenState: !!tokens.state,
            statesMatch: storedState === tokens.state
          })
          setError('Security verification failed. Please clear your browser cache and try again.')
          setStatus('error')
          return
        }
        
        console.log('[Business Login] CSRF check passed ✓')

        // Clear the stored state from both storages
        sessionStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_state')
        localStorage.removeItem('oauth_state_timestamp')

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
          const data = await response.json()
          throw new Error(data.error || 'Failed to store token')
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
