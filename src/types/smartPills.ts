// Smart Pills types for quick filter suggestions

export interface SmartPill {
  id: string
  label: string
  icon?: string
  count?: number // Number of results matching this filter
  filter: {
    attribute: string // Algolia attribute to filter on
    value: string | number | boolean
    operator?: '=' | '>' | '<' | '>=' | '<=' | 'range'
  }
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray'
  isActive?: boolean
}

export interface SmartPillGroup {
  query: string // The search query this group applies to
  pills: SmartPill[]
}

// Predefined smart pill configurations based on query patterns
export const SMART_PILL_CONFIGS: Record<string, SmartPill[]> = {
  // Default pills for empty query
  default: [
    {
      id: 'psa-10',
      label: 'PSA 10',
      icon: '🏆',
      filter: { attribute: 'gradingService', value: 'PSA' },
      color: 'green',
    },
    {
      id: 'rookies',
      label: 'Rookies',
      icon: '⭐',
      filter: { attribute: 'customFilters', value: 'rookie' },
      color: 'blue',
    },
    {
      id: 'under-100',
      label: 'Under $100',
      icon: '💰',
      filter: { attribute: 'currentPrice', value: 100, operator: '<' },
      color: 'amber',
    },
    {
      id: 'great-price',
      label: 'Great Deals',
      icon: '🔥',
      filter: { attribute: 'greatPrice', value: true },
      color: 'red',
    },
  ],

  // Pills for "lebron" or "lebron james"
  lebron: [
    {
      id: 'lebron-rookie',
      label: 'Rookie Cards',
      icon: '⭐',
      filter: { attribute: 'customFilters', value: 'rookie' },
      color: 'blue',
    },
    {
      id: 'lebron-auto',
      label: 'Autographs',
      icon: '✍️',
      filter: { attribute: 'customFilters', value: 'auto' },
      color: 'purple',
    },
    {
      id: 'lebron-psa10',
      label: 'PSA 10',
      icon: '🏆',
      filter: { attribute: 'grade', value: 10 },
      color: 'green',
    },
    {
      id: 'lebron-chrome',
      label: 'Chrome',
      icon: '✨',
      filter: { attribute: 'title', value: 'chrome' },
      color: 'gray',
    },
  ],

  // Pills for "jordan" or "michael jordan"
  jordan: [
    {
      id: 'jordan-rookie',
      label: 'Rookie Cards',
      icon: '⭐',
      filter: { attribute: 'customFilters', value: 'rookie' },
      color: 'blue',
    },
    {
      id: 'jordan-fleer',
      label: 'Fleer',
      icon: '📇',
      filter: { attribute: 'brand', value: 'fleer' },
      color: 'red',
    },
    {
      id: 'jordan-psa10',
      label: 'PSA 10',
      icon: '🏆',
      filter: { attribute: 'grade', value: 10 },
      color: 'green',
    },
    {
      id: 'jordan-auto',
      label: 'Autographs',
      icon: '✍️',
      filter: { attribute: 'customFilters', value: 'auto' },
      color: 'purple',
    },
  ],

  // Pills for grading searches
  psa: [
    {
      id: 'psa-10',
      label: 'Grade 10',
      icon: '🏆',
      filter: { attribute: 'grade', value: 10 },
      color: 'green',
    },
    {
      id: 'psa-9',
      label: 'Grade 9',
      icon: '⭐',
      filter: { attribute: 'grade', value: 9 },
      color: 'blue',
    },
    {
      id: 'psa-rookie',
      label: 'Rookies',
      icon: '⭐',
      filter: { attribute: 'customFilters', value: 'rookie' },
      color: 'purple',
    },
  ],

  // Pills for "rookie" searches
  rookie: [
    {
      id: 'rookie-psa10',
      label: 'PSA 10',
      icon: '🏆',
      filter: { attribute: 'grade', value: 10 },
      color: 'green',
    },
    {
      id: 'rookie-auto',
      label: 'Autographs',
      icon: '✍️',
      filter: { attribute: 'customFilters', value: 'auto' },
      color: 'purple',
    },
    {
      id: 'rookie-under-500',
      label: 'Under $500',
      icon: '💰',
      filter: { attribute: 'currentPrice', value: 500, operator: '<' },
      color: 'amber',
    },
  ],
}

/**
 * Get smart pills for a given search query
 * This will be enhanced later to use backend suggestions
 */
export function getSmartPillsForQuery(query: string): SmartPill[] {
  const normalizedQuery = query.toLowerCase().trim()

  // Check for exact matches first
  if (SMART_PILL_CONFIGS[normalizedQuery]) {
    return SMART_PILL_CONFIGS[normalizedQuery]
  }

  // Check for partial matches
  if (normalizedQuery.includes('lebron')) {
    return SMART_PILL_CONFIGS.lebron
  }
  if (normalizedQuery.includes('jordan')) {
    return SMART_PILL_CONFIGS.jordan
  }
  if (normalizedQuery.includes('psa')) {
    return SMART_PILL_CONFIGS.psa
  }
  if (normalizedQuery.includes('rookie')) {
    return SMART_PILL_CONFIGS.rookie
  }

  // Default pills for any other query
  if (normalizedQuery) {
    return SMART_PILL_CONFIGS.default
  }

  // Empty query - show default suggestions
  return SMART_PILL_CONFIGS.default
}
