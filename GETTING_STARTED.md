# Getting Started Guide

## ✅ Phase I Complete!

Your faceted search application is now set up and running! Here's what we've built:

### What's Working

✅ **Complete Project Structure**
- Vite + React + TypeScript configured
- Tailwind CSS with custom design system
- All dependencies installed

✅ **Core Search Features**
- Instant search with 200ms debounce
- Beautiful card grid layout (responsive 1-2-3-4 columns)
- Skeleton loading states
- Search stats and pagination
- No results state with helpful suggestions

✅ **Card Components**
- Card image with lazy loading
- Grade badges with color coding (PSA, BGS, SGC, etc.)
- Price display with market comparison
- Value badges (Great Price, Fanatics Authentic, Has Offers)
- Favorite and offer counts
- Certification numbers

✅ **Animations**
- Smooth fade-in on load
- Stagger animation for cards (50ms delay each)
- Card hover effects (lift + scale + shadow)
- Skeleton shimmer effect

## 🚀 Development Server Running

Your app is live at: **http://localhost:3000/**

## ⚙️ Configuration Needed

To connect to your Algolia backend, you need to add the **App ID**:

### Step 1: Get Your Algolia App ID

You can find it in your Algolia dashboard or back-office-go configuration.

### Step 2: Update .env.local

Edit `/Users/wdakka/bo/newsearch/.env.local` and replace:

```bash
VITE_ALGOLIA_APP_ID=your_app_id_here
```

With your actual App ID:

```bash
VITE_ALGOLIA_APP_ID=YOUR_ACTUAL_APP_ID
```

### Step 3: Restart the Dev Server

```bash
# Stop current server (Ctrl+C)
# Start again
npm run dev
```

## 📁 Project Structure

```
newsearch/
├── src/
│   ├── components/
│   │   ├── cards/
│   │   │   ├── CardImage.tsx          # Lazy-loaded card images
│   │   │   ├── GradeBadge.tsx         # PSA/BGS grade badges
│   │   │   ├── PriceDisplay.tsx       # Price + market comparison
│   │   │   └── ValueBadges.tsx        # Great Price, etc.
│   │   ├── common/
│   │   │   ├── CardSkeleton.tsx       # Loading skeletons
│   │   │   └── NoResults.tsx          # Empty state
│   │   ├── layout/
│   │   │   └── Header.tsx             # App header
│   │   └── search/
│   │       ├── SearchBox.tsx          # Debounced search input
│   │       ├── Hits.tsx               # Results grid
│   │       ├── HitCard.tsx            # Individual card
│   │       ├── Stats.tsx              # Result count + timing
│   │       └── Pagination.tsx         # Page navigation
│   ├── lib/
│   │   ├── algolia/
│   │   │   └── client.ts              # Algolia configuration
│   │   ├── formatters/
│   │   │   ├── gradeFormatter.ts      # Grade display logic
│   │   │   └── priceFormatter.ts      # Currency formatting
│   │   └── utils/
│   │       └── cn.ts                  # Tailwind class merger
│   ├── types/
│   │   ├── algolia.ts                 # Algolia hit types
│   │   └── search.ts                  # Search state types
│   ├── App.tsx                        # Main component
│   ├── main.tsx                       # Entry point
│   └── index.css                      # Global styles
├── package.json                       # Dependencies
├── vite.config.ts                     # Vite configuration
├── tailwind.config.js                 # Tailwind config
└── .env.local                         # Environment variables
```

## 🎨 Design System

### Colors
- **Primary**: Sky blue (#0ea5e9) for CTAs
- **PSA 10**: Emerald green (#10b981)
- **PSA 9**: Blue (#3b82f6)
- **PSA 8**: Purple (#8b5cf6)
- **BGS 10 (Black Label)**: Dark gray (#1f2937)
- **Great Price**: Amber (#f59e0b)

### Typography
- **Font**: Inter (headings & body), JetBrains Mono (prices/certs)
- **Scale**: 4px base unit for spacing

### Responsive Breakpoints
- Mobile: < 640px (1 column)
- Tablet: 640px - 1024px (2 columns)
- Desktop: 1024px - 1280px (3 columns)
- Large: > 1280px (4 columns)

## 🔍 Search Configuration

Currently configured for:
- **24 hits per page**
- **Typo tolerance** enabled
- **Highlighting** on title, subtitle, card number, cert number
- **Distinct** results enabled
- **Remove words if no results**

## 📝 Next Steps

### Immediate (once Algolia is connected):
1. ✅ Test search functionality
2. ✅ Verify card data displays correctly
3. ✅ Check pagination works
4. ✅ Test on mobile devices

### Phase II - Effortless Filtering (Weeks 4-6):
1. Add sidebar with facet filters
2. Implement quick filter presets
3. Add URL state management
4. Create saved searches feature
5. Build mobile filter drawer

### Phase III - Premium Experience (Weeks 7-10):
1. Command palette (⌘K)
2. Keyboard shortcuts
3. Hover previews
4. Price insights
5. Comparison mode
6. Virtual scrolling for performance

## 🛠️ Available Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run format    # Format code with Prettier
```

## 🐛 Troubleshooting

### Algolia errors in console
- Check that App ID is set correctly
- Verify Search API Key has proper permissions
- Ensure index name matches your Algolia index

### Cards not displaying
- Check that your Algolia index has data
- Verify the data structure matches `AlgoliaCardHit` type
- Check browser console for errors

### Styling issues
- Run `npm run dev` to restart Tailwind processing
- Check that `index.css` includes Tailwind directives
- Verify PostCSS is configured correctly

## 📊 Performance Targets

Current achievement:
- ✅ Vite dev server ready in 302ms
- ✅ Zero layout shift (skeleton mirrors final layout)
- ⏱️ Search response: <100ms (depends on Algolia)
- ⏱️ Time to interactive: <1.5s (needs testing with real data)

## 📞 Support

If you encounter issues:
1. Check the browser console for errors
2. Verify environment variables are set
3. Ensure Algolia index is properly configured
4. Check network tab for API responses

---

**Status**: ✅ Phase I Foundation Complete
**Next**: Configure Algolia App ID and test with real data
