export const dynamic = 'force-static'
export { metadata, viewport } from 'next-sanity/studio'

import Studio from './Studio'

export default function StudioPage() {
  return <Studio />
}
