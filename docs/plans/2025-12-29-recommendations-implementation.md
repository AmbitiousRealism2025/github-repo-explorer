# GitHub Explorer Recommendations - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement UI/UX improvements and new features from claude-recommendations.md, optimized for maximum parallel execution.

**Architecture:** Phased approach where each phase contains independent tasks that can be executed simultaneously by parallel agents. Dependencies flow between phases, not within them.

**Tech Stack:** Vanilla JS (ES6 modules), CSS Custom Properties, GitHub REST API, localStorage

---

## Parallelization Map

```
Phase 0: Foundation (Serial - blocks all others)
    └── CSS Variable Additions

Phase 1: UI/UX Polish (4 parallel tracks)
    ├── Track A: Typography (theme.css)
    ├── Track B: Accessibility (new file)
    ├── Track C: Focus States (components.css)
    └── Track D: Glassmorphism (components.css - different selectors)

Phase 2: Quick Win Features (5 parallel tracks)
    ├── Track A: Clone Commands
    ├── Track B: Local Notes System
    ├── Track C: Commit Heatmap
    ├── Track D: Discovery Stats
    └── Track E: Container Queries

Phase 3: Core Features (3 parallel tracks)
    ├── Track A: Smart Collections
    ├── Track B: Health Score Dashboard
    └── Track C: Repository Comparison Mode
```

---

## Phase 0: Foundation (SERIAL - Must Complete First)

### Task 0.1: Add CSS Variables for New Features

**Files:**
- Modify: `src/css/theme.css:8-93` (add to :root)

**Step 1: Add fluid typography variables**

Add after line 75 (after `--text-3xl`):

```css
  /* Fluid Typography */
  --font-size-base: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  --font-size-display: clamp(2rem, 1.5rem + 2.5vw, 3.5rem);
  --font-size-h1: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
  --font-size-h2: clamp(1.5rem, 1.3rem + 1vw, 2rem);
  --font-size-h3: clamp(1.25rem, 1.15rem + 0.5vw, 1.5rem);
  --content-max-width: 65ch;
```

**Step 2: Add focus ring variables**

Add after shadows section (after line 48):

```css
  /* Focus Ring */
  --focus-ring-color: var(--color-accent);
  --focus-ring-offset: 2px;
  --focus-ring-width: 3px;
```

**Step 3: Add glassmorphism fallback variables**

Add after existing glass variables (after line 92):

```css
  /* Glassmorphism Fallbacks */
  --glass-fallback: rgba(255, 255, 255, 0.85);
```

**Step 4: Add same to dark theme**

In `[data-theme="dark"]` section, add:

```css
  --glass-fallback: rgba(20, 20, 30, 0.9);
```

**Step 5: Verify no syntax errors**

Run: `npm run build`
Expected: Build succeeds

**Step 6: Commit**

```bash
git add src/css/theme.css
git commit -m "feat(css): add foundation variables for UI improvements"
```

---

## Phase 1: UI/UX Polish (PARALLEL - 4 Tracks)

### Task 1.A: Fluid Typography Implementation

**Files:**
- Modify: `src/css/main.css`

**Step 1: Update base font size**

Find and update body styles to use fluid typography:

```css
body {
  font-family: var(--font-sans);
  font-size: var(--font-size-base);
  /* ... rest unchanged */
}
```

**Step 2: Update heading styles**

Add/update heading styles:

```css
h1, .text-h1 { font-size: var(--font-size-h1); }
h2, .text-h2 { font-size: var(--font-size-h2); }
h3, .text-h3 { font-size: var(--font-size-h3); }

.text-display {
  font-family: var(--font-display);
  font-size: var(--font-size-display);
  font-weight: 700;
  line-height: 1.1;
}
```

**Step 3: Commit**

```bash
git add src/css/main.css
git commit -m "feat(css): implement fluid typography with clamp()"
```

---

### Task 1.B: Accessibility Enhancements

**Files:**
- Create: `src/css/accessibility.css`
- Modify: `src/css/main.css` (add import)

