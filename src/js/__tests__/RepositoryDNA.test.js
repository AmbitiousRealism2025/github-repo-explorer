import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createSeededRandom,
  generateSeed,
  generateDNAData,
  generateDNADescription
} from '../components/RepositoryDNA/DNAGenerator.js';
import {
  getLanguageColor,
  getComplementaryColor,
  lightenColor,
  darkenColor,
  hexToRgba,
  LANGUAGE_COLORS
} from '../components/RepositoryDNA/colors.js';

// Mock repo data
const mockRepo = {
  id: 12345,
  full_name: 'facebook/react',
  created_at: '2013-05-24T16:15:54Z',
  pushed_at: '2024-12-30T10:00:00Z',
  updated_at: '2024-12-30T10:00:00Z',
  language: 'JavaScript',
  stargazers_count: 218000,
  forks_count: 45000,
  open_issues_count: 1500,
};

const mockRepoSmall = {
  id: 67890,
  full_name: 'user/tiny-project',
  created_at: '2024-06-01T10:00:00Z',
  pushed_at: '2024-12-29T10:00:00Z',
  updated_at: '2024-12-29T10:00:00Z',
  language: 'Python',
  stargazers_count: 5,
  forks_count: 1,
  open_issues_count: 0,
};

describe('DNAGenerator', () => {
  describe('createSeededRandom', () => {
    it('should generate deterministic random numbers', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(12345);

      // Same seed should produce same sequence
      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
      expect(random1()).toBe(random2());
    });

    it('should generate different numbers for different seeds', () => {
      const random1 = createSeededRandom(12345);
      const random2 = createSeededRandom(54321);

      expect(random1()).not.toBe(random2());
    });

    it('should generate numbers between 0 and 1', () => {
      const random = createSeededRandom(12345);

      for (let i = 0; i < 100; i++) {
        const value = random();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });
  });

  describe('generateSeed', () => {
    it('should generate a consistent seed for the same repo', () => {
      const seed1 = generateSeed(mockRepo);
      const seed2 = generateSeed(mockRepo);

      expect(seed1).toBe(seed2);
    });

    it('should generate different seeds for different repos', () => {
      const seed1 = generateSeed(mockRepo);
      const seed2 = generateSeed(mockRepoSmall);

      expect(seed1).not.toBe(seed2);
    });

    it('should return a positive number', () => {
      const seed = generateSeed(mockRepo);

      expect(seed).toBeGreaterThan(0);
      expect(Number.isInteger(seed)).toBe(true);
    });
  });

  describe('generateDNAData', () => {
    it('should generate complete DNA data structure', () => {
      const dnaData = generateDNAData(mockRepo);

      expect(dnaData).toHaveProperty('seed');
      expect(dnaData).toHaveProperty('repoId', mockRepo.id);
      expect(dnaData).toHaveProperty('repoName', mockRepo.full_name);
      expect(dnaData).toHaveProperty('geometry');
      expect(dnaData).toHaveProperty('colors');
      expect(dnaData).toHaveProperty('pattern');
      expect(dnaData).toHaveProperty('animation');
      expect(dnaData).toHaveProperty('metadata');
    });

    it('should generate consistent DNA for the same repo', () => {
      const dnaData1 = generateDNAData(mockRepo);
      const dnaData2 = generateDNAData(mockRepo);

      expect(dnaData1.seed).toBe(dnaData2.seed);
      expect(dnaData1.geometry).toEqual(dnaData2.geometry);
      expect(dnaData1.colors).toEqual(dnaData2.colors);
      expect(dnaData1.pattern).toEqual(dnaData2.pattern);
    });

    it('should have correct geometry for large repo', () => {
      const dnaData = generateDNAData(mockRepo);

      // High star count should result in larger radius
      expect(dnaData.geometry.radius).toBeGreaterThan(60);
      expect(dnaData.geometry.sides).toBeGreaterThanOrEqual(3);
      expect(dnaData.geometry.sides).toBeLessThanOrEqual(12);
    });

    it('should have lower density for small repo', () => {
      const dnaData = generateDNAData(mockRepoSmall);

      expect(dnaData.pattern.density).toBeLessThanOrEqual(2);
    });

    it('should have high pulse intensity for recently pushed repo', () => {
      const recentRepo = {
        ...mockRepoSmall,
        pushed_at: new Date().toISOString(), // Just now
      };
      const dnaData = generateDNAData(recentRepo);

      expect(dnaData.animation.pulseIntensity).toBeGreaterThanOrEqual(0.8);
    });

    it('should use primary language for colors', () => {
      const dnaData = generateDNAData(mockRepo);

      expect(dnaData.metadata.language).toBe('JavaScript');
      // JavaScript color should be yellow-ish
      expect(dnaData.colors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should use language data when provided', () => {
      const languages = {
        JavaScript: 50000,
        TypeScript: 30000,
        CSS: 10000,
      };
      const dnaData = generateDNAData(mockRepo, { languages });

      expect(dnaData.metadata.languageCount).toBe(3);
    });
  });

  describe('generateDNADescription', () => {
    it('should generate human-readable description', () => {
      const dnaData = generateDNAData(mockRepo);
      const description = generateDNADescription(dnaData);

      expect(description).toContain('facebook/react');
      expect(description).toContain('JavaScript');
      expect(description).toMatch(/\d+ stars/);
    });

    it('should include shape name', () => {
      const dnaData = generateDNAData(mockRepo);
      const description = generateDNADescription(dnaData);

      // Should contain a shape name
      expect(description).toMatch(/(triangle|square|pentagon|hexagon|heptagon|octagon|nonagon|decagon|hendecagon|dodecagon|\d+-sided polygon)/);
    });
  });
});

describe('Colors Module', () => {
  describe('getLanguageColor', () => {
    it('should return colors for known languages', () => {
      const jsColors = getLanguageColor('JavaScript');
      expect(jsColors).toHaveProperty('primary');
      expect(jsColors).toHaveProperty('secondary');
      expect(jsColors.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should handle case-insensitive matches', () => {
      const colors1 = getLanguageColor('javascript');
      const colors2 = getLanguageColor('JavaScript');

      expect(colors1.primary).toBe(colors2.primary);
    });

    it('should return Unknown colors for unknown languages', () => {
      const colors = getLanguageColor('MadeUpLanguage');

      expect(colors).toEqual(LANGUAGE_COLORS.Unknown);
    });

    it('should handle common abbreviations', () => {
      const jsColors = getLanguageColor('js');
      expect(jsColors).toEqual(LANGUAGE_COLORS.JavaScript);
    });

    it('should handle null/undefined gracefully', () => {
      const colors1 = getLanguageColor(null);
      const colors2 = getLanguageColor(undefined);

      expect(colors1).toEqual(LANGUAGE_COLORS.Unknown);
      expect(colors2).toEqual(LANGUAGE_COLORS.Unknown);
    });
  });

  describe('getComplementaryColor', () => {
    it('should return a valid hex color', () => {
      const complementary = getComplementaryColor('#ff0000');

      expect(complementary).toMatch(/^#[0-9a-fA-F]{6}$/);
    });

    it('should return different color than input', () => {
      const original = '#ff0000';
      const complementary = getComplementaryColor(original);

      expect(complementary).not.toBe(original);
    });
  });

  describe('lightenColor', () => {
    it('should return a lighter color', () => {
      const original = '#800000';
      const lighter = lightenColor(original, 0.5);

      // Red channel should be higher
      const originalRed = parseInt(original.slice(1, 3), 16);
      const lighterRed = parseInt(lighter.slice(1, 3), 16);

      expect(lighterRed).toBeGreaterThan(originalRed);
    });

    it('should not exceed #ffffff', () => {
      const lighter = lightenColor('#ffffff', 0.5);

      expect(lighter).toBe('#ffffff');
    });
  });

  describe('darkenColor', () => {
    it('should return a darker color', () => {
      const original = '#ff8080';
      const darker = darkenColor(original, 0.5);

      const originalRed = parseInt(original.slice(1, 3), 16);
      const darkerRed = parseInt(darker.slice(1, 3), 16);

      expect(darkerRed).toBeLessThan(originalRed);
    });
  });

  describe('hexToRgba', () => {
    it('should convert hex to rgba', () => {
      const rgba = hexToRgba('#ff0000', 0.5);

      expect(rgba).toBe('rgba(255, 0, 0, 0.5)');
    });

    it('should handle different colors', () => {
      const rgba = hexToRgba('#00ff00', 1);

      expect(rgba).toBe('rgba(0, 255, 0, 1)');
    });
  });
});

describe('DNA Component Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Mock window.matchMedia
    vi.stubGlobal('matchMedia', vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })));
  });

  it('should create DNA component successfully', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo);

    expect(element).toBeInstanceOf(HTMLElement);
    expect(element.classList.contains('repo-dna')).toBe(true);
  });

  it('should include canvas element', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo);

    const canvas = element.querySelector('canvas');
    expect(canvas).not.toBeNull();
    expect(canvas.getAttribute('role')).toBe('img');
  });

  it('should have accessibility attributes', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo);

    const canvas = element.querySelector('canvas');
    expect(canvas.getAttribute('aria-label')).toContain('facebook/react');
  });

  it('should store DNA data on element', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo);

    expect(element._dnaData).toBeDefined();
    expect(element._dnaData.repoId).toBe(mockRepo.id);
  });

  it('should show action buttons when showActions is true', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo, { showActions: true });

    const downloadBtn = element.querySelector('[data-action="download"]');
    const copyBtn = element.querySelector('[data-action="copy"]');

    expect(downloadBtn).not.toBeNull();
    expect(copyBtn).not.toBeNull();
  });

  it('should hide action buttons when showActions is false', async () => {
    const { createRepositoryDNA } = await import('../components/RepositoryDNA/index.js');
    const element = createRepositoryDNA(mockRepo, { showActions: false });

    const downloadBtn = element.querySelector('[data-action="download"]');
    expect(downloadBtn).toBeNull();
  });

  it('should create mini badge correctly', async () => {
    const { createDNABadge } = await import('../components/RepositoryDNA/index.js');
    const badge = createDNABadge(mockRepo, 40);

    expect(badge.classList.contains('repo-dna-badge')).toBe(true);
    expect(badge.style.width).toBe('40px');
    expect(badge.style.height).toBe('40px');
  });
});

