# SEO Strategy

This document explains the SEO approach used in this project — what techniques are applied, where they live in the codebase, and why each decision was made.

---

## Core Principle

**Render on the server, never on the client.**

Every public-facing page is a Next.js Server Component. Content is fully rendered to HTML before it reaches the browser, so search engine crawlers receive complete, indexable pages — not JavaScript bundles that require execution to show content.

---

## 1. Static Pre-rendering with `generateStaticParams`

Detail pages (blog posts, case studies) are pre-rendered at build time using `generateStaticParams`. Next.js fetches every published slug from Sanity and generates a static HTML file for each one.

```ts
// src/app/(frontend)/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const slugs = await client.withConfig({ useCdn: false }).fetch(POST_SLUGS_QUERY)
  return slugs ?? []
}
```

**Why:** Static pages are served from the CDN edge — zero server latency, instant TTFB (Time to First Byte). Google's Core Web Vitals (LCP, FID, CLS) are directly tied to page speed, which is a ranking signal.

### `dynamicParams = false`

```ts
export const dynamicParams = false
```

Set on both `blog/[slug]` and `case-studies/[slug]`. Without this, Next.js falls back to dynamic rendering for any slug not known at build time — unknown slugs would receive a slow, dynamically rendered error page instead of a clean 404. A clean 404 is faster and tells crawlers definitively that the page does not exist.

---

## 2. `metadataBase` — Absolute URLs for Everything

```ts
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  ...
}
```

**Why:** Open Graph images, canonical URLs, and Twitter card images must be absolute URLs (including protocol and domain). Without `metadataBase`, Next.js emits relative paths — social crawlers (Twitter, LinkedIn, Slack unfurlers) cannot resolve them, so link previews silently break. Set `NEXT_PUBLIC_SITE_URL` to your production domain in `.env.local`.

---

## 3. `generateMetadata` — Per-Page Dynamic Metadata

Every route exports a `generateMetadata` function. This runs on the server at request time (or at build time for static routes) and generates `<title>`, `<meta description>`, Open Graph tags, and canonical links.

```ts
// src/app/(frontend)/blog/[slug]/page.tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: post } = await getPost(params, false) // stega: false — no invisible chars in <title>
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

**Title template** — defined once in the root layout, applied everywhere:
```ts
title: { default: 'Portfolio', template: '%s | Portfolio' }
```
A post titled "Intro to GROQ" renders as `<title>Intro to GROQ | Portfolio</title>`.

**`stega: false` on metadata fetches** — Sanity's Visual Editing injects invisible Unicode characters into string fields for click-to-edit overlays. These must be stripped before writing to `<title>` or `<meta>` tags, or crawlers will see garbled text.

---

## 4. Canonical URLs

Every page declares its canonical URL via `alternates.canonical`.

| Page | Canonical |
|---|---|
| Home | `/` |
| Blog listing | `/blog` (page 1) or `/blog?page=N` / `/blog?category=slug` |
| Blog post | `/blog/[slug]` |
| Case studies listing | `/case-studies` |
| Case study | `/case-studies/[slug]` |

**Why:** The blog listing supports pagination (`?page=2`) and category filtering (`?category=engineering`). Without explicit canonicals, crawlers may index these as separate duplicate pages and split link equity across them. The canonical tells crawlers which URL is authoritative.

```ts
// src/app/(frontend)/blog/page.tsx — canonical respects active filters
const params = new URLSearchParams()
if (categorySlug) params.set('category', categorySlug)
if (pageParam && pageParam !== '1') params.set('page', pageParam)
const qs = params.toString()
return {
  alternates: { canonical: qs ? `/blog?${qs}` : '/blog' },
}
```

Page 1 without filters is always `/blog` (no `?page=1` in the canonical).

---

## 5. Open Graph & Social Card Images

### Hierarchy

Each page resolves its Open Graph image through a fallback chain — the most specific wins:

**Blog posts:**
1. Dedicated SEO image set in Studio (`post.seo.image`)
2. Post cover image uploaded via `/write` form (`post.mainImage`)
3. No image (social card renders title-only)

**Case studies:**
1. Dedicated SEO image (`caseStudy.seo.image`)
2. Case study cover image (`caseStudy.coverImage`)
3. No image

```ts
const ogImage = post.seo?.image
  ? urlFor(post.seo.image).width(1200).height(630).url()
  : post.mainImage?.asset
    ? urlFor(post.mainImage).width(1200).height(630).url()
    : undefined
