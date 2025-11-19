# Modern Faceted Search UX Best Practices for Sports Card Marketplace

## Executive Summary

This document compiles best practices, patterns, and actionable recommendations for implementing a world-class faceted search experience for a sports card marketplace using React + Algolia InstantSearch. Based on research from leading platforms (Stripe, Airbnb, Amazon, eBay, PWCC, StockX), this guide provides specific implementation strategies for achieving instant search, smart filtering, visual excellence, reduced clicks, and domain-specific features.

---

## 1. Instant Search Patterns

### Real-time Search as You Type

**Core Principle**: Users expect zero-latency responses. The UI should update instantly, even before server responses arrive.

#### Implementation Strategy

**Debouncing for API Calls**
```bash
npm install use-debounce
```

```jsx
import { useDebounce } from 'use-debounce';

function SearchBox() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  useEffect(() => {
    // Only trigger API call with debounced value
    performSearch(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search cards..."
    />
  );
}
```

**Key Packages**:
- `use-debounce` (300-500ms delay) - Lightweight, React-specific
- `lodash.debounce` - Classic approach, more configuration options
- `use-lodash-debounce` - Combines both with hooks

**Best Practice**: 300ms debounce strikes the right balance between responsiveness and API efficiency.

---

### Zero-Latency UI Patterns

**Optimistic UI Updates**

React 19's `useOptimistic` hook provides first-class support:

```jsx
import { useOptimistic } from 'react';

function SearchResults({ initialResults }) {
  const [optimisticResults, setOptimisticResults] = useOptimistic(
    initialResults,
    (state, newResults) => newResults
  );

  const handleSearch = async (query) => {
    // Immediately show expected results
    setOptimisticResults(predictResults(query));

    // Then update with real results
    const actualResults = await searchAPI(query);
    setOptimisticResults(actualResults);
  };

  return <ResultsList results={optimisticResults} />;
}
```

**Alternative Approaches**:
- Apollo GraphQL's `optimisticResponse`
- React Query's concurrent optimistic updates
- Custom state management with rollback on failure

**Key Insight**: Assume success and update immediately. Revert only on failure (rare in search).

---

### Progressive Enhancement

**Skeleton Screens > Spinners**

Research shows:
- Users wait up to **22.6 seconds** with progress indicators
- Only **9 seconds** without feedback
- Skeleton screens reduce perceived wait time by **30%**

```jsx
function CardGridSkeleton() {
  return (
    <div className="grid grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-48 rounded-lg mb-2" />
          <div className="bg-gray-200 h-4 rounded w-3/4 mb-2" />
          <div className="bg-gray-200 h-4 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
```

**Package Recommendation**:
```bash
npm install react-loading-skeleton
```

**Best Practices**:
- Mirror exact layout of final content
- Use subtle pulse animation (200-500ms)
- Show skeleton for structured content (cards, grids, lists)
- Avoid for simple text searches

---

## 2. Smart Filtering UX

### Auto-Suggest Filters Based on Query

**Pattern**: As users type, intelligently suggest relevant filters

```jsx
// Algolia QuerySuggestions + RefinementList integration
import { useQuerySuggestions } from 'react-instantsearch';

function SmartFilters() {
  const { suggestions } = useQuerySuggestions({
    limit: 5,
  });

  // If user searches "Michael Jordan", auto-suggest:
  // - Player: Michael Jordan
  // - Team: Chicago Bulls
  // - Year: 1984-2003
  // - Grade: PSA 10

  return (
    <div className="smart-filters">
      {suggestions.map(suggestion => (
        <QuickFilter key={suggestion.objectID} {...suggestion} />
      ))}
    </div>
  );
}
```

---

### Intelligent Filter Ordering

**Strategy**: Most relevant filters first, based on:
1. Current search context
2. User behavior patterns
3. Result distribution

```jsx
function DynamicRefinementList({ attribute }) {
  // Transform items to reorder based on relevance
  const transformItems = (items) => {
    return items.sort((a, b) => {
      // Prioritize by:
      // 1. Items with results
      if (a.count === 0 && b.count > 0) return 1;
      if (b.count === 0 && a.count > 0) return -1;

      // 2. Most results
      if (a.count !== b.count) return b.count - a.count;

      // 3. Alphabetically
      return a.label.localeCompare(b.label);
    });
  };

  return (
    <RefinementList
      attribute={attribute}
      transformItems={transformItems}
      showMore={true}
      showMoreLimit={20}
    />
  );
}
```

---

### Filter Count Previews

**Critical Feature**: Show result counts BEFORE applying filters

Algolia InstantSearch handles this automatically:

