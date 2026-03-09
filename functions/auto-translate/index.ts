import { createClient } from '@sanity/client'
import OpenAI from 'openai'

// Types for the document event payload from Sanity Blueprints
interface SanityBlock {
  _type: string
  _key: string
  children?: Array<{ _type: string; _key: string; text?: string }>
}

interface PostDocument {
  _id: string
  title: string
  body: SanityBlock[]
  author: { _type: 'reference'; _ref: string }
  mainImage?: object
  language: string
}

function portableTextToPlain(blocks: SanityBlock[]): string {
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => b.children?.map((c) => c.text ?? '').join('') ?? '')
    .join('\n\n')
}

function textToPortableText(text: string): SanityBlock[] {
  return text
    .split(/\n\n+/)
    .filter((p) => p.trim())
    .map((paragraph, i) => ({
      _type: 'block',
      _key: `block-${i}-${Date.now()}`,
      style: 'normal',
      children: [{ _type: 'span', _key: `span-${i}`, text: paragraph.trim() }],
      markDefs: [],
    }))
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export async function handler(event: unknown) {
  const document = ((event as Record<string, unknown>)?.['event'] as Record<string, unknown>)?.['data'] as PostDocument

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiVersion: '2026-02-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  })

  const bodyText = portableTextToPlain(document.body ?? [])

  const translated = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a professional translator. Translate the given fields to Simplified Chinese. Return a JSON object with fields: title, body. Preserve paragraph breaks in body using double newlines.',
      },
      { role: 'user', content: JSON.stringify({ title: document.title, body: bodyText }) },
    ],
  })

  const translatedContent = JSON.parse(translated.choices[0].message.content ?? '{}') as {
    title: string
    body: string
  }

  const targetId = `${document._id}-zh`
  const draftId = `drafts.${targetId}`

  // Chinese chars are stripped by slugify, fall back to source ID-based slug
  const zhSlug = slugify(translatedContent.title) || `${document._id}-zh`

  await client.createOrReplace({
    _id: draftId,
    _type: 'post',
    title: translatedContent.title,
    slug: { _type: 'slug', current: zhSlug },
    body: textToPortableText(translatedContent.body),
    author: document.author,
    publishedAt: new Date().toISOString(),
    language: 'zh',
    translationOf: { _type: 'reference', _ref: document._id },
    translationStatus: 'pending_review',
    // no seo — auto-seo Blueprint function will generate it when this draft is published
    ...(document.mainImage && { mainImage: document.mainImage }),
  })

  if (process.env.REVIEW_WEBHOOK_URL) {
    await fetch(process.env.REVIEW_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New translation pending review: "${translatedContent.title}" (ZH)`,
        sourceTitle: document.title,
        translatedTitle: translatedContent.title,
        language: 'zh',
      }),
    }).catch(() => {})
  }
}