```

All OG images are served at **1200×630** — the standard size recommended by Open Graph spec and required for full-size previews on Twitter/X.

### Dynamic OG Images

`/api/og?id=<documentId>` generates 1200×630 images at the edge using `next/og` — useful as a fallback when no image has been uploaded.

### `openGraph.type`

| Page type | `og:type` |
|---|---|
| Home, listings | `website` |
| Blog posts | `article` |
| Case studies | `article` |

The `article` type unlocks additional Open Graph properties (`publishedTime`, `authors`) which Google uses to surface content in Discover and News.

---

## 6. JSON-LD Structured Data

Blog posts inject `Article` schema markup via `<BlogJsonLd>` using the `schema-dts` library for type safety:

```tsx
// src/components/BlogJsonLd.tsx
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "...",
  "author": { "@type": "Person", "name": "..." },
  "datePublished": "...",
  "image": "..."
}
</script>
```

**Why:** Structured data enables rich results in Google Search (article carousels, author bylines, dates). It is separate from Open Graph — OG is for social platforms, JSON-LD is for search engines.

---

## 7. Dynamic Sitemap

`src/app/sitemap.ts` queries Sanity at build time and generates `sitemap.xml` from live content:

```ts
// Includes every published post and case study slug
const posts = await client.fetch(SITEMAP_QUERY)
return posts.map((post) => ({
  url: `${base}/blog/${post.slug}`,
  lastModified: post._updatedAt,
  changeFrequency: 'weekly',
  priority: 0.8,
}))
```

**Why:** A sitemap tells crawlers exactly what pages exist and when they were last updated — critical for large sites or sites with content that changes frequently. New posts added via the `/write` form appear in the sitemap on the next build.

---

## 8. `robots.txt`

`src/app/robots.ts` generates `robots.txt` programmatically:

```ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/studio/' },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

The Studio (`/studio`) is explicitly disallowed — there is no indexable content there, and blocking it prevents crawl budget from being wasted.

---

## 9. SEO Fallbacks in GROQ

SEO metadata fallback logic lives in the GROQ query, not in component code. This keeps components clean and ensures the correct value is always returned in a single fetch:

```groq
"seo": {
  "title":       coalesce(seo.title, title, ""),
  "description": coalesce(seo.description, excerpt, ""),
  "noIndex":     seo.noIndex == true
}
```

`coalesce()` returns the first non-null value. If an editor hasn't filled in a custom SEO title, the post title is used automatically.

---

## 10. `noIndex` Support

Every document type with public pages (`post`, `caseStudy`, `landingPage`) has a `noIndex` boolean in its SEO object. When set to `true`, `generateMetadata` emits `robots: 'noindex'`:

```ts
robots: post.seo?.noIndex ? 'noindex' : undefined,
```

Editors can mark draft content, private case studies, or test pages as non-indexable directly from the Studio without touching code.

---

## Environment Variable

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Production domain (e.g. `https://your-domain.com`). Used as `metadataBase` — without it, OG images and canonicals are relative and will not work on social platforms or in search results. |

Set this in `.env.local` for local development and in your hosting provider's environment config for production.

---

## Summary Table

| Technique | Where | Benefit |
|---|---|---|
| Server Components (no `'use client'`) | All public pages | Fully rendered HTML for crawlers |
| `generateStaticParams` | `blog/[slug]`, `case-studies/[slug]` | CDN-cached static pages, fast TTFB |
| `dynamicParams = false` | Detail pages | Clean 404 for unknown slugs |
| `metadataBase` | Root layout | Absolute URLs in all metadata tags |
| `generateMetadata` | Every route | Page-specific `<title>`, description, OG tags |
| Title template (`%s \| Portfolio`) | Root layout | Consistent branding across all page titles |
| `stega: false` on metadata fetches | All `generateMetadata` functions | Prevents Visual Editing characters corrupting `<title>` |
| Canonical URLs | All pages | Prevents duplicate content from pagination/filtering |
| `openGraph.type: 'article'` | Post + case study pages | Unlocks rich article signals in Google Discover |
| OG image fallback chain | Post + case study metadata | Maximum social card coverage |
| JSON-LD `Article` schema | Blog post pages | Enables rich results in Google Search |
| Dynamic sitemap | `app/sitemap.ts` | Crawl discovery for all published content |
| `robots.txt` with Studio disallow | `app/robots.ts` | Protects crawl budget |
| GROQ `coalesce()` for SEO fallbacks | `queries.ts` | Always-populated metadata without component logic |
| `noIndex` flag per document | All content types | Editor-controlled indexing from Studio |
