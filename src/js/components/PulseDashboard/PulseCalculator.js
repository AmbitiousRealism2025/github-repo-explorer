/**
 * PulseCalculator - Repository Pulse Metrics Calculation Engine
 *
 * Calculates six "vital signs" that answer the critical question "Is this repo dying?"
 * through predictive trend analysis. Each calculator returns a MetricResult object
 * with value, trend, direction, sparklineData, status, and label.
 *
 * @example
 * import { calculateVelocityScore, calculateAllMetrics } from './PulseCalculator.js';
 *
 * // Calculate individual metric
 * const velocity = calculateVelocityScore(participation);
 * console.log(velocity.value, velocity.trend, velocity.status);
 *
 * // Calculate all metrics at once
 * const pulse = calculateAllMetrics({ repo, participation, issues, prs, contributors });
 * console.log(pulse.overall.status);
 *
 * @module components/PulseDashboard/PulseCalculator
 */

import {
  STATUS_THRESHOLDS,
  TREND_THRESHOLDS,
  DEFAULTS,
  DEFAULT_METRIC,
  TIME_MS
} from './constants.js';

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate the average of an array of numbers
 * @param {number[]} arr - Array of numbers to average
 * @returns {number} The average value, or 0 if array is empty/invalid
 *
 * @example
 * average([1, 2, 3, 4, 5]) // returns 3
 * average([]) // returns 0
 * average(null) // returns 0
 */
export function average(arr) {
  if (!arr?.length) return 0;
  const sum = arr.reduce((a, b) => a + (Number(b) || 0), 0);
  return sum / arr.length;
}

/**
 * Calculate the number of days since a given date
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {number} Days since the date, or Infinity if invalid
 *
 * @example
 * daysSince('2024-01-01') // returns days since Jan 1, 2024
 * daysSince(new Date()) // returns 0
 * daysSince(null) // returns Infinity
 */
export function daysSince(dateString) {
  if (!dateString) return Infinity;

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return Infinity;

    const diff = Date.now() - date.getTime();
    return Math.floor(diff / TIME_MS.DAY);
  } catch {
    return Infinity;
  }
}

/**
 * Calculate the number of days between two dates
 * @param {string|Date} startDate - Start date (ISO string or Date)
 * @param {string|Date} endDate - End date (ISO string or Date)
 * @returns {number} Days between dates (absolute value), or 0 if invalid
 *
 * @example
 * daysBetween('2024-01-01', '2024-01-15') // returns 14
 * daysBetween('2024-01-15', '2024-01-01') // returns 14 (absolute)
 * daysBetween(null, '2024-01-01') // returns 0
 */
export function daysBetween(startDate, endDate) {
  if (!startDate || !endDate) return 0;

  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;

    const diff = Math.abs(end.getTime() - start.getTime());
    return Math.floor(diff / TIME_MS.DAY);
  } catch {
    return 0;
  }
}

/**
 * Determine trend direction based on percentage change
 * @param {number} change - Percentage change value
 * @param {number} [threshold=5] - Threshold for considering a change significant
 * @returns {'up' | 'down' | 'stable'} The trend direction
 *
 * @example
 * getTrendDirection(10) // returns 'up'
 * getTrendDirection(-15) // returns 'down'
 * getTrendDirection(3) // returns 'stable' (within default threshold)
 * getTrendDirection(3, 2) // returns 'up' (with custom threshold)
 */
