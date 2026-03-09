import { urlFor } from '@/sanity/lib/image'
import Image from 'next/image'

type Testimonial = {
  _key: string
  quote?: string
  authorName?: string
  authorTitle?: string
  authorImage?: { asset?: { url?: string }; alt?: string }
}

type TestimonialsBlock = {
  title?: string
  items?: Testimonial[]
}

export default function Testimonials({ block }: { block: TestimonialsBlock }) {
  return (
    <section className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        {block.title && (
          <h2 className="text-3xl font-bold text-center mb-16">{block.title}</h2>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {block.items?.map((item) => (
            <blockquote
              key={item._key}
              className="bg-white p-6 rounded-xl border border-gray-100 flex flex-col gap-4"
            >
              <p className="text-gray-700 leading-relaxed italic">"{item.quote}"</p>
              <footer className="flex items-center gap-3 mt-auto">
                {item.authorImage?.asset && (
                  <Image
                    src={urlFor(item.authorImage).width(48).height(48).url()}
                    alt={item.authorImage.alt || item.authorName || ''}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                )}
                <div>
                  <cite className="font-semibold not-italic">{item.authorName}</cite>
                  {item.authorTitle && (
                    <p className="text-sm text-gray-500">{item.authorTitle}</p>
                  )}
                </div>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
