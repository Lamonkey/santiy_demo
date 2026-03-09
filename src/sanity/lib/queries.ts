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
  *[_type == "post" && defined(slug.current)] | order(featured desc, publishedAt desc) [$start...$end] {
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
  count(*[_type == "post" && defined(slug.current)])
`)

export const POSTS_BY_CATEGORY_QUERY = defineQuery(`
  *[_type == "post" && defined(slug.current) && $categorySlug in categories[]->slug.current]
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
  *[_type == "post" && defined(slug.current)]{ "slug": slug.current }
`)

// Case studies
export const CASE_STUDIES_LIST_QUERY = defineQuery(`
  *[_type == "caseStudy" && defined(slug.current)] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    client,
    industry,
    services,
    technologies,
    publishedAt,
    coverImage { ${imageFragment} }
  }
`)

export const CASE_STUDY_QUERY = defineQuery(`
  *[_type == "caseStudy" && slug.current == $slug][0]{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    client,
    industry,
    services,
    technologies,
    projectUrl,
    publishedAt,
    coverImage { ${imageFragment} },
    body[]{
      ...,
      _type == "image" => {
        ...,
        asset->{ _id, url, metadata { lqip, dimensions } }
      }
    },
    ${seoFragment}
  }
`)

export const CASE_STUDY_SLUGS_QUERY = defineQuery(`
  *[_type == "caseStudy" && defined(slug.current)]{ "slug": slug.current }
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
  *[_type in ["post", "caseStudy"] && defined(slug.current) && seo.noIndex != true] {
    "href": select(
      _type == "post" => "/blog/" + slug.current,
      _type == "caseStudy" => "/case-studies/" + slug.current,
      "/" + slug.current
    ),
    _updatedAt
  }
`)
