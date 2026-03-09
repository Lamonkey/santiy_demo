import Link from 'next/link'
import LanguageSwitcher from '@/components/LanguageSwitcher'

type Settings = {
  siteName?: string | null
  nav?: Array<{
    _key?: string
    label?: string | null
    linkType?: string | null
    externalUrl?: string | null
    internalRef?: { _type?: string; slug?: { current?: string } } | null
  }> | null
} | null

function getNavHref(item: NonNullable<NonNullable<Settings>['nav']>[number]): string {
  if (item.linkType === 'external') return item.externalUrl || '#'
  if (item.internalRef?.slug?.current) return `/blog/${item.internalRef.slug.current}`
  return '#'
}

export default function Nav({ settings }: { settings: Settings }) {
  return (
    <nav className="border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl">
          {settings?.siteName || 'Portfolio'}
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/blog" className="text-gray-600 hover:text-gray-900 transition text-sm">
            Blog
          </Link>
          <LanguageSwitcher />
          {settings?.nav?.map((item, i) => (
            <a
              key={i}
              href={getNavHref(item)}
              className="text-gray-600 hover:text-gray-900 transition text-sm"
            >
              {item.label}
            </a>
          ))}
          <Link href="/studio" className="text-gray-600 hover:text-gray-900 transition text-sm">
            Admin
          </Link>
          <Link
            href="/write"
            className="text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            Write Article
          </Link>
        </div>
      </div>
    </nav>
  )
}
