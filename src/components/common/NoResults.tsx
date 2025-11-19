import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface NoResultsProps {
  query?: string
}

export function NoResults({ query }: NoResultsProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <MagnifyingGlassIcon className="w-8 h-8 text-gray-400" />
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        No cards found
      </h2>

      {query && (
        <p className="text-gray-600 mb-6 text-center max-w-md">
          We couldn't find any cards matching "<span className="font-semibold">{query}</span>"
        </p>
      )}

      <div className="space-y-2 text-sm text-gray-600 max-w-md">
        <p className="font-semibold text-gray-900">Try:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Removing some filters</li>
          <li>Checking your spelling</li>
          <li>Using different keywords</li>
          <li>Searching for player names or card numbers</li>
        </ul>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200 w-full max-w-md">
        <p className="text-sm font-semibold text-gray-900 mb-3">Popular searches:</p>
        <div className="flex flex-wrap gap-2">
          {['LeBron James', 'Rookie PSA 10', 'Michael Jordan', 'Topps Chrome'].map((suggestion) => (
            <button
              key={suggestion}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
