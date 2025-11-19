import { useRefinementList, useClearRefinements } from 'react-instantsearch'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils/cn'

// Transform functions defined outside component to prevent re-renders
const statusTransform = (items: any[]) =>
  items.sort((a, b) => {
    const order = ['Live', 'Sold']
    return order.indexOf(a.label) - order.indexOf(b.label)
  })

const marketplaceTransform = (items: any[]) =>
  items.map(item => ({
    ...item,
    label: item.value === 'FIXED' ? 'Buy Now' :
           item.value === 'WEEKLY' ? 'Auction' :
           item.value === 'PREMIER' ? 'Premier' : item.value
  })).sort((a, b) => {
    const order = ['Buy Now', 'Auction', 'Premier']
    return order.indexOf(a.label) - order.indexOf(b.label)
  })

const gradingServiceTransform = (items: any[]) =>
  items.sort((a, b) => b.count - a.count)

interface RefinementListProps {
  attribute: string
  title: string
  limit?: number
  searchable?: boolean
  transformItems?: (items: any[]) => any[]
}

function RefinementList({ attribute, title, limit = 10, searchable = false, transformItems }: RefinementListProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit,
    searchable,
    transformItems,
  })

  if (items.length === 0) return null

  return (
    <div className="border-b border-gray-200 pb-6">
      <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>

      {searchable && (
        <input
          type="search"
          placeholder={`Search ${title.toLowerCase()}...`}
          onChange={(e) => searchForItems(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      )}

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.value}>
            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={item.isRefined}
                onChange={() => refine(item.value)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className={cn(
                'flex-1 text-sm',
                item.isRefined ? 'text-gray-900 font-medium' : 'text-gray-700'
              )}>
                {item.label}
              </span>
              <span className="text-xs text-gray-500">{item.count.toLocaleString()}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Filters() {
  const { canRefine, refine } = useClearRefinements()

  return (
    <aside className="w-64 flex-shrink-0">
      <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Filters</h2>
          {canRefine && (
            <button
              onClick={() => refine()}
              className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700"
            >
              <XMarkIcon className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Filter Groups */}
        <div className="space-y-6">
          {/* Status */}
          <RefinementList
            attribute="status"
            title="Status"
            transformItems={statusTransform}
          />

          {/* Marketplace */}
          <RefinementList
            attribute="marketplace"
            title="Marketplace"
            transformItems={marketplaceTransform}
          />

          {/* Grading Service */}
          <RefinementList
            attribute="gradingService"
            title="Grading Service"
            limit={15}
            searchable={true}
            transformItems={gradingServiceTransform}
          />
        </div>
      </div>
    </aside>
  )
}