**Step 1: Create accessibility.css**

```css
/* ============================================
   Accessibility - Motion & Contrast Support
   ============================================ */

/* Reduced Motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* High Contrast Mode */
@media (forced-colors: active) {
  .repo-card {
    border: 2px solid CanvasText;
    background: Canvas;
  }

  .repo-card__favorite.active {
    forced-color-adjust: none;
    background: Highlight;
    color: HighlightText;
  }

  .btn--primary {
    forced-color-adjust: none;
    background: Highlight;
    color: HighlightText;
    border-color: Highlight;
  }

  .skeleton::after {
    display: none;
  }
}

/* Screen Reader Only */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Skip Link */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-accent);
  color: white;
  padding: var(--space-sm) var(--space-md);
  z-index: 1000;
  transition: top var(--transition-fast);
}

.skip-link:focus {
  top: 0;
}
```

**Step 2: Import in main.css**

Add at top of main.css:

```css
@import './accessibility.css';
```

**Step 3: Commit**

```bash
git add src/css/accessibility.css src/css/main.css
git commit -m "feat(a11y): add reduced motion and high contrast support"
```

---

### Task 1.C: Enhanced Focus States

**Files:**
- Modify: `src/css/components.css`

**Step 1: Add global focus-visible styles**

Add after the file header comment (around line 5):

```css
/* ============================================
   Focus States (WCAG 2.1 AA)
   ============================================ */

:focus-visible {
  outline: var(--focus-ring-width) solid var(--focus-ring-color);
  outline-offset: var(--focus-ring-offset);
}

:focus:not(:focus-visible) {
  outline: none;
}
```

**Step 2: Ensure minimum touch target size**

Update `.repo-card__favorite` (around line 256):

```css
.repo-card__favorite {
  flex-shrink: 0;
  min-width: 44px;
  min-height: 44px;
  padding: var(--space-sm);
  /* ... rest unchanged */
}
```

**Step 3: Update .btn--icon for touch targets**

Update around line 97:

```css
.btn--icon {
  padding: var(--space-sm);
  min-width: 44px;
  min-height: 44px;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
}
```

**Step 4: Commit**

```bash
git add src/css/components.css
git commit -m "feat(a11y): enhance focus states and touch targets"
```

---

### Task 1.D: Glassmorphism Contrast Enhancement

**Files:**
- Modify: `src/css/components.css`

**Step 1: Update repo-card background**

Find `.repo-card` (around line 213) and update:

```css
.repo-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  background:
    var(--glass-bg),
    linear-gradient(to bottom, var(--glass-fallback) 0%, var(--glass-fallback) 100%);
  backdrop-filter: blur(10px) saturate(1.2);
  -webkit-backdrop-filter: blur(10px) saturate(1.2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition-normal);
  height: 100%;
  position: relative;
  isolation: isolate;
}
```

**Step 2: Add contrast safety for card text**

Add after `.repo-card__description`:

```css
.repo-card__description {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  flex: 1;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: var(--space-sm);
  /* Ensure contrast over any background */
  text-shadow: 0 0 1px var(--glass-fallback);
}
```

**Step 3: Commit**

```bash
git add src/css/components.css
git commit -m "feat(css): enhance glassmorphism contrast for accessibility"
```

---

## Phase 2: Quick Win Features (PARALLEL - 5 Tracks)

### Task 2.A: Quick Clone Command Generator

**Files:**
- Create: `src/js/components/CloneCommands.js`
- Modify: `src/js/detail.js`
- Modify: `src/css/components.css`

**Step 1: Create CloneCommands.js**

