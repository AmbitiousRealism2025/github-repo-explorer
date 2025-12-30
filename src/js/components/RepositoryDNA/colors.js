/**
 * Language Color Mappings
 * Based on GitHub's linguist colors with additional secondary/background colors
 *
 * @module components/RepositoryDNA/colors
 */

/**
 * Comprehensive language color palette
 * Primary colors match GitHub's linguist where possible
 */
export const LANGUAGE_COLORS = {
  // Web Languages
  JavaScript: { primary: '#f7df1e', secondary: '#d4c41a', background: '#fefce8' },
  TypeScript: { primary: '#3178c6', secondary: '#2563a1', background: '#eff6ff' },
  HTML: { primary: '#e34c26', secondary: '#c9411e', background: '#fef2f2' },
  CSS: { primary: '#563d7c', secondary: '#452f65', background: '#f5f3ff' },
  SCSS: { primary: '#c6538c', secondary: '#a84373', background: '#fdf2f8' },
  Vue: { primary: '#41b883', secondary: '#359469', background: '#ecfdf5' },
  Svelte: { primary: '#ff3e00', secondary: '#e03600', background: '#fff7ed' },

  // Systems Languages
  Rust: { primary: '#dea584', secondary: '#c4916e', background: '#fef3ee' },
  Go: { primary: '#00ADD8', secondary: '#0091b5', background: '#ecfeff' },
  C: { primary: '#555555', secondary: '#3d3d3d', background: '#f5f5f5' },
  'C++': { primary: '#f34b7d', secondary: '#d93d69', background: '#fdf2f8' },
  'C#': { primary: '#178600', secondary: '#126e00', background: '#f0fdf4' },
  Zig: { primary: '#ec915c', secondary: '#d47d48', background: '#fff7ed' },

  // Scripting Languages
  Python: { primary: '#3572A5', secondary: '#2b5c87', background: '#eff6ff' },
  Ruby: { primary: '#701516', secondary: '#5a1112', background: '#fef2f2' },
  PHP: { primary: '#4F5D95', secondary: '#3f4a77', background: '#eef2ff' },
  Perl: { primary: '#0298c3', secondary: '#027aa0', background: '#ecfeff' },
  Lua: { primary: '#000080', secondary: '#000066', background: '#eef2ff' },

  // JVM Languages
  Java: { primary: '#b07219', secondary: '#8f5c14', background: '#fef3c7' },
  Kotlin: { primary: '#A97BFF', secondary: '#8a5de6', background: '#faf5ff' },
  Scala: { primary: '#c22d40', secondary: '#a12433', background: '#fef2f2' },
  Clojure: { primary: '#db5855', secondary: '#c44542', background: '#fef2f2' },
  Groovy: { primary: '#4298b8', secondary: '#357a96', background: '#ecfeff' },

  // Mobile
  Swift: { primary: '#F05138', secondary: '#d8432c', background: '#fef2f2' },
  'Objective-C': { primary: '#438eff', secondary: '#2b73e6', background: '#eff6ff' },
  Dart: { primary: '#00B4AB', secondary: '#009189', background: '#ecfdf5' },

  // Functional Languages
  Haskell: { primary: '#5e5086', secondary: '#4a3f6b', background: '#f5f3ff' },
  Elixir: { primary: '#6e4a7e', secondary: '#583b65', background: '#faf5ff' },
  Erlang: { primary: '#B83998', secondary: '#962d7a', background: '#fdf4ff' },
  OCaml: { primary: '#3be133', secondary: '#2fb828', background: '#f0fdf4' },
  'F#': { primary: '#b845fc', secondary: '#9a37e0', background: '#faf5ff' },

  // Data & ML
  R: { primary: '#198CE7', secondary: '#1474c4', background: '#eff6ff' },
  Julia: { primary: '#a270ba', secondary: '#855998', background: '#faf5ff' },
  MATLAB: { primary: '#e16737', secondary: '#c4562c', background: '#fff7ed' },
  Jupyter: { primary: '#F37626', secondary: '#d9651f', background: '#fff7ed' },

  // Shell & Config
  Shell: { primary: '#89e051', secondary: '#6fc93d', background: '#f0fdf4' },
  PowerShell: { primary: '#012456', secondary: '#011a3d', background: '#eef2ff' },
  Dockerfile: { primary: '#384d54', secondary: '#2c3d43', background: '#f1f5f9' },
  Nix: { primary: '#7e7eff', secondary: '#6565e6', background: '#eef2ff' },

  // Markup & Data
  Markdown: { primary: '#083fa1', secondary: '#063281', background: '#eff6ff' },
  JSON: { primary: '#292929', secondary: '#1a1a1a', background: '#f5f5f5' },
  YAML: { primary: '#cb171e', secondary: '#a81217', background: '#fef2f2' },
  TOML: { primary: '#9c4221', secondary: '#7d351a', background: '#fff7ed' },
  XML: { primary: '#0060ac', secondary: '#004d8a', background: '#eff6ff' },

  // Other Popular
  Assembly: { primary: '#6E4C13', secondary: '#583c0f', background: '#fef3c7' },
  Fortran: { primary: '#4d41b1', secondary: '#3d348e', background: '#eef2ff' },
  COBOL: { primary: '#004B85', secondary: '#003c6a', background: '#eff6ff' },
  Solidity: { primary: '#AA6746', secondary: '#8a5338', background: '#fef3ee' },
  WebAssembly: { primary: '#04133b', secondary: '#030d29', background: '#eef2ff' },

  // Default/Unknown
  Unknown: { primary: '#6b7280', secondary: '#4b5563', background: '#f3f4f6' },
};

