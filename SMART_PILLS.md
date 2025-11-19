# 💊 Smart Pills - Quick Filter Feature

## Overview

Smart Pills are intelligent, context-aware filter suggestions that appear above search results. They allow users to quickly refine their search with a single click, showing the count of matching results for each filter.

## ✅ Implementation Complete

### Files Created

1. **`src/types/smartPills.ts`** - Types and configurations
2. **`src/components/search/SmartPill.tsx`** - Individual pill component
3. **`src/components/search/SmartPills.tsx`** - Container component

### Integration

Smart Pills are now integrated into `App.tsx` and appear between Stats and Results.

---

## 🎯 How It Works

### Visual Example

```
Quick filters: [🏆 PSA 10 (244,721)] [⭐ Rookies (295,705)] [💰 Under $100 (89,234)] [🔥 Great Deals (12,456)]
```

### Features

1. **Context-Aware** - Different pills for different queries
2. **Live Counts** - Shows number of results for each filter
3. **Color-Coded** - Visual categories (green for grades, blue for types, etc.)
4. **Animated** - Smooth stagger animation on load
5. **Interactive** - Hover scale, active states
6. **Smart Hiding** - Only shows pills with >0 results

---

## 📋 Predefined Pill Configurations

### Default Pills (Empty Query or Generic Search)
```typescript
[🏆 PSA 10] [⭐ Rookies] [💰 Under $100] [🔥 Great Deals]
```

### LeBron James Searches
```typescript
[⭐ Rookie Cards] [✍️ Autographs] [🏆 PSA 10] [✨ Chrome]
```

### Michael Jordan Searches
```typescript
[⭐ Rookie Cards] [📇 Fleer] [🏆 PSA 10] [✍️ Autographs]
```

### PSA Searches
```typescript
[🏆 Grade 10] [⭐ Grade 9] [⭐ Rookies]
```

### Rookie Searches
```typescript
[🏆 PSA 10] [✍️ Autographs] [💰 Under $500]
```

---

## 🎨 Pill Structure

### TypeScript Interface

```typescript
interface SmartPill {
  id: string
  label: string
  icon?: string
  count?: number
  filter: {
    attribute: string
    value: string | number | boolean
    operator?: '=' | '>' | '<' | '>=' | '<=' | 'range'
  }
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray'
  isActive?: boolean
}
```

### Example Pill

```typescript
{
  id: 'psa-10',
  label: 'PSA 10',
  icon: '🏆',
  filter: { attribute: 'grade', value: 10 },
  color: 'green',
  count: 244721, // Fetched from Algolia
}
```

---

## 🎨 Color System

Pills use semantic colors:

- **Green** (`green`) - Grades, achievements
- **Blue** (`blue`) - Card types, categories
- **Purple** (`purple`) - Autographs, special features
- **Amber** (`amber`) - Price-based filters
- **Red** (`red`) - Deals, trending
- **Gray** (`gray`) - Brands, sets

### States

**Inactive:**
```css
bg-green-100 text-green-700 border-green-200
hover:bg-green-200
```

**Active:**
```css
bg-green-500 text-white border-green-600
hover:bg-green-600
```

---

## ⚡ Count Fetching

Counts are fetched dynamically from Algolia:

```typescript
// For each pill, we query Algolia with:
{
  query: currentSearchQuery,
  filters: pillFilter,
  hitsPerPage: 0  // Only need count
}

// Result:
pill.count = result.nbHits
```

**Performance:**
- Parallel fetching for all pills
- Only shows pills with count > 0
- Cached by Algolia

---

## 🎭 Animations

### Pill Appearance
```typescript
initial={{ opacity: 0, y: -10 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.2, delay: index * 0.05 }}
```

**Effect:** Pills slide down and fade in with 50ms stagger

### Interactions
```typescript
whileHover={{ scale: 1.05 }}
whileTap={{ scale: 0.98 }}
```

**Effect:** Gentle bounce on hover, press feedback

---

## 🔧 Adding New Pills

### Step 1: Add to Configuration

Edit `/Users/wdakka/bo/newsearch/src/types/smartPills.ts`:

