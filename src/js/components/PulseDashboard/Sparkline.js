/**
 * Sparkline Component
 * Renders an SVG-based line chart showing 90-day trend data with optional area fill
 * and trend-based coloring (green=up, red=down, yellow=stable)
 *
 * @example
 * import { createSparkline } from './components/PulseDashboard/Sparkline.js';
 *
 * // Basic sparkline with array of data points
 * const sparkline = createSparkline([5, 10, 8, 15, 12, 20, 18, 25]);
 * container.appendChild(sparkline);
 *
 * // Sparkline with options
 * const sparkline = createSparkline(data, {
 *   width: 120,
 *   height: 32,
 *   showArea: true,
 *   trend: 'up' // 'up' | 'down' | 'stable'
 * });
 *
 * // Handles empty data gracefully
 * const empty = createSparkline([]); // Shows "No data" indicator
 *
 * @module components/PulseDashboard/Sparkline
 */

/**
 * Default options for sparkline rendering
 */
const DEFAULT_OPTIONS = {
  width: 100,
  height: 28,
  showArea: true,
  trend: null, // null = auto-detect from data
  strokeWidth: 1.5,
  padding: 2
};

/**
 * Calculate trend direction from data array
 * Compares first quarter average to last quarter average
 * @param {number[]} data - Array of numeric data points
 * @returns {'up' | 'down' | 'stable'} Trend direction
 */
export const calculateTrend = (data) => {
  if (!data || data.length < 4) return 'stable';

  const quarterLength = Math.floor(data.length / 4);
  if (quarterLength === 0) return 'stable';

  const firstQuarter = data.slice(0, quarterLength);
  const lastQuarter = data.slice(-quarterLength);

  const firstAvg = firstQuarter.reduce((sum, v) => sum + v, 0) / firstQuarter.length;
  const lastAvg = lastQuarter.reduce((sum, v) => sum + v, 0) / lastQuarter.length;

  // Use 5% threshold for stability
  const percentChange = firstAvg === 0 ? (lastAvg > 0 ? 100 : 0) : ((lastAvg - firstAvg) / firstAvg) * 100;

  if (percentChange > 5) return 'up';
  if (percentChange < -5) return 'down';
  return 'stable';
};

/**
 * Get CSS class for trend-based coloring
 * @param {'up' | 'down' | 'stable'} trend - Trend direction
 * @returns {string} CSS class name
 */
const getTrendClass = (trend) => {
  switch (trend) {
    case 'up': return 'sparkline--up';
    case 'down': return 'sparkline--down';
    default: return 'sparkline--stable';
  }
};

/**
 * Normalize data to fit within the SVG viewBox height
 * @param {number[]} data - Array of numeric data points
 * @param {number} height - Available height for the chart
 * @param {number} padding - Vertical padding
 * @returns {number[]} Normalized Y coordinates (inverted for SVG)
 */
const normalizeData = (data, height, padding) => {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1; // Avoid division by zero
  const availableHeight = height - padding * 2;

  return data.map(value => {
    const normalized = (value - min) / range;
    // Invert Y coordinate (SVG Y increases downward)
    return padding + (1 - normalized) * availableHeight;
  });
};

/**
 * Generate SVG path data string from data points
 * @param {number[]} data - Original data array
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @param {number} padding - Chart padding
 * @returns {{ linePath: string, areaPath: string }} Path data strings
 */
const generatePathData = (data, width, height, padding) => {
  const normalizedY = normalizeData(data, height, padding);
  const pointCount = data.length;
  const xStep = (width - padding * 2) / Math.max(pointCount - 1, 1);

  const points = normalizedY.map((y, i) => ({
    x: padding + i * xStep,
    y: y
  }));

  // Generate line path (M = moveTo, L = lineTo)
  const linePath = points
    .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');

  // Generate area path (closes to bottom of chart)
  const areaPath = linePath +
    ` L ${points[points.length - 1].x.toFixed(2)} ${height - padding}` +
    ` L ${padding} ${height - padding} Z`;

  return { linePath, areaPath };
};

