# Sanity.io Content Platform

A headless CMS content platform built with **Sanity.io** and **Next.js 15**, demonstrating real-world production patterns end-to-end. It includes a blog, portfolio case studies, a modular page builder, full SEO optimisation, and a public writing interface with voice input and AI editing.

---

## Tech Stack

| Layer | Technology |
|---|---|
| CMS | Sanity.io (embedded Studio at `/studio`) |
| Frontend | Next.js 15 App Router (Server Components) |
| Styling | Tailwind CSS + `@tailwindcss/typography` |
| AI | OpenAI `gpt-4o` (editing) + `whisper-1` (transcription) |
| Image processing | Sanity Image CDN + `sharp` (server-side compression) |
| Deployment | Vercel |

---

## Features

- **Modular page builder** — hero, features, and testimonials blocks editable from Studio
- **Blog** with categories, pagination, author profiles, and Portable Text body
- **Case studies** with client details, tech stacks, and cover images
- **Embedded Sanity Studio** at `/studio` (protected by HTTP Basic Auth)
- **Public writing form** at `/write` — no login required
  - Voice input via OpenAI Whisper — dictate your article, recording retained for fallback
  - AI editing assistant — give a plain-English instruction, review and accept the rewrite
  - Optional cover image upload with server-side compression
- **Visual Editing** — click-to-edit overlays via Sanity Presentation Tool
- **Live content API** — real-time updates with `defineLive` / `SanityLive`
- **Full SEO** — static pre-rendering, canonical URLs, Open Graph, JSON-LD, dynamic sitemap
- **Sanity Blueprints** — infrastructure as code

Full feature documentation: [`FEATURES.md`](./FEATURES.md)
SEO strategy: [`SEO.md`](./SEO.md)

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd santiy_demo
npm install
```

### 2. Create a Sanity project

Go to [sanity.io/manage](https://sanity.io/manage) and create a new project. Note your **Project ID** and **Dataset** name.

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | sanity.io/manage → project settings |
| `NEXT_PUBLIC_SANITY_DATASET` | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Use `2026-02-01` |
| `NEXT_PUBLIC_SITE_URL` | Your production domain e.g. `https://example.com` |
| `SANITY_API_READ_TOKEN` | sanity.io/manage → API → Tokens → add **Viewer** token |
| `SANITY_API_WRITE_TOKEN` | sanity.io/manage → API → Tokens → add **Editor** token |
| `SANITY_REVALIDATE_SECRET` | Any random string — used to verify Sanity webhooks |
| `STUDIO_ACCESS_KEY` | Any password — protects the `/studio` route |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |

### 4. Run the development server

```bash
npm run dev
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Studio: [http://localhost:3000/studio](http://localhost:3000/studio)
- Public writing form: [http://localhost:3000/write](http://localhost:3000/write)

### 5. Seed sample data (optional)

```bash
npm run seed
```

Creates 1 author, 3 categories, 5 blog posts, and 5 case studies. Requires `SANITY_API_WRITE_TOKEN` with Editor role.

---

## Project Structure

```
santiy_demo/
├── middleware.ts                    # Studio Basic Auth protection
├── sanity.config.ts                 # Studio config
├── sanity.cli.ts                    # TypeGen configuration
├── sanity.blueprint.ts              # Infrastructure as Code
├── sanity.types.ts                  # Auto-generated TypeScript types
├── scripts/
│   └── seed.mjs                     # Dataset seeding script
└── src/
    ├── app/
    │   ├── (frontend)/
    │   │   ├── layout.tsx           # Nav + SanityLive + VisualEditing
    │   │   ├── page.tsx             # Landing page (Page Builder)
    │   │   ├── blog/                # Blog listing + post detail
    │   │   ├── case-studies/        # Case studies listing + detail
    │   │   └── write/               # Public author form
    │   ├── studio/[[...tool]]/      # Embedded Sanity Studio
    │   └── api/
    │       ├── ai-assist/           # GPT-4o: summary / seo / edit
    │       ├── transcribe/          # Whisper voice transcription
    │       ├── posts/create/        # Programmatic post creation
    │       ├── draft-mode/enable/   # Draft Mode activation
    │       ├── revalidate/tag/      # Webhook cache revalidation
    │       └── og/                  # Dynamic OG image generation
    ├── components/
    │   ├── PageBuilder.tsx
    │   ├── blocks/                  # Hero, Features, Testimonials
    │   ├── PortableTextContent.tsx
    │   └── BlogJsonLd.tsx
    └── sanity/
        ├── lib/                     # client, live, image, queries
        ├── schemaTypes/             # All document + object schemas
        └── structure/               # Custom Studio desk structure
```

---

## Key Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (runs TypeGen)
npm run seed         # Seed dataset with sample content
npx sanity typegen   # Regenerate TypeScript types from schema
npx sanity deploy    # Deploy Studio standalone (optional)
```

---

## Writing an Article

Navigate to `/write`. No account needed.

1. Fill in your name, title, and optional summary
2. **Voice input** — click "Start Recording", speak your article, click "Stop Recording", then "Transcribe". The transcript is appended to the body. Your recording stays available to replay or download.
3. **AI editing** — type an instruction in the right panel (e.g. "Fix grammar and improve flow") and click "Apply Edit". Review the suggested rewrite and accept or discard it.
4. Upload an optional cover image
5. Click "Publish Article" — it goes live immediately

---

## Studio Access

The Studio at `/studio` is protected by HTTP Basic Auth:

- Username: `dev`
- Password: value of `STUDIO_ACCESS_KEY` in `.env.local`

Public contributors use `/write` and never need Studio access.

---

## Deployment

### Vercel (recommended)

1. Push to GitHub and import the repo in [vercel.com/new](https://vercel.com/new)
2. Add all environment variables from `.env.local.example` in the Vercel dashboard
3. Set `NEXT_PUBLIC_SITE_URL` to your production domain

### Sanity webhook for revalidation (optional)

In [sanity.io/manage](https://sanity.io/manage) → your project → API → Webhooks, create a webhook:

- URL: `https://your-domain.com/api/revalidate/tag`
- Trigger on: document publish/unpublish
- Secret: value of `SANITY_REVALIDATE_SECRET`
