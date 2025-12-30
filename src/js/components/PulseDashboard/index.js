/**
 * PulseDashboard Component
 * Repository vital signs analysis answering "Is this repo dying?"
 *
 * Provides predictive trend analysis through 6 key metrics:
 * - Velocity: Commit activity and trends
 * - Momentum: Star/fork growth rate
 * - Issues: Issue temperature (open/close rate)
 * - PRs: Pull request health and merge rate
 * - Bus Factor: Contributor concentration risk
 * - Freshness: Days since last activity
 *
 * @example
 * import { calculateAllMetrics, calculateVelocityScore } from './components/PulseDashboard/index.js';
 *
 * // Calculate all metrics at once
 * const { metrics, overall } = calculateAllMetrics({
 *   repo: repoData,
 *   participation: participationData,
 *   issues: issuesData,
 *   prs: prsData,
 *   contributors: contributorsData,
 *   events: eventsData,
 *   releases: releasesData
 * });
 *
 * console.log(overall.status); // 'thriving' | 'stable' | 'cooling' | 'at_risk'
 * console.log(overall.pulseSpeed); // Animation speed in ms
 *
 * // Or calculate individual metrics
 * const velocity = calculateVelocityScore(participationData);
 * console.log(velocity.value, velocity.trend, velocity.status);
 *
 * @module components/PulseDashboard
 */

// =============================================================================
// IMPORTS
// =============================================================================

// Individual metric calculators
import {
  // Main wrapper function
  calculateAllMetrics,

  // Individual calculators
  calculateVelocityScore,
  calculateCommunityMomentum,
  calculateIssueTemperature,
  calculatePRHealth,
  calculateBusFactor,
  calculateFreshnessIndex,
  calculateOverallPulse,

  // Utility functions
  average,
  daysSince,
  daysBetween,
  getTrendDirection,
  getMetricStatus,
  getDefaultMetric,
  clamp,
  percentageChange,
  safeParseDate,
  emptySparkline
} from './PulseCalculator.js';

// Constants for configuration and thresholds
import {
  STATUS_THRESHOLDS,
  STATUS_LABELS,
  TREND_THRESHOLDS,
  VELOCITY,
  COMMUNITY,
  ISSUES,
  PR_HEALTH,
  BUS_FACTOR,
  FRESHNESS,
  PULSE,
  DEFAULT_METRIC,
  DEFAULTS,
  TIME_MS,
  TIME_DAYS
} from './constants.js';

// =============================================================================
// PUBLIC API - MAIN FUNCTIONS
// =============================================================================

/**
 * @typedef {Object} MetricResult
 * @property {number|string} value - Current metric value
 * @property {number} trend - Change percentage (-100 to +100)
 * @property {'up' | 'down' | 'stable'} direction - Trend direction
 * @property {number[]} sparklineData - Data points for visualization
 * @property {'thriving' | 'stable' | 'cooling' | 'at_risk'} status - Status classification
 * @property {string} label - Human-readable summary
 */

/**
 * @typedef {Object} OverallPulse
 * @property {'thriving' | 'stable' | 'cooling' | 'at_risk'} status - Overall status
 * @property {number} score - Weighted score (0-100)
 * @property {number} pulseSpeed - Animation speed in milliseconds
 * @property {number} trend - Average trend across metrics
 * @property {'up' | 'down' | 'stable'} direction - Overall trend direction
 * @property {string} label - Human-readable summary
 * @property {Object} concerns - Concerning metrics info
 * @property {Object} breakdown - Status by metric
 */

/**
 * @typedef {Object} AllMetricsResult
 * @property {Object} metrics - Individual metric results
 * @property {MetricResult} metrics.velocity - Velocity score
 * @property {MetricResult} metrics.momentum - Community momentum
 * @property {MetricResult} metrics.issues - Issue temperature
 * @property {MetricResult} metrics.prs - PR health
 * @property {MetricResult} metrics.busFactor - Bus factor
 * @property {MetricResult} metrics.freshness - Freshness index
 * @property {OverallPulse} overall - Overall pulse aggregation
 */

// =============================================================================
// EXPORTS - CALCULATORS
// =============================================================================

export {
  // Main entry point - calculates all 6 metrics and overall pulse
  calculateAllMetrics,

  // Individual metric calculators
  calculateVelocityScore,
  calculateCommunityMomentum,
  calculateIssueTemperature,
  calculatePRHealth,
  calculateBusFactor,
  calculateFreshnessIndex,

  // Overall pulse aggregator
  calculateOverallPulse
};

// =============================================================================
// EXPORTS - UTILITIES
// =============================================================================

export {
  // Array/math utilities
  average,
  clamp,
  percentageChange,
  emptySparkline,

  // Date utilities
  daysSince,
  daysBetween,
  safeParseDate,

  // Status/trend utilities
  getTrendDirection,
  getMetricStatus,
  getDefaultMetric
};

// =============================================================================
// EXPORTS - CONSTANTS
// =============================================================================

export {
  // Thresholds
  STATUS_THRESHOLDS,
  STATUS_LABELS,
  TREND_THRESHOLDS,

  // Metric-specific configuration
  VELOCITY,
  COMMUNITY,
  ISSUES,
  PR_HEALTH,
  BUS_FACTOR,
  FRESHNESS,
  PULSE,

  // Defaults
  DEFAULT_METRIC,
  DEFAULTS,

  // Time constants
  TIME_MS,
  TIME_DAYS
};