```javascript
import { showToast, escapeHtml } from '../common.js';

export const createCloneCommands = (fullName, hasDevContainer = false) => {
  const commands = [
    { label: 'HTTPS', cmd: `git clone https://github.com/${fullName}.git` },
    { label: 'SSH', cmd: `git clone git@github.com:${fullName}.git` },
    { label: 'GitHub CLI', cmd: `gh repo clone ${fullName}` },
    { label: 'Degit', cmd: `npx degit ${fullName} my-project` },
  ];

  if (hasDevContainer) {
    commands.push({ label: 'Dev Container', cmd: `gh cs create -r ${fullName}` });
  }

  const container = document.createElement('div');
  container.className = 'clone-commands';
  container.innerHTML = `
    <div class="clone-commands__header">
      <span class="clone-commands__title">Clone</span>
    </div>
    <div class="clone-commands__tabs">
      ${commands.map((c, i) => `
        <button class="clone-commands__tab ${i === 0 ? 'active' : ''}" data-index="${i}">
          ${escapeHtml(c.label)}
        </button>
      `).join('')}
    </div>
    <div class="clone-commands__input-wrapper">
      <input type="text" class="clone-commands__input" value="${escapeHtml(commands[0].cmd)}" readonly>
      <button class="clone-commands__copy" aria-label="Copy to clipboard">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;

  const input = container.querySelector('.clone-commands__input');
  const tabs = container.querySelectorAll('.clone-commands__tab');
  const copyBtn = container.querySelector('.clone-commands__copy');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      input.value = commands[parseInt(tab.dataset.index)].cmd;
    });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      showToast('Copied to clipboard', 'success');
    } catch {
      input.select();
      document.execCommand('copy');
      showToast('Copied to clipboard', 'success');
    }
  });

  return container;
};
```

**Step 2: Add CSS for clone commands**

Add to `src/css/components.css`:

```css
/* ============================================
   Clone Commands
   ============================================ */

.clone-commands {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.clone-commands__header {
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.clone-commands__title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.clone-commands__tabs {
  display: flex;
  gap: 2px;
  padding: var(--space-sm);
  background-color: var(--color-bg-tertiary);
  overflow-x: auto;
}

.clone-commands__tab {
  padding: var(--space-xs) var(--space-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: all var(--transition-fast);
}

.clone-commands__tab:hover {
  color: var(--color-text-primary);
  background-color: var(--color-bg-secondary);
}

.clone-commands__tab.active {
  color: var(--color-accent);
  background-color: var(--color-bg-secondary);
  border-color: var(--color-border);
}

.clone-commands__input-wrapper {
  display: flex;
  padding: var(--space-sm);
  gap: var(--space-sm);
}

.clone-commands__input {
  flex: 1;
  padding: var(--space-sm);
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.clone-commands__copy {
  padding: var(--space-sm);
  background-color: var(--color-accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.clone-commands__copy:hover {
  background-color: var(--color-accent-hover);
}
```

**Step 3: Integrate into detail.js**

Import and add to detail page render function.

**Step 4: Commit**

```bash
git add src/js/components/CloneCommands.js src/css/components.css src/js/detail.js
git commit -m "feat: add quick clone command generator"
```

---

### Task 2.B: Local Notes System

**Files:**
- Create: `src/js/components/RepoNotes.js`
- Modify: `src/js/common.js` (add Notes storage)
- Modify: `src/css/components.css`

**Step 1: Add Notes storage to common.js**

Add to Storage object:

```javascript
  // Notes
  getNotes() {
    try {
      const raw = localStorage.getItem('gh-explorer-notes');
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  getNote(repoFullName) {
    const notes = this.getNotes();
    return notes[repoFullName] || null;
  },

  saveNote(repoFullName, content) {
    const notes = this.getNotes();
    if (content && content.trim()) {
      notes[repoFullName] = {
        content: content.trim(),
        updatedAt: Date.now()
      };
    } else {
      delete notes[repoFullName];
    }
    localStorage.setItem('gh-explorer-notes', JSON.stringify(notes));
  },

  deleteNote(repoFullName) {
    const notes = this.getNotes();
    delete notes[repoFullName];
    localStorage.setItem('gh-explorer-notes', JSON.stringify(notes));
  }
```

**Step 2: Create RepoNotes.js**

