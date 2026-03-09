import { SanityLive } from '@/sanity/lib/live'
import { draftMode } from 'next/headers'
import { VisualEditing } from 'next-sanity/visual-editing/client-component'
import { SETTINGS_QUERY } from '@/sanity/lib/queries'
import { sanityFetch } from '@/sanity/lib/live'
import Nav from '@/components/Nav'

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const { data: settings } = await sanityFetch({ query: SETTINGS_QUERY })
  const isDraft = (await draftMode()).isEnabled

  return (
    <>
      <Nav settings={settings} />
      <main>{children}</main>
      <SanityLive />
      {isDraft && <VisualEditing studioUrl="/studio" />}
    </>
  )
}
