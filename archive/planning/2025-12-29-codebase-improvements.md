# Codebase Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor GitHub Repository Explorer to eliminate code duplication, add security hardening, implement caching, and improve error handling.

**Architecture:** Extract shared UI rendering logic into a reusable `RepoGrid` module. Add security layer for DOM manipulation. Implement in-memory API response caching with TTL. Add global error boundary for unhandled rejections.

**Tech Stack:** Vanilla JavaScript (ES Modules), Vite, GitHub REST API, localStorage

---

## Priority Order

| Priority | Task | Risk | Effort |
|----------|------|------|--------|
| P1 | XSS Prevention | High | Low |
| P2 | Error Boundary | Medium | Low |
| P3 | API Response Caching | Medium | Medium |
| P4 | Extract RepoGrid Module | Medium | High |
| P5 | Extract Constants | Low | Low |

---

## Task 1: Add DOM Sanitization Utilities

**Files:**
- Modify: `src/js/common.js` (add at end)

**Step 1: Add text sanitization utility**

Add to the end of `src/js/common.js`:

```javascript
/**
 * Safely set text content (XSS-safe)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 */
export const safeText = (element, text) => {
  element.textContent = text ?? '';
};

/**
 * Create element with safe text content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class(es)
 * @param {string} text - Text content
 * @returns {HTMLElement}
 */
export const createElement = (tag, className, text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

/**
 * Escape HTML entities for safe attribute insertion
 * @param {string} str - String to escape
 * @returns {string}
 */
export const escapeHtml = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};
```

**Step 2: Verify no syntax errors**

Run: `npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add src/js/common.js
git commit -m "feat: add DOM sanitization utilities for XSS prevention"
```

---

## Task 2: Add Global Error Boundary

**Files:**
- Create: `src/js/errorBoundary.js`
- Modify: `src/js/common.js` (add import and init call)

**Step 1: Create error boundary module**

Create `src/js/errorBoundary.js`:

```javascript
/**
 * Global Error Boundary
 * Catches unhandled errors and promise rejections
 */

import { showToast } from './common.js';

const ERROR_MESSAGES = {
  network: 'Network error. Please check your connection.',
  rateLimit: 'API rate limit reached. Please wait a moment.',
  notFound: 'Resource not found.',
  forbidden: 'Access denied. Check your token.',
  default: 'Something went wrong. Please try again.'
};

const classifyError = (error) => {
  const message = error?.message?.toLowerCase() || '';
  
  if (message.includes('rate limit')) return 'rateLimit';
  if (message.includes('network') || message.includes('fetch')) return 'network';
  if (message.includes('not found') || message.includes('404')) return 'notFound';
  if (message.includes('forbidden') || message.includes('403')) return 'forbidden';
  
  return 'default';
};

const handleError = (error, context = 'Unknown') => {
  console.error(`[ErrorBoundary] ${context}:`, error);
  
  const errorType = classifyError(error);
  const userMessage = ERROR_MESSAGES[errorType];
  
  showToast(userMessage, 'error');
};

export const initErrorBoundary = () => {
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    event.preventDefault();
    handleError(event.reason, 'Unhandled Promise Rejection');
  });

  // Catch uncaught errors
  window.addEventListener('error', (event) => {
    // Ignore script loading errors (external resources)
    if (event.filename && !event.filename.includes(window.location.origin)) {
      return;
    }
    handleError(event.error, 'Uncaught Error');
  });

  console.log('[ErrorBoundary] Initialized');
};

export { handleError };
```

**Step 2: Verify module syntax**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Integrate into common.js init flow**

Add to the imports section at top of `src/js/common.js`:

```javascript
// Note: This will be imported by page scripts, not common.js itself
// to avoid circular dependency. Document for later integration.
```

**Step 4: Commit**

```bash
git add src/js/errorBoundary.js
git commit -m "feat: add global error boundary for unhandled errors"
```

---

## Task 3: Integrate Error Boundary into Pages

**Files:**
- Modify: `src/js/search.js` (add import + init)
- Modify: `src/js/detail.js` (add import + init)
- Modify: `src/js/trending.js` (add import + init)
- Modify: `src/js/favorites.js` (add import + init)

**Step 1: Update search.js**

Add at top of `src/js/search.js` after existing imports:

```javascript
import { initErrorBoundary } from './errorBoundary.js';
```

Add after `initTheme();`:

```javascript
initErrorBoundary();
```

**Step 2: Update detail.js**

Add at top of `src/js/detail.js` after existing imports:

```javascript
import { initErrorBoundary } from './errorBoundary.js';
```

Add after `initTheme();`:

```javascript
initErrorBoundary();
```

**Step 3: Update trending.js**

Add at top of `src/js/trending.js` after existing imports:

```javascript
import { initErrorBoundary } from './errorBoundary.js';
```

Add after `initTheme();`:

```javascript
initErrorBoundary();
```

**Step 4: Update favorites.js**

Add at top of `src/js/favorites.js` after existing imports:

```javascript
import { initErrorBoundary } from './errorBoundary.js';
```

Add after `initTheme();`:

```javascript
initErrorBoundary();
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/js/search.js src/js/detail.js src/js/trending.js src/js/favorites.js
git commit -m "feat: integrate error boundary into all pages"
```

---

## Task 4: Add API Response Cache

**Files:**
- Modify: `src/js/api.js`

**Step 1: Add cache implementation**

Add after the `const API_BASE = 'https://api.github.com';` line in `src/js/api.js`:

```javascript
// ============================================
// Response Cache
// ============================================

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = new Map();

const getCacheKey = (url) => url;

const getCachedResponse = (url) => {
  const key = getCacheKey(url);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  console.log(`[Cache] HIT: ${url.substring(0, 60)}...`);
  return cached.data;
};

const setCachedResponse = (url, data) => {
  const key = getCacheKey(url);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup: limit cache size to 50 entries
  if (cache.size > 50) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};

/**
 * Clear all cached responses
 */
export const clearCache = () => {
  cache.clear();
  console.log('[Cache] Cleared');
};
```

**Step 2: Integrate cache into fetchWithRetry**

Replace the `fetchWithRetry` function in `src/js/api.js`:

```javascript
const fetchWithRetry = async (url, retries = 3, backoff = 1000, useCache = true) => {
  // Check cache first
  if (useCache) {
    const cached = getCachedResponse(url);
    if (cached) return cached;
  }

  try {
    const response = await fetch(url, { headers: getHeaders() });
    
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetTime = response.headers.get('x-ratelimit-reset');
      
      if (remaining === '0') {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        throw new Error(`Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
      }
      
      throw new Error('Forbidden: Check your access token');
    }
    
    if (response.status === 404) {
      throw new Error('Resource not found');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = {
      data: await response.json(),
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };

    // Cache successful responses
    if (useCache) {
      setCachedResponse(url, result);
    }

    return result;
  } catch (error) {
    if (retries > 0 && !error.message.includes('Rate limit')) {
      const jitter = Math.random() * 100;
      await sleep(backoff + jitter);
      return fetchWithRetry(url, retries - 1, backoff * 2, useCache);
    }
    throw error;
  }
};
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Manual test**

Run: `npm run dev`
- Search for "react"
- Search for "react" again
- Check console for "[Cache] HIT" message

**Step 5: Commit**

```bash
git add src/js/api.js
git commit -m "feat: add 5-minute in-memory API response cache"
```

---

## Task 5: Extract Constants Module

**Files:**
- Create: `src/js/constants.js`
- Modify: `src/js/api.js` (import constants)
- Modify: `src/js/common.js` (import constants)

**Step 1: Create constants module**

Create `src/js/constants.js`:

```javascript
/**
 * Application Constants
 * Centralized configuration values
 */

// API Configuration
export const API_BASE = 'https://api.github.com';
export const API_VERSION = '2022-11-28';

// Cache Configuration
export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const CACHE_MAX_ENTRIES = 50;

// Pagination
export const DEFAULT_PER_PAGE = 30;
export const MAX_SEARCH_PAGES = 34; // GitHub limits search to ~1000 results (34 pages * 30)
export const MAX_SEARCH_RESULTS = 1000;

// Storage Keys
export const STORAGE_VERSION = '1.0';
export const STORAGE_KEYS = {
  FAVORITES: 'gh-explorer-favorites',
  THEME: 'gh-explorer-theme',
  TOKEN: 'gh-token'
};

// Debounce Timing
export const DEBOUNCE_SEARCH_MS = 500;
export const DEBOUNCE_FILTER_MS = 300;

// Trending Configuration
export const TRENDING_DAYS_BACK = 7;

// Toast Configuration
export const TOAST_DURATION_MS = 4000;
export const TOAST_FADE_MS = 300;
```

