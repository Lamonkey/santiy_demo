import Link from 'next/link'

export default function Pagination({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null

  return (
    <nav className="flex items-center justify-center gap-2 mt-12">
      {current > 1 && (
        <Link
          href={`?page=${current - 1}`}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          ← Previous
        </Link>
      )}
      {Array.from({ length: total }, (_, i) => i + 1).map((page) => (
        <Link
          key={page}
          href={`?page=${page}`}
          className={`px-4 py-2 border rounded-lg transition ${
            page === current
              ? 'bg-blue-600 text-white border-blue-600'
              : 'hover:bg-gray-50'
          }`}
        >
          {page}
        </Link>
      ))}
      {current < total && (
        <Link
          href={`?page=${current + 1}`}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
        >
          Next →
        </Link>
      )}
    </nav>
  )
}
