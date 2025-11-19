import { useState, useEffect } from 'react'
import { useSearchBox } from 'react-instantsearch'
import { SmartPill } from './SmartPill'
import { getSmartPillsForQuery } from '@/types/smartPills'
import type { SmartPill as SmartPillType } from '@/types/smartPills'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

interface SmartPillsProps {
  onFiltersChange?: (filters: string) => void
}

export function SmartPills({ onFiltersChange }: SmartPillsProps) {
  const { query, refine } = useSearchBox()
  const [pills, setPills] = useState<SmartPillType[]>([])
  const [activePillIds, setActivePillIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [baseQuery, setBaseQuery] = useState('')

  // Fetch smart pills from API
  useEffect(() => {
    const fetchSmartPills = async () => {
      setLoading(true)

      try {
        const response = await fetch(
          `${API_URL}/api/smart-pills?q=${encodeURIComponent(query)}&threshold=50`
        )

        if (!response.ok) {
          throw new Error(`API responded with ${response.status}`)
        }

        const data = await response.json()

        // Update pills with active state
        const pillsWithActive = (data.pills || []).map((pill: SmartPillType) => ({
          ...pill,
          isActive: activePillIds.has(pill.id),
        }))

        setPills(pillsWithActive)
      } catch (error) {
        console.error('Error fetching smart pills from API:', error)

        // Fallback to hardcoded pills
        const fallbackPills = getSmartPillsForQuery(query)
        setPills(fallbackPills.map((pill) => ({ ...pill, isActive: activePillIds.has(pill.id) })))
      } finally {
        setLoading(false)
      }
    }

    fetchSmartPills()
  }, [query])

  // Update active state when activePillIds changes
  useEffect(() => {
    setPills((currentPills) =>
      currentPills.map((pill) => ({
        ...pill,
        isActive: activePillIds.has(pill.id),
      }))
    )
  }, [activePillIds])

  const handlePillClick = async (pill: SmartPillType) => {
    const newActivePills = new Set(activePillIds)

    if (newActivePills.has(pill.id)) {
      // Deactivate pill
      newActivePills.delete(pill.id)
    } else {
      // Activate pill
      newActivePills.add(pill.id)
    }

    setActivePillIds(newActivePills)

    // Build Algolia filters and keyword query from all active pills
    const activeFilters: string[] = []
    const queryKeywords: string[] = []

    pills.forEach((p) => {
      if (newActivePills.has(p.id)) {
        if (p.filterString) {
          // Regular filter pill
          activeFilters.push(p.filterString)
        } else if (p.filter.operator === 'contains') {
          // Keyword pill - add to search query
          queryKeywords.push(String(p.filter.value))
        }
      }
    })

    const combinedFilters = activeFilters.length > 0 ? activeFilters.join(' AND ') : ''

    // Update search query if there are keyword pills active
    if (queryKeywords.length > 0 || newActivePills.size === 0) {
      // Store the base query if this is the first pill click
      if (baseQuery === '') {
        setBaseQuery(query)
      }

      const newQuery = queryKeywords.length > 0
        ? `${baseQuery || query} ${queryKeywords.join(' ')}`
        : baseQuery || query

      refine(newQuery.trim())
    }

    // Notify parent component of filter changes
    if (onFiltersChange) {
      onFiltersChange(combinedFilters)
    }
  }

  // Don't show if no pills
  if (pills.length === 0) {
    return null
  }

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium text-gray-500 mr-2">
          {loading ? 'Loading filters...' : 'Smart filters:'}
        </span>
        {pills.map((pill, index) => (
          <SmartPill key={pill.id} pill={pill} onClick={handlePillClick} index={index} />
        ))}
      </div>
    </div>
  )
}
