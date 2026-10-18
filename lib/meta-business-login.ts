// Facebook Login for Business - Simplified Instagram API onboarding
// Docs: https://developers.facebook.com/docs/instagram-platform/instagram-api-with-facebook-login/business-login

export function getBusinessLoginUrl(state: string): string {
  const clientId = process.env.META_APP_ID!
  const baseUrl = process.env.PUBLIC_BASE_URL!
  const redirectUri = `${baseUrl}/api/meta/business-login/callback`
  
  // Scopes for comprehensive API access
  const scopes = [
    'instagram_basic',
    'instagram_content_publish',
    'instagram_manage_comments',
    'instagram_manage_insights',
    'pages_show_list',
    'pages_read_engagement',
    'business_management',
    'pages_read_user_content',
    'ads_read',
    'read_insights',
  ].join(',')

  const params = new URLSearchParams({
    client_id: clientId,
    display: 'page',
    extras: JSON.stringify({
      setup: {
        channel: 'IG_API_ONBOARDING',
      },
    }),
    redirect_uri: redirectUri,
    response_type: 'token', // Returns tokens directly in URL fragment
    scope: scopes,
    state,
  })

  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
}

// Parse tokens from URL fragment after Business Login redirect
export function parseBusinessLoginTokens(fragment: string): {
  accessToken: string
  longLivedToken: string
  expiresIn: number
  dataAccessExpirationTime: number
  state: string | null
} | null {
  try {
    // Fragment format: #access_token=...&data_access_expiration_time=...&expires_in=...&long_lived_token=...&state=...
    const params = new URLSearchParams(fragment.replace('#', ''))
    
    const accessToken = params.get('access_token')
    const longLivedToken = params.get('long_lived_token')
    const expiresIn = params.get('expires_in')
    const dataAccessExpirationTime = params.get('data_access_expiration_time')
    const state = params.get('state')

    if (!accessToken || !longLivedToken || !expiresIn) {
      return null
    }

    return {
      accessToken,
      longLivedToken,
      expiresIn: parseInt(expiresIn),
      dataAccessExpirationTime: dataAccessExpirationTime 
        ? parseInt(dataAccessExpirationTime) 
        : 0,
      state,
    }
  } catch (error) {
    console.error('Error parsing Business Login tokens:', error)
    return null
  }
}

// Check if user canceled the login flow
export function isBusinessLoginCanceled(fragment: string): boolean {
  return fragment.includes('error=access_denied')
}
