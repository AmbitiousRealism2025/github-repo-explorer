# Trending Categories Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add use-case category filtering to the Trending page with smart empty states.

**Architecture:** Category dropdown filter alongside existing language filter. Categories map to GitHub topic tags + keyword searches combined with OR logic. Filters combine with AND logic. Smart empty states suggest filter removal when zero results.

**Tech Stack:** Vanilla JavaScript, Vite, Vitest for testing.

---

## Task 1: Add TRENDING_CATEGORIES to Constants

**Files:**
- Modify: `src/js/constants.js`
- Modify: `src/js/__tests__/constants.test.js`

**Step 1: Write the failing test**

Add to `src/js/__tests__/constants.test.js`:

```javascript
describe('Trending Categories', () => {
  it('should have TRENDING_CATEGORIES defined', () => {
    expect(TRENDING_CATEGORIES).toBeDefined();
  });

  it('should have "all" category as first entry', () => {
    expect(TRENDING_CATEGORIES.all).toBeDefined();
    expect(TRENDING_CATEGORIES.all.label).toBe('All Categories');
    expect(TRENDING_CATEGORIES.all.topics).toEqual([]);
    expect(TRENDING_CATEGORIES.all.keywords).toEqual([]);
  });

  it('should have 8 categories total', () => {
    expect(Object.keys(TRENDING_CATEGORIES)).toHaveLength(8);
  });

  it('should have required properties for each category', () => {
    Object.entries(TRENDING_CATEGORIES).forEach(([key, value]) => {
      expect(value).toHaveProperty('label');
      expect(value).toHaveProperty('topics');
      expect(value).toHaveProperty('keywords');
      expect(Array.isArray(value.topics)).toBe(true);
      expect(Array.isArray(value.keywords)).toBe(true);
    });
  });
});
```

Also add `TRENDING_CATEGORIES` to the import statement at the top of the test file.

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/js/__tests__/constants.test.js`

Expected: FAIL with "TRENDING_CATEGORIES is not exported"

**Step 3: Write the implementation**

Add to `src/js/constants.js`:

```javascript
export const TRENDING_CATEGORIES = {
  all: {
    label: 'All Categories',
    topics: [],
    keywords: []
  },
  templates: {
    label: 'Starter Templates',
    topics: ['boilerplate', 'starter', 'template', 'scaffold'],
    keywords: ['starter', 'template', 'boilerplate', 'scaffold', 'kickstart']
  },
  cli: {
    label: 'CLI Tools',
    topics: ['cli', 'command-line', 'terminal'],
    keywords: ['cli', 'command-line', 'terminal tool']
  },
  libraries: {
    label: 'Libraries',
    topics: ['library', 'package', 'module', 'sdk'],
    keywords: ['library', 'lib', 'package', 'sdk']
  },
  frameworks: {
    label: 'Frameworks',
    topics: ['framework'],
    keywords: ['framework']
  },
  devtools: {
    label: 'Developer Tools',
    topics: ['devtools', 'developer-tools', 'linter', 'formatter', 'ide', 'vscode-extension'],
    keywords: ['linter', 'formatter', 'plugin', 'extension', 'devtool']
  },
  learning: {
    label: 'Learning Resources',
    topics: ['awesome', 'awesome-list', 'tutorial', 'learn', 'education'],
    keywords: ['awesome', 'tutorial', 'learn', 'course', 'roadmap', 'cheatsheet']
  },
  apis: {
    label: 'APIs & Services',
    topics: ['api', 'rest-api', 'graphql', 'api-wrapper'],
    keywords: ['api', 'client', 'wrapper', 'integration']
  }
};
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/js/__tests__/constants.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/js/constants.js src/js/__tests__/constants.test.js
git commit -m "feat: add TRENDING_CATEGORIES constant for category filtering"
```

---

## Task 2: Update API to Support Category Filtering

**Files:**
- Modify: `src/js/api.js`
- Modify: `src/js/__tests__/api.test.js`

**Step 1: Write the failing tests**

Add to `src/js/__tests__/api.test.js` inside the `describe('getTrendingRepositories')` block:

```javascript
it('should include category topics in query', async () => {
  const mockData = { items: [], total_count: 0 };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockData),
    headers: { get: () => '59' }
  });

  await getTrendingRepositories({ category: 'cli' });
  const calledUrl = global.fetch.mock.calls[0][0];
  
  // Should include topic:cli OR topic:command-line etc
  expect(calledUrl).toMatch(/topic%3Acli/);
});

