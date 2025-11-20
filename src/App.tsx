import { useState, useMemo, useCallback } from 'react'
import { InstantSearch, Configure, useSearchBox, useClearRefinements } from 'react-instantsearch'
import { searchClient, ALGOLIA_INDEX_NAME, SEARCH_CONFIG } from '@/lib/algolia/client'
import { Header } from '@/components/layout/Header'
import { SearchBox } from '@/components/search/SearchBox'
import { SavedSearchesList } from '@/components/search/SavedSearchesList'
import { DebugPanel } from '@/components/search/DebugPanel'
import { Stats } from '@/components/search/Stats'
import { SmartPills } from '@/components/search/SmartPills'
import { Filters } from '@/components/search/Filters'
import { Hits } from '@/components/search/Hits'
import { Pagination } from '@/components/search/Pagination'
import type { SavedSearch, SavedSearchFilters } from '@/lib/search/savedSearches'

function SearchContent() {
  const [smartPillFilters, setSmartPillFilters] = useState<string>('')
  const [savedSearchesKey, setSavedSearchesKey] = useState(0) // For forcing re-render
  const [activePillIds, setActivePillIds] = useState<string[]>([])
  const [sidebarRefinements, setSidebarRefinements] = useState<{ [key: string]: string[] }>({})
  const { refine } = useSearchBox()
  const { refine: clearRefinements } = useClearRefinements()

  const handleSelectSavedSearch = (search: SavedSearch) => {
    console.log('Selecting saved search:', search.query, 'with filters:', search.filters)

    // Step 1: Clear all current filters first
    clearRefinements() // Clears sidebar refinements

    // Step 2: Update the search query in the search box
    refine(search.query)

    // Step 3: Apply saved filters if they exist
    if (search.filters) {
      // Restore smart pills
      if (search.filters.smartPills && search.filters.smartPills.length > 0) {
        setActivePillIds(search.filters.smartPills)
        console.log('Restored smart pills:', search.filters.smartPills)
        // Note: The actual Algolia filter string will be rebuilt by SmartPills component
        // when it sees the activePillIds change
      } else {
        setActivePillIds([])
        setSmartPillFilters('')
      }

      // Restore sidebar filters
      if (search.filters.sidebarFilters) {
        setSidebarRefinements(search.filters.sidebarFilters)
        console.log('Restored sidebar filters:', search.filters.sidebarFilters)
        // Note: We need to programmatically apply these to Algolia's refinement lists
        // This is complex - for now just update our state
        // TODO: Need to trigger Algolia refinements programmatically
      } else {
        setSidebarRefinements({})
      }
    } else {
      // No filters saved, clear everything
      setActivePillIds([])
      setSmartPillFilters('')
      setSidebarRefinements({})
    }
  }

  const handleSearchSaved = () => {
    // Force SavedSearchesList to re-render
    setSavedSearchesKey((prev) => prev + 1)
  }

  // Build current filters for save functionality
  // Memoize to prevent creating new object reference on every render
  const currentFilters: SavedSearchFilters = useMemo(() => ({
    smartPills: activePillIds,
    sidebarFilters: {
      status: sidebarRefinements.status || [],
      marketplace: sidebarRefinements.marketplace || [],
      gradingService: sidebarRefinements.gradingService || [],
    },
  }), [activePillIds, sidebarRefinements])

  return (
    <>
      <Configure {...SEARCH_CONFIG} filters={smartPillFilters} />

      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBox
              currentFilters={currentFilters}
              onSearchSaved={handleSearchSaved}
            />
          </div>

          {/* Saved Searches */}
          <SavedSearchesList
            key={savedSearchesKey}
            onSelectSearch={handleSelectSavedSearch}
            onUpdate={handleSearchSaved}
          />

          {/* Debug Panel */}
          <DebugPanel currentFilters={smartPillFilters} />

          {/* Stats */}
          <div className="mb-6">
            <Stats />
          </div>

          {/* Smart Pills */}
          <SmartPills
            onFiltersChange={setSmartPillFilters}
            onActivePillsChange={setActivePillIds}
            externalActivePillIds={activePillIds}
          />

          {/* Main Content with Sidebar */}
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <Filters
              onRefinementsChange={setSidebarRefinements}
              externalRefinements={sidebarRefinements}
            />

            {/* Results */}
            <div className="flex-1">
              {/* Results Grid */}
              <div className="mb-12">
                <Hits />
              </div>

              {/* Pagination */}
              <div className="flex justify-center">
                <Pagination />
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function App() {
  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={ALGOLIA_INDEX_NAME}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <SearchContent />
    </InstantSearch>
  )
}

export default App
