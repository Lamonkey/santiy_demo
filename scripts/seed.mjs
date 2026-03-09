/**
 * Seed script — creates 1 author, 3 categories, 5 blog posts, 5 case studies
 *
 * Requires a SANITY_API_WRITE_TOKEN in .env.local:
 *   sanity.io/manage → your project → API → Tokens → Add (Editor role)
 *
 * Run:
 *   npm run seed
 */

import { createClient } from '@sanity/client'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse .env.local manually
function loadEnv() {
  try {
    const envPath = resolve(__dirname, '../.env.local')
    const raw = readFileSync(envPath, 'utf8')
    for (const line of raw.split('\n')) {
      const [key, ...rest] = line.split('=')
      if (key && rest.length) process.env[key.trim()] = rest.join('=').trim()
    }
  } catch {
    // .env.local not found — rely on existing env vars
  }
}

loadEnv()

const {
  NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET,
  SANITY_API_WRITE_TOKEN,
} = process.env

if (!NEXT_PUBLIC_SANITY_PROJECT_ID) {
  console.error('❌ Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local')
  process.exit(1)
}
if (!SANITY_API_WRITE_TOKEN) {
  console.error('❌ Missing SANITY_API_WRITE_TOKEN in .env.local')
  console.error('   Get one at: sanity.io/manage → API → Tokens → Add (Editor role)')
  process.exit(1)
}

