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
