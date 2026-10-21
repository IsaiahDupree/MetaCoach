import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    // Let crawlers fetch app routes so their page-level noindex metadata is seen.
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/'] }],
    sitemap: 'https://matrixloop.app/sitemap.xml',
    host: 'https://matrixloop.app',
  }
}
