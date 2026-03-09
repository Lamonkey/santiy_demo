import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/live'
import { CASE_STUDIES_LIST_QUERY } from '@/sanity/lib/queries'
import CaseStudyCard from '@/components/CaseStudyCard'

export const metadata: Metadata = {
  title: 'Case Studies',
  description: 'Real-world projects and client work',
}

export default async function CaseStudiesPage() {
  const { data: caseStudies } = await sanityFetch({ query: CASE_STUDIES_LIST_QUERY })

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Case Studies</h1>
      <p className="text-xl text-gray-600 mb-12">Real-world projects and client work</p>

      {caseStudies && caseStudies.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {caseStudies.map((cs) => (
            <CaseStudyCard key={cs._id} caseStudy={cs} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 border border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-4">🗂️</p>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">No case studies yet</h2>
          <p className="text-gray-400">Run <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm">npm run seed</code> to add sample data.</p>
        </div>
      )}
    </div>
  )
}
