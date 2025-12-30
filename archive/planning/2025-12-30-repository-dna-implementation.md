# Repository DNA Implementation Plan

*Master Implementation Plan - December 30, 2025*

## Table of Contents

1. [Overview](#1-overview)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Technical Architecture](#3-technical-architecture)
4. [Algorithm Design](#4-algorithm-design)
5. [Visual Design Specifications](#5-visual-design-specifications)
6. [Component Structure](#6-component-structure)
7. [File Structure](#7-file-structure)
8. [Implementation Phases](#8-implementation-phases)
9. [Testing Strategy](#9-testing-strategy)
10. [Performance Considerations](#10-performance-considerations)
11. [Accessibility](#11-accessibility)
12. [Future Enhancements](#12-future-enhancements)

---

## 1. Overview

### What is Repository DNA?

Repository DNA is a generative visualization feature that creates a unique, deterministic visual "fingerprint" for each GitHub repository. Like a genetic signature, this visualization encodes multiple characteristics of a repository into an aesthetically pleasing, instantly recognizable graphic.

### Why Build This?

1. **Instant Recognition** - Users can identify repos at a glance
2. **Emotional Connection** - Creates a "brand" for each project
3. **Shareability** - Download and share on social media
4. **Differentiation** - No other GitHub explorer offers this
5. **Engagement** - Gamification through collecting unique DNAs

### Where It Appears

- **Detail Page** - Primary location, full-size visualization
- **Repository Cards** - Small thumbnail version (optional Phase 2)
- **Compare Page** - Side-by-side DNA comparison
- **Favorites Page** - DNA gallery view (optional Phase 3)

---

## 2. Goals & Success Metrics

### Primary Goals

| Goal | Metric | Target |
|------|--------|--------|
| User engagement | Time on detail page | +20% increase |
| Shareability | DNA downloads per session | >5% of detail page visits |
| Visual appeal | User feedback | Positive sentiment |
| Performance | Render time | <100ms |

### Non-Goals (Out of Scope)

- Animation/motion effects (defer to Phase 2)
- 3D visualizations
- Custom user-designed DNA
- NFT/blockchain integration

---

## 3. Technical Architecture

### Technology Stack

```
┌─────────────────────────────────────────────────────────┐
│                    DNA Component                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ DNA Engine  │  │ Color       │  │ Shape           │ │
│  │ (Generator) │  │ Palette     │  │ Generators      │ │
│  │             │  │ System      │  │                 │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│         └────────────────┼───────────────────┘          │
│                          ▼                              │
│                 ┌─────────────────┐                     │
│                 │  Canvas/SVG     │                     │
│                 │  Renderer       │                     │
│                 └────────┬────────┘                     │
│                          │                              │
│                          ▼                              │
│                 ┌─────────────────┐                     │
│                 │  Export/Share   │                     │
│                 │  Utilities      │                     │
│                 └─────────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

### Data Flow

```
Repository Data → Hash Generator → PRNG Seed → Visual Parameters → Canvas Render → Display/Export
```

### Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Rendering | Canvas API | Better performance for complex graphics, easy export |
| Randomness | Seeded PRNG (Mulberry32) | Deterministic results from same input |
| Export Format | PNG (primary), SVG (optional) | Wide compatibility, quality |
| Caching | Data URL in memory | Avoid re-rendering same DNA |

---

## 4. Algorithm Design

### 4.1 Input Parameters

Extract these values from repository data:

```javascript
const dnaInputs = {
  // Identity
  repoId: repo.id,                          // Primary seed
  fullName: repo.full_name,                 // Secondary seed

  // Shape determinants
  languageCount: Object.keys(languages).length,  // 1-10+
  hasWiki: repo.has_wiki,                   // boolean
  hasPages: repo.has_pages,                 // boolean

  // Color determinants
  primaryLanguage: repo.language,           // string

  // Scale determinants
  starCount: repo.stargazers_count,         // 0-1M+
  forkCount: repo.forks_count,              // 0-100k+

  // Complexity determinants
  contributorEstimate: repo.subscribers_count, // proxy for contributors
  openIssues: repo.open_issues_count,

  // Age determinants
  createdAt: repo.created_at,               // ISO date
  pushedAt: repo.pushed_at,                 // ISO date

  // Activity determinants
  recentCommits: commitActivity?.total || 0  // last year
};
```

### 4.2 Seeded Random Number Generator

Use Mulberry32 for deterministic randomness:

```javascript
function mulberry32(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Create seed from repo ID and name
function createSeed(repoId, fullName) {
  let hash = repoId;
  for (let i = 0; i < fullName.length; i++) {
    hash = ((hash << 5) - hash) + fullName.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}
```

### 4.3 Visual Parameter Mapping

#### Shape Selection

```javascript
const SHAPES = {
  1: 'circle',      // 1 language - simple, focused
  2: 'vesica',      // 2 languages - overlapping circles
  3: 'triangle',    // 3 languages
  4: 'square',      // 4 languages
  5: 'pentagon',    // 5 languages
  6: 'hexagon',     // 6+ languages - max complexity
};

function getBaseShape(languageCount) {
  return SHAPES[Math.min(languageCount, 6)] || 'hexagon';
}
```

#### Color Palette System

```javascript
const LANGUAGE_PALETTES = {
  // Warm colors for systems/performance languages
  'Rust':       { primary: '#DEA584', secondary: '#B7410E', accent: '#FFD700' },
  'C':          { primary: '#555555', secondary: '#A8B9CC', accent: '#F0F0F0' },
  'C++':        { primary: '#F34B7D', secondary: '#00599C', accent: '#FFFFFF' },
  'Go':         { primary: '#00ADD8', secondary: '#5DC9E2', accent: '#FFFFFF' },

  // Cool colors for web/scripting languages
  'JavaScript': { primary: '#F7DF1E', secondary: '#323330', accent: '#FFFFFF' },
  'TypeScript': { primary: '#3178C6', secondary: '#235A97', accent: '#FFFFFF' },
  'Python':     { primary: '#3776AB', secondary: '#FFD43B', accent: '#FFFFFF' },
  'Ruby':       { primary: '#CC342D', secondary: '#701516', accent: '#FFFFFF' },

  // Purple/pink for functional/academic languages
  'Haskell':    { primary: '#5D4F85', secondary: '#8F4E8B', accent: '#FFFFFF' },
  'Elixir':     { primary: '#6E4A7E', secondary: '#4B275F', accent: '#FFFFFF' },
  'Scala':      { primary: '#DC322F', secondary: '#002B36', accent: '#FFFFFF' },

  // Green for data/ML languages
  'R':          { primary: '#198CE7', secondary: '#75AADB', accent: '#FFFFFF' },
  'Julia':      { primary: '#9558B2', secondary: '#389826', accent: '#CB3C33' },

  // Default for unknown
  'default':    { primary: '#6B7280', secondary: '#9CA3AF', accent: '#FFFFFF' }
};

function getPalette(language) {
  return LANGUAGE_PALETTES[language] || LANGUAGE_PALETTES['default'];
}
```

#### Size Mapping

```javascript
function calculateSize(starCount, baseSize = 300) {
  // Logarithmic scale: 0 stars = 0.6x, 1000 = 1x, 100k = 1.5x
  const scale = 0.6 + (Math.log10(starCount + 1) / 5) * 0.9;
  return Math.min(baseSize * scale, baseSize * 1.5);
}
```

#### Complexity Mapping

```javascript
function calculateComplexity(contributorCount, issueCount) {
  // More contributors/issues = more detail layers
  const contributorFactor = Math.min(contributorCount / 100, 1);
  const issueFactor = Math.min(issueCount / 500, 1);

  // Returns 1-5 (number of detail layers)
  return Math.ceil((contributorFactor + issueFactor) * 2.5) + 1;
}
```

#### Age/Rotation Mapping

```javascript
function calculateRotation(createdAt) {
  const age = Date.now() - new Date(createdAt).getTime();
  const ageYears = age / (365.25 * 24 * 60 * 60 * 1000);

  // Older repos have more rotation (0-360 degrees over 10 years)
  return (ageYears / 10) * 360 % 360;
}
```

### 4.4 Core Generation Algorithm

```javascript
function generateDNA(repo, languages, commitActivity, canvas) {
  const ctx = canvas.getContext('2d');
  const seed = createSeed(repo.id, repo.full_name);
  const random = mulberry32(seed);

  // Calculate all parameters
  const params = {
    shape: getBaseShape(Object.keys(languages).length),
    palette: getPalette(repo.language),
    size: calculateSize(repo.stargazers_count),
    complexity: calculateComplexity(repo.subscribers_count, repo.open_issues_count),
    rotation: calculateRotation(repo.created_at),
    activity: normalizeActivity(commitActivity)
  };

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw layers from back to front
  drawBackground(ctx, params, random);
  drawBaseShape(ctx, params, random);
  drawComplexityLayers(ctx, params, random);
  drawActivityRings(ctx, params, random);
  drawCenterCore(ctx, params, random);
  drawAccents(ctx, params, random);

  return canvas.toDataURL('image/png');
}
```

### 4.5 Drawing Functions

#### Background Pattern

```javascript
function drawBackground(ctx, params, random) {
  const { palette, size } = params;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  // Radial gradient background
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, size
  );
  gradient.addColorStop(0, palette.secondary + '40'); // 25% opacity
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

#### Base Shape

```javascript
function drawBaseShape(ctx, params, random) {
  const { shape, palette, size, rotation } = params;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation * Math.PI / 180);

  ctx.fillStyle = palette.primary;
  ctx.strokeStyle = palette.secondary;
  ctx.lineWidth = 2;

  switch (shape) {
    case 'circle':
      drawCircle(ctx, size / 2);
      break;
    case 'triangle':
      drawPolygon(ctx, 3, size / 2);
      break;
    case 'square':
      drawPolygon(ctx, 4, size / 2);
      break;
    case 'pentagon':
      drawPolygon(ctx, 5, size / 2);
      break;
    case 'hexagon':
      drawPolygon(ctx, 6, size / 2);
      break;
    case 'vesica':
      drawVesica(ctx, size / 2);
      break;
  }

  ctx.restore();
}

function drawPolygon(ctx, sides, radius) {
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
```

#### Complexity Layers

```javascript
function drawComplexityLayers(ctx, params, random) {
  const { complexity, palette, size } = params;

  for (let layer = 0; layer < complexity; layer++) {
    const layerRadius = size * (0.3 + layer * 0.15);
    const segments = 6 + layer * 2;
    const opacity = 0.3 - layer * 0.05;

    ctx.strokeStyle = palette.accent + Math.floor(opacity * 255).toString(16).padStart(2, '0');
    ctx.lineWidth = 1;

    // Draw decorative rings with variation
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const variance = random() * 10 - 5;
      const r = layerRadius + variance;

      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;

      ctx.beginPath();
      ctx.arc(x, y, 3 + random() * 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
```

#### Activity Rings

```javascript
function drawActivityRings(ctx, params, random) {
  const { activity, palette, size } = params;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;

  // Activity represented as concentric arcs
  const ringCount = Math.ceil(activity * 5); // 0-5 rings based on activity

  for (let ring = 0; ring < ringCount; ring++) {
    const radius = size * 0.4 + ring * 15;
    const startAngle = random() * Math.PI * 2;
    const arcLength = (0.3 + activity * 0.5) * Math.PI;

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + arcLength);
    ctx.strokeStyle = palette.primary + '80';
    ctx.lineWidth = 2 + ring;
    ctx.stroke();
  }
}
```

#### Center Core

```javascript
function drawCenterCore(ctx, params, random) {
  const { palette, size } = params;
  const centerX = ctx.canvas.width / 2;
  const centerY = ctx.canvas.height / 2;
  const coreSize = size * 0.15;

  // Glowing center
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, coreSize
  );
  gradient.addColorStop(0, palette.accent);
  gradient.addColorStop(0.5, palette.primary);
  gradient.addColorStop(1, palette.secondary + '00');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, coreSize, 0, Math.PI * 2);
  ctx.fill();
}
```

---

## 5. Visual Design Specifications

### 5.1 Canvas Dimensions

| Context | Width | Height | Aspect Ratio |
|---------|-------|--------|--------------|
| Detail Page (Large) | 400px | 400px | 1:1 |
| Card Thumbnail | 60px | 60px | 1:1 |
| Export/Download | 800px | 800px | 1:1 |
| Social Share | 1200px | 630px | ~1.9:1 (OG image) |

### 5.2 Visual Elements

```
┌────────────────────────────────────────┐
│                                        │
│     ┌──────────────────────────┐      │
│     │    Background Glow       │      │
│     │  ┌────────────────────┐  │      │
│     │  │  Complexity Layers │  │      │
│     │  │ ┌────────────────┐ │  │      │
│     │  │ │ Activity Rings │ │  │      │
│     │  │ │  ┌──────────┐  │ │  │      │
│     │  │ │  │Base Shape│  │ │  │      │
│     │  │ │  │ ┌──────┐ │  │ │  │      │
│     │  │ │  │ │ Core │ │  │ │  │      │
│     │  │ │  │ └──────┘ │  │ │  │      │
│     │  │ │  └──────────┘  │ │  │      │
│     │  │ └────────────────┘ │  │      │
│     │  └────────────────────┘  │      │
│     └──────────────────────────┘      │
│                                        │
└────────────────────────────────────────┘
```

### 5.3 Theme Integration

Support both light and dark themes:

```javascript
const THEME_ADJUSTMENTS = {
  light: {
    backgroundAlpha: 0.1,
    glowIntensity: 0.8,
    strokeOpacity: 1.0
  },
  dark: {
    backgroundAlpha: 0.2,
    glowIntensity: 1.0,
    strokeOpacity: 0.9
  }
};
```

---

## 6. Component Structure

### 6.1 Main Component: `RepoDNA.js`

```javascript
// src/js/components/RepoDNA.js

/**
 * Creates a Repository DNA visualization
 * @param {Object} repo - Repository data from GitHub API
 * @param {Object} languages - Language breakdown object
 * @param {Object} commitActivity - Commit activity data (optional)
 * @param {Object} options - Configuration options
 * @returns {HTMLElement} Container with canvas and controls
 */
export function createRepoDNA(repo, languages = {}, commitActivity = null, options = {}) {
  const {
    size = 400,
    showDownload = true,
    showLabel = true,
    theme = 'auto'
  } = options;

  // Create container
  const container = document.createElement('div');
  container.className = 'repo-dna';

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.className = 'repo-dna__canvas';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', `DNA visualization for ${repo.full_name}`);

  // Generate DNA
  const dnaGenerator = new DNAGenerator(repo, languages, commitActivity);
  dnaGenerator.render(canvas, theme);

  container.appendChild(canvas);

  // Add label
  if (showLabel) {
    const label = document.createElement('p');
    label.className = 'repo-dna__label';
    label.textContent = 'Repository DNA';
    container.appendChild(label);
  }

  // Add download button
  if (showDownload) {
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'repo-dna__download btn btn-secondary';
    downloadBtn.innerHTML = `${Icons.download} Download DNA`;
    downloadBtn.addEventListener('click', () => downloadDNA(canvas, repo.full_name));
    container.appendChild(downloadBtn);
  }

  return container;
}

/**
 * Download DNA as PNG
 */
function downloadDNA(canvas, repoName) {
  const link = document.createElement('a');
  link.download = `${repoName.replace('/', '-')}-dna.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('DNA downloaded!');
}
```

### 6.2 DNA Generator Class

```javascript
// src/js/components/DNAGenerator.js

export class DNAGenerator {
  constructor(repo, languages, commitActivity) {
    this.repo = repo;
    this.languages = languages;
    this.commitActivity = commitActivity;
    this.seed = this.createSeed();
    this.random = this.mulberry32(this.seed);
  }

  createSeed() {
    // Deterministic seed from repo ID and name
    let hash = this.repo.id;
    const name = this.repo.full_name;
    for (let i = 0; i < name.length; i++) {
      hash = ((hash << 5) - hash) + name.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  mulberry32(seed) {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  calculateParams() {
    return {
      shape: this.getBaseShape(),
      palette: this.getPalette(),
      size: this.calculateSize(),
      complexity: this.calculateComplexity(),
      rotation: this.calculateRotation(),
      activity: this.normalizeActivity()
    };
  }

  render(canvas, theme = 'auto') {
    const ctx = canvas.getContext('2d');
    const params = this.calculateParams();
    const themeMode = theme === 'auto' ? this.detectTheme() : theme;

    // Clear and set up
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply theme adjustments
    const adjustments = THEME_ADJUSTMENTS[themeMode];

    // Draw all layers
    this.drawBackground(ctx, params, adjustments);
    this.drawBaseShape(ctx, params);
    this.drawComplexityLayers(ctx, params);
    this.drawActivityRings(ctx, params);
    this.drawCenterCore(ctx, params);
    this.drawAccents(ctx, params);
  }

  // ... all drawing methods
}
```

### 6.3 CSS Styles

```css
/* src/css/components.css - Add to existing file */

/* Repository DNA */
.repo-dna {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
}

.repo-dna__canvas {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-md);
}

.repo-dna__label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.repo-dna__download {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.repo-dna__download svg {
  width: 16px;
  height: 16px;
}

/* Responsive */
@media (max-width: 480px) {
  .repo-dna {
    padding: var(--spacing-md);
  }

  .repo-dna__canvas {
    max-width: 280px;
  }
}
```

---

## 7. File Structure

```
src/
├── js/
│   ├── components/
│   │   ├── RepoDNA.js          # Main component (NEW)
│   │   ├── DNAGenerator.js     # Core generation logic (NEW)
│   │   ├── DNAPalettes.js      # Color palette definitions (NEW)
│   │   └── ... existing components
│   ├── __tests__/
│   │   └── RepoDNA.test.js     # Test suite (NEW)
│   └── detail.js               # Update to include DNA
├── css/
│   └── components.css          # Add DNA styles
└── detail.html                 # Add DNA container
```

---

## 8. Implementation Phases

### Phase 1: Core Foundation (MVP)

**Estimated Scope:** Core DNA generation and display

#### Tasks

- [ ] **1.1** Create `DNAGenerator.js` with seeded PRNG
- [ ] **1.2** Implement basic shape drawing (circle, polygon)
- [ ] **1.3** Create language-based color palette system
- [ ] **1.4** Implement size/rotation calculations
- [ ] **1.5** Create `RepoDNA.js` component wrapper
- [ ] **1.6** Add DNA section to `detail.html`
- [ ] **1.7** Integrate into `detail.js`
- [ ] **1.8** Add basic CSS styles
- [ ] **1.9** Write unit tests for generator

#### Deliverables
- DNA visualization on detail page
- Deterministic rendering (same repo = same DNA)
- Basic download functionality

---

### Phase 2: Visual Enhancement

**Estimated Scope:** Polish and advanced visuals

#### Tasks

- [ ] **2.1** Add complexity layers algorithm
- [ ] **2.2** Implement activity rings based on commit data
- [ ] **2.3** Add glowing center core effect
- [ ] **2.4** Implement accent decorations
- [ ] **2.5** Add theme-aware adjustments (light/dark)
- [ ] **2.6** Optimize canvas rendering performance
- [ ] **2.7** Add high-DPI (retina) canvas support
- [ ] **2.8** Expand language palette coverage (20+ languages)

#### Deliverables
- Richer, more detailed visualizations
- Theme integration
- High-quality rendering on all displays

---

### Phase 3: Social Features

**Estimated Scope:** Sharing and export capabilities

#### Tasks

- [ ] **3.1** Implement social share image generation (OG format)
- [ ] **3.2** Add "Copy DNA" to clipboard functionality
- [ ] **3.3** Create DNA comparison view for Compare page
- [ ] **3.4** Add DNA tooltip preview on hover (cards)
- [ ] **3.5** Implement DNA caching in memory
- [ ] **3.6** Add share button with platform options

#### Deliverables
- Easy sharing to social media
- DNA visible in multiple contexts
- Performance optimization via caching

---

### Phase 4: Gamification (Optional)

**Estimated Scope:** Collection and achievements

#### Tasks

- [ ] **4.1** Add "DNA Gallery" view to Favorites page
- [ ] **4.2** Implement DNA collection achievements
- [ ] **4.3** Add "Rare DNA" indicators for unusual patterns
- [ ] **4.4** Create DNA similarity matching algorithm
- [ ] **4.5** Add "Find similar DNA" recommendation feature

#### Deliverables
- DNA collection mechanics
- Gamification elements
- Discovery features based on visual similarity

---

## 9. Testing Strategy

### 9.1 Unit Tests

```javascript
// src/js/__tests__/RepoDNA.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { DNAGenerator } from '../components/DNAGenerator.js';
import { createRepoDNA } from '../components/RepoDNA.js';

describe('DNAGenerator', () => {
  const mockRepo = {
    id: 12345,
    full_name: 'owner/repo',
    language: 'JavaScript',
    stargazers_count: 1000,
    forks_count: 100,
    subscribers_count: 50,
    open_issues_count: 25,
    created_at: '2020-01-01T00:00:00Z',
    pushed_at: '2024-01-01T00:00:00Z'
  };

  const mockLanguages = {
    JavaScript: 50000,
    TypeScript: 30000,
    CSS: 10000
  };

  describe('Determinism', () => {
    it('should generate identical output for same input', () => {
      const gen1 = new DNAGenerator(mockRepo, mockLanguages, null);
      const gen2 = new DNAGenerator(mockRepo, mockLanguages, null);

      expect(gen1.calculateParams()).toEqual(gen2.calculateParams());
    });

    it('should generate different output for different repos', () => {
      const gen1 = new DNAGenerator(mockRepo, mockLanguages, null);
      const gen2 = new DNAGenerator({ ...mockRepo, id: 99999 }, mockLanguages, null);

      expect(gen1.seed).not.toEqual(gen2.seed);
    });
  });

  describe('Parameter Calculation', () => {
    it('should select shape based on language count', () => {
      const gen = new DNAGenerator(mockRepo, mockLanguages, null);
      const params = gen.calculateParams();

      expect(params.shape).toBe('triangle'); // 3 languages
    });

    it('should use correct palette for primary language', () => {
      const gen = new DNAGenerator(mockRepo, mockLanguages, null);
      const params = gen.calculateParams();

      expect(params.palette.primary).toBe('#F7DF1E'); // JavaScript yellow
    });

    it('should scale size logarithmically with stars', () => {
      const smallRepo = { ...mockRepo, stargazers_count: 10 };
      const largeRepo = { ...mockRepo, stargazers_count: 100000 };

      const smallGen = new DNAGenerator(smallRepo, mockLanguages, null);
      const largeGen = new DNAGenerator(largeRepo, mockLanguages, null);

      expect(largeGen.calculateParams().size).toBeGreaterThan(
        smallGen.calculateParams().size
      );
    });
  });

  describe('Canvas Rendering', () => {
    it('should render without errors', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 400;

      const gen = new DNAGenerator(mockRepo, mockLanguages, null);

      expect(() => gen.render(canvas)).not.toThrow();
    });
  });
});

describe('createRepoDNA', () => {
  it('should create container with canvas', () => {
    const element = createRepoDNA(mockRepo, mockLanguages);

    expect(element.querySelector('canvas')).toBeTruthy();
    expect(element.classList.contains('repo-dna')).toBe(true);
  });

  it('should include download button by default', () => {
    const element = createRepoDNA(mockRepo, mockLanguages);

    expect(element.querySelector('.repo-dna__download')).toBeTruthy();
  });

  it('should respect showDownload option', () => {
    const element = createRepoDNA(mockRepo, mockLanguages, null, {
      showDownload: false
    });

    expect(element.querySelector('.repo-dna__download')).toBeFalsy();
  });
});
```

### 9.2 Visual Regression Tests (Manual)

Create a test page with multiple DNA visualizations:

| Test Case | Repo Characteristics |
|-----------|---------------------|
| Single language | JavaScript only |
| Many languages | 10+ languages |
| New repo | Created this week |
| Old repo | Created 10+ years ago |
| Popular repo | 100k+ stars |
| Inactive repo | No commits in 1 year |
| Active repo | Daily commits |

### 9.3 Performance Tests

```javascript
describe('Performance', () => {
  it('should render in under 100ms', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 400;

    const gen = new DNAGenerator(mockRepo, mockLanguages, null);

    const start = performance.now();
    gen.render(canvas);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(100);
  });
});
```

---

## 10. Performance Considerations

### 10.1 Rendering Optimization

1. **Offscreen Canvas:** Render to offscreen canvas, then copy to visible
2. **Caching:** Cache generated data URLs by repo ID
3. **Lazy Loading:** Only generate DNA when section is visible
4. **Resolution Scaling:** Use lower resolution for thumbnails

### 10.2 Memory Management

```javascript
// DNA cache with LRU eviction
const dnaCache = new Map();
const MAX_CACHE_SIZE = 20;

function getCachedDNA(repoId, generator, canvas) {
  if (dnaCache.has(repoId)) {
    return dnaCache.get(repoId);
  }

  const dataUrl = generator.render(canvas);

  // LRU eviction
  if (dnaCache.size >= MAX_CACHE_SIZE) {
    const firstKey = dnaCache.keys().next().value;
    dnaCache.delete(firstKey);
  }

  dnaCache.set(repoId, dataUrl);
  return dataUrl;
}
```

### 10.3 Bundle Size

- No external dependencies (vanilla Canvas API)
- Estimated addition: ~5KB minified
- Color palettes can be lazy-loaded if needed

---

## 11. Accessibility

### 11.1 ARIA Support

```html
<canvas
  role="img"
  aria-label="DNA visualization for facebook/react showing 5 languages, high activity, and 200k stars"
></canvas>
```

### 11.2 Screen Reader Description

Generate meaningful alt text:

```javascript
function generateAltText(repo, params) {
  const languageCount = Object.keys(languages).length;
  const activity = params.activity > 0.7 ? 'high' : params.activity > 0.3 ? 'moderate' : 'low';
  const stars = formatNumber(repo.stargazers_count);

  return `DNA visualization for ${repo.full_name} showing ${languageCount} languages, ${activity} activity, and ${stars} stars`;
}
```

### 11.3 Reduced Motion

```javascript
// Skip animations if user prefers reduced motion
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  // Add subtle pulse animation
}
```

---

## 12. Future Enhancements

### 12.1 Animation (Phase 5+)

- Subtle pulse animation based on activity level
- Particle effects for very active repos
- Morphing animation when comparing DNAs

### 12.2 3D Visualization

- WebGL-based 3D DNA helix
- Interactive rotation with mouse/touch
- VR/AR support for immersive viewing

### 12.3 AI-Enhanced Generation

- Use ML to detect visual patterns users prefer
- Personalized DNA style preferences
- Similar DNA recommendation engine

### 12.4 Integration Points

- GitHub Profile README embed
- Share to Twitter/LinkedIn with preview
- API endpoint for external embedding
- Browser extension showing DNA on github.com

---

## Appendix A: Complete Color Palette Reference

```javascript
export const LANGUAGE_PALETTES = {
  // Systems Programming
  'Rust':         { primary: '#DEA584', secondary: '#B7410E', accent: '#FFD700' },
  'C':            { primary: '#555555', secondary: '#A8B9CC', accent: '#F0F0F0' },
  'C++':          { primary: '#F34B7D', secondary: '#00599C', accent: '#FFFFFF' },
  'Go':           { primary: '#00ADD8', secondary: '#5DC9E2', accent: '#FFFFFF' },
  'Zig':          { primary: '#F7A41D', secondary: '#1E1E1E', accent: '#FFFFFF' },

  // Web & Scripting
  'JavaScript':   { primary: '#F7DF1E', secondary: '#323330', accent: '#FFFFFF' },
  'TypeScript':   { primary: '#3178C6', secondary: '#235A97', accent: '#FFFFFF' },
  'Python':       { primary: '#3776AB', secondary: '#FFD43B', accent: '#FFFFFF' },
  'Ruby':         { primary: '#CC342D', secondary: '#701516', accent: '#FFFFFF' },
  'PHP':          { primary: '#777BB4', secondary: '#4F5B93', accent: '#FFFFFF' },
  'Perl':         { primary: '#39457E', secondary: '#0073A1', accent: '#FFFFFF' },

  // JVM Languages
  'Java':         { primary: '#B07219', secondary: '#E76F00', accent: '#FFFFFF' },
  'Kotlin':       { primary: '#A97BFF', secondary: '#7F52FF', accent: '#FFFFFF' },
  'Scala':        { primary: '#DC322F', secondary: '#002B36', accent: '#FFFFFF' },
  'Clojure':      { primary: '#DB5855', secondary: '#63B132', accent: '#FFFFFF' },

  // Functional
  'Haskell':      { primary: '#5D4F85', secondary: '#8F4E8B', accent: '#FFFFFF' },
  'Elixir':       { primary: '#6E4A7E', secondary: '#4B275F', accent: '#FFFFFF' },
  'Erlang':       { primary: '#B83998', secondary: '#A90533', accent: '#FFFFFF' },
  'F#':           { primary: '#B845FC', secondary: '#378BBA', accent: '#FFFFFF' },
  'OCaml':        { primary: '#3BE133', secondary: '#EE6A1A', accent: '#FFFFFF' },

  // Mobile
  'Swift':        { primary: '#F05138', secondary: '#FFAC45', accent: '#FFFFFF' },
  'Objective-C':  { primary: '#438EFF', secondary: '#6866FB', accent: '#FFFFFF' },
  'Dart':         { primary: '#00B4AB', secondary: '#0175C2', accent: '#FFFFFF' },

  // Data Science
  'R':            { primary: '#198CE7', secondary: '#75AADB', accent: '#FFFFFF' },
  'Julia':        { primary: '#9558B2', secondary: '#389826', accent: '#CB3C33' },
  'MATLAB':       { primary: '#E16737', secondary: '#0076A8', accent: '#FFFFFF' },

  // Shell & Config
  'Shell':        { primary: '#89E051', secondary: '#4EAA25', accent: '#FFFFFF' },
  'PowerShell':   { primary: '#012456', secondary: '#5391FE', accent: '#FFFFFF' },
  'Dockerfile':   { primary: '#384D54', secondary: '#2496ED', accent: '#FFFFFF' },

  // Markup & Style
  'HTML':         { primary: '#E34C26', secondary: '#F06529', accent: '#FFFFFF' },
  'CSS':          { primary: '#563D7C', secondary: '#264DE4', accent: '#FFFFFF' },
  'SCSS':         { primary: '#C6538C', secondary: '#BF4080', accent: '#FFFFFF' },

  // Other
  'Lua':          { primary: '#000080', secondary: '#00007F', accent: '#FFFFFF' },
  'Vim script':   { primary: '#199F4B', secondary: '#019833', accent: '#FFFFFF' },
  'Assembly':     { primary: '#6E4C13', secondary: '#4D3B10', accent: '#FFFFFF' },

  // Default fallback
  'default':      { primary: '#6B7280', secondary: '#9CA3AF', accent: '#FFFFFF' }
};
```

---

## Appendix B: Shape Variants

```javascript
export const SHAPE_CONFIGS = {
  circle: {
    sides: 0, // Special case
    smoothness: 1.0,
    symmetry: 'radial'
  },
  vesica: {
    sides: 2, // Two overlapping circles
    smoothness: 1.0,
    symmetry: 'bilateral'
  },
  triangle: {
    sides: 3,
    smoothness: 0.8,
    symmetry: 'rotational-3'
  },
  square: {
    sides: 4,
    smoothness: 0.6,
    symmetry: 'rotational-4'
  },
  pentagon: {
    sides: 5,
    smoothness: 0.7,
    symmetry: 'rotational-5'
  },
  hexagon: {
    sides: 6,
    smoothness: 0.8,
    symmetry: 'rotational-6'
  }
};
```

---

*Implementation Plan created by Claude Code - December 30, 2025*
