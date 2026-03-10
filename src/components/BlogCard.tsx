import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

type Post = {
  _id: string
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  publishedAt?: string | null
  featured?: boolean | null
  mainImage?: { asset?: { url?: string | null; metadata?: { lqip?: string | null } | null } | null; alt?: string | null } | null
  author?: { name?: string | null; photo?: { asset?: { url?: string | null } | null } | null } | null
  categories?: Array<{ _id: string; title?: string | null; slug?: string | null }> | null
}

export default function BlogCard({ post, basePath = '/blog' }: { post: Post; basePath?: string }) {
  return (
    <article className="group rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 transition">
      <Link href={`${basePath}/${post.slug}`}>
        {post.mainImage?.asset && (
          <div className="relative aspect-video">
            <Image
              src={urlFor(post.mainImage).width(600).height(338).url()}
              alt={post.mainImage.alt || post.title || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              placeholder={post.mainImage.asset.metadata?.lqip ? 'blur' : 'empty'}
              blurDataURL={post.mainImage.asset.metadata?.lqip || undefined}
            />
          </div>
        )}
        <div className="p-5">
          <div className="flex gap-2 mb-3 flex-wrap">
            {post.categories?.map((cat) => (
              <span key={cat._id} className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                {cat.title}
              </span>
            ))}
          </div>
          <h2 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition">{post.title}</h2>
          {post.excerpt && <p className="text-gray-600 text-sm line-clamp-2">{post.excerpt}</p>}
          <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
            <span>{post.author?.name}</span>
            {post.publishedAt && (
              <time>{new Date(post.publishedAt).toLocaleDateString()}</time>
            )}
          </div>
        </div>
      </Link>
    </article>
  )
}
