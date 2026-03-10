import type { Article, WithContext } from 'schema-dts'
import { urlFor } from '@/sanity/lib/image'

type Post = {
  _id: string
  title?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  mainImage?: { asset?: object | null } | null
  author?: { name?: string | null } | null
}

export default function BlogJsonLd({ post }: { post: Post }) {
  const data: WithContext<Article> = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title || '',
    description: post.excerpt || undefined,
    datePublished: post.publishedAt || undefined,
    ...(post.mainImage?.asset && {
      image: urlFor(post.mainImage).width(1200).height(630).url(),
    }),
    author: post.author?.name
      ? { '@type': 'Person', name: post.author.name }
      : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
