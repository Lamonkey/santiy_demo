import type { Metadata } from 'next'
import './globals.css'
import { SanityLive } from '@/sanity/lib/live'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: { default: 'Portfolio', template: '%s | Portfolio' },
  description: 'A headless CMS-powered content platform',
  openGraph: {
    siteName: 'Portfolio',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <SanityLive />
      </body>
    </html>
  )
}
