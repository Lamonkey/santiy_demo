# sanity-demo

A practice project. The goal was to use Sanity and Next.js to work through problems that come up in real content platforms: multilingual routing, SEO metadata, auto-translation pipelines, cache invalidation, and AI-assisted editing inside a CMS.

## Stack

- Next.js 15 App Router
- Sanity.io (embedded Studio at `/studio`)
- Tailwind CSS
- OpenAI `gpt-4o` + `whisper-1`
- Vercel + Vercel Cron

## What's in it

- Public write form at `/write` with voice input (Whisper) and AI polish (GPT-4o)
- Blog at `/blog` (English) and `/zh/blog` (Chinese)
- Auto-translation on post creation — Chinese draft created in the background, linked to the source document
- `hreflang` alternates, canonical URLs, JSON-LD structured data, Open Graph metadata
- Dynamic sitemap generated from Sanity content
- Cron job that flags posts whose translations are out of date
- Custom Sanity Studio actions: approve translation, re-translate, generate SEO
- AI field inputs in Studio (Polish + mic buttons on title field)
- Landing page translation action — translates full page builder content to Chinese

## Setup

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | e.g. `2026-02-01` |
| `NEXT_PUBLIC_SITE_URL` | Production domain |
| `SANITY_API_READ_TOKEN` | Viewer token from sanity.io/manage |
| `SANITY_API_WRITE_TOKEN` | Editor token from sanity.io/manage |
| `SANITY_REVALIDATE_SECRET` | Random string for webhook verification |
| `CRON_SECRET` | Random string for cron endpoint |
| `OPENAI_API_KEY` | OpenAI API key |

## Project structure

```
src/
├── app/
│   ├── (frontend)/
│   │   ├── blog/            # English blog
│   │   ├── zh/blog/         # Chinese blog
│   │   └── write/           # Public write form
│   ├── studio/              # Embedded Sanity Studio
│   └── api/
│       ├── posts/create/    # Post creation + auto-translation
│       ├── ai-assist/       # GPT-4o editing
│       ├── transcribe/      # Whisper transcription
│       └── cron/sync-check/ # Translation sync cron
├── components/
└── sanity/
    ├── schemaTypes/         # Post, author, category, settings
    ├── actions/             # Studio document actions
    └── structure/           # Custom Studio sidebar
```

## Cache invalidation

Sanity webhooks → `/api/revalidate/tag` → `revalidateTag()`. Pages also have a 60-second time-based fallback. Configure the webhook in sanity.io/manage pointing to `https://your-domain/api/revalidate/tag` with `SANITY_REVALIDATE_SECRET`.
