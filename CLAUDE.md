# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server on http://localhost:3000 (auto-opens browser)
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
```

## Architecture

### Multi-Page Vite Application

This is a multi-page vanilla JavaScript app with four entry points configured in `vite.config.js`:

| Page | Entry | Purpose |
|------|-------|---------|
| `index.html` | Main | Repository search with filters (language, stars) |
| `trending.html` | Trending | Repos created in last 7 days, sorted by stars |
| `favorites.html` | Favorites | User-saved repositories from localStorage |
| `detail.html` | Detail | Single repo analytics (languages, events, README) |

### Core Modules (`src/js/`)

**`api.js`** - GitHub REST API wrapper with:
- In-memory cache (5-min TTL, 50 entries max)
- Exponential backoff retry (3 attempts)
- Rate limit handling and token auth support
- Exports: `searchRepositories`, `getTrendingRepositories`, `getRepository`, `getRepositoryReadme`, `getRepositoryLanguages`, `getRepositoryEvents`

**`common.js`** - Shared utilities:
- `Storage` object: favorites CRUD, theme persistence, GitHub token management
- UI helpers: `showToast`, `formatNumber`, `formatDate`, `debounce`
- XSS prevention: `safeText`, `createElement`, `escapeHtml`
- `Icons` object: inline SVG strings for UI elements

**`constants.js`** - Configuration values for API, caching, pagination, localStorage keys

**`components/RepoGrid.js`** - Repository card rendering with pagination and favorite toggle handlers

### Page Scripts

Each HTML page imports its corresponding script (`search.js`, `trending.js`, `favorites.js`, `detail.js`) which handles page-specific initialization and event binding.

### Styling

- `theme.css` - CSS custom properties for dark/light themes (data-theme attribute on html)
- `main.css` - Layout and base styles
- `components.css` - Component-specific styles (cards, modals, pagination)

### Data Flow

1. User interactions trigger API calls through `api.js` functions
2. Responses are cached in memory Map and returned with rate limit info
3. UI updates use `RepoGrid` component functions or direct DOM manipulation
4. Persistent state (favorites, theme, token) stored via `Storage` object in localStorage

### GitHub API Notes

- Unauthenticated: 60 req/hr (core), 10 req/min (search)
- Authenticated: 5,000 req/hr (core), 30 req/min (search)
- Token stored in localStorage under `gh-token` key
