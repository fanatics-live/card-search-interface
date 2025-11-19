// Vercel serverless function for smart pills
// This is a wrapper around the main server.js logic

const algoliasearch = require('algoliasearch')

// Initialize Algolia client
const ALGOLIA_APP_ID = process.env.VITE_ALGOLIA_APP_ID
const ALGOLIA_SEARCH_API_KEY = process.env.VITE_ALGOLIA_SEARCH_API_KEY
const ALGOLIA_INDEX_NAME = process.env.VITE_ALGOLIA_INDEX_NAME || 'prod_item_state_v1'

if (!ALGOLIA_APP_ID || !ALGOLIA_SEARCH_API_KEY) {
  console.error('Missing Algolia configuration')
}

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY)
const index = client.initIndex(ALGOLIA_INDEX_NAME)

// Card manufacturers for filtering
const CARD_MANUFACTURERS = new Set([
  'Topps', 'Panini', 'Upper Deck', 'Fleer', 'Donruss', 'Bowman',
  'Score', 'Leaf', 'Pacific', 'Skybox', 'Stadium Club', 'Select',
])

// Extract features from search results
function extractFeatures(results) {
  const features = {
    gradingServices: new Map(),
    grades: new Map(),
    brands: new Map(),
    years: new Map(),
    keywords: new Map(),
    priceRanges: new Map(),
  }

  const cardKeywords = [
    'rookie', 'auto', 'autograph', 'chrome', 'prizm', 'refractor', 'numbered',
    'jersey', 'patch', 'parallel', 'insert', 'rookie card', 'rc', 'base',
    'short print', 'sp', 'exclusive', 'rpa', 'serial',
    'optic', 'select', 'mosaic', 'donruss', 'topps', 'panini', 'fleer',
    'upper deck', 'bowman', 'certified', 'limited', 'silver', 'gold', 'holo',
    'shimmer', 'wave', 'cracked ice', 'stained glass', 'signed', 'mem',
    'memorabilia', '/99', '/25', '/10', '/5', '/1', '1/1',
  ]

  results.forEach((hit) => {
    if (hit.gradingService) {
      const service = hit.gradingService.toUpperCase()
      features.gradingServices.set(service, (features.gradingServices.get(service) || 0) + 1)
    }

    if (hit.grade !== null && hit.grade !== undefined) {
      const grade = Number(hit.grade)
      features.grades.set(grade, (features.grades.get(grade) || 0) + 1)
    }

    const titleLower = (hit.title || '').toLowerCase()
    cardKeywords.forEach((keyword) => {
      if (titleLower.includes(keyword)) {
        features.keywords.set(keyword, (features.keywords.get(keyword) || 0) + 1)
      }
    })

    const price = hit.currentPrice || 0
    let range = ''
    if (price < 100) range = '$0-100'
    else if (price < 500) range = '$100-500'
    else if (price < 1000) range = '$500-1000'
    else range = '$1000+'
    features.priceRanges.set(range, (features.priceRanges.get(range) || 0) + 1)

    if (hit.year) {
      const yearStr = String(hit.year)
      features.years.set(yearStr, (features.years.get(yearStr) || 0) + 1)
    }

    if (hit.brand && CARD_MANUFACTURERS.has(hit.brand)) {
      features.brands.set(hit.brand, (features.brands.get(hit.brand) || 0) + 1)
    }
  })

  return features
}

// Icon/label mapping functions (truncated for brevity - copy from server.js)
function getGradingServiceIcon(service) {
  const icons = { PSA: '🏆', BGS: '💎', SGC: '⭐', CGC: '🎯' }
  return icons[service] || '📋'
}

function getKeywordIcon(keyword) {
  const icons = {
    rookie: '⭐', auto: '✍️', chrome: '✨', prizm: '🌈', optic: '🔮',
    select: '🎯', mosaic: '🎨', refractor: '💫', numbered: '🔢',
    jersey: '👕', patch: '🧩', gold: '🥇', silver: '🥈',
  }
  return icons[keyword] || '🎯'
}

function capitalizeKeyword(keyword) {
  const labels = {
    rookie: 'Rookie Cards', auto: 'Autographs', chrome: 'Chrome',
    prizm: 'Prizm', optic: 'Optic', topps: 'Topps', panini: 'Panini',
    patch: 'Patch Cards', gold: 'Gold', '/1': 'Numbered /1', '/10': 'Numbered /10',
  }
  return labels[keyword] || keyword.charAt(0).toUpperCase() + keyword.slice(1)
}

function getKeywordColor(keyword) {
  const colors = {
    rookie: 'blue', auto: 'purple', chrome: 'blue', prizm: 'blue',
    numbered: 'amber', jersey: 'green', patch: 'green',
  }
  return colors[keyword] || 'gray'
}

