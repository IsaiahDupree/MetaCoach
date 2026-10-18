'use client'

import { useEffect, useState } from 'react'
import { Copy, CheckCircle, Eye, EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch('/api/settings/token')
        if (!res.ok) {
          throw new Error('Failed to fetch token')
        }
        const data = await res.json()
        setToken(data.token)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchToken()
  }, [])

  const handleCopy = async () => {
    if (!token) return
    await navigator.clipboard.writeText(token)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
            <p className="text-sm mt-2">
              Please{' '}
              <a href="/connect" className="underline">
                connect your Meta account
              </a>{' '}
              first.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your Meta access token and integrations
          </p>
        </div>

        {/* Token Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Meta Access Token</h2>
            <p className="text-sm text-gray-600">
              Use this token to integrate with external systems like Everreach.
              This token gives access to your Instagram and Facebook data.
            </p>
          </div>

          {token && (
            <div className="space-y-4">
              {/* Token Display */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-3 font-mono text-sm overflow-hidden">
                  {showToken ? token : '•'.repeat(Math.min(token.length, 100))}
                </div>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showToken ? 'Hide token' : 'Show token'}
                >
                  {showToken ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <CheckCircle size={20} />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={20} />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
                <p className="font-semibold text-sm mb-1">⚠️ Security Warning</p>
                <p className="text-sm">
                  Keep this token secure. Anyone with this token can access your
                  Instagram and Facebook data. Only share it with trusted
                  systems over secure connections (HTTPS).
                </p>
              </div>

              {/* Token Info */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">
                  How to use this token:
                </h3>
                <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                  <li>Pass it as a cookie: <code className="bg-white px-2 py-0.5 rounded">meta_access_token={'{token}'}</code></li>
                  <li>Use it with MetaCoach APIs at <code className="bg-white px-2 py-0.5 rounded">{window.location.origin}/api/*</code></li>
                  <li>Share with Everreach for dashboard integration</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Integration Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Integration Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Meta / Instagram</p>
                <p className="text-sm text-gray-600">Connected and active</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Active
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Sentiment Analysis</p>
                <p className="text-sm text-gray-600">OpenAI-powered comment analysis</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Enabled
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">External API Access</p>
                <p className="text-sm text-gray-600">For Everreach and other backends</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Available
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
