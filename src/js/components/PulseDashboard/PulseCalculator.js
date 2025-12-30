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
  TIME_MS,
  COMMUNITY,
  ISSUES,
  PR_HEALTH
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

/**
 * Calculate community momentum from repository data and events
 * Analyzes star/fork growth rate over time with approximate sparkline
 *
 * @param {Object} repo - GitHub repository data
 * @param {number} repo.stargazers_count - Current star count
 * @param {number} repo.forks_count - Current fork count
 * @param {string} repo.created_at - Repository creation date (ISO string)
 * @param {Array} [events=[]] - Optional array of GitHub events (WatchEvent for stars)
 * @returns {Object} MetricResult with community momentum data
 *
 * @example
 * // Popular repo with good growth
 * const repo = { stargazers_count: 5000, forks_count: 500, created_at: '2020-01-01' };
 * const result = calculateCommunityMomentum(repo, []);
 * // result.value === 5000
 * // result.status === 'thriving' | 'stable' | etc.
 *
 * @example
 * // Handle missing data
 * const result = calculateCommunityMomentum(null, []);
 * // result.status === 'stable'
 * // result.label === 'Growth data unavailable'
 */
export function calculateCommunityMomentum(repo, events = []) {
  // Handle missing or invalid repo data
  if (!repo) {
    return getDefaultMetric('momentum');
  }

  // Extract star and fork counts with defaults
  const stars = Number(repo.stargazers_count) || 0;
  const forks = Number(repo.forks_count) || 0;

  // Calculate repo age in days
  const repoAgeDays = daysSince(repo.created_at);

  // If repo age is invalid or very old calculation can proceed
  // but we need a minimum age for growth rate
  const effectiveAgeDays = Math.max(1, Math.min(repoAgeDays, 365 * 10)); // Cap at 10 years

  // Calculate daily star growth rate
  const dailyStarRate = stars / effectiveAgeDays;

  // Calculate fork ratio (engagement indicator)
  const forkRatio = stars > 0 ? forks / stars : 0;

  // Analyze recent events for more accurate recent growth
  // WatchEvent = star, ForkEvent = fork
  const recentDays = COMMUNITY.SPARKLINE_DAYS;
  const recentCutoff = Date.now() - (recentDays * TIME_MS.DAY);

  let recentStars = 0;
  let recentForks = 0;

  if (Array.isArray(events) && events.length > 0) {
    for (const event of events) {
      const eventDate = safeParseDate(event.created_at);
      if (eventDate && eventDate.getTime() >= recentCutoff) {
        if (event.type === 'WatchEvent') {
          recentStars++;
        } else if (event.type === 'ForkEvent') {
          recentForks++;
        }
      }
    }
  }

  // Calculate recent daily rate if we have event data
  const recentDailyRate = recentStars / recentDays;

  // Calculate growth trend (comparing recent vs historical rate)
  // If no recent events, use overall rate as both (trend = 0)
  let trend;
  if (recentStars > 0 && dailyStarRate > 0) {
    trend = percentageChange(recentDailyRate, dailyStarRate);
  } else if (recentStars > 0) {
    trend = 100; // Growth from zero
  } else {
    trend = 0; // No recent data to compare
  }

  // Clamp trend to reasonable range
  trend = clamp(trend, -100, 100);

  // Determine direction
  const direction = getTrendDirection(trend);

  // Generate approximate sparkline data (30 data points for 30 days)
  // Since we don't have daily star history, we approximate based on:
  // 1. Recent events if available
  // 2. Linear distribution based on growth rate if not
  const sparklineData = generateApproximateSparkline(
    stars,
    recentStars,
    events,
    COMMUNITY.SPARKLINE_DAYS
  );

  // Calculate score based on star count and growth rate
  let starScore = 0;
  if (stars >= COMMUNITY.STARS.EXCELLENT) starScore = 100;
  else if (stars >= COMMUNITY.STARS.GOOD) starScore = 80;
  else if (stars >= COMMUNITY.STARS.FAIR) starScore = 60;
  else if (stars >= COMMUNITY.STARS.EMERGING) starScore = 40;
  else starScore = 20;

  // Growth rate modifier
  let growthModifier = 0;
  if (dailyStarRate >= COMMUNITY.GROWTH_RATE.THRIVING) growthModifier = 15;
  else if (dailyStarRate >= COMMUNITY.GROWTH_RATE.STABLE) growthModifier = 5;
  else if (dailyStarRate >= COMMUNITY.GROWTH_RATE.COOLING) growthModifier = 0;
  else growthModifier = -10;

  // Fork ratio bonus (high engagement)
  let forkBonus = 0;
  if (forkRatio >= COMMUNITY.FORK_RATIO.HIGH) forkBonus = 10;
  else if (forkRatio >= COMMUNITY.FORK_RATIO.MEDIUM) forkBonus = 5;
  else if (forkRatio >= COMMUNITY.FORK_RATIO.LOW) forkBonus = 0;
  else forkBonus = -5;

  // Final score
  const score = clamp(starScore + growthModifier + forkBonus, 0, 100);

  // Determine status based on combined metrics
  const status = getMetricStatus(score);

  // Generate human-readable label
  const roundedTrend = Math.round(trend);
  let label;

  if (stars >= 1000) {
    // Format large numbers with K suffix
    const starsK = (stars / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (direction === 'up') {
      label = `${starsK} stars (+${roundedTrend}%)`;
    } else if (direction === 'down') {
      label = `${starsK} stars (${roundedTrend}%)`;
    } else {
      label = `${starsK} stars (stable)`;
    }
  } else {
    if (direction === 'up') {
      label = `${stars} stars (+${roundedTrend}%)`;
    } else if (direction === 'down') {
      label = `${stars} stars (${roundedTrend}%)`;
    } else {
      label = `${stars} stars (stable)`;
    }
  }

  return {
    value: stars,
    trend: roundedTrend,
    direction,
    sparklineData,
    status,
    label,
    // Additional metadata
    forks,
    forkRatio: Math.round(forkRatio * 100) / 100,
    dailyStarRate: Math.round(dailyStarRate * 100) / 100,
    recentStars,
    recentForks,
    repoAgeDays: Math.floor(effectiveAgeDays),
    score
  };
}

/**
 * Generate approximate sparkline data for community momentum
 * Creates a 30-point array representing daily star activity
 *
 * @param {number} totalStars - Total star count
 * @param {number} recentStars - Stars from recent events
 * @param {Array} events - Array of GitHub events
 * @param {number} days - Number of days to generate (default 30)
 * @returns {number[]} Array of daily star approximations
 */
function generateApproximateSparkline(totalStars, recentStars, events, days) {
  const sparkline = Array(days).fill(0);

  // If we have events, use them to build actual daily counts
  if (Array.isArray(events) && events.length > 0) {
    const now = Date.now();
    const dayMs = TIME_MS.DAY;

    for (const event of events) {
      if (event.type !== 'WatchEvent') continue;

      const eventDate = safeParseDate(event.created_at);
      if (!eventDate) continue;

      const daysAgo = Math.floor((now - eventDate.getTime()) / dayMs);
      if (daysAgo >= 0 && daysAgo < days) {
        // Index 0 = oldest, index (days-1) = most recent
        const index = days - 1 - daysAgo;
        sparkline[index]++;
      }
    }

    return sparkline;
  }

  // No events: generate a flat/gradual line based on daily rate
  // This shows "approximate" growth pattern
  if (totalStars > 0 && days > 0) {
    // Use a slight random variation to make it look more natural
    // Seed based on totalStars for determinism
    const baseDaily = Math.max(0.1, totalStars / (days * 30)); // Very low base
    const seed = totalStars % 100;

    for (let i = 0; i < days; i++) {
      // Create a gentle wave pattern using sine
      const wave = Math.sin((i + seed) * 0.3) * 0.3 + 0.7;
      sparkline[i] = Math.round(baseDaily * wave * 10) / 10;
    }
  }

  return sparkline;
}

/**
 * Calculate issue temperature from issue data
 * Analyzes open vs close rate with Hot/Warm/Cool classification
 *
 * @param {Object[]} issues - Array of GitHub issue objects
 * @param {string} issues[].created_at - Issue creation date (ISO string)
 * @param {string} [issues[].closed_at] - Issue close date (ISO string, null if open)
 * @param {string} issues[].state - Issue state ('open' or 'closed')
 * @returns {Object} MetricResult with temperature classification
 *
 * @example
 * // Healthy repo with issues being closed quickly
 * const issues = [
 *   { created_at: '2024-01-01', closed_at: '2024-01-02', state: 'closed' },
 *   { created_at: '2024-01-05', closed_at: '2024-01-06', state: 'closed' },
 *   { created_at: '2024-01-10', state: 'open' }
 * ];
 * const result = calculateIssueTemperature(issues);
 * // result.temperature === 'cool'
 * // result.status === 'thriving'
 *
 * @example
 * // Handle no issues
 * const result = calculateIssueTemperature([]);
 * // result.temperature === 'cool'
 * // result.label === 'No recent issues'
 */
export function calculateIssueTemperature(issues) {
  // Handle missing or invalid issues data
  if (!issues || !Array.isArray(issues)) {
    return getDefaultMetric('issues');
  }

  // Filter to issues within the analysis window (last 30 days)
  const windowDays = ISSUES.WINDOW_DAYS;
  const windowCutoff = Date.now() - (windowDays * TIME_MS.DAY);

  const recentIssues = issues.filter(issue => {
    if (!issue?.created_at) return false;
    const createdDate = safeParseDate(issue.created_at);
    return createdDate && createdDate.getTime() >= windowCutoff;
  });

  // No recent issues = default "Cool" (healthy, no issues to worry about)
  if (recentIssues.length === 0) {
    return getDefaultMetric('issues');
  }

  // Categorize issues
  const closedIssues = recentIssues.filter(issue => issue.state === 'closed');
  const openIssues = recentIssues.filter(issue => issue.state === 'open');

  const totalCount = recentIssues.length;
  const closedCount = closedIssues.length;
  const openCount = openIssues.length;

  // Calculate close rate (percentage of issues that were closed)
  const closeRate = (closedCount / totalCount) * 100;

  // Calculate average response time for closed issues
  let avgResponseDays = 0;
  const responseTimes = [];

  for (const issue of closedIssues) {
    if (issue.created_at && issue.closed_at) {
      const days = daysBetween(issue.created_at, issue.closed_at);
      if (days >= 0) {
        responseTimes.push(days);
      }
    }
  }

  if (responseTimes.length > 0) {
    avgResponseDays = average(responseTimes);
  }

  // Determine temperature based on close rate
  // Cool = healthy (issues getting resolved), Hot = problematic (piling up)
  let temperature;
  let temperatureLabel;

  if (closeRate >= ISSUES.CLOSE_RATE.COOL) {
    temperature = 'cool';
    temperatureLabel = 'Cool';
  } else if (closeRate >= ISSUES.CLOSE_RATE.WARM) {
    temperature = 'warm';
    temperatureLabel = 'Warm';
  } else if (closeRate >= ISSUES.CLOSE_RATE.HOT) {
    temperature = 'hot';
    temperatureLabel = 'Hot';
  } else {
    temperature = 'critical';
    temperatureLabel = 'Critical';
  }

  // Calculate score (0-100) based on close rate and response time
  let closeRateScore = 0;
  if (closeRate >= ISSUES.CLOSE_RATE.COOL) closeRateScore = 100;
  else if (closeRate >= ISSUES.CLOSE_RATE.WARM) closeRateScore = 70;
  else if (closeRate >= ISSUES.CLOSE_RATE.HOT) closeRateScore = 40;
  else closeRateScore = 15;

  // Response time modifier
  let responseModifier = 0;
  if (avgResponseDays <= ISSUES.RESPONSE_TIME.EXCELLENT) responseModifier = 10;
  else if (avgResponseDays <= ISSUES.RESPONSE_TIME.GOOD) responseModifier = 5;
  else if (avgResponseDays <= ISSUES.RESPONSE_TIME.FAIR) responseModifier = 0;
  else if (avgResponseDays <= ISSUES.RESPONSE_TIME.SLOW) responseModifier = -10;
  else responseModifier = -15;

  // Final score
  const score = clamp(closeRateScore + responseModifier, 0, 100);

  // Determine status based on temperature (map to standard status)
  let status;
  if (temperature === 'cool') status = 'thriving';
  else if (temperature === 'warm') status = 'stable';
  else if (temperature === 'hot') status = 'cooling';
  else status = 'at_risk';

  // Calculate trend by comparing first half vs second half of window
  // Split issues into older half and newer half
  const halfWindow = windowCutoff + (windowDays * TIME_MS.DAY / 2);

  const olderIssues = recentIssues.filter(issue => {
    const date = safeParseDate(issue.created_at);
    return date && date.getTime() < halfWindow;
  });

  const newerIssues = recentIssues.filter(issue => {
    const date = safeParseDate(issue.created_at);
    return date && date.getTime() >= halfWindow;
  });

  // Calculate close rates for each half
  const olderClosed = olderIssues.filter(i => i.state === 'closed').length;
  const newerClosed = newerIssues.filter(i => i.state === 'closed').length;

  const olderCloseRate = olderIssues.length > 0 ? (olderClosed / olderIssues.length) * 100 : 0;
  const newerCloseRate = newerIssues.length > 0 ? (newerClosed / newerIssues.length) * 100 : 0;

  // Trend: positive = improving (higher close rate recently), negative = worsening
  const trend = Math.round(percentageChange(newerCloseRate, olderCloseRate));
  const direction = getTrendDirection(trend);

  // Generate sparkline data (daily issue activity over window)
  const sparklineData = generateIssueSparkline(recentIssues, windowDays);

  // Generate human-readable label
  const roundedCloseRate = Math.round(closeRate);
  const roundedResponseDays = Math.round(avgResponseDays * 10) / 10;
  let label;

  if (closedCount === 0 && openCount > 0) {
    label = `${temperatureLabel}: ${openCount} open (0% closed)`;
  } else if (avgResponseDays > 0) {
    label = `${temperatureLabel}: ${roundedCloseRate}% closed, ~${roundedResponseDays}d avg`;
  } else {
    label = `${temperatureLabel}: ${roundedCloseRate}% closed`;
  }

  return {
    value: temperatureLabel,
    temperature,
    trend: clamp(trend, -100, 100),
    direction,
    sparklineData,
    status,
    label,
    // Additional metadata
    totalCount,
    openCount,
    closedCount,
    closeRate: Math.round(closeRate * 10) / 10,
    avgResponseDays: Math.round(avgResponseDays * 10) / 10,
    score
  };
}

/**
 * Generate sparkline data for issue activity
 * Creates an array representing daily issue counts over the window
 *
 * @param {Object[]} issues - Array of issue objects with created_at
 * @param {number} days - Number of days in the window
 * @returns {number[]} Array of daily issue counts (oldest to newest)
 */
function generateIssueSparkline(issues, days) {
  const sparkline = Array(days).fill(0);
  const now = Date.now();
  const dayMs = TIME_MS.DAY;

  for (const issue of issues) {
    if (!issue?.created_at) continue;

    const createdDate = safeParseDate(issue.created_at);
    if (!createdDate) continue;

    const daysAgo = Math.floor((now - createdDate.getTime()) / dayMs);
    if (daysAgo >= 0 && daysAgo < days) {
      // Index 0 = oldest, index (days-1) = most recent
      const index = days - 1 - daysAgo;
      sparkline[index]++;
    }
  }

  return sparkline;
}

/**
 * Calculate PR health from pull request data
 * Analyzes merge rate, time-to-merge, and PR funnel metrics
 *
 * @param {Object[]} pullRequests - Array of GitHub pull request objects
 * @param {string} pullRequests[].created_at - PR creation date (ISO string)
 * @param {string} [pullRequests[].merged_at] - PR merge date (ISO string, null if not merged)
 * @param {string} [pullRequests[].closed_at] - PR close date (ISO string, null if open)
 * @param {string} pullRequests[].state - PR state ('open' or 'closed')
 * @param {boolean} [pullRequests[].merged] - Whether the PR was merged
 * @returns {Object} MetricResult with merge rate, time-to-merge, and funnel data
 *
 * @example
 * // Healthy repo with PRs being merged quickly
 * const prs = [
 *   { created_at: '2024-01-01', merged_at: '2024-01-02', merged: true, state: 'closed' },
 *   { created_at: '2024-01-05', merged_at: '2024-01-06', merged: true, state: 'closed' },
 *   { created_at: '2024-01-10', state: 'open' }
 * ];
 * const result = calculatePRHealth(prs);
 * // result.funnel.merged === 2
 * // result.mergeRate >= 60
 *
 * @example
 * // Handle no PRs
 * const result = calculatePRHealth([]);
 * // result.funnel === { opened: 0, merged: 0, closed: 0, open: 0 }
 * // result.label === 'No recent pull requests'
 */
export function calculatePRHealth(pullRequests) {
  // Handle missing or invalid PR data
  if (!pullRequests || !Array.isArray(pullRequests)) {
    return getDefaultMetric('prs');
  }

  // Filter to PRs within the analysis window (last 30 days)
  const windowDays = PR_HEALTH.WINDOW_DAYS;
  const windowCutoff = Date.now() - (windowDays * TIME_MS.DAY);

  const recentPRs = pullRequests.filter(pr => {
    if (!pr?.created_at) return false;
    const createdDate = safeParseDate(pr.created_at);
    return createdDate && createdDate.getTime() >= windowCutoff;
  });

  // No recent PRs = default state
  if (recentPRs.length === 0) {
    return getDefaultMetric('prs');
  }

  // Categorize PRs
  const mergedPRs = recentPRs.filter(pr => pr.merged === true || pr.merged_at);
  const closedPRs = recentPRs.filter(pr => pr.state === 'closed' && !pr.merged && !pr.merged_at);
  const openPRs = recentPRs.filter(pr => pr.state === 'open');

  const totalOpened = recentPRs.length;
  const mergedCount = mergedPRs.length;
  const closedCount = closedPRs.length; // Closed without merge
  const openCount = openPRs.length;

  // Build funnel data
  const funnel = {
    opened: totalOpened,
    merged: mergedCount,
    closed: closedCount,
    open: openCount
  };

  // Calculate merge rate (percentage of PRs that were merged)
  // We consider only closed PRs for rate calculation (merged / (merged + closed))
  const completedPRs = mergedCount + closedCount;
  const mergeRate = completedPRs > 0 ? (mergedCount / completedPRs) * 100 : 0;

  // Calculate average time to merge for merged PRs
  let avgTimeToMerge = 0;
  const mergeTimes = [];

  for (const pr of mergedPRs) {
    if (pr.created_at && pr.merged_at) {
      const days = daysBetween(pr.created_at, pr.merged_at);
      if (days >= 0) {
        mergeTimes.push(days);
      }
    }
  }

  if (mergeTimes.length > 0) {
    avgTimeToMerge = average(mergeTimes);
  }

  // Calculate score based on merge rate
  let mergeRateScore = 0;
  if (mergeRate >= PR_HEALTH.MERGE_RATE.EXCELLENT) mergeRateScore = 100;
  else if (mergeRate >= PR_HEALTH.MERGE_RATE.GOOD) mergeRateScore = 75;
  else if (mergeRate >= PR_HEALTH.MERGE_RATE.FAIR) mergeRateScore = 50;
  else if (mergeRate >= PR_HEALTH.MERGE_RATE.POOR) mergeRateScore = 25;
  else mergeRateScore = 10;

  // Time to merge modifier
  let timeModifier = 0;
  if (avgTimeToMerge <= PR_HEALTH.TIME_TO_MERGE.EXCELLENT) timeModifier = 15;
  else if (avgTimeToMerge <= PR_HEALTH.TIME_TO_MERGE.GOOD) timeModifier = 10;
  else if (avgTimeToMerge <= PR_HEALTH.TIME_TO_MERGE.FAIR) timeModifier = 0;
  else if (avgTimeToMerge <= PR_HEALTH.TIME_TO_MERGE.SLOW) timeModifier = -10;
  else timeModifier = -15;

  // Volume bonus for active repositories
  const weeklyVolume = totalOpened / (windowDays / 7);
  let volumeModifier = 0;
  if (weeklyVolume >= PR_HEALTH.VOLUME.HIGH) volumeModifier = 5;
  else if (weeklyVolume >= PR_HEALTH.VOLUME.MEDIUM) volumeModifier = 0;
  else if (weeklyVolume >= PR_HEALTH.VOLUME.LOW) volumeModifier = -5;
  else volumeModifier = -10;

  // Final score
  const score = clamp(mergeRateScore + timeModifier + volumeModifier, 0, 100);

  // Determine status based on score
  const status = getMetricStatus(score);

  // Calculate trend by comparing first half vs second half of window
  const halfWindow = windowCutoff + (windowDays * TIME_MS.DAY / 2);

  const olderPRs = recentPRs.filter(pr => {
    const date = safeParseDate(pr.created_at);
    return date && date.getTime() < halfWindow;
  });

  const newerPRs = recentPRs.filter(pr => {
    const date = safeParseDate(pr.created_at);
    return date && date.getTime() >= halfWindow;
  });

  // Calculate merge rates for each half
  const olderMerged = olderPRs.filter(pr => pr.merged === true || pr.merged_at).length;
  const olderClosed = olderPRs.filter(pr => pr.state === 'closed' && !pr.merged && !pr.merged_at).length;
  const olderCompleted = olderMerged + olderClosed;

  const newerMerged = newerPRs.filter(pr => pr.merged === true || pr.merged_at).length;
  const newerClosed = newerPRs.filter(pr => pr.state === 'closed' && !pr.merged && !pr.merged_at).length;
  const newerCompleted = newerMerged + newerClosed;

  const olderMergeRate = olderCompleted > 0 ? (olderMerged / olderCompleted) * 100 : 0;
  const newerMergeRate = newerCompleted > 0 ? (newerMerged / newerCompleted) * 100 : 0;

  // Trend: positive = improving (higher merge rate recently), negative = worsening
  const trend = Math.round(percentageChange(newerMergeRate, olderMergeRate));
  const direction = getTrendDirection(trend);

  // Generate sparkline data (daily PR activity over window)
  const sparklineData = generatePRSparkline(recentPRs, windowDays);

  // Generate human-readable label
  const roundedMergeRate = Math.round(mergeRate);
  const roundedTimeToMerge = Math.round(avgTimeToMerge * 10) / 10;
  let label;

  if (mergedCount === 0 && completedPRs === 0 && openCount > 0) {
    label = `${openCount} open PRs`;
  } else if (avgTimeToMerge > 0) {
    label = `${roundedMergeRate}% merged, ~${roundedTimeToMerge}d avg`;
  } else {
    label = `${roundedMergeRate}% merge rate`;
  }

  return {
    value: roundedMergeRate,
    trend: clamp(trend, -100, 100),
    direction,
    sparklineData,
    status,
    label,
    funnel,
    // Additional metadata
    mergeRate: Math.round(mergeRate * 10) / 10,
    avgTimeToMerge: Math.round(avgTimeToMerge * 10) / 10,
    totalOpened,
    mergedCount,
    closedCount,
    openCount,
    weeklyVolume: Math.round(weeklyVolume * 10) / 10,
    score
  };
}

/**
 * Generate sparkline data for PR activity
 * Creates an array representing daily PR counts over the window
 *
 * @param {Object[]} prs - Array of PR objects with created_at
 * @param {number} days - Number of days in the window
 * @returns {number[]} Array of daily PR counts (oldest to newest)
 */
function generatePRSparkline(prs, days) {
  const sparkline = Array(days).fill(0);
  const now = Date.now();
  const dayMs = TIME_MS.DAY;

  for (const pr of prs) {
    if (!pr?.created_at) continue;

    const createdDate = safeParseDate(pr.created_at);
    if (!createdDate) continue;

    const daysAgo = Math.floor((now - createdDate.getTime()) / dayMs);
    if (daysAgo >= 0 && daysAgo < days) {
      // Index 0 = oldest, index (days-1) = most recent
      const index = days - 1 - daysAgo;
      sparkline[index]++;
    }
  }

  return sparkline;
}
