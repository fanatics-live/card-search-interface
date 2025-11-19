import algoliasearch from 'algoliasearch'

// Environment variables
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID
const ALGOLIA_SEARCH_API_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY
export const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'fanatics_cards'

if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API_KEY) {
  console.error(
    'Missing Algolia configuration. Please set VITE_ALGOLIA_APP_ID and VITE_ALGOLIA_SEARCH_API_KEY in your .env file'
  )
}

// Create Algolia client
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY)

// Get search index
export const getSearchIndex = () => searchClient.initIndex(ALGOLIA_INDEX_NAME)

// Query suggestions index
export const SUGGESTIONS_INDEX_NAME = `${ALGOLIA_INDEX_NAME}_query_suggestions`
export const getSuggestionsIndex = () => searchClient.initIndex(SUGGESTIONS_INDEX_NAME)

// Search configuration
export const SEARCH_CONFIG = {
  hitsPerPage: 24,
  attributesToRetrieve: ['*'],
  attributesToHighlight: ['title', 'subtitle', 'cardNumber', 'certNumber'],
  highlightPreTag: '<mark class="bg-yellow-200">',
  highlightPostTag: '</mark>',
  typoTolerance: true,
  removeWordsIfNoResults: 'allOptional' as const,
  distinct: true,
  maxValuesPerFacet: 100,
}

// Facet attributes for filtering
export const FACET_ATTRIBUTES = [
  'status',
  'marketplace',
  'gradingService',
  'grade',
  'categoryParent',
  'subCategory1',
  'greatPrice',
  'fanaticsAuthentic',
  'hasOffers',
]

// Numeric attributes for range filters
export const NUMERIC_ATTRIBUTES = [
  'currentPrice',
  'gradeValue',
  'value',
  'confidenceValue',
  'favoriteCount',
  'offerCount',
]
