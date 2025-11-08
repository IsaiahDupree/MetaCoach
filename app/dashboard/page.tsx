'use client'

import { useEffect, useState } from 'react'
import { formatNumber } from '@/lib/utils'

interface Page {
  id: string
  name: string
  instagram_business_account: {
    id: string
  }
}

interface MediaItem {
  id: string
  caption?: string
  media_type: string
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp: string
  insights?: {
    reach?: number
    likes?: number
    comments?: number
    shares?: number
    saves?: number
  }
}

export default function DashboardPage() {
  const [pages, setPages] = useState<Page[]>([])
  const [selectedPage, setSelectedPage] = useState<Page | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch user's Facebook pages
  useEffect(() => {
    async function fetchPages() {
      try {
        const res = await fetch('/api/meta/me')
        if (!res.ok) throw new Error('Failed to fetch pages')
        const data = await res.json()
        setPages(data.pages)
        if (data.pages.length === 1) {
          setSelectedPage(data.pages[0])
        }
      } catch (err: any) {
        setError(err.message)
      }
    }
    fetchPages()
  }, [])

  // Fetch media when page is selected
  useEffect(() => {
    if (!selectedPage) return

    async function fetchMedia(page: Page) {
      setLoading(true)
      setError(null)
      try {
        const igUserId = page.instagram_business_account.id
        const res = await fetch(`/api/meta/media?ig_user_id=${igUserId}`)
        if (!res.ok) throw new Error('Failed to fetch media')
        const data = await res.json()
        setMedia(data.media)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchMedia(selectedPage)
  }, [selectedPage])

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded">
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Instagram Analytics</h1>
          <p className="text-gray-600 mt-2">
            View your recent posts and engagement metrics
          </p>
        </div>

        {/* Page Selector */}
        {pages.length > 1 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Facebook Page
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={selectedPage?.id || ''}
              onChange={(e) => {
                const page = pages.find((p) => p.id === e.target.value)
                setSelectedPage(page || null)
              }}
            >
              <option value="">-- Select a page --</option>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading posts...</p>
          </div>
        )}

        {/* Media Grid */}
        {!loading && selectedPage && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow overflow-hidden"
              >
                {/* Thumbnail */}
                {(item.thumbnail_url || item.media_url) && (
                  <div className="aspect-square bg-gray-100 relative">
                    <img
                      src={item.thumbnail_url || item.media_url}
                      alt={item.caption || 'Instagram post'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {item.media_type}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="p-4">
                  {/* Caption */}
                  {item.caption && (
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {item.caption}
                    </p>
                  )}

                  {/* Metrics */}
                  {item.insights && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.insights.reach !== undefined && (
                        <div>
                          <span className="text-gray-500">Reach:</span>{' '}
                          <span className="font-semibold">
                            {formatNumber(item.insights.reach)}
                          </span>
                        </div>
                      )}
                      {item.insights.likes !== undefined && (
                        <div>
                          <span className="text-gray-500">Likes:</span>{' '}
                          <span className="font-semibold">
                            {formatNumber(item.insights.likes)}
                          </span>
                        </div>
                      )}
                      {item.insights.comments !== undefined && (
                        <div>
                          <span className="text-gray-500">Comments:</span>{' '}
                          <span className="font-semibold">
                            {formatNumber(item.insights.comments)}
                          </span>
                        </div>
                      )}
                      {item.insights.saves !== undefined && (
                        <div>
                          <span className="text-gray-500">Saves:</span>{' '}
                          <span className="font-semibold">
                            {formatNumber(item.insights.saves)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <div className="mt-3 pt-3 border-t text-xs text-gray-500">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </div>

                  {/* Link */}
                  {item.permalink && (
                    <a
                      href={item.permalink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 block text-sm text-blue-600 hover:text-blue-800"
                    >
                      View on Instagram →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && selectedPage && media.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No posts found</p>
          </div>
        )}

        {/* No Page Selected */}
        {!loading && !selectedPage && pages.length > 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">Please select a Facebook page</p>
          </div>
        )}
      </div>
    </div>
  )
}
