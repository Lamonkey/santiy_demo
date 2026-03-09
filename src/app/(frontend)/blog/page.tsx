import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import {
  POSTS_LIST_QUERY,
  POSTS_BY_CATEGORY_QUERY,
  POSTS_COUNT_QUERY,
  CATEGORIES_QUERY,
} from '@/sanity/lib/queries'
import BlogCard from '@/components/BlogCard'
import Pagination from '@/components/Pagination'
import CategoryFilter from '@/components/CategoryFilter'
import Link from 'next/link'

const POSTS_PER_PAGE = 9

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}): Promise<Metadata> {
  const { page: pageParam, category: categorySlug } = await searchParams
  const params = new URLSearchParams()
  if (categorySlug) params.set('category', categorySlug)
  if (pageParam && pageParam !== '1') params.set('page', pageParam)
  const qs = params.toString()
  return {
    title: 'Blog',
    description: 'Thoughts, tutorials and insights',
    alternates: { canonical: qs ? `/blog?${qs}` : '/blog' },
    openGraph: { type: 'website' },
  }
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { page: pageParam, category: categorySlug } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1'))
  const start = (page - 1) * POSTS_PER_PAGE
  const end = start + POSTS_PER_PAGE

  const [{ data: posts }, { data: total }, { data: categories }] = await Promise.all([
    categorySlug
      ? sanityFetch({ query: POSTS_BY_CATEGORY_QUERY, params: { categorySlug, start, end } })
      : sanityFetch({ query: POSTS_LIST_QUERY, params: { start, end } }),
    sanityFetch({ query: POSTS_COUNT_QUERY }),
    sanityFetch({ query: CATEGORIES_QUERY }),
  ])

  const totalPages = Math.ceil((total ?? 0) / POSTS_PER_PAGE)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Blog</h1>
      <CategoryFilter categories={categories ?? []} activeSlug={categorySlug} />

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-4">✍️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No posts yet</h2>
          <p className="text-gray-400 mb-6">
            {categorySlug
              ? 'No posts in this category yet.'
              : 'Be the first to publish an article.'}
          </p>
          <Link
            href="/write"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            Write the first article →
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} />
      )}
    </div>
  )
}
