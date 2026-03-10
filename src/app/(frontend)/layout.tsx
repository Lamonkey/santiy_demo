import { SanityLive } from '@/sanity/lib/live'
import { draftMode } from 'next/headers'
import VisualEditing from 'next-sanity/visual-editing/client-component'
import { SETTINGS_QUERY } from '@/sanity/lib/queries'
import { client } from '@/sanity/lib/client'
import Nav from '@/components/Nav'

const fetchClient = client.withConfig({ useCdn: false, token: process.env.SANITY_API_READ_TOKEN })

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const settings = await fetchClient.fetch(SETTINGS_QUERY, {}, { next: { tags: ['settings'] } })
  const isDraft = (await draftMode()).isEnabled

  return (
    <>
      <Nav settings={settings} />
      <main>{children}</main>
      <SanityLive />
      {isDraft && <VisualEditing />}
    </>
  )
}
