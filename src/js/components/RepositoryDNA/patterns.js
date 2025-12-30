/**
 * Pattern Drawing Functions for DNA Visualization
 * Provides various geometric pattern generators for the DNA canvas
 *
 * @module components/RepositoryDNA/patterns
 */

import { createSeededRandom } from './DNAGenerator.js';
import { hexToRgba, lightenColor, darkenColor } from './colors.js';
import { drawShapePath, SHAPE_TYPES } from './shapes.js';

/**
 * Draw radial rays from center
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawRadialRays(ctx, cx, cy, radius, dnaData) {
  const rayCount = 6 + dnaData.pattern.density * 4;
  const angleStep = (Math.PI * 2) / rayCount;
  const innerRadius = radius * 0.2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dnaData.geometry.rotation * Math.PI) / 180);

  for (let i = 0; i < rayCount; i++) {
    const angle = i * angleStep;
    const rayLength = radius * (0.6 + (i % 2) * 0.2);

    const gradient = ctx.createLinearGradient(
      Math.cos(angle) * innerRadius,
      Math.sin(angle) * innerRadius,
      Math.cos(angle) * rayLength,
      Math.sin(angle) * rayLength
    );

    gradient.addColorStop(0, hexToRgba(dnaData.colors.primary, 0.8));
    gradient.addColorStop(1, hexToRgba(dnaData.colors.primary, 0));

    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * innerRadius, Math.sin(angle) * innerRadius);
    ctx.lineTo(Math.cos(angle) * rayLength, Math.sin(angle) * rayLength);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw concentric rings
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawConcentricRings(ctx, cx, cy, radius, dnaData) {
  const ringCount = dnaData.pattern.layers;
  const ringSpacing = radius / (ringCount + 1);

  ctx.save();

  for (let i = 1; i <= ringCount; i++) {
    const ringRadius = ringSpacing * i;
    const alpha = 0.3 - (i / ringCount) * 0.2;

    ctx.beginPath();
    drawPolygon(ctx, cx, cy, ringRadius, dnaData.geometry.sides, dnaData.geometry.rotation);
    ctx.strokeStyle = hexToRgba(dnaData.colors.secondary, alpha);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * Draw dot matrix pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawDotMatrix(ctx, cx, cy, radius, dnaData) {
  const random = createSeededRandom(dnaData.seed);
  const dotCount = 10 + dnaData.pattern.density * 8;
  const dotRadius = 2 + dnaData.pattern.complexity * 0.5;

  ctx.save();

  for (let i = 0; i < dotCount; i++) {
    const angle = random() * Math.PI * 2;
    const dist = random() * radius * 0.8;
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const size = dotRadius * (0.5 + random() * 0.5);
    const alpha = 0.2 + random() * 0.4;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = hexToRgba(dnaData.colors.primary, alpha);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw organic cell-like pattern (simplified Voronoi-like effect)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawOrganicCells(ctx, cx, cy, radius, dnaData) {
  const random = createSeededRandom(dnaData.seed + 1000);
  const cellCount = 3 + dnaData.pattern.density;

  ctx.save();

  for (let i = 0; i < cellCount; i++) {
    const angle = (i / cellCount) * Math.PI * 2 + random() * 0.5;
    const dist = radius * (0.3 + random() * 0.4);
    const x = cx + Math.cos(angle) * dist;
    const y = cy + Math.sin(angle) * dist;
    const cellRadius = radius * (0.15 + random() * 0.15);

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, cellRadius);
    gradient.addColorStop(0, hexToRgba(dnaData.colors.accent, 0.3));
    gradient.addColorStop(1, hexToRgba(dnaData.colors.accent, 0));

    ctx.beginPath();
    ctx.arc(x, y, cellRadius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }

  ctx.restore();
}

/**
 * Draw spiral pattern
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Max radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawSpiral(ctx, cx, cy, radius, dnaData) {
  const turns = 2 + dnaData.pattern.complexity;
  const points = 100;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((dnaData.geometry.rotation * Math.PI) / 180);

  ctx.beginPath();

  for (let i = 0; i <= points; i++) {
    const t = i / points;
    const angle = t * turns * Math.PI * 2;
    const r = t * radius * 0.8;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.strokeStyle = hexToRgba(dnaData.colors.primary, 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw main polygon shape
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Polygon radius
 * @param {number} sides - Number of sides
 * @param {number} rotation - Rotation in degrees
 */
export function drawPolygon(ctx, cx, cy, radius, sides, rotation = 0) {
  const angleStep = (Math.PI * 2) / sides;
  const rotationRad = (rotation * Math.PI) / 180;

  ctx.moveTo(
    cx + radius * Math.cos(rotationRad),
    cy + radius * Math.sin(rotationRad)
  );

  for (let i = 1; i <= sides; i++) {
    const angle = i * angleStep + rotationRad;
    ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
  }

  ctx.closePath();
}

