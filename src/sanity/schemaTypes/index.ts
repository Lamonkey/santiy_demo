import { seoType } from './objects/seo'
import { linkType } from './objects/link'
import { heroBlockType } from './blocks/hero-block'
import { featureItemType, featuresBlockType } from './blocks/features-block'
import { testimonialItemType, testimonialsBlockType } from './blocks/testimonials-block'
import { pageBuilderType } from './blocks/page-builder'
import { settingsType } from './documents/settings'
import { landingPageType } from './documents/landing-page'
import { authorType } from './documents/author'
import { categoryType } from './documents/category'
import { postType } from './documents/post'

export const schemaTypes = [
  // Objects
  seoType,
  linkType,
  // Blocks
  heroBlockType,
  featureItemType,
  featuresBlockType,
  testimonialItemType,
  testimonialsBlockType,
  pageBuilderType,
  // Documents
  settingsType,
  landingPageType,
  authorType,
  categoryType,
  postType,
]
