import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: Request) {
  const { title, excerpt, body } = await req.json()

  const textContent = [title, excerpt, body].filter(Boolean).join('\n\n').slice(0, 3000)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'Generate an SEO meta title (max 60 characters) and meta description (max 155 characters) for the following content. Return JSON with keys "title" and "description". Be factual, no marketing language.',
      },
      { role: 'user', content: textContent },
    ],
  })

  const result = JSON.parse(completion.choices[0].message.content ?? '{}')
  return NextResponse.json({ title: result.title ?? '', description: result.description ?? '' })
}
