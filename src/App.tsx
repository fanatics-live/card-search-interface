import { useState } from 'react'
import { InstantSearch, Configure, useSearchBox } from 'react-instantsearch'
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
  const { refine } = useSearchBox()

  const handleSelectSavedSearch = (search: SavedSearch) => {
    // Execute the saved search
    refine(search.query)

    // TODO: Apply saved filters if they exist
    // This would require restoring smart pills and sidebar filters
    // For now, just execute the query
  }

  const handleSearchSaved = () => {
    // Force SavedSearchesList to re-render
    setSavedSearchesKey((prev) => prev + 1)
  }

  // Build current filters for save functionality
  const currentFilters: SavedSearchFilters = {
    smartPills: [], // TODO: Track active smart pill IDs
    sidebarFilters: {}, // TODO: Track active sidebar filters
  }

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
          <SmartPills onFiltersChange={setSmartPillFilters} />

          {/* Main Content with Sidebar */}
          <div className="flex gap-8">
            {/* Filters Sidebar */}
            <Filters />

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
