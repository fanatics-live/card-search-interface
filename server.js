import express from 'express'
import cors from 'cors'
import algoliasearch from 'algoliasearch'
import { createClient } from 'redis'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import { CARD_MANUFACTURERS as CARD_MANUFACTURERS_LIST } from './shared-constants.js'

dotenv.config({ path: '.env.local' })

const app = express()
const PORT = process.env.PORT || 3001

// Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to all requests
app.use(limiter)

// Security: Restrict CORS
const allowedOrigins = [process.env.VITE_APP_URL || 'http://localhost:5173', 'http://localhost:3000']
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true)
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.'
      return callback(new Error(msg), false)
    }
    return callback(null, true)
  }
}))

app.use(express.json())

// Algolia client
const algoliaClient = algoliasearch(
  process.env.VITE_ALGOLIA_APP_ID,
  process.env.VITE_ALGOLIA_SEARCH_API_KEY
)
const index = algoliaClient.initIndex(process.env.VITE_ALGOLIA_INDEX_NAME)
const suggestionsIndex = algoliaClient.initIndex(`${process.env.VITE_ALGOLIA_INDEX_NAME}_query_suggestions`)

// Redis client (optional)
let redisClient = null
let redisConnected = false

// Only try Redis if explicitly configured
if (process.env.REDIS_URL) {
  try {
    redisClient = createClient({ url: process.env.REDIS_URL })
    redisClient.on('error', (err) => {
      console.warn('Redis error:', err.message)
    })
    await redisClient.connect()
    redisConnected = true
    console.log('Redis connected successfully')
  } catch (err) {
    console.warn('Redis not available, running without cache:', err.message)
    redisClient = null
  }
} else {
  console.log('Redis not configured, running without cache')
}

/**
 * Known card manufacturers/brands (not player names)
 */
const CARD_MANUFACTURERS = new Set(CARD_MANUFACTURERS_LIST)

/**
 * Extract features from search results
 */
function extractFeatures(results) {
  const features = {
    gradingServices: new Map(),
    grades: new Map(),
    brands: new Map(),
    years: new Map(),
    keywords: new Map(),
    priceRanges: new Map(),
  }

  // Card-specific keywords to look for (expanded list)
  const cardKeywords = [
    'rookie',
    'auto',
    'autograph',
    'chrome',
    'prizm',
    'refractor',
    'numbered',
    'jersey',
    'patch',
    'parallel',
    'insert',
    'rookie card',
    'rc',
    'base',
    'short print',
    'sp',
    'exclusive',
    'rpa',
    'serial',
    // Additional popular keywords
    'optic',
    'select',
    'mosaic',
    'donruss',
    'topps',
    'panini',
    'fleer',
    'upper deck',
    'bowman',
    'certified',
    'limited',
    'silver',
    'gold',
    'holo',
    'shimmer',
    'wave',
    'cracked ice',
    'stained glass',
    'signed',
    'auto',
    'mem',
    'memorabilia',
    '/99',
    '/25',
    '/10',
    '/5',
    '/1',
    '1/1',
  ]

  results.forEach((hit) => {
    // Count grading services
    if (hit.gradingService) {
      const service = hit.gradingService.toUpperCase()
      features.gradingServices.set(service, (features.gradingServices.get(service) || 0) + 1)
    }

    // Count grades
    if (hit.grade !== null && hit.grade !== undefined) {
      const grade = Number(hit.grade)
      features.grades.set(grade, (features.grades.get(grade) || 0) + 1)
    }

    // Extract keywords from title
    const titleLower = (hit.title || '').toLowerCase()
    const titleWords = titleLower.split(/\s+/)

    cardKeywords.forEach((keyword) => {
      if (titleLower.includes(keyword)) {
        features.keywords.set(keyword, (features.keywords.get(keyword) || 0) + 1)
      }
    })

    // Price ranges
    const price = hit.currentPrice || 0
    let range = ''
    if (price < 100) range = '$0-100'
    else if (price < 500) range = '$100-500'
    else if (price < 1000) range = '$500-1000'
    else range = '$1000+'

    features.priceRanges.set(range, (features.priceRanges.get(range) || 0) + 1)

    // Year extraction
    if (hit.year) {
      const yearStr = String(hit.year)
      features.years.set(yearStr, (features.years.get(yearStr) || 0) + 1)
    }

    // Brand - only count known manufacturers, not player names
    if (hit.brand && CARD_MANUFACTURERS.has(hit.brand)) {
      features.brands.set(hit.brand, (features.brands.get(hit.brand) || 0) + 1)
    }
  })

  return features
}