```javascript
import { Storage, showToast, escapeHtml } from '../common.js';

export const createRepoNotes = (repoFullName) => {
  const existingNote = Storage.getNote(repoFullName);
  
  const container = document.createElement('div');
  container.className = 'repo-notes';
  container.innerHTML = `
    <div class="repo-notes__header">
      <span class="repo-notes__title">My Notes</span>
      <span class="repo-notes__status"></span>
    </div>
    <textarea 
      class="repo-notes__textarea" 
      placeholder="Add private notes about this repository..."
      rows="4"
    >${existingNote ? escapeHtml(existingNote.content) : ''}</textarea>
    <div class="repo-notes__footer">
      <span class="repo-notes__hint">Notes are saved locally in your browser</span>
      <button class="repo-notes__save btn btn--sm btn--primary">Save Note</button>
    </div>
  `;

  const textarea = container.querySelector('.repo-notes__textarea');
  const saveBtn = container.querySelector('.repo-notes__save');
  const status = container.querySelector('.repo-notes__status');

  let saveTimeout;

  const updateStatus = (text, type = 'info') => {
    status.textContent = text;
    status.className = `repo-notes__status repo-notes__status--${type}`;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      status.textContent = '';
    }, 2000);
  };

  saveBtn.addEventListener('click', () => {
    Storage.saveNote(repoFullName, textarea.value);
    if (textarea.value.trim()) {
      updateStatus('Saved', 'success');
      showToast('Note saved', 'success');
    } else {
      updateStatus('Cleared', 'info');
      showToast('Note cleared', 'info');
    }
  });

  // Auto-save on blur
  textarea.addEventListener('blur', () => {
    const current = Storage.getNote(repoFullName);
    const currentContent = current ? current.content : '';
    if (textarea.value !== currentContent) {
      Storage.saveNote(repoFullName, textarea.value);
      updateStatus('Auto-saved', 'success');
    }
  });

  return container;
};
```

**Step 3: Add CSS for notes**

```css
/* ============================================
   Repository Notes
   ============================================ */

.repo-notes {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.repo-notes__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-bg-tertiary);
  border-bottom: 1px solid var(--color-border);
}

.repo-notes__title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.repo-notes__status {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.repo-notes__status--success {
  color: var(--color-success);
}

.repo-notes__textarea {
  width: 100%;
  padding: var(--space-md);
  font-family: var(--font-sans);
  font-size: var(--text-sm);
  line-height: 1.6;
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  border: none;
  resize: vertical;
  min-height: 100px;
}

.repo-notes__textarea:focus {
  outline: none;
  background-color: var(--color-bg-secondary);
}

.repo-notes__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  background-color: var(--color-bg-tertiary);
  border-top: 1px solid var(--color-border);
}

.repo-notes__hint {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}
```

**Step 4: Commit**

```bash
git add src/js/components/RepoNotes.js src/js/common.js src/css/components.css
git commit -m "feat: add local notes system for repositories"
```

---

### Task 2.C: Commit Heatmap Calendar

**Files:**
- Create: `src/js/components/CommitHeatmap.js`
- Modify: `src/js/api.js` (add commit activity endpoint)
- Modify: `src/css/components.css`

**Step 1: Add API function**

Add to `src/js/api.js`:

```javascript
export const getCommitActivity = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/commit_activity`;
  return fetchWithRetry(url);
};
```

**Step 2: Create CommitHeatmap.js**

```javascript
export const createCommitHeatmap = (commitData) => {
  // commitData is array of 52 weeks, each with 7 days
  const container = document.createElement('div');
  container.className = 'commit-heatmap';
  
  const weeks = commitData || [];
  const maxCommits = Math.max(...weeks.flatMap(w => w.days || []), 1);
  
  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= maxCommits * 0.25) return 1;
    if (count <= maxCommits * 0.5) return 2;
    if (count <= maxCommits * 0.75) return 3;
    return 4;
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const today = new Date();
  
  let html = `
    <div class="commit-heatmap__header">
      <span class="commit-heatmap__title">Commit Activity</span>
    </div>
    <div class="commit-heatmap__grid">
      <div class="commit-heatmap__months">
        ${months.map(m => `<span>${m}</span>`).join('')}
      </div>
      <div class="commit-heatmap__cells">
  `;

  weeks.forEach((week, weekIndex) => {
    const days = week.days || [0,0,0,0,0,0,0];
    days.forEach((count, dayIndex) => {
      const date = new Date(week.week * 1000);
      date.setDate(date.getDate() + dayIndex);
      const level = getLevel(count);
      html += `<div class="commit-heatmap__cell commit-heatmap__cell--${level}" 
        title="${date.toDateString()}: ${count} commits"></div>`;
    });
  });

  html += `
      </div>
    </div>
    <div class="commit-heatmap__legend">
      <span>Less</span>
      <div class="commit-heatmap__cell commit-heatmap__cell--0"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--1"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--2"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--3"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--4"></div>
      <span>More</span>
    </div>
  `;

  container.innerHTML = html;
  return container;
};
```

**Step 3: Add CSS**

```css
/* ============================================
   Commit Heatmap
   ============================================ */

.commit-heatmap {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}

.commit-heatmap__header {
  margin-bottom: var(--space-md);
}

.commit-heatmap__title {
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-text-secondary);
}

.commit-heatmap__grid {
  overflow-x: auto;
}

.commit-heatmap__cells {
  display: grid;
  grid-template-rows: repeat(7, 12px);
  grid-auto-flow: column;
  grid-auto-columns: 12px;
  gap: 3px;
}

.commit-heatmap__cell {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: var(--color-bg-tertiary);
}

.commit-heatmap__cell--0 { background-color: var(--color-bg-tertiary); }
.commit-heatmap__cell--1 { background-color: rgba(20, 184, 166, 0.25); }
.commit-heatmap__cell--2 { background-color: rgba(20, 184, 166, 0.5); }
.commit-heatmap__cell--3 { background-color: rgba(20, 184, 166, 0.75); }
.commit-heatmap__cell--4 { background-color: var(--color-accent); }

