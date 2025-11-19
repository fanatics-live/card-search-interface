import { useState, useEffect, useRef } from 'react'
import { getSuggestionsIndex } from '@/lib/algolia/client'
import { getRecentSearches, removeRecentSearch, clearRecentSearches, type RecentSearch } from '@/lib/search/recentSearches'
import { cn } from '@/lib/utils/cn'

interface Suggestion {
  query: string
  nbHits?: number
  type: 'suggestion' | 'recent'
}

interface SearchSuggestionsProps {
  query: string
  onSelect: (query: string, index?: number) => void
  onClose: () => void
  isOpen: boolean
  onSuggestionsUpdate?: (suggestions: string[]) => void
  highlightedIndex?: number
  onHighlightChange?: (index: number) => void
}

export function SearchSuggestions({
  query,
  onSelect,
  onClose,
  isOpen,
  onSuggestionsUpdate,
  highlightedIndex: externalHighlightedIndex = -1,
  onHighlightChange,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [loading, setLoading] = useState(false)
  const [showAllRecent, setShowAllRecent] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load recent searches and reset view state
  useEffect(() => {
    setRecentSearches(getRecentSearches())
    setShowAllRecent(false)
  }, [isOpen])

  // Fetch popular queries when opened with empty query
  useEffect(() => {
    if (!isOpen) {
      return
    }

    if (!query) {
      // Fetch popular searches from API
      const fetchPopularSearches = async () => {
        try {
          const response = await fetch('http://localhost:3001/api/popular-queries')
          const data = await response.json()

          const popularSuggestions: Suggestion[] = data.queries.map((item: any) => ({
            query: item.query,
            nbHits: item.nbHits,
            type: 'suggestion' as const,
          }))

          // Randomize the order using Fisher-Yates shuffle
          const shuffled = [...popularSuggestions]
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
          }

          setSuggestions(shuffled)
          const suggestionStrings = shuffled.map((s) => s.query)
          onSuggestionsUpdate?.(suggestionStrings)
        } catch (error) {
          console.error('Error fetching popular searches:', error)
          // Fallback to hardcoded list if API fails
          const fallbackSuggestions: Suggestion[] = [
            { query: 'pokemon', nbHits: 378001, type: 'suggestion' },
            { query: 'ohtani', nbHits: 6000, type: 'suggestion' },
            { query: 'michael jordan', nbHits: 20479, type: 'suggestion' },
            { query: 'charizard', nbHits: 15140, type: 'suggestion' },
          ]
          setSuggestions(fallbackSuggestions)
          const suggestionStrings = fallbackSuggestions.map((s) => s.query)
          onSuggestionsUpdate?.(suggestionStrings)
        }
      }

      fetchPopularSearches()
    }
  }, [isOpen, query])

  // Fetch suggestions when user is typing
  useEffect(() => {
    if (!isOpen) return

    // Skip if query is empty (popular searches handles that)
    if (!query) return

    // Don't fetch if query is too short
    if (query.trim().length < 2) {
      setSuggestions([])
      onSuggestionsUpdate?.([])
      return
    }

    const fetchSuggestions = async () => {
      setLoading(true)
      try {
        const suggestionsIndex = getSuggestionsIndex()
        const result = await suggestionsIndex.search(query, {
          hitsPerPage: 8,
        })

        const algolaSuggestions: Suggestion[] = result.hits.map((hit: any) => ({
          query: hit.query,
          nbHits: hit.prod_item_state_v1?.exact_nb_hits,
          type: 'suggestion' as const,
        }))

        setSuggestions(algolaSuggestions)

        // Notify parent of suggestions for inline autocomplete
        const suggestionStrings = algolaSuggestions.map((s) => s.query)
        onSuggestionsUpdate?.(suggestionStrings)
      } catch (error) {
        console.error('Error fetching suggestions:', error)
        setSuggestions([])
        onSuggestionsUpdate?.([])
      } finally {
        setLoading(false)
      }
    }

    // Minimal delay for instant feel (50ms instead of 150ms)
    const debounceTimer = setTimeout(fetchSuggestions, 50)
    return () => clearTimeout(debounceTimer)
  }, [query, isOpen, onSuggestionsUpdate])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSelect = (selectedQuery: string) => {
    onSelect(selectedQuery)
    onClose()
  }

  const handleRemoveRecent = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    removeRecentSearch(queryToRemove)
    setRecentSearches(getRecentSearches())
  }

  const handleClearAll = () => {
    clearRecentSearches()
    setRecentSearches([])
  }

  if (!isOpen) return null

  const showRecent = !query && recentSearches.length > 0
  const showPopular = !query && suggestions.length > 0
  const showSuggestions = query.length >= 2 && suggestions.length > 0
  const hasContent = showRecent || showPopular || showSuggestions

  if (!hasContent && !loading) return null

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
    >
      {loading && (
        <div className="p-4 text-sm text-gray-500 text-center">
          Searching...
        </div>
      )}

      {!loading && showRecent && (
        <div>
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase">Recent Searches</span>
            <button
              onClick={handleClearAll}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              Clear all
            </button>
          </div>
          {(showAllRecent ? recentSearches : recentSearches.slice(0, 3)).map((recent, index) => (
            <div
              key={recent.query + index}
              onClick={() => handleSelect(recent.query, index)}
              className={cn(
                "flex items-center justify-between px-4 py-2 cursor-pointer group",
                externalHighlightedIndex === index ? "bg-blue-50" : "hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-gray-400">🕐</span>
                <span className="text-sm text-gray-900">{recent.query}</span>
              </div>
              <button
                onClick={(e) => handleRemoveRecent(recent.query, e)}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}
          {!showAllRecent && recentSearches.length > 3 && (
            <button
              onClick={() => setShowAllRecent(true)}
              className="w-full px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 text-left border-t border-gray-100"
            >
              View all {recentSearches.length} recent searches
            </button>
          )}
        </div>
      )}

      {!loading && (showPopular || showSuggestions) && (
        <div>
          {showRecent && <div className="border-t border-gray-100" />}
          <div className="px-4 py-2 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500 uppercase">
              {showPopular ? 'Popular Searches' : 'Suggestions'}
            </span>
          </div>
          {suggestions.map((suggestion, index) => {
            const actualIndex = showRecent ? recentSearches.length + index : index
            return (
              <div
                key={suggestion.query + index}
                onClick={() => handleSelect(suggestion.query, actualIndex)}
                className={cn(
                  "flex items-center justify-between px-4 py-2 cursor-pointer",
                  externalHighlightedIndex === actualIndex ? "bg-blue-50" : "hover:bg-gray-50"
                )}
              >
              <div className="flex items-center gap-3 flex-1">
                <span className="text-gray-400">🔍</span>
                <span className="text-sm text-gray-900">{suggestion.query}</span>
              </div>
              {suggestion.nbHits !== undefined && (
                <span className="text-xs text-gray-500">
                  {suggestion.nbHits.toLocaleString()} results
                </span>
              )}
            </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
