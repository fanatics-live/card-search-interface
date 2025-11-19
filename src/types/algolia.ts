// Algolia Hit type representing a card in search results
export interface AlgoliaCardHit {
  objectID: string
  listingId: string
  title: string
  subtitle?: string
  marketplace: 'FIXED' | 'WEEKLY' | 'PREMIER'
  marketplaceSource: string
  currentPrice: number // in dollars

  // Card-specific fields
  gradingService?: string
  grade?: string | number | null
  gradeValue?: number | null
  certNumber?: string
  eyeAppeal?: string
  cardNumber?: string

  // Pricing hierarchy
  value?: number
  confidence?: number
  confidenceValue?: number

  // Status
  status: 'Live' | 'Sold' | 'Canceled' | 'Unpublished'
  statusInt: 0 | 1 | 10
  soldDate?: number // unix timestamp

  // Metadata
  favoriteCount?: number
  offerCount?: number
  hasOffers?: boolean
  customFilters?: string[]

  // Value metrics
  bestValueRatio?: number
  forYouScore?: number
  guidePriceRatio?: number
  greatPrice?: boolean
  fanaticsAuthentic?: boolean

  // Category
  categoryParent?: string
  subCategory1?: string

  // Images - nested structure with primary/secondary and large/medium
  images?: {
    primary?: {
      large?: string
      medium?: string
    }
    secondary?: {
      large?: string
      medium?: string
    }
  }

  // Highlighting (added by Algolia)
  _highlightResult?: {
    [key: string]: {
      value: string
      matchLevel: 'none' | 'partial' | 'full'
      matchedWords: string[]
    }
  }
}

// Grading service enum
export enum GradingService {
  PSA = 'PSA',
  BGS = 'BGS',
  SGC = 'SGC',
  CGC = 'CGC',
  CSG = 'CSG',
  BVG = 'BVG',
  BECKETT = 'BECKETT',
  RAW = 'RAW',
}

// Grade color mapping
export const GRADE_COLORS: Record<string, string> = {
  'PSA_10': 'bg-grade-psa-10 text-white',
  'PSA_9': 'bg-grade-psa-9 text-white',
  'PSA_8': 'bg-grade-psa-8 text-white',
  'BGS_10': 'bg-grade-bgs-10 text-white',
  'BGS_9.5': 'bg-grade-bgs-95 text-white',
}

// Status enum
export enum CardStatus {
  Live = 'Live',
  Sold = 'Sold',
  Canceled = 'Canceled',
  Unpublished = 'Unpublished',
}
