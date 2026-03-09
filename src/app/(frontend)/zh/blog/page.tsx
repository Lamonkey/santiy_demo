import type { Metadata } from 'next'
import { client } from '@/sanity/lib/client'
import {
  POSTS_LIST_ZH_QUERY,
  POSTS_BY_CATEGORY_ZH_QUERY,
  POSTS_COUNT_ZH_QUERY,
  CATEGORIES_QUERY,
} from '@/sanity/lib/queries'
import BlogCard from '@/components/BlogCard'
import Pagination from '@/components/Pagination'
import CategoryFilter from '@/components/CategoryFilter'
import Link from 'next/link'

const POSTS_PER_PAGE = 9

const fetchClient = client.withConfig({
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})

export const revalidate = 60

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
  const zhUrl = qs ? `/zh/blog?${qs}` : '/zh/blog'
  const enUrl = qs ? `/blog?${qs}` : '/blog'
  return {
    title: '博客',
    description: '文章、教程与见解',
    alternates: {
      canonical: zhUrl,
      languages: { 'en': enUrl, 'zh': zhUrl },
    },
    openGraph: { type: 'website' },
  }
}

export default async function ZhBlogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>
}) {
  const { page: pageParam, category: categorySlug } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1'))
  const start = (page - 1) * POSTS_PER_PAGE
  const end = start + POSTS_PER_PAGE

  const [posts, total, categories] = await Promise.all([
    fetchClient.fetch(
      categorySlug ? POSTS_BY_CATEGORY_ZH_QUERY : POSTS_LIST_ZH_QUERY,
      categorySlug ? { categorySlug, start, end } : { start, end },
    ),
    fetchClient.fetch(POSTS_COUNT_ZH_QUERY),
    fetchClient.fetch(CATEGORIES_QUERY),
  ])

  const totalPages = Math.ceil((total ?? 0) / POSTS_PER_PAGE)

  // Prefix slugs with /zh/blog for Chinese links
  const postsWithZhLinks = posts?.map((post: any) => ({ ...post })) ?? []

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">博客</h1>
      <CategoryFilter categories={categories ?? []} activeSlug={categorySlug} basePath="/zh/blog" />

      {postsWithZhLinks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
          {postsWithZhLinks.map((post: any) => (
            <BlogCard key={post._id} post={post} basePath="/zh/blog" />
          ))}
        </div>
      ) : (
        <div className="mt-16 text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-4">✍️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">暂无文章</h2>
          <p className="text-gray-400 mb-6">
            {categorySlug ? '此分类暂无文章。' : '尚无已发布的文章。'}
          </p>
          <Link
            href="/write"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
          >
            撰写第一篇文章 →
          </Link>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination current={page} total={totalPages} basePath="/zh/blog" />
      )}
    </div>
  )
}
