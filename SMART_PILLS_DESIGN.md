# 🧠 Intelligent Smart Pills - Architecture Design

## Overview

Smart Pills should be **dynamically generated** from actual search results by analyzing titles and metadata to discover meaningful filter patterns.

---

## Architecture

```
User searches "lebron"
         ↓
┌────────────────────────────────┐
│  Frontend: SmartPills.tsx      │
│  GET /api/smart-pills?q=lebron │
└────────────────────────────────┘
         ↓
┌────────────────────────────────┐
│  Backend: Smart Pills Service  │
│                                │
│  1. Check cache (Redis)        │
│     ├─ HIT: Return instantly   │
│     └─ MISS: Generate pills    │
│                                │
│  2. Fetch from Algolia         │
│     Search "lebron", get 100   │
│                                │
│  3. Analyze Results            │
│     - Extract patterns         │
│     - Count frequencies        │
│     - Rank by relevance        │
│                                │
│  4. Generate Pills             │
│     Return top 10 pills        │
│                                │
│  5. Cache Result (30 min)      │
│     Save to Redis              │
└────────────────────────────────┘
         ↓
    Smart Pills Displayed
```

---

## Service Behavior

### Cache Strategy

```
Query: "lebron"
Cache Key: `smart_pills:lebron`
TTL: 30 minutes (configurable)

Flow:
1. GET smart_pills:lebron
   ├─ EXISTS: Return cached pills ⚡
   └─ NULL: Generate new pills 🔍

2. Generate Pills:
   - Fetch 100 results from Algolia
   - Analyze titles/metadata
   - Extract patterns
   - Return top 10 pills
   - Save to cache

3. Background Refresh (optional):
   - Popular queries pre-cached
   - Updated every hour
```

### Threshold Logic

```typescript
if (totalResults < 50) {
  // Too few results, no pills needed
  return []
}

if (totalResults >= 50) {
  // Enough data to find patterns
  return generateSmartPills(results)
}
```

---

## Pattern Analysis Algorithm

### Step 1: Extract Features from Results

```typescript
interface ResultFeatures {
  gradingServices: Map<string, number>  // PSA: 145, BGS: 67
  grades: Map<number, number>           // 10: 89, 9: 156
  brands: Map<string, number>           // Topps: 234, Panini: 123
  years: Map<string, number>            // 2023: 45, 2003: 78
  keywords: Map<string, number>         // Chrome: 89, Rookie: 145
  priceRanges: Map<string, number>      // $0-100: 234, $100-500: 456
}

function extractFeatures(results: AlgoliaCardHit[]): ResultFeatures {
  const features: ResultFeatures = {
    gradingServices: new Map(),
    grades: new Map(),
    brands: new Map(),
    years: new Map(),
    keywords: new Map(),
    priceRanges: new Map(),
  }

  results.forEach(hit => {
    // Count grading services
    if (hit.gradingService) {
      features.gradingServices.set(
        hit.gradingService,
        (features.gradingServices.get(hit.gradingService) || 0) + 1
      )
    }

    // Count grades
    if (hit.grade) {
      features.grades.set(
        Number(hit.grade),
        (features.grades.get(Number(hit.grade)) || 0) + 1
      )
    }

    // Extract keywords from title
    const titleWords = hit.title.toLowerCase().split(/\s+/)
    const cardKeywords = ['rookie', 'auto', 'autograph', 'chrome', 'prizm',
                          'refractor', 'numbered', 'jersey', 'patch']

    titleWords.forEach(word => {
      if (cardKeywords.includes(word)) {
        features.keywords.set(
          word,
          (features.keywords.get(word) || 0) + 1
        )
      }
    })

    // Price ranges
    const price = hit.currentPrice
    let range = ''
    if (price < 100) range = '$0-100'
    else if (price < 500) range = '$100-500'
    else if (price < 1000) range = '$500-1000'
    else range = '$1000+'

    features.priceRanges.set(
      range,
      (features.priceRanges.get(range) || 0) + 1
    )

    // Year extraction
    if (hit.year) {
      features.years.set(
        String(hit.year),
        (features.years.get(String(hit.year)) || 0) + 1
      )
    }

    // Brand
    if (hit.brand) {
      features.brands.set(
        hit.brand,
        (features.brands.get(hit.brand) || 0) + 1
      )
    }
  })

  return features
}
```

### Step 2: Convert Features to Pills

