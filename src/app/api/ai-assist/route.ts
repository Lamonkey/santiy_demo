import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const { content, instruction, type } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    if (type === 'summary') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `You are an expert content editor. Given the following blog post content, generate a concise 2-3 sentence summary that captures the key insights. Return only the summary text, no preamble.\n\nContent:\n${content}`,
        }],
      })
      return NextResponse.json({ summary: completion.choices[0].message.content ?? '' })
    }

    if (type === 'seo') {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: `You are an SEO expert. Given the following content, generate:\n1. An SEO title (max 60 chars)\n2. A meta description (max 160 chars)\n\nReturn as JSON: { "title": "...", "description": "..." }\n\nContent:\n${content}`,
        }],
      })
      const result = completion.choices[0].message.content ?? ''
      try {
        return NextResponse.json(JSON.parse(result))
      } catch {
        return NextResponse.json({ raw: result })
      }
    }

    if (type === 'edit') {
      if (!instruction?.trim()) {
        return NextResponse.json({ error: 'Missing instruction' }, { status: 400 })
      }
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 4096,
        messages: [
          {
            role: 'system',
            content: 'You are an expert editor. Apply the given instruction to the article content. Return only the edited content — no explanation, no preamble, no markdown fences.',
          },
          {
            role: 'user',
            content: `Instruction: ${instruction}\n\nContent:\n${content}`,
          },
        ],
      })
      return NextResponse.json({ text: completion.choices[0].message.content ?? '' })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err) {
    console.error('AI assist error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
