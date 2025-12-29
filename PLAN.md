# GitHub Repository Explorer - Implementation Plan

## Executive Summary

A professional GitHub Repository Explorer web application built with vanilla JavaScript and Vite. Features repository search, trending repos, favorites system, and dark/light theme support.

---

## Project Decisions

| Decision | Approach |
|----------|----------|
| **Structure** | Multi-page (index.html, detail.html, favorites.html, trending.html) |
| **README** | Display raw markdown with monospace styling |
| **Trending** | `created:>{7-days-ago}&sort=stars` query |
| **Auth** | Optional token input stored in localStorage |
| **Build tools** | Vite for dev server, HMR, and production build |

---

## File Structure

```
github-repo-explorer/
├── package.json
├── vite.config.js          # Multi-page config
├── index.html              # Search & results (entry)
├── detail.html             # Repository detail view
├── favorites.html          # Saved favorites page
├── trending.html           # Trending repos page
├── src/
│   ├── css/
│   │   ├── main.css        # Core styles, layouts
│   │   ├── components.css  # Cards, buttons, inputs
│   │   └── theme.css       # CSS variables, dark/light
│   ├── js/
│   │   ├── common.js       # Shared utilities, theme, storage
│   │   ├── api.js          # GitHub API wrapper
│   │   ├── search.js       # Search page logic
│   │   ├── detail.js       # Detail page logic
│   │   ├── favorites.js    # Favorites page logic
│   │   └── trending.js     # Trending page logic
│   └── assets/
│       └── icons.svg       # SVG sprite for icons
└── dist/                   # Production build output
```

---

## GitHub API Integration

### Endpoints Required

| Feature | Endpoint | Notes |
|---------|----------|-------|
| **Search repos** | `GET /search/repositories?q={query}` | Supports `language:`, `stars:>N`, sort by stars/forks/updated |
| **Trending** | `GET /search/repositories?q=created:>{7-days-ago}&sort=stars` | Repos created in last 7 days, sorted by stars |
| **Repo details** | `GET /repos/{owner}/{repo}` | Full stats: stars, forks, watchers, issues |
| **README** | `GET /repos/{owner}/{repo}/readme` | Returns base64-encoded content |
| **Languages** | `GET /repos/{owner}/{repo}/languages` | Returns `{ "JavaScript": 12345, "CSS": 2000 }` in bytes |
| **Activity** | `GET /repos/{owner}/{repo}/events` | Push, PR, Issue events with timestamps |

### Rate Limits

| Request Type | Limit | Reset |
|--------------|-------|-------|
| **Unauthenticated Core** | 60/hour | Per IP |
| **Unauthenticated Search** | 10/minute | Very restrictive! |
| **Authenticated Core** | 5,000/hour | Per token |
| **Authenticated Search** | 30/minute | Per token |

### API Wrapper Pattern

```javascript
const API_BASE = 'https://api.github.com';

const fetchWithRetry = async (url, retries = 3, backoff = 1000) => {
  const token = localStorage.getItem('gh-token');
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  try {
    const response = await fetch(url, { headers });
    
    if (response.status === 403) {
      const resetTime = response.headers.get('x-ratelimit-reset');
      throw new Error(`Rate limited. Resets at ${new Date(resetTime * 1000)}`);
    }
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, backoff + Math.random() * 100));
      return fetchWithRetry(url, retries - 1, backoff * 2);
    }
    throw error;
  }
};
```

---

## Theme System (CSS Variables)

```css
:root {
  /* Light theme (default) */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f6f8fa;
  --color-bg-tertiary: #ebeef1;
  --color-text-primary: #1f2328;
  --color-text-secondary: #656d76;
  --color-text-muted: #8b949e;
  --color-border: #d0d7de;
  --color-accent: #0969da;
  --color-accent-hover: #0860ca;
  --color-success: #1a7f37;
  --color-warning: #9a6700;
  --color-star: #e3b341;
  --shadow-sm: 0 1px 2px rgba(31, 35, 40, 0.06);
  --shadow-md: 0 3px 6px rgba(31, 35, 40, 0.12);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}

[data-theme="dark"] {
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6e7681;
  --color-border: #30363d;
  --color-accent: #58a6ff;
  --color-accent-hover: #79b8ff;
}
```

---

## Responsive Grid Layout

```css
.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 16px;
}

@media (max-width: 640px) {
  .repo-grid { grid-template-columns: 1fr; }
}

@media (min-width: 641px) and (max-width: 1024px) {
  .repo-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1025px) {
  .repo-grid { grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); }
}
```

---

## Repository Card Design