describe('DNA Canvas Rendering', () => {
  // Note: jsdom doesn't support canvas 2D context, so we test what we can
  it('should create canvas with correct size', async () => {
    const { createDNACanvas } = await import('../components/RepositoryDNA/DNARenderer.js');
    const dnaData = generateDNAData(mockRepo);

    const canvas = createDNACanvas(dnaData, 200);

    expect(canvas.width).toBe(200);
    expect(canvas.height).toBe(200);
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should render to export size', async () => {
    const { renderForExport } = await import('../components/RepositoryDNA/DNARenderer.js');
    const dnaData = generateDNAData(mockRepo);

    const canvas = renderForExport(dnaData, 800);

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(800);
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should render social share with correct dimensions', async () => {
    const { renderForSocialShare } = await import('../components/RepositoryDNA/DNARenderer.js');
    const dnaData = generateDNAData(mockRepo);

    const canvas = renderForSocialShare(dnaData, { width: 1200, height: 630 });

    expect(canvas.width).toBe(1200);
    expect(canvas.height).toBe(630);
    expect(canvas.tagName).toBe('CANVAS');
  });

  it('should create animated canvas with controls', async () => {
    const { createAnimatedDNACanvas } = await import('../components/RepositoryDNA/DNARenderer.js');
    const dnaData = generateDNAData(mockRepo);

    const result = createAnimatedDNACanvas(dnaData, 200);

    expect(result.canvas).toBeDefined();
    expect(result.canvas.width).toBe(200);
    expect(typeof result.stop).toBe('function');
    expect(typeof result.start).toBe('function');

    // Clean up
    result.stop();
  });
});