```jsx
<RefinementList
  attribute="grading_company"
  showMore={true}
  transformItems={(items) => items.map(item => ({
    ...item,
    // Item already includes 'count' property
    // Algolia calculates this server-side
    label: `${item.label} (${item.count})`
  }))}
/>
```

**Visual Enhancement**:
```jsx
function FilterOption({ label, count, isRefined }) {
  return (
    <div className={`filter-option ${isRefined ? 'active' : ''}`}>
      <Checkbox checked={isRefined} />
      <span>{label}</span>
      <Badge variant="secondary">{count.toLocaleString()}</Badge>
    </div>
  );
}
```

**Key Insight**: Users need to know "Will this filter give me results?" before clicking.

---

### Smart Defaults and Presets

**Pattern**: Saved searches with localStorage persistence

```jsx
import { useState, useEffect } from 'react';

function useSavedSearches() {
  const [savedSearches, setSavedSearches] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem('savedSearches');
    if (saved) setSavedSearches(JSON.parse(saved));
  }, []);

  const saveSearch = (name, filters, query) => {
    const newSearch = {
      id: Date.now(),
      name,
      filters,
      query,
      createdAt: new Date().toISOString()
    };

    const updated = [...savedSearches, newSearch];
    setSavedSearches(updated);
    localStorage.setItem('savedSearches', JSON.stringify(updated));
  };

  const loadSearch = (id) => {
    return savedSearches.find(s => s.id === id);
  };

  return { savedSearches, saveSearch, loadSearch };
}
```

**Preset Examples for Sports Cards**:
- "Hot Rookies" - Recent rookies, high grades, trending
- "Vintage Gems" - Pre-1980, PSA 8+
- "Investment Grade" - PSA 10, key players, iconic sets
- "Budget Buys" - Under $50, good condition

---

### Filter Dependencies and Cascading

**Hierarchical Filters** for related categories:

```jsx
<HierarchicalMenu
  attributes={[
    'sport',
    'sport.league',
    'sport.league.team'
  ]}
  transformItems={(items) => items.map(item => ({
    ...item,
    label: `${item.label} (${item.count})`
  }))}
/>
```

**Smart Cascading**:
```jsx
function CascadingFilters() {
  const { refine: refineSport } = useRefinementList({ attribute: 'sport' });
  const { items: teams } = useRefinementList({
    attribute: 'team',
    // Only show teams for selected sport
  });

  // When sport changes, auto-adjust team options
  // Algolia handles this automatically via index schema
}
```

---

## 3. Visual Excellence

### Modern Design Systems

**Inspirations from Leading Platforms**:

#### Stripe Pattern
- Clean, minimal interface
- Subtle hover states
- Clear visual hierarchy
- Ample whitespace
- Monochromatic with accent colors

#### Airbnb Pattern
- Card-based layouts
- High-quality imagery
- Quick filters as chips
- Sticky filter panel
- Mobile-first responsive

#### eBay/Marketplace Pattern
- Detailed product cards
- Price prominence
- Trust indicators (badges, ratings)
- Comparison tools
- Density options (grid/list toggle)

---

### Micro-Interactions and Animations

**Package**: Framer Motion (12M+ monthly downloads)

```bash
npm install framer-motion
```

**Card Hover Effects**:
```jsx
import { motion } from 'framer-motion';

function CardItem({ card }) {
  return (
    <motion.div
      className="card"
      whileHover={{
        scale: 1.05,
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        y: -5
      }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
    >
      <img src={card.image} alt={card.name} />
      <h3>{card.name}</h3>
      <Price amount={card.price} />
    </motion.div>
  );
}
```

**Filter Panel Animations**:
```jsx
function FilterPanel({ isOpen }) {
  return (
    <motion.div
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
      transition={{ type: "spring", damping: 25 }}
    >
      {/* Filters */}
    </motion.div>
  );
}
```

**Loading Micro-Interactions**:
```jsx
<motion.div
  className="loading-indicator"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
>
  <motion.div
    animate={{ rotate: 360 }}
    transition={{
      repeat: Infinity,
      duration: 1,
      ease: "linear"
    }}
  />
</motion.div>
```

**Best Practices**:
- Keep animations between 200-500ms
- Use spring animations for natural feel
- Apply to hover, focus, tap gestures
- Provide visual feedback for all interactions

---

### Card/Grid Layout Innovations

**Virtualized Grids for Performance**

```bash
npm install react-window
```

