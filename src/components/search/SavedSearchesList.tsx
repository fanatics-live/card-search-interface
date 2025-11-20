import { useState, useEffect, useRef } from 'react'
import { SavedSearchItem } from './SavedSearchItem'
import { getSavedSearches, removeSavedSearch, markAsChecked } from '@/lib/search/savedSearches'
import type { SavedSearch } from '@/lib/search/savedSearches'
import { checkAllSavedSearches, sendDiscordNotification } from '@/lib/search/searchNotifications'

interface SavedSearchesListProps {
  onSelectSearch: (search: SavedSearch) => void
  onUpdate?: () => void
}

export function SavedSearchesList({ onSelectSearch, onUpdate }: SavedSearchesListProps) {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [showAll, setShowAll] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const hasRunRef = useRef(false)

  // Load saved searches on mount
  useEffect(() => {
    setSavedSearches(getSavedSearches())
  }, [])

  // Check for updates on mount ONLY
  useEffect(() => {
    // Prevent running twice in React strict mode
    if (hasRunRef.current) return
    hasRunRef.current = true

    const checkForUpdates = async () => {
      setIsChecking(true)
      try {
        const searches = getSavedSearches()
        if (searches.length === 0) return

        // Check all searches for updates
        const updatedSearchIds = await checkAllSavedSearches(searches)

        // Send Discord notifications for searches with new items
        if (updatedSearchIds.length > 0) {
          const updatedSearches = getSavedSearches()
          for (const searchId of updatedSearchIds) {
            const search = updatedSearches.find((s) => s.id === searchId)
            if (search && search.discordWebhook && search.newItemsCount) {
              await sendDiscordNotification(
                search,
                search.newItemsCount,
                search.lastResultCount || 0
              )
            }
          }
        }

        // Reload searches to show updated counts
        setSavedSearches(getSavedSearches())
      } catch (error) {
        console.error('Error checking for updates:', error)
      } finally {
        setIsChecking(false)
      }
    }

    checkForUpdates()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectSearch = (search: SavedSearch) => {
    // Mark as checked (clear badge)
    markAsChecked(search.id)
    setSavedSearches(getSavedSearches())

    // Execute the search
    onSelectSearch(search)
  }

  const handleRemoveSearch = (id: string) => {
    removeSavedSearch(id)
    setSavedSearches(getSavedSearches())
    onUpdate?.()
  }

  // Don't render if no saved searches
  if (savedSearches.length === 0) {
    return null
  }

  const displayedSearches = showAll ? savedSearches : savedSearches.slice(0, 5)
  const hasMore = savedSearches.length > 5

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500 mr-2">
          {isChecking ? 'Checking saved searches...' : 'Saved:'}
        </span>
        {displayedSearches.map((search) => (
          <SavedSearchItem
            key={search.id}
            search={search}
            onSelect={handleSelectSearch}
            onRemove={handleRemoveSearch}
          />
        ))}
        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
          >
            {showAll ? 'Show less' : `+${savedSearches.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  )
}
