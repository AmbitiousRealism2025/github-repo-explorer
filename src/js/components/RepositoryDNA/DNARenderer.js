/**
 * DNARenderer Module
 * Renders DNA visualizations to canvas
 *
 * @module components/RepositoryDNA/DNARenderer
 */

import { hexToRgba } from './colors.js';
import {
  drawFilledPolygon,
  drawPolygonOutline,
  drawCenterElement,
  getPatternFunctions,
} from './patterns.js';

/**
 * Create a canvas element with DNA visualization
 * @param {Object} dnaData - DNA data structure from generateDNAData
 * @param {number} [size=200] - Canvas size in pixels
 * @returns {HTMLCanvasElement} - Canvas element with rendered DNA
 */
export function createDNACanvas(dnaData, size = 200) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.className = 'repo-dna__canvas';

  const ctx = canvas.getContext('2d');
  if (ctx) {
    drawDNA(ctx, dnaData, { size });
  }

  return canvas;
}

/**
 * Draw complete DNA visualization to canvas context
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {Object} dnaData - DNA data structure
 * @param {Object} [options] - Rendering options
 * @param {number} [options.size=200] - Canvas size
 * @param {boolean} [options.drawBackground=true] - Whether to draw background
 */
export function drawDNA(ctx, dnaData, options = {}) {
  // Guard against null context (jsdom doesn't support canvas)
  if (!ctx) return;

  const { size = 200, drawBackground = true } = options;

  const cx = size / 2;
  const cy = size / 2;

  // Scale radius to fit canvas
  const maxRadius = size * 0.4;
  const scaledRadius = (dnaData.geometry.radius / 80) * maxRadius;

  // Clear canvas
  ctx.clearRect(0, 0, size, size);

  // Draw background
  if (drawBackground) {
    drawBackgroundGradient(ctx, cx, cy, size, dnaData);
  }

  // Draw patterns based on density
  const patternFunctions = getPatternFunctions(dnaData.pattern.density);
  patternFunctions.forEach(drawPattern => {
    drawPattern(ctx, cx, cy, scaledRadius, dnaData);
  });

  // Draw main polygon
  drawFilledPolygon(ctx, cx, cy, scaledRadius, dnaData);
  drawPolygonOutline(ctx, cx, cy, scaledRadius, dnaData);

  // Draw center element
  drawCenterElement(ctx, cx, cy, dnaData);
}

/**
 * Draw background gradient
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} cx - Center X
 * @param {number} cy - Center Y
 * @param {number} size - Canvas size
 * @param {Object} dnaData - DNA data structure
 */
function drawBackgroundGradient(ctx, cx, cy, size, dnaData) {
  const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.7);
  gradient.addColorStop(0, hexToRgba(dnaData.colors.primary, 0.05));
  gradient.addColorStop(0.5, hexToRgba(dnaData.colors.primary, 0.02));
  gradient.addColorStop(1, 'transparent');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
}

/**
 * Create an animated DNA canvas with pulse effect
 * @param {Object} dnaData - DNA data structure
 * @param {number} [size=200] - Canvas size
 * @returns {Object} - Object with canvas element and animation controls
 */
export function createAnimatedDNACanvas(dnaData, size = 200) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  canvas.className = 'repo-dna__canvas repo-dna__canvas--animated';

  const ctx = canvas.getContext('2d');
  let animationId = null;
  let startTime = null;

  // Guard against null context (jsdom doesn't support canvas)
  if (!ctx) {
    return {
      canvas,
      stop: () => {},
      start: () => {},
    };
  }

  function animate(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;

    // Calculate pulse phase (0-1)
    const pulsePhase = (Math.sin(elapsed / dnaData.animation.speed * Math.PI * 2) + 1) / 2;
    const pulseScale = 1 + pulsePhase * dnaData.animation.pulseIntensity * 0.05;

    // Modify glow based on pulse
    const animatedDnaData = {
      ...dnaData,
      animation: {
        ...dnaData.animation,
        glowSpread: dnaData.animation.glowSpread * (0.8 + pulsePhase * 0.4),
      },
      geometry: {
        ...dnaData.geometry,
        radius: dnaData.geometry.radius * pulseScale,
      },
    };

    drawDNA(ctx, animatedDnaData, { size });
    animationId = requestAnimationFrame(animate);
  }

  // Start animation
  animationId = requestAnimationFrame(animate);

  return {
    canvas,
    stop: () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    },
    start: () => {
      if (!animationId) {
        startTime = null;
        animationId = requestAnimationFrame(animate);
      }
    },
  };
}

/**
 * Render DNA to an offscreen canvas for export
 * @param {Object} dnaData - DNA data structure
 * @param {number} [size=800] - Export size (larger for quality)
 * @returns {HTMLCanvasElement} - High-resolution canvas
 */
export function renderForExport(dnaData, size = 800) {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  drawDNA(ctx, dnaData, { size });

  return canvas;
}

/**
 * Render DNA with social share overlay
 * @param {Object} dnaData - DNA data structure
 * @param {Object} [options] - Options
 * @param {number} [options.width=1200] - Export width
 * @param {number} [options.height=630] - Export height
 * @returns {HTMLCanvasElement} - Social-ready canvas
 */
export function renderForSocialShare(dnaData, options = {}) {
  const { width = 1200, height = 630 } = options;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // Guard against null context (jsdom doesn't support canvas)
  if (!ctx) return canvas;

  // Background
  ctx.fillStyle = '#1a1b26';
  ctx.fillRect(0, 0, width, height);

  // Draw DNA centered
  const dnaSize = Math.min(height - 100, 400);
  const dnaX = width / 2;
  const dnaY = height / 2 - 30;

  ctx.save();
  ctx.translate(dnaX - dnaSize / 2, dnaY - dnaSize / 2);
  drawDNA(ctx, dnaData, { size: dnaSize, drawBackground: false });
  ctx.restore();

  // Repo name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(dnaData.repoName, width / 2, height - 80);

  // Stats line
  ctx.fillStyle = '#a0a0a0';
  ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const statsText = `★ ${dnaData.metadata.stars.toLocaleString()}  ⑂ ${dnaData.metadata.forks.toLocaleString()}  ${dnaData.metadata.language}`;
  ctx.fillText(statsText, width / 2, height - 50);

  // Watermark
  ctx.fillStyle = '#666666';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('Generated by GitHub Explorer', width / 2, height - 20);

  return canvas;
}
