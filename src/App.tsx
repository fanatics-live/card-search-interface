import { useState } from 'react'
import { InstantSearch, Configure } from 'react-instantsearch'
import { searchClient, ALGOLIA_INDEX_NAME, SEARCH_CONFIG } from '@/lib/algolia/client'
import { Header } from '@/components/layout/Header'
import { SearchBox } from '@/components/search/SearchBox'
import { DebugPanel } from '@/components/search/DebugPanel'
import { Stats } from '@/components/search/Stats'
import { SmartPills } from '@/components/search/SmartPills'
import { Filters } from '@/components/search/Filters'
import { Hits } from '@/components/search/Hits'
import { Pagination } from '@/components/search/Pagination'

function App() {
  const [smartPillFilters, setSmartPillFilters] = useState<string>('')

  return (
    <InstantSearch
      searchClient={searchClient}
      indexName={ALGOLIA_INDEX_NAME}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <Configure {...SEARCH_CONFIG} filters={smartPillFilters} />

      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-8">
            <SearchBox />
          </div>

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
    </InstantSearch>
  )
}

export default App
