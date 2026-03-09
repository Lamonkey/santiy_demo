import createImageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'
import { client } from './client'

const imageBuilder = createImageUrlBuilder(client)

/**
 * Returns a Sanity image URL builder pre-configured with:
 * - auto('format')  → serves WebP to browsers that support it, JPEG elsewhere
 * - fit('max')      → never upscales; only shrinks if the requested size is smaller
 * - quality(80)     → good visual quality at ~40% smaller file size than default
 *
 * Chain additional transformations (.width(), .height(), .crop() etc.) as needed.
 */
export function urlFor(source: SanityImageSource) {
  return imageBuilder.image(source).auto('format').fit('max').quality(80)
}
