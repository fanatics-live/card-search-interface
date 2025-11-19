import { useState } from 'react'
import { useInstantSearch, useSearchBox } from 'react-instantsearch'

interface DebugPanelProps {
  currentFilters?: string
}

export function DebugPanel({ currentFilters = '' }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { indexUiState, results } = useInstantSearch()
  const { query } = useSearchBox()

  // Get the ACTUAL filters that Algolia received (includes both smart pills and sidebar filters)
  const appliedFilters = results?.params || ''
  const filterMatch = String(appliedFilters).match(/filters=([^&]*)/)
  const decodedFilters = filterMatch?.[1] ? decodeURIComponent(filterMatch[1]) : 'None'

  // Also show what smart pills are contributing
  const smartPillFilters = currentFilters || 'None'

  // Parse filters to show them nicely
  const parseFilters = (filterString: string) => {
    if (!filterString || filterString === 'None') return []

    // Split by AND to get individual filters
    const filters = filterString.split(' AND ').map((f) => f.trim())

    return filters.map((filter) => {
      // Try to identify the type of filter
      if (filter.includes('gradingService')) {
        const match = filter.match(/gradingService:"([^"]+)"/)
        return { type: '🏆 Grading', value: match?.[1] || filter, raw: filter }
      } else if (filter.match(/grade:\d+/)) {
        const match = filter.match(/grade:(\d+\.?\d*)/)
        return { type: '⭐ Grade', value: match?.[1] || filter, raw: filter }
      } else if (filter.includes('currentPrice')) {
        if (filter.includes(' AND ')) {
          // Range filter
          const rangeMatch = filter.match(/currentPrice >= (\d+) AND currentPrice < (\d+)/)
          if (rangeMatch) {
            return {
              type: '💰 Price',
              value: `$${rangeMatch[1]}-${rangeMatch[2]}`,
              raw: filter,
            }
          }
        } else if (filter.includes('>=')) {
          const match = filter.match(/currentPrice >= (\d+)/)
          return { type: '💰 Price', value: `$${match?.[1]}+`, raw: filter }
        } else if (filter.includes('<')) {
          const match = filter.match(/currentPrice < (\d+)/)
          return { type: '💰 Price', value: `< $${match?.[1]}`, raw: filter }
        }
      } else if (filter.includes('year')) {
        const match = filter.match(/year:"([^"]+)"/)
        return { type: '📅 Year', value: match?.[1] || filter, raw: filter }
      } else if (filter.includes('brand')) {
        const match = filter.match(/brand:"([^"]+)"/)
        return { type: '📇 Brand', value: match?.[1] || filter, raw: filter }
      } else if (filter.includes('status')) {
        const match = filter.match(/status:"([^"]+)"/)
        return { type: '📊 Status', value: match?.[1] || filter, raw: filter }
      } else if (filter.includes('marketplace')) {
        const match = filter.match(/marketplace:"([^"]+)"/)
        return { type: '🏪 Marketplace', value: match?.[1] || filter, raw: filter }
      }

      return { type: '🔍 Filter', value: filter, raw: filter }
    })
  }

  const parsedFilters = parseFilters(decodedFilters)

  return (
    <div className="mb-4">
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-xs text-gray-500 hover:text-gray-700 underline mb-2"
      >
        {isOpen ? '▼ Hide Debug Info' : '▶ Show Debug Info'}
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-sm font-semibold text-yellow-800 mb-2">🔍 Debug Information</div>
          <div className="space-y-2 text-xs">
        {/* Search Query */}
        <div className="flex gap-2">
          <span className="text-yellow-700 font-semibold min-w-[140px]">Search Query:</span>
          <span className="text-yellow-900 font-mono">{query || '(empty)'}</span>
        </div>

        {/* Smart Pills API */}
        <div className="flex gap-2">
          <span className="text-yellow-700 font-semibold min-w-[140px]">Smart Pills API:</span>
          <span className="text-yellow-900 font-mono text-[10px] break-all">
            {query
              ? `GET /api/smart-pills?q=${encodeURIComponent(query)}&threshold=50`
              : '(waiting for query)'}
          </span>
        </div>

        {/* Smart Pill Filters */}
        <div className="flex gap-2">
          <span className="text-yellow-700 font-semibold min-w-[140px]">Smart Pill Filters:</span>
          <div className="flex-1">
            <span className="text-yellow-900 font-mono text-[10px]">
              {smartPillFilters}
            </span>
          </div>
        </div>

        {/* All Active Filters */}
        <div className="flex gap-2">
          <span className="text-yellow-700 font-semibold min-w-[140px]">All Active Filters:</span>
          <div className="flex-1">
            {parsedFilters.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {parsedFilters.map((filter, i) => (
                  <span
                    key={i}
                    className="inline-block px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded-full text-[10px] font-semibold"
                  >
                    {filter.type} {filter.value}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-yellow-600 italic">No filters active</span>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="flex gap-2">
          <span className="text-yellow-700 font-semibold min-w-[140px]">Results Count:</span>
          <span className="text-yellow-900 font-mono font-semibold">
            {results?.nbHits?.toLocaleString() || '0'}
          </span>
        </div>

        {/* Raw Algolia Filters */}
        <details className="mt-2">
          <summary className="text-yellow-700 font-semibold cursor-pointer hover:text-yellow-900">
            Raw Algolia Filters ▾
          </summary>
          <div className="mt-1 p-2 bg-yellow-100 rounded text-[10px] font-mono break-all">
            {decodedFilters}
          </div>
        </details>

        {/* Full Params */}
        <details className="mt-2">
          <summary className="text-yellow-700 font-semibold cursor-pointer hover:text-yellow-900">
            Full Request Params ▾
          </summary>
          <div className="mt-1 p-2 bg-yellow-100 rounded text-[10px] font-mono break-all max-h-40 overflow-y-auto">
            {appliedFilters || 'N/A'}
          </div>
        </details>
          </div>
        </div>
      )}
    </div>
  )
}
