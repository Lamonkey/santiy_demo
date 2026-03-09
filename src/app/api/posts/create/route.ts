import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import sharp from 'sharp'

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const authorName = formData.get('authorName') as string
    const title = formData.get('title') as string
    const excerpt = formData.get('excerpt') as string
    const body = formData.get('body') as string
    const imageFile = formData.get('image') as File | null

    if (!authorName || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: authorName, title, body' },
        { status: 400 }
      )
    }

    // Upload image to Sanity asset store if provided
    let mainImage: object | undefined
    if (imageFile && imageFile.size > 0) {
      let buffer = Buffer.from(await imageFile.arrayBuffer())
      let contentType = imageFile.type

      const TEN_MB = 10 * 1024 * 1024
      if (buffer.byteLength > TEN_MB) {
        // Compress: resize to max 2400px wide, convert to WebP at 82% quality
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

    // Find or create the author
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

    const post = await client.create({
      _type: 'post',
      title,
      slug: {
        _type: 'slug',
        current: title
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-')
          .slice(0, 80),
      },
      excerpt: excerpt || '',
      body: textToPortableText(body),
      author: { _type: 'reference', _ref: authorId },
      publishedAt: new Date().toISOString(),
      ...(mainImage && { mainImage }),
    })

    return NextResponse.json({ success: true, id: post._id })
  } catch (err) {
    console.error('Post creation error:', err)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
