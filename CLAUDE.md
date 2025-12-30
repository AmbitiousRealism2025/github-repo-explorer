# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build to dist/
npm run preview  # Preview production build locally
npm test         # Run tests once (CI mode)
npm run test:watch  # Run tests in watch mode
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
- DOM safety: `getRequiredElement(id)` throws descriptive error if element missing
- Mobile nav: `initMobileNav()` sets up hamburger menu with focus trap
- `Icons` object: inline SVG strings for UI elements

**`constants.js`** - Configuration values for API, caching, pagination, localStorage keys, trending categories

**`components/`** - Reusable UI components:
- `RepoGrid.js` - Repository card rendering with pagination, favorite toggle, collection picker
- `HealthScore.js` - Repository health assessment (0-100 score based on 5 metrics)
- `CommitHeatmap.js` - GitHub-style contribution calendar
- `CloneCommands.js` - Clone command tabs (HTTPS, SSH, CLI, Degit) with clipboard fallback
- `RepoNotes.js` - Personal notes system per repository
- `DiscoveryStats.js` - Personal exploration tracking stats
- `RepositoryDNA/` - Bio-Circuit DNA visualization system (see below)

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
- `main.css` - Layout, base styles, responsive breakpoints (359px, 480px, 640px, 768px, 1024px, 1280px)
- `components.css` - Component-specific styles (cards, modals, pagination, mobile navigation) with mobile adjustments
- `accessibility.css` - Reduced motion, high contrast, skip links

### Mobile Navigation

All pages include a hamburger menu for mobile devices (<640px):
- Slide-in panel from right with overlay backdrop
- Focus trap and keyboard accessibility (Escape to close)
- ARIA attributes for screen readers
- Initialized via `initMobileNav()` from `common.js`

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

## Repository DNA (Bio-Circuit Visualization)

A unique visual fingerprint for each repository, combining organic DNA aesthetics with circuit board patterns.

### Architecture (`src/js/components/RepositoryDNA/`)

| File | Purpose |
|------|---------|
| `index.js` | Main component exports, `createRepositoryDNA()`, `createDNABadge()` |
| `DNAGenerator.js` | Generates deterministic DNA data from repo attributes |
| `DNARenderer.js` | Canvas rendering with layered Bio-Circuit patterns |
| `colors.js` | Color system with theme-aware adjustments, harmonious palettes |
| `shapes.js` | Language-to-shape mapping, shape drawing functions |
| `patterns.js` | Legacy pattern functions (radial rays, rings, spirals) |
| `bioCircuitPatterns.js` | Bio-Circuit patterns (helix, nodes, bridges, rails) |
| `DNAExporter.js` | Download/clipboard export, caching |

### Language → Shape Mapping

Each programming language family has a distinctive shape:

| Language Family | Shape | Examples |
|-----------------|-------|----------|
| Web | Hexagon | JavaScript, TypeScript, HTML, CSS, Vue |
| Systems | Octagon | Rust, Go, C, C++, Zig |
| Python | Circle | Python |
| Ruby | Diamond | Ruby |
| JVM | Square | Java, Kotlin, Scala |
| Mobile | Rounded Rect | Swift, Dart |
| Functional | Star | Haskell, Elixir, F#, Clojure |
| Data/ML | Pentagon | R, Julia, C# |
| Shell/DevOps | Triangle | Shell, PowerShell, Dockerfile |
| Markup | Heptagon | JSON, YAML, Markdown |

### Color System

- **Multi-color palettes**: Each repo gets primary + 2 harmonious accent colors
- **Color schemes**: Analogous (simple repos), split-complementary (medium), triadic (popular)
- **Theme-aware**: Colors auto-adjust for visibility in light/dark modes
  - Light mode: Yellows/lights darkened, saturation boosted
  - Dark mode: Dark colors lightened, saturation boosted

### Star-Based Glow Effect

Perimeter glow intensity and pulse speed based on star count:

| Stars | Glow Intensity | Pulse Speed | Glow Size |
|-------|---------------|-------------|-----------|
| < 100 | 20% | 4.0s | 8px |
| 100-1K | 40% | 3.5s | 12px |
| 1K-10K | 60% | 3.0s | 16px |
| 10K-100K | 80% | 2.5s | 22px |
| 100K+ | 100% | 2.0s | 30px |

### Visual Layers (in render order)

1. **Helix Trace** - Subtle double helix in background (2 colors)
2. **Signal Dots** - Unique constellation from repo name hash
3. **Power Rails** - Top/bottom frame lines (style by license)
4. **Data Bridges** - Horizontal connectors (style by star tier)
5. **Main Shape** - Language-based shape with star glow
6. **Branch Traces** - Extending lines (topic/name driven)
7. **Circuit Nodes** - Terminal points with ripple animation
8. **Center Element** - Circle (user) or square (org)

### Uniqueness Factors

| Factor | Drives |
|--------|--------|
| Language | Shape type, primary color |
| Repo name hash | Signal dot constellation, branch angles |
| Star count | Glow intensity, bridge style, color brightness |
| Fork count | Pattern density, color saturation |
| Age | Rotation, color warmth |
| Activity | Node ripple speed, hue shift |
| Owner type | Center element shape |
| License | Power rail style |

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
| `RepositoryDNA.test.js` | DNA generation, colors, rendering, caching |

Current: **283 tests passing**

## Completed Improvements

All priority items from AltCoder follow-up review (`AltCoder-follow-up.md`) have been addressed:

### Priority 1 - Accessibility
| Task | Status | Description |
|------|--------|-------------|
| Dark mode contrast | ✅ | Changed `--color-text-secondary` to `#d1d5db` (7.2:1 WCAG AAA) |
| Card focus indicators | ✅ | Added `:focus-visible` outlines with glow effect |

### Priority 2 - Mobile UX
| Task | Status | Description |
|------|--------|-------------|
| Touch targets | ✅ | Theme toggle now 44x44px minimum |
| Small screen support | ✅ | Added `@media (max-width: 359px)` breakpoint |
| iOS Safari fix | ✅ | Added `env(safe-area-inset-top)` handling |

### Priority 3 - Enhancements
| Task | Status | Description |
|------|--------|-------------|
| Mobile navigation | ✅ | Hamburger menu with slide-in panel, focus trap, ARIA |
| DOM query safety | ✅ | `getRequiredElement()` used across all page scripts |

---

*Updated by Claude: December 30, 2025 - Added Bio-Circuit DNA visualization system*