export function getTrendDirection(change, threshold = TREND_THRESHOLDS.SIGNIFICANT) {
  if (typeof change !== 'number' || isNaN(change)) return 'stable';

  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

/**
 * Determine metric status based on a score (0-100)
 * @param {number} score - Score value from 0 to 100
 * @returns {'thriving' | 'stable' | 'cooling' | 'at_risk'} The status classification
 *
 * @example
 * getMetricStatus(80) // returns 'thriving'
 * getMetricStatus(60) // returns 'stable'
 * getMetricStatus(30) // returns 'cooling'
 * getMetricStatus(10) // returns 'at_risk'
 */
export function getMetricStatus(score) {
  if (typeof score !== 'number' || isNaN(score)) return 'stable';

  if (score >= STATUS_THRESHOLDS.THRIVING) return 'thriving';
  if (score >= STATUS_THRESHOLDS.STABLE) return 'stable';
  if (score >= STATUS_THRESHOLDS.COOLING) return 'cooling';
  return 'at_risk';
}

/**
 * Create a default MetricResult for missing or invalid data
 * @param {string} type - The metric type (velocity, momentum, issues, prs, busFactor, freshness)
 * @returns {Object} A default MetricResult object with appropriate defaults for the type
 *
 * @example
 * getDefaultMetric('velocity') // returns { value: 0, trend: 0, direction: 'stable', ... }
 * getDefaultMetric('issues') // returns { value: 'Cool', temperature: 'cool', ... }
 * getDefaultMetric('unknown') // returns generic default metric
 *
 * @typedef {Object} MetricResult
 * @property {number|string} value - Current metric value
 * @property {number} trend - Change percentage (-100 to +100)
 * @property {'up' | 'down' | 'stable'} direction - Trend direction
 * @property {number[]} sparklineData - Data points for visualization
 * @property {'thriving' | 'stable' | 'cooling' | 'at_risk'} status - Status classification
 * @property {string} label - Human-readable summary
 */
export function getDefaultMetric(type) {
  // Return type-specific default if available
  if (type && DEFAULTS[type]) {
    return { ...DEFAULTS[type] };
  }

  // Return generic default with type in label
  return {
    ...DEFAULT_METRIC,
    label: type ? `${type} data unavailable` : 'Data unavailable'
  };
}

/**
 * Clamp a value between min and max bounds
 * @param {number} value - The value to clamp
 * @param {number} min - Minimum bound
 * @param {number} max - Maximum bound
 * @returns {number} The clamped value
 *
 * @example
 * clamp(150, 0, 100) // returns 100
 * clamp(-10, 0, 100) // returns 0
 * clamp(50, 0, 100) // returns 50
 */
export function clamp(value, min, max) {
  if (typeof value !== 'number' || isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change (can be negative or Infinity for division by zero edge cases)
 *
 * @example
 * percentageChange(120, 100) // returns 20
 * percentageChange(80, 100) // returns -20
 * percentageChange(100, 0) // returns 100 (from zero)
 */
export function percentageChange(current, previous) {
  if (typeof current !== 'number' || typeof previous !== 'number') return 0;
  if (isNaN(current) || isNaN(previous)) return 0;

  // If previous is 0, return current as percentage (growth from nothing)
  if (previous === 0) {
    return current > 0 ? 100 : (current < 0 ? -100 : 0);
  }

  return ((current - previous) / Math.abs(previous)) * 100;
}

/**
 * Safely parse a date string or Date object
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Date|null} Parsed Date object or null if invalid
 *
 * @example
 * safeParseDate('2024-01-01') // returns Date object
 * safeParseDate(new Date()) // returns the same Date
 * safeParseDate('invalid') // returns null
 */
export function safeParseDate(dateInput) {
  if (!dateInput) return null;

  try {
    const date = new Date(dateInput);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Generate an array of zeros for sparkline data placeholder
 * @param {number} length - Length of the array
 * @returns {number[]} Array of zeros
 *
 * @example
 * emptySparkline(7) // returns [0, 0, 0, 0, 0, 0, 0]
 */
export function emptySparkline(length) {
  if (typeof length !== 'number' || length < 0) return [];
  return Array(Math.floor(length)).fill(0);
}

// =============================================================================
// METRIC CALCULATORS
// =============================================================================

/**
 * Calculate velocity score from participation data
 * Compares last 4 weeks vs previous 12 weeks to determine commit velocity trend
 *
 * @param {Object} participation - GitHub stats participation data
 * @param {number[]} participation.all - Array of weekly commit counts (52 weeks, oldest to newest)
 * @returns {Object} MetricResult with velocity score data
 *
 * @example
 * // Increasing velocity
 * const participation = { all: [...12 weeks of 5 commits..., ...4 weeks of 10 commits...] };
 * const result = calculateVelocityScore(participation);
 * // result.direction === 'up'
 * // result.status === 'thriving'
 *
 * @example
 * // Handle missing data
 * const result = calculateVelocityScore(null);
 * // result.status === 'stable'
 * // result.label === 'Commit data unavailable'
 */
export function calculateVelocityScore(participation) {
  // Import velocity constants inline to avoid circular deps and keep function self-contained
  const RECENT_WEEKS = 4;
  const PREVIOUS_WEEKS = 12;
  const SPARKLINE_WEEKS = 13;

  // Velocity thresholds from constants.js
  const COMMITS_EXCELLENT = 20;
  const COMMITS_GOOD = 10;
  const COMMITS_FAIR = 5;
  const COMMITS_MINIMAL = 1;

  // Growth thresholds (percentage)
  const GROWTH_THRIVING = 25;   // >25% increase = thriving
  const GROWTH_STABLE = -10;    // -10% to +25% = stable
  const GROWTH_COOLING = -30;   // -30% to -10% = cooling
  // Below -30% = at_risk

  // Handle missing or invalid participation data
  if (!participation || !participation.all || !Array.isArray(participation.all)) {
    return getDefaultMetric('velocity');
  }

  const allWeeks = participation.all;

  // Need at least enough weeks for comparison
  if (allWeeks.length < RECENT_WEEKS) {
    return {
      ...getDefaultMetric('velocity'),
      sparklineData: allWeeks.slice(-SPARKLINE_WEEKS),
      label: 'Insufficient commit history'
    };
  }

  // Extract recent weeks (last 4) and previous weeks (prior 12)
  const recentWeeks = allWeeks.slice(-RECENT_WEEKS);
  const previousStart = Math.max(0, allWeeks.length - RECENT_WEEKS - PREVIOUS_WEEKS);
  const previousEnd = allWeeks.length - RECENT_WEEKS;
  const previousWeeks = allWeeks.slice(previousStart, previousEnd);

  // Calculate averages
  const recentAvg = average(recentWeeks);
  const previousAvg = average(previousWeeks);

  // Calculate trend (percentage change)
  const trend = percentageChange(recentAvg, previousAvg);

  // Determine direction
  const direction = getTrendDirection(trend);

  // Generate sparkline data (last 13 weeks)
  const sparklineData = allWeeks.slice(-SPARKLINE_WEEKS);

  // Calculate score (0-100) based on recent commit activity and growth
  let activityScore = 0;
  if (recentAvg >= COMMITS_EXCELLENT) activityScore = 100;
  else if (recentAvg >= COMMITS_GOOD) activityScore = 80;
  else if (recentAvg >= COMMITS_FAIR) activityScore = 60;
  else if (recentAvg >= COMMITS_MINIMAL) activityScore = 40;
  else activityScore = 20;

  // Adjust score based on growth trend
  let growthModifier = 0;
  if (trend >= GROWTH_THRIVING) growthModifier = 15;
  else if (trend >= GROWTH_STABLE) growthModifier = 0;
  else if (trend >= GROWTH_COOLING) growthModifier = -15;
  else growthModifier = -25;

  // Final score clamped to 0-100
  const score = clamp(activityScore + growthModifier, 0, 100);

  // Determine status based on growth rate (more important than raw activity)
  let status;
  if (trend >= GROWTH_THRIVING) status = 'thriving';
  else if (trend >= GROWTH_STABLE) status = 'stable';
  else if (trend >= GROWTH_COOLING) status = 'cooling';
  else status = 'at_risk';

  // Generate human-readable label
  const roundedAvg = Math.round(recentAvg * 10) / 10;
  const roundedTrend = Math.round(trend);
  let label;

  if (direction === 'up') {
    label = `${roundedAvg} commits/week (+${roundedTrend}%)`;
  } else if (direction === 'down') {
    label = `${roundedAvg} commits/week (${roundedTrend}%)`;
  } else {
    label = `${roundedAvg} commits/week (stable)`;
  }

  return {
    value: roundedAvg,
    trend: roundedTrend,
    direction,
    sparklineData,
    status,
    label,
    // Additional metadata for debugging/display
    recentAvg,
    previousAvg,
    score
  };
}