describe('DNA Exporter', () => {
  it('should return canvas from renderForExport', async () => {
    const { renderForExport } = await import('../components/RepositoryDNA/DNARenderer.js');
    const dnaData = generateDNAData(mockRepo);

    const canvas = renderForExport(dnaData, 100);

    expect(canvas.tagName).toBe('CANVAS');
    expect(canvas.width).toBe(100);
    // Note: jsdom doesn't fully support toDataURL, so we just verify the canvas exists
  });

  describe('DNACache', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should cache and retrieve DNA', async () => {
      const { DNACache } = await import('../components/RepositoryDNA/DNAExporter.js');
      const testUrl = 'data:image/png;base64,test';

      DNACache.set(123, testUrl);
      const cached = DNACache.get(123);

      expect(cached).toBe(testUrl);
    });

    it('should return null for uncached repo', async () => {
      const { DNACache } = await import('../components/RepositoryDNA/DNAExporter.js');

      const cached = DNACache.get(99999);

      expect(cached).toBeNull();
    });

    it('should clear cache', async () => {
      const { DNACache } = await import('../components/RepositoryDNA/DNAExporter.js');

      DNACache.set(123, 'test');
      DNACache.clear();
      const cached = DNACache.get(123);

      expect(cached).toBeNull();
    });
  });
});
