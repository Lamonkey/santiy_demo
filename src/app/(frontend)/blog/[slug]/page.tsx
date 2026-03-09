import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { POST_QUERY, POST_SLUGS_QUERY } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { client } from '@/sanity/lib/client'
import PortableTextContent from '@/components/PortableTextContent'
import BlogJsonLd from '@/components/BlogJsonLd'
import Image from 'next/image'

type Props = { params: Promise<{ slug: string }> }

export const revalidate = 60

const fetchClient = client.withConfig({
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})

export async function generateStaticParams() {
  const slugs = await fetchClient.fetch(POST_SLUGS_QUERY)
  return slugs ?? []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params
  const post = await fetchClient.fetch(POST_QUERY, resolvedParams)
  if (!post) return {}
  const ogImage = post.seo?.image
    ? urlFor(post.seo.image).width(1200).height(630).url()
    : post.mainImage?.asset
      ? urlFor(post.mainImage).width(1200).height(630).url()
      : undefined
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt || undefined,
    robots: post.seo?.noIndex ? 'noindex' : undefined,
    alternates: {
      canonical: `/blog/${resolvedParams.slug}`,
      languages: {
        'en': `/blog/${resolvedParams.slug}`,
        'zh': `/zh/blog/${resolvedParams.slug}`,
      },
    },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      authors: post.author?.name ? [post.author.name] : undefined,
      images: ogImage ? [{ url: ogImage, width: 1200, height: 630 }] : undefined,
    },
  }
}

export default async function PostPage({ params }: Props) {
  const resolvedParams = await params
  const post = await fetchClient.fetch(POST_QUERY, resolvedParams, { next: { tags: [`post:${resolvedParams.slug}`, 'post'] } })
  if (!post) notFound()

  return (
    <article className="max-w-3xl mx-auto px-4 py-12">
      {post.mainImage?.asset && (
        <div className="relative aspect-video mb-8 rounded-xl overflow-hidden">
          <Image
            src={urlFor(post.mainImage).width(1200).height(675).url()}
            alt={post.mainImage.alt || post.title}
            fill
            className="object-cover"
            placeholder={post.mainImage.asset.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={post.mainImage.asset.metadata?.lqip || undefined}
          />
        </div>
      )}

      <header className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
          <div className="flex gap-2 flex-wrap">
            {post.categories?.map((cat: { _id: string; title: string; slug: string }) => (
              <a
                key={cat._id}
                href={`/blog?category=${cat.slug}`}
                className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded-full"
              >
                {cat.title}
              </a>
            ))}
          </div>
          {post.translation?.slug && (
            <a
              href={`/blog/${post.translation.slug}`}
              className="text-sm px-3 py-1.5 border border-gray-300 rounded-full text-gray-600 hover:border-gray-500 hover:text-gray-900 transition"
            >
              {post.language === 'zh' ? '🇺🇸 English' : '🇨🇳 中文'}
            </a>
          )}
        </div>
        <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
        {post.excerpt && <p className="text-xl text-gray-600">{post.excerpt}</p>}
        {post.author && (
          <div className="flex items-center gap-3 mt-4">
            {post.author.photo?.asset && (
              <Image
                src={urlFor(post.author.photo).width(48).height(48).url()}
                alt={post.author.name || ''}
                width={48}
                height={48}
                className="rounded-full"
              />
            )}
            <div>
              <p className="font-semibold">{post.author.name}</p>
              {post.author.role && <p className="text-sm text-gray-500">{post.author.role}</p>}
            </div>
            {post.publishedAt && (
              <time className="ml-auto text-sm text-gray-500">
                {new Date(post.publishedAt).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              </time>
            )}
          </div>
        )}
      </header>

      {post.body && <PortableTextContent value={post.body} documentId={post._id} />}

      {post.aiSummary && (
        <aside className="mt-12 p-6 bg-gray-50 rounded-xl border">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-2">AI Summary</h2>
          <p className="text-gray-700">{post.aiSummary}</p>
        </aside>
      )}

      <BlogJsonLd post={post} />
    </article>
  )
}
