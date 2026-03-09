import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI()

export async function POST(req: NextRequest) {
  try {
    const { content, type } = await req.json()

    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    let prompt: string
    let maxTokens = 512

    if (type === 'summary') {
      prompt = `You are an expert content editor. Given the following blog post content, generate a concise 2-3 sentence summary that captures the key insights. Return only the summary text, no preamble.\n\nContent:\n${content}`
    } else if (type === 'seo') {
      prompt = `You are an SEO expert. Given the following content, generate:\n1. An SEO title (max 60 chars)\n2. A meta description (max 160 chars)\n\nReturn as JSON: { "title": "...", "description": "..." }\n\nContent:\n${content}`
    } else if (type === 'review') {
      maxTokens = 1024
      prompt = `You are a senior content editor reviewing a draft blog post. Provide structured, constructive feedback.

Return ONLY valid JSON in this exact shape:
{
  "score": <number 1-10>,
  "summary": "<one sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>"],
  "improvements": [
    { "area": "<area>", "suggestion": "<actionable suggestion>" }
  ],
  "seoTips": ["<tip 1>", "<tip 2>"],
  "readability": "<Good | Fair | Needs Work>",
  "verdict": "<Ready to submit | Needs minor edits | Needs major revision>"
}

Draft content:
${content}`
    } else {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    })

    const result = completion.choices[0].message.content ?? ''

    if (type === 'seo' || type === 'review') {
      try {
        return NextResponse.json(JSON.parse(result))
      } catch {
        return NextResponse.json({ raw: result })
      }
    }

    return NextResponse.json({ summary: result })
  } catch (err) {
    console.error('AI assist error:', err)
    return NextResponse.json({ error: 'AI generation failed' }, { status: 500 })
  }
}
