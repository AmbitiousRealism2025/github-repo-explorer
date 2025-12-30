/**
 * TrendArrow Component
 * Directional indicator showing up/down/stable arrows with percentage change display
 *
 * @example
 * import { createTrendArrow } from './components/PulseDashboard/TrendArrow.js';
 *
 * // Positive trend with percentage
 * const arrow = createTrendArrow(15.2); // Shows ↑ +15.2%
 * container.appendChild(arrow);
 *
 * // Negative trend
 * const arrow = createTrendArrow(-8.5); // Shows ↓ -8.5%
 *
 * // Stable/neutral trend
 * const arrow = createTrendArrow(0.5); // Shows → 0.5%
 *
 * // Large values are clamped
 * const arrow = createTrendArrow(1500); // Shows ↑ +999%
 *
 * @module components/PulseDashboard/TrendArrow
 */

/**
 * Threshold for determining stable trend (±percentage)
 */
const STABLE_THRESHOLD = 1;

/**
 * Maximum percentage to display (values beyond this are clamped)
 */
const MAX_PERCENTAGE = 999;

/**
 * Arrow SVG icons for each direction
 */
const ARROW_ICONS = {
  up: `<svg class="trend-arrow__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="currentColor" d="M8 4l5 6H3l5-6z"/>
  </svg>`,
  down: `<svg class="trend-arrow__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="currentColor" d="M8 12L3 6h10l-5 6z"/>
  </svg>`,
  stable: `<svg class="trend-arrow__icon" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path fill="currentColor" d="M2 7h8l-3-3h2l4 4-4 4h-2l3-3H2V7z"/>
  </svg>`
};

/**
 * Determine trend direction from percentage value
 * @param {number} percentage - Percentage change value
 * @returns {'up' | 'down' | 'stable'} Trend direction
 */
export const getTrendDirection = (percentage) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return 'stable';
  }

  if (percentage > STABLE_THRESHOLD) return 'up';
  if (percentage < -STABLE_THRESHOLD) return 'down';
  return 'stable';
};

/**
 * Get CSS modifier class for trend direction
 * @param {'up' | 'down' | 'stable'} direction - Trend direction
 * @returns {string} CSS modifier class
 */
const getTrendModifier = (direction) => {
  switch (direction) {
    case 'up': return 'trend-arrow--up';
    case 'down': return 'trend-arrow--down';
    default: return 'trend-arrow--stable';
  }
};

/**
 * Format percentage value for display
 * Clamps to ±999%, adds +/- prefix, and formats to 1 decimal place
 * @param {number} percentage - Raw percentage value
 * @param {'up' | 'down' | 'stable'} direction - Trend direction
 * @returns {string} Formatted percentage string
 */
export const formatPercentage = (percentage, direction) => {
  if (typeof percentage !== 'number' || isNaN(percentage)) {
    return '0%';
  }

  // Clamp to max display value
  const clampedAbs = Math.min(Math.abs(percentage), MAX_PERCENTAGE);

  // Format with 1 decimal place, remove trailing .0
  let formatted = clampedAbs.toFixed(1);
  if (formatted.endsWith('.0')) {
    formatted = formatted.slice(0, -2);
  }

  // Add prefix based on direction
  if (direction === 'up') {
    return `+${formatted}%`;
  } else if (direction === 'down') {
    return `-${formatted}%`;
  }
  return `${formatted}%`;
};

/**
 * Create a trend arrow indicator element
 * @param {number | null} percentage - Percentage change value (positive for up, negative for down)
 * @param {Object} options - Display options
 * @param {boolean} [options.showPercentage=true] - Whether to show percentage text
 * @param {boolean} [options.compact=false] - Use compact layout (icon only when stable)
 * @returns {HTMLElement} Trend arrow element
 */
export const createTrendArrow = (percentage, options = {}) => {
  const { showPercentage = true, compact = false } = options;

  // Handle null/undefined
  const value = typeof percentage === 'number' && !isNaN(percentage) ? percentage : 0;

  const direction = getTrendDirection(value);
  const modifier = getTrendModifier(direction);

  // Create container
  const container = document.createElement('span');
  container.className = `trend-arrow ${modifier}`;
  container.setAttribute('role', 'img');

  // Set accessible label
  const ariaLabel = getAriaLabel(direction, value);
  container.setAttribute('aria-label', ariaLabel);

  // Add arrow icon
  const iconWrapper = document.createElement('span');
  iconWrapper.className = 'trend-arrow__icon-wrapper';
  iconWrapper.innerHTML = ARROW_ICONS[direction];
  iconWrapper.setAttribute('aria-hidden', 'true');
  container.appendChild(iconWrapper);

  // Add percentage text
  if (showPercentage && !(compact && direction === 'stable')) {
    const text = document.createElement('span');
    text.className = 'trend-arrow__value';
    text.textContent = formatPercentage(value, direction);
    container.appendChild(text);
  }

  return container;
};

/**
 * Generate accessible label for screen readers
 * @param {'up' | 'down' | 'stable'} direction - Trend direction
 * @param {number} percentage - Percentage value
 * @returns {string} Accessible description
 */
const getAriaLabel = (direction, percentage) => {
  const absValue = Math.min(Math.abs(percentage), MAX_PERCENTAGE).toFixed(1);

  switch (direction) {
    case 'up':
      return `Trending up ${absValue} percent`;
    case 'down':
      return `Trending down ${absValue} percent`;
    default:
      return 'Trend stable';
  }
};

/**
 * Create a minimal trend indicator (icon only)
 * Useful for tight spaces like table cells
 * @param {number | null} percentage - Percentage change value
 * @returns {HTMLElement} Compact trend arrow element
 */
export const createMiniTrendArrow = (percentage) => {
  return createTrendArrow(percentage, { showPercentage: false });
};