.commit-heatmap__legend {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-top: var(--space-md);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.commit-heatmap__legend .commit-heatmap__cell {
  width: 10px;
  height: 10px;
}
```

**Step 4: Commit**

```bash
git add src/js/components/CommitHeatmap.js src/js/api.js src/css/components.css
git commit -m "feat: add commit activity heatmap calendar"
```

---

### Task 2.D: Personal Discovery Stats

**Files:**
- Create: `src/js/components/DiscoveryStats.js`
- Modify: `src/js/common.js` (add tracking)
- Modify: `index.html` (add stats section)

**Step 1: Add tracking to common.js**

Add to Storage object:

```javascript
  // Discovery Stats
  getDiscoveryStats() {
    try {
      const raw = localStorage.getItem('gh-explorer-stats');
      if (!raw) return { explored: [], languages: {}, streak: 0, lastVisit: null };
      return JSON.parse(raw);
    } catch {
      return { explored: [], languages: {}, streak: 0, lastVisit: null };
    }
  },

  trackExploration(repo) {
    const stats = this.getDiscoveryStats();
    const today = new Date().toDateString();
    
    // Track unique repos explored
    if (!stats.explored.includes(repo.id)) {
      stats.explored.push(repo.id);
    }
    
    // Track languages
    if (repo.language) {
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
    }
    
    // Update streak
    if (stats.lastVisit !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (stats.lastVisit === yesterday.toDateString()) {
        stats.streak += 1;
      } else if (stats.lastVisit !== today) {
        stats.streak = 1;
      }
      stats.lastVisit = today;
    }
    
    localStorage.setItem('gh-explorer-stats', JSON.stringify(stats));
    return stats;
  }
```

**Step 2: Create DiscoveryStats.js**

```javascript
import { Storage } from '../common.js';

export const createDiscoveryStats = () => {
  const stats = Storage.getDiscoveryStats();
  const topLanguages = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.createElement('div');
  container.className = 'discovery-stats';
  container.innerHTML = `
    <div class="discovery-stats__header">
      <span class="discovery-stats__title">Your Exploration</span>
    </div>
    <div class="discovery-stats__grid">
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${stats.explored.length}</span>
        <span class="discovery-stats__label">Repos Explored</span>
      </div>
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${Object.keys(stats.languages).length}</span>
        <span class="discovery-stats__label">Languages</span>
      </div>
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${stats.streak}</span>
        <span class="discovery-stats__label">Day Streak</span>
      </div>
    </div>
    ${topLanguages.length > 0 ? `
      <div class="discovery-stats__languages">
        <span class="discovery-stats__subtitle">Top Languages</span>
        <div class="discovery-stats__tags">
          ${topLanguages.map(([lang, count]) => `
            <span class="discovery-stats__tag">${lang} (${count})</span>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  return container;
};
```

**Step 3: Add CSS and integrate**

**Step 4: Commit**

```bash
git add src/js/components/DiscoveryStats.js src/js/common.js src/css/components.css
git commit -m "feat: add personal discovery stats tracking"
```

---

### Task 2.E: Container Queries for Cards

**Files:**
- Modify: `src/css/main.css`
- Modify: `src/css/components.css`

**Step 1: Update repo-grid**

In `main.css`, update grid:

```css
.repo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
  gap: var(--space-lg);
}
```

**Step 2: Add container query to cards**

In `components.css`, add to `.repo-card`:

```css
.repo-card {
  container-type: inline-size;
  container-name: card;
  /* ... existing styles */
}

@container card (max-width: 280px) {
  .repo-card__footer {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-sm);
  }
  
  .repo-card__updated {
    margin-left: 0;
  }
}
```

**Step 3: Commit**

```bash
git add src/css/main.css src/css/components.css
git commit -m "feat(css): add container queries for responsive cards"
```

---

## Phase 3: Core Features (PARALLEL - 3 Tracks)

### Task 3.A: Smart Collections

**Files:**
- Create: `src/js/components/Collections.js`
- Modify: `src/js/common.js`
- Create: `collections.html`
- Create: `src/js/collections.js`

**Implementation:** Extends favorites system with named collections, export functionality, and URL-based sharing.

*(Full implementation details follow same pattern as above)*

---

### Task 3.B: Repository Health Score

**Files:**
- Create: `src/js/components/HealthScore.js`
- Modify: `src/js/api.js` (add community profile, contributor stats endpoints)
- Modify: `src/css/components.css`

**Implementation:** Aggregates commit activity, issue responsiveness, PR merge rate, and community metrics into 0-100 score with visual dashboard.

---

### Task 3.C: Repository Comparison Mode

**Files:**
- Create: `compare.html`
- Create: `src/js/compare.js`
- Create: `src/js/components/CompareTable.js`
- Modify: `vite.config.js` (add compare page entry)

**Implementation:** Side-by-side comparison of 2-4 repositories with normalized metrics table.

---

## Execution Summary

| Phase | Tasks | Parallelizable | Est. Time (Sequential) | Est. Time (Parallel) |
|-------|-------|----------------|------------------------|----------------------|
| 0 | 1 | No | 15 min | 15 min |
| 1 | 4 | Yes (4 tracks) | 60 min | 15 min |
| 2 | 5 | Yes (5 tracks) | 150 min | 30 min |
| 3 | 3 | Yes (3 tracks) | 180 min | 60 min |

**Total Sequential:** ~7 hours
**Total Parallel:** ~2 hours

---

## Verification Checklist

After each phase:
- [ ] `npm run build` succeeds
- [ ] `npm run dev` - visual inspection
- [ ] No console errors
- [ ] Dark/light mode both work
- [ ] Mobile responsive check

---

## Notes for Executing Agent

1. **Phase 0 is blocking** - must complete before any other phase
2. **Within phases, tasks are independent** - can be dispatched to parallel agents
3. **Each task has explicit file paths** - no ambiguity about what to modify
4. **Commits are atomic** - one feature per commit
5. **CSS changes in Phase 1 touch different selectors** - safe to parallelize
