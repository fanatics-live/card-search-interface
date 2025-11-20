import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline'
import type { SavedSearch } from '@/lib/search/savedSearches'
import { cn } from '@/lib/utils/cn'

interface SavedSearchItemProps {
  search: SavedSearch
  onSelect: (search: SavedSearch) => void
  onRemove: (id: string) => void
}

export function SavedSearchItem({ search, onSelect, onRemove }: SavedSearchItemProps) {
  const hasNewItems = search.newItemsCount && search.newItemsCount > 0
  const hasDiscord = !!search.discordWebhook

  return (
    <div
      className={cn(
        'group w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all',
        'hover:bg-gray-50 cursor-pointer',
        hasNewItems && 'bg-blue-50 hover:bg-blue-100 border border-blue-200'
      )}
    >
      {/* Left: Search query and badges - clickable area */}
      <div
        onClick={() => onSelect(search)}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        {/* Star icon */}
        <span className="text-yellow-500 flex-shrink-0">⭐</span>

        {/* Query text */}
        <span className="font-medium text-gray-900 truncate">{search.query}</span>

        {/* Discord badge */}
        {hasDiscord && (
          <span
            className="flex-shrink-0 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium"
            title="Discord notifications enabled"
          >
            <BellIcon className="w-3 h-3 inline-block -mt-0.5" /> Discord
          </span>
        )}

        {/* New items badge */}
        {hasNewItems && (
          <span className="flex-shrink-0 flex items-center gap-1 text-xs px-2 py-1 bg-blue-600 text-white rounded-full font-medium animate-pulse">
            <BellIcon className="w-3 h-3" />
            {search.newItemsCount} new
          </span>
        )}
      </div>

      {/* Right: Remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(search.id)
        }}
        className={cn(
          'ml-2 flex-shrink-0 p-1.5 rounded-md transition-colors',
          'text-gray-400 hover:text-gray-600 hover:bg-gray-200',
          'opacity-0 group-hover:opacity-100'
        )}
        title="Remove saved search"
        aria-label="Remove saved search"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