/**
 * Get color palette for a language
 * @param {string} language - Programming language name
 * @returns {Object} - Color palette with primary, secondary, background
 */
export function getLanguageColor(language) {
  // Direct match
  if (LANGUAGE_COLORS[language]) {
    return LANGUAGE_COLORS[language];
  }

  // Case-insensitive match
  const normalized = language?.toLowerCase() || '';
  for (const [lang, colors] of Object.entries(LANGUAGE_COLORS)) {
    if (lang.toLowerCase() === normalized) {
      return colors;
    }
  }

  // Partial match for common variations
  const variations = {
    'js': 'JavaScript',
    'ts': 'TypeScript',
    'py': 'Python',
    'rb': 'Ruby',
    'rs': 'Rust',
    'cpp': 'C++',
    'csharp': 'C#',
    'objc': 'Objective-C',
    'objective c': 'Objective-C',
    'sh': 'Shell',
    'bash': 'Shell',
    'zsh': 'Shell',
    'yml': 'YAML',
    'ipynb': 'Jupyter',
  };

  const variant = variations[normalized];
  if (variant && LANGUAGE_COLORS[variant]) {
    return LANGUAGE_COLORS[variant];
  }

  return LANGUAGE_COLORS.Unknown;
}

/**
 * Generate a complementary color
 * @param {string} hex - Hex color code
 * @returns {string} - Complementary hex color
 */
export function getComplementaryColor(hex) {
  // Convert hex to RGB
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  // Convert to HSL
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  // Rotate hue by 180 degrees for complementary
  h = (h + 0.5) % 1;

  // Convert back to RGB
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let newR, newG, newB;

  if (s === 0) {
    newR = newG = newB = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1/3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1/3);
  }

  // Convert to hex
  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Lighten a hex color
 * @param {string} hex - Hex color code
 * @param {number} amount - Amount to lighten (0-1)
 * @returns {string} - Lightened hex color
 */
export function lightenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.min(255, Math.round(r + (255 - r) * amount));
  const newG = Math.min(255, Math.round(g + (255 - g) * amount));
  const newB = Math.min(255, Math.round(b + (255 - b) * amount));

  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Darken a hex color
 * @param {string} hex - Hex color code
 * @param {number} amount - Amount to darken (0-1)
 * @returns {string} - Darkened hex color
 */
export function darkenColor(hex, amount) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const newR = Math.round(r * (1 - amount));
  const newG = Math.round(g * (1 - amount));
  const newB = Math.round(b * (1 - amount));

  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}

/**
 * Convert hex to RGBA
 * @param {string} hex - Hex color code
 * @param {number} alpha - Alpha value (0-1)
 * @returns {string} - RGBA color string
 */
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Convert hex to HSL object
 * @param {string} hex - Hex color code
 * @returns {Object} - HSL object with h (0-360), s (0-100), l (0-100)
 */
