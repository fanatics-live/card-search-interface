import { useState } from 'react'
import { HeartIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid'
import { isSearchSaved } from '@/lib/search/savedSearches'
import type { SavedSearchFilters } from '@/lib/search/savedSearches'
import { cn } from '@/lib/utils/cn'

interface SaveSearchButtonProps {
  query: string
  filters?: SavedSearchFilters
  onClick: () => void
  className?: string
}

export function SaveSearchButton({
  query,
  filters,
  onClick,
  className,
}: SaveSearchButtonProps) {
  const [isHovered, setIsHovered] = useState(false)
  const isSaved = isSearchSaved(query, filters)

  // Don't show if no query
  if (!query || query.trim().length === 0) {
    return null
  }

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        isSaved
          ? 'text-red-500 hover:text-red-600 hover:bg-red-50'
          : 'text-gray-400 hover:text-red-500 hover:bg-gray-100',
        className
      )}
      title={isSaved ? 'Saved search' : 'Save this search'}
      aria-label={isSaved ? 'Saved search' : 'Save this search'}
    >
      {isSaved || isHovered ? (
        <HeartIconSolid className="w-6 h-6" />
      ) : (
        <HeartIcon className="w-6 h-6" />
      )}
    </button>
  )
}
