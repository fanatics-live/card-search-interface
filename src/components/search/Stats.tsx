import { useStats } from 'react-instantsearch'

export function Stats() {
  const { nbHits, processingTimeMS, query } = useStats()

  if (nbHits === 0 && !query) {
    return null
  }

  return (
    <div className="text-sm text-gray-600">
      <span className="font-semibold text-gray-900">
        {nbHits.toLocaleString()}
      </span>{' '}
      {nbHits === 1 ? 'result' : 'results'} found
      {processingTimeMS !== undefined && (
        <span className="text-gray-500"> in {processingTimeMS}ms</span>
      )}
    </div>
  )
}
