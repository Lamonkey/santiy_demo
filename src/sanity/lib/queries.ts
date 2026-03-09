import { defineQuery } from 'next-sanity'

// Fragments
const imageFragment = /* groq */ `
  asset->{
    _id,
    url,
    metadata { lqip, dimensions }
  },
  alt
`

const seoFragment = /* groq */ `
  "seo": {
    "title": coalesce(seo.title, title, ""),
    "description": coalesce(seo.description, excerpt, ""),
    "image": seo.image,
    "noIndex": seo.noIndex == true
  }
`

// Settings
export const SETTINGS_QUERY = defineQuery(`
  *[_id == "settings"][0]{
    siteName,
    siteDescription,
    nav[]{
      label,
      linkType,
      externalUrl,
      internalRef->{ _type, slug }
    },
    footer,
    seo { title, description, image, noIndex }
  }
`)

// Landing Page
export const LANDING_PAGE_QUERY = defineQuery(`
  *[_id == "landingPage"][0]{
    title,
    pageBuilder[]{
      _key,
      _type,
      _type == "hero" => {
        headline,
        subheadline,
        image { ${imageFragment} },
        align,
        ctas[]{ _key, label, linkType, externalUrl, internalRef->{ _type, slug } }
      },
      _type == "features" => {
        title,
        subtitle,
        columns,
        items[]{ _key, title, description, icon }
      },
      _type == "testimonials" => {
        title,
        items[]{
          _key,
          quote,
          authorName,
          authorTitle,
          authorImage { ${imageFragment} }
        }
      }
    },
    ${seoFragment}
  }
`)

// Blog listing
export const POSTS_LIST_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && (language == "en" || !defined(language))] | order(featured desc, publishedAt desc) [$start...$end] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    featured,
    mainImage { ${imageFragment} },
    author->{ name, "slug": slug.current, photo { ${imageFragment} } },
    categories[]->{ _id, title, "slug": slug.current }
  }
`)

export const POSTS_COUNT_QUERY = defineQuery(`
  count(*[_type == "post" && defined(slug.current) && (language == "en" || !defined(language))])
`)

export const POSTS_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && (language == "en" || !defined(language)) && $categorySlug in categories[]->slug.current]
  | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    publishedAt,
    featured,
    mainImage { ${imageFragment} },
    author->{ name, "slug": slug.current, photo { ${imageFragment} } },
    categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Single post
export const POST_QUERY = defineQuery(`
  *[_type == "post" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    language,
    excerpt,
    publishedAt,
    featured,
    mainImage { ${imageFragment} },
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{ _id, url, metadata { lqip, dimensions } }
      }
    },
    author->{ _id, name, role, "slug": slug.current, photo { ${imageFragment} }, bio, socialLinks },
    categories[]->{ _id, title, "slug": slug.current },
    aiSummary,
    "translation": coalesce(
      translationOf->{ "slug": slug.current, language },
      *[_type == "post" && translationOf._ref == ^._id][0]{ "slug": slug.current, language }
    ),
    ${seoFragment}
  }
`)

export const POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && (language == "en" || !defined(language))]{ "slug": slug.current }
`)

// Chinese blog listing — uses English canonical slugs for URLs
export const POSTS_LIST_ZH_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && language == "zh"] | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    "slug": coalesce(translationOf->slug.current, slug.current),
    excerpt,
    publishedAt,
    featured,
    mainImage { asset->{ _id, url, metadata { lqip, dimensions } }, alt },
    author->{ name, "slug": slug.current, photo { asset->{ _id, url, metadata { lqip, dimensions } }, alt } },
    categories[]->{ _id, title, "slug": slug.current }
  }
`)

export const POSTS_COUNT_ZH_QUERY = defineQuery(`
  count(*[_type == "post" && defined(slug.current) && language == "zh"])
`)

export const POSTS_BY_CATEGORY_ZH_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && language == "zh" && $categorySlug in categories[]->slug.current]
  | order(publishedAt desc) [$start...$end] {
    _id,
    title,
    "slug": coalesce(translationOf->slug.current, slug.current),
    excerpt,
    publishedAt,
    featured,
    mainImage { asset->{ _id, url, metadata { lqip, dimensions } }, alt },
    author->{ name, "slug": slug.current, photo { asset->{ _id, url, metadata { lqip, dimensions } }, alt } },
    categories[]->{ _id, title, "slug": slug.current }
  }
`)

// Find Chinese post by English canonical slug
export const POST_ZH_QUERY = defineQuery(`
  *[_type == "post" && translationOf->slug.current == $slug && language == "zh"][0]{
    _id,
    title,
    "slug": translationOf->slug.current,
    language,
    excerpt,
    publishedAt,
    featured,
    mainImage { asset->{ _id, url, metadata { lqip, dimensions } }, alt },
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{ _id, url, metadata { lqip, dimensions } }
      }
    },
    author->{ _id, name, role, "slug": slug.current, photo { asset->{ _id, url, metadata { lqip, dimensions } }, alt }, bio, socialLinks },
    categories[]->{ _id, title, "slug": slug.current },
    aiSummary,
    "seo": {
      "title": coalesce(seo.title, title, ""),
      "description": coalesce(seo.description, excerpt, ""),
      "image": seo.image,
      "noIndex": seo.noIndex == true
    }
  }
`)

// Slugs of Chinese posts (using English canonical slug)
export const POST_SLUGS_ZH_QUERY = defineQuery(`
  *[_type == "post" && language == "zh" && defined(translationOf->slug.current)]{ "slug": translationOf->slug.current }
`)

// Categories
export const CATEGORIES_QUERY = defineQuery(`
  *[_type == "category"] | order(title asc) {
    _id,
    title,
    "slug": slug.current,
    "postCount": count(*[_type == "post" && references(^._id)])
  }
`)

// Sitemap
export const SITEMAP_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && (language == "en" || !defined(language)) && seo.noIndex != true] {
    "href": "/blog/" + slug.current,
    _updatedAt
  }
`)