```jsx
import { FixedSizeGrid } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

function VirtualizedCardGrid({ cards }) {
  const COLUMN_WIDTH = 280;
  const ROW_HEIGHT = 400;

  return (
    <AutoSizer>
      {({ width, height }) => {
        const columnCount = Math.floor(width / COLUMN_WIDTH);
        const rowCount = Math.ceil(cards.length / columnCount);

        return (
          <FixedSizeGrid
            columnCount={columnCount}
            columnWidth={COLUMN_WIDTH}
            height={height}
            rowCount={rowCount}
            rowHeight={ROW_HEIGHT}
            width={width}
          >
            {({ columnIndex, rowIndex, style }) => {
              const index = rowIndex * columnCount + columnIndex;
              return (
                <div style={style}>
                  <CardItem card={cards[index]} />
                </div>
              );
            }}
          </FixedSizeGrid>
        );
      }}
    </AutoSizer>
  );
}
```

**Performance Benefits**:
- Handles thousands of items smoothly
- Reduces DOM nodes from 1000s to ~20
- Saves bandwidth (329 requests → 43 requests in one case study)
- Faster initial load (8.46s → 3.79s)

---

### Color Coding and Visual Hierarchy

**Grade Color System**:
```jsx
const gradeColors = {
  'PSA 10': 'bg-emerald-500 text-white',
  'PSA 9': 'bg-blue-500 text-white',
  'PSA 8': 'bg-violet-500 text-white',
  'PSA 7': 'bg-amber-500 text-white',
  'BGS 9.5': 'bg-emerald-400 text-white',
  'BGS 9': 'bg-blue-400 text-white',
  // etc.
};

function GradeBadge({ grade }) {
  return (
    <span className={`px-2 py-1 rounded-md font-semibold ${gradeColors[grade]}`}>
      {grade}
    </span>
  );
}
```

**Price Hierarchy**:
```jsx
function PriceDisplay({ price, comparePrice }) {
  const discount = comparePrice ? ((comparePrice - price) / comparePrice * 100) : 0;

  return (
    <div className="price-display">
      <span className="text-2xl font-bold">${price.toLocaleString()}</span>
      {comparePrice && (
        <div className="flex items-center gap-2">
          <span className="text-sm line-through text-gray-400">
            ${comparePrice.toLocaleString()}
          </span>
          <span className="text-sm font-semibold text-green-600">
            Save {discount.toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
```

---

## 4. Reduction of Clicks

### Hover Previews

**Quick View on Hover**:
```jsx
import { Popover, PopoverTrigger, PopoverContent } from '@radix-ui/react-popover';

function CardWithQuickView({ card }) {
  const [isHovering, setIsHovering] = useState(false);

  return (
    <Popover open={isHovering} onOpenChange={setIsHovering}>
      <PopoverTrigger asChild>
        <motion.div
          onHoverStart={() => setIsHovering(true)}
          onHoverEnd={() => setIsHovering(false)}
        >
          <CardThumbnail card={card} />
        </motion.div>
      </PopoverTrigger>

      <PopoverContent className="quick-view-panel">
        <DetailedCardInfo card={card} />
        <QuickActions>
          <AddToWatchlist />
          <AddToCart />
          <Compare />
        </QuickActions>
      </PopoverContent>
    </Popover>
  );
}
```

---

### Keyboard Shortcuts

**Command Palette Pattern** (Cmd+K / Ctrl+K):

```bash
npm install cmdk
```

```jsx
import { Command } from 'cmdk';

function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Cmd+K to open
  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Command.Dialog open={open} onOpenChange={setOpen}>
      <Command.Input placeholder="Search cards, apply filters..." />
      <Command.List>
        <Command.Group heading="Quick Filters">
          <Command.Item onSelect={() => applyFilter('psa10')}>
            PSA 10 Only
          </Command.Item>
          <Command.Item onSelect={() => applyFilter('rookies')}>
            Rookie Cards
          </Command.Item>
        </Command.Group>

        <Command.Group heading="Saved Searches">
          {savedSearches.map(search => (
            <Command.Item key={search.id} onSelect={() => loadSearch(search)}>
              {search.name}
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
```

**Alternative Package**:
```bash
npm install kbar
```

**Common Shortcuts**:
- `Cmd/Ctrl + K` - Open command palette
- `/` - Focus search box
- `Esc` - Clear filters / close panels
- `Arrow keys` - Navigate results
- `Enter` - Select item
- `Cmd/Ctrl + Click` - Open in new tab

```jsx
import { useHotkeys } from 'react-hotkeys-hook';

function SearchInterface() {
  const searchRef = useRef(null);

  useHotkeys('/', (e) => {
    e.preventDefault();
    searchRef.current?.focus();
  });

  useHotkeys('esc', () => {
    clearFilters();
    searchRef.current?.blur();
  });

  return <SearchBox ref={searchRef} />;
}
```

