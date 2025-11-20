import { XMarkIcon, BellIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
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

  // Check if this search has any filters applied
  const hasFilters =
    (search.filters?.smartPills && search.filters.smartPills.length > 0) ||
    (search.filters?.sidebarFilters?.status && search.filters.sidebarFilters.status.length > 0) ||
    (search.filters?.sidebarFilters?.marketplace && search.filters.sidebarFilters.marketplace.length > 0) ||
    (search.filters?.sidebarFilters?.gradingService && search.filters.sidebarFilters.gradingService.length > 0)

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="inline-flex items-center group relative"
    >
      <button
        onClick={() => onSelect(search)}
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          'cursor-pointer select-none',
          hasNewItems
            ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700 shadow-md ring-2 ring-blue-300 animate-pulse'
            : hasFilters
            ? 'bg-purple-100 text-purple-800 border-purple-300 hover:bg-purple-200'
            : 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200'
        )}
      >
        {/* Filter indicator - show ONLY when filters are present */}
        {hasFilters && (
          <FunnelIcon className="w-3.5 h-3.5" title="Has filters applied" />
        )}

        {/* Query text */}
        <span>{search.query}</span>

        {/* Discord badge */}
        {hasDiscord && (
          <BellIcon className="w-3.5 h-3.5" title="Discord notifications enabled" />
        )}

        {/* New items count badge */}
        {hasNewItems && (
          <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-semibold bg-white/20 text-white">
            {search.newItemsCount}
          </span>
        )}
      </button>

      {/* Remove button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onRemove(search.id)
        }}
        className={cn(
          'absolute -right-2 -top-2 w-5 h-5 rounded-full bg-red-500 text-white',
          'flex items-center justify-center',
          'opacity-0 group-hover:opacity-100 transition-opacity',
          'hover:bg-red-600 shadow-md'
        )}
        title="Remove saved search"
        aria-label="Remove saved search"
      >
        <XMarkIcon className="w-3 h-3" />
      </button>
    </motion.div>
  )
}
