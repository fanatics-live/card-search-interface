import { useRef, useState, useEffect, useCallback } from 'react'
import { useSearchBox } from 'react-instantsearch'
import { useDebouncedCallback } from 'use-debounce'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils/cn'
import { SearchSuggestions } from './SearchSuggestions'
import { SaveSearchButton } from './SaveSearchButton'
import { SaveSearchModal } from './SaveSearchModal'
import { addRecentSearch } from '@/lib/search/recentSearches'
import type { SavedSearchFilters } from '@/lib/search/savedSearches'

interface SearchBoxProps {
  placeholder?: string
  className?: string
  currentFilters?: SavedSearchFilters
  onSearchSaved?: () => void
}

export function SearchBox({
  placeholder = 'Search for players, teams, cards...',
  className,
  currentFilters,
  onSearchSaved,
}: SearchBoxProps) {
  const { query, refine } = useSearchBox()
  const [inputValue, setInputValue] = useState(query)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [compositionValue, setCompositionValue] = useState('') // For inline autocomplete
  const [saveModalOpen, setSaveModalOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search to reduce API calls
  const debouncedRefine = useDebouncedCallback((value: string) => {
    refine(value)
  }, 200)

  // Update composition value for inline autocomplete
  useEffect(() => {
    if (suggestions.length > 0 && inputValue && highlightedIndex === -1) {
      const topSuggestion = suggestions[0]
      if (topSuggestion.toLowerCase().startsWith(inputValue.toLowerCase())) {
        setCompositionValue(topSuggestion)
      } else {
        setCompositionValue('')
      }
    } else {
      setCompositionValue('')
    }
  }, [suggestions, inputValue, highlightedIndex])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    setInputValue(value)
    setHighlightedIndex(-1) // Reset highlight on type
    debouncedRefine(value)
    setSuggestionsOpen(true)
  }

  const handleClear = () => {
    setInputValue('')
    setCompositionValue('')
    setHighlightedIndex(-1)
    setSuggestions([])
    refine('')
    setSuggestionsOpen(false)
    inputRef.current?.focus()
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    // If a suggestion is highlighted, use that
    const finalQuery = highlightedIndex >= 0
      ? suggestions[highlightedIndex]
      : inputValue.trim()

    if (finalQuery) {
      setInputValue(finalQuery)
      addRecentSearch(finalQuery)
      refine(finalQuery)
    }

    setSuggestionsOpen(false)
    setCompositionValue('')
    inputRef.current?.blur()
  }

  const handleSuggestionSelect = (selectedQuery: string, index?: number) => {
    setInputValue(selectedQuery)
    setCompositionValue('')
    setHighlightedIndex(index ?? -1)
    refine(selectedQuery)
    addRecentSearch(selectedQuery)
    setSuggestionsOpen(false)
    inputRef.current?.blur()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!suggestionsOpen || suggestions.length === 0) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        )
        break

      case 'ArrowUp':
        event.preventDefault()
        setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : -1))
        break

      case 'Tab':
        // Tab accepts top suggestion or highlighted suggestion
        if (suggestions.length > 0) {
          event.preventDefault()
          const acceptedSuggestion = highlightedIndex >= 0
            ? suggestions[highlightedIndex]
            : suggestions[0]

          setInputValue(acceptedSuggestion)
          setCompositionValue('')
          setHighlightedIndex(-1)
          setSuggestionsOpen(false)
        }
        break

      case 'Escape':
        setSuggestionsOpen(false)
        setHighlightedIndex(-1)
        setCompositionValue('')
        inputRef.current?.blur()
        break
    }
  }

  const handleFocus = () => {
    setSuggestionsOpen(true)
  }

  const handleSuggestionsUpdate = (newSuggestions: string[]) => {
    setSuggestions(newSuggestions)
  }

  const handleHighlightChange = (index: number) => {
    setHighlightedIndex(index)
  }

  const handleOpenSaveModal = useCallback(() => {
    setSaveModalOpen(true)
  }, [])

  return (
    <form onSubmit={handleSubmit} className={cn('relative', className)}>
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Inline Autocomplete Ghost Text */}
        {compositionValue && compositionValue !== inputValue && (
          <div className="absolute inset-y-0 left-0 pl-11 flex items-center pointer-events-none">
            <span className="text-base text-gray-900 opacity-0">{inputValue}</span>
            <span className="text-base text-gray-400">
              {compositionValue.substring(inputValue.length)}
            </span>
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          type="search"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          placeholder={placeholder}
          className={cn(
            'block w-full pl-11 py-3 border border-gray-300 rounded-lg bg-transparent relative z-10',
            inputValue ? 'pr-24' : 'pr-12', // More padding when both buttons visible
            'text-gray-900 placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
            'transition-all duration-200',
            'text-base'
          )}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />

        {/* Right side buttons container */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1 z-20">
          {/* Save Search Button */}
          {inputValue && (
            <SaveSearchButton
              query={inputValue}
              filters={currentFilters}
              onClick={handleOpenSaveModal}
            />
          )}

          {/* Clear Button */}
          {inputValue && (
            <button
              type="button"
              onClick={handleClear}
              className={cn(
                'flex items-center justify-center w-10 h-10 rounded-lg',
                'text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors'
              )}
              aria-label="Clear search"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      <SearchSuggestions
        query={inputValue}
        isOpen={suggestionsOpen}
        onSelect={handleSuggestionSelect}
        onClose={() => setSuggestionsOpen(false)}
        onSuggestionsUpdate={handleSuggestionsUpdate}
        highlightedIndex={highlightedIndex}
        onHighlightChange={handleHighlightChange}
      />

      {/* Save Search Modal */}
      <SaveSearchModal
        isOpen={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        query={inputValue}
        filters={currentFilters}
        onSaved={() => {
          onSearchSaved?.()
        }}
      />
    </form>
  )
}