```typescript
function featuresToPills(features: ResultFeatures, totalResults: number): SmartPill[] {
  const pills: SmartPill[] = []

  // Only include features that appear in >10% of results
  const minThreshold = totalResults * 0.1

  // Grading Services
  features.gradingServices.forEach((count, service) => {
    if (count >= minThreshold) {
      pills.push({
        id: `service-${service.toLowerCase()}`,
        label: service,
        icon: getGradingServiceIcon(service),
        count: count,
        filter: { attribute: 'gradingService', value: service },
        color: 'green',
        score: count / totalResults, // Relevance score
      })
    }
  })

  // Grades (only popular ones)
  features.grades.forEach((count, grade) => {
    if (count >= minThreshold && (grade === 10 || grade === 9 || grade === 9.5)) {
      pills.push({
        id: `grade-${grade}`,
        label: `Grade ${grade}`,
        icon: grade === 10 ? '🏆' : '⭐',
        count: count,
        filter: { attribute: 'grade', value: grade },
        color: 'green',
        score: count / totalResults,
      })
    }
  })

  // Keywords (Rookie, Auto, Chrome, etc.)
  features.keywords.forEach((count, keyword) => {
    if (count >= minThreshold) {
      pills.push({
        id: `keyword-${keyword}`,
        label: capitalizeKeyword(keyword), // "Rookie Cards", "Autographs"
        icon: getKeywordIcon(keyword),
        count: count,
        filter: { attribute: 'customFilters', value: keyword },
        color: getKeywordColor(keyword),
        score: count / totalResults,
      })
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
        count: count,
        filter: { attribute: 'year', value: year },
        color: 'gray',
        score: count / totalResults,
      })
    }
  })

  // Brands (top 3)
  const topBrands = Array.from(features.brands.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)

  topBrands.forEach(([brand, count]) => {
    if (count >= minThreshold) {
      pills.push({
        id: `brand-${brand.toLowerCase()}`,
        label: brand,
        icon: '📇',
        count: count,
        filter: { attribute: 'brand', value: brand },
        color: 'blue',
        score: count / totalResults,
      })
    }
  })

  // Price ranges
  features.priceRanges.forEach((count, range) => {
    if (count >= minThreshold) {
      pills.push({
        id: `price-${range}`,
        label: range,
        icon: '💰',
        count: count,
        filter: { attribute: 'currentPrice', value: range, operator: 'range' },
        color: 'amber',
        score: count / totalResults,
      })
    }
  })

  // Sort by relevance score and return top 10
  return pills
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10)
}
```

---

## Example Output

### Query: "lebron" (8,197 results)

**Analyzed 100 sample results:**

```
Grading Services:
  PSA: 67/100 → Pill: "PSA (5,482)"
  BGS: 23/100 → Pill: "BGS (1,885)"

Grades:
  10: 45/100 → Pill: "🏆 Grade 10 (3,689)"
  9: 38/100 → Pill: "⭐ Grade 9 (3,115)"

Keywords:
  rookie: 56/100 → Pill: "⭐ Rookie Cards (4,590)"
  chrome: 34/100 → Pill: "✨ Chrome (2,787)"
  auto: 28/100 → Pill: "✍️ Autographs (2,295)"

Years:
  2023: 12/100 → Pill: "📅 2023 (983)"
  2003: 18/100 → Pill: "📅 2003 (1,475)" ← Rookie year!

Brands:
  Topps: 45/100 → Pill: "📇 Topps (3,689)"
  Panini: 28/100 → Pill: "📇 Panini (2,295)"

Price Ranges:
  $100-500: 42/100 → Pill: "💰 $100-500 (3,443)"
```

**Top 10 Pills Returned:**
```
1. ⭐ Rookie Cards (4,590) - 56% relevance
2. 🏆 PSA (5,482) - 67% relevance
3. 🏆 Grade 10 (3,689) - 45% relevance
4. ⭐ Grade 9 (3,115) - 38% relevance
5. 📇 Topps (3,689) - 45% relevance
6. ✨ Chrome (2,787) - 34% relevance
7. 💰 $100-500 (3,443) - 42% relevance
8. ✍️ Autographs (2,295) - 28% relevance
9. 📅 2003 (1,475) - 18% relevance (Rookie year!)
10. BGS (1,885) - 23% relevance
```

These are **discovered from data**, not hardcoded!

---

## Backend Service Structure

### Endpoints

```
GET /api/smart-pills?q={query}&threshold={50}

Response:
{
  "query": "lebron",
  "totalResults": 8197,
  "pills": [
    {
      "id": "keyword-rookie",
      "label": "Rookie Cards",
      "icon": "⭐",
      "count": 4590,
      "filter": {
        "attribute": "customFilters",
        "value": "rookie"
      },
      "color": "blue",
      "score": 0.56
    },
    // ... 9 more
  ],
  "cached": true,
  "generatedAt": "2025-11-15T20:30:00Z"
}
```

