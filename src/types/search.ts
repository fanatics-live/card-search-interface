// Search state and configuration types

export interface SearchState {
  query: string
  page: number
  hitsPerPage: number
  filters: SearchFilters
  sortBy: SortOption
}

export interface SearchFilters {
  status?: string[]
  gradingService?: string[]
  gradeRange?: [number, number]
  priceRange?: [number, number]
  valueRange?: [number, number]
  confidenceRange?: [number, number]
  year?: string[]
  brand?: string[]
  player?: string[]
  greatPrice?: boolean
  fanaticsAuthentic?: boolean
  hasOffers?: boolean
}

export type SortOption =
  | 'relevance'
  | 'price_asc'
  | 'price_desc'
  | 'grade_desc'
  | 'value_desc'
  | 'popular_desc'

export const SORT_OPTIONS: Record<SortOption, { label: string; indexName?: string }> = {
  relevance: { label: 'Relevance' },
  price_asc: { label: 'Price: Low to High', indexName: 'fanatics_cards_price_asc' },
  price_desc: { label: 'Price: High to Low', indexName: 'fanatics_cards_price_desc' },
  grade_desc: { label: 'Grade: High to Low', indexName: 'fanatics_cards_grade_desc' },
  value_desc: { label: 'Best Value', indexName: 'fanatics_cards_value_desc' },
  popular_desc: { label: 'Most Popular', indexName: 'fanatics_cards_popular_desc' },
}

export interface QuickFilter {
  id: string
  label: string
  icon: string
  filters: Partial<SearchFilters>
}
