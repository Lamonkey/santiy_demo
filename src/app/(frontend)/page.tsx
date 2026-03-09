import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { LANDING_PAGE_QUERY } from '@/sanity/lib/queries'
import { notFound } from 'next/navigation'
import PageBuilder from '@/components/PageBuilder'

const getLandingPage = (stega = true) =>
  sanityFetch({ query: LANDING_PAGE_QUERY, stega })

export async function generateMetadata(): Promise<Metadata> {
  const { data: page } = await getLandingPage(false)
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
  const { data: page } = await getLandingPage()
  if (!page) notFound()

  return <PageBuilder blocks={page.pageBuilder ?? []} documentId="landingPage" />
}