```html
<article class="repo-card" data-repo-id="12345">
  <header class="repo-card__header">
    <a href="detail.html?repo=owner/name" class="repo-card__name">owner/repo-name</a>
    <button class="repo-card__favorite" aria-label="Add to favorites">
      <!-- Star icon -->
    </button>
  </header>
  <p class="repo-card__description">Repository description here...</p>
  <footer class="repo-card__footer">
    <span class="repo-card__language">
      <span class="language-dot" style="--lang-color: #f1e05a"></span>
      JavaScript
    </span>
    <span class="repo-card__stat">Stars: 1.2k</span>
    <span class="repo-card__stat">Forks: 234</span>
    <span class="repo-card__updated">Updated 2 days ago</span>
  </footer>
</article>
```

---

## Language Distribution Chart (SVG Donut)

```javascript
const createDonutChart = (languages, containerEl) => {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  
  let offset = 0;
  const segments = Object.entries(languages).map(([lang, bytes]) => {
    const percentage = bytes / total;
    const dashLength = circumference * percentage;
    const segment = { lang, percentage, offset, dashLength };
    offset += dashLength;
    return segment;
  });
  
  const svg = `
    <svg viewBox="0 0 120 120" class="language-chart">
      <g transform="rotate(-90 60 60)">
        ${segments.map(s => `
          <circle
            cx="60" cy="60" r="${radius}"
            fill="none"
            stroke="${getLanguageColor(s.lang)}"
            stroke-width="20"
            stroke-dasharray="${s.dashLength} ${circumference - s.dashLength}"
            stroke-dashoffset="-${s.offset}"
            class="chart-segment"
          />
        `).join('')}
      </g>
    </svg>
  `;
  
  containerEl.innerHTML = svg;
};
```

---

## localStorage Favorites & Settings

```javascript
const Storage = {
  VERSION: '1.0',
  
  // Favorites
  getFavorites() {
    try {
      const raw = localStorage.getItem('gh-explorer-favorites');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.version === this.VERSION ? parsed.data : [];
    } catch { return []; }
  },
  
  saveFavorites(favorites) {
    localStorage.setItem('gh-explorer-favorites', JSON.stringify({
      version: this.VERSION,
      data: favorites,
      timestamp: Date.now()
    }));
  },
  
  // Theme
  getTheme() {
    return localStorage.getItem('gh-explorer-theme') || 'light';
  },
  
  setTheme(theme) {
    localStorage.setItem('gh-explorer-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },
  
  // GitHub Token (optional)
  getToken() {
    return localStorage.getItem('gh-token') || null;
  },
  
  setToken(token) {
    if (token) localStorage.setItem('gh-token', token);
    else localStorage.removeItem('gh-token');
  }
};
```

---

## Implementation Phases

### Phase 1: Foundation
- [x] Create implementation plan
- [ ] Initialize Vite project
- [ ] Configure multi-page build
- [ ] Set up CSS theme system
- [ ] Build GitHub API wrapper with retry logic
- [ ] Create shared utilities (storage, formatters)

### Phase 2: Search Page (index.html)
- [ ] Build search bar with debouncing
- [ ] Implement filter controls (language, stars, sort)
- [ ] Create repository card component
- [ ] Build responsive grid layout
- [ ] Add loading states and error handling
- [ ] Implement pagination

### Phase 3: Detail Page (detail.html)
- [ ] Display full repository stats
- [ ] Fetch and display README (raw markdown)
- [ ] Show language distribution chart
- [ ] Display recent activity timeline
- [ ] Add "View on GitHub" button
- [ ] Implement favorite toggle

### Phase 4: Trending Page (trending.html)
- [ ] Fetch repos created in last 7 days
- [ ] Display trending grid
- [ ] Add language filter
- [ ] Show star counts prominently

### Phase 5: Favorites Page (favorites.html)
- [ ] Load favorites from localStorage
- [ ] Display favorites grid
- [ ] Implement remove from favorites
- [ ] Handle empty state

### Phase 6: Polish
- [ ] Dark/light theme toggle with persistence
- [ ] Smooth animations and transitions
- [ ] Settings modal (GitHub token input)
- [ ] Rate limit display in footer
- [ ] Full responsive testing
- [ ] Performance optimization

---

## Core Features Checklist

- [ ] Search repositories by keyword
- [ ] Display results in responsive grid/card layout
- [ ] Show: name, description, stars, forks, language, last update
- [ ] Click repo card to view detailed stats and README
- [ ] Filter by: language, stars (min/max), sort by stars/forks/updated
- [ ] "View on GitHub" button
- [ ] Trending repositories section
- [ ] Recent activity timeline for selected repo
- [ ] Language distribution chart/visualization
- [ ] Favorites system (localStorage)
- [ ] Dark/light theme toggle
- [ ] Responsive design (mobile, tablet, desktop)

---

## Technical Notes

### Rate Limiting Strategy
- Cache responses for 5 minutes
- Debounce search input (300ms)
- Display rate limit status in footer
- Support optional GitHub token for higher limits

### README Rendering
- GitHub returns README as base64 encoded
- Decode with `atob(content)`
- Display raw markdown with monospace font styling

### Performance
- Use DocumentFragment for batch DOM updates
- Event delegation on parent containers
- Lazy load repo details on click

---

*Generated: December 29, 2025*
