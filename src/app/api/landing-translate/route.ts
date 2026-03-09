import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from 'next-sanity'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-02-01',
  useCdn: false,
  token: process.env.SANITY_API_WRITE_TOKEN,
})

// Extract translatable strings from the page builder, translate them, reinsert
async function translateDocument(doc: any): Promise<any> {
  // Collect all text fields to translate
  const texts: Record<string, string> = {}

  if (doc.title) texts['title'] = doc.title

  const blocks = doc.pageBuilder ?? []
  blocks.forEach((block: any, i: number) => {
    if (block.headline) texts[`block_${i}_headline`] = block.headline
    if (block.subheadline) texts[`block_${i}_subheadline`] = block.subheadline
    if (block.title) texts[`block_${i}_title`] = block.title
    if (block.subtitle) texts[`block_${i}_subtitle`] = block.subtitle
    if (block.ctas) {
      block.ctas.forEach((cta: any, j: number) => {
        if (cta.label) texts[`block_${i}_cta_${j}_label`] = cta.label
      })
    }
    if (block.items) {
      block.items.forEach((item: any, j: number) => {
        if (item.title) texts[`block_${i}_item_${j}_title`] = item.title
        if (item.description) texts[`block_${i}_item_${j}_description`] = item.description
        if (item.quote) texts[`block_${i}_item_${j}_quote`] = item.quote
        if (item.authorName) texts[`block_${i}_item_${j}_authorName`] = item.authorName
        if (item.authorTitle) texts[`block_${i}_item_${j}_authorTitle`] = item.authorTitle
      })
    }
  })

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Translate all values in the JSON object from English to Chinese (Simplified). Keep keys exactly as-is. Return only the translated JSON object.',
      },
      { role: 'user', content: JSON.stringify(texts) },
    ],
  })

  const translated: Record<string, string> = JSON.parse(completion.choices[0].message.content ?? '{}')

  // Deep clone and reinsert translated strings
  const result = JSON.parse(JSON.stringify(doc))
  result.title = translated['title'] ?? result.title
  result._id = 'landingPageZh'

  result.pageBuilder = (result.pageBuilder ?? []).map((block: any, i: number) => {
    const b = { ...block }
    if (translated[`block_${i}_headline`]) b.headline = translated[`block_${i}_headline`]
    if (translated[`block_${i}_subheadline`]) b.subheadline = translated[`block_${i}_subheadline`]
    if (translated[`block_${i}_title`]) b.title = translated[`block_${i}_title`]
    if (translated[`block_${i}_subtitle`]) b.subtitle = translated[`block_${i}_subtitle`]
    if (b.ctas) {
      b.ctas = b.ctas.map((cta: any, j: number) => ({
        ...cta,
        label: translated[`block_${i}_cta_${j}_label`] ?? cta.label,
      }))
    }
    if (b.items) {
      b.items = b.items.map((item: any, j: number) => ({
        ...item,
        title: translated[`block_${i}_item_${j}_title`] ?? item.title,
        description: translated[`block_${i}_item_${j}_description`] ?? item.description,
        quote: translated[`block_${i}_item_${j}_quote`] ?? item.quote,
        authorName: translated[`block_${i}_item_${j}_authorName`] ?? item.authorName,
        authorTitle: translated[`block_${i}_item_${j}_authorTitle`] ?? item.authorTitle,
      }))
    }
    return b
  })

  return result
}

export async function POST(req: Request) {
  try {
    const { document } = await req.json()
    const translated = await translateDocument(document)

    // Write as landingPageZh singleton
    await writeClient.createOrReplace({
      ...translated,
      _id: 'landingPageZh',
      _type: 'landingPage',
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Translation failed' }, { status: 500 })
  }
}
