'use client'
import { useRouter, useSearchParams } from 'next/navigation'

type Category = {
  _id: string
  title?: string | null
  slug?: string | null
  postCount?: number | null
}

export default function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: Category[]
  activeSlug?: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSelect(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (slug) {
      params.set('category', slug)
    } else {
      params.delete('category')
    }
    params.delete('page')
    router.push(`/blog?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleSelect(null)}
        className={`px-4 py-2 rounded-full text-sm transition ${
          !activeSlug ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
        }`}
      >
        All Posts
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => handleSelect(cat.slug || null)}
          className={`px-4 py-2 rounded-full text-sm transition ${
            activeSlug === cat.slug ? 'bg-gray-900 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {cat.title}
          {cat.postCount != null && (
            <span className="ml-1 text-xs opacity-60">({cat.postCount})</span>
          )}
        </button>
      ))}
    </div>
  )
}
