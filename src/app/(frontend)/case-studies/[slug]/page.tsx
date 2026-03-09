import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { sanityFetch } from '@/sanity/lib/live'
import { CASE_STUDY_QUERY, CASE_STUDY_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { client } from '@/sanity/lib/client'
import PortableTextContent from '@/components/PortableTextContent'
import Image from 'next/image'

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await client.withConfig({ useCdn: false }).fetch(CASE_STUDY_SLUGS_QUERY)
  return slugs ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const { data: cs } = await sanityFetch({ query: CASE_STUDY_QUERY, params: resolvedParams, stega: false })
  if (!cs) return {}
  const ogImage = cs.seo?.image
    ? urlFor(cs.seo.image).width(1200).height(630).url()
    : cs.coverImage?.asset
      ? urlFor(cs.coverImage).width(1200).height(630).url()
      : undefined
  return {
    title: cs.seo?.title || cs.title,
    description: cs.seo?.description || cs.excerpt || undefined,
    robots: cs.seo?.noIndex ? 'noindex' : undefined,
    alternates: { canonical: `/case-studies/${resolvedParams.slug}` },
    openGraph: {
      type: 'article',
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const resolvedParams = await params
  const { data: cs } = await sanityFetch({ query: CASE_STUDY_QUERY, params: resolvedParams })
  if (!cs) notFound()

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      {cs.coverImage?.asset && (
        <div className="relative aspect-video mb-8 rounded-xl overflow-hidden">
          <Image
            src={urlFor(cs.coverImage).width(1200).height(675).url()}
            alt={cs.coverImage.alt || cs.title}
            fill
            className="object-cover"
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{cs.title}</h1>
        {cs.excerpt && <p className="text-xl text-gray-600 mb-6">{cs.excerpt}</p>}

        <dl className="grid grid-cols-2 gap-4 text-sm">
          {cs.client && (
            <>
              <dt className="text-gray-500">Client</dt>
              <dd className="font-medium">{cs.client}</dd>
            </>
          )}
          {cs.industry && (
            <>
              <dt className="text-gray-500">Industry</dt>
              <dd className="font-medium">{cs.industry}</dd>
            </>
          )}
          {cs.publishedAt && (
            <>
              <dt className="text-gray-500">Year</dt>
              <dd className="font-medium">{new Date(cs.publishedAt).getFullYear()}</dd>
            </>
          )}
          {cs.projectUrl && (
            <>
              <dt className="text-gray-500">Live URL</dt>
              <dd><a href={cs.projectUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">View Project</a></dd>
            </>
          )}
        </dl>

        {cs.technologies && cs.technologies.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {cs.technologies.map((tech: string) => (
              <span key={tech} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">{tech}</span>
            ))}
          </div>
        )}
      </header>

      {cs.body && <PortableTextContent value={cs.body} documentId={cs._id} />}
    </article>
  )
}