### Cache Structure (Redis)

```redis
Key: smart_pills:lebron
Value: {
  pills: [...],
  totalResults: 8197,
  generatedAt: 1700000000,
  sampleSize: 100
}
TTL: 1800 seconds (30 minutes)
```

### Pre-warming Strategy

```typescript
// Popular queries to pre-cache
const popularQueries = [
  'lebron', 'jordan', 'brady', 'mahomes',
  'psa 10', 'rookie', 'auto', 'chrome'
]

// Cron job every hour
async function prewarmCache() {
  for (const query of popularQueries) {
    await generateSmartPills(query)
    await saveToCache(query, pills)
  }
}
```

---

## Implementation Plan

### Phase 1: Service Setup (Backend)

**File**: `/api/smart-pills/route.ts` (Next.js API) or separate microservice

```typescript
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q') || ''
  const threshold = Number(searchParams.get('threshold')) || 50

  // Check cache
  const cached = await redis.get(`smart_pills:${query}`)
  if (cached) {
    return Response.json({ ...JSON.parse(cached), cached: true })
  }

  // Get total count
  const countResult = await algolia.search(query, { hitsPerPage: 0 })
  if (countResult.nbHits < threshold) {
    return Response.json({ pills: [], totalResults: countResult.nbHits })
  }

  // Fetch sample (100 results)
  const results = await algolia.search(query, { hitsPerPage: 100 })

  // Analyze and generate pills
  const features = extractFeatures(results.hits)
  const pills = featuresToPills(features, countResult.nbHits)

  // Cache for 30 minutes
  const response = {
    query,
    totalResults: countResult.nbHits,
    pills,
    cached: false,
    generatedAt: new Date().toISOString(),
  }

  await redis.setex(`smart_pills:${query}`, 1800, JSON.stringify(response))

  return Response.json(response)
}
```

### Phase 2: Frontend Integration

**Update**: `src/components/search/SmartPills.tsx`

```typescript
useEffect(() => {
  const fetchSmartPills = async () => {
    try {
      const response = await fetch(
        `/api/smart-pills?q=${encodeURIComponent(query)}&threshold=50`
      )
      const data = await response.json()
      setPills(data.pills || [])
    } catch (error) {
      console.error('Error fetching smart pills:', error)
      // Fallback to hardcoded pills
      setPills(getSmartPillsForQuery(query))
    }
  }

  if (query) {
    fetchSmartPills()
  }
}, [query])
```

---

## Performance Optimization

### Sampling Strategy

Instead of analyzing ALL results:

```
Results: 100,000
Sample: 100 (0.1%)

Statistically valid because:
- Sample size >30 (Central Limit Theorem)
- Random selection
- Patterns appear in top results
```

### Caching Tiers

```
L1: In-memory (Frontend)
├─ LRU cache, 50 queries
└─ Instant (<1ms)

L2: Redis (Backend)
├─ 30 min TTL
└─ Very fast (<10ms)

L3: Generate (Backend)
├─ Algolia + Analysis
└─ Slower (~200ms)
```

### Pre-computation

```
Trigger pre-computation:
1. User searches → Cache miss → Generate → Save
2. Popular queries → Cron job → Pre-generate
3. Analytics → Trending searches → Pre-warm

Result: 95%+ cache hit rate
```

---

## Deployment Architecture

```
┌─────────────────┐
│   Frontend      │
│   (Next.js)     │
└────────┬────────┘
         │
         ↓ HTTP GET /api/smart-pills
┌─────────────────┐
│  Smart Pills    │
│  Service        │
│  (Node.js)      │
├─────────────────┤
│ - Check Redis   │
│ - Query Algolia │
│ - Analyze       │
│ - Cache         │
└────┬───────┬────┘
     │       │
     ↓       ↓
┌─────┐  ┌────────┐
│Redis│  │ Algolia│
└─────┘  └────────┘
```

---

## Summary

**Smart Pills V2:**
✅ Data-driven (not hardcoded)
✅ Cached (instant delivery)
✅ Intelligent (pattern discovery)
✅ Threshold-based (>50 results)
✅ Opportunistic (cache fills over time)

**Implementation:**
1. Backend service analyzes search results
2. Extracts patterns (grades, keywords, brands)
3. Generates top 10 most relevant pills
4. Caches for 30 minutes
5. Pre-warms popular queries

**Result:**
User searches "lebron" → Gets smart, data-driven pills in <10ms (cached) or ~200ms (first time)

Ready to implement this? Should I start with the backend service or frontend integration first?
