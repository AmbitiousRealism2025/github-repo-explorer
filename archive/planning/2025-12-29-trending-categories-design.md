# Trending Categories Feature Design

**Date:** 2025-12-29  
**Status:** Approved

---

## Overview

Add a "Category" dropdown filter to the Trending page, allowing users to filter repositories by use-case type. Works in combination with the existing Language filter using AND logic, with smart empty state handling when no results match.

## Categories

| Key | Label |
|-----|-------|
| `all` | All Categories (default) |
| `templates` | Starter Templates |
| `cli` | CLI Tools |
| `libraries` | Libraries |
| `frameworks` | Frameworks |
| `devtools` | Developer Tools |
| `learning` | Learning Resources |
| `apis` | APIs & Services |

## User Flow

1. User lands on `/trending.html` — sees "All Categories" + "All Languages" (current behavior)
2. User selects "CLI Tools" from Category dropdown — grid filters to CLI-related trending repos
3. User additionally selects "Rust" from Language dropdown — shows trending Rust CLI tools
4. If combination yields zero results — smart empty state appears with suggestion buttons
5. Clicking suggestion button updates the relevant filter and reloads

Filter state resets on page refresh (no URL params or localStorage persistence).

---

## API Integration

### Search Strategy

Each category maps to a search query combining GitHub topics and keywords. Detection uses topic tags where available, falls back to keyword search in name/description.

### Query Construction

For "CLI Tools" category:
```
created:>{7-days-ago} (topic:cli OR topic:command-line OR topic:terminal OR cli in:name,description)
```

Combined with language:
```
created:>{7-days-ago} language:rust (topic:cli OR topic:command-line OR topic:terminal OR cli in:name,description)
```

### Category Mappings

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
    keywords: ['library', 'lib', 'package', 'sdk', '-js', '-py']
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
    topics: ['api', 'rest-api', 'graphql', 'api-wrapper', 'sdk'],
    keywords: ['api', 'client', 'wrapper', 'sdk', 'integration']
  }
};
```

### API Function Change

```javascript
// Before
getTrendingRepositories({ language, page })

// After  
getTrendingRepositories({ language, category, page })
```

Existing 5-minute cache keys on full query string — no cache logic changes needed.

---

## UI Components

### Filter Bar Layout

Two dropdowns side-by-side, Category first:

```
┌─────────────────────────────────────────────────────┐
│  Category: [All Categories ▾]   Language: [All ▾]   │
└─────────────────────────────────────────────────────┘
```

On mobile (<640px), dropdowns stack vertically, full-width.

### HTML Structure

```html
<div class="filters-bar mb-lg">
  <div class="filter-group">
    <label class="filter-label" for="category-filter">Category</label>
    <select class="input select" id="category-filter">
      <!-- Generated from TRENDING_CATEGORIES -->
    </select>
  </div>
  <div class="filter-group">
    <label class="filter-label" for="language-filter">Language</label>
    <select class="input select" id="language-filter">
      <!-- Existing options -->
    </select>
  </div>
</div>
```

Category dropdown populated from `TRENDING_CATEGORIES` config via JavaScript.

### Results Count

Dynamic message based on active filters:

- Default: "**1,234** trending repositories this week"
- Filtered: "**56** trending **CLI Tools** in **Rust** this week"

---

## Smart Empty State

### Trigger

`result.data.items.length === 0` AND at least one filter is active.

### UI Layout

```
┌─────────────────────────────────────────────────────┐
│                      (icon)                         │
│                                                     │
│     No trending Rust CLI Tools this week            │
│                                                     │
│   Try broadening your search:                       │
│                                                     │
│   [ Show all CLI Tools ]  [ Show all Rust repos ]   │
└─────────────────────────────────────────────────────┘
```

### Button Logic

| Active Filters | Buttons Shown |
|----------------|---------------|
| Category only | "Show all trending" (resets category) |
| Language only | "Show all trending" (resets language) |
| Both active | Two buttons — one resets category, one resets language |

### Message Generation

```javascript
// "No trending {Language} {Category} this week"
// Examples:
// "No trending Rust CLI Tools this week"
// "No trending CLI Tools this week" (language=all)
// "No trending Rust repos this week" (category=all)
```

### Button Actions

Update the relevant `<select>` value and call `loadTrending(1)`. No page reload.

---

## File Changes

| File | Changes |
|------|---------|
| `src/js/constants.js` | Add `TRENDING_CATEGORIES` config object |
| `src/js/api.js` | Update `getTrendingRepositories()` to accept `category` param and build query |
| `src/js/trending.js` | Add category dropdown handler, update `loadTrending()`, add smart empty state logic |
| `trending.html` | Add category dropdown markup, add empty state container with suggestion buttons |
| `src/css/components.css` | Minor tweaks for two-dropdown layout if needed |

## No Changes Needed

- `RepoGrid.js` — renders whatever results come back
- `common.js` — no new utilities required
- Cache logic — already keys on full URL

## Implementation Order

1. Add `TRENDING_CATEGORIES` to constants
2. Update `api.js` query builder
3. Add HTML dropdown + empty state markup
4. Wire up `trending.js` event handlers and state logic
5. Test edge cases (empty results, filter combos)

## Estimated Scope

~150-200 lines of code across 4-5 files. No new dependencies. Fully client-side.
