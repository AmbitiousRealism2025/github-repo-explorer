/**
 * DNAGenerator Module
 * Generates deterministic DNA data from repository attributes using a seeded PRNG.
 *
 * @module components/RepositoryDNA/DNAGenerator
 */

import { LANGUAGE_COLORS, getLanguageColor, getComplementaryColor, generateColorFamily } from './colors.js';
import { getLanguageShape, getShapeMetadata, SHAPE_TYPES } from './shapes.js';

/**
 * Mulberry32 - A simple seeded PRNG
 * @param {number} seed - The seed value
 * @returns {function(): number} - Function that returns pseudo-random numbers between 0-1
 */
export function createSeededRandom(seed) {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Generate a numeric seed from repository data
 * Uses a simple hash function for determinism
 * @param {Object} repo - Repository data object
 * @returns {number} - Numeric seed value
 */
export function generateSeed(repo) {
  const str = `${repo.id}-${repo.full_name}-${repo.created_at}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Calculate radius based on star count (logarithmic scale)
 * UPDATED: Larger base size, smaller variance
 * @param {number} stars - Number of stars
 * @returns {number} - Radius value (65-85)
 */
function calculateRadius(stars) {
  const MIN_RADIUS = 65;  // Increased from 30
  const MAX_RADIUS = 85;  // Increased from 80, tighter range

  if (stars === 0) return MIN_RADIUS;

  // Logarithmic scaling: 1 star = 65, 1M stars = 85
  const logStars = Math.log10(stars + 1);
  const normalized = Math.min(logStars / 6, 1); // 6 = log10(1,000,000)

  return MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * normalized;
}

/**
 * Calculate star-based glow intensity for perimeter pulse
 * @param {number} stars - Number of stars
 * @returns {Object} - Glow configuration
 */
function calculateStarGlow(stars) {
  // Tiers based on star count
  if (stars < 100) {
    return { intensity: 0.2, pulseSpeed: 4000, glowSize: 8 };
  } else if (stars < 1000) {
    return { intensity: 0.4, pulseSpeed: 3500, glowSize: 12 };
  } else if (stars < 10000) {
    return { intensity: 0.6, pulseSpeed: 3000, glowSize: 16 };
  } else if (stars < 100000) {
    return { intensity: 0.8, pulseSpeed: 2500, glowSize: 22 };
  } else {
    return { intensity: 1.0, pulseSpeed: 2000, glowSize: 30 };
  }
}

/**
 * Calculate rotation based on repository age
 * @param {string} createdAt - ISO date string of repo creation
 * @returns {number} - Rotation in degrees (0-360)
 */
function calculateRotation(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const ageInDays = (now - created) / (1000 * 60 * 60 * 24);

  // 10 years = full rotation, scaled logarithmically
  const maxAge = 365 * 10;
  const normalized = Math.min(ageInDays / maxAge, 1);

  return normalized * 360;
}

/**
 * Calculate pattern density based on contributor/fork count
 * @param {number} forks - Number of forks (proxy for contributors)
 * @returns {number} - Density level (1-5)
 */
function calculateDensity(forks) {
  if (forks < 10) return 1;
  if (forks < 50) return 2;
  if (forks < 200) return 3;
  if (forks < 1000) return 4;
  return 5;
}

/**
 * Calculate animation pulse intensity based on recent activity
 * @param {string} pushedAt - ISO date string of last push
 * @returns {number} - Pulse intensity (0-1)
 */
function calculatePulseIntensity(pushedAt) {
  const lastPush = new Date(pushedAt);
  const now = new Date();
  const daysSincePush = (now - lastPush) / (1000 * 60 * 60 * 24);

  // Active in last day = 1.0, 30+ days ago = 0.1
  if (daysSincePush < 1) return 1.0;
  if (daysSincePush < 7) return 0.8;
  if (daysSincePush < 30) return 0.5;
  if (daysSincePush < 90) return 0.3;
  return 0.1;
}

/**
 * Calculate complexity based on multiple factors
 * @param {Object} repo - Repository data
 * @returns {number} - Complexity level (1-5)
 */
function calculateComplexity(repo) {
  let score = 0;

  // Stars contribute
  if (repo.stargazers_count > 100) score += 1;
  if (repo.stargazers_count > 1000) score += 1;

  // Forks contribute
  if (repo.forks_count > 50) score += 1;
  if (repo.forks_count > 500) score += 1;

  // Issues indicate active development
  if (repo.open_issues_count > 10) score += 1;

  return Math.max(1, Math.min(5, score));
}

/**
 * Generate complete DNA data structure from repository
 * @param {Object} repo - Repository data object
 * @param {Object} [options] - Additional options
 * @param {Object} [options.languages] - Language breakdown from API
 * @returns {Object} - Complete DNA data structure
 */
export function generateDNAData(repo, options = {}) {
  const seed = generateSeed(repo);
  const random = createSeededRandom(seed);

  // Get language info
  const languages = options.languages || {};
  const languageCount = Object.keys(languages).length || 1;
  const primaryLanguage = repo.language || 'Unknown';

  // Get base colors and generate full color family
  const baseColors = getLanguageColor(primaryLanguage);
  const colorFamily = generateColorFamily(baseColors.primary, repo);
  const complementary = getComplementaryColor(baseColors.primary);

  // Get language-based shape
  const shapeType = getLanguageShape(primaryLanguage);
  const shapeMeta = getShapeMetadata(shapeType);

  // Calculate geometry
  const radius = calculateRadius(repo.stargazers_count || 0);
  const rotation = calculateRotation(repo.created_at);

  // Calculate star-based glow effect
  const starGlow = calculateStarGlow(repo.stargazers_count || 0);

  // Calculate pattern attributes
  const density = calculateDensity(repo.forks_count || 0);
  const complexity = calculateComplexity(repo);
  const layers = Math.min(2 + Math.floor(complexity / 2), 5);

  // Calculate animation
  const pulseIntensity = calculatePulseIntensity(repo.pushed_at || repo.updated_at);

  // Generate some random variations using seeded PRNG
  const variations = {
    innerRotation: random() * 30 - 15, // -15 to +15 degrees
    patternOffset: random() * 10,
    glowSpread: 10 + random() * 20,
  };

  // Extract additional metadata
  const ownerType = repo.owner?.type || 'User';
  const license = repo.license?.spdx_id || repo.license?.name || 'none';

  return {
    seed,
    repoId: repo.id,
    repoName: repo.full_name,
    geometry: {
      shapeType,
      shapeName: shapeMeta.name,
      sides: shapeMeta.sides,
      radius,
      rotation,
      innerRotation: variations.innerRotation,
    },
    // Star-based perimeter glow effect
    starGlow: {
      intensity: starGlow.intensity,
      pulseSpeed: starGlow.pulseSpeed,
      glowSize: starGlow.glowSize,
    },
    // Use enhanced color family instead of basic colors
    colors: {
      primary: colorFamily.primary,
      secondary: colorFamily.secondary,
      tertiary: colorFamily.tertiary,
      accent: complementary,
      background: baseColors.background || adjustAlpha(colorFamily.primary, 0.1),
      // Bio-circuit specific colors
      trace: colorFamily.trace,
      traceAlpha: colorFamily.traceAlpha,
      node: colorFamily.node,
      glow: colorFamily.glow,
      bridge: colorFamily.bridge,
      ambient: colorFamily.ambient,
      ambientAlpha: colorFamily.ambientAlpha,
      rail: colorFamily.rail,
      dot: colorFamily.dot,
    },
    pattern: {
      density,
      complexity,
      layers,
      offset: variations.patternOffset,
    },
    animation: {
      pulseIntensity,
      speed: 2000 + (1 - pulseIntensity) * 2000, // 2-4 seconds
      glowSpread: variations.glowSpread,
    },
    metadata: {
      language: primaryLanguage,
      languageCount,
      stars: repo.stargazers_count || 0,
      forks: repo.forks_count || 0,
      ownerType,
      license,
    }
  };
}

/**
 * Adjust alpha value of a hex color
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} - RGBA color string
 */
function adjustAlpha(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generate a text description of the DNA for accessibility
 * @param {Object} dnaData - DNA data structure
 * @returns {string} - Human-readable description
 */
export function generateDNADescription(dnaData) {
  const shapeNames = {
    3: 'triangle',
    4: 'square',
    5: 'pentagon',
    6: 'hexagon',
    7: 'heptagon',
    8: 'octagon',
    9: 'nonagon',
    10: 'decagon',
    11: 'hendecagon',
    12: 'dodecagon',
  };

  const shapeName = shapeNames[dnaData.geometry.sides] || `${dnaData.geometry.sides}-sided polygon`;
  const densityDesc = ['minimal', 'light', 'moderate', 'dense', 'complex'][dnaData.pattern.density - 1];

  return `Repository DNA for ${dnaData.repoName}: ${shapeName} shape with ${densityDesc} pattern, ` +
    `${dnaData.metadata.language} color palette, ${dnaData.metadata.stars.toLocaleString()} stars`;
}