**Step 2: Update api.js to use constants**

Replace the top of `src/js/api.js`:

```javascript
import { API_BASE, API_VERSION, CACHE_TTL_MS, CACHE_MAX_ENTRIES, TRENDING_DAYS_BACK } from './constants.js';

const getHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION
  };
  
  const token = localStorage.getItem('gh-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================
// Response Cache
// ============================================

const cache = new Map();

const getCacheKey = (url) => url;

const getCachedResponse = (url) => {
  const key = getCacheKey(url);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  const isExpired = Date.now() - cached.timestamp > CACHE_TTL_MS;
  if (isExpired) {
    cache.delete(key);
    return null;
  }
  
  console.log(`[Cache] HIT: ${url.substring(0, 60)}...`);
  return cached.data;
};

const setCachedResponse = (url, data) => {
  const key = getCacheKey(url);
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  
  // Cleanup: limit cache size
  if (cache.size > CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};
```

**Step 3: Update getTrendingRepositories to use constant**

In `src/js/api.js`, update the `getTrendingRepositories` function:

```javascript
export const getTrendingRepositories = async (options = {}) => {
  const {
    language = '',
    page = 1,
    perPage = 30
  } = options;
  
  const date = new Date();
  date.setDate(date.getDate() - TRENDING_DAYS_BACK);
  const dateStr = date.toISOString().split('T')[0];
  
  let q = `created:>${dateStr}`;
  if (language) q += `+language:${encodeURIComponent(language)}`;
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};
```

**Step 4: Update common.js to use constants**

At the top of `src/js/common.js`, replace the constant declarations:

```javascript
import { STORAGE_VERSION, STORAGE_KEYS, TOAST_DURATION_MS, TOAST_FADE_MS } from './constants.js';

const FAVORITES_KEY = STORAGE_KEYS.FAVORITES;
const THEME_KEY = STORAGE_KEYS.THEME;
const TOKEN_KEY = STORAGE_KEYS.TOKEN;
```

Update `showToast` function to use constants:

```javascript
export const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), TOAST_FADE_MS);
  }, TOAST_DURATION_MS);
};
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/js/constants.js src/js/api.js src/js/common.js
git commit -m "refactor: extract configuration constants to dedicated module"
```

---

## Task 6: Create RepoGrid Component Module

**Files:**
- Create: `src/js/components/RepoGrid.js`

**Step 1: Create components directory and RepoGrid module**

Create `src/js/components/RepoGrid.js`:

