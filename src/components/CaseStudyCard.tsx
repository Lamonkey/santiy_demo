import Link from 'next/link'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'

type CaseStudy = {
  _id: string
  title?: string | null
  slug?: string | null
  excerpt?: string | null
  client?: string | null
  industry?: string | null
  technologies?: string[] | null
  coverImage?: { asset?: { url?: string; metadata?: { lqip?: string } } | null; alt?: string | null } | null
}

export default function CaseStudyCard({ caseStudy: cs }: { caseStudy: CaseStudy }) {
  return (
    <article className="group rounded-xl overflow-hidden border border-gray-100 hover:border-blue-200 transition">
      <Link href={`/case-studies/${cs.slug}`}>
        {cs.coverImage?.asset && (
          <div className="relative aspect-video">
            <Image
              src={urlFor(cs.coverImage).width(800).height(450).url()}
              alt={cs.coverImage.alt || cs.title || ''}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        <div className="p-6">
          {cs.client && (
            <p className="text-sm text-blue-600 font-medium mb-1">{cs.client}</p>
          )}
          <h2 className="font-bold text-xl mb-2 group-hover:text-blue-600 transition">{cs.title}</h2>
          {cs.excerpt && <p className="text-gray-600 text-sm line-clamp-3">{cs.excerpt}</p>}
          {cs.technologies && cs.technologies.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {cs.technologies.slice(0, 4).map((tech) => (
                <span key={tech} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {tech}
                </span>
              ))}
              {cs.technologies.length > 4 && (
                <span className="text-xs text-gray-400">+{cs.technologies.length - 4} more</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </article>
  )
}