/**
 * Get icon for grading service
 */
function getGradingServiceIcon(service) {
  const icons = {
    PSA: '🏆',
    BGS: '💎',
    SGC: '⭐',
    CGC: '🎯',
  }
  return icons[service] || '📋'
}

/**
 * Get icon for keyword
 */
function getKeywordIcon(keyword) {
  const icons = {
    rookie: '⭐',
    'rookie card': '⭐',
    rc: '⭐',
    auto: '✍️',
    autograph: '✍️',
    signed: '✍️',
    rpa: '✍️',
    chrome: '✨',
    prizm: '🌈',
    optic: '🔮',
    select: '🎯',
    mosaic: '🎨',
    refractor: '💫',
    numbered: '🔢',
    serial: '🔢',
    jersey: '👕',
    patch: '🧩',
    mem: '🎁',
    memorabilia: '🎁',
    parallel: '📊',
    insert: '🎴',
    base: '📇',
    'short print': '💎',
    sp: '💎',
    exclusive: '👑',
    limited: '⭐',
    certified: '✅',
    silver: '🥈',
    gold: '🥇',
    holo: '✨',
    '/99': '🔢',
    '/25': '💎',
    '/10': '👑',
    '/5': '💫',
    '/1': '🏆',
    '1/1': '🏆',
    '1/1': '🏆',
  }
  return icons[keyword] || '🎯'
}

/**
 * Capitalize keyword for display
 */
function capitalizeKeyword(keyword) {
  const labels = {
    rookie: 'Rookie Cards',
    'rookie card': 'Rookie Cards',
    rc: 'Rookie Cards',
    auto: 'Autographs',
    autograph: 'Autographs',
    signed: 'Signed',
    rpa: 'Rookie Patch Auto',
    chrome: 'Chrome',
    prizm: 'Prizm',
    optic: 'Optic',
    select: 'Select',
    mosaic: 'Mosaic',
    donruss: 'Donruss',
    topps: 'Topps',
    panini: 'Panini',
    fleer: 'Fleer',
    'upper deck': 'Upper Deck',
    bowman: 'Bowman',
    refractor: 'Refractors',
    numbered: 'Numbered',
    serial: 'Serial Numbered',
    jersey: 'Jersey Cards',
    patch: 'Patch Cards',
    mem: 'Memorabilia',
    memorabilia: 'Memorabilia',
    parallel: 'Parallels',
    insert: 'Inserts',
    base: 'Base Cards',
    'short print': 'Short Prints',
    sp: 'Short Prints',
    exclusive: 'Exclusives',
    limited: 'Limited',
    certified: 'Certified',
    silver: 'Silver',
    gold: 'Gold',
    holo: 'Holo',
    shimmer: 'Shimmer',
    wave: 'Wave',
    'cracked ice': 'Cracked Ice',
    'stained glass': 'Stained Glass',
    '/99': 'Numbered /99',
    '/25': 'Numbered /25',
    '/10': 'Numbered /10',
    '/5': 'Numbered /5',
    '/1': 'Numbered /1',
    '1/1': 'One of One',
  }
  return labels[keyword] || keyword.charAt(0).toUpperCase() + keyword.slice(1)
}

/**
 * Get color for keyword
 */
