/**
 * Shape System for Repository DNA
 * Maps programming languages to distinctive shapes
 *
 * @module components/RepositoryDNA/shapes
 */

/**
 * Shape type definitions
 */
export const SHAPE_TYPES = {
  HEXAGON: 'hexagon',
  OCTAGON: 'octagon',
  CIRCLE: 'circle',
  DIAMOND: 'diamond',
  SQUARE: 'square',
  ROUNDED_RECT: 'rounded_rect',
  STAR: 'star',
  PENTAGON: 'pentagon',
  TRIANGLE: 'triangle',
  HEPTAGON: 'heptagon',
};

/**
 * Language to shape mapping
 * Groups languages by family and assigns distinctive shapes
 */
export const LANGUAGE_SHAPES = {
  // Web Languages - Hexagon (interconnected web)
  JavaScript: SHAPE_TYPES.HEXAGON,
  TypeScript: SHAPE_TYPES.HEXAGON,
  HTML: SHAPE_TYPES.HEXAGON,
  CSS: SHAPE_TYPES.HEXAGON,
  SCSS: SHAPE_TYPES.HEXAGON,
  Vue: SHAPE_TYPES.HEXAGON,
  Svelte: SHAPE_TYPES.HEXAGON,

  // Systems Languages - Octagon (industrial/stable)
  Rust: SHAPE_TYPES.OCTAGON,
  Go: SHAPE_TYPES.OCTAGON,
  C: SHAPE_TYPES.OCTAGON,
  'C++': SHAPE_TYPES.OCTAGON,
  Zig: SHAPE_TYPES.OCTAGON,

  // Python - Circle (smooth, accessible)
  Python: SHAPE_TYPES.CIRCLE,

  // Ruby - Diamond (gem)
  Ruby: SHAPE_TYPES.DIAMOND,

  // JVM Languages - Square (enterprise, structured)
  Java: SHAPE_TYPES.SQUARE,
  Kotlin: SHAPE_TYPES.SQUARE,
  Scala: SHAPE_TYPES.SQUARE,
  Clojure: SHAPE_TYPES.STAR, // Lisp family gets star
  Groovy: SHAPE_TYPES.SQUARE,

  // C# / .NET - Pentagon
  'C#': SHAPE_TYPES.PENTAGON,
  'F#': SHAPE_TYPES.STAR,

  // Mobile - Rounded Rectangle (app icon aesthetic)
  Swift: SHAPE_TYPES.ROUNDED_RECT,
  'Objective-C': SHAPE_TYPES.ROUNDED_RECT,
  Dart: SHAPE_TYPES.ROUNDED_RECT,

  // Functional Languages - Star (mathematical elegance)
  Haskell: SHAPE_TYPES.STAR,
  Elixir: SHAPE_TYPES.STAR,
  Erlang: SHAPE_TYPES.STAR,
  OCaml: SHAPE_TYPES.STAR,

  // Data/ML - Pentagon (scientific)
  R: SHAPE_TYPES.PENTAGON,
  Julia: SHAPE_TYPES.PENTAGON,
  MATLAB: SHAPE_TYPES.PENTAGON,
  Jupyter: SHAPE_TYPES.PENTAGON,

  // Shell/DevOps - Triangle (minimal, CLI)
  Shell: SHAPE_TYPES.TRIANGLE,
  PowerShell: SHAPE_TYPES.TRIANGLE,
  Dockerfile: SHAPE_TYPES.TRIANGLE,
  Nix: SHAPE_TYPES.TRIANGLE,

  // Markup/Config - Heptagon
  Markdown: SHAPE_TYPES.HEPTAGON,
  JSON: SHAPE_TYPES.HEPTAGON,
  YAML: SHAPE_TYPES.HEPTAGON,
  TOML: SHAPE_TYPES.HEPTAGON,
  XML: SHAPE_TYPES.HEPTAGON,

  // Other
  PHP: SHAPE_TYPES.HEXAGON,
  Perl: SHAPE_TYPES.PENTAGON,
  Lua: SHAPE_TYPES.CIRCLE,
  Assembly: SHAPE_TYPES.OCTAGON,
  Fortran: SHAPE_TYPES.SQUARE,
  COBOL: SHAPE_TYPES.SQUARE,
  Solidity: SHAPE_TYPES.DIAMOND,
  WebAssembly: SHAPE_TYPES.OCTAGON,

  // Default
  Unknown: SHAPE_TYPES.HEXAGON,
};

/**
 * Get shape type for a language
 * @param {string} language - Programming language name
 * @returns {string} - Shape type constant
 */
export function getLanguageShape(language) {
  // Direct match
  if (LANGUAGE_SHAPES[language]) {
    return LANGUAGE_SHAPES[language];
  }

  // Case-insensitive match
  const normalized = language?.toLowerCase() || '';
  for (const [lang, shape] of Object.entries(LANGUAGE_SHAPES)) {
    if (lang.toLowerCase() === normalized) {
      return shape;
    }
  }

  return SHAPE_TYPES.HEXAGON; // Default
}

/**
 * Draw a shape path on canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Shape radius
 * @param {string} shapeType - Shape type from SHAPE_TYPES
 * @param {number} rotation - Rotation in degrees
 */
