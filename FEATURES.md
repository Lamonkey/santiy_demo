# Headless CMS Content Platform — Feature Documentation

A personal portfolio and content platform built with **Sanity.io** and **Next.js 15**, demonstrating real-world production patterns end-to-end. Every feature was chosen to practice a specific Sanity capability — not just follow a tutorial.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Content Model & Schema Design](#2-content-model--schema-design)
3. [Page Builder (Modular Sections)](#3-page-builder-modular-sections)
4. [Portable Text (Rich Text)](#4-portable-text-rich-text)
5. [GROQ Queries & TypeGen](#5-groq-queries--typegen)
6. [Custom Studio Structure](#6-custom-studio-structure)
7. [Live Content API & Visual Editing](#7-live-content-api--visual-editing)
8. [SEO & Structured Data](#8-seo--structured-data)
9. [Image Handling](#9-image-handling)
10. [Public Author Interface with Voice Input & AI Editing](#10-public-author-interface-with-voice-input--ai-editing)
11. [AI-Assisted Content Tools](#11-ai-assisted-content-tools)
12. [Multi-Language Support & Translation Workflow](#12-multi-language-support--translation-workflow)
13. [Translation Sync Cron Job](#13-translation-sync-cron-job)
14. [Sanity Blueprints](#14-sanity-blueprints)
15. [Studio Access Control](#15-studio-access-control)
16. [Seed Script](#16-seed-script)
17. [Project Structure](#17-project-structure)

---

## 1. Project Overview

| Layer | Technology |
|---|---|
| CMS | Sanity.io (embedded Studio) |
| Frontend | Next.js 15 App Router |
| Styling | Tailwind CSS + `@tailwindcss/typography` |
| AI | OpenAI `gpt-4o` |
| Deployment target | Vercel |

**Architecture choice:** Embedded Studio — the Sanity Studio lives inside the Next.js app at `/studio`. This means a single deployment, a single repo, and no CORS configuration overhead. The correct pattern for most Next.js projects per the official best practices.

---

## 2. Content Model & Schema Design

**Sanity feature demonstrated:** `defineType`, `defineField`, `defineArrayMember`, field groups, conditional fields, icons, validation, shared objects.

### Document Types

| Schema | File | Purpose |
|---|---|---|
| `settings` | `schemaTypes/documents/settings.ts` | Singleton — site name, nav, default SEO |
| `landingPage` | `schemaTypes/documents/landing-page.ts` | Singleton — modular home page |
| `post` | `schemaTypes/documents/post.ts` | Blog posts with author + categories |
| `author` | `schemaTypes/documents/author.ts` | Reusable author profile |
| `category` | `schemaTypes/documents/category.ts` | Blog taxonomy |
| `caseStudy` | `schemaTypes/documents/case-study.ts` | Portfolio work with client details |

### Key Schema Patterns

**Strict syntax — always `defineType` / `defineField` / `defineArrayMember`:**
```ts
// src/sanity/schemaTypes/documents/post.ts
export const postType = defineType({
  name: 'post',
  type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string' }),
    defineField({
      name: 'categories',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'category' }] })]
    })
  ]
})
```

**Field groups** reduce cognitive load for editors by splitting the `post` form into tabs: `Content`, `Metadata`, `SEO`.

**Conditional fields** on the `link` object — show `internalRef` or `externalUrl` depending on what the editor selects, never both:
```ts
// src/sanity/schemaTypes/objects/link.ts
defineField({
  name: 'internalRef',
  type: 'reference',
  hidden: ({ parent }) => parent?.linkType !== 'internal',
}),
defineField({
  name: 'externalUrl',
  type: 'url',
  hidden: ({ parent }) => parent?.linkType !== 'external',
})
```

**Shared SEO object** — a reusable `seo` object type applied across `post`, `caseStudy`, `landingPage`, and `settings`, keeping SEO fields consistent everywhere:
```ts
// src/sanity/schemaTypes/objects/seo.ts
export const seoType = defineType({
  name: 'seo',
  type: 'object',
  fields: [title, description, image, noIndex]
})
```

**References vs embedded objects** — the correct decision is made at every schema:
- `author` on a post → **reference** (reusable, independently editable, shared across posts)
- `categories` on a post → **reference** (shared taxonomy, query-able independently)
- `seo` on a page → **embedded object** (page-specific, not shared)
- Page builder blocks → **embedded objects** (unique to each page)

**Schema philosophy:** field names describe *what content is*, not *how it looks*. `headline` not `bigText`. `callToAction` not `redButton`. `featuresSection` not `threeColumnRow`.

---

## 3. Page Builder (Modular Sections)

**Sanity feature demonstrated:** Array of typed objects, block previews, `insertMenu`, switch-based rendering, `stegaClean` for logic fields.

The landing page is composed from an ordered array of reusable blocks — editors can add, remove, and reorder sections without touching code.

### Blocks

| Block | Schema | Component |
|---|---|---|
| Hero | `blocks/hero-block.ts` | `components/blocks/Hero.tsx` |
| Features | `blocks/features-block.ts` | `components/blocks/Features.tsx` |
| Testimonials | `blocks/testimonials-block.ts` | `components/blocks/Testimonials.tsx` |

### Block Preview Pattern
Every block implements `preview` so editors see a meaningful label and icon in the Studio array:
```ts
preview: {
  select: { title: 'headline', media: 'image' },
  prepare({ title, media }) {
    return { title: title || 'Untitled Hero', subtitle: 'Hero Section', media: media ?? StarIcon }
  }
}
```

### Switch-Based Rendering
```tsx
// src/components/PageBuilder.tsx
switch (stegaClean(block._type)) {
  case 'hero':        return <Hero key={block._key} {...block} />
  case 'features':    return <Features key={block._key} {...block} />
  case 'testimonials': return <Testimonials key={block._key} {...block} />
}
```

`stegaClean()` is used on `block._type` and any field that controls rendering logic (like `align`, `columns`) to strip invisible Visual Editing characters before comparing values.

**`_key` not index** is always used as the React `key` prop — required for Visual Editing overlays to work correctly and for React reconciliation.

---

## 4. Portable Text (Rich Text)

**Sanity feature demonstrated:** `PortableText` renderer, custom block styles, custom type components, mark annotations, image blocks inside body copy.

Blog posts and case study body content use Sanity's Portable Text — a structured JSON representation of rich text, not an HTML blob.

### Custom Components
```tsx
// src/components/PortableTextContent.tsx
const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="text-3xl font-bold mt-10 mb-4">{children}</h2>,
    blockquote: ({ children }) => <blockquote className="border-l-4 pl-6 italic">{children}</blockquote>,
  },
  types: {
    image: ({ value }) => <figure><Image src={urlFor(value).url()} /></figure>,
  },
  marks: {
    link: ({ children, value }) => <a href={value.href} rel="noopener noreferrer">{children}</a>,
    code: ({ children }) => <code className="bg-gray-100 rounded px-1.5">{children}</code>,
  },
}
```

Inline images are first-class citizens in the body — not just URLs dropped into text.

---

## 5. GROQ Queries & TypeGen

**Sanity feature demonstrated:** `defineQuery`, query fragments, `coalesce()`, reference expansion, `select()`, projections, pagination, TypeGen auto-generation.

### `defineQuery` Wrapping
Every query is wrapped in `defineQuery` from `next-sanity` — this is what TypeGen reads to generate TypeScript types:
```ts
// src/sanity/lib/queries.ts
export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{ ... }
`)
```

### Reusable Fragments
Shared sub-projections are extracted as string fragments to keep queries DRY:
```ts
const imageFragment = /* groq */ `
  asset->{ _id, url, metadata { lqip, dimensions } },
  alt
`
```

### SEO Fallbacks with `coalesce()`
Logic lives in GROQ, not in component code:
```groq
"seo": {
  "title": coalesce(seo.title, title, ""),
  "description": coalesce(seo.description, excerpt, ""),
  "noIndex": seo.noIndex == true
}
```

### Pagination
Blog listing uses offset-based pagination with a parallel count query:
```ts
const [{ data: posts }, { data: total }] = await Promise.all([
  sanityFetch({ query: POSTS_LIST_QUERY, params: { start, end } }),
  sanityFetch({ query: POSTS_COUNT_QUERY }),
])
```

### TypeGen Configuration
Enabled in `sanity.cli.ts` — types regenerate automatically during `sanity dev` and `sanity build`:
```ts
typegen: {
  enabled: true,
  path: './src/**/*.{ts,tsx}',
  generates: './sanity.types.ts',
  overloadClientMethods: true,
}
```
`overloadClientMethods: true` means `client.fetch()` automatically returns the correct TypeScript type — no manual type imports needed.

---

## 6. Custom Studio Structure

**Sanity feature demonstrated:** `structureTool`, `StructureResolver`, singleton pattern, grouped navigation, dividers, filtered document lists.

### Custom Desk Structure
```ts
// src/sanity/structure/index.ts
export const structure: StructureResolver = (S) =>
  S.list().title('Content').items([
    // Singletons pinned at top
    S.listItem().title('Site Settings').icon(CogIcon)
      .child(S.document().schemaType('settings').documentId('settings')),
    S.listItem().title('Landing Page').icon(HomeIcon)
      .child(S.document().schemaType('landingPage').documentId('landingPage')),

    S.divider(),

    // Blog grouped under one nav item
    S.listItem().title('Blog').icon(DocumentTextIcon)
      .child(S.list().items([
        S.documentTypeListItem('post'),
        S.documentTypeListItem('author'),
        S.documentTypeListItem('category'),
      ])),

    S.documentTypeListItem('caseStudy'),
  ])
```

### Singleton Pattern
Singletons (`settings`, `landingPage`) are enforced via structure — not a schema option. Using `.documentId('settings')` locks the document to a fixed ID. There is no `singleton: true` in Sanity's schema API.

Singletons are filtered out of the generic document list to prevent duplicate entries appearing.

---

## 7. Live Content API & Visual Editing

**Sanity feature demonstrated:** `defineLive`, `SanityLive`, `VisualEditing`, Draft Mode, `stega`, `stegaClean`, CDN vs API toggle.

### `defineLive` Setup
```ts
// src/sanity/lib/live.ts
export const { sanityFetch, SanityLive } = defineLive({
  client: client.withConfig({ apiVersion: '2026-02-01' }),
  serverToken: process.env.SANITY_API_READ_TOKEN,
  browserToken: process.env.SANITY_API_READ_TOKEN,
  studioUrl: '/studio',
})
```

`defineLive` (next-sanity v9+) handles fetching, caching, and real-time invalidation automatically. No manual `revalidatePath` or ISR config needed for most content.

### Layout Integration
```tsx
// src/app/(frontend)/layout.tsx
<SanityLive />
{isDraft && <VisualEditing studioUrl="/studio" />}
```

`<SanityLive />` in the root layout enables real-time content updates across all pages. `<VisualEditing />` activates only in Draft Mode — enabling click-to-edit overlays in the Studio's Presentation Tool.

### Stega Awareness
All fields that control rendering logic are cleaned before use:
```tsx
const align = stegaClean(block.align) // 'center' not 'c͎e͎n͎t͎e͎r͎'
```

All metadata fetches disable stega — invisible characters in `<title>` tags break SEO:
```ts
const { data } = await sanityFetch({ query: PAGE_QUERY, params, stega: false })
```

### Draft Mode Route
`/api/draft-mode/enable` uses `defineEnableDraftMode` from `next-sanity/draft-mode` — the Studio's Presentation Tool calls this route to enter Draft Mode and see unpublished content.

### Tag-Based Revalidation Webhook
`/api/revalidate/tag` receives signed Sanity webhooks and calls `revalidateTag()` for precise cache invalidation. Webhook signature is verified using `parseBody` before any revalidation runs.

---

## 8. SEO & Structured Data

**Sanity feature demonstrated:** GROQ `coalesce()` for fallbacks, Next.js `generateMetadata`, dynamic sitemap, robots.txt, JSON-LD, dynamic OG images.

The full SEO strategy is documented in [`SEO.md`](./SEO.md). Key techniques:

### Server-Side Rendering
All public pages are Next.js Server Components — content is fully rendered to HTML before reaching the browser, so crawlers receive complete, indexable pages with no JavaScript execution required.

### Static Pre-rendering
Detail pages use `generateStaticParams` to pre-render every slug at build time and `dynamicParams = false` to return clean 404s for unknown slugs instead of slow dynamic fallbacks:
```ts
export const dynamicParams = false

export async function generateStaticParams() {
  const slugs = await client.fetch(POST_SLUGS_QUERY)
  return slugs ?? []
}
```

### `metadataBase` + Canonical URLs
`metadataBase` is set in the root layout using `NEXT_PUBLIC_SITE_URL`, making all OG image URLs and canonical links absolute — required for social platform crawlers to resolve them. Every page declares its canonical URL to prevent duplicate content from pagination and category filters.

### `generateMetadata`
Used on every route — never manual `<meta>` tags in components. Metadata fetches always use `stega: false` to strip Visual Editing characters before writing to `<title>` or `<meta>` tags:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const { data: post } = await getPost(params, false) // stega: false
  return {
    title: post.seo?.title || post.title,
    description: post.seo?.description || post.excerpt,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post.publishedAt,
      authors: [post.author?.name],
      images: [{ url: ogImageUrl, width: 1200, height: 630 }],
    },
  }
}
```

### OG Image Fallback Chain
For blog posts and case studies, the Open Graph image resolves through a fallback chain so social cards always have an image when one is available:
1. Dedicated SEO image set in Studio
2. Post cover image (uploaded via `/write` or Studio)
3. No image (card renders title-only)

### Dynamic Sitemap
`src/app/sitemap.ts` queries Sanity directly and generates `sitemap.xml` from live content — automatically includes new posts and case studies as they're published.

### JSON-LD Structured Data
`src/components/BlogJsonLd.tsx` injects `Article` schema markup on every blog post using the `schema-dts` library for type safety — enables rich results (article carousels, author bylines) in Google Search.

### Dynamic OG Images
`/api/og?id=<documentId>` generates 1200×630 Open Graph images at the edge using `next/og` — used as a fallback when a post has no manually uploaded image.

### GROQ `coalesce()` for SEO Fallbacks
Fallback logic lives in the query, not in component code:
```groq
"seo": {
  "title":       coalesce(seo.title, title, ""),
  "description": coalesce(seo.description, excerpt, "")
}
```

### `noIndex` Flag
Every content type has a `noIndex` boolean editors can toggle in Studio — emits `robots: 'noindex'` without any code changes.

---

## 9. Image Handling

**Sanity feature demonstrated:** `@sanity/image-url`, LQIP blur placeholder, hotspot-aware cropping, `next/image` integration, `client.assets.upload()`, server-side compression with `sharp`.

### Two-Layer Optimisation Strategy

Images go through two separate optimisation stages:

| Stage | Tool | When | What it does |
|---|---|---|---|
| Upload-time | `sharp` | >10 MB source file | Resize to max 2400px wide, convert to WebP at 82% quality |
| Delivery-time | Sanity Image CDN | Every request | Serve WebP to supporting browsers, never upscale, compress to quality 80 |

This keeps storage lean and delivery fast regardless of what contributors upload.

### CDN Delivery Optimisations

`urlFor` applies three CDN transformations globally so every image in the project benefits automatically:

```ts
// src/sanity/lib/image.ts
const imageBuilder = createImageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return imageBuilder.image(source).auto('format').fit('max').quality(80)
}
```

- **`auto('format')`** — serves WebP to browsers that support it, JPEG elsewhere
- **`fit('max')`** — never upscales; only shrinks if the requested size is smaller than the source
- **`quality(80)`** — good visual quality at ~40% smaller file size than lossless

### Upload-Time Compression with `sharp`

When a contributor uploads an image via the `/write` form, the API route checks the file size before uploading to Sanity:

```ts
// src/app/api/posts/create/route.ts
const TEN_MB = 10 * 1024 * 1024
if (buffer.byteLength > TEN_MB) {
  buffer = await sharp(buffer)
    .resize({ width: 2400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer()
  contentType = 'image/webp'
}
```

Images under 10 MB are uploaded as-is; the CDN handles optimisation at request time.

### Sanity Asset Upload (`client.assets.upload()`)

After optional compression, the image is uploaded to Sanity's asset store — not stored locally or in a third-party bucket:

```ts
const asset = await client.assets.upload('image', buffer, {
  filename: imageFile.name.replace(/\.[^.]+$/, '.webp'),
  contentType,
})
mainImage = {
  _type: 'image',
  asset: { _type: 'reference', _ref: asset._id },
  alt: title,
}
```

The returned asset `_id` is stored as a Sanity reference on the post — the CDN URL is resolved at render time using `urlFor`, so images are always served through Sanity's globally distributed CDN.

### LQIP Blur Placeholder

LQIP (Low Quality Image Placeholder) is fetched in GROQ via `metadata { lqip, dimensions }` and passed as `blurDataURL` to Next.js `<Image>` — gives an instant blurred preview while the full image loads:

```tsx
<Image
  src={urlFor(post.mainImage).width(1200).height(675).url()}
  placeholder={lqip ? 'blur' : 'empty'}
  blurDataURL={lqip}
/>
```

---

## 10. Public Author Interface with Voice Input & AI Editing

**Sanity feature demonstrated:** Sanity client write operations from a Next.js API route, programmatic document creation, find-or-create author pattern, `client.assets.upload()` from a public form.

### Custom Writing Form (`/write`)
A public-facing form — no login required — where anyone can write and publish a blog post directly to the site.

**Two-column layout:**
- Left: writing form (name, title, excerpt, body, voice recorder)
- Right: sticky AI editing assistant

### Voice Input with OpenAI Whisper
Contributors can dictate their article instead of typing. The browser records audio via the `MediaRecorder` API and sends it to `/api/transcribe`, which calls OpenAI Whisper (`whisper-1`). The transcribed text is appended to the body field.

```ts
// src/app/api/transcribe/route.ts
const transcription = await openai.audio.transcriptions.create({
  model: 'whisper-1',
  file: audio,
})
```

**Recording retention** — the audio blob is kept in memory after transcription. An `<audio>` player and a download link remain visible so contributors can replay the recording and verify accuracy. If transcription fails, the recording can be downloaded and used manually.

### AI Editing Assistant
Instead of passive feedback, contributors give the AI a direct editing instruction. The AI rewrites the entire body and presents the result for review — the contributor then accepts or discards it.

```ts
// src/app/api/ai-assist/route.ts (edit mode)
{
  role: 'system',
  content: 'Apply the given instruction to the article content. Return only the edited content.',
},
{
  role: 'user',
  content: `Instruction: ${instruction}\n\nContent:\n${content}`,
}
```

Example instructions shown as quick-select buttons in the UI:
- "Fix grammar and improve flow"
- "Make this 30% shorter"
- "Add a stronger introduction"
- "Rewrite in a friendlier tone"
- "Add subheadings to structure this"

The suggested rewrite appears in a read-only preview panel. The contributor clicks **Accept Changes** to replace the body, or **Discard** to keep the original.

### Optional Cover Image Upload
Contributors can attach a cover image directly from the form. A file picker with instant client-side preview is shown before upload. The image is processed server-side — compressed if needed, then uploaded to Sanity's asset store (see Section 9).

### Programmatic Publishing
The form submits to `/api/posts/create`, which:
1. Checks if an author with that name already exists in Sanity (avoids duplicates)
2. Creates a new `author` document if not found
3. Converts the plain text body to Portable Text blocks (splits on double newlines)
4. Creates a published `post` document via the Sanity write token

```ts
// src/app/api/posts/create/route.ts
const post = await client.create({
  _type: 'post',
  title,
  slug: { _type: 'slug', current: slugify(title) },
  body: textToPortableText(body),
  author: { _type: 'reference', _ref: authorId },
  publishedAt: new Date().toISOString(),
})
```

Posts are created without the `drafts.` prefix — they publish immediately and appear on the blog without any editorial approval.

---

## 11. AI-Assisted Content Tools

**Sanity feature demonstrated:** AI integration with the content pipeline via API routes, `aiSummary` field on post schema, OpenAI Whisper speech-to-text.

Two AI endpoints power the author experience:

### `/api/transcribe` — Voice-to-Text (Whisper)
Accepts a raw audio blob from the browser's `MediaRecorder` and calls OpenAI Whisper `whisper-1` to transcribe it. The transcription is appended to the article body. The original recording is always retained client-side so contributors can verify or download it if transcription is inaccurate.

### `/api/ai-assist` — Content Tools (GPT-4o)

| Mode | Input | Output | Used In |
|---|---|---|---|
| `summary` | Post body | 2-3 sentence summary | Studio action (stored in `aiSummary` field) |
| `seo` | Post content | `{ title, description }` JSON | Studio SEO helper |
| `edit` | Body + instruction | Rewritten body text | `/write` AI editing assistant |

The `edit` mode takes a free-form instruction ("make this more concise", "add subheadings") and rewrites the entire article body. The result is shown in a preview panel — contributors explicitly accept or discard it, keeping full control over the final content.

---

## 12. Multi-Language Support & Translation Workflow

**Sanity feature demonstrated:** Separate documents per locale linked via `reference`, custom `document.actions`, GROQ reverse reference joins, programmatic draft creation, human review workflow.

### Architecture: Separate Documents Per Language

Each language version is its own `post` document — not duplicate fields on the same document. This scales cleanly to N languages without ever touching the schema again.

| Field | Type | Purpose |
|---|---|---|
| `language` | `string` (`en` \| `zh`) | Which locale this document is |
| `translationOf` | `reference → post` | Points from the translation back to the source |
| `translationStatus` | `string` | `none` \| `pending_review` \| `approved` |
| `syncStatus` | `string` | `synced` \| `out_of_sync` (set by cron, see Section 13) |

All four fields are `readOnly: true` in the schema — they are only ever set programmatically, never by editors directly.

### Auto-Translation on Submit

When a contributor publishes via `/write`, the API creates the English post immediately (synchronously) and then runs translation in the background — the author's form response is never delayed:

```ts
// src/app/api/posts/create/route.ts
const post = await client.create({ ...englishFields, language: 'en' })

// Non-blocking — fires and forgets, errors are logged server-side
createTranslation({ sourceId: post._id, ...fields }).catch(console.error)

return NextResponse.json({ success: true, id: post._id })
```

The `createTranslation` function calls GPT-4o with `response_format: { type: 'json_object' }` to translate `title`, `excerpt`, and `body` in a single structured call:

```ts
const completion = await openai.chat.completions.create({
  model: 'gpt-4o',
  response_format: { type: 'json_object' },
  messages: [{
    role: 'system',
    content: 'Translate the given fields to Simplified Chinese. Return JSON: { title, excerpt, body }.',
  }, {
    role: 'user',
    content: JSON.stringify({ title, excerpt, body }),
  }],
})
```

### Translation Created as a Draft

The translated document is created with `_id: 'drafts.{sourceId}-zh'` — Sanity's native draft prefix. It appears in the Studio drafts list automatically, requiring no custom UI to surface it for review:

```ts
await client.createOrReplace({
  _id: `drafts.${sourceId}-zh`,
  _type: 'post',
  language: 'zh',
  translationOf: { _type: 'reference', _ref: sourceId },
  translationStatus: 'pending_review',
  ...translatedFields,
})
```

A webhook notification is fired to `REVIEW_WEBHOOK_URL` with the Studio deep-link so the reviewer goes directly to the pending draft.

### Studio Preview Badges

The post `preview.prepare` function reads `language`, `translationStatus`, and `syncStatus` to add badges directly in the Studio document list — no custom plugin needed:

```
My Article [ZH] ⏳       ← pending review
My Article [ZH] 🔄       ← approved but out of sync
My Article                ← English source, no badge
```

### Custom Document Actions

Two custom actions are registered on all `post` documents via `document.actions` in `sanity.config.ts`:

```ts
// sanity.config.ts
document: {
  actions: (prev, context) => {
    if (context.schemaType !== 'post') return prev
    return [ApproveTranslationAction, RetranslateAction, ...prev]
  },
},
```

**`ApproveTranslationAction`** — only visible when `translationStatus === 'pending_review'`. Clicking it:
1. Calls `publish.execute()` from `useDocumentOperation` — publishes the draft
2. Patches `translationStatus` to `'approved'` on the now-published document

**`RetranslateAction`** — visible on all published posts. The label auto-detects direction:
- On an English post → **"Re-translate → ZH"**
- On a Chinese post → **"Re-translate → EN"**

Clicking calls `PUT /api/posts/create` which reads the current document from Sanity, translates it, and creates a new `pending_review` draft of the other language — enabling true bidirectional sync on demand.

### Why Not the `@sanity/document-internationalization` Plugin?

The official plugin is a great choice for most projects. Here a manual approach was chosen deliberately to demonstrate the underlying Sanity primitives: `reference` fields for linking, programmatic draft creation, and custom `document.actions`. The same concepts power the plugin under the hood.

---

## 13. Translation Sync Cron Job

**Sanity feature demonstrated:** Vercel Cron Jobs calling a protected Next.js API route, GROQ reverse reference joins with `^._id`, Sanity transactions for batch patching.

### What It Checks

After a translation is approved, editors may continue updating the English source. The cron job detects drift by comparing `_updatedAt` timestamps on linked document pairs.

### Schedule

Defined in `vercel.json` — Vercel automatically injects `Authorization: Bearer {CRON_SECRET}` when calling the route:

```json
{
  "crons": [{ "path": "/api/cron/sync-check", "schedule": "0 */6 * * *" }]
}
```

Runs every 6 hours. The route returns `401` for any call without the correct bearer token.

### GROQ Reverse Reference Join

A single query fetches all English posts and their linked Chinese translations using GROQ's `^._id` self-reference pattern:

```groq
*[_type == "post" && language == "en"] {
  _id,
  _updatedAt,
  title,
  syncStatus,
  "zhTranslation": *[
    _type == "post" &&
    translationOf._ref == ^._id &&
    language == "zh"
  ][0] {
    _id,
    _updatedAt,
    translationStatus,
    syncStatus
  }
}
```

### Sync Logic

```
EN _updatedAt > ZH _updatedAt  AND  ZH translationStatus == 'approved'
→ mark both documents syncStatus: 'out_of_sync'

EN _updatedAt <= ZH _updatedAt  AND  either was previously 'out_of_sync'
→ clear both back to syncStatus: 'synced'
```

Only `approved` translations are checked — `pending_review` ones are intentionally behind and would generate false-positive noise.

### Batch Patching via Transaction

All mutations are batched into a single Sanity transaction per run to minimise API calls:

```ts
const tx = client.transaction()
for (const pair of outOfSync) {
  tx.patch(pair.enId, (p) => p.set({ syncStatus: 'out_of_sync' }))
  tx.patch(pair.zhId, (p) => p.set({ syncStatus: 'out_of_sync' }))
}
await tx.commit()
```

### Developer Notification

If any pairs are out of sync, a webhook fires to `REVIEW_WEBHOOK_URL` with a formatted list of affected posts and their Studio links. The developer then uses the **"Re-translate"** document action to queue a new pending draft.

### Testing Locally

```bash
curl -H "Authorization: Bearer your-cron-secret" \
  http://localhost:3000/api/cron/sync-check
```

Returns:
```json
{
  "checked": 5,
  "outOfSync": 1,
  "resynced": 0,
  "details": [{ "enId": "...", "zhId": "...", "title": "...", "enUpdated": "...", "zhUpdated": "..." }]
}
```

---

## 14. Sanity Blueprints

**Sanity feature demonstrated:** Infrastructure as Code, `defineBlueprint`, `defineDocumentFunction`, declarative resource management.

`sanity.blueprint.ts` at the project root defines a Document Function that triggers on blog post unpublish — designed to call an AI review function and return feedback to the editor before the post goes live.

```ts
// sanity.blueprint.ts
export default defineBlueprint({
  resources: [
    defineDocumentFunction({
      name: 'ai-blog-review',
      title: 'AI Blog Draft Review',
      type: 'document.action',
      trigger: { on: 'unpublish', documentTypes: ['post'] },
    }),
  ],
})
```

Blueprints treat Sanity infrastructure (webhooks, functions, datasets, CORS origins) as code — the same way Terraform treats cloud infrastructure. Changes are version-controlled, reviewable in PRs, and applied with `sanity blueprints deploy`.

---

## 15. Studio Access Control

**Sanity feature demonstrated:** Protecting the embedded Studio route from public access using Next.js middleware.

The `/studio` route is restricted to developers using **HTTP Basic Auth** via Next.js middleware:

```ts
// middleware.ts
if (!pathname.startsWith('/studio')) return NextResponse.next()
const expected = `Basic ${btoa(`dev:${process.env.STUDIO_ACCESS_KEY}`)}`
if (authHeader !== expected) {
  return new NextResponse('Developer access only', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Sanity Studio"' },
  })
}
```

- Set `STUDIO_ACCESS_KEY` in `.env.local` to enable protection
- No key set in production → access blocked entirely
- No key set in development → Studio is open (developer convenience)

Public content contributors use `/write` — they never need Studio access.

---

## 16. Seed Script

`scripts/seed.mjs` populates a fresh Sanity dataset with realistic fixture data using only Node.js built-ins and `@sanity/client` — no extra dependencies.

```bash
npm run seed
```

Creates:
- 1 author (Alex Morgan)
- 3 categories (Engineering, Design Systems, Headless CMS)
- 5 blog posts with full Portable Text bodies
- 5 case studies with client details, tech stacks, and project descriptions

Requires a `SANITY_API_WRITE_TOKEN` with **Editor** role in `.env.local`.

---

## 17. Project Structure

```
santiy_demo/
├── middleware.ts                        # Studio Basic Auth protection
├── sanity.config.ts                     # Studio config + custom document actions
├── sanity.cli.ts                        # CLI + TypeGen configuration
├── sanity.blueprint.ts                  # Infrastructure as Code (Blueprints)
├── sanity.types.ts                      # Auto-generated TypeScript types (TypeGen)
├── vercel.json                          # Cron job schedule
├── scripts/
│   └── seed.mjs                         # Dataset seeding script
└── src/
    ├── app/
    │   ├── (frontend)/
    │   │   ├── layout.tsx               # SanityLive + VisualEditing + Nav
    │   │   ├── page.tsx                 # Landing page (Page Builder)
    │   │   ├── blog/
    │   │   │   ├── page.tsx             # Blog listing (pagination + category filter)
    │   │   │   └── [slug]/page.tsx      # Blog post (Portable Text + JSON-LD)
    │   │   ├── case-studies/
    │   │   │   ├── page.tsx             # Case studies grid
    │   │   │   └── [slug]/page.tsx      # Case study detail
    │   │   └── write/
    │   │       └── page.tsx             # Public author form (voice + AI editing)
    │   ├── studio/[[...tool]]/
    │   │   ├── page.tsx                 # Studio route (metadata, server)
    │   │   └── Studio.tsx               # NextStudio client component
    │   ├── api/
    │   │   ├── ai-assist/route.ts       # OpenAI: summary / seo / edit
    │   │   ├── transcribe/route.ts      # Whisper voice transcription
    │   │   ├── posts/create/route.ts    # Post creation + auto-translation (PUT = retranslate)
    │   │   ├── cron/sync-check/route.ts # Translation sync cron endpoint
    │   │   ├── draft-mode/enable/       # Draft Mode activation
    │   │   ├── revalidate/tag/          # Webhook tag revalidation
    │   │   └── og/route.tsx             # Dynamic OG image (Edge)
    │   ├── sitemap.ts                   # Dynamic sitemap from Sanity
    │   └── robots.ts                    # robots.txt
    ├── components/
    │   ├── PageBuilder.tsx              # Switch-based block renderer
    │   ├── blocks/
    │   │   ├── Hero.tsx
    │   │   ├── Features.tsx
    │   │   └── Testimonials.tsx
    │   ├── PortableTextContent.tsx      # Custom Portable Text renderer
    │   ├── BlogCard.tsx
    │   ├── CaseStudyCard.tsx
    │   ├── CategoryFilter.tsx           # Client-side category filter
    │   ├── Pagination.tsx
    │   ├── Nav.tsx
    │   └── BlogJsonLd.tsx               # JSON-LD Article schema
    ├── components/
    │   └── FieldToolbar.tsx             # Reusable mic + polish AI toolbar for text fields
    └── sanity/
        ├── lib/
        │   ├── client.ts                # createClient (with stega config)
        │   ├── live.ts                  # defineLive (SanityLive + sanityFetch)
        │   ├── image.ts                 # urlFor image builder
        │   ├── token.ts                 # Server-only read token
        │   └── queries.ts              # All GROQ queries (defineQuery)
        ├── actions/
        │   └── translationActions.tsx   # ApproveTranslation + Retranslate document actions
        ├── schemaTypes/
        │   ├── documents/               # post (+ translation fields), author, category, caseStudy, settings, landingPage
        │   ├── objects/                 # seo, link
        │   └── blocks/                 # hero, features, testimonials, pageBuilder
        └── structure/
            └── index.ts                 # Custom Studio desk structure
```

---

## Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project identifier |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Usually `production` |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Yes | API version date e.g. `2026-02-01` |
| `SANITY_API_READ_TOKEN` | Yes | Viewer token — Live Content API + Draft Mode |
| `SANITY_API_WRITE_TOKEN` | Yes | Editor token — public post creation + seed script |
| `SANITY_REVALIDATE_SECRET` | Yes | Shared secret for webhook signature verification |
| `STUDIO_ACCESS_KEY` | Yes | Password for `/studio` Basic Auth |
| `OPENAI_API_KEY` | Yes | Powers editing assistant, voice transcription, translation, summary, SEO |
| `NEXT_PUBLIC_SITE_URL` | Yes | Production domain — used in `metadataBase` and Studio deep-links in notifications |
| `REVIEW_WEBHOOK_URL` | Optional | Webhook URL (Slack/Discord/etc.) for translation review and sync-drift notifications |
| `CRON_SECRET` | Yes (prod) | Bearer token Vercel injects when calling the cron route — prevents public access |

---

## Sanity Features Coverage Summary

| Sanity Feature | Where Demonstrated |
|---|---|
| `defineType` / `defineField` / `defineArrayMember` | All schema files |
| Reusable object types | `seo.ts`, `link.ts` |
| Conditional fields (`hidden`) | `link.ts` (internal vs external) |
| Field groups | `post.ts`, `case-study.ts` |
| Block previews | All page builder blocks |
| Singleton pattern via structure | `settings`, `landingPage` |
| Custom desk structure | `src/sanity/structure/index.ts` |
| Page Builder (array of typed objects) | `landingPage` + `PageBuilder.tsx` |
| Portable Text with custom components | `post.body`, `caseStudy.body` + `PortableTextContent.tsx` |
| References vs embedded objects | `post.author` (ref) vs `post.seo` (object) |
| GROQ `defineQuery` | `src/sanity/lib/queries.ts` |
| GROQ `coalesce()` for fallbacks | SEO fragment in all page queries |
| GROQ offset pagination | Blog listing |
| GROQ reverse references (post counts) | `CATEGORIES_QUERY` |
| TypeGen (auto type generation) | `sanity.cli.ts` + all queries |
| `defineLive` / `SanityLive` | `live.ts` + `(frontend)/layout.tsx` |
| Visual Editing / Stega | `layout.tsx` + `stegaClean` in components |
| `stega: false` for metadata | All `generateMetadata` functions |
| Draft Mode | `/api/draft-mode/enable/route.ts` |
| Tag-based webhook revalidation | `/api/revalidate/tag/route.ts` |
| `@sanity/image-url` + LQIP | `image.ts` + all image components |
| CDN delivery optimisations (`auto`, `fit`, `quality`) | `image.ts` — applied globally via `urlFor` |
| `client.assets.upload()` | `/api/posts/create/route.ts` |
| Server-side image compression (`sharp`) | `/api/posts/create/route.ts` — >10 MB uploads |
| Programmatic document creation | `/api/posts/create/route.ts` |
| OpenAI Whisper voice transcription | `/api/transcribe/route.ts` |
| AI editing assistant (free-form instruction → rewrite) | `/api/ai-assist/route.ts` (`edit` mode) |
| Multi-locale separate documents (`language`, `translationOf`) | `post.ts` schema — translation fields |
| Programmatic draft creation (`drafts.` prefix) | `/api/posts/create/route.ts` — translation flow |
| GROQ reverse reference join (`^._id`) | `/api/cron/sync-check/route.ts` |
| Custom `document.actions` (Approve + Retranslate) | `sanity/actions/translationActions.tsx` + `sanity.config.ts` |
| `useDocumentOperation` (`publish.execute()`) | `ApproveTranslationAction` |
| Sanity transaction (batch patches) | `/api/cron/sync-check/route.ts` |
| Vercel Cron Job (scheduled API route) | `vercel.json` + `/api/cron/sync-check/route.ts` |
| Webhook notification (translation review + sync drift) | `createTranslation()` + cron route |
| Sanity Blueprints | `sanity.blueprint.ts` |
| Embedded Studio in Next.js | `src/app/studio/[[...tool]]/` |
| `generateStaticParams` + `dynamicParams = false` | `blog/[slug]`, `case-studies/[slug]` |
| `metadataBase` + canonical URLs | Root layout + all page metadata |
| `openGraph.type: 'article'` + `publishedTime` | Blog post + case study metadata |
| OG image fallback chain (SEO → cover → none) | Blog post + case study `generateMetadata` |
| JSON-LD `Article` schema | `BlogJsonLd.tsx` |
| Dynamic sitemap | `app/sitemap.ts` |
| `noIndex` per document | `post.seo.noIndex`, `caseStudy.seo.noIndex` |