```typescript
export const SMART_PILL_CONFIGS: Record<string, SmartPill[]> = {
  // Add your query pattern
  mahomes: [
    {
      id: 'mahomes-rookie',
      label: 'Rookie Cards',
      icon: '⭐',
      filter: { attribute: 'customFilters', value: 'rookie' },
      color: 'blue',
    },
    {
      id: 'mahomes-auto',
      label: 'Autographs',
      icon: '✍️',
      filter: { attribute: 'customFilters', value: 'auto' },
      color: 'purple',
    },
  ],
}
```

### Step 2: Update Query Matcher

```typescript
export function getSmartPillsForQuery(query: string): SmartPill[] {
  const normalizedQuery = query.toLowerCase().trim()

  // Add your pattern match
  if (normalizedQuery.includes('mahomes')) {
    return SMART_PILL_CONFIGS.mahomes
  }

  // ...
}
```

Done! Pills will appear automatically for matching queries.

---

## 🚀 Future Enhancements (Phase II)

### 1. Backend-Driven Pills
Instead of hardcoded configs, fetch from API:

```typescript
GET /api/smart-pills?query=lebron
Response: [
  { id: 'rookie', label: 'Rookies', count: 8197, ... }
]
```

### 2. Full Algolia Integration
Currently pills modify the search query. Phase II will use proper Algolia refinements:

```typescript
// Use RefinementList widgets
<RefinementList attribute="gradingService" />
<NumericMenu attribute="currentPrice" />
```

### 3. Pill Combinations
Allow multiple pills to be active simultaneously:

```
[🏆 PSA 10 ✓] [⭐ Rookies ✓] → Shows PSA 10 Rookies
```

### 4. Smart Ordering
Order pills by:
- Most popular
- Highest count
- User preferences
- Machine learning

### 5. Persistent State
Remember user's preferred pills across sessions

---

## 🧪 Testing

### Test Queries to Try

1. **Empty search** → Should show default pills
2. **"lebron"** → Should show LeBron-specific pills
3. **"jordan"** → Should show Jordan-specific pills
4. **"psa"** → Should show PSA grade pills
5. **"rookie"** → Should show rookie-related pills

### Expected Behavior

1. Pills appear with live counts
2. Counts update when search query changes
3. Only pills with results are shown
4. Clicking pill filters results (basic implementation)
5. Animations are smooth and staggered

---

## 📊 Performance

### Count Fetching
- **Parallel requests**: All pill counts fetched simultaneously
- **Lightweight**: Only count, no actual results
- **Fast**: Algolia responds in <50ms per pill

### Rendering
- **Animated**: 50ms stagger feels responsive
- **No jank**: Uses Framer Motion with GPU acceleration
- **Conditional**: Only renders when there are results

---

## 🎯 Current Limitations

### Phase 1 Limitations

1. **Query-based filtering only** - Clicking pills modifies search query text
2. **No multi-pill selection** - Can only activate one at a time currently
3. **Hardcoded patterns** - Pills based on predefined configs
4. **Limited operators** - Simple filters only

### Phase II Will Add

- Proper Algolia refinement integration
- Multi-select pills
- Backend-driven configurations
- Complex filter combinations
- Persistent state

---

## 💡 Tips

### For Best Results

1. **Keep pill labels short** - 1-2 words maximum
2. **Use emojis** - Adds visual interest and category recognition
3. **Show counts** - Helps users make decisions
4. **Limit to 4-6 pills** - Too many is overwhelming
5. **Order by popularity** - Most useful pills first

### Design Principles

- **Discoverable** - Users see without scrolling
- **Predictable** - Same query = same pills
- **Fast** - Counts appear in <100ms
- **Delightful** - Smooth animations

---

## 📝 Code Example

### Using in Your App

```tsx
import { SmartPills } from '@/components/search/SmartPills'

function SearchPage() {
  return (
    <InstantSearch {...config}>
      <SearchBox />
      <Stats />

      {/* Smart Pills - automatic based on query */}
      <SmartPills />

      <Hits />
    </InstantSearch>
  )
}
```

That's it! Pills appear automatically based on search query.

---

## ✅ Summary

Smart Pills provide **instant, visual, one-click filters** that help users refine their search without complex UI. They:

- ✅ Show live result counts
- ✅ Adapt to search context
- ✅ Animate smoothly
- ✅ Guide discovery
- ✅ Reduce clicks

**Status**: Phase 1 Complete - Basic implementation working
**Next**: Phase II will add full Algolia refinement integration

---

**Test it now**: Visit http://localhost:3000 and search for "lebron", "jordan", or "psa" to see context-aware pills! 🎉
