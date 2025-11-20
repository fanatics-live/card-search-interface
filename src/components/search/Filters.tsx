import React from 'react'
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
  onRefinementsChange?: (attribute: string, refinedValues: string[]) => void
  externalRefinements?: string[] // Allow parent to control refinements
}

function RefinementList({ attribute, title, limit = 10, searchable = false, transformItems, onRefinementsChange, externalRefinements }: RefinementListProps) {
  const { items, refine, searchForItems } = useRefinementList({
    attribute,
    limit,
    transformItems,
  })

  const prevRefinedValuesRef = React.useRef<string>('')
  const hasAppliedExternalRef = React.useRef(false)

  // Apply external refinements when provided
  React.useEffect(() => {
    if (externalRefinements && externalRefinements.length > 0 && items.length > 0 && !hasAppliedExternalRef.current) {
      hasAppliedExternalRef.current = true

      // Get currently refined values
      const currentlyRefined = items.filter(item => item.isRefined).map(item => item.value)

      // Refine each external value that isn't already refined
      externalRefinements.forEach(value => {
        if (!currentlyRefined.includes(value)) {
          const item = items.find(i => i.value === value)
          if (item && !item.isRefined) {
            refine(value)
          }
        }
      })
    }
  }, [externalRefinements, items, refine])

  // Reset the flag when external refinements change
  React.useEffect(() => {
    hasAppliedExternalRef.current = false
  }, [externalRefinements])

  // Notify parent when refinements change
  React.useEffect(() => {
    if (onRefinementsChange) {
      const refinedValues = items.filter(item => item.isRefined).map(item => item.value)
      const refinedValuesStr = JSON.stringify(refinedValues)

      // Only notify if values actually changed
      if (refinedValuesStr !== prevRefinedValuesRef.current) {
        prevRefinedValuesRef.current = refinedValuesStr
        onRefinementsChange(attribute, refinedValues)
      }
    }
  }, [items, attribute, onRefinementsChange])

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

interface FiltersProps {
  onRefinementsChange?: (refinements: { [key: string]: string[] }) => void
  externalRefinements?: { [key: string]: string[] } // Allow parent to control refinements
}

export function Filters({ onRefinementsChange, externalRefinements }: FiltersProps = {}) {
  const { canRefine, refine } = useClearRefinements()
  const [refinements, setRefinements] = React.useState<{ [key: string]: string[] }>({})
  const onRefinementsChangeRef = React.useRef(onRefinementsChange)

  // Keep ref updated
  React.useEffect(() => {
    onRefinementsChangeRef.current = onRefinementsChange
  }, [onRefinementsChange])

  const handleRefinementChange = React.useCallback((attribute: string, values: string[]) => {
    setRefinements(prev => {
      const updated = { ...prev, [attribute]: values }
      return updated
    })
  }, [])

  // Notify parent when refinements change
  React.useEffect(() => {
    onRefinementsChangeRef.current?.(refinements)
  }, [refinements])

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
            onRefinementsChange={handleRefinementChange}
            externalRefinements={externalRefinements?.status}
          />

          {/* Marketplace */}
          <RefinementList
            attribute="marketplace"
            title="Marketplace"
            transformItems={marketplaceTransform}
            onRefinementsChange={handleRefinementChange}
            externalRefinements={externalRefinements?.marketplace}
          />

          {/* Grading Service */}
          <RefinementList
            attribute="gradingService"
            title="Grading Service"
            limit={15}
            searchable={true}
            transformItems={gradingServiceTransform}
            onRefinementsChange={handleRefinementChange}
            externalRefinements={externalRefinements?.gradingService}
          />
        </div>
      </div>
    </aside>
  )
}
