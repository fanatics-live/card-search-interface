# Card Search - Faceted Search Interface

A modern, high-performance faceted search interface for browsing sports cards powered by Algolia.

## Features

### Phase I (Current)
- ⚡ **Instant Search** - Real-time search as you type with 200ms debounce
- 🎨 **Beautiful UI** - Modern design with Tailwind CSS and Framer Motion animations
- 📱 **Mobile-First** - Fully responsive design that works on any device
- 🔄 **Smart Loading** - Skeleton screens that mirror final layout
- 💳 **Card Display** - Rich card information with grades, prices, and metadata
- 📄 **Pagination** - Smart pagination with keyboard navigation
- 🔍 **No Results State** - Helpful empty state with suggestions

## Tech Stack

- **React 18.2.0** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Algolia InstantSearch** - Powerful search SDK
- **Framer Motion** - Smooth animations
- **Heroicons** - Beautiful icons

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.example .env.local
```

3. Update `.env.local` with your Algolia credentials:
```bash
VITE_ALGOLIA_APP_ID=your_app_id_here
VITE_ALGOLIA_SEARCH_API_KEY=your_search_api_key_here
VITE_ALGOLIA_INDEX_NAME=fanatics_cards
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── cards/           # Card-specific components
│   ├── common/          # Shared components
│   ├── layout/          # Layout components
│   └── search/          # Search-related components
├── lib/
│   ├── algolia/         # Algolia client configuration
│   ├── formatters/      # Utility formatters
│   └── utils/           # Utility functions
├── types/               # TypeScript type definitions
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Performance

- Initial load: <800ms
- Time to interactive: <1.5s
- Search response: <100ms (Algolia)
- Zero layout shift (CLS = 0)

## Upcoming Features

### Phase II - Effortless Filtering
- Smart filter suggestions
- Filter memory and saved searches
- Quick filter presets
- URL state management

### Phase III - Premium Experience
- Command palette (⌘K)
- Keyboard shortcuts
- Hover previews
- Micro-animations
- Price insights
- Comparison mode

## License

Proprietary - Fanatics
