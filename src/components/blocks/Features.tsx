import { stegaClean } from '@sanity/client/stega'

type FeatureItem = {
  _key: string
  title?: string
  description?: string
  icon?: string
}

type FeaturesBlock = {
  title?: string
  subtitle?: string
  columns?: string
  items?: FeatureItem[]
}

export default function Features({ block }: { block: FeaturesBlock }) {
  const cols = stegaClean(block.columns) || '3'
  const gridClass = cols === '2' ? 'grid-cols-1 md:grid-cols-2'
    : cols === '4' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'

  return (
    <section className="py-24 px-4 max-w-6xl mx-auto">
      {block.title && (
        <h2 className="text-3xl font-bold text-center mb-4">{block.title}</h2>
      )}
      {block.subtitle && (
        <p className="text-xl text-gray-600 text-center max-w-2xl mx-auto mb-16">{block.subtitle}</p>
      )}
      <div className={`grid ${gridClass} gap-8`}>
        {block.items?.map((item) => (
          <div key={item._key} className="p-6 rounded-xl border border-gray-100 hover:border-blue-200 transition">
            {item.icon && <div className="text-3xl mb-4">{item.icon}</div>}
            {item.title && <h3 className="text-xl font-semibold mb-2">{item.title}</h3>}
            {item.description && <p className="text-gray-600">{item.description}</p>}
          </div>
        ))}
      </div>
    </section>
  )
}