export function drawShapePath(ctx, cx, cy, radius, shapeType, rotation = 0) {
  const rotationRad = (rotation * Math.PI) / 180;

  ctx.beginPath();

  switch (shapeType) {
    case SHAPE_TYPES.CIRCLE:
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      break;

    case SHAPE_TYPES.TRIANGLE:
      drawPolygonPath(ctx, cx, cy, radius, 3, rotationRad - Math.PI / 2);
      break;

    case SHAPE_TYPES.SQUARE:
      drawPolygonPath(ctx, cx, cy, radius, 4, rotationRad + Math.PI / 4);
      break;

    case SHAPE_TYPES.DIAMOND:
      drawPolygonPath(ctx, cx, cy, radius, 4, rotationRad);
      break;

    case SHAPE_TYPES.PENTAGON:
      drawPolygonPath(ctx, cx, cy, radius, 5, rotationRad - Math.PI / 2);
      break;

    case SHAPE_TYPES.HEXAGON:
      drawPolygonPath(ctx, cx, cy, radius, 6, rotationRad);
      break;

    case SHAPE_TYPES.HEPTAGON:
      drawPolygonPath(ctx, cx, cy, radius, 7, rotationRad - Math.PI / 2);
      break;

    case SHAPE_TYPES.OCTAGON:
      drawPolygonPath(ctx, cx, cy, radius, 8, rotationRad + Math.PI / 8);
      break;

    case SHAPE_TYPES.STAR:
      drawStarPath(ctx, cx, cy, radius, 5, 0.5, rotationRad - Math.PI / 2);
      break;

    case SHAPE_TYPES.ROUNDED_RECT:
      drawRoundedRectPath(ctx, cx, cy, radius, radius * 0.3);
      break;

    default:
      drawPolygonPath(ctx, cx, cy, radius, 6, rotationRad);
  }

  ctx.closePath();
}

/**
 * Draw a regular polygon path
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Polygon radius
 * @param {number} sides - Number of sides
 * @param {number} rotation - Rotation in radians
 */
function drawPolygonPath(ctx, cx, cy, radius, sides, rotation = 0) {
  const angleStep = (Math.PI * 2) / sides;

  for (let i = 0; i <= sides; i++) {
    const angle = i * angleStep + rotation;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
}

/**
 * Draw a star path
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} outerRadius - Outer point radius
 * @param {number} points - Number of points
 * @param {number} innerRatio - Inner radius as ratio of outer (0-1)
 * @param {number} rotation - Rotation in radians
 */
function drawStarPath(ctx, cx, cy, outerRadius, points, innerRatio, rotation = 0) {
  const innerRadius = outerRadius * innerRatio;
  const angleStep = Math.PI / points;

  for (let i = 0; i <= points * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = i * angleStep + rotation;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }
}

/**
 * Draw a rounded rectangle path
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Half-size of the rectangle
 * @param {number} cornerRadius - Corner rounding radius
 */
function drawRoundedRectPath(ctx, cx, cy, radius, cornerRadius) {
  const size = radius * 1.4; // Make it fill similar area to circle
  const halfSize = size / 2;
  const r = Math.min(cornerRadius, halfSize);

  const left = cx - halfSize;
  const top = cy - halfSize;
  const right = cx + halfSize;
  const bottom = cy + halfSize;

  ctx.moveTo(left + r, top);
  ctx.lineTo(right - r, top);
  ctx.quadraticCurveTo(right, top, right, top + r);
  ctx.lineTo(right, bottom - r);
  ctx.quadraticCurveTo(right, bottom, right - r, bottom);
  ctx.lineTo(left + r, bottom);
  ctx.quadraticCurveTo(left, bottom, left, bottom - r);
  ctx.lineTo(left, top + r);
  ctx.quadraticCurveTo(left, top, left + r, top);
}

/**
 * Get shape metadata for a shape type
 * @param {string} shapeType - Shape type constant
 * @returns {Object} - Shape metadata
 */
export function getShapeMetadata(shapeType) {
  const metadata = {
    [SHAPE_TYPES.CIRCLE]: { name: 'Circle', sides: 0, family: 'round' },
    [SHAPE_TYPES.TRIANGLE]: { name: 'Triangle', sides: 3, family: 'polygon' },
    [SHAPE_TYPES.SQUARE]: { name: 'Square', sides: 4, family: 'polygon' },
    [SHAPE_TYPES.DIAMOND]: { name: 'Diamond', sides: 4, family: 'polygon' },
    [SHAPE_TYPES.PENTAGON]: { name: 'Pentagon', sides: 5, family: 'polygon' },
    [SHAPE_TYPES.HEXAGON]: { name: 'Hexagon', sides: 6, family: 'polygon' },
    [SHAPE_TYPES.HEPTAGON]: { name: 'Heptagon', sides: 7, family: 'polygon' },
    [SHAPE_TYPES.OCTAGON]: { name: 'Octagon', sides: 8, family: 'polygon' },
    [SHAPE_TYPES.STAR]: { name: 'Star', sides: 5, family: 'star' },
    [SHAPE_TYPES.ROUNDED_RECT]: { name: 'Rounded Rectangle', sides: 4, family: 'round' },
  };

  return metadata[shapeType] || metadata[SHAPE_TYPES.HEXAGON];
}
