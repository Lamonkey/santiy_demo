import { stegaClean } from '@sanity/client/stega'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import Link from 'next/link'

type CTA = {
  _key: string
  label?: string
  linkType?: string
  externalUrl?: string
  internalRef?: { _type: string; slug?: { current?: string } }
}

type HeroBlock = {
  headline?: string
  subheadline?: string
  image?: { asset?: { url?: string; metadata?: { lqip?: string } }; alt?: string }
  align?: string
  ctas?: CTA[]
}

type Props = {
  block: HeroBlock
  documentId: string
  level?: 'h1' | 'h2'
}

function getHref(cta: CTA): string {
  if (stegaClean(cta.linkType) === 'external') return cta.externalUrl || '#'
  if (cta.internalRef?.slug?.current) {
    const prefix = cta.internalRef._type === 'post' ? '/blog' : '/case-studies'
    return `${prefix}/${cta.internalRef.slug.current}`
  }
  return '#'
}

export default function Hero({ block, level: Tag = 'h2' }: Props) {
  const align = stegaClean(block.align) || 'center'
  const alignClass = align === 'left' ? 'text-left' : 'text-center items-center'

  return (
    <section className={`flex flex-col ${alignClass} py-24 px-4 max-w-5xl mx-auto`}>
      {block.image?.asset && (
        <div className="relative w-full aspect-video max-w-2xl mb-10 rounded-2xl overflow-hidden">
          <Image
            src={urlFor(block.image).width(1200).height(675).url()}
            alt={block.image.alt || ''}
            fill
            className="object-cover"
            placeholder={block.image.asset.metadata?.lqip ? 'blur' : 'empty'}
            blurDataURL={block.image.asset.metadata?.lqip || undefined}
            priority
          />
        </div>
      )}
      {block.headline && (
        <Tag className="text-5xl font-bold tracking-tight mb-4">{block.headline}</Tag>
      )}
      {block.subheadline && (
        <p className="text-xl text-gray-600 max-w-2xl mb-8">{block.subheadline}</p>
      )}
      {block.ctas && block.ctas.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {block.ctas.map((cta, i) => (
            <Link
              key={cta._key}
              href={getHref(cta)}
              className={i === 0
                ? 'px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition'
                : 'px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition'
              }
            >
              {cta.label}
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
