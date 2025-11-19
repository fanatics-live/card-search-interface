import { useHits } from 'react-instantsearch'
import { AlgoliaCardHit } from '@/types/algolia'
import { HitCard } from './HitCard'
import { CardGridSkeleton } from '@/components/common/CardSkeleton'
import { NoResults } from '@/components/common/NoResults'

export function Hits() {
  const { hits, results } = useHits<AlgoliaCardHit>()

  // Show skeleton during initial load
  if (!results) {
    return <CardGridSkeleton count={24} />
  }

  // Show no results state
  if (hits.length === 0) {
    return <NoResults query={results.query} />
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {hits.map((hit, index) => (
        <HitCard key={hit.objectID} hit={hit} index={index} />
      ))}
    </div>
  )
}