const client = createClient({
  projectId: NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2026-02-01',
  token: SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// ─── Data ────────────────────────────────────────────────────────────────────

const author = {
  _type: 'author',
  name: 'Alex Morgan',
  role: 'Senior Engineer & Writer',
  bio: [
    {
      _type: 'block',
      _key: 'bio-block-1',
      style: 'normal',
      children: [{ _type: 'span', _key: 'bio-span-1', text: 'Alex is a full-stack engineer with 8 years of experience building scalable web products. Passionate about developer experience, content infrastructure, and open-source tooling.' }],
      markDefs: [],
    },
  ],
  socialLinks: {
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com',
  },
}

const categories = [
  { _type: 'category', title: 'Engineering', slug: { _type: 'slug', current: 'engineering' }, description: 'Deep dives into software engineering topics' },
  { _type: 'category', title: 'Design Systems', slug: { _type: 'slug', current: 'design-systems' }, description: 'Building scalable design systems' },
  { _type: 'category', title: 'Headless CMS', slug: { _type: 'slug', current: 'headless-cms' }, description: 'Content infrastructure and CMS architecture' },
]

function makeBody(paragraphs) {
  return paragraphs.map((text, i) => ({
    _type: 'block',
    _key: `block-${i}`,
    style: 'normal',
    children: [{ _type: 'span', _key: `span-${i}`, text }],
    markDefs: [],
  }))
}

const posts = [
  {
    title: 'Why Headless CMS Is the Future of Content Infrastructure',
    slug: 'why-headless-cms-is-the-future',
    excerpt: 'Traditional CMS platforms couple content with presentation, creating bottlenecks for modern teams. Here's why going headless unlocks scalability and speed.',
    publishedAt: '2025-11-10T09:00:00Z',
    featured: true,
    categoryIndex: 2,
    body: makeBody([
      'The traditional CMS model — where content, templates, and delivery live under one roof — made sense in 2005. Today, it creates friction at every layer of the stack.',
      'Headless CMS separates the content repository from the presentation layer. Your content lives in a structured API, and your frontend team chooses the best tools for delivery: React, Vue, mobile apps, voice interfaces, or whatever comes next.',
      'With Sanity.io, content becomes a structured data layer. GROQ queries give you surgical control over what you fetch, and the Studio gives editors a purpose-built interface — not a generic WordPress dashboard.',
      'The result is faster deploys, better editor UX, and a content model that outlasts any single frontend framework.',
    ]),
  },
  {
    title: 'GROQ vs GraphQL: Choosing the Right Query Language for Your CMS',
    slug: 'groq-vs-graphql-for-cms',
    excerpt: 'Both GROQ and GraphQL are powerful ways to query structured content. We break down the tradeoffs so you can pick the right tool for your project.',
    publishedAt: '2025-12-01T09:00:00Z',
    featured: false,
    categoryIndex: 0,
    body: makeBody([
      'If you\'re evaluating headless CMS options, you\'ve likely encountered both GROQ and GraphQL as query languages. They solve the same core problem — fetching exactly the data you need — but with very different philosophies.',
      'GraphQL is schema-first and strongly typed. It integrates well with existing toolchains and has a massive ecosystem. The downside: setting up resolvers and schemas adds overhead, especially for content teams moving quickly.',
      'GROQ (Graph-Relational Object Queries) is Sanity\'s native query language. It\'s designed specifically for document-oriented content. The syntax is terse, joins are first-class, and filtering is expressive with minimal boilerplate.',
      'For pure content delivery — blog posts, landing pages, product listings — GROQ wins on developer ergonomics. For complex application graphs with multiple data sources, GraphQL\'s ecosystem is hard to beat.',
    ]),
  },
  {
    title: 'Building a Design Token System with Sanity',
    slug: 'design-token-system-with-sanity',
    excerpt: 'Design tokens are the atomic values that power your design system. Learn how to manage them in Sanity and distribute them to your frontend, Figma, and mobile apps.',
    publishedAt: '2026-01-15T09:00:00Z',
    featured: false,
    categoryIndex: 1,
    body: makeBody([
      'Design tokens — colors, spacing, typography scales, and border radii — are the single source of truth for your design system. But where should they live?',
      'Storing tokens in Sanity gives you version control, editor tooling, and an API. Non-engineers can safely update brand colors. Developers consume them via GROQ. Style Dictionary transforms them into platform-specific outputs.',
      'A simple Sanity schema for a color token includes a name, a hex value, a semantic role (primary, surface, error), and optional dark mode overrides. This structure maps directly to CSS custom properties and Tailwind config values.',
      'The result: one content model that drives your web app, iOS tokens, Android resources, and Figma variables — all from a single editorial interface.',
    ]),
  },
  {
    title: 'Portable Text: Rich Text Done Right',
    slug: 'portable-text-rich-text-done-right',
    excerpt: 'Portable Text is an open specification for rich text that serializes to JSON. Here\'s why it\'s a better foundation than HTML-in-a-database.',
    publishedAt: '2026-01-28T09:00:00Z',
    featured: false,
    categoryIndex: 2,
    body: makeBody([
      'Most CMS platforms store rich text as HTML blobs. This creates tight coupling between your content and your rendering layer — change your markup, and old content breaks.',
      'Portable Text stores rich text as a structured JSON array. Each block is a typed object with explicit marks, annotations, and custom types. The structure is renderer-agnostic: the same content renders beautifully in React, a PDF generator, or a screen reader.',
      'Custom blocks extend the spec. Need an embedded interactive chart? A pull quote with attribution? A code snippet with syntax highlighting? Define it once in your schema, render it differently per surface.',
      'The @portabletext/react library handles the heavy lifting. Pass a components map, and every block type gets a purpose-built React component. No more innerHTML hacks.',
    ]),
  },
  {
    title: 'TypeScript-First CMS Development with Sanity TypeGen',
    slug: 'typescript-first-cms-with-typegen',
    excerpt: 'TypeGen auto-generates TypeScript types from your Sanity schema and GROQ queries. Here\'s how to set up a fully typed content pipeline.',
    publishedAt: '2026-02-10T09:00:00Z',
    featured: false,
    categoryIndex: 0,
    body: makeBody([
      'One of the biggest pain points in CMS-driven development is the gap between your content model and your TypeScript types. You add a field in Sanity, forget to update the type, and ship a bug.',
      'Sanity TypeGen closes this loop automatically. Enable it in sanity.cli.ts, and it scans your schema and all defineQuery() calls, then outputs a fully typed sanity.types.ts file.',
      'With overloadClientMethods: true, even client.fetch() returns inferred types. No manual type imports. No drift between schema and code. If a field doesn\'t exist, TypeScript tells you before you deploy.',
      'Pair it with watch mode during development — types regenerate on every schema change. This is the closest thing to a type-safe CMS pipeline available today.',
    ]),
  },
]

const caseStudies = [
  {
    title: 'Rebuilding a Media Company\'s Content Platform on Sanity',
    slug: 'media-company-content-platform',
    excerpt: 'A leading digital publisher migrated from a monolithic CMS to a headless architecture, cutting publish time from hours to minutes.',
    client: 'NorthStar Media',
    industry: 'Digital Publishing',
    services: ['Architecture', 'CMS Migration', 'Frontend Development'],
    technologies: ['Sanity.io', 'Next.js', 'Vercel', 'TypeScript'],
    projectUrl: 'https://example.com',
    publishedAt: '2025-09-01T00:00:00Z',
    body: makeBody([
      'NorthStar Media was operating a legacy WordPress multisite with 12 editors and 300,000 monthly readers. Publishing a new article required navigating a 23-step workflow. Breaking news took 40 minutes to go live.',
      'We redesigned the entire content pipeline around Sanity. Custom desk structure eliminated unnecessary UI noise. Conditional fields reduced the average form size by 60%. Editors could publish in under 3 minutes.',
      'The frontend moved to Next.js with Incremental Static Regeneration. Tag-based revalidation meant updated articles appeared on the site within seconds of saving in the Studio.',
      'Six months post-launch: page load times dropped 62%, editorial satisfaction scores increased significantly, and the team shipped two new content verticals without any developer involvement.',
    ]),
  },
  {
    title: 'E-Commerce Storefront with Sanity + Shopify',
    slug: 'ecommerce-storefront-sanity-shopify',
    excerpt: 'A fashion brand wanted editorial control over their product pages without touching Shopify\'s rigid templates. Sanity provided the content layer.',
    client: 'Meridian Apparel',
    industry: 'E-Commerce / Fashion',
    services: ['Content Modeling', 'Shopify Integration', 'Performance Optimization'],
    technologies: ['Sanity.io', 'Shopify', 'Next.js', 'Tailwind CSS'],
    projectUrl: 'https://example.com',
    publishedAt: '2025-10-15T00:00:00Z',
    body: makeBody([
      'Meridian Apparel\'s merchandising team wanted to create editorial-quality product pages — story-driven layouts with photography, video, and brand copy — but Shopify\'s template system was too rigid.',
      'We used Sanity as the content layer and Shopify as the commerce layer. Product pages were composed in a Sanity page builder: full-bleed hero images, feature grids, size guides, and editorial lookbooks — all manageable by the marketing team without developer help.',
      'Shopify handled inventory, checkout, and fulfillment. Sanity handled everything the customer sees before clicking "Add to cart." The two systems communicated via product ID references.',
      'The result was a 34% increase in time-on-page and a 19% improvement in conversion rate on editorial product pages compared to standard template pages.',
    ]),
  },
  {
    title: 'Developer Documentation Platform',
    slug: 'developer-documentation-platform',
    excerpt: 'An API company needed versioned, searchable developer docs with code examples that non-engineers could maintain. We built it on Sanity.',
    client: 'Stackline API',
    industry: 'Developer Tools',
    services: ['Information Architecture', 'Custom Studio Components', 'Search Integration'],
    technologies: ['Sanity.io', 'Next.js', 'Algolia', 'TypeScript'],
    projectUrl: 'https://example.com',
    publishedAt: '2025-11-20T00:00:00Z',
    body: makeBody([
      'Stackline\'s developer docs lived in a Git repository as Markdown files. This worked fine for engineers but created a wall for developer relations and technical writers who needed to make frequent updates.',
      'We built a documentation platform with Sanity as the authoring layer. The schema modeled docs as versioned sections with structured code blocks, API parameter tables, and changelog entries — all typed and validated.',
      'Custom Portable Text components rendered syntax-highlighted code examples. A custom input component let authors toggle between multiple code language tabs (JavaScript, Python, cURL) for each example block.',
      'Algolia integration indexed all content on publish. Developers got instant, accurate search across the entire docs site. Time to first meaningful search result dropped from 4 seconds to under 200ms.',
    ]),
  },
  {
    title: 'Multilingual Marketing Site for a SaaS Product',
    slug: 'multilingual-marketing-site-saas',
    excerpt: 'A B2B SaaS company needed their marketing site in 6 languages with regional pricing — all managed by a small marketing team.',
    client: 'Forma Analytics',
    industry: 'B2B SaaS',
    services: ['Localization Architecture', 'Page Builder', 'Regional Pricing'],
    technologies: ['Sanity.io', 'Next.js', 'i18n', 'Vercel Edge'],
    projectUrl: 'https://example.com',
    publishedAt: '2026-01-05T00:00:00Z',
    body: makeBody([
      'Forma Analytics was expanding into European and Asian markets. Their English-only marketing site needed to serve audiences in 6 languages across 12 regional pricing configurations.',
      'We implemented field-level localization in Sanity. Each localized field stored a map of locale keys to values. The marketing team could see all languages side-by-side in a single document — no duplicate pages to manage.',
      'A custom price table block handled regional pricing with currency formatting. Editors set base prices in USD, and the schema supported per-locale overrides for markets with different pricing strategies.',
      'Deployment used Next.js middleware for locale detection and Vercel Edge for geo-based routing. The full localization system — 6 languages, 12 regions — was live in 8 weeks.',
    ]),
  },
  {
    title: 'University Course Catalogue and Student Portal',
    slug: 'university-course-catalogue-portal',
    excerpt: 'A university replaced their outdated course catalogue system with a Sanity-powered platform that faculty can update themselves.',
    client: 'Westbrook University',
    industry: 'Higher Education',
    services: ['Content Modeling', 'Custom Studio UX', 'SSG + ISR'],
    technologies: ['Sanity.io', 'Next.js', 'TypeScript', 'Tailwind CSS'],
    projectUrl: 'https://example.com',
    publishedAt: '2026-02-01T00:00:00Z',
    body: makeBody([
      'Westbrook University\'s course catalogue was a static PDF updated once per semester by the registrar\'s office. Faculty had no way to update their own course descriptions, and students were often working from outdated information.',
      'We built a Sanity-powered catalogue with role-based Studio access. Faculty could log in and update their course descriptions, prerequisites, and syllabi directly. The registrar retained control over structural data like course codes and credit hours.',
      'The schema modeled courses with references to departments, faculty, and degree programs. GROQ queries powered a search and filter experience — students could find courses by department, level, day of week, or instructor.',
      'Static generation with on-demand revalidation meant the site was fast for students and fresh for faculty. The registrar\'s update cycle dropped from quarterly to real-time.',
    ]),
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function create(doc, label) {
  const result = await client.create(doc)
  console.log(`  ✓ ${label} (${result._id})`)
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱 Seeding Sanity dataset...\n')

  // Author
  console.log('Creating author...')
  const createdAuthor = await create(author, author.name)

  // Categories
  console.log('\nCreating categories...')
  const createdCategories = []
  for (const cat of categories) {
    const result = await create(cat, cat.title)
    createdCategories.push(result)
  }

  // Blog posts
  console.log('\nCreating blog posts...')
  for (const post of posts) {
    const { categoryIndex, ...rest } = post
    await create(
      {
        _type: 'post',
        ...rest,
        slug: { _type: 'slug', current: rest.slug },
        author: { _type: 'reference', _ref: createdAuthor._id },
        categories: [{ _type: 'reference', _ref: createdCategories[categoryIndex]._id }],
      },
      `"${rest.title}"`
    )
  }

  // Case studies
  console.log('\nCreating case studies...')
  for (const cs of caseStudies) {
    await create(
      {
        _type: 'caseStudy',
        ...cs,
        slug: { _type: 'slug', current: cs.slug },
      },
      `"${cs.title}"`
    )
  }

  console.log('\n✅ Done! Visit your Studio to see the seeded content.\n')
}

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message)
  process.exit(1)
})
