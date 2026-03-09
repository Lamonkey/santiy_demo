import { stegaClean } from '@sanity/client/stega'
import Hero from './blocks/Hero'
import Features from './blocks/Features'
import Testimonials from './blocks/Testimonials'

type Block = {
  _key: string
  _type: string
  [key: string]: unknown
}

type Props = {
  blocks: Block[]
  documentId: string
}

export default function PageBuilder({ blocks, documentId }: Props) {
  if (!Array.isArray(blocks)) return null

  return (
    <div>
      {blocks.map((block, index) => {
        switch (stegaClean(block._type)) {
          case 'hero':
            return <Hero key={block._key} documentId={documentId} block={block as any} level={index === 0 ? 'h1' : 'h2'} />
          case 'features':
            return <Features key={block._key} block={block as any} />
          case 'testimonials':
            return <Testimonials key={block._key} block={block as any} />
          default:
            return (
              <div key={block._key} className="p-4 bg-yellow-50 text-yellow-800 text-sm">
                Unknown block: {stegaClean(block._type)}
              </div>
            )
        }
      })}
    </div>
  )
}
