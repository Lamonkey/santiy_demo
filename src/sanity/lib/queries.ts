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
    ${seoFragment}
  }
`)

export const POST_SLUGS_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && (language == "en" || !defined(language))]{ "slug": slug.current }
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