---

### Quick Filters / Smart Chips

**Pre-Configured Filter Chips**:
```jsx
function QuickFilters() {
  const quickFilters = [
    { label: 'PSA 10', filters: { grade: 'PSA 10' } },
    { label: 'Under $100', filters: { price_max: 100 } },
    { label: 'Rookies', filters: { card_type: 'Rookie' } },
    { label: 'New Listings', filters: { sort: 'date_desc' } },
    { label: 'Hot Cards', filters: { trending: true } },
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {quickFilters.map(qf => (
        <motion.button
          key={qf.label}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => applyQuickFilter(qf.filters)}
          className="px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200"
        >
          {qf.label}
        </motion.button>
      ))}
    </div>
  );
}
```

---

### One-Click Preset Searches

**Saved Search UI**:
```jsx
function SavedSearches() {
  const { savedSearches, loadSearch, deleteSearch } = useSavedSearches();

  return (
    <div className="saved-searches-grid">
      {savedSearches.map(search => (
        <motion.div
          key={search.id}
          whileHover={{ scale: 1.02 }}
          className="saved-search-card"
        >
          <button onClick={() => loadSearch(search.id)}>
            <h4>{search.name}</h4>
            <p className="text-sm text-gray-500">
              {search.filters.length} filters
            </p>
            <Badge>{search.resultCount} results</Badge>
          </button>
          <IconButton onClick={() => deleteSearch(search.id)}>
            <TrashIcon />
          </IconButton>
        </motion.div>
      ))}
    </div>
  );
}
```

---

### Contextual Actions

**Inline Actions on Cards**:
```jsx
function CardWithActions({ card }) {
  return (
    <div className="card relative group">
      <CardImage src={card.image} />

      {/* Show on hover */}
      <motion.div
        className="absolute inset-0 bg-black/50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      >
        <div className="flex gap-2">
          <IconButton tooltip="Quick View">
            <EyeIcon />
          </IconButton>
          <IconButton tooltip="Add to Watchlist">
            <HeartIcon />
          </IconButton>
          <IconButton tooltip="Compare">
            <ScaleIcon />
          </IconButton>
          <IconButton tooltip="Share">
            <ShareIcon />
          </IconButton>
        </div>
      </motion.div>

      <CardDetails {...card} />
    </div>
  );
}
```

---

## 5. Advanced Features

### Natural Language Search

**Query Understanding with Algolia**:

Algolia provides built-in NLP features:
- Typo tolerance (1 out of 10 queries is misspelled)
- Synonym handling
- Plural/singular matching
- Stop word removal

**Configuration**:
```jsx
<InstantSearch
  searchClient={searchClient}
  indexName="cards"
  searchParameters={{
    typoTolerance: true,
    removeStopWords: true,
    exactOnSingleWordQuery: 'attribute',
  }}
>
  <SearchBox />
</InstantSearch>
```

**Enhanced with Client-Side Fuzzy Search**:
```bash
npm install fuse.js
```

```jsx
import Fuse from 'fuse.js';

function EnhancedSearch({ data }) {
  const fuse = new Fuse(data, {
    keys: ['player', 'team', 'set', 'year'],
    threshold: 0.3, // 0 = exact, 1 = match anything
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  const handleSearch = (query) => {
    // Client-side fuzzy matching for instant results
    const results = fuse.search(query);

    // Then fetch full results from Algolia
    performAlgoliaSearch(query);
  };

  return <SearchBox onChange={handleSearch} />;
}
```

**When to Use Fuse.js**:
- Dataset < 10MB (can load client-side)
- Need offline search capability
- Supplemental to Algolia for instant feedback

---

### Search Suggestions and Autocomplete

