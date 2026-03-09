import { client } from '@/sanity/lib/client'
import { LANDING_PAGE_QUERY } from '@/sanity/lib/queries'
import { redirect } from 'next/navigation'
import PageBuilder from '@/components/PageBuilder'

export const revalidate = 60

const fetchClient = client.withConfig({ useCdn: false, token: process.env.SANITY_API_READ_TOKEN })

const LANDING_PAGE_ZH_QUERY = `*[_id == "landingPageZh"][0]{
  title,
  pageBuilder[]{..., ctas[]{..., internalRef->{_type, slug}}, items[]{...}},
  seo { title, description, noIndex }
}`

export default async function ZhHomePage() {
  // Try Chinese version first, fall back to English
  const page = await fetchClient.fetch(LANDING_PAGE_ZH_QUERY)
    ?? await fetchClient.fetch(LANDING_PAGE_QUERY)

  if (!page) redirect('/zh/blog')

  const documentId = page._id === 'landingPageZh' ? 'landingPageZh' : 'landingPage'

  return <PageBuilder blocks={page.pageBuilder ?? []} documentId={documentId} />
}