it('should include category keywords in query', async () => {
  const mockData = { items: [], total_count: 0 };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockData),
    headers: { get: () => '59' }
  });

  await getTrendingRepositories({ category: 'cli' });
  const calledUrl = global.fetch.mock.calls[0][0];
  
  // Should include keyword search in name/description
  expect(calledUrl).toMatch(/cli.*in%3Aname%2Cdescription/);
});

it('should combine category and language filters', async () => {
  const mockData = { items: [], total_count: 0 };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockData),
    headers: { get: () => '59' }
  });

  await getTrendingRepositories({ category: 'cli', language: 'Rust' });
  const calledUrl = global.fetch.mock.calls[0][0];
  
  expect(calledUrl).toMatch(/language%3ARust/);
  expect(calledUrl).toMatch(/topic%3Acli/);
});

it('should not add category filter for "all" category', async () => {
  const mockData = { items: [], total_count: 0 };
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    json: () => Promise.resolve(mockData),
    headers: { get: () => '59' }
  });

  await getTrendingRepositories({ category: 'all' });
  const calledUrl = global.fetch.mock.calls[0][0];
  
  expect(calledUrl).not.toMatch(/topic%3A/);
});
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/js/__tests__/api.test.js`

Expected: FAIL (category parameter not handled)

**Step 3: Write the implementation**

Update `getTrendingRepositories` in `src/js/api.js`:

```javascript
import { API_BASE, API_VERSION, CACHE_TTL_MS, CACHE_MAX_ENTRIES, TRENDING_DAYS_BACK, TRENDING_CATEGORIES } from './constants.js';

// ... existing code ...

