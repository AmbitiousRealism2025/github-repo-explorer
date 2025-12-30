# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server on http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
npm test         # Run tests in watch mode
npm test -- --run  # Run tests once (CI mode)
```

## Architecture

### Multi-Page Vite Application

This is a multi-page vanilla JavaScript app with six entry points configured in `vite.config.js`:

| Page | Entry | Purpose |
|------|-------|---------|
| `index.html` | Main | Repository search with filters (language, stars) |
| `trending.html` | Trending | Repos created in last 7 days, sorted by stars with category filters |
| `favorites.html` | Favorites | User-saved repositories from localStorage |
| `detail.html` | Detail | Single repo analytics (languages, events, README, health score) |
| `compare.html` | Compare | Side-by-side repository comparison |
| `collections.html` | Collections | Smart collections management with import/export |

### Core Modules (`src/js/`)

**`api.js`** - GitHub REST API wrapper with:
- In-memory cache (5-min TTL, 50 entries max)
- Exponential backoff retry (3 attempts)
- Rate limit handling and token auth support
- 202 response handling with retry for stats endpoints
- UTF-8 safe base64 decoding for README content
- Exports: `searchRepositories`, `getTrendingRepositories`, `getRepository`, `getRepositoryReadme`, `getRepositoryLanguages`, `getRepositoryEvents`, `getCommitActivity`, `checkRateLimit`, `clearCache`

**`common.js`** - Shared utilities:
- `Storage` object: favorites CRUD, theme persistence, GitHub token, notes, collections, exploration tracking
- UI helpers: `showToast`, `formatNumber`, `formatDate`, `debounce`
- XSS prevention: `safeText`, `createElement`, `escapeHtml`
- Security: `sanitizeUrl` (validates http/https only)
- `Icons` object: inline SVG strings for UI elements

**`constants.js`** - Configuration values for API, caching, pagination, localStorage keys, trending categories

**`components/`** - Reusable UI components:
- `RepoGrid.js` - Repository card rendering with pagination, favorite toggle, collection picker
- `HealthScore.js` - Repository health assessment (0-100 score based on 5 metrics)
- `CommitHeatmap.js` - GitHub-style contribution calendar
- `CloneCommands.js` - Clone command tabs (HTTPS, SSH, CLI, Degit) with clipboard fallback
- `RepoNotes.js` - Personal notes system per repository
- `DiscoveryStats.js` - Personal exploration tracking stats

### Page Scripts

Each HTML page imports its corresponding script which handles page-specific initialization:
- `main.js` / `search.js` - Search page with filters
- `trending.js` - Trending with category tabs
- `favorites.js` - Favorites management
- `detail.js` - Repository deep-dive analytics
- `compare.js` - Side-by-side comparison
- `collections.js` - Smart collections with import/export

### Styling

- `theme.css` - CSS custom properties for dark/light themes (data-theme attribute on html)
- `main.css` - Layout, base styles, responsive breakpoints (480px, 640px, 768px, 1024px, 1280px)
- `components.css` - Component-specific styles (cards, modals, pagination) with mobile adjustments
- `accessibility.css` - Reduced motion, high contrast, skip links

### Security

- CSP headers in all HTML files (script-src, style-src, connect-src, img-src, font-src)
- Collection import validation: 10KB size limit, schema validation
- XSS prevention via `escapeHtml`, `safeText`, `sanitizeUrl`

### Data Flow

1. User interactions trigger API calls through `api.js` functions
2. Responses are cached in memory Map and returned with rate limit info
3. UI updates use `RepoGrid` component functions or direct DOM manipulation
4. Persistent state (favorites, theme, token) stored via `Storage` object in localStorage

### GitHub API Notes

- Unauthenticated: 60 req/hr (core), 10 req/min (search)
- Authenticated: 5,000 req/hr (core), 30 req/min (search)
- Token stored in localStorage under `gh-token` key
- Stats endpoints (commit activity) may return 202 while computing - api.js handles retry

## Testing

Tests use Vitest with jsdom environment. Test files are in `src/js/__tests__/`:

| File | Coverage |
|------|----------|
| `api.test.js` | API wrapper, caching, error handling, 202 retry |
| `common.test.js` | Storage, utilities, sanitization |
| `constants.test.js` | Configuration validation |
| `components.test.js` | CloneCommands, RepoNotes, CommitHeatmap, DiscoveryStats |
| `HealthScore.test.js` | Health score calculation |
| `RepoGrid.test.js` | Card rendering, pagination |
| `collections.test.js` | Collection import/export |

Current: **241 tests passing**

## Next Steps (Phase 3 - Code Quality)

Remaining improvements from AltCoder review (`AltCoder-review.md`):

| Task | File | Description |
|------|------|-------------|
| Extract magic numbers | `HealthScore.js` | Move maintenance thresholds to constants |
| Extract retry config | `api.js` | Move `RETRY_CONFIG` values to constants |
| DOM query safety | `common.js` | Add `getRequiredElement(id)` helper |
| Remove color fallbacks | `HealthScore.js` | Use CSS vars only (no inline fallbacks) |

---

*Updated by Sisyphus: December 29, 2025*
