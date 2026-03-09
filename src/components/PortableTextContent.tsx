import { PortableText, type PortableTextComponents } from 'next-sanity'
import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'
import type { PortableTextBlock } from 'next-sanity'

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => <h2 className="text-3xl font-bold mt-10 mb-4">{children}</h2>,
    h3: ({ children }) => <h3 className="text-2xl font-bold mt-8 mb-3">{children}</h3>,
    h4: ({ children }) => <h4 className="text-xl font-semibold mt-6 mb-2">{children}</h4>,
    normal: ({ children }) => <p className="mb-4 leading-relaxed text-gray-800">{children}</p>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-blue-400 pl-6 my-6 italic text-gray-600">
        {children}
      </blockquote>
    ),
  },
  types: {
    image: ({ value }) => {
      if (!value?.asset) return null
      return (
        <figure className="my-8">
          <div className="relative aspect-video rounded-xl overflow-hidden">
            <Image
              src={urlFor(value).width(1200).height(675).url()}
              alt={value.alt || ''}
              fill
              className="object-cover"
            />
          </div>
          {value.caption && (
            <figcaption className="text-sm text-gray-500 text-center mt-2">
              {value.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="px-1.5 py-0.5 bg-gray-100 rounded text-sm font-mono">{children}</code>
    ),
    link: ({ children, value }) => {
      const rel = value?.href && !value.href.startsWith('/') ? 'noopener noreferrer' : undefined
      const target = value?.openInNewTab ? '_blank' : undefined
      return (
        <a href={value?.href} rel={rel} target={target} className="text-blue-600 underline hover:text-blue-800">
          {children}
        </a>
      )
    },
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li className="text-gray-800">{children}</li>,
    number: ({ children }) => <li className="text-gray-800">{children}</li>,
  },
}

type Props = {
  value: PortableTextBlock[]
  documentId?: string
}

export default function PortableTextContent({ value }: Props) {
  if (!value || !Array.isArray(value)) return null
  return <div className="prose max-w-none"><PortableText value={value} components={components} /></div>
}