/**
 * Draw filled shape with gradient (supports all shape types)
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Shape radius
 * @param {Object} dnaData - DNA data structure
 */
export function drawFilledPolygon(ctx, cx, cy, radius, dnaData) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  gradient.addColorStop(0, hexToRgba(dnaData.colors.primary, 0.12));
  gradient.addColorStop(0.7, hexToRgba(dnaData.colors.primary, 0.06));
  gradient.addColorStop(1, hexToRgba(dnaData.colors.primary, 0.01));

  ctx.save();

  // Use new shape system if shapeType is defined, fall back to polygon
  const shapeType = dnaData.geometry.shapeType || SHAPE_TYPES.HEXAGON;
  drawShapePath(ctx, cx, cy, radius, shapeType, dnaData.geometry.rotation);

  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.restore();
}

/**
 * Draw shape outline with star-based glow effect
 * The glow intensity increases based on star count
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} radius - Shape radius
 * @param {Object} dnaData - DNA data structure
 * @param {number} [time=0] - Animation time for pulsing glow
 */
export function drawPolygonOutline(ctx, cx, cy, radius, dnaData, time = 0) {
  ctx.save();

  const shapeType = dnaData.geometry.shapeType || SHAPE_TYPES.HEXAGON;
  const starGlow = dnaData.starGlow || { intensity: 0.3, glowSize: 10, pulseSpeed: 3000 };

  // Calculate pulsing glow based on time and star count
  let glowIntensity = starGlow.intensity;
  let glowSize = starGlow.glowSize;

  if (time > 0) {
    // Pulsing effect - faster pulse for more stars
    const pulsePhase = (Math.sin((time / starGlow.pulseSpeed) * Math.PI * 2) + 1) / 2;
    glowIntensity = starGlow.intensity * (0.6 + pulsePhase * 0.4);
    glowSize = starGlow.glowSize * (0.7 + pulsePhase * 0.3);
  }

  // Outer glow layer (most diffuse)
  if (glowIntensity > 0.3) {
    ctx.shadowColor = dnaData.colors.glow || dnaData.colors.primary;
    ctx.shadowBlur = glowSize * 1.5;

    drawShapePath(ctx, cx, cy, radius, shapeType, dnaData.geometry.rotation);
    ctx.strokeStyle = hexToRgba(dnaData.colors.primary, glowIntensity * 0.3);
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // Middle glow layer
  ctx.shadowColor = dnaData.colors.primary;
  ctx.shadowBlur = glowSize;

  drawShapePath(ctx, cx, cy, radius, shapeType, dnaData.geometry.rotation);
  ctx.strokeStyle = hexToRgba(dnaData.colors.primary, glowIntensity * 0.6);
  ctx.lineWidth = 2;
  ctx.stroke();

  // Core outline (sharp)
  ctx.shadowBlur = 0;
  drawShapePath(ctx, cx, cy, radius, shapeType, dnaData.geometry.rotation);
  ctx.strokeStyle = dnaData.colors.primary;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Inner highlight
  drawShapePath(ctx, cx, cy, radius * 0.97, shapeType, dnaData.geometry.rotation);
  ctx.strokeStyle = hexToRgba(lightenColor(dnaData.colors.primary, 0.3), 0.5);
  ctx.lineWidth = 0.5;
  ctx.stroke();

  ctx.restore();
}

/**
 * Draw center element
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {Object} dnaData - DNA data structure
 */
export function drawCenterElement(ctx, cx, cy, dnaData) {
  const centerRadius = dnaData.geometry.radius * 0.15;

  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, centerRadius);
  gradient.addColorStop(0, lightenColor(dnaData.colors.primary, 0.3));
  gradient.addColorStop(0.5, dnaData.colors.primary);
  gradient.addColorStop(1, hexToRgba(dnaData.colors.primary, 0.5));

  ctx.save();

  ctx.beginPath();
  ctx.arc(cx, cy, centerRadius, 0, Math.PI * 2);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Inner highlight
  ctx.beginPath();
  ctx.arc(cx - centerRadius * 0.2, cy - centerRadius * 0.2, centerRadius * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = hexToRgba('#ffffff', 0.4);
  ctx.fill();

  ctx.restore();
}

/**
 * Get pattern functions based on density level
 * @param {number} density - Density level (1-5)
 * @returns {Function[]} - Array of pattern drawing functions
 */
export function getPatternFunctions(density) {
  const patterns = [drawRadialRays];

  if (density >= 2) patterns.push(drawConcentricRings);
  if (density >= 3) patterns.push(drawDotMatrix);
  if (density >= 4) patterns.push(drawOrganicCells);
  if (density >= 5) patterns.push(drawSpiral);

  return patterns;
}
