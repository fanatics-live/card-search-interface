import { useState, useEffect } from 'react'
import { useSearchBox, useInstantSearch } from 'react-instantsearch'
import { SmartPill } from './SmartPill'
import { getSmartPillsForQuery } from '@/types/smartPills'
import type { SmartPill as SmartPillType } from '@/types/smartPills'
import { searchClient, ALGOLIA_INDEX_NAME } from '@/lib/algolia/client'

const API_URL = import.meta.env.VITE_API_URL || ''

interface SmartPillsProps {
  onFiltersChange?: (filters: string) => void
}

export function SmartPills({ onFiltersChange }: SmartPillsProps) {
  const { query, refine } = useSearchBox()
  const { results } = useInstantSearch()
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
        console.log('Falling back to hardcoded pills')
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

  // REMOVED: Auto-update on results change to avoid infinite loops
  // Pill counts will be updated when pills are clicked

  const buildAlgoliaFilter = (pill: SmartPillType): string | null => {
    const { attribute, value, operator = '=' } = pill.filter

    // Keywords use query expansion, not filters
    if (operator === 'contains') {
      return null
    }

    // Handle different filter types for Algolia
    if (typeof value === 'boolean') {
      return `${attribute}:${value}`
    } else if (operator === 'range') {
      // Price range handling
      if (attribute === 'currentPrice') {
        const rangeStr = String(value)
        if (rangeStr === '$0-100') {
          return 'currentPrice < 100'
        } else if (rangeStr === '$100-500') {
          return 'currentPrice >= 100 AND currentPrice < 500'
        } else if (rangeStr === '$500-1000') {
          return 'currentPrice >= 500 AND currentPrice < 1000'
        } else if (rangeStr === '$1000+') {
          return 'currentPrice >= 1000'
        }
      }
      return `${attribute}:${value}`
    } else if (operator === '<') {
      return `${attribute} < ${value}`
    } else if (operator === '>') {
      return `${attribute} > ${value}`
    } else if (operator === '<=') {
      return `${attribute} <= ${value}`
    } else if (operator === '>=') {
      return `${attribute} >= ${value}`
    } else if (typeof value === 'string') {
      // String exact match
      return `${attribute}:"${value}"`
    } else {
      // Numeric exact match
      return `${attribute}:${value}`
    }
  }

  const updatePillCounts = async (activePills: Set<string>) => {
    console.log('🔄 updatePillCounts called')
    console.log('  Active pills:', Array.from(activePills))
    console.log('  Current query:', query)

    // Build base filters from active pills
    const baseFilters: string[] = []
    const baseKeywords: string[] = []
    pills.forEach((p) => {
      if (activePills.has(p.id)) {
        const filter = buildAlgoliaFilter(p)
        if (filter) {
          baseFilters.push(filter)
        } else if (p.filter.operator === 'contains') {
          // Keyword pill - add to query
          baseKeywords.push(String(p.filter.value))
        }
      }
    })

    // Get sidebar filters from results (refinement lists)
    const sidebarFilters: string[] = []
    const resultsParams = (results as any)?.params
    if (resultsParams) {
      const filterMatch = String(resultsParams).match(/filters=([^&]*)/)
      if (filterMatch?.[1]) {
        const decodedFilter = decodeURIComponent(filterMatch[1])
        // Extract sidebar filters (they're in the actual results but not in our smart pill filters)
        if (decodedFilter && decodedFilter !== 'None') {
          // Parse out filters that aren't from smart pills
          const allFiltersFromAlgolia = decodedFilter.split(' AND ')
          const smartPillFilterStrings = baseFilters.map(f => f.trim())
          allFiltersFromAlgolia.forEach(f => {
            const trimmed = f.trim()
            if (!smartPillFilterStrings.includes(trimmed)) {
              sidebarFilters.push(trimmed)
            }
          })
        }
      }
    }

    const baseFilterString = [...baseFilters, ...sidebarFilters].filter(f => f).join(' AND ')
    const baseQuery = baseKeywords.length > 0 ? `${query} ${baseKeywords.join(' ')}` : query
    console.log('  Base filter string (smart pills):', baseFilters.join(' AND ') || 'None')
    console.log('  Sidebar filters:', sidebarFilters.join(' AND ') || 'None')
    console.log('  Combined filters:', baseFilterString || 'None')
    console.log('  Base query:', baseQuery)

    // Fetch updated counts for all pills
    const index = searchClient.initIndex(ALGOLIA_INDEX_NAME)

    const updatedPills = await Promise.all(
      pills.map(async (p) => {
        // Don't update count for active pills (they would return 0)
        if (activePills.has(p.id)) {
          console.log(`  Skipping active pill: ${p.label}`)
          return { ...p, isActive: true }
        }

        try {
          const pillFilter = buildAlgoliaFilter(p)

          // Handle keyword pills
          if (p.filter.operator === 'contains') {
            const keywordQuery = `${baseQuery} ${p.filter.value}`
            console.log(`  Fetching count for ${p.label}: query="${keywordQuery}", filter="${baseFilterString || 'none'}"`)

            const result = await index.search(keywordQuery, {
              filters: baseFilterString || undefined,
              hitsPerPage: 0,
              distinct: true,
            })

            console.log(`  ${p.label}: ${p.count} → ${result.nbHits}`)

            return {
              ...p,
              count: result.nbHits,
              isActive: false,
            }
          }

          // Handle regular filter pills
          const combinedFilter =
            baseFilterString && pillFilter
              ? `${baseFilterString} AND ${pillFilter}`
              : baseFilterString || pillFilter

          console.log(`  Fetching count for ${p.label}: filter="${combinedFilter}", distinct=true`)

          const result = await index.search(baseQuery, {
            filters: combinedFilter || undefined,
            hitsPerPage: 0,
            distinct: true, // Must match SEARCH_CONFIG
          })

          console.log(`  ${p.label}: ${p.count} → ${result.nbHits}`)

          return {
            ...p,
            count: result.nbHits,
            isActive: false,
          }
        } catch (error) {
          console.error(`Error updating count for pill ${p.id}:`, error)
          return { ...p, isActive: activePills.has(p.id) }
        }
      })
    )

    setPills(updatedPills)
    console.log('✅ Pill counts updated')
  }

  const handlePillClick = async (pill: SmartPillType) => {
    const newActivePills = new Set(activePillIds)

    if (newActivePills.has(pill.id)) {
      // Deactivate pill
      newActivePills.delete(pill.id)
      console.log(`🔴 Deactivating pill: ${pill.label}`)
    } else {
      // Activate pill
      newActivePills.add(pill.id)
      console.log(`🟢 Activating pill: ${pill.label}`)
    }

    setActivePillIds(newActivePills)

    // Build Algolia filters and keyword query from all active pills
    const activeFilters: string[] = []
    const queryKeywords: string[] = []

    pills.forEach((p) => {
      if (newActivePills.has(p.id)) {
        const filter = buildAlgoliaFilter(p)
        if (filter) {
          // Regular filter pill
          activeFilters.push(filter)
          console.log(`  ✓ Adding filter: ${filter}`)
        } else if (p.filter.operator === 'contains') {
          // Keyword pill - add to search query
          queryKeywords.push(String(p.filter.value))
          console.log(`  📝 Adding to query: ${p.filter.value}`)
        }
      }
    })

    const combinedFilters = activeFilters.length > 0 ? activeFilters.join(' AND ') : ''
    console.log(`📊 Combined Algolia filters: ${combinedFilters || 'None'}`)

    // Update search query if there are keyword pills active
    if (queryKeywords.length > 0 || newActivePills.size === 0) {
      // Store the base query if this is the first pill click
      if (baseQuery === '') {
        setBaseQuery(query)
      }

      const newQuery = queryKeywords.length > 0
        ? `${baseQuery || query} ${queryKeywords.join(' ')}`
        : baseQuery || query

      console.log(`📝 Updated search query: "${newQuery}"`)
      refine(newQuery.trim())
    }

    // Notify parent component of filter changes
    if (onFiltersChange) {
      onFiltersChange(combinedFilters)
    }

    // Update counts on other pills to reflect the current filters
    console.log('🔄 Updating pill counts with active filters...')
    await updatePillCounts(newActivePills)
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