export function hexToHSL(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

/**
 * Convert HSL object to hex
 * @param {Object} hsl - HSL object with h (0-360), s (0-100), l (0-100)
 * @returns {string} - Hex color code
 */
export function hslToHex(hsl) {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Adjust lightness of a color
 * @param {string} hex - Hex color code
 * @param {number} amount - Amount to adjust (-100 to 100)
 * @returns {string} - Adjusted hex color
 */
export function adjustLightness(hex, amount) {
  const hsl = hexToHSL(hex);
  hsl.l = Math.max(0, Math.min(100, hsl.l + amount));
  return hslToHex(hsl);
}

/**
 * Adjust saturation of a color
 * @param {string} hex - Hex color code
 * @param {number} amount - Amount to adjust (-100 to 100)
 * @returns {string} - Adjusted hex color
 */
export function adjustSaturation(hex, amount) {
  const hsl = hexToHSL(hex);
  hsl.s = Math.max(0, Math.min(100, hsl.s + amount));
  return hslToHex(hsl);
}

/**
 * Shift hue of a color
 * @param {string} hex - Hex color code
 * @param {number} degrees - Degrees to shift (-180 to 180)
 * @returns {string} - Shifted hex color
 */
export function shiftHue(hex, degrees) {
  const hsl = hexToHSL(hex);
  hsl.h = (hsl.h + degrees + 360) % 360;
  return hslToHex(hsl);
}

/**
 * Generate harmonious accent colors using color theory
 * @param {string} baseColor - Primary color (hex)
 * @param {string} scheme - Color scheme: 'complementary', 'triadic', 'analogous', 'split'
 * @returns {string[]} - Array of accent colors
 */
export function generateHarmoniousColors(baseColor, scheme = 'triadic') {
  const hsl = hexToHSL(baseColor);

  switch (scheme) {
    case 'complementary':
      // 180° opposite
      return [hslToHex({ ...hsl, h: (hsl.h + 180) % 360 })];

    case 'triadic':
      // 120° apart
      return [
        hslToHex({ ...hsl, h: (hsl.h + 120) % 360 }),
        hslToHex({ ...hsl, h: (hsl.h + 240) % 360 })
      ];

    case 'analogous':
      // 30° apart on each side
      return [
        hslToHex({ ...hsl, h: (hsl.h + 30) % 360 }),
        hslToHex({ ...hsl, h: (hsl.h + 330) % 360 })
      ];

    case 'split':
      // Split-complementary: 150° and 210°
      return [
        hslToHex({ ...hsl, h: (hsl.h + 150) % 360 }),
        hslToHex({ ...hsl, h: (hsl.h + 210) % 360 })
      ];

    default:
      return [getComplementaryColor(baseColor)];
  }
}

/**
 * Adjust color for theme visibility
 * Ensures colors are visible in both light and dark modes
 * @param {string} hex - Hex color code
 * @param {string} theme - 'light' or 'dark'
 * @returns {string} - Adjusted hex color
 */
export function adjustForTheme(hex, theme) {
  const hsl = hexToHSL(hex);

  if (theme === 'light') {
    // Light mode: ensure colors aren't too light (wash out against white)
    // Yellows, light greens, cyans need darkening
    if (hsl.l > 65) {
      hsl.l = Math.max(35, hsl.l - 30);
    }
    // Boost saturation for pale colors
    if (hsl.s < 50 && hsl.l > 50) {
      hsl.s = Math.min(100, hsl.s + 20);
    }
    // Special handling for yellow range (45-65 hue)
    if (hsl.h >= 45 && hsl.h <= 65) {
      hsl.l = Math.min(55, hsl.l);
      hsl.s = Math.min(100, hsl.s + 15);
    }
  } else {
    // Dark mode: ensure colors aren't too dark
    // Dark blues, purples, browns need lightening
    if (hsl.l < 35) {
      hsl.l = Math.min(65, hsl.l + 25);
    }
    // Boost saturation for dark muted colors
    if (hsl.s < 40 && hsl.l < 50) {
      hsl.s = Math.min(100, hsl.s + 25);
    }
  }

  return hslToHex(hsl);
}

/**
 * Get current theme from document
 * @returns {string} - 'light' or 'dark'
 */
export function getCurrentTheme() {
  if (typeof document !== 'undefined') {
    return document.documentElement.getAttribute('data-theme') || 'dark';
  }
  return 'dark'; // Default for SSR/tests
}

/**
 * Generate a complete color family for a repository
 * Creates variations based on repo metrics with multi-color palette and theme awareness
 * @param {string} baseColor - Primary language color (hex)
 * @param {Object} repo - Repository data
 * @param {string} [theme] - Optional theme override ('light' or 'dark')
 * @returns {Object} - Extended color palette
 */
export function generateColorFamily(baseColor, repo, theme = null) {
  const currentTheme = theme || getCurrentTheme();

  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  const age = repo.created_at ?
    (Date.now() - new Date(repo.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365) : 1;
  const lastPush = repo.pushed_at ?
    (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24) : 30;

  // Map metrics to color adjustments
  const starLightness = mapRange(Math.log10(stars + 1), 0, 6, -10, 15);
  const forkSaturation = mapRange(Math.log10(forks + 1), 0, 4, 0, -20);
  const ageSaturation = mapRange(age, 0, 10, 0, -15);
  const activityHue = mapRange(lastPush, 0, 90, 5, -5);

  // Adjust base color for current theme
  const themeAdjustedBase = adjustForTheme(baseColor, currentTheme);
  const baseHSL = hexToHSL(themeAdjustedBase);

  // Generate harmonious accent colors based on repo characteristics
  // Use different schemes based on complexity
  const complexity = Math.min(5, Math.floor((Math.log10(stars + 1) + Math.log10(forks + 1)) / 2));
  let colorScheme;
  if (complexity <= 1) colorScheme = 'analogous';      // Simple repos: subtle variation
  else if (complexity <= 3) colorScheme = 'split';     // Medium: split-complementary
  else colorScheme = 'triadic';                         // Complex: full triadic

  const accentColors = generateHarmoniousColors(themeAdjustedBase, colorScheme)
    .map(c => adjustForTheme(c, currentTheme));

  // Create the accent palette
  const accent1 = accentColors[0];
  const accent2 = accentColors[1] || shiftHue(accent1, 60);

  return {
    // Primary - theme-adjusted base language color
    primary: themeAdjustedBase,

    // Secondary - darker, used for outlines and emphasis
    secondary: adjustForTheme(adjustLightness(themeAdjustedBase, -15), currentTheme),

    // Tertiary - lighter variant based on popularity
    tertiary: adjustForTheme(adjustLightness(themeAdjustedBase, starLightness + 20), currentTheme),

    // Accent colors - harmonious complementary colors for variety
    accent1: accent1,
    accent2: accent2,

    // Trace - uses accent1 for circuit paths
    trace: accent1,
    traceAlpha: currentTheme === 'light' ? 0.4 : 0.3,

    // Node - accent2 for terminal points
    node: adjustForTheme(shiftHue(adjustLightness(accent2, 10), activityHue), currentTheme),

    // Glow - warmer/cooler based on recent activity
    glow: adjustForTheme(shiftHue(adjustLightness(themeAdjustedBase, 25), activityHue * 2), currentTheme),

    // Bridge - uses primary with adjustments for data bridges
    bridge: adjustForTheme(adjustSaturation(adjustLightness(themeAdjustedBase, -5), forkSaturation), currentTheme),

    // Ambient - very subtle background hint
    ambient: adjustForTheme(adjustLightness(adjustSaturation(themeAdjustedBase, -30), 40), currentTheme),
    ambientAlpha: currentTheme === 'light' ? 0.12 : 0.08,

    // Rail - accent1 for power rails
    rail: adjustForTheme(adjustSaturation(adjustLightness(accent1, ageSaturation), -10), currentTheme),

    // Dot - accent2 for signal dots, high contrast
    dot: adjustForTheme(adjustLightness(accent2, baseHSL.l > 50 ? -20 : 20), currentTheme),

    // Helix - uses accent1 for the helix trace
    helix: adjustForTheme(adjustLightness(accent1, 10), currentTheme),

    // Branch - uses accent2 for branch traces
    branch: adjustForTheme(accent2, currentTheme),

    // Theme info
    _theme: currentTheme,

    // Metadata for debugging/info
    _meta: {
      starLightness: Math.round(starLightness),
      forkSaturation: Math.round(forkSaturation),
      ageSaturation: Math.round(ageSaturation),
      activityHue: Math.round(activityHue),
      colorScheme,
      originalBase: baseColor
    }
  };
}

/**
 * Map a value from one range to another
 * @param {number} value - Input value
 * @param {number} inMin - Input minimum
 * @param {number} inMax - Input maximum
 * @param {number} outMin - Output minimum
 * @param {number} outMax - Output maximum
 * @returns {number} - Mapped value
 */
function mapRange(value, inMin, inMax, outMin, outMax) {
  const clamped = Math.max(inMin, Math.min(inMax, value));
  return outMin + (outMax - outMin) * ((clamped - inMin) / (inMax - inMin));
}