export const getTrendingRepositories = async (options = {}) => {
  const {
    language = '',
    category = 'all',
    page = 1,
    perPage = 30
  } = options;
  
  const date = new Date();
  date.setDate(date.getDate() - TRENDING_DAYS_BACK);
  const dateStr = date.toISOString().split('T')[0];
  
  let q = `created:>${dateStr}`;
  
  if (language) {
    q += ` language:${language}`;
  }
  
  // Add category filter (topics + keywords)
  if (category && category !== 'all') {
    const categoryConfig = TRENDING_CATEGORIES[category];
    if (categoryConfig && (categoryConfig.topics.length > 0 || categoryConfig.keywords.length > 0)) {
      const topicFilters = categoryConfig.topics.map(t => `topic:${t}`);
      const keywordFilters = categoryConfig.keywords.map(k => `${k} in:name,description`);
      const allFilters = [...topicFilters, ...keywordFilters];
      
      if (allFilters.length > 0) {
        q += ` (${allFilters.join(' OR ')})`;
      }
    }
  }
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/js/__tests__/api.test.js`

Expected: PASS

**Step 5: Commit**

```bash
git add src/js/api.js src/js/__tests__/api.test.js
git commit -m "feat: add category filter support to getTrendingRepositories"
```

---

## Task 3: Update Trending HTML with Category Dropdown and Empty State

**Files:**
- Modify: `trending.html`

**Step 1: Add category dropdown to filters bar**

Replace the existing `.filters-bar` section in `trending.html`:

```html
<div class="filters-bar mb-lg">
  <div class="filter-group">
    <label class="filter-label" for="category-filter">Category</label>
    <select class="input select" id="category-filter">
      <!-- Populated by JavaScript from TRENDING_CATEGORIES -->
    </select>
  </div>
  <div class="filter-group">
    <label class="filter-label" for="language-filter">Language</label>
    <select class="input select" id="language-filter">
      <option value="">All Languages</option>
      <option value="javascript">JavaScript</option>
      <option value="typescript">TypeScript</option>
      <option value="python">Python</option>
      <option value="java">Java</option>
      <option value="go">Go</option>
      <option value="rust">Rust</option>
      <option value="ruby">Ruby</option>
      <option value="php">PHP</option>
      <option value="c++">C++</option>
      <option value="c#">C#</option>
      <option value="swift">Swift</option>
      <option value="kotlin">Kotlin</option>
    </select>
  </div>
</div>
```

**Step 2: Add smart empty state section**

Add after the `#error-state` section but before the closing `</div>` of `.container`:

```html
<section id="empty-state" class="empty-state hidden">
  <svg class="empty-state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
    <circle cx="11" cy="11" r="8"/>
    <path d="M21 21l-4.35-4.35"/>
  </svg>
  <h2 class="empty-state__title" id="empty-state-title">No results found</h2>
  <p class="empty-state__description">Try broadening your search:</p>
  <div class="empty-state__actions" id="empty-state-actions">
    <!-- Buttons populated by JavaScript -->
  </div>
</section>
```

**Step 3: Verify HTML structure manually**

Open `trending.html` in browser via `npm run dev` and verify:
- Category dropdown appears before Language dropdown
- Empty state section exists (hidden by default)

**Step 4: Commit**

```bash
git add trending.html
git commit -m "feat: add category dropdown and smart empty state markup to trending page"
```

---

## Task 4: Wire Up Trending Page JavaScript

**Files:**
- Modify: `src/js/trending.js`

**Step 1: Update imports and DOM references**

Add to imports at top of `src/js/trending.js`:

```javascript
import { TRENDING_CATEGORIES } from './constants.js';
```

Add new DOM references after existing ones:

```javascript
const categoryFilter = document.getElementById('category-filter');
const emptyState = document.getElementById('empty-state');
const emptyStateTitle = document.getElementById('empty-state-title');
const emptyStateActions = document.getElementById('empty-state-actions');
```

**Step 2: Add category dropdown population function**

Add after the DOM references:

```javascript
const populateCategoryDropdown = () => {
  categoryFilter.innerHTML = Object.entries(TRENDING_CATEGORIES)
    .map(([key, { label }]) => `<option value="${key}">${label}</option>`)
    .join('');
};
```

**Step 3: Update showState function**

Replace the `showState` function:

```javascript
const showState = (state) => {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsSection.classList.add('hidden');
  emptyState.classList.add('hidden');
  
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
    case 'results':
      resultsSection.classList.remove('hidden');
      break;
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
  }
};
```

**Step 4: Add smart empty state rendering function**

Add after `showState`:

```javascript
const renderEmptyState = () => {
  const category = categoryFilter.value;
  const language = languageFilter.value;
  const categoryLabel = TRENDING_CATEGORIES[category]?.label || 'repos';
  const languageLabel = languageFilter.options[languageFilter.selectedIndex]?.text || '';
  
  // Build dynamic title
  let title = 'No trending ';
  if (language && category !== 'all') {
    title += `${languageLabel} ${categoryLabel}`;
  } else if (language) {
    title += `${languageLabel} repos`;
  } else if (category !== 'all') {
    title += categoryLabel;
  } else {
    title += 'repositories';
  }
  title += ' this week';
  
  emptyStateTitle.textContent = title;
  
  // Build action buttons
  const buttons = [];
  
  if (category !== 'all') {
    buttons.push(`<button class="btn btn--secondary" data-action="reset-category">Show all ${language ? languageLabel + ' repos' : 'trending'}</button>`);
  }
  
  if (language) {
    buttons.push(`<button class="btn btn--secondary" data-action="reset-language">Show all ${category !== 'all' ? categoryLabel : 'trending'}</button>`);
  }
  
  emptyStateActions.innerHTML = buttons.join('');
};
```

**Step 5: Update loadTrending function**

Replace the `loadTrending` function:

```javascript
const loadTrending = async (page = 1) => {
  currentPage = page;
  showState('loading');
  
  try {
    const result = await getTrendingRepositories({
      language: languageFilter.value,
      category: categoryFilter.value,
      page: page
    });
    
    // Check for empty results with active filters
    if (result.data.items.length === 0 && (categoryFilter.value !== 'all' || languageFilter.value)) {
      renderEmptyState();
      showState('empty');
      if (result.rateLimit) {
        updateRateLimitDisplay(result.rateLimit);
      }
      return;
    }
    
    totalResults = Math.min(result.data.total_count, MAX_SEARCH_RESULTS);
    
    // Build dynamic results count message
    const categoryLabel = TRENDING_CATEGORIES[categoryFilter.value]?.label;
    const languageLabel = languageFilter.options[languageFilter.selectedIndex]?.text;
    
    let countMessage = `<strong>${formatNumber(totalResults)}</strong> trending`;
    if (categoryFilter.value !== 'all') {
      countMessage += ` <strong>${categoryLabel}</strong>`;
    }
    if (languageFilter.value) {
      countMessage += ` in <strong>${languageLabel}</strong>`;
    }
    countMessage += ' this week';
    
    resultsCount.innerHTML = countMessage;
    
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

**Step 6: Add event listeners**

Update the event listeners section:

```javascript
// Populate category dropdown on load
populateCategoryDropdown();

// Filter change handlers
categoryFilter.addEventListener('change', () => loadTrending(1));
languageFilter.addEventListener('change', () => loadTrending(1));

// Empty state action buttons (event delegation)
emptyStateActions.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (action === 'reset-category') {
    categoryFilter.value = 'all';
    loadTrending(1);
  } else if (action === 'reset-language') {
    languageFilter.value = '';
    loadTrending(1);
  }
});

