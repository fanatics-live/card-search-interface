import { searchClient, ALGOLIA_INDEX_NAME } from '@/lib/algolia/client'
import type { SavedSearch } from './savedSearches'
import { updateSearchResults } from './savedSearches'

/**
 * Build Algolia filter string from saved search filters
 */
function buildFilterString(filters?: SavedSearch['filters']): string | undefined {
  if (!filters) return undefined

  const filterParts: string[] = []

  // Smart pills would have been converted to filters already
  if (filters.sidebarFilters) {
    const { status, marketplace, gradingService } = filters.sidebarFilters

    if (status && status.length > 0) {
      const statusFilters = status.map((s) => `status:"${s}"`).join(' OR ')
      filterParts.push(`(${statusFilters})`)
    }

    if (marketplace && marketplace.length > 0) {
      const marketplaceFilters = marketplace.map((m) => `marketplace:"${m}"`).join(' OR ')
      filterParts.push(`(${marketplaceFilters})`)
    }

    if (gradingService && gradingService.length > 0) {
      const gradingFilters = gradingService.map((g) => `gradingService:"${g}"`).join(' OR ')
      filterParts.push(`(${gradingFilters})`)
    }
  }

  return filterParts.length > 0 ? filterParts.join(' AND ') : undefined
}

/**
 * Check for new items in a saved search
 * Returns the number of new items found
 */
export async function checkForUpdates(savedSearch: SavedSearch): Promise<{
  newItemsCount: number
  totalResults: number
  newestItemId?: string
  newestItemDate?: number
}> {
  try {
    const index = searchClient.initIndex(ALGOLIA_INDEX_NAME)

    // Build search parameters
    const searchParams: any = {
      hitsPerPage: 1, // We only need the newest item
      distinct: true,
    }

    // Add filters if present
    const filterString = buildFilterString(savedSearch.filters)
    if (filterString) {
      searchParams.filters = filterString
    }

    // Search and sort by newest first (assuming there's a createdAt or timestamp field)
    // If Algolia doesn't have a timestamp field, we'll use objectID as proxy
    const results = await index.search(savedSearch.query, searchParams)

    const totalResults = results.nbHits
    const newestItem = results.hits[0]

    // If this is the first check, just save the current state
    if (!savedSearch.lastNewestItemId && newestItem) {
      const newestItemId = newestItem.objectID
      const newestItemDate = Date.now() // Use current time as baseline

      updateSearchResults(savedSearch.id, totalResults, newestItemId, newestItemDate, 0)

      return {
        newItemsCount: 0,
        totalResults,
        newestItemId,
        newestItemDate,
      }
    }

    // If no items found
    if (!newestItem) {
      return {
        newItemsCount: 0,
        totalResults: 0,
      }
    }

    const newestItemId = newestItem.objectID
    const newestItemDate = Date.now()

    // Check if the newest item is different from what we last saw
    if (savedSearch.lastNewestItemId === newestItemId) {
      // No new items
      updateSearchResults(savedSearch.id, totalResults, newestItemId, newestItemDate, 0)
      return {
        newItemsCount: 0,
        totalResults,
        newestItemId,
        newestItemDate,
      }
    }

    // There are new items - count how many
    // We need to find items newer than our last checked item
    const newItemsCount = await countNewItems(
      savedSearch.query,
      savedSearch.lastNewestItemId,
      filterString
    )

    // Update the saved search with new data
    updateSearchResults(savedSearch.id, totalResults, newestItemId, newestItemDate, newItemsCount)

    return {
      newItemsCount,
      totalResults,
      newestItemId,
      newestItemDate,
    }
  } catch (error) {
    console.error(`Error checking updates for search ${savedSearch.id}:`, error)
    return {
      newItemsCount: 0,
      totalResults: savedSearch.lastResultCount || 0,
    }
  }
}

/**
 * Count how many new items exist since the last checked item
 * This is done by fetching items until we find the last seen item
 */
async function countNewItems(
  query: string,
  lastSeenItemId: string | undefined,
  filterString: string | undefined
): Promise<number> {
  if (!lastSeenItemId) return 0

  try {
    const index = searchClient.initIndex(ALGOLIA_INDEX_NAME)

    // Fetch up to 100 newest items and see how many are before our last seen item
    const searchParams: any = {
      hitsPerPage: 100,
      distinct: true,
    }

    if (filterString) {
      searchParams.filters = filterString
    }

    const results = await index.search(query, searchParams)

    // Find the index of our last seen item
    const lastSeenIndex = results.hits.findIndex((hit: any) => hit.objectID === lastSeenItemId)

    if (lastSeenIndex === -1) {
      // Last seen item not in first 100 results - means 100+ new items
      return 100
    }

    // Number of new items is the index of the last seen item
    return lastSeenIndex
  } catch (error) {
    console.error('Error counting new items:', error)
    return 0
  }
}

/**
 * Check all saved searches for updates
 * Returns array of search IDs that have new items
 */
export async function checkAllSavedSearches(
  savedSearches: SavedSearch[]
): Promise<string[]> {
  const searchesWithUpdates: string[] = []

  // Check each search in parallel
  const results = await Promise.all(
    savedSearches.map(async (search) => {
      const result = await checkForUpdates(search)
      return {
        searchId: search.id,
        hasNewItems: result.newItemsCount > 0,
      }
    })
  )

  // Collect searches with new items
  results.forEach((result) => {
    if (result.hasNewItems) {
      searchesWithUpdates.push(result.searchId)
    }
  })

  return searchesWithUpdates
}

/**
 * Send Discord notification for a saved search update
 */
export async function sendDiscordNotification(
  savedSearch: SavedSearch,
  newItemsCount: number,
  totalResults: number
): Promise<boolean> {
  if (!savedSearch.discordWebhook) {
    return false
  }

  try {
    const searchUrl = new URL(window.location.origin)
    searchUrl.searchParams.set('q', savedSearch.query)

    const embed = {
      title: `🔔 New Items: ${savedSearch.query}`,
      description: `${newItemsCount} new card${newItemsCount > 1 ? 's' : ''} matching your saved search`,
      color: 0x0099ff, // Blue color
      url: searchUrl.toString(),
      fields: [
        { name: 'Total Results', value: totalResults.toString(), inline: true },
        { name: 'New Items', value: newItemsCount.toString(), inline: true },
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Fanatics Card Search',
      },
    }

    const response = await fetch(savedSearch.discordWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
    })

    return response.ok
  } catch (error) {
    console.error('Error sending Discord notification:', error)
    return false
  }
}
