import axios from 'axios'
import type { InstagramMedia, InstagramInsights, MetaOAuthTokenResponse } from './types'

const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

export class MetaClient {
  private accessToken: string

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // Exchange short-lived token for long-lived token (60 days)
  static async exchangeForLongLivedToken(shortLivedToken: string): Promise<MetaOAuthTokenResponse> {
    const response = await axios.get(`${META_GRAPH_URL}/oauth/access_token`, {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        fb_exchange_token: shortLivedToken,
      },
    })
    return response.data
  }

  // Get Instagram Business Account ID from Facebook Page
  async getInstagramBusinessAccountId(pageId: string): Promise<string> {
    const response = await axios.get(`${META_GRAPH_URL}/${pageId}`, {
      params: {
        fields: 'instagram_business_account',
        access_token: this.accessToken,
      },
    })
    return response.data.instagram_business_account?.id
  }

  // Get user's Instagram Business account ID from a Facebook page
  async getInstagramBusinessAccount(pageId: string): Promise<string> {
    const response = await axios.get(
      `https://graph.facebook.com/v21.0/${pageId}`,
      {
        params: {
          access_token: this.accessToken,
          fields: 'instagram_business_account',
        },
      }
    )
    return response.data.instagram_business_account?.id
  }

  // Get user's Facebook Pages
  async getPages(): Promise<Array<{ id: string; name: string; access_token?: string }>> {
    const response = await axios.get(`${META_GRAPH_URL}/me/accounts`, {
      params: {
        access_token: this.accessToken,
        fields: 'id,name,access_token',
      },
    })
    return response.data.data || []
  }

  // Get user's Instagram media (posts)
  async getMedia(igUserId: string, limit = 25): Promise<InstagramMedia[]> {
    const response = await axios.get(`${META_GRAPH_URL}/${igUserId}/media`, {
      params: {
        fields: 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp',
        limit,
        access_token: this.accessToken,
      },
    })
    return response.data.data || []
  }

  // Get insights for a specific media item
  async getMediaInsights(mediaId: string): Promise<InstagramInsights> {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${mediaId}/insights`, {
        params: {
          metric: 'reach,likes,comments,shares,saves,plays,total_interactions',
          access_token: this.accessToken,
        },
      })
      
      const insights: InstagramInsights = {}
      response.data.data?.forEach((item: any) => {
        insights[item.name as keyof InstagramInsights] = item.values?.[0]?.value || 0
      })
      
      return insights
    } catch (error) {
      // Some media types don't support insights
      console.error('Error fetching insights:', error)
      return {}
    }
  }

  // Get comments for a media item
  async getMediaComments(mediaId: string, limit = 50): Promise<Array<{ id: string; text: string; username: string; timestamp: string }>> {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${mediaId}/comments`, {
        params: {
          fields: 'id,text,username,timestamp',
          limit,
          access_token: this.accessToken,
        },
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching comments:', error)
      return []
    }
  }

  // Get short-lived media URL (for ephemeral download)
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${mediaId}`, {
        params: {
          fields: 'media_url',
          access_token: this.accessToken,
        },
      })
      return response.data.media_url || null
    } catch (error) {
      console.error('Error fetching media URL:', error)
      return null
    }
  }

  // Get Facebook Page posts
  async getFacebookPagePosts(pageId: string, limit = 25) {
    const response = await axios.get(`${META_GRAPH_URL}/${pageId}/posts`, {
      params: {
        access_token: this.accessToken,
        fields: 'id,message,created_time,full_picture,permalink_url,shares,reactions.summary(true),comments.summary(true)',
        limit,
      },
    })
    return response.data.data || []
  }

  // Get Facebook Page insights
  async getFacebookPageInsights(pageId: string, metrics = ['page_impressions', 'page_engaged_users', 'page_fans']) {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${pageId}/insights`, {
        params: {
          access_token: this.accessToken,
          metric: metrics.join(','),
          period: 'day',
        },
      })
      return response.data.data || []
    } catch (error) {
      console.error('Error fetching page insights:', error)
      return []
    }
  }

  // Get ad accounts
  async getAdAccounts() {
    const response = await axios.get(`${META_GRAPH_URL}/me/adaccounts`, {
      params: {
        access_token: this.accessToken,
        fields: 'id,name,account_status,currency,timezone_name,amount_spent',
      },
    })
    return response.data.data || []
  }

  // Get campaigns for an ad account
  async getCampaigns(adAccountId: string, limit = 25) {
    const response = await axios.get(`${META_GRAPH_URL}/${adAccountId}/campaigns`, {
      params: {
        access_token: this.accessToken,
        fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time',
        limit,
      },
    })
    return response.data.data || []
  }

  // Get campaign insights
  async getCampaignInsights(campaignId: string) {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${campaignId}/insights`, {
        params: {
          access_token: this.accessToken,
          fields: 'impressions,reach,clicks,spend,cpc,cpm,ctr,conversions',
        },
      })
      return response.data.data?.[0] || null
    } catch (error) {
      console.error('Error fetching campaign insights:', error)
      return null
    }
  }

  // Get Threads posts (if available)
  async getThreadsPosts(threadsUserId: string, limit = 25) {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${threadsUserId}/threads`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,text,timestamp,permalink,media_type,media_url,thumbnail_url,is_quote_post',
          limit,
        },
      })
      return response.data.data || []
    } catch (error) {
      // Threads may not be available
      return []
    }
  }

  // Get Threads insights
  async getThreadsInsights(mediaId: string) {
    try {
      const response = await axios.get(`${META_GRAPH_URL}/${mediaId}/insights`, {
        params: {
          access_token: this.accessToken,
          metric: 'views,likes,replies,reposts,quotes',
        },
      })
      return response.data.data || []
    } catch (error) {
      return []
    }
  }
}

// OAuth helper functions
export function getMetaAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.META_APP_ID!,
    redirect_uri: process.env.META_REDIRECT_URL!,
    state,
    scope: 'instagram_basic,instagram_manage_insights,pages_read_engagement,pages_show_list,pages_read_user_content,ads_read,business_management,read_insights,public_profile',
  })
  return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`
}

export async function exchangeCodeForToken(code: string): Promise<MetaOAuthTokenResponse> {
  const response = await axios.get(`${META_GRAPH_URL}/oauth/access_token`, {
    params: {
      client_id: process.env.META_APP_ID!,
      client_secret: process.env.META_APP_SECRET!,
      redirect_uri: process.env.META_REDIRECT_URL!,
      code,
    },
  })
  return response.data
}