function featuresToPills(features, totalResults, sampleSize) {
  const pills = []
  const minThreshold = sampleSize * 0.02

  features.gradingServices.forEach((count, service) => {
    if (count >= minThreshold) {
      pills.push({
        id: `service-${service.toLowerCase()}`,
        label: service,
        icon: getGradingServiceIcon(service),
        count: 0,
        filter: { attribute: 'gradingService', value: service },
        color: 'green',
        score: count / sampleSize,
      })
    }
  })

  features.grades.forEach((count, grade) => {
    if (count >= minThreshold && (grade === 10 || grade === 9.5 || grade === 9)) {
      pills.push({
        id: `grade-${grade}`,
        label: `Grade ${grade}`,
        icon: grade === 10 ? '🏆' : '⭐',
        count: 0,
        filter: { attribute: 'grade', value: grade },
        color: 'green',
        score: count / sampleSize,
      })
    }
  })

  features.keywords.forEach((count, keyword) => {
    if (count >= minThreshold) {
      pills.push({
        id: `keyword-${keyword.replace(/\s+/g, '-')}`,
        label: capitalizeKeyword(keyword),
        icon: getKeywordIcon(keyword),
        count: 0,
        filter: { attribute: 'title', value: keyword, operator: 'contains' },
        color: getKeywordColor(keyword),
        score: count / sampleSize,
      })
    }
  })

  const topYears = Array.from(features.years.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topYears.forEach(([year, count]) => {
    if (count >= minThreshold) {
      pills.push({
        id: `year-${year}`,
        label: year,
        icon: '📅',
        count: 0,
        filter: { attribute: 'year', value: year },
        color: 'gray',
        score: count / sampleSize,
      })
    }
  })

  const topBrands = Array.from(features.brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topBrands.forEach(([brand, count]) => {
    if (count >= minThreshold) {
      pills.push({
        id: `brand-${brand.toLowerCase().replace(/\s+/g, '-')}`,
        label: brand,
        icon: '📇',
        count: 0,
        filter: { attribute: 'brand', value: brand },
        color: 'blue',
        score: count / sampleSize,
      })
    }
  })

  features.priceRanges.forEach((count, range) => {
    if (count >= minThreshold) {
      pills.push({
        id: `price-${range.replace(/\$/g, '').replace(/\+/g, 'plus')}`,
        label: range,
        icon: '💰',
        count: 0,
        filter: { attribute: 'currentPrice', value: range, operator: 'range' },
        color: 'amber',
        score: count / sampleSize,
      })
    }
  })

  return pills.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 20)
}

function buildAlgoliaFilter(pill) {
  const { attribute, value, operator = '=' } = pill.filter

  if (typeof value === 'boolean') {
    return `${attribute}:${value}`
  } else if (operator === 'contains') {
    return null
  } else if (operator === 'range') {
    if (attribute === 'currentPrice') {
      const rangeStr = String(value)
      if (rangeStr === '$0-100') return 'currentPrice < 100'
      else if (rangeStr === '$100-500') return 'currentPrice >= 100 AND currentPrice < 500'
      else if (rangeStr === '$500-1000') return 'currentPrice >= 500 AND currentPrice < 1000'
      else if (rangeStr === '$1000+') return 'currentPrice >= 1000'
    }
  } else if (typeof value === 'string') {
    return `${attribute}:"${value}"`
  } else {
    return `${attribute}:${value}`
  }
}

async function fetchActualCounts(query, pills) {
  const pillsWithCounts = []

  for (const pill of pills) {
    try {
      const filter = buildAlgoliaFilter(pill)

      if (pill.filter.operator === 'contains') {
        const keywordQuery = `${query} ${pill.filter.value}`
        const result = await index.search(keywordQuery, {
          hitsPerPage: 0,
          distinct: true,
        })
        pillsWithCounts.push({ ...pill, count: result.nbHits })
      } else {
        const result = await index.search(query, {
          filters: filter,
          hitsPerPage: 0,
          distinct: true,
        })
        pillsWithCounts.push({ ...pill, count: result.nbHits })
      }

      await new Promise((resolve) => setTimeout(resolve, 50))
    } catch (error) {
      console.error(`Error fetching count for pill ${pill.id}:`, error.message)
    }
  }

  const keywordPills = pillsWithCounts.filter((pill) => pill.filter.operator === 'contains' && pill.count >= 5)
  const otherPills = pillsWithCounts.filter((pill) => pill.filter.operator !== 'contains' && pill.count >= 5)

  keywordPills.sort((a, b) => (b.score || 0) - (a.score || 0))
  otherPills.sort((a, b) => (b.score || 0) - (a.score || 0))

  return [...keywordPills.slice(0, 10), ...otherPills.slice(0, 5)]
}

async function generateSmartPills(query, threshold = 50) {
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

  const sampleSize = 100
  const results = await index.search(query, { hitsPerPage: sampleSize })

  const features = extractFeatures(results.hits)
  const pills = featuresToPills(features, countResult.nbHits, sampleSize)
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

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const query = req.query.q || ''
    const threshold = Number(req.query.threshold) || 50

    if (!query) {
      return res.status(200).json({
        query: '',
        totalResults: 0,
        pills: [],
        cached: false,
      })
    }

    const response = await generateSmartPills(query, threshold)
    res.status(200).json(response)
  } catch (error) {
    console.error('Error generating smart pills:', error)
    res.status(500).json({
      error: 'Failed to generate smart pills',
      message: error.message,
    })
  }
}