**Algolia QuerySuggestions**:
```jsx
import { useQuerySuggestions } from 'react-instantsearch';

function SearchAutocomplete() {
  const { suggestions, currentRefinement } = useQuerySuggestions({
    limit: 5,
  });

  return (
    <div className="search-autocomplete">
      <input value={currentRefinement} />

      {suggestions.length > 0 && (
        <div className="suggestions-dropdown">
          {suggestions.map(suggestion => (
            <button
              key={suggestion.objectID}
              onClick={() => applySuggestion(suggestion.query)}
              className="suggestion-item"
            >
              <SearchIcon />
              <span>
                <Highlight hit={suggestion} attribute="query" />
              </span>
              <ArrowIcon />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

**Category Suggestions**:
```jsx
function CategorySuggestions({ query }) {
  // Show category-specific suggestions
  return (
    <div className="suggestions-grid">
      <div>
        <h4>Players</h4>
        <Suggestions category="players" query={query} />
      </div>
      <div>
        <h4>Teams</h4>
        <Suggestions category="teams" query={query} />
      </div>
      <div>
        <h4>Sets</h4>
        <Suggestions category="sets" query={query} />
      </div>
    </div>
  );
}
```

---

### Typo Correction / "Did You Mean"

**Algolia's Built-In Typo Tolerance**:

Modern spelling correction uses:
- Deep neural networks (680M+ parameters)
- Context-aware matching
- < 2ms processing time

**Visual Implementation**:
```jsx
function SearchWithCorrection({ query, results }) {
  const { suggestedQuery } = useQueryCorrection();

  if (results.length === 0 && suggestedQuery) {
    return (
      <div className="search-correction">
        <p>No results for "{query}"</p>
        <button
          onClick={() => search(suggestedQuery)}
          className="text-blue-600 underline"
        >
          Did you mean "{suggestedQuery}"?
        </button>
      </div>
    );
  }

  if (suggestedQuery && suggestedQuery !== query) {
    return (
      <div className="search-hint">
        <p>Showing results for "{suggestedQuery}"</p>
        <button onClick={() => search(query, { exact: true })}>
          Search instead for "{query}"
        </button>
      </div>
    );
  }

  return <Results data={results} />;
}
```

---

### Related Searches

**Based on User Behavior**:
```jsx
function RelatedSearches({ currentQuery }) {
  const relatedSearches = useRelatedSearches(currentQuery);

  return (
    <div className="related-searches">
      <h4>Related Searches</h4>
      <div className="flex flex-wrap gap-2">
        {relatedSearches.map(search => (
          <button
            key={search}
            onClick={() => performSearch(search)}
            className="px-3 py-1 bg-gray-100 rounded-full hover:bg-gray-200"
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Example for "Michael Jordan 1986"**:
- "Michael Jordan Rookie Cards"
- "1986 Fleer Basketball"
- "Michael Jordan PSA 10"
- "Chicago Bulls 1986"
- "Larry Bird 1986"

---

### Filter Memory and Smart Recommendations

**Persistent Filter Preferences**:
```jsx
function useFilterMemory() {
  const [preferences, setPreferences] = useState({});

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem('filterPreferences');
    if (stored) setPreferences(JSON.parse(stored));
  }, []);

  const rememberFilter = (filterType, value) => {
    const updated = {
      ...preferences,
      [filterType]: value,
      lastUsed: Date.now(),
    };
    setPreferences(updated);
    localStorage.setItem('filterPreferences', JSON.stringify(updated));
  };

  const getSuggestedFilters = () => {
    // Suggest filters based on history
    return Object.entries(preferences)
      .sort((a, b) => b[1].lastUsed - a[1].lastUsed)
      .slice(0, 5);
  };

  return { rememberFilter, getSuggestedFilters };
}
```

**Smart Recommendations**:
```jsx
function SmartFilterRecommendations() {
  const { getSuggestedFilters } = useFilterMemory();
  const suggestions = getSuggestedFilters();

  return (
    <div className="filter-suggestions">
      <h4>You often search for:</h4>
      {suggestions.map(([type, value]) => (
        <QuickFilterChip
          key={type}
          type={type}
          value={value}
          onApply={() => applyFilter(type, value)}
        />
      ))}
    </div>
  );
}
```

---

## 6. Sports Card / Collectibles Specific

### Grade Visualization

**PSA/BGS Grading Standards**:
- PSA 10: Front 55/45-60/40, Back 70/30
- BGS 10: Front 50/50, Back 60/40

**Visual Badge System**:
```jsx
const gradingCompanies = {
  PSA: {
    logo: '/logos/psa.png',
    colors: {
      10: { bg: 'bg-red-600', border: 'border-red-700' },
      9: { bg: 'bg-blue-600', border: 'border-blue-700' },
      8: { bg: 'bg-green-600', border: 'border-green-700' },
    },
  },
  BGS: {
    logo: '/logos/bgs.png',
    colors: {
      10: { bg: 'bg-black', border: 'border-yellow-400' },
      9.5: { bg: 'bg-emerald-600', border: 'border-emerald-700' },
      9: { bg: 'bg-blue-600', border: 'border-blue-700' },
    },
  },
  SGC: { /* ... */ },
  CGC: { /* ... */ },
};

function GradeDisplay({ company, grade }) {
  const config = gradingCompanies[company];
  const colorConfig = config.colors[grade] || config.colors.default;

  return (
    <div className={`grade-badge ${colorConfig.bg} ${colorConfig.border} border-2`}>
      <img src={config.logo} alt={company} className="h-6" />
      <span className="text-white font-bold text-xl">{grade}</span>
    </div>
  );
}
```

**Centering Visualization**:
```jsx
function CenteringVisualizer({ frontCentering, backCentering }) {
  // frontCentering: { leftRight: '55/45', topBottom: '60/40' }

  return (
    <div className="centering-visual">
      <div className="card-outline relative">
        {/* Visual representation of centering */}
        <div className="centering-overlay">
          <div className="horizontal-line" style={{ top: calculatePosition(frontCentering.topBottom) }} />
          <div className="vertical-line" style={{ left: calculatePosition(frontCentering.leftRight) }} />
        </div>
      </div>

      <div className="centering-details">
        <div>L/R: {frontCentering.leftRight}</div>
        <div>T/B: {frontCentering.topBottom}</div>
      </div>
    </div>
  );
}
```

---

### eBay/PWCC/StockX Patterns

**eBay Advanced Search Patterns**:
- Item specifics (Sport, Team, Player, Year, Set)
- Grading information (Company, Grade, Cert #)
- Price ranges and sorting
- Buying format (Auction vs Buy It Now)
- Seller filters (Top Rated, Location)

**Implementation**:
```jsx
function AdvancedFilters() {
  return (
    <div className="filter-panel">
      <FilterSection title="Card Details">
        <Select attribute="sport" />
        <Select attribute="player" searchable />
        <Select attribute="team" />
        <RangeSlider attribute="year" min={1950} max={2024} />
        <Select attribute="set" searchable />
      </FilterSection>

      <FilterSection title="Grading">
        <Select attribute="grading_company" />
        <RangeSlider attribute="grade" min={1} max={10} step={0.5} />
        <Checkbox attribute="graded" label="Graded only" />
      </FilterSection>

      <FilterSection title="Price">
        <RangeSlider attribute="price" min={0} max={10000} />
        <Select attribute="listing_type" options={['Auction', 'Buy Now', 'Best Offer']} />
      </FilterSection>

      <FilterSection title="Condition">
        <RangeSlider attribute="corners" label="Corners" />
        <RangeSlider attribute="edges" label="Edges" />
        <RangeSlider attribute="surface" label="Surface" />
        <RangeSlider attribute="centering" label="Centering" />
      </FilterSection>
    </div>
  );
}
```

**PWCC Features**:
- Vault integration
- Flash auctions
- One-tap eBay listing
- High-end focus (investment grade)

**StockX Pattern**:
- Stock market approach
- Price transparency
- Bid/Ask spread
- Historical pricing charts

```jsx
function StockXStylePricing({ card }) {
  return (
    <div className="pricing-panel">
      <div className="current-price">
        <span className="label">Last Sale</span>
        <span className="price">${card.lastSale}</span>
      </div>

      <div className="bid-ask-spread">
        <div className="bid">
          <span className="label">Highest Bid</span>
          <span className="price text-green-600">${card.highestBid}</span>
        </div>
        <div className="ask">
          <span className="label">Lowest Ask</span>
          <span className="price text-red-600">${card.lowestAsk}</span>
        </div>
      </div>

      <PriceHistoryChart data={card.priceHistory} />
    </div>
  );
}
```

---

### Price Comparison Displays

**Multi-Listing Comparison**:
```jsx
function PriceComparison({ listings }) {
  const sortedByPrice = [...listings].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedByPrice[0];
  const averagePrice = listings.reduce((sum, l) => sum + l.price, 0) / listings.length;

  return (
    <div className="price-comparison">
      <div className="price-stats">
        <Stat label="Lowest Price" value={`$${lowestPrice.price}`} highlight />
        <Stat label="Average Price" value={`$${averagePrice.toFixed(2)}`} />
        <Stat label="Available" value={listings.length} />
      </div>

      <div className="listings-grid">
        {sortedByPrice.map((listing, index) => (
          <div
            key={listing.id}
            className={`listing-card ${index === 0 ? 'best-value' : ''}`}
          >
            {index === 0 && <Badge variant="success">Best Value</Badge>}

            <div className="seller-info">
              <Avatar src={listing.seller.avatar} />
              <div>
                <p>{listing.seller.name}</p>
                <Rating value={listing.seller.rating} />
              </div>
            </div>

            <PriceDisplay
              price={listing.price}
              shipping={listing.shipping}
            />

            <div className="price-breakdown">
              <span>Price: ${listing.price}</span>
              <span>Shipping: ${listing.shipping}</span>
              <span className="total font-bold">
                Total: ${listing.price + listing.shipping}
              </span>
            </div>

            <Button variant="primary">View Listing</Button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Price Badge System**:
```jsx
function PriceBadges({ price, marketData }) {
  const badges = [];

  if (price < marketData.average * 0.8) {
    badges.push({ text: 'Great Deal', variant: 'success' });
  }

  if (price === marketData.lowest) {
    badges.push({ text: 'Lowest Price', variant: 'primary' });
  }

  if (marketData.recentlyDropped) {
    badges.push({ text: 'Price Drop', variant: 'warning' });
  }

  return (
    <div className="flex gap-1">
      {badges.map(badge => (
        <Badge key={badge.text} variant={badge.variant}>
          {badge.text}
        </Badge>
      ))}
    </div>
  );
}
```

---

### Authentication Badges

**Trust Indicators**:
```jsx
function AuthenticationBadges({ card }) {
  return (
    <div className="auth-badges">
      {card.graded && (
        <Tooltip content="Professionally graded and authenticated">
          <Badge variant="verified">
            <ShieldCheckIcon />
            {card.gradingCompany} Certified
          </Badge>
        </Tooltip>
      )}

      {card.seller.topRated && (
        <Badge variant="gold">
          <StarIcon />
          Top Rated Seller
        </Badge>
      )}

      {card.returnPolicy && (
        <Badge variant="secondary">
          <RefreshIcon />
          Returns Accepted
        </Badge>
      )}

      {card.authenticity && (
        <Badge variant="verified">
          <CheckCircleIcon />
          Authenticity Guaranteed
        </Badge>
      )}
    </div>
  );
}
```

**Visual Authenticity Display**:
```jsx
function AuthenticityDisplay({ card }) {
  return (
    <div className="authenticity-panel">
      <h4>Authentication</h4>

      <div className="cert-info">
        <img src={card.certImage} alt="Certificate" />
        <div>
          <p>Cert #: {card.certNumber}</p>
          <a
            href={card.certVerifyUrl}
            target="_blank"
            className="text-blue-600 underline"
          >
            Verify on {card.gradingCompany} website
          </a>
        </div>
      </div>

      {card.gradeBreakdown && (
        <div className="grade-breakdown">
          <h5>Sub-grades</h5>
          <div className="grid grid-cols-2 gap-2">
            <SubGrade label="Centering" value={card.gradeBreakdown.centering} />
            <SubGrade label="Corners" value={card.gradeBreakdown.corners} />
            <SubGrade label="Edges" value={card.gradeBreakdown.edges} />
            <SubGrade label="Surface" value={card.gradeBreakdown.surface} />
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 7. Complete Package List

### Core Search & Filtering
```bash
# Algolia InstantSearch
npm install react-instantsearch algoliasearch

# Debouncing
npm install use-debounce

# Fuzzy search (client-side)
npm install fuse.js
```

### UI Components & Interactions
```bash
# Animations
npm install framer-motion

# Headless UI components
npm install @radix-ui/react-popover
npm install @radix-ui/react-dialog
npm install @radix-ui/react-checkbox
npm install @radix-ui/react-select

# Alternative: Headless UI
npm install @headlessui/react

# Command palette
npm install cmdk
# OR
npm install kbar
```

### Performance & Virtualization
```bash
# Virtual scrolling
npm install react-window
npm install react-virtualized-auto-sizer

# Loading states
npm install react-loading-skeleton
```

### Keyboard Shortcuts & Hotkeys
```bash
npm install react-hotkeys-hook
```

### Utilities
```bash
# Date handling
npm install date-fns

# Classname utilities
npm install clsx
npm install tailwind-merge

# Icons
npm install lucide-react
# OR
npm install @heroicons/react
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
1. Set up Algolia InstantSearch
2. Implement basic SearchBox with debouncing
3. Add RefinementList for key attributes (Grade, Player, Year)
4. Create responsive card grid layout
5. Add skeleton loading states

### Phase 2: Smart Filtering (Week 3-4)
1. Implement filter count previews
2. Add hierarchical menus for category navigation
3. Create quick filter chips
4. Build saved search functionality with localStorage
5. Add filter ordering/sorting logic

### Phase 3: Visual Polish (Week 5-6)
1. Integrate Framer Motion for micro-interactions
2. Add hover preview popovers
3. Implement card animations
4. Create grade visualization components
5. Add price comparison displays

### Phase 4: Advanced Features (Week 7-8)
1. Implement command palette (Cmd+K)
2. Add keyboard shortcuts
3. Create related searches component
4. Build filter memory system
5. Add typo correction UI

### Phase 5: Sports Card Specifics (Week 9-10)
1. Create advanced grading filters
2. Build authentication badge system
3. Implement StockX-style pricing display
4. Add centering visualization
5. Create multi-listing comparison

### Phase 6: Optimization (Week 11-12)
1. Implement virtualization for large result sets
2. Optimize bundle size (tree-shaking)
3. Add performance monitoring
4. Conduct usability testing
5. Polish animations and transitions

---

## 9. Key Metrics to Track

### Performance
- Time to First Contentful Paint (< 1.5s)
- Time to Interactive (< 3s)
- Search response time (< 300ms perceived)
- Skeleton to content transition (< 100ms)

### User Engagement
- Search abandonment rate (target: < 30%)
- Filter usage rate
- Saved search creation rate
- Keyboard shortcut adoption
- Quick filter click-through rate

### Search Quality
- Zero-result search rate (target: < 10%)
- Search refinement rate
- Average filters per search
- Time to purchase after search

### Technical
- Bundle size (target: < 200KB gzipped)
- Virtual scroll items rendered (< 50 DOM nodes)
- Animation frame rate (60fps)
- API call reduction via debouncing

---

## 10. Accessibility Considerations

### Keyboard Navigation
- All filters accessible via Tab
- Arrow keys for dropdown navigation
- Enter/Space for selection
- Esc to close panels
- Focus visible indicators

### Screen Readers
```jsx
<button aria-label="Filter by PSA 10 grade (42 results)">
  PSA 10 <Badge>42</Badge>
</button>

<div role="region" aria-live="polite" aria-atomic="true">
  {resultCount} results found for "{query}"
</div>
```

### Color Contrast
- WCAG AA minimum (4.5:1 for text)
- AAA preferred for key actions (7:1)
- Don't rely solely on color for meaning

### Motion
```jsx
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.05 }}
>
```

---

## 11. Mobile-First Considerations

### Filter Drawer Pattern
```jsx
import { Dialog } from '@radix-ui/react-dialog';

function MobileFilters() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className="md:hidden">
        <FilterIcon />
        Filters
        <Badge>{activeFilterCount}</Badge>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <Dialog.Content className="fixed inset-0 bg-white">
          <FilterPanel />
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
            <Button onClick={() => setOpen(false)} fullWidth>
              View {resultCount} Results
            </Button>
          </div>
        </Dialog.Content>
      </Dialog>
    </>
  );
}
```

### Sticky Search Header
```jsx
function MobileSearch() {
  return (
    <div className="sticky top-0 z-50 bg-white shadow-md p-4">
      <SearchBox />
      <div className="flex gap-2 mt-2 overflow-x-auto">
        <QuickFilters />
      </div>
    </div>
  );
}
```

### Touch Gestures
```jsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 0 }}
  onDragEnd={(e, { offset }) => {
    if (offset.x > 100) navigateToNextCard();
    if (offset.x < -100) navigateToPrevCard();
  }}
>
  <CardImage />
</motion.div>
```

---

## 12. Real-World Examples to Study

### Reference Implementations

**Search Excellence**:
- Algolia's demo sites: https://www.algolia.com/doc/guides/building-search-ui/resources/demos/react/
- Stripe Dashboard: https://dashboard.stripe.com
- Linear: https://linear.app (Cmd+K pattern)

**Marketplace Patterns**:
- eBay Advanced Search: https://www.ebay.com/sch/ebayadvsearch
- StockX: https://stockx.com
- PWCC Marketplace: https://www.pwccmarketplace.com

**Filter UX**:
- Airbnb: https://www.airbnb.com
- Amazon: https://www.amazon.com
- Zillow: https://www.zillow.com

**Animation/Polish**:
- Apple: https://www.apple.com
- Stripe: https://stripe.com/payments
- Vercel: https://vercel.com

---

## Conclusion

Building a world-class faceted search experience requires:

1. **Instant Feedback**: Zero-latency UI with optimistic updates and debounced API calls
2. **Smart Filtering**: Intelligent ordering, count previews, and saved searches
3. **Visual Excellence**: Micro-interactions, animations, and clear hierarchy
4. **Reduced Friction**: Keyboard shortcuts, hover previews, and one-click actions
5. **Domain Expertise**: Sports card-specific features like grade visualization and price comparison

The recommended tech stack:
- React + Algolia InstantSearch (core)
- Framer Motion (animations)
- Radix UI (headless components)
- cmdk (command palette)
- react-window (virtualization)
- use-debounce (performance)

Start with Phase 1 (foundation) and progressively enhance. Prioritize instant feedback and smart filtering before advanced features. Always test with real users and real card data.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-15
**Research Compiled By**: Claude (Anthropic)
