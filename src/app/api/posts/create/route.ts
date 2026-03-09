import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import OpenAI from 'openai'
import sharp from 'sharp'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

const openai = new OpenAI()

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

function textToPortableText(text: string) {
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

function portableTextToPlain(blocks: Array<{ _type: string; children?: Array<{ text?: string }> }>) {
  return blocks
    .filter((b) => b._type === 'block')
    .map((b) => b.children?.map((c) => c.text ?? '').join('') ?? '')
    .join('\n\n')
}

async function generateSeo(title: string, bodyText: string): Promise<{ title: string; description: string }> {
  const text = [title, bodyText].filter(Boolean).join('\n\n').slice(0, 3000)
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Generate an SEO meta title (max 60 characters) and meta description (max 155 characters). Return JSON with keys "title" and "description". Be factual, no marketing language.',
      },
      { role: 'user', content: text },
    ],
  })
  const result = JSON.parse(completion.choices[0].message.content ?? '{}')
  return { title: result.title ?? '', description: result.description ?? '' }
}

async function translateContent(title: string, bodyText: string, targetLanguage: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the given fields to ${targetLanguage}. Return a JSON object with fields: title, body. Preserve paragraph breaks in body using double newlines.`,
      },
      {
        role: 'user',
        content: JSON.stringify({ title, body: bodyText }),
      },
    ],
  })
  return JSON.parse(completion.choices[0].message.content ?? '{}') as {
    title: string
    body: string
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const authorName = formData.get('authorName') as string
    const title = formData.get('title') as string
    const body = formData.get('body') as string
    const imageFile = formData.get('image') as File | null

    if (!authorName || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: authorName, title, body' },
        { status: 400 }
      )
    }

    // Upload image if provided
    let mainImage: object | undefined
    if (imageFile && imageFile.size > 0) {
      let buffer = Buffer.from(await imageFile.arrayBuffer())
      let contentType = imageFile.type
      const TEN_MB = 10 * 1024 * 1024
      if (buffer.byteLength > TEN_MB) {
        buffer = await sharp(buffer)
          .resize({ width: 2400, withoutEnlargement: true })
          .webp({ quality: 82 })
          .toBuffer()
        contentType = 'image/webp'
      }
      const asset = await client.assets.upload('image', buffer, {
        filename: imageFile.name.replace(/\.[^.]+$/, '.webp'),
        contentType,
      })
      mainImage = {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
        alt: title,
      }
    }

    // Find or create author
    const existingAuthor = await client.fetch(
      `*[_type == "author" && name == $name][0]{ _id }`,
      { name: authorName }
    )
    let authorId: string
    if (existingAuthor?._id) {
      authorId = existingAuthor._id
    } else {
      const newAuthor = await client.create({
        _type: 'author',
        name: authorName,
        role: 'Guest Contributor',
      })
      authorId = newAuthor._id
    }

    // Generate SEO for English post
    const seo = await generateSeo(title, body).catch(() => null)

    // Create source (English) post — published immediately
    const post = await client.create({
      _type: 'post',
      title,
      slug: { _type: 'slug', current: slugify(title) },
      body: textToPortableText(body),
      author: { _type: 'reference', _ref: authorId },
      publishedAt: new Date().toISOString(),
      language: 'en',
      translationStatus: 'none',
      ...(seo && { seo }),
      ...(mainImage && { mainImage }),
    })

    // Auto-translate to Chinese in the background — don't block the response
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
    createTranslation({
      sourceId: post._id,
      title,
      body,
      authorId,
      mainImage,
      targetLanguage: 'Simplified Chinese',
      targetLocale: 'zh',
      siteUrl,
    }).catch((err) => console.error('Translation failed:', err))

    return NextResponse.json({ success: true, id: post._id })
  } catch (err) {
    console.error('Post creation error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}

async function createTranslation({
  sourceId,
  title,
  body,
  authorId,
  mainImage,
  targetLanguage,
  targetLocale,
  siteUrl,
}: {
  sourceId: string
  title: string
  body: string
  authorId: string
  mainImage: object | undefined
  targetLanguage: string
  targetLocale: string
  siteUrl: string
}) {
  const [translated, translatedSeo] = await Promise.all([
    translateContent(title, body, targetLanguage),
    generateSeo(title, body).catch(() => null),
  ])

  const translationId = `${sourceId}-${targetLocale}`
  const draftId = `drafts.${translationId}`

  await client.createOrReplace({
    _id: draftId,
    _type: 'post',
    title: translated.title,
    slug: { _type: 'slug', current: `${slugify(translated.title)}-${targetLocale}` },
    body: textToPortableText(translated.body),
    author: { _type: 'reference', _ref: authorId },
    publishedAt: new Date().toISOString(),
    language: targetLocale,
    translationOf: { _type: 'reference', _ref: sourceId },
    translationStatus: 'pending_review',
    ...(translatedSeo && { seo: translatedSeo }),
    ...(mainImage && { mainImage }),
  })

  // Notify reviewer via webhook if configured
  if (process.env.REVIEW_WEBHOOK_URL) {
    await fetch(process.env.REVIEW_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `New translation pending review: "${translated.title}" (${targetLocale.toUpperCase()})`,
        studioUrl: `${siteUrl}/studio/structure/post;${draftId}`,
        sourceTitle: title,
        translatedTitle: translated.title,
        language: targetLocale,
      }),
    }).catch(() => {}) // webhook failure should not surface to user
  }
}

// Called by the Studio retranslate action
export async function PUT(req: NextRequest) {
  try {
    const { postId } = await req.json()
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })

    const post = await client.fetch(
      `*[_type == "post" && _id == $id][0]{ _id, title, body, language, translationOf, author->{ _id }, mainImage }`,
      { id: postId }
    )
    if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

    const bodyText = portableTextToPlain(post.body ?? [])
    const targetLocale = post.language === 'en' ? 'zh' : 'en'
    const targetLanguage = targetLocale === 'zh' ? 'Simplified Chinese' : 'English'

    const translated = await translateContent(post.title, bodyText, targetLanguage)

    // Determine target document id
    let targetId: string
    if (post.language === 'en') {
      // English → update/create the Chinese draft
      targetId = `${post._id}-zh`
    } else {
      // Chinese → update the English source
      targetId = post.translationOf?._ref ?? `${post._id}-en`
    }

    await client.createOrReplace({
      _id: `drafts.${targetId}`,
      _type: 'post',
      title: translated.title,
      slug: { _type: 'slug', current: targetLocale === 'zh' ? `${slugify(translated.title)}-zh` : slugify(translated.title) },
      body: textToPortableText(translated.body),
      author: { _type: 'reference', _ref: post.author._id },
      publishedAt: new Date().toISOString(),
      language: targetLocale,
      translationOf: targetLocale === 'en' ? undefined : { _type: 'reference', _ref: post.translationOf?._ref ?? post._id },
      translationStatus: 'pending_review',
      ...(post.mainImage && { mainImage: post.mainImage }),
    })

    return NextResponse.json({ success: true, targetId })
  } catch (err) {
    console.error('Retranslate error:', err)
    return NextResponse.json({ error: 'Retranslation failed' }, { status: 500 })
  }
}
