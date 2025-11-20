const SAVED_SEARCHES_KEY = 'fanatics_saved_searches'
const MAX_SAVED_SEARCHES = 50 // Allow up to 50 saved searches

export interface SavedSearchFilters {
  smartPills?: string[] // Active smart pill IDs
  sidebarFilters?: {
    status?: string[]
    marketplace?: string[]
    gradingService?: string[]
  }
}

export interface SavedSearch {
  id: string // Unique identifier
  query: string // Search query text
  filters?: SavedSearchFilters // Optional: saved filters
  savedAt: number // Timestamp when saved
  lastChecked?: number // Last time we checked for updates
  lastResultCount?: number // Number of results when last checked
  lastNewestItemId?: string // ID of the most recent item when last checked
  lastNewestItemDate?: number // Timestamp of newest item when last checked
  newItemsCount?: number // Number of new items since last check
  notificationsEnabled: boolean // Whether to notify for this search
  discordWebhook?: string // Optional Discord webhook URL for notifications
}

/**
 * Generate a unique ID for a saved search
 */
function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Get all saved searches from localStorage
 */
export function getSavedSearches(): SavedSearch[] {
  try {
    const stored = localStorage.getItem(SAVED_SEARCHES_KEY)
    if (!stored) return []

    const searches: SavedSearch[] = JSON.parse(stored)
    // Sort by: new items first, then most recently saved
    return searches.sort((a, b) => {
      if (a.newItemsCount && b.newItemsCount) {
        return b.newItemsCount - a.newItemsCount
      }
      if (a.newItemsCount) return -1
      if (b.newItemsCount) return 1
      return b.savedAt - a.savedAt
    })
  } catch (error) {
    console.error('Error reading saved searches:', error)
    return []
  }
}

/**
 * Check if a search is already saved
 */
export function isSearchSaved(query: string, filters?: SavedSearchFilters): boolean {
  try {
    const searches = getSavedSearches()
    const normalizedQuery = query.trim().toLowerCase()

    return searches.some((search) => {
      const queryMatches = search.query.toLowerCase() === normalizedQuery

      // If no filters provided, just match query
      if (!filters) return queryMatches

      // Compare filters if provided
      const filtersMatch = JSON.stringify(search.filters || {}) === JSON.stringify(filters)
      return queryMatches && filtersMatch
    })
  } catch (error) {
    console.error('Error checking if search is saved:', error)
    return false
  }
}

/**
 * Get a specific saved search by ID
 */
export function getSavedSearch(id: string): SavedSearch | undefined {
  const searches = getSavedSearches()
  return searches.find((s) => s.id === id)
}

/**
 * Save a new search
 */
export function saveSearch(
  query: string,
  filters?: SavedSearchFilters,
  notificationsEnabled: boolean = true
): SavedSearch {
  if (!query || query.trim().length === 0) {
    throw new Error('Query cannot be empty')
  }

  const searches = getSavedSearches()

  // Check if already saved
  const normalizedQuery = query.trim().toLowerCase()
  const existing = searches.find((s) => {
    const queryMatches = s.query.toLowerCase() === normalizedQuery
    const filtersMatch = JSON.stringify(s.filters || {}) === JSON.stringify(filters || {})
    return queryMatches && filtersMatch
  })

  if (existing) {
    // Update existing search
    existing.savedAt = Date.now()
    existing.notificationsEnabled = notificationsEnabled
    saveSavedSearches(searches)
    return existing
  }

  // Create new search
  const newSearch: SavedSearch = {
    id: generateSearchId(),
    query: query.trim(),
    filters,
    savedAt: Date.now(),
    notificationsEnabled,
  }

  searches.unshift(newSearch)

  // Keep only MAX_SAVED_SEARCHES
  const limited = searches.slice(0, MAX_SAVED_SEARCHES)
  saveSavedSearches(limited)

  return newSearch
}

/**
 * Remove a saved search
 */
export function removeSavedSearch(id: string): void {
  try {
    const searches = getSavedSearches()
    const filtered = searches.filter((s) => s.id !== id)
    saveSavedSearches(filtered)
  } catch (error) {
    console.error('Error removing saved search:', error)
  }
}

/**
 * Update search results metadata (after checking for updates)
 */
export function updateSearchResults(
  id: string,
  resultCount: number,
  newestItemId?: string,
  newestItemDate?: number,
  newItemsCount?: number
): void {
  try {
    const searches = getSavedSearches()
    const search = searches.find((s) => s.id === id)

    if (search) {
      search.lastChecked = Date.now()
      search.lastResultCount = resultCount
      if (newestItemId) search.lastNewestItemId = newestItemId
      if (newestItemDate) search.lastNewestItemDate = newestItemDate
      if (newItemsCount !== undefined) search.newItemsCount = newItemsCount

      saveSavedSearches(searches)
    }
  } catch (error) {
    console.error('Error updating search results:', error)
  }
}

/**
 * Mark a search as checked (clear new items badge)
 */
export function markAsChecked(id: string): void {
  try {
    const searches = getSavedSearches()
    const search = searches.find((s) => s.id === id)

    if (search) {
      search.newItemsCount = 0
      saveSavedSearches(searches)
    }
  } catch (error) {
    console.error('Error marking search as checked:', error)
  }
}

/**
 * Update Discord webhook URL for a saved search
 */
export function updateDiscordWebhook(id: string, webhookUrl: string): void {
  try {
    const searches = getSavedSearches()
    const search = searches.find((s) => s.id === id)

    if (search) {
      search.discordWebhook = webhookUrl.trim() || undefined
      saveSavedSearches(searches)
    }
  } catch (error) {
    console.error('Error updating Discord webhook:', error)
  }
}

/**
 * Clear all saved searches
 */
export function clearSavedSearches(): void {
  try {
    localStorage.removeItem(SAVED_SEARCHES_KEY)
  } catch (error) {
    console.error('Error clearing saved searches:', error)
  }
}

/**
 * Internal: Save searches array to localStorage
 */
function saveSavedSearches(searches: SavedSearch[]): void {
  try {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}
