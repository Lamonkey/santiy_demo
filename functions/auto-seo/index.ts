import { createClient } from '@sanity/client'
import OpenAI from 'openai'

interface SanityBlock {
  _type: string
  children?: Array<{ text?: string }>
  // page builder blocks may have nested text fields
  headline?: string
  subtitle?: string
}

interface Document {
  _id: string
  _type: 'post' | 'landingPage'
  title?: string
  language?: string
  body?: SanityBlock[]
  pageBuilder?: SanityBlock[]
}

function extractText(doc: Document): string {
  if (doc._type === 'post') {
    return (doc.body ?? [])
      .filter((b) => b._type === 'block')
      .map((b) => b.children?.map((c) => c.text ?? '').join('') ?? '')
      .join('\n\n')
  }
  // landingPage — pull text from page builder blocks
  return (doc.pageBuilder ?? [])
    .flatMap((block) => [block.headline, block.subtitle].filter(Boolean))
    .join('\n\n')
}

export async function handler(event: unknown) {
  const document = ((event as Record<string, unknown>)?.['event'] as Record<string, unknown>)?.['data'] as Document

  if (!document?._id) {
    console.error('auto-seo: missing document._id, event:', JSON.stringify(event))
    return
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID!,
    dataset: process.env.SANITY_DATASET ?? 'production',
    apiVersion: '2026-02-01',
    token: process.env.SANITY_WRITE_TOKEN,
    useCdn: false,
  })

  const bodyText = extractText(document)
  const inputText = [document.title, bodyText].filter(Boolean).join('\n\n').slice(0, 3000)

  const lang = document.language === 'zh' ? 'Simplified Chinese' : 'English'
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Generate an SEO meta title (max 60 characters) and meta description (max 155 characters) in ${lang}. Return JSON with keys "title" and "description". Be factual, no marketing language.`,
      },
      { role: 'user', content: inputText },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content ?? '{}') as {
    title: string
    description: string
  }

  await client
    .patch(document._id)
    .setIfMissing({ seo: {} })
    .set({ 'seo.title': result.title ?? '', 'seo.description': result.description ?? '' })
    .commit({ visibility: 'async' })
}
