import { usePagination } from 'react-instantsearch'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils/cn'

export function Pagination() {
  const {
    pages,
    currentRefinement,
    nbPages,
    isFirstPage,
    isLastPage,
    refine,
    createURL,
  } = usePagination()

  if (nbPages <= 1) {
    return null
  }

  const handlePrevious = () => {
    if (!isFirstPage) {
      refine(currentRefinement - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (!isLastPage) {
      refine(currentRefinement + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePageClick = (page: number) => {
    refine(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Show max 7 pages: [1] ... [4] [5] [6] ... [10]
  const getDisplayPages = () => {
    const displayPages: (number | 'ellipsis')[] = []
    const maxPages = 7

    if (nbPages <= maxPages) {
      return pages
    }

    // Always show first page
    displayPages.push(0)

    // Calculate range around current page
    const start = Math.max(1, currentRefinement - 1)
    const end = Math.min(nbPages - 2, currentRefinement + 1)

    // Add ellipsis if needed
    if (start > 1) {
      displayPages.push('ellipsis')
    }

    // Add pages around current
    for (let i = start; i <= end; i++) {
      displayPages.push(i)
    }

    // Add ellipsis if needed
    if (end < nbPages - 2) {
      displayPages.push('ellipsis')
    }

    // Always show last page
    displayPages.push(nbPages - 1)

    return displayPages
  }

  const displayPages = getDisplayPages()

  return (
    <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={isFirstPage}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
          isFirstPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
        )}
        aria-label="Previous page"
      >
        <ChevronLeftIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {displayPages.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="px-2 py-2 text-gray-400"
              >
                ...
              </span>
            )
          }

          const isActive = page === currentRefinement
          const pageNumber = page + 1

          return (
            <button
              key={page}
              onClick={() => handlePageClick(page)}
              className={cn(
                'min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-500 text-white'
                  : 'border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              )}
              aria-label={`Go to page ${pageNumber}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          )
        })}
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={isLastPage}
        className={cn(
          'inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors',
          isLastPage
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
        )}
        aria-label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </nav>
  )
}
