import axios from 'axios'
import type { InstagramMedia } from './types'

/**
 * Download media from Instagram
 * Works with instagram_basic permission - no special permissions needed!
 */
export async function downloadMedia(mediaUrl: string): Promise<Buffer> {
  try {
    const response = await axios.get(mediaUrl, {
      responseType: 'arraybuffer',
      timeout: 60000, // 60 second timeout for large videos
    })
    return Buffer.from(response.data)
  } catch (error: any) {
    console.error('Error downloading media:', error.message)
    throw new Error(`Failed to download media: ${error.message}`)
  }
}

/**
 * Download media with metadata
 */
export async function downloadMediaWithMetadata(
  media: InstagramMedia
): Promise<{ buffer: Buffer; metadata: InstagramMedia }> {
  const url = media.media_type === 'VIDEO' 
    ? media.media_url 
    : media.media_url

  if (!url) {
    throw new Error('No media URL available (may be copyrighted content)')
  }

  const buffer = await downloadMedia(url)

  return {
    buffer,
    metadata: media,
  }
}

/**
 * Check if media is downloadable (not copyrighted/flagged)
 */
export function isMediaDownloadable(media: InstagramMedia): boolean {
  return Boolean(media.media_url)
}

/**
 * Get appropriate URL for media type
 */
export function getMediaDownloadUrl(media: InstagramMedia): string | null {
  if (!media.media_url) {
    return null
  }

  // For videos, prefer media_url over thumbnail
  if (media.media_type === 'VIDEO') {
    return media.media_url
  }

  // For images and carousels, use media_url
  return media.media_url
}

/**
 * Get thumbnail URL for video preview
 */
export function getThumbnailUrl(media: InstagramMedia): string | null {
  if (media.media_type === 'VIDEO' && media.thumbnail_url) {
    return media.thumbnail_url
  }
  return media.media_url || null
}

/**
 * Batch download multiple media items
 * Downloads in parallel with concurrency limit
 */
export async function downloadMediaBatch(
  mediaItems: InstagramMedia[],
  concurrency: number = 3
): Promise<Array<{ media: InstagramMedia; buffer: Buffer | null; error?: string }>> {
  const results: Array<{ media: InstagramMedia; buffer: Buffer | null; error?: string }> = []

  // Process in batches to avoid overwhelming the server
  for (let i = 0; i < mediaItems.length; i += concurrency) {
    const batch = mediaItems.slice(i, i + concurrency)
    
    const batchResults = await Promise.allSettled(
      batch.map(async (media) => {
        if (!isMediaDownloadable(media)) {
          return {
            media,
            buffer: null,
            error: 'Media not downloadable (copyrighted or no URL)',
          }
        }

        try {
          const { buffer } = await downloadMediaWithMetadata(media)
          return { media, buffer }
        } catch (error: any) {
          return {
            media,
            buffer: null,
            error: error.message,
          }
        }
      })
    )

    // Collect results
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        results.push({
          media: batch[results.length % batch.length],
          buffer: null,
          error: result.reason?.message || 'Unknown error',
        })
      }
    })
  }

  return results
}

/**
 * Estimate download size from media metadata
 * Note: Instagram doesn't always provide file size, this is an estimate
 */
export function estimateMediaSize(media: InstagramMedia): { estimated: true; sizeKB: number } {
  // Rough estimates based on media type
  if (media.media_type === 'VIDEO') {
    // Instagram videos are typically 5-50MB
    return { estimated: true, sizeKB: 15000 } // ~15MB average
  } else if (media.media_type === 'IMAGE') {
    // Instagram images are typically 100KB-2MB
    return { estimated: true, sizeKB: 500 } // ~500KB average
  } else {
    // Carousel albums vary
    return { estimated: true, sizeKB: 2000 } // ~2MB average
  }
}

/**
 * Check if media should be downloaded based on criteria
 */
export function shouldDownloadMedia(
  media: InstagramMedia,
  options: {
    onlyVideos?: boolean
    onlyImages?: boolean
    minTimestamp?: Date
    maxTimestamp?: Date
  } = {}
): boolean {
  // Check if downloadable
  if (!isMediaDownloadable(media)) {
    return false
  }

  // Filter by media type
  if (options.onlyVideos && media.media_type !== 'VIDEO') {
    return false
  }
  if (options.onlyImages && media.media_type !== 'IMAGE') {
    return false
  }

  // Filter by timestamp
  if (media.timestamp) {
    const mediaDate = new Date(media.timestamp)
    
    if (options.minTimestamp && mediaDate < options.minTimestamp) {
      return false
    }
    if (options.maxTimestamp && mediaDate > options.maxTimestamp) {
      return false
    }
  }

  return true
}