function getKeywordColor(keyword) {
  const colors = {
    rookie: 'blue',
    'rookie card': 'blue',
    rc: 'blue',
    auto: 'purple',
    autograph: 'purple',
    rpa: 'purple',
    chrome: 'blue',
    prizm: 'blue',
    refractor: 'blue',
    numbered: 'amber',
    serial: 'amber',
    jersey: 'green',
    patch: 'green',
  }
  return colors[keyword] || 'gray'
}

/**
 * Convert features to smart pills (with placeholder counts)
 */
function featuresToPills(features, totalResults, sampleSize) {
  const pills = []
  const minThreshold = sampleSize * 0.02 // 2% of sample (2 out of 100 cards)

  // Grading Services
  features.gradingServices.forEach((count, service) => {
    if (count >= minThreshold) {
      pills.push({
        id: `service-${service.toLowerCase()}`,
        label: service,
        icon: getGradingServiceIcon(service),
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'gradingService', value: service },
        color: 'green',
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Grades (only popular ones: 10, 9.5, 9)
  features.grades.forEach((count, grade) => {
    if (count >= minThreshold && (grade === 10 || grade === 9.5 || grade === 9)) {
      pills.push({
        id: `grade-${grade}`,
        label: `Grade ${grade}`,
        icon: grade === 10 ? '🏆' : '⭐',
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'grade', value: grade },
        color: 'green',
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Keywords - use title search instead of customFilters
  features.keywords.forEach((count, keyword) => {
    if (count >= minThreshold) {
      pills.push({
        id: `keyword-${keyword.replace(/\s+/g, '-')}`,
        label: capitalizeKeyword(keyword),
        icon: getKeywordIcon(keyword),
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'title', value: keyword, operator: 'contains' },
        color: getKeywordColor(keyword),
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Years (top 3 most common)
  const topYears = Array.from(features.years.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topYears.forEach(([year, count]) => {
    if (count >= minThreshold) {
      pills.push({
        id: `year-${year}`,
        label: year,
        icon: '📅',
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'year', value: year },
        color: 'gray',
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Brands (top 3)
  const topBrands = Array.from(features.brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topBrands.forEach(([brand, count]) => {
    if (count >= minThreshold) {
      pills.push({
        id: `brand-${brand.toLowerCase().replace(/\s+/g, '-')}`,
        label: brand,
        icon: '📇',
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'brand', value: brand },
        color: 'blue',
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Price ranges
  features.priceRanges.forEach((count, range) => {
    if (count >= minThreshold) {
      pills.push({
        id: `price-${range.replace(/\$/g, '').replace(/\+/g, 'plus')}`,
        label: range,
        icon: '💰',
        count: 0, // Will be filled with actual count later
        filter: { attribute: 'currentPrice', value: range, operator: 'range' },
        color: 'amber',
        score: count / sampleSize,
      })
      pills[pills.length - 1].filterString = buildAlgoliaFilter(pills[pills.length - 1])
    }
  })

  // Sort by relevance score and return top 20 (increased from 10)
  return pills.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20)
}

/**
 * Build Algolia filter string for a pill
 */
function buildAlgoliaFilter(pill) {
  const { attribute, value, operator = '=' } = pill.filter

  if (typeof value === 'boolean') {
    return `${attribute}:${value}`
  } else if (operator === 'contains') {
    // For title search with keywords - return null to handle differently
    return null
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
  } else if (typeof value === 'string') {
    return `${attribute}:"${value}"`
  } else {
    return `${attribute}:${value}`
  }
}

/**
 * Fetch actual counts for pills (matching frontend config) - parallelized
 */
async function fetchActualCounts(query, pills) {
  // Process pills in parallel
  const pillsWithCounts = await Promise.all(pills.map(async (pill) => {
    try {
      const filter = buildAlgoliaFilter(pill)

      // Handle keyword pills (title search) differently
      if (pill.filter.operator === 'contains') {
        // For keywords, add the keyword to the search query
        const keywordQuery = `${query} ${pill.filter.value}`
        const result = await index.search(keywordQuery, {
          hitsPerPage: 0,
          distinct: true,
        })

        return {
          ...pill,
          count: result.nbHits,
        }
      } else {
        // For regular filters
        const result = await index.search(query, {
          filters: filter,
          hitsPerPage: 0,
          distinct: true, // CRITICAL: Must match frontend SEARCH_CONFIG
        })

        return {
          ...pill,
          count: result.nbHits,
        }
      }
    } catch (error) {
      console.error(`Error fetching count for pill ${pill.id}:`, error.message)
      return null // Return null on error to filter out later
    }
  }))

  // Filter out nulls (failed fetches)
  const validPills = pillsWithCounts.filter(p => p !== null)

  // Separate keywords from other pills
  const keywordPills = validPills.filter((pill) => pill.filter.operator === 'contains' && pill.count >= 5)
  const otherPills = validPills.filter((pill) => pill.filter.operator !== 'contains' && pill.count >= 5)

  // Sort each by score
  keywordPills.sort((a, b) => (b.score || 0) - (a.score || 0))
  otherPills.sort((a, b) => (b.score || 0) - (a.score || 0))

  // Return up to 10 keywords + up to 5 other pills = 15 total
  return [...keywordPills.slice(0, 10), ...otherPills.slice(0, 5)]
}

/**
 * Generate smart pills for a query
 */
async function generateSmartPills(query, threshold = 50) {
  // Get total count
  const countResult = await index.search(query, { hitsPerPage: 0 })

  if (countResult.nbHits < threshold) {
    return {
      query,
      totalResults: countResult.nbHits,
      pills: [],
      cached: false,
      reason: 'below_threshold',
    }
  }

  // Fetch sample (100 results)
  const sampleSize = 100
  const results = await index.search(query, { hitsPerPage: sampleSize })

  // Analyze and generate pills (with placeholder counts)
  const features = extractFeatures(results.hits)
  const pills = featuresToPills(features, countResult.nbHits, sampleSize)

  // Fetch actual counts for all pills
  const pillsWithActualCounts = await fetchActualCounts(query, pills)

  return {
    query,
    totalResults: countResult.nbHits,
    pills: pillsWithActualCounts,
    cached: false,
    generatedAt: new Date().toISOString(),
    sampleSize,
  }
}

/**
 * Generate default popular pills for empty queries
 */
async function generateDefaultPills() {
  const defaultPillTemplates = [
    // Top grading services
    { id: 'service-psa', label: 'PSA', icon: '🏆', attribute: 'gradingService', value: 'PSA', color: 'green' },
    { id: 'service-bgs', label: 'BGS', icon: '💎', attribute: 'gradingService', value: 'BGS', color: 'green' },
    { id: 'service-cgc', label: 'CGC', icon: '🎯', attribute: 'gradingService', value: 'CGC', color: 'green' },
    { id: 'service-sgc', label: 'SGC', icon: '⭐', attribute: 'gradingService', value: 'SGC', color: 'green' },

    // Popular grades
    { id: 'grade-10', label: 'Grade 10', icon: '🏆', attribute: 'grade', value: 10, color: 'green' },
    { id: 'grade-9.5', label: 'Grade 9.5', icon: '⭐', attribute: 'grade', value: 9.5, color: 'green' },
    { id: 'grade-9', label: 'Grade 9', icon: '⭐', attribute: 'grade', value: 9, color: 'green' },

    // Price ranges
    { id: 'price-0-100', label: '$0-100', icon: '💰', attribute: 'currentPrice', value: '$0-100', operator: 'range', color: 'amber' },
    { id: 'price-100-500', label: '$100-500', icon: '💰', attribute: 'currentPrice', value: '$100-500', operator: 'range', color: 'amber' },
    { id: 'price-1000plus', label: '$1000+', icon: '💰', attribute: 'currentPrice', value: '$1000+', operator: 'range', color: 'amber' },
  ]

  // Fetch actual counts for each default pill - parallelized
  const pillsWithCounts = await Promise.all(defaultPillTemplates.map(async (template) => {
    try {
      const pill = {
        id: template.id,
        label: template.label,
        icon: template.icon,
        color: template.color,
        filter: {
          attribute: template.attribute,
          value: template.value,
          operator: template.operator || '=',
        },
        score: 1,
      }
      pill.filterString = buildAlgoliaFilter(pill)

      const filter = pill.filterString
      const result = await index.search('', {
        filters: filter,
        hitsPerPage: 0,
        distinct: true,
      })

      return {
        ...pill,
        count: result.nbHits,
      }
    } catch (error) {
      console.error(`Error fetching count for default pill ${template.id}:`, error.message)
      return null
    }
  }))

  // Filter out pills with 0 results or errors and sort by count
  return pillsWithCounts.filter((pill) => pill && pill.count > 0).sort((a, b) => b.count - a.count)
}

/**
 * GET /api/smart-pills
 */
app.get('/api/smart-pills', async (req, res) => {
  try {
    const query = req.query.q || ''
    const threshold = Number(req.query.threshold) || 50

    // Handle empty query - return popular default pills
    if (!query) {
      const cacheKey = 'smart_pills:default'

      // Check cache if Redis is connected
      if (redisConnected && redisClient) {
        try {
          const cached = await redisClient.get(cacheKey)
          if (cached) {
            const data = JSON.parse(cached)
            return res.json({ ...data, cached: true })
          }
        } catch (err) {
          console.warn('Redis get error:', err.message)
        }
      }

      // Generate default pills
      const pills = await generateDefaultPills()
      const response = {
        query: '',
        totalResults: 0,
        pills,
        cached: false,
        generatedAt: new Date().toISOString(),
      }

      // Cache for 1 hour if Redis is connected
      if (redisConnected && redisClient && pills.length > 0) {
        try {
          await redisClient.setEx(cacheKey, 3600, JSON.stringify(response))
        } catch (err) {
          console.warn('Redis set error:', err.message)
        }
      }

      return res.json(response)
    }

    const cacheKey = `smart_pills:${query.toLowerCase()}`

    // Check cache if Redis is connected
    if (redisConnected && redisClient) {
      try {
        const cached = await redisClient.get(cacheKey)
        if (cached) {
          const data = JSON.parse(cached)
          return res.json({ ...data, cached: true })
        }
      } catch (err) {
        console.warn('Redis get error:', err.message)
      }
    }

    // Generate new pills
    const response = await generateSmartPills(query, threshold)

    // Cache for 30 minutes if Redis is connected
    if (redisConnected && redisClient && response.pills.length > 0) {
      try {
        await redisClient.setEx(cacheKey, 1800, JSON.stringify(response))
      } catch (err) {
        console.warn('Redis set error:', err.message)
      }
    }

    res.json(response)
  } catch (error) {
    console.error('Error generating smart pills:', error)
    res.status(500).json({
      error: 'Failed to generate smart pills',
      message: error.message,
    })
  }
})

/**
 * GET /api/popular-queries
 * Return predefined popular search queries
 */
app.get('/api/popular-queries', async (req, res) => {
  try {
    // Hardcoded popular searches
    const popularQueries = [
      { query: 'pokemon', nbHits: 378001 },
      { query: 'ohtani', nbHits: 6000 },
      { query: 'michael jordan', nbHits: 20479 },
      { query: 'charizard', nbHits: 15140 },
      { query: 'lebron james', nbHits: 18500 },
      { query: 'tom brady', nbHits: 12000 },
      { query: 'kobe bryant', nbHits: 5682 },
      { query: 'messi', nbHits: 5215 },
    ]

    const response = {
      queries: popularQueries,
      total: popularQueries.length,
      cached: false,
      generatedAt: new Date().toISOString(),
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching popular queries:', error)
    res.status(500).json({
      error: 'Failed to fetch popular queries',
      message: error.message,
    })
  }
})

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    redis: redisConnected,
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`Smart Pills API running on http://localhost:${PORT}`)
  console.log(`Redis cache: ${redisConnected ? 'enabled' : 'disabled (will work without cache)'}`)
})
