import { useState, useMemo } from 'react'
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

  // Memoize isSaved to prevent infinite loops
  const isSaved = useMemo(() => {
    return isSearchSaved(query, filters)
  }, [query, filters])

  // Don't show if no query OR if already saved with these exact filters
  if (!query || query.trim().length === 0 || isSaved) {
    return null
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    console.log('Save button clicked for query:', query)
    onClick()
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        'text-gray-400 hover:text-red-500 hover:bg-gray-100',
        className
      )}
      title="Save this search"
      aria-label="Save this search"
    >
      {isHovered ? (
        <HeartIconSolid className="w-6 h-6" />
      ) : (
        <HeartIcon className="w-6 h-6" />
      )}
    </button>
  )
}