// Existing event listeners
repoGrid.addEventListener('click', (e) => {
  handleFavoriteToggle(e);
  handleCollectionClick(e);
});
repoGrid.addEventListener('keydown', handleCollectionKeydown);
pagination.addEventListener('click', (e) => handlePaginationClick(e, loadTrending));
retryBtn?.addEventListener('click', () => loadTrending(currentPage));
themeToggle.addEventListener('click', toggleTheme);
initCollectionPickerCloseHandler();

// Initial load
loadTrending();
```

**Step 7: Verify functionality manually**

Run: `npm run dev`

Test:
1. Category dropdown shows all 8 options
2. Selecting "CLI Tools" filters results
3. Combining "CLI Tools" + "Rust" works
4. Empty results show smart suggestions
5. Suggestion buttons reset correct filter

**Step 8: Commit**

```bash
git add src/js/trending.js
git commit -m "feat: implement category filtering with smart empty states on trending page"
```

---

## Task 5: Final Verification and Build Test

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `npm test`

Expected: All tests pass

**Step 2: Run production build**

Run: `npm run build`

Expected: Build completes without errors

**Step 3: Preview production build**

Run: `npm run preview`

Test trending page functionality in production build.

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address any issues found in final verification"
```

---

## Summary

| Task | Files Changed | Est. Time |
|------|---------------|-----------|
| Task 1: Constants | `constants.js`, `constants.test.js` | 5 min |
| Task 2: API | `api.js`, `api.test.js` | 10 min |
| Task 3: HTML | `trending.html` | 5 min |
| Task 4: JavaScript | `trending.js` | 15 min |
| Task 5: Verification | None | 5 min |

**Total estimated time:** 40 minutes
