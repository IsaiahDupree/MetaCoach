import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

// Get user's Facebook pages and Instagram Business accounts
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('meta_access_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get user's Facebook pages
    const pagesResponse = await axios.get(
      'https://graph.facebook.com/v21.0/me/accounts',
      {
        params: {
          access_token: token,
          fields: 'id,name,instagram_business_account',
        },
      }
    )

    const pages = pagesResponse.data.data || []
    
    // Find pages with Instagram Business accounts
    const pagesWithIG = pages.filter((page: any) => page.instagram_business_account)

    return NextResponse.json({
      pages: pagesWithIG,
      total: pagesWithIG.length,
    })
  } catch (error: any) {
    console.error('Error fetching pages:', error.response?.data || error.message)
    return NextResponse.json(
      { error: 'Failed to fetch pages', details: error.response?.data },
      { status: 500 }
    )
  }
}
