export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; details?: string }>
}) {
  const params = await searchParams
  const error = params.error
  const details = params.details

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center">Creator Coach</h2>
          <p className="mt-2 text-center text-gray-600">
            Connect your Instagram Business account to start analyzing your content
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            <p className="text-sm font-semibold">
              {error === 'invalid_state' && 'Invalid state. Please try again.'}
              {error === 'no_code' && 'No authorization code received.'}
              {error === 'callback_failed' && 'Connection failed. Please try again.'}
              {error === 'tenant_create_failed' && 'Failed to create account.'}
              {error === 'connection_failed' && 'Failed to save connection.'}
              {error === 'login_canceled' && 'Login was canceled.'}
              {error === 'business_login_failed' && 'Business login failed.'}
            </p>
            {details && (
              <p className="text-xs mt-2 font-mono bg-red-100 p-2 rounded">
                {decodeURIComponent(details)}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          {/* Recommended: Business Login (easier setup) */}
          <div>
            <a
              href="/api/meta/business-login/start"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🚀 Quick Setup (Recommended)
            </a>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Easiest option - guides you through account setup
            </p>
          </div>

          {/* Standard OAuth */}
          <div>
            <a
              href="/api/meta/oauth/start"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Standard Connection
            </a>
            <p className="text-xs text-gray-500 mt-2 text-center">
              For accounts already configured
            </p>
          </div>

          <div className="text-sm text-gray-500 space-y-2">
            <p className="font-semibold">Requirements:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Instagram Business or Creator account</li>
              <li>Connected to a Facebook Page</li>
              <li>You must be admin of that page</li>
            </ul>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              By connecting, you agree to our data processing practices. We only
              download media temporarily for analysis and delete it immediately
              after. See our{' '}
              <a href="#" className="underline">
                privacy policy
              </a>{' '}
              for details.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
