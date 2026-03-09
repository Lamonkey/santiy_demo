'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function LanguageSwitcher() {
  const pathname = usePathname()
  const isZh = pathname.startsWith('/zh')

  const targetPath = isZh
    ? pathname.replace(/^\/zh/, '') || '/'
    : `/zh${pathname}`

  return (
    <Link
      href={targetPath}
      className="text-sm px-3 py-1.5 border border-gray-200 rounded-full text-gray-600 hover:border-gray-400 hover:text-gray-900 transition"
    >
      {isZh ? 'EN' : '中文'}
    </Link>
  )
}
