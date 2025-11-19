const RECENT_SEARCHES_KEY = 'fanatics_recent_searches'
const MAX_RECENT_SEARCHES = 10

export interface RecentSearch {
  query: string
  timestamp: number
  count?: number // Number of times searched
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): RecentSearch[] {
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    if (!stored) return []

    const searches: RecentSearch[] = JSON.parse(stored)
    return searches.sort((a, b) => b.timestamp - a.timestamp)
  } catch (error) {
    console.error('Error reading recent searches:', error)
    return []
  }
}

/**
 * Add a search to recent searches
 */
export function addRecentSearch(query: string): void {
  if (!query || query.trim().length === 0) return

  try {
    const searches = getRecentSearches()
    const normalizedQuery = query.trim().toLowerCase()

    // Find existing search
    const existingIndex = searches.findIndex(
      (s) => s.query.toLowerCase() === normalizedQuery
    )

    if (existingIndex >= 0) {
      // Update existing search
      searches[existingIndex] = {
        ...searches[existingIndex],
        query: query.trim(), // Keep original casing from latest search
        timestamp: Date.now(),
        count: (searches[existingIndex].count || 1) + 1,
      }
    } else {
      // Add new search
      searches.unshift({
        query: query.trim(),
        timestamp: Date.now(),
        count: 1,
      })
    }

    // Keep only MAX_RECENT_SEARCHES
    const limited = searches.slice(0, MAX_RECENT_SEARCHES)

    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(limited))
  } catch (error) {
    console.error('Error saving recent search:', error)
  }
}

/**
 * Remove a specific search from recent searches
 */
export function removeRecentSearch(query: string): void {
  try {
    const searches = getRecentSearches()
    const filtered = searches.filter(
      (s) => s.query.toLowerCase() !== query.toLowerCase()
    )
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered))
  } catch (error) {
    console.error('Error removing recent search:', error)
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY)
  } catch (error) {
    console.error('Error clearing recent searches:', error)
  }
}
