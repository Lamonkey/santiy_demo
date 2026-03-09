import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/studio')) return NextResponse.next()

  const authHeader = req.headers.get('authorization')
  const password = process.env.STUDIO_ACCESS_KEY

  if (!password) {
    // No password set — block access entirely in production, allow in dev
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Studio access not configured', { status: 403 })
    }
    return NextResponse.next()
  }

  const expected = `Basic ${btoa(`dev:${password}`)}`

  if (authHeader !== expected) {
    return new NextResponse('Developer access only', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Sanity Studio"' },
    })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/studio/:path*'],
}
