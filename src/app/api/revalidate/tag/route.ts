import { revalidateTag } from 'next/cache'
import { type NextRequest, NextResponse } from 'next/server'
import { parseBody } from 'next-sanity/webhook'

type WebhookPayload = { tags: string[] }

export async function POST(req: NextRequest) {
  try {
    const { isValidSignature, body } = await parseBody<WebhookPayload>(
      req,
      process.env.SANITY_REVALIDATE_SECRET,
      true
    )
    if (!isValidSignature) return new Response('Invalid signature', { status: 401 })
    if (!Array.isArray(body?.tags) || !body.tags.length) {
      return new Response('Missing tags', { status: 400 })
    }
    body.tags.forEach((tag) => revalidateTag(tag))
    return NextResponse.json({ revalidated: body.tags })
  } catch (err) {
    return new Response((err as Error).message, { status: 500 })
  }
}