/**
 * Create an empty state sparkline placeholder
 * @param {number} width - Chart width
 * @param {number} height - Chart height
 * @returns {HTMLElement} Empty state container
 */
const createEmptyState = (width, height) => {
  const container = document.createElement('div');
  container.className = 'sparkline sparkline--empty';
  container.setAttribute('aria-hidden', 'true');
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;

  const emptyText = document.createElement('span');
  emptyText.className = 'sparkline__empty-text';
  emptyText.textContent = 'No data';
  container.appendChild(emptyText);

  return container;
};

/**
 * Create a sparkline SVG element from data points
 * @param {number[] | null} data - Array of numeric data points (90-day trend)
 * @param {Object} options - Rendering options
 * @param {number} [options.width=100] - Chart width in pixels
 * @param {number} [options.height=28] - Chart height in pixels
 * @param {boolean} [options.showArea=true] - Show filled area under line
 * @param {'up' | 'down' | 'stable' | null} [options.trend=null] - Force trend color (null = auto-detect)
 * @param {number} [options.strokeWidth=1.5] - Line stroke width
 * @param {number} [options.padding=2] - Chart padding
 * @returns {HTMLElement} Container with sparkline SVG
 */
export const createSparkline = (data, options = {}) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { width, height, showArea, strokeWidth, padding } = opts;

  // Handle empty/invalid data
  if (!data || !Array.isArray(data) || data.length === 0) {
    return createEmptyState(width, height);
  }

  // Filter out non-numeric values
  const cleanData = data.filter(v => typeof v === 'number' && !isNaN(v));
  if (cleanData.length === 0) {
    return createEmptyState(width, height);
  }

  // Handle single data point
  if (cleanData.length === 1) {
    // Duplicate to create a flat line
    cleanData.push(cleanData[0]);
  }

  // Determine trend (auto-detect or use provided)
  const trend = opts.trend || calculateTrend(cleanData);
  const trendClass = getTrendClass(trend);

  // Generate path data
  const { linePath, areaPath } = generatePathData(cleanData, width, height, padding);

  // Create container
  const container = document.createElement('div');
  container.className = `sparkline ${trendClass}`;
  container.setAttribute('aria-hidden', 'true');

  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('class', 'sparkline__svg');
  svg.setAttribute('preserveAspectRatio', 'none');

  // Create area fill (if enabled)
  if (showArea) {
    const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    area.setAttribute('d', areaPath);
    area.setAttribute('class', 'sparkline__area');
    area.setAttribute('fill', 'currentColor');
    svg.appendChild(area);
  }

  // Create line path
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', linePath);
  line.setAttribute('class', 'sparkline__line');
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', 'currentColor');
  line.setAttribute('stroke-width', String(strokeWidth));
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);

  // Add endpoint dot at last data point
  const normalizedY = normalizeData(cleanData, height, padding);
  const lastX = padding + ((cleanData.length - 1) * (width - padding * 2)) / Math.max(cleanData.length - 1, 1);
  const lastY = normalizedY[normalizedY.length - 1];

  const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  dot.setAttribute('cx', String(lastX.toFixed(2)));
  dot.setAttribute('cy', String(lastY.toFixed(2)));
  dot.setAttribute('r', String(strokeWidth + 0.5));
  dot.setAttribute('class', 'sparkline__dot');
  dot.setAttribute('fill', 'currentColor');
  svg.appendChild(dot);

  container.appendChild(svg);

  return container;
};

/**
 * Create a mini sparkline for compact displays (e.g., table cells)
 * Uses smaller dimensions and no area fill
 * @param {number[] | null} data - Array of numeric data points
 * @param {'up' | 'down' | 'stable' | null} [trend=null] - Force trend color
 * @returns {HTMLElement} Container with mini sparkline SVG
 */
export const createMiniSparkline = (data, trend = null) => {
  return createSparkline(data, {
    width: 60,
    height: 20,
    showArea: false,
    trend,
    strokeWidth: 1,
    padding: 2
  });
};
