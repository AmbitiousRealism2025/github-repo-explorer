# Repository DNA Implementation Plan

*Created: December 30, 2025*

This document outlines a phased approach to implementing the Repository DNA visualization feature - a unique generative art "fingerprint" for each repository based on its characteristics.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Core DNA Generator](#phase-1-core-dna-generator)
3. [Phase 2: Visual Design System](#phase-2-visual-design-system)
4. [Phase 3: UI Integration](#phase-3-ui-integration)
5. [Phase 4: Export & Share](#phase-4-export--share)
6. [Phase 5: Polish & Performance](#phase-5-polish--performance)
7. [Technical Specifications](#technical-specifications)
8. [File Structure](#file-structure)
9. [Testing Strategy](#testing-strategy)

---

## Overview

### Goal
Create a visually distinctive, deterministic "DNA fingerprint" for each GitHub repository that:
- Is instantly recognizable at a glance
- Encodes repository characteristics into visual elements
- Can be shared on social media
- Enhances the detail page experience

### Visual Mapping Strategy

| Repo Attribute | Visual Element | Implementation |
|----------------|----------------|----------------|
| Language count | Base geometry | 3 langs = triangle, 4 = square, 5 = pentagon, etc. |
| Primary language | Color palette | JavaScript = amber, Python = blue, Rust = orange, etc. |
| Star count | Overall scale | Logarithmic scaling (0-100px radius range) |
| Contributor count | Pattern density | More contributors = more complex internal patterns |
| Repository age | Rotation/tilt | Older repos have more rotation (0-360 degrees) |
| Recent activity | Animation | Pulse intensity based on commits in last 30 days |

---

## Phase 1: Core DNA Generator

**Goal:** Build the deterministic algorithm that generates consistent DNA data from repository attributes.

### Tasks

#### 1.1 Create DNAGenerator Module
- [ ] Create `src/js/components/RepositoryDNA/DNAGenerator.js`
- [ ] Implement seeded pseudo-random number generator (Mulberry32)
- [ ] Create hash function to convert repo data → numeric seed

```javascript
// Core functions to implement:
export function generateSeed(repo) → number
export function generateDNAData(repo) → DNAData
```

#### 1.2 Define DNA Data Structure

```javascript
// DNAData interface
{
  seed: number,
  geometry: {
    sides: number,        // 3-12 based on language count
    radius: number,       // 30-80 based on star count
    rotation: number,     // 0-360 based on repo age
  },
  colors: {
    primary: string,      // From primary language
    secondary: string,    // Complementary color
    accent: string,       // Highlight color
    background: string,   // Subtle background
  },
  pattern: {
    density: number,      // 1-5 based on contributors
    complexity: number,   // Derived from multiple factors
    layers: number,       // 2-5 based on activity level
  },
  animation: {
    pulseIntensity: number,  // 0-1 based on recent activity
    speed: number,           // Animation duration
  }
}
```

#### 1.3 Language Color Mapping
- [ ] Create comprehensive language → color mapping
- [ ] Match GitHub's linguist colors where possible
- [ ] Generate complementary colors algorithmically

```javascript
// Language color palette (partial)
const LANGUAGE_COLORS = {
  JavaScript: { primary: '#f7df1e', secondary: '#323330' },
  TypeScript: { primary: '#3178c6', secondary: '#235a97' },
  Python: { primary: '#3572A5', secondary: '#1e4a6d' },
  Rust: { primary: '#dea584', secondary: '#b7410e' },
  Go: { primary: '#00ADD8', secondary: '#007d9c' },
  // ... 30+ languages
};
```

#### 1.4 Unit Tests for Generator
- [ ] Create `src/js/__tests__/RepositoryDNA.test.js`
- [ ] Test determinism (same input → same output)
- [ ] Test edge cases (missing data, null values)
- [ ] Test seed generation consistency

### Deliverables
- `DNAGenerator.js` with 100% test coverage
- Language color mapping for top 30 languages
- Type definitions/JSDoc documentation

### Estimated Complexity: Medium

---

## Phase 2: Visual Design System

**Goal:** Implement Canvas-based rendering of DNA visualizations.

### Tasks

#### 2.1 Create DNARenderer Module
- [ ] Create `src/js/components/RepositoryDNA/DNARenderer.js`
- [ ] Implement polygon drawing with variable sides
- [ ] Create layered rendering system

```javascript
// Core rendering functions:
export function createDNACanvas(dnaData, size) → HTMLCanvasElement
export function drawDNA(ctx, dnaData, options) → void
```

#### 2.2 Implement Geometric Patterns

| Pattern Type | Visual Description | Trigger |
|--------------|-------------------|---------|
| Radial rays | Lines from center outward | Base pattern |
| Concentric rings | Nested shapes | 2+ contributors |
| Dot matrix | Grid of dots within shape | 10+ contributors |
| Voronoi cells | Organic cell divisions | 50+ contributors |
| Perlin noise | Smooth gradient fills | 100+ contributors |

#### 2.3 Layered Composition
```
Layer 1: Background gradient
Layer 2: Main geometric shape
Layer 3: Internal pattern (based on density)
Layer 4: Accent highlights
Layer 5: Glow/shadow effects
```

#### 2.4 Color Gradient System
- [ ] Implement radial gradients
- [ ] Create luminosity variations
- [ ] Support dark/light theme adaptation

### Deliverables
- `DNARenderer.js` with full rendering pipeline
- 5+ distinct pattern types
- Theme-aware color system

### Estimated Complexity: High

---

## Phase 3: UI Integration

**Goal:** Integrate DNA visualization into the repository detail page.

### Tasks

#### 3.1 Create DNA Component
- [ ] Create `src/js/components/RepositoryDNA/index.js`
- [ ] Follow existing component patterns (similar to `HealthScore.js`)
- [ ] Export `createRepositoryDNA(repo)` function

```javascript
// Component API
export function createRepositoryDNA(repo, options = {}) → HTMLElement

// Options
{
  size: 200,           // Canvas size in pixels
  animate: true,       // Enable pulse animation
  showLabel: true,     // Show "Repository DNA" label
  interactive: false,  // Enable hover effects (future)
}
```

#### 3.2 Add CSS Styles
- [ ] Add DNA component styles to `src/css/components.css`
- [ ] Responsive sizing (smaller on mobile)
- [ ] Theme-aware styling
- [ ] Animation keyframes for pulse effect

```css
/* DNA Component Styles */
.repo-dna { }
.repo-dna__canvas { }
.repo-dna__label { }
.repo-dna--animate { }

/* Responsive adjustments */
@media (max-width: 640px) {
  .repo-dna__canvas { width: 150px; height: 150px; }
}
```

#### 3.3 Update Detail Page
- [ ] Add DNA container to `detail.html`
- [ ] Import DNA component in `detail.js`
- [ ] Render DNA alongside Health Score

```html
<!-- Add to detail.html -->
<div id="repo-dna-container" class="detail-card"></div>
```

```javascript
// In detail.js loadRepository()
import { createRepositoryDNA } from './components/RepositoryDNA/index.js';

// After fetching repo data:
const dnaContainer = getRequiredElement('repo-dna-container');
dnaContainer.appendChild(createRepositoryDNA(currentRepo));
```

#### 3.4 Add to Repository Cards (Optional)
- [ ] Create mini DNA badge for card view
- [ ] Integrate with `RepoGrid.js` component
- [ ] Lazy-load DNA for performance

### Deliverables
- Fully styled DNA component
- Integration in detail page
- Mobile-responsive design

### Estimated Complexity: Medium

---

## Phase 4: Export & Share

**Goal:** Enable users to download and share their repository DNA.

### Tasks

#### 4.1 Download Functionality
- [ ] Add "Download DNA" button
- [ ] Export as PNG (default)
- [ ] Export as SVG (optional)

```javascript
// Download implementation
export function downloadDNA(canvas, filename) {
  const link = document.createElement('a');
  link.download = `${filename}-dna.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

#### 4.2 Social Share Cards
- [ ] Generate larger share-ready images (1200x630 for Twitter/OG)
- [ ] Include repo name and stats overlay
- [ ] Add "Generated by GitHub Explorer" watermark

```
┌─────────────────────────────────────────┐
│                                         │
│         [DNA VISUALIZATION]             │
│                                         │
│  facebook/react                         │
│  ★ 218k  ⑂ 45k  JavaScript              │
│                                         │
│  Generated by GitHub Explorer           │
└─────────────────────────────────────────┘
```

#### 4.3 Copy to Clipboard
- [ ] Implement canvas → clipboard copy
- [ ] Fallback for browsers without clipboard API
- [ ] Show success toast notification

### Deliverables
- Download button with PNG export
- Social-ready share image generation
- Copy to clipboard functionality

### Estimated Complexity: Medium

---

## Phase 5: Polish & Performance

**Goal:** Optimize performance and add finishing touches.

### Tasks

#### 5.1 Performance Optimization
- [ ] Implement DNA caching (localStorage with versioning)
- [ ] Use OffscreenCanvas where supported
- [ ] Lazy-load DNA on scroll into view

```javascript
// Caching strategy
const DNA_CACHE_KEY = 'gh-explorer-dna-cache';
const DNA_CACHE_VERSION = 1;

function getCachedDNA(repoId) {
  const cache = JSON.parse(localStorage.getItem(DNA_CACHE_KEY) || '{}');
  return cache[repoId]?.version === DNA_CACHE_VERSION
    ? cache[repoId].dataUrl
    : null;
}
```

#### 5.2 Accessibility
- [ ] Add meaningful alt text to DNA canvas
- [ ] Provide text description of DNA characteristics
- [ ] Respect `prefers-reduced-motion`

```html
<canvas
  role="img"
  aria-label="Repository DNA for facebook/react:
    Pentagon shape (5 languages),
    Yellow palette (JavaScript),
    High density pattern (2000+ contributors)"
></canvas>
```

#### 5.3 Animation Polish
- [ ] Smooth pulse animation (CSS or requestAnimationFrame)
- [ ] Entrance animation when DNA appears
- [ ] Hover interaction (subtle glow increase)

#### 5.4 Error Handling
- [ ] Graceful fallback for canvas errors
- [ ] Handle missing repository data
- [ ] Show placeholder for loading state

### Deliverables
- Optimized performance with caching
- Full accessibility compliance
- Polished animations
- Comprehensive error handling

### Estimated Complexity: Medium

---

## Technical Specifications

### Browser Support
- Chrome 90+ (primary)
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies
- No external libraries (vanilla Canvas API)
- Optional: simplex-noise for Perlin patterns (or implement basic version)

### Performance Targets
| Metric | Target |
|--------|--------|
| Initial render | < 50ms |
| Cached render | < 5ms |
| Memory per DNA | < 100KB |
| Animation FPS | 60fps |

### Canvas Sizing
| Context | Size | Notes |
|---------|------|-------|
| Detail page | 200x200px | Primary display |
| Card badge | 40x40px | Mini preview |
| Social share | 1200x630px | OG/Twitter card |
| Download | 800x800px | High quality export |

---

## File Structure

```
src/js/components/RepositoryDNA/
├── index.js              # Main component export
├── DNAGenerator.js       # Seed & data generation
├── DNARenderer.js        # Canvas rendering
├── DNAExporter.js        # Download/share utilities
├── colors.js             # Language color mappings
└── patterns.js           # Pattern drawing functions

src/js/__tests__/
└── RepositoryDNA.test.js # Comprehensive tests

src/css/
└── components.css        # DNA component styles (appended)
```

---

## Testing Strategy

### Unit Tests
| Module | Test Focus |
|--------|------------|
| DNAGenerator | Determinism, edge cases, seed consistency |
| DNARenderer | Canvas output, pattern generation |
| DNAExporter | File format, download triggers |
| colors.js | Color mapping coverage |

### Integration Tests
- DNA renders correctly in detail page
- Download produces valid PNG
- Caching works correctly

### Visual Regression Tests
- Screenshot comparison for 10 sample repos
- Theme switching (dark/light)
- Responsive sizing

### Target Coverage
- DNAGenerator: 100%
- DNARenderer: 80%
- Overall component: 90%

---

## Implementation Timeline Summary

| Phase | Focus | Key Deliverable |
|-------|-------|-----------------|
| 1 | Core Generator | Deterministic DNA data structure |
| 2 | Visual Design | Canvas rendering with patterns |
| 3 | UI Integration | Detail page implementation |
| 4 | Export & Share | Download and social features |
| 5 | Polish | Performance, a11y, animations |

---

## Success Criteria

1. **Determinism**: Same repo always generates identical DNA
2. **Distinctiveness**: Different repos have visually different DNA
3. **Performance**: Renders in < 50ms, no UI jank
4. **Accessibility**: Meaningful alt text, reduced motion support
5. **Shareability**: Easy download and social sharing
6. **Consistency**: Matches existing design system

---

## Future Enhancements (Post-MVP)

- **DNA Comparison**: Side-by-side DNA for compare page
- **DNA Timeline**: Show how DNA evolved over time
- **DNA Gallery**: Collection of favorite repo DNAs
- **Interactive DNA**: Hover to see what each element represents
- **DNA Animation Variants**: Different animation styles per language
- **DNA Themes**: User-selectable color schemes

---

*Document created by Claude Code - December 30, 2025*