```javascript
/**
 * RepoGrid Component
 * Shared repository grid rendering logic
 */

import { Storage, formatNumber, formatDate, getLanguageColor, showToast, Icons, escapeHtml } from '../common.js';
import { MAX_SEARCH_PAGES, DEFAULT_PER_PAGE } from '../constants.js';

/**
 * Create a repository card element
 * @param {Object} repo - Repository data from GitHub API
 * @param {Object} options - Rendering options
 * @param {string} options.dateField - Which date field to display ('updated_at' | 'created_at' | 'addedAt')
 * @param {string} options.datePrefix - Prefix for date display ('Updated' | 'Created' | 'Added')
 * @param {boolean} options.showRemoveOnly - Only show remove action (for favorites page)
 * @returns {HTMLElement}
 */
export const createRepoCard = (repo, options = {}) => {
  const {
    dateField = 'updated_at',
    datePrefix = 'Updated',
    showRemoveOnly = false
  } = options;

  const isFavorite = Storage.isFavorite(repo.id);
  const card = document.createElement('article');
  card.className = 'repo-card';
  card.dataset.repoId = repo.id;

  // Escape potentially dangerous content
  const safeFullName = escapeHtml(repo.full_name);
  const safeDescription = escapeHtml(repo.description) || 'No description available';

  // Build repo data for favorite button (escaped for attribute)
  const repoData = JSON.stringify({
    id: repo.id,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    updated_at: repo.updated_at
  }).replace(/'/g, "&#39;");

  // Determine date value
  let dateValue;
  if (dateField === 'addedAt' && repo.addedAt) {
    dateValue = new Date(repo.addedAt).toISOString();
  } else {
    dateValue = repo[dateField];
  }

  // Build favorite button based on mode
  const favoriteButton = showRemoveOnly
    ? `<button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${repo.id}">
        ${Icons.star}
      </button>`
    : `<button class="repo-card__favorite ${isFavorite ? 'active' : ''}" 
        aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites" 
        data-repo='${repoData}'>
        ${isFavorite ? Icons.star : Icons.starOutline}
      </button>`;

  card.innerHTML = `
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="repo-card__name">${safeFullName}</a>
      ${favoriteButton}
    </header>
    <p class="repo-card__description">${safeDescription}</p>
    <footer class="repo-card__footer">
      ${repo.language ? `
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${getLanguageColor(repo.language)}"></span>
          ${escapeHtml(repo.language)}
        </span>
      ` : ''}
      <span class="repo-card__stat">
        ${Icons.star}
        ${formatNumber(repo.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${Icons.fork}
        ${formatNumber(repo.forks_count)}
      </span>
      <span class="repo-card__updated">${datePrefix} ${formatDate(dateValue)}</span>
    </footer>
  `;

  return card;
};

/**
 * Render repository cards into a container
 * @param {HTMLElement} container - Container element
 * @param {Array} repos - Array of repository objects
 * @param {Object} options - Options passed to createRepoCard
 */
export const renderRepoGrid = (container, repos, options = {}) => {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  repos.forEach(repo => {
    fragment.appendChild(createRepoCard(repo, options));
  });

  container.appendChild(fragment);
};

/**
 * Render pagination controls
 * @param {HTMLElement} container - Pagination container
 * @param {number} currentPage - Current page number
 * @param {number} totalResults - Total number of results
 * @param {number} perPage - Results per page
 */
export const renderPagination = (container, currentPage, totalResults, perPage = DEFAULT_PER_PAGE) => {
  const totalPages = Math.min(Math.ceil(totalResults / perPage), MAX_SEARCH_PAGES);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Prev</button>`;

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button class="pagination__btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="pagination__ellipsis">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination__ellipsis">...</span>`;
    html += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  // Next button
  html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next</button>`;

  container.innerHTML = html;
};

/**
 * Handle favorite button click (toggle mode)
 * @param {Event} e - Click event
 * @param {Function} onUpdate - Callback after state change
 */
export const handleFavoriteToggle = (e, onUpdate) => {
  const btn = e.target.closest('.repo-card__favorite');
  if (!btn) return;

  const repoData = JSON.parse(btn.dataset.repo);
  const isFavorite = Storage.isFavorite(repoData.id);

  if (isFavorite) {
    Storage.removeFavorite(repoData.id);
    btn.classList.remove('active');
    btn.innerHTML = Icons.starOutline;
    showToast('Removed from favorites', 'info');
  } else {
    Storage.addFavorite(repoData);
    btn.classList.add('active');
    btn.innerHTML = Icons.star;
    showToast('Added to favorites', 'success');
  }

  if (onUpdate) onUpdate(repoData, !isFavorite);
};

/**
 * Handle favorite button click (remove only mode - for favorites page)
 * @param {Event} e - Click event
 * @param {Function} onRemove - Callback after removal
 */
export const handleFavoriteRemove = (e, onRemove) => {
  const btn = e.target.closest('.repo-card__favorite');
  if (!btn) return;

  const repoId = parseInt(btn.dataset.id);
  Storage.removeFavorite(repoId);
  showToast('Removed from favorites', 'info');

  if (onRemove) onRemove(repoId);
};

/**
 * Handle pagination button click
 * @param {Event} e - Click event
 * @param {Function} onPageChange - Callback with new page number
 */
export const handlePaginationClick = (e, onPageChange) => {
  const btn = e.target.closest('.pagination__btn');
  if (!btn || btn.disabled || !btn.dataset.page) return;

  const page = parseInt(btn.dataset.page);
  onPageChange(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

**Step 2: Create components directory**

Run: `mkdir -p src/js/components`

**Step 3: Verify module syntax**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/js/components/RepoGrid.js
git commit -m "feat: create RepoGrid component module with shared rendering logic"
```

---

## Task 7: Refactor search.js to Use RepoGrid

**Files:**
- Modify: `src/js/search.js`

**Step 1: Update imports**

Replace the imports at the top of `src/js/search.js`:

```javascript
import { searchRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber,
  getUrlParam,
  setUrlParams,
  updateRateLimitDisplay
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  renderPagination, 
  handleFavoriteToggle, 
  handlePaginationClick 
} from './components/RepoGrid.js';

initTheme();
initErrorBoundary();
```

**Step 2: Remove duplicate functions**

Delete the following functions from `src/js/search.js`:
- `createRepoCard` (lines ~45-88)
- `renderResults` (lines ~90-99)
- `renderPagination` (lines ~101-132)

**Step 3: Update performSearch function**

Replace the `renderResults` and `renderPagination` calls in `performSearch`:

```javascript
const performSearch = async (page = 1) => {
  const query = searchInput.value.trim();
  if (!query) {
    showState('empty');
    return;
  }
  
  currentQuery = query;
  currentPage = page;
  
  setUrlParams({
    q: query,
    lang: languageFilter.value,
    stars: starsFilter.value,
    sort: sortFilter.value,
    page: page > 1 ? page : null
  });
  
  showState('loading');
  
  try {
    const result = await searchRepositories(query, {
      language: languageFilter.value,
      minStars: parseInt(starsFilter.value) || 0,
      sort: sortFilter.value,
      page: page
    });
    
    totalResults = result.data.total_count;
    resultsCount.innerHTML = `<strong>${formatNumber(totalResults)}</strong> repositories found`;
    
    // Use shared components
    renderRepoGrid(repoGrid, result.data.items, { dateField: 'updated_at', datePrefix: 'Updated' });
    renderPagination(pagination, currentPage, totalResults);
    showState('results');
    
    if (result.rateLimit) {
      updateRateLimitDisplay(result.rateLimit);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    showState('error');
  }
};
```

**Step 4: Update event handlers**

Replace the `handleFavoriteClick` function and event listener:

```javascript
// Remove the old handleFavoriteClick function

// Update event listener (find and replace)
repoGrid.addEventListener('click', (e) => handleFavoriteToggle(e));
pagination.addEventListener('click', (e) => handlePaginationClick(e, performSearch));
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Manual test**

Run: `npm run dev`
- Search for "javascript"
- Verify cards render correctly
- Verify pagination works
- Verify favorites toggle works

**Step 7: Commit**

```bash
git add src/js/search.js
git commit -m "refactor: migrate search.js to use shared RepoGrid component"
```

---

## Task 8: Refactor trending.js to Use RepoGrid

**Files:**
- Modify: `src/js/trending.js`

**Step 1: Update imports**

Replace imports at the top of `src/js/trending.js`:

```javascript
import { getTrendingRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  formatNumber,
  updateRateLimitDisplay
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  renderPagination, 
  handleFavoriteToggle, 
  handlePaginationClick 
} from './components/RepoGrid.js';
import { MAX_SEARCH_RESULTS } from './constants.js';

initTheme();
initErrorBoundary();
```

**Step 2: Remove duplicate functions**

Delete from `src/js/trending.js`:
- `createRepoCard` (lines ~30-73)
- `renderResults` (lines ~75-84)
- `renderPagination` (lines ~86-117)
- `handleFavoriteClick` (lines ~163-181)

**Step 3: Update loadTrending function**

```javascript
const loadTrending = async (page = 1) => {
  currentPage = page;
  showState('loading');
  
  try {
    const result = await getTrendingRepositories({
      language: languageFilter.value,
      page: page
    });
    
    totalResults = Math.min(result.data.total_count, MAX_SEARCH_RESULTS);
    resultsCount.innerHTML = `<strong>${formatNumber(totalResults)}</strong> trending repositories this week`;
    
    // Use shared components
    renderRepoGrid(repoGrid, result.data.items, { dateField: 'created_at', datePrefix: 'Created' });
    renderPagination(pagination, currentPage, totalResults);
    showState('results');
    
    if (result.rateLimit) {
      updateRateLimitDisplay(result.rateLimit);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    showState('error');
  }
};
```

**Step 4: Update event listeners**

Replace the event listeners at bottom:

```javascript
languageFilter.addEventListener('change', () => loadTrending(1));
repoGrid.addEventListener('click', (e) => handleFavoriteToggle(e));
pagination.addEventListener('click', (e) => handlePaginationClick(e, loadTrending));
retryBtn?.addEventListener('click', () => loadTrending(currentPage));
themeToggle.addEventListener('click', toggleTheme);

loadTrending();
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/js/trending.js
git commit -m "refactor: migrate trending.js to use shared RepoGrid component"
```

---

## Task 9: Refactor favorites.js to Use RepoGrid

**Files:**
- Modify: `src/js/favorites.js`

**Step 1: Update imports**

Replace imports at top of `src/js/favorites.js`:

```javascript
import { 
  initTheme, 
  toggleTheme, 
  Storage
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  handleFavoriteRemove 
} from './components/RepoGrid.js';

initTheme();
initErrorBoundary();
```

**Step 2: Remove duplicate function**

Delete `createRepoCard` function from `src/js/favorites.js`.

**Step 3: Update renderFavorites function**

```javascript
const renderFavorites = () => {
  const favorites = Storage.getFavorites();
  
  if (favorites.length === 0) {
    favoritesSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  favoritesSection.classList.remove('hidden');
  
  resultsCount.innerHTML = `<strong>${favorites.length}</strong> saved ${favorites.length === 1 ? 'repository' : 'repositories'}`;
  
  // Sort by most recently added
  const sortedFavorites = favorites.sort((a, b) => b.addedAt - a.addedAt);
  
  // Use shared component with remove-only mode
  renderRepoGrid(repoGrid, sortedFavorites, { 
    dateField: 'addedAt', 
    datePrefix: 'Added',
    showRemoveOnly: true 
  });
};
```

**Step 4: Update event listener**

```javascript
repoGrid.addEventListener('click', (e) => handleFavoriteRemove(e, () => renderFavorites()));
themeToggle.addEventListener('click', toggleTheme);

renderFavorites();
```

**Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/js/favorites.js
git commit -m "refactor: migrate favorites.js to use shared RepoGrid component"
```

---

## Task 10: Add Pagination Ellipsis Styling

**Files:**
- Modify: `src/css/components.css`

**Step 1: Add ellipsis style**

Add after the `.pagination__btn:disabled` rule in `src/css/components.css`:

```css
.pagination__ellipsis {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  height: 40px;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
```

**Step 2: Commit**

```bash
git add src/css/components.css
git commit -m "style: add pagination ellipsis styling"
```

---

## Task 11: Final Verification

**Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 2: Start dev server**

Run: `npm run dev`

**Step 3: Test all pages**

1. **Search Page (index.html)**
   - [ ] Search works
   - [ ] Filters work
   - [ ] Pagination works
   - [ ] Favorite toggle works
   - [ ] Theme toggle works

2. **Trending Page (trending.html)**
   - [ ] Loads trending repos
   - [ ] Language filter works
   - [ ] Pagination works
   - [ ] Favorite toggle works

3. **Favorites Page (favorites.html)**
   - [ ] Shows saved favorites
   - [ ] Remove works
   - [ ] Empty state shows when no favorites

4. **Detail Page (detail.html)**
   - [ ] Loads repo details
   - [ ] README displays
   - [ ] Languages chart renders
   - [ ] Activity timeline shows
   - [ ] Favorite toggle works

**Step 4: Check console for errors**

Expected: No JavaScript errors, only [Cache] HIT messages for repeated requests

**Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete codebase improvements refactoring"
```

---

## Summary of Changes

| Task | Files Changed | Type |
|------|---------------|------|
| DOM Sanitization | common.js | Security |
| Error Boundary | errorBoundary.js, all page scripts | Reliability |
| API Caching | api.js | Performance |
| Constants Module | constants.js, api.js, common.js | Maintainability |
| RepoGrid Component | components/RepoGrid.js | DRY |
| Refactor search.js | search.js | DRY |
| Refactor trending.js | trending.js | DRY |
| Refactor favorites.js | favorites.js | DRY |
| Pagination Styling | components.css | UI Polish |

**Lines of Code Impact:**
- Added: ~350 lines (new modules)
- Removed: ~400 lines (duplicated code)
- Net: -50 lines with better organization

---

*Plan created: December 29, 2025*
