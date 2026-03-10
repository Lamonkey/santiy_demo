import { MetadataRoute } from 'next'
import { client } from '@/sanity/lib/client'
import { SITEMAP_QUERY } from '@/sanity/lib/queries'
import type { SITEMAP_QUERYResult } from '@/../sanity.types'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000'

  try {
    const paths: SITEMAP_QUERYResult = await client.fetch(SITEMAP_QUERY)
    if (!paths) return []

    return [
      { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1 },
      { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
      ...paths.map((path) => ({
        url: new URL(path.href!, baseUrl).toString(),
        lastModified: new Date(path._updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ]
  } catch (error) {
    console.error('Sitemap generation failed:', error)
    return []
  }
}
