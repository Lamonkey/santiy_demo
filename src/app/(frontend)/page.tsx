import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import { LANDING_PAGE_QUERY } from '@/sanity/lib/queries'
import { redirect } from 'next/navigation'
import PageBuilder from '@/components/PageBuilder'

export const revalidate = 60

const fetchClient = client.withConfig({ useCdn: false, token: process.env.SANITY_API_READ_TOKEN })

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchClient.fetch(LANDING_PAGE_QUERY)
  if (!page) return {}
  return {
    title: page.seo?.title || undefined,
    description: page.seo?.description || undefined,
    robots: page.seo?.noIndex ? 'noindex' : undefined,
    alternates: { canonical: '/' },
    openGraph: { type: 'website' },
  }
}

export default async function HomePage() {
  const page = await fetchClient.fetch(LANDING_PAGE_QUERY, {}, { next: { tags: ['landingPage'] } })
  if (!page) redirect('/blog')

  return <PageBuilder blocks={page.pageBuilder ?? []} documentId="landingPage" />
}
