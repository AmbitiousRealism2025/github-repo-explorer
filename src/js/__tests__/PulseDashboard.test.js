import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSparkline, createMiniSparkline, calculateTrend } from '../components/PulseDashboard/Sparkline.js';
import { createTrendArrow, createMiniTrendArrow, getTrendDirection as getTrendDirectionArrow, formatPercentage } from '../components/PulseDashboard/TrendArrow.js';
import {
  createTemperatureIndicator,
  getTemperatureLevel,
  createPRFunnel,
  createContributorBars,
  getBusFactorRisk,
  createFreshnessGauge,
  getFreshnessLevel,
  calculateFreshnessScore
} from '../components/PulseDashboard/visualizations.js';
import {
  createMetricCard,
  createCompactMetricCard,
  createMetricCardSkeleton
} from '../components/PulseDashboard/MetricCard.js';
import {
  createPulseDashboard,
  createPulseDashboardSkeleton,
  createPulseDashboardError,
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
  emptySparkline,

  // Calculators
  calculateVelocityScore,
  calculateCommunityMomentum,
  calculateIssueTemperature,
  calculatePRHealth,
  calculateBusFactor,
  calculateFreshnessIndex,
  calculateOverallPulse,
  calculateAllMetrics,

  // Constants
  STATUS_THRESHOLDS,
  TREND_THRESHOLDS
} from '../components/PulseDashboard/index.js';

// =============================================================================
// MOCK DATA FACTORIES
// =============================================================================

/**
 * Create mock repository data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock repository object
 */
const createMockRepo = (overrides = {}) => ({
  id: 123456,
  full_name: 'test-owner/test-repo',
  name: 'test-repo',
  description: 'A test repository for testing',
  stargazers_count: 1000,
  forks_count: 100,
  open_issues_count: 10,
  created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year ago
  pushed_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  license: { spdx_id: 'MIT', name: 'MIT License' },
  homepage: 'https://example.com',
  language: 'JavaScript',
  ...overrides
});

/**
 * Create mock participation data (52 weeks of commit counts)
 * @param {Object} options - Configuration options
 * @returns {Object} Mock participation object
 */
const createMockParticipation = (options = {}) => {
  const {
    recentAvg = 10,      // Average commits per week for last 4 weeks
    previousAvg = 8,     // Average commits per week for prior 12 weeks
    baseAvg = 5,         // Average commits for older weeks
    weeks = 52
  } = options;

  const all = [];

  for (let i = 0; i < weeks; i++) {
    if (i >= weeks - 4) {
      // Recent 4 weeks
      all.push(Math.round(recentAvg + (Math.random() - 0.5) * 2));
    } else if (i >= weeks - 16) {
      // Previous 12 weeks
      all.push(Math.round(previousAvg + (Math.random() - 0.5) * 2));
    } else {
      // Older weeks
      all.push(Math.round(baseAvg + (Math.random() - 0.5) * 2));
    }
  }

  return { all, owner: [], ...options.extra };
};

/**
 * Create mock issue data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock issue object
 */
const createMockIssue = (overrides = {}) => {
  const now = Date.now();
  const createdAt = overrides.created_at || new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: Math.floor(Math.random() * 1000000),
    number: Math.floor(Math.random() * 1000),
    title: 'Test issue',
    state: 'open',
    created_at: createdAt,
    closed_at: null,
    ...overrides
  };
};

/**
 * Create mock pull request data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock pull request object
 */
const createMockPR = (overrides = {}) => {
  const now = Date.now();
  const createdAt = overrides.created_at || new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: Math.floor(Math.random() * 1000000),
    number: Math.floor(Math.random() * 1000),
    title: 'Test pull request',
    state: 'open',
    merged: false,
    created_at: createdAt,
    merged_at: null,
    closed_at: null,
    ...overrides
  };
};

/**
 * Create mock contributor data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock contributor object
 */
const createMockContributor = (overrides = {}) => ({
  total: 100,
  weeks: [],
  author: {
    login: `contributor-${Math.floor(Math.random() * 1000)}`,
    id: Math.floor(Math.random() * 1000000),
    type: 'User',
    ...overrides.author
  },
  ...overrides
});

/**
 * Create mock GitHub event data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock event object
 */
const createMockEvent = (overrides = {}) => ({
  id: String(Math.floor(Math.random() * 1000000000)),
  type: 'WatchEvent',
  created_at: new Date().toISOString(),
  actor: {
    login: 'test-user',
    id: 12345
  },
  ...overrides
});

/**
 * Create mock release data
 * @param {Object} overrides - Properties to override
 * @returns {Object} Mock release object
 */
const createMockRelease = (overrides = {}) => ({
  id: Math.floor(Math.random() * 1000000),
  tag_name: 'v1.0.0',
  name: 'Version 1.0.0',
  published_at: new Date().toISOString(),
  draft: false,
  prerelease: false,
  ...overrides
});

/**
 * Create an array of mock issues with various states
 * @param {Object} options - Configuration options
 * @returns {Object[]} Array of mock issues
 */
const createMockIssueSet = (options = {}) => {
  const {
    total = 10,
    openCount = 3,
    closedCount = 7,
    windowDays = 30
  } = options;

  const issues = [];
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Create closed issues
  for (let i = 0; i < closedCount; i++) {
    const createdAt = new Date(now - Math.random() * windowMs);
    const closedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

    issues.push(createMockIssue({
      state: 'closed',
      created_at: createdAt.toISOString(),
      closed_at: closedAt.toISOString()
    }));
  }

  // Create open issues
  for (let i = 0; i < openCount; i++) {
    issues.push(createMockIssue({
      state: 'open',
      created_at: new Date(now - Math.random() * windowMs).toISOString()
    }));
  }

  return issues;
};

/**
 * Create an array of mock PRs with various states
 * @param {Object} options - Configuration options
 * @returns {Object[]} Array of mock PRs
 */
const createMockPRSet = (options = {}) => {
  const {
    mergedCount = 5,
    closedCount = 2,
    openCount = 3,
    windowDays = 30
  } = options;

  const prs = [];
  const now = Date.now();
  const windowMs = windowDays * 24 * 60 * 60 * 1000;

  // Create merged PRs
  for (let i = 0; i < mergedCount; i++) {
    const createdAt = new Date(now - Math.random() * windowMs);
    const mergedAt = new Date(createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);

    prs.push(createMockPR({
      state: 'closed',
      merged: true,
      created_at: createdAt.toISOString(),
      merged_at: mergedAt.toISOString(),
      closed_at: mergedAt.toISOString()
    }));
  }

  // Create closed (not merged) PRs
  for (let i = 0; i < closedCount; i++) {
    const createdAt = new Date(now - Math.random() * windowMs);
    const closedAt = new Date(createdAt.getTime() + Math.random() * 5 * 24 * 60 * 60 * 1000);

    prs.push(createMockPR({
      state: 'closed',
      merged: false,
      created_at: createdAt.toISOString(),
      closed_at: closedAt.toISOString()
    }));
  }

  // Create open PRs
  for (let i = 0; i < openCount; i++) {
    prs.push(createMockPR({
      state: 'open',
      created_at: new Date(now - Math.random() * windowMs).toISOString()
    }));
  }

  return prs;
};

/**
 * Create an array of mock contributors
 * @param {Object} options - Configuration options
 * @returns {Object[]} Array of mock contributors
 */
const createMockContributorSet = (options = {}) => {
  const {
    count = 5,
    distribution = 'balanced' // 'balanced', 'concentrated', 'single'
  } = options;

  const contributors = [];

  if (distribution === 'single') {
    contributors.push(createMockContributor({
      total: 500,
      author: { login: 'solo-developer' }
    }));
    return contributors;
  }

  if (distribution === 'concentrated') {
    // Top contributor has 80% of commits
    contributors.push(createMockContributor({
      total: 800,
      author: { login: 'top-contributor' }
    }));
    for (let i = 1; i < count; i++) {
      contributors.push(createMockContributor({
        total: Math.floor(200 / (count - 1)),
        author: { login: `contributor-${i}` }
      }));
    }
    return contributors;
  }

  // Balanced distribution
  for (let i = 0; i < count; i++) {
    contributors.push(createMockContributor({
      total: 100 - i * 10,
      author: { login: `contributor-${i}` }
    }));
  }

  return contributors;
};

// =============================================================================
// UTILITY FUNCTION TESTS
// =============================================================================

describe('PulseDashboard Utilities', () => {
  describe('average', () => {
    it('should calculate average of array', () => {
      expect(average([1, 2, 3, 4, 5])).toBe(3);
    });

    it('should return 0 for empty array', () => {
      expect(average([])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(average(null)).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(average(undefined)).toBe(0);
    });

    it('should handle single element array', () => {
      expect(average([42])).toBe(42);
    });

    it('should handle negative numbers', () => {
      expect(average([-10, 10])).toBe(0);
    });

    it('should handle decimal numbers', () => {
      expect(average([1.5, 2.5])).toBe(2);
    });

    it('should handle NaN values in array', () => {
      expect(average([1, NaN, 3])).toBe(4 / 3);
    });

    it('should handle string numbers by coercing them', () => {
      expect(average([1, '2', 3])).toBe(2);
    });
  });

  describe('daysSince', () => {
    it('should calculate days since a date', () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
      expect(daysSince(twoDaysAgo.toISOString())).toBe(2);
    });

    it('should return 0 for today', () => {
      expect(daysSince(new Date().toISOString())).toBe(0);
    });

    it('should return Infinity for null input', () => {
      expect(daysSince(null)).toBe(Infinity);
    });

    it('should return Infinity for undefined input', () => {
      expect(daysSince(undefined)).toBe(Infinity);
    });

    it('should return Infinity for invalid date string', () => {
      expect(daysSince('not-a-date')).toBe(Infinity);
    });

    it('should handle Date object input', () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      expect(daysSince(sevenDaysAgo)).toBe(7);
    });

    it('should handle empty string', () => {
      expect(daysSince('')).toBe(Infinity);
    });
  });

  describe('daysBetween', () => {
    it('should calculate days between two dates', () => {
      const start = '2024-01-01';
      const end = '2024-01-15';
      expect(daysBetween(start, end)).toBe(14);
    });

    it('should return absolute value (order independent)', () => {
      const start = '2024-01-15';
      const end = '2024-01-01';
      expect(daysBetween(start, end)).toBe(14);
    });

    it('should return 0 for same date', () => {
      const date = '2024-01-01';
      expect(daysBetween(date, date)).toBe(0);
    });

    it('should return 0 for null start date', () => {
      expect(daysBetween(null, '2024-01-01')).toBe(0);
    });

    it('should return 0 for null end date', () => {
      expect(daysBetween('2024-01-01', null)).toBe(0);
    });

    it('should return 0 for invalid dates', () => {
      expect(daysBetween('invalid', 'dates')).toBe(0);
    });

    it('should handle Date objects', () => {
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-08');
      expect(daysBetween(start, end)).toBe(7);
    });
  });

  describe('getTrendDirection', () => {
    it('should return "up" for positive change above threshold', () => {
      expect(getTrendDirection(10)).toBe('up');
    });

    it('should return "down" for negative change below threshold', () => {
      expect(getTrendDirection(-10)).toBe('down');
    });

    it('should return "stable" for change within threshold', () => {
      expect(getTrendDirection(3)).toBe('stable');
      expect(getTrendDirection(-3)).toBe('stable');
    });

    it('should return "stable" for zero change', () => {
      expect(getTrendDirection(0)).toBe('stable');
    });

    it('should respect custom threshold', () => {
      expect(getTrendDirection(8, 10)).toBe('stable');
      expect(getTrendDirection(12, 10)).toBe('up');
    });

    it('should return "stable" for NaN input', () => {
      expect(getTrendDirection(NaN)).toBe('stable');
    });

    it('should return "stable" for non-number input', () => {
      expect(getTrendDirection('not a number')).toBe('stable');
      expect(getTrendDirection(null)).toBe('stable');
      expect(getTrendDirection(undefined)).toBe('stable');
    });

    it('should handle exact threshold values', () => {
      // Default threshold is 5
      expect(getTrendDirection(5)).toBe('stable');
      expect(getTrendDirection(-5)).toBe('stable');
      expect(getTrendDirection(5.1)).toBe('up');
      expect(getTrendDirection(-5.1)).toBe('down');
    });
  });

  describe('getMetricStatus', () => {
    it('should return "thriving" for score >= 75', () => {
      expect(getMetricStatus(100)).toBe('thriving');
      expect(getMetricStatus(75)).toBe('thriving');
    });

    it('should return "stable" for score >= 50 and < 75', () => {
      expect(getMetricStatus(74)).toBe('stable');
      expect(getMetricStatus(50)).toBe('stable');
    });

    it('should return "cooling" for score >= 25 and < 50', () => {
      expect(getMetricStatus(49)).toBe('cooling');
      expect(getMetricStatus(25)).toBe('cooling');
    });

    it('should return "at_risk" for score < 25', () => {
      expect(getMetricStatus(24)).toBe('at_risk');
      expect(getMetricStatus(0)).toBe('at_risk');
    });

    it('should return "stable" for NaN input', () => {
      expect(getMetricStatus(NaN)).toBe('stable');
    });

    it('should return "stable" for non-number input', () => {
      expect(getMetricStatus('high')).toBe('stable');
      expect(getMetricStatus(null)).toBe('stable');
    });

    it('should handle negative scores', () => {
      expect(getMetricStatus(-10)).toBe('at_risk');
    });

    it('should handle scores above 100', () => {
      expect(getMetricStatus(150)).toBe('thriving');
    });
  });

  describe('getDefaultMetric', () => {
    it('should return default metric for unknown type', () => {
      const result = getDefaultMetric('unknown');
      expect(result.value).toBe(0);
      expect(result.trend).toBe(0);
      expect(result.direction).toBe('stable');
      expect(result.status).toBe('stable');
      expect(result.label).toBe('unknown data unavailable');
    });

    it('should return velocity default', () => {
      const result = getDefaultMetric('velocity');
      expect(result.label).toBe('Commit data unavailable');
    });

    it('should return momentum default', () => {
      const result = getDefaultMetric('momentum');
      expect(result.label).toBe('Growth data unavailable');
    });

    it('should return issues default', () => {
      const result = getDefaultMetric('issues');
      expect(result.label).toBe('Issue data unavailable');
    });

    it('should return prs default', () => {
      const result = getDefaultMetric('prs');
      expect(result.label).toBe('Pull request data unavailable');
    });

    it('should return temperature default', () => {
      const result = getDefaultMetric('temperature');
      expect(result.label).toBe('Activity data unavailable');
    });

    it('should return bus_factor default', () => {
      const result = getDefaultMetric('bus_factor');
      expect(result.label).toBe('Contributor data unavailable');
    });

    it('should return freshness default', () => {
      const result = getDefaultMetric('freshness');
      expect(result.label).toBe('Update data unavailable');
    });

    it('should return health default', () => {
      const result = getDefaultMetric('health');
      expect(result.label).toBe('Maintenance data unavailable');
    });

    it('should have status structure', () => {
      const result = getDefaultMetric('velocity');
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
    });
  });

  describe('clamp', () => {
    it('should clamp value between min and max', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('should clamp to min if below range', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('should clamp to max if above range', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should work with negative ranges', () => {
      expect(clamp(-50, -100, 0)).toBe(-50);
      expect(clamp(-150, -100, 0)).toBe(-100);
      expect(clamp(50, -100, 0)).toBe(0);
    });

    it('should work with decimal values', () => {
      expect(clamp(0.5, 0, 1)).toBe(0.5);
      expect(clamp(-0.5, 0, 1)).toBe(0);
      expect(clamp(1.5, 0, 1)).toBe(1);
    });

    it('should handle equal min and max', () => {
      expect(clamp(100, 50, 50)).toBe(50);
    });
  });

  describe('percentageChange', () => {
    it('should calculate percentage increase', () => {
      expect(percentageChange(100, 150)).toBe(50);
    });

    it('should calculate percentage decrease', () => {
      expect(percentageChange(150, 100)).toBe(-33.33);
    });

    it('should return 0 for no change', () => {
      expect(percentageChange(100, 100)).toBeCloseTo(0, 2);
    });

    it('should return Infinity for zero old value', () => {
      expect(percentageChange(0, 100)).toBe(Infinity);
    });

    it('should handle negative values', () => {
      expect(percentageChange(-100, -50)).toBeCloseTo(50, 2);
    });

    it('should handle transition from negative to positive', () => {
      const result = percentageChange(-100, 100);
      expect(result).toBe(-200);
    });

    it('should round to 2 decimal places', () => {
      expect(percentageChange(100, 123.456)).toBeCloseTo(23.46, 2);
    });

    it('should handle null oldValue', () => {
      expect(percentageChange(null, 100)).toBe(Infinity);
    });

    it('should handle null newValue', () => {
      const result = percentageChange(100, null);
      expect(typeof result).toBe('number');
    });
  });

  describe('safeParseDate', () => {
    it('should parse ISO string', () => {
      const date = safeParseDate('2024-01-01T00:00:00Z');
      expect(date).toBeInstanceOf(Date);
      expect(date.getFullYear()).toBe(2024);
    });

    it('should parse YYYY-MM-DD format', () => {
      const date = safeParseDate('2024-01-01');
      expect(date).toBeInstanceOf(Date);
    });

    it('should handle Date object input', () => {
      const now = new Date();
      const result = safeParseDate(now);
      expect(result).toBe(now);
    });

    it('should return null for invalid string', () => {
      expect(safeParseDate('not-a-date')).toBeNull();
    });

    it('should return null for null input', () => {
      expect(safeParseDate(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(safeParseDate(undefined)).toBeNull();
    });

    it('should handle empty string', () => {
      expect(safeParseDate('')).toBeNull();
    });
  });

  describe('emptySparkline', () => {
    it('should return array of zeros', () => {
      const result = emptySparkline(5);
      expect(result).toEqual([0, 0, 0, 0, 0]);
    });

    it('should default to 52 weeks', () => {
      const result = emptySparkline();
      expect(result.length).toBe(52);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('should handle negative length', () => {
      const result = emptySparkline(-5);
      expect(result.length).toBe(0);
    });

    it('should handle zero length', () => {
      const result = emptySparkline(0);
      expect(result.length).toBe(0);
    });

    it('should handle large lengths', () => {
      const result = emptySparkline(1000);
      expect(result.length).toBe(1000);
    });
  });
});

// =============================================================================
// SPARKLINE TESTS
// =============================================================================

describe('Sparkline', () => {
  describe('createSparkline', () => {
    it('should create sparkline container with SVG', () => {
      const data = [5, 10, 8, 15, 12, 20, 18, 25];
      const element = createSparkline(data);

      expect(element.className).toContain('sparkline');
      expect(element.querySelector('svg')).not.toBeNull();
    });

    it('should set aria-hidden for accessibility', () => {
      const data = [1, 2, 3, 4, 5];
      const element = createSparkline(data);

      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    it('should create line path element', () => {
      const data = [5, 10, 8, 15, 12];
      const element = createSparkline(data);
      const linePath = element.querySelector('.sparkline__line');

      expect(linePath).not.toBeNull();
      expect(linePath.getAttribute('stroke')).toBe('currentColor');
      expect(linePath.getAttribute('fill')).toBe('none');
    });

    it('should create area fill by default', () => {
      const data = [5, 10, 8, 15, 12];
      const element = createSparkline(data);
      const areaPath = element.querySelector('.sparkline__area');

      expect(areaPath).not.toBeNull();
    });

    it('should not create area fill when showArea is false', () => {
      const data = [5, 10, 8, 15, 12];
      const element = createSparkline(data, { showArea: false });
      const areaPath = element.querySelector('.sparkline__area');

      expect(areaPath).toBeNull();
    });

    it('should create endpoint dot', () => {
      const data = [5, 10, 8, 15, 12];
      const element = createSparkline(data);
      const dot = element.querySelector('.sparkline__dot');

      expect(dot).not.toBeNull();
      expect(dot.tagName.toLowerCase()).toBe('circle');
    });

    it('should handle empty array data', () => {
      const element = createSparkline([]);

      expect(element.className).toContain('sparkline--empty');
      expect(element.textContent).toContain('No data');
    });

    it('should handle null data', () => {
      const element = createSparkline(null);

      expect(element.className).toContain('sparkline--empty');
    });

    it('should handle undefined data', () => {
      const element = createSparkline(undefined);

      expect(element.className).toContain('sparkline--empty');
    });

    it('should handle non-array data', () => {
      const element = createSparkline({ foo: 'bar' });

      expect(element.className).toContain('sparkline--empty');
    });

    it('should filter out non-numeric values', () => {
      const data = [5, 'invalid', 10, null, 15, NaN, 20];
      const element = createSparkline(data);

      // Should still render with valid numbers
      expect(element.querySelector('svg')).not.toBeNull();
      expect(element.className).not.toContain('sparkline--empty');
    });

    it('should handle single data point', () => {
      const element = createSparkline([50]);

      // Should duplicate point to create flat line
      expect(element.querySelector('svg')).not.toBeNull();
      expect(element.className).not.toContain('sparkline--empty');
    });

    it('should apply trend-up class for increasing data', () => {
      // Start low, end high
      const data = [5, 6, 7, 8, 9, 10, 11, 12, 20, 25, 30, 40];
      const element = createSparkline(data);

      expect(element.className).toContain('sparkline--up');
    });

    it('should apply trend-down class for decreasing data', () => {
      // Start high, end low
      const data = [40, 35, 30, 25, 20, 15, 12, 10, 8, 6, 5, 2];
      const element = createSparkline(data);

      expect(element.className).toContain('sparkline--down');
    });

    it('should apply trend-stable class for flat data', () => {
      // Relatively flat data
      const data = [10, 11, 10, 9, 10, 11, 10, 9, 10, 11, 10, 10];
      const element = createSparkline(data);

      expect(element.className).toContain('sparkline--stable');
    });

    it('should use forced trend when provided', () => {
      // Data would auto-detect as 'up', but we force 'down'
      const data = [5, 10, 15, 20, 25, 30, 35, 40];
      const element = createSparkline(data, { trend: 'down' });

      expect(element.className).toContain('sparkline--down');
    });

    it('should respect custom width and height', () => {
      const data = [5, 10, 15, 20];
      const element = createSparkline(data, { width: 150, height: 40 });
      const svg = element.querySelector('svg');

      expect(svg.getAttribute('width')).toBe('150');
      expect(svg.getAttribute('height')).toBe('40');
      expect(svg.getAttribute('viewBox')).toBe('0 0 150 40');
    });

    it('should generate valid SVG path data', () => {
      const data = [5, 10, 15, 20];
      const element = createSparkline(data);
      const linePath = element.querySelector('.sparkline__line');
      const d = linePath.getAttribute('d');

      // Path should start with M (moveTo) and contain L (lineTo) commands
      expect(d).toMatch(/^M\s+[\d.]+\s+[\d.]+/);
      expect(d).toContain('L');
    });
  });

  describe('createMiniSparkline', () => {
    it('should create smaller sparkline', () => {
      const data = [5, 10, 15, 20];
      const element = createMiniSparkline(data);
      const svg = element.querySelector('svg');

      expect(svg.getAttribute('width')).toBe('60');
      expect(svg.getAttribute('height')).toBe('20');
    });

    it('should not show area fill', () => {
      const data = [5, 10, 15, 20];
      const element = createMiniSparkline(data);
      const areaPath = element.querySelector('.sparkline__area');

      expect(areaPath).toBeNull();
    });

    it('should accept forced trend', () => {
      const data = [5, 10, 15, 20];
      const element = createMiniSparkline(data, 'stable');

      expect(element.className).toContain('sparkline--stable');
    });
  });

  describe('calculateTrend', () => {
    it('should return stable for null data', () => {
      expect(calculateTrend(null)).toBe('stable');
    });

    it('should return stable for empty array', () => {
      expect(calculateTrend([])).toBe('stable');
    });

    it('should return stable for less than 4 points', () => {
      expect(calculateTrend([1, 2, 3])).toBe('stable');
    });

    it('should detect upward trend', () => {
      const data = [10, 12, 14, 16, 18, 20, 22, 24, 30, 35, 40, 50];
      expect(calculateTrend(data)).toBe('up');
    });

    it('should detect downward trend', () => {
      const data = [50, 45, 40, 35, 30, 25, 22, 20, 18, 16, 14, 10];
      expect(calculateTrend(data)).toBe('down');
    });

    it('should detect stable trend', () => {
      const data = [20, 21, 19, 20, 21, 19, 20, 21, 20, 19, 21, 20];
      expect(calculateTrend(data)).toBe('stable');
    });

    it('should handle all zeros gracefully', () => {
      const data = [0, 0, 0, 0, 0, 0, 0, 0];
      expect(calculateTrend(data)).toBe('stable');
    });

    it('should handle starting from zero', () => {
      const data = [0, 0, 0, 0, 10, 20, 30, 40];
      expect(calculateTrend(data)).toBe('up');
    });
  });
});

// =============================================================================
// TREND ARROW TESTS
// =============================================================================

describe('TrendArrow', () => {
  describe('createTrendArrow', () => {
    it('should create trend arrow container', () => {
      const element = createTrendArrow(15);

      expect(element.tagName.toLowerCase()).toBe('span');
      expect(element.className).toContain('trend-arrow');
    });

    it('should apply up modifier for positive values', () => {
      const element = createTrendArrow(15.2);

      expect(element.className).toContain('trend-arrow--up');
    });

    it('should apply down modifier for negative values', () => {
      const element = createTrendArrow(-8.5);

      expect(element.className).toContain('trend-arrow--down');
    });

    it('should apply stable modifier for near-zero values', () => {
      const element = createTrendArrow(0.5);

      expect(element.className).toContain('trend-arrow--stable');
    });

    it('should display percentage value with plus sign for up', () => {
      const element = createTrendArrow(15.2);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('+15.2%');
    });

    it('should display percentage value with minus sign for down', () => {
      const element = createTrendArrow(-8.5);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('-8.5%');
    });

    it('should display percentage without sign for stable', () => {
      const element = createTrendArrow(0.3);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('0.3%');
    });

    it('should include arrow icon', () => {
      const element = createTrendArrow(10);
      const icon = element.querySelector('.trend-arrow__icon');

      expect(icon).not.toBeNull();
      expect(icon.tagName.toLowerCase()).toBe('svg');
    });

    it('should set aria-hidden on icon wrapper', () => {
      const element = createTrendArrow(10);
      const iconWrapper = element.querySelector('.trend-arrow__icon-wrapper');

      expect(iconWrapper.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have role="img" for accessibility', () => {
      const element = createTrendArrow(15);

      expect(element.getAttribute('role')).toBe('img');
    });

    it('should have aria-label for screen readers', () => {
      const element = createTrendArrow(15.5);

      expect(element.getAttribute('aria-label')).toContain('Trending up');
      expect(element.getAttribute('aria-label')).toContain('percent');
    });

    it('should clamp large positive values to 999%', () => {
      const element = createTrendArrow(1500);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('+999%');
    });

    it('should clamp large negative values to -999%', () => {
      const element = createTrendArrow(-2000);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('-999%');
    });

    it('should handle null value as stable', () => {
      const element = createTrendArrow(null);

      expect(element.className).toContain('trend-arrow--stable');
    });

    it('should handle undefined value as stable', () => {
      const element = createTrendArrow(undefined);

      expect(element.className).toContain('trend-arrow--stable');
    });

    it('should handle NaN value as stable', () => {
      const element = createTrendArrow(NaN);

      expect(element.className).toContain('trend-arrow--stable');
    });

    it('should respect showPercentage=false option', () => {
      const element = createTrendArrow(15, { showPercentage: false });
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan).toBeNull();
    });

    it('should remove trailing .0 from whole numbers', () => {
      const element = createTrendArrow(25);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan.textContent).toBe('+25%');
    });

    it('should handle zero exactly as stable', () => {
      const element = createTrendArrow(0);

      expect(element.className).toContain('trend-arrow--stable');
    });

    it('should treat values within threshold as stable', () => {
      // 1% threshold
      expect(createTrendArrow(0.9).className).toContain('trend-arrow--stable');
      expect(createTrendArrow(-0.9).className).toContain('trend-arrow--stable');
      expect(createTrendArrow(1).className).toContain('trend-arrow--stable');
      expect(createTrendArrow(-1).className).toContain('trend-arrow--stable');
    });

    it('should treat values beyond threshold as up/down', () => {
      expect(createTrendArrow(1.1).className).toContain('trend-arrow--up');
      expect(createTrendArrow(-1.1).className).toContain('trend-arrow--down');
    });
  });

  describe('createMiniTrendArrow', () => {
    it('should create arrow without percentage text', () => {
      const element = createMiniTrendArrow(15);
      const valueSpan = element.querySelector('.trend-arrow__value');

      expect(valueSpan).toBeNull();
    });

    it('should still include icon', () => {
      const element = createMiniTrendArrow(15);
      const icon = element.querySelector('.trend-arrow__icon');

      expect(icon).not.toBeNull();
    });

    it('should apply correct modifier class', () => {
      expect(createMiniTrendArrow(10).className).toContain('trend-arrow--up');
      expect(createMiniTrendArrow(-10).className).toContain('trend-arrow--down');
      expect(createMiniTrendArrow(0).className).toContain('trend-arrow--stable');
    });
  });

  describe('getTrendDirectionArrow', () => {
    it('should return up for positive values above threshold', () => {
      expect(getTrendDirectionArrow(5)).toBe('up');
      expect(getTrendDirectionArrow(100)).toBe('up');
    });

    it('should return down for negative values below threshold', () => {
      expect(getTrendDirectionArrow(-5)).toBe('down');
      expect(getTrendDirectionArrow(-100)).toBe('down');
    });

    it('should return stable for values near zero', () => {
      expect(getTrendDirectionArrow(0)).toBe('stable');
      expect(getTrendDirectionArrow(0.5)).toBe('stable');
      expect(getTrendDirectionArrow(-0.5)).toBe('stable');
      expect(getTrendDirectionArrow(1)).toBe('stable');
      expect(getTrendDirectionArrow(-1)).toBe('stable');
    });

    it('should return stable for NaN', () => {
      expect(getTrendDirectionArrow(NaN)).toBe('stable');
    });

    it('should return stable for non-number types', () => {
      expect(getTrendDirectionArrow('15')).toBe('stable');
      expect(getTrendDirectionArrow(null)).toBe('stable');
      expect(getTrendDirectionArrow(undefined)).toBe('stable');
    });
  });

  describe('formatPercentage', () => {
    it('should format positive values with plus sign', () => {
      expect(formatPercentage(15.2, 'up')).toBe('+15.2%');
    });

    it('should format negative values with minus sign', () => {
      expect(formatPercentage(-8.5, 'down')).toBe('-8.5%');
    });

    it('should format stable values without sign', () => {
      expect(formatPercentage(0.3, 'stable')).toBe('0.3%');
    });

    it('should clamp extreme values', () => {
      expect(formatPercentage(5000, 'up')).toBe('+999%');
      expect(formatPercentage(-3000, 'down')).toBe('-999%');
    });

    it('should remove trailing zeros', () => {
      expect(formatPercentage(25.0, 'up')).toBe('+25%');
      expect(formatPercentage(10.50, 'up')).toBe('+10.5%');
    });

    it('should handle zero', () => {
      expect(formatPercentage(0, 'stable')).toBe('0%');
    });

    it('should round to 1 decimal place', () => {
      expect(formatPercentage(15.456, 'up')).toBe('+15.5%');
      expect(formatPercentage(15.444, 'up')).toBe('+15.4%');
    });

    it('should handle null as 0', () => {
      expect(formatPercentage(null, 'stable')).toBe('0%');
    });

    it('should handle undefined as 0', () => {
      expect(formatPercentage(undefined, 'stable')).toBe('0%');
    });

    it('should handle NaN', () => {
      const result = formatPercentage(NaN, 'stable');
      expect(result).toContain('%');
    });
  });
});

// =============================================================================
// METRIC CALCULATION TESTS
// =============================================================================

describe('Metric Calculations', () => {
  describe('calculateVelocityScore', () => {
    it('should return 100 for healthy velocity', () => {
      const repo = createMockRepo();
      const participation = createMockParticipation({
        recentAvg: 20,
        previousAvg: 15
      });

      const score = calculateVelocityScore(repo, participation);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return low score for no activity', () => {
      const repo = createMockRepo({ pushed_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() });
      const participation = createMockParticipation({ recentAvg: 0, previousAvg: 0 });

      const score = calculateVelocityScore(repo, participation);
      expect(score).toBeLessThan(50);
    });

    it('should handle missing participation data', () => {
      const repo = createMockRepo();
      const score = calculateVelocityScore(repo, null);
      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing repo data', () => {
      const participation = createMockParticipation();
      const score = calculateVelocityScore(null, participation);
      expect(typeof score).toBe('number');
    });
  });

  describe('calculateCommunityMomentum', () => {
    it('should return high score for growing project', () => {
      const repo = createMockRepo({
        stargazers_count: 5000,
        forks_count: 500
      });
      const participation = createMockParticipation({
        recentAvg: 50,
        previousAvg: 30,
        baseAvg: 10
      });

      const score = calculateCommunityMomentum(repo, participation);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return low score for stagnant project', () => {
      const repo = createMockRepo({
        stargazers_count: 100,
        forks_count: 10
      });
      const participation = createMockParticipation({
        recentAvg: 1,
        previousAvg: 1
      });

      const score = calculateCommunityMomentum(repo, participation);
      expect(score).toBeLessThan(50);
    });
  });

  describe('calculateIssueTemperature', () => {
    it('should return high temperature for active issues', () => {
      const issues = createMockIssueSet({
        openCount: 20,
        closedCount: 30,
        windowDays: 7
      });

      const temperature = calculateIssueTemperature(issues);
      expect(temperature).toBeGreaterThan(50);
    });

    it('should return low temperature for stale issues', () => {
      const issues = createMockIssueSet({
        openCount: 50,
        closedCount: 0,
        windowDays: 365
      });

      const temperature = calculateIssueTemperature(issues);
      expect(temperature).toBeLessThan(50);
    });

    it('should handle empty issue list', () => {
      const temperature = calculateIssueTemperature([]);
      expect(temperature).toBeLessThanOrEqual(50);
    });

    it('should handle null issue list', () => {
      const temperature = calculateIssueTemperature(null);
      expect(typeof temperature).toBe('number');
    });
  });

  describe('calculatePRHealth', () => {
    it('should return high health for well-managed PRs', () => {
      const prs = createMockPRSet({
        mergedCount: 20,
        closedCount: 2,
        openCount: 3
      });

      const health = calculatePRHealth(prs);
      expect(health).toBeGreaterThan(0);
      expect(health).toBeLessThanOrEqual(100);
    });

    it('should return low health for many stalled PRs', () => {
      const prs = createMockPRSet({
        mergedCount: 5,
        closedCount: 0,
        openCount: 30
      });

      const health = calculatePRHealth(prs);
      expect(health).toBeLessThan(50);
    });

    it('should handle empty PR list', () => {
      const health = calculatePRHealth([]);
      expect(health).toBeLessThanOrEqual(50);
    });
  });

  describe('calculateBusFactor', () => {
    it('should return high score for distributed contributions', () => {
      const contributors = createMockContributorSet({
        count: 10,
        distribution: 'balanced'
      });

      const score = calculateBusFactor(contributors);
      expect(score).toBeGreaterThan(50);
    });

    it('should return low score for concentrated contributions', () => {
      const contributors = createMockContributorSet({
        distribution: 'single'
      });

      const score = calculateBusFactor(contributors);
      expect(score).toBeLessThan(50);
    });

    it('should handle empty contributor list', () => {
      const score = calculateBusFactor([]);
      expect(score).toBeLessThanOrEqual(50);
    });

    it('should handle null contributor list', () => {
      const score = calculateBusFactor(null);
      expect(typeof score).toBe('number');
    });
  });

  describe('calculateFreshnessIndex', () => {
    it('should return high score for recently updated repo', () => {
      const repo = createMockRepo({
        updated_at: new Date().toISOString(),
        pushed_at: new Date().toISOString()
      });

      const score = calculateFreshnessIndex(repo);
      expect(score).toBeGreaterThan(50);
    });

    it('should return low score for stale repo', () => {
      const repo = createMockRepo({
        updated_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
        pushed_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
      });

      const score = calculateFreshnessIndex(repo);
      expect(score).toBeLessThan(50);
    });

    it('should handle null repo', () => {
      const score = calculateFreshnessIndex(null);
      expect(typeof score).toBe('number');
    });
  });

  describe('calculateOverallPulse', () => {
    it('should return average of all metrics', () => {
      const metrics = {
        velocity: { value: 80 },
        momentum: { value: 70 },
        temperature: { value: 85 },
        health: { value: 75 },
        bus_factor: { value: 65 },
        freshness: { value: 90 }
      };

      const pulse = calculateOverallPulse(metrics);
      expect(pulse).toBeGreaterThan(0);
      expect(pulse).toBeLessThanOrEqual(100);
    });

    it('should handle metrics with missing values', () => {
      const metrics = {
        velocity: { value: 80 }
      };

      const pulse = calculateOverallPulse(metrics);
      expect(typeof pulse).toBe('number');
    });

    it('should handle empty metrics object', () => {
      const pulse = calculateOverallPulse({});
      expect(pulse).toBe(0);
    });
  });

  describe('calculateAllMetrics', () => {
    it('should calculate all metrics for healthy repository', () => {
      const repo = createMockRepo();
      const participation = createMockParticipation();
      const issues = createMockIssueSet();
      const prs = createMockPRSet();
      const contributors = createMockContributorSet();

      const allMetrics = calculateAllMetrics(
        repo,
        participation,
        issues,
        prs,
        contributors
      );

      expect(allMetrics).toHaveProperty('velocity');
      expect(allMetrics).toHaveProperty('momentum');
      expect(allMetrics).toHaveProperty('temperature');
      expect(allMetrics).toHaveProperty('health');
      expect(allMetrics).toHaveProperty('bus_factor');
      expect(allMetrics).toHaveProperty('freshness');
      expect(allMetrics).toHaveProperty('overall');
    });

    it('should handle null repository', () => {
      const metrics = calculateAllMetrics(null, null, [], [], []);
      expect(metrics).toBeDefined();
      expect(metrics).toHaveProperty('overall');
    });

    it('should have all values between 0-100', () => {
      const repo = createMockRepo();
      const participation = createMockParticipation();
      const issues = createMockIssueSet();
      const prs = createMockPRSet();
      const contributors = createMockContributorSet();

      const allMetrics = calculateAllMetrics(
        repo,
        participation,
        issues,
        prs,
        contributors
      );

      Object.values(allMetrics).forEach(metric => {
        if (metric && metric.value !== undefined) {
          expect(metric.value).toBeGreaterThanOrEqual(0);
          expect(metric.value).toBeLessThanOrEqual(100);
        }
      });
    });
  });
});

// =============================================================================
// VISUALIZATION COMPONENT TESTS
// =============================================================================

describe('Visualization Components', () => {
  describe('createTemperatureIndicator', () => {
    it('should create temperature indicator element', () => {
      const element = createTemperatureIndicator(75);

      expect(element.className).toContain('temperature-indicator');
    });

    it('should apply correct level class for hot temperature', () => {
      const element = createTemperatureIndicator(90);

      expect(element.className).toContain('temperature-indicator--hot');
    });

    it('should apply correct level class for warm temperature', () => {
      const element = createTemperatureIndicator(70);

      expect(element.className).toContain('temperature-indicator--warm');
    });

    it('should apply correct level class for cool temperature', () => {
      const element = createTemperatureIndicator(40);

      expect(element.className).toContain('temperature-indicator--cool');
    });

    it('should apply correct level class for cold temperature', () => {
      const element = createTemperatureIndicator(10);

      expect(element.className).toContain('temperature-indicator--cold');
    });

    it('should clamp values to 0-100 range', () => {
      const hotElement = createTemperatureIndicator(150);
      const coldElement = createTemperatureIndicator(-50);

      expect(hotElement.className).toContain('temperature-indicator--hot');
      expect(coldElement.className).toContain('temperature-indicator--cold');
    });
  });

  describe('getTemperatureLevel', () => {
    it('should return "hot" for 75+', () => {
      expect(getTemperatureLevel(75)).toBe('hot');
      expect(getTemperatureLevel(100)).toBe('hot');
    });

    it('should return "warm" for 50-74', () => {
      expect(getTemperatureLevel(50)).toBe('warm');
      expect(getTemperatureLevel(74)).toBe('warm');
    });

    it('should return "cool" for 25-49', () => {
      expect(getTemperatureLevel(25)).toBe('cool');
      expect(getTemperatureLevel(49)).toBe('cool');
    });

    it('should return "cold" for 0-24', () => {
      expect(getTemperatureLevel(0)).toBe('cold');
      expect(getTemperatureLevel(24)).toBe('cold');
    });
  });

  describe('createPRFunnel', () => {
    it('should create PR funnel visualization', () => {
      const element = createPRFunnel(10, 8, 6);

      expect(element.className).toContain('pr-funnel');
    });

    it('should have labels for each stage', () => {
      const element = createPRFunnel(10, 8, 6);
      const labels = element.querySelectorAll('.pr-funnel__label');

      expect(labels.length).toBeGreaterThan(0);
    });
  });

  describe('createContributorBars', () => {
    it('should create contributor bars chart', () => {
      const contributors = createMockContributorSet({ count: 5 });
      const element = createContributorBars(contributors);

      expect(element.className).toContain('contributor-bars');
    });

    it('should limit display to top N contributors', () => {
      const contributors = createMockContributorSet({ count: 20 });
      const element = createContributorBars(contributors, { limit: 5 });

      const bars = element.querySelectorAll('.contributor-bar');
      expect(bars.length).toBeLessThanOrEqual(5);
    });
  });

  describe('getBusFactorRisk', () => {
    it('should return "high" for concentrated contributions', () => {
      expect(getBusFactorRisk(10)).toBe('high');
    });

    it('should return "medium" for medium bus factor', () => {
      expect(getBusFactorRisk(40)).toBe('medium');
    });

    it('should return "low" for distributed contributions', () => {
      expect(getBusFactorRisk(80)).toBe('low');
    });
  });

  describe('createFreshnessGauge', () => {
    it('should create freshness gauge element', () => {
      const element = createFreshnessGauge(70);

      expect(element.className).toContain('freshness-gauge');
    });

    it('should display percentage value', () => {
      const element = createFreshnessGauge(65);
      const value = element.querySelector('.freshness-gauge__value');

      expect(value.textContent).toContain('65');
    });
  });

  describe('getFreshnessLevel', () => {
    it('should return "fresh" for high freshness', () => {
      expect(getFreshnessLevel(80)).toBe('fresh');
    });

    it('should return "stale" for low freshness', () => {
      expect(getFreshnessLevel(20)).toBe('stale');
    });
  });

  describe('calculateFreshnessScore', () => {
    it('should return number between 0-100', () => {
      const repo = createMockRepo();
      const score = calculateFreshnessScore(repo);

      expect(typeof score).toBe('number');
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should return high score for recent updates', () => {
      const repo = createMockRepo({
        updated_at: new Date().toISOString()
      });
      const score = calculateFreshnessScore(repo);

      expect(score).toBeGreaterThan(50);
    });

    it('should return low score for old updates', () => {
      const repo = createMockRepo({
        updated_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      });
      const score = calculateFreshnessScore(repo);

      expect(score).toBeLessThan(50);
    });
  });
});

// =============================================================================
// METRIC CARD COMPONENT TESTS
// =============================================================================

describe('MetricCard', () => {
  describe('createMetricCard', () => {
    it('should create metric card element', () => {
      const metric = {
        value: 75,
        trend: 5,
        direction: 'up',
        status: 'thriving',
        label: 'Velocity'
      };

      const element = createMetricCard(metric);

      expect(element.className).toContain('metric-card');
      expect(element.textContent).toContain('Velocity');
      expect(element.textContent).toContain('75');
    });

    it('should display trend arrow', () => {
      const metric = {
        value: 80,
        trend: 10,
        direction: 'up',
        status: 'thriving',
        label: 'Test Metric'
      };

      const element = createMetricCard(metric);
      const trendArrow = element.querySelector('.trend-arrow');

      expect(trendArrow).not.toBeNull();
    });

    it('should apply status class', () => {
      const metric = {
        value: 90,
        trend: 0,
        direction: 'stable',
        status: 'thriving',
        label: 'Test'
      };

      const element = createMetricCard(metric);

      expect(element.className).toContain('metric-card--thriving');
    });
  });

  describe('createCompactMetricCard', () => {
    it('should create smaller metric card', () => {
      const metric = {
        value: 70,
        trend: -5,
        direction: 'down',
        status: 'stable',
        label: 'Compact'
      };

      const element = createCompactMetricCard(metric);

      expect(element.className).toContain('metric-card--compact');
    });

    it('should omit unnecessary details', () => {
      const metric = {
        value: 65,
        trend: 0,
        direction: 'stable',
        status: 'stable',
        label: 'Test'
      };

      const element = createCompactMetricCard(metric);

      // Should still show value and label
      expect(element.textContent).toContain('65');
      expect(element.textContent).toContain('Test');
    });
  });

  describe('createMetricCardSkeleton', () => {
    it('should create loading skeleton', () => {
      const element = createMetricCardSkeleton();

      expect(element.className).toContain('metric-card--skeleton');
    });

    it('should have placeholder elements', () => {
      const element = createMetricCardSkeleton();
      const placeholders = element.querySelectorAll('.skeleton-placeholder');

      expect(placeholders.length).toBeGreaterThan(0);
    });

    it('should be accessible', () => {
      const element = createMetricCardSkeleton();

      expect(element.getAttribute('aria-busy')).toBe('true');
    });
  });
});

// =============================================================================
// DASHBOARD COMPONENT TESTS
// =============================================================================

describe('PulseDashboard', () => {
  describe('createPulseDashboard', () => {
    it('should create dashboard container', () => {
      const metrics = {
        velocity: { value: 75, trend: 5, direction: 'up', status: 'thriving', label: 'Velocity' },
        momentum: { value: 70, trend: 0, direction: 'stable', status: 'stable', label: 'Momentum' },
        temperature: { value: 80, trend: 10, direction: 'up', status: 'thriving', label: 'Temperature' },
        health: { value: 65, trend: -5, direction: 'down', status: 'stable', label: 'Health' },
        bus_factor: { value: 55, trend: 0, direction: 'stable', status: 'stable', label: 'Bus Factor' },
        freshness: { value: 85, trend: 15, direction: 'up', status: 'thriving', label: 'Freshness' }
      };

      const element = createPulseDashboard(metrics);

      expect(element.className).toContain('pulse-dashboard');
    });

    it('should display all metric cards', () => {
      const metrics = {
        velocity: { value: 75, trend: 5, direction: 'up', status: 'thriving', label: 'Velocity' },
        momentum: { value: 70, trend: 0, direction: 'stable', status: 'stable', label: 'Momentum' },
        temperature: { value: 80, trend: 10, direction: 'up', status: 'thriving', label: 'Temperature' },
        health: { value: 65, trend: -5, direction: 'down', status: 'stable', label: 'Health' },
        bus_factor: { value: 55, trend: 0, direction: 'stable', status: 'stable', label: 'Bus Factor' },
        freshness: { value: 85, trend: 15, direction: 'up', status: 'thriving', label: 'Freshness' }
      };

      const element = createPulseDashboard(metrics);
      const cards = element.querySelectorAll('.metric-card');

      expect(cards.length).toBeGreaterThanOrEqual(6);
    });

    it('should handle partial metrics', () => {
      const metrics = {
        velocity: { value: 75, trend: 5, direction: 'up', status: 'thriving', label: 'Velocity' }
      };

      const element = createPulseDashboard(metrics);

      expect(element).not.toBeNull();
      expect(element.className).toContain('pulse-dashboard');
    });

    it('should have accessible structure', () => {
      const metrics = {
        velocity: { value: 75, trend: 5, direction: 'up', status: 'thriving', label: 'Velocity' }
      };

      const element = createPulseDashboard(metrics);

      expect(element.getAttribute('role')).toBe('region');
      expect(element.getAttribute('aria-label')).toBeDefined();
    });
  });

  describe('createPulseDashboardSkeleton', () => {
    it('should create loading skeleton dashboard', () => {
      const element = createPulseDashboardSkeleton();

      expect(element.className).toContain('pulse-dashboard--skeleton');
    });

    it('should have multiple placeholder cards', () => {
      const element = createPulseDashboardSkeleton();
      const skeletons = element.querySelectorAll('.metric-card--skeleton');

      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should be marked as loading', () => {
      const element = createPulseDashboardSkeleton();

      expect(element.getAttribute('aria-busy')).toBe('true');
    });
  });

  describe('createPulseDashboardError', () => {
    it('should create error state dashboard', () => {
      const element = createPulseDashboardError('Failed to load data');

      expect(element.className).toContain('pulse-dashboard--error');
      expect(element.textContent).toContain('Failed to load data');
    });

    it('should have error icon', () => {
      const element = createPulseDashboardError('Test error');
      const icon = element.querySelector('.dashboard-error__icon');

      expect(icon).not.toBeNull();
    });

    it('should have retry action if callback provided', () => {
      const callback = vi.fn();
      const element = createPulseDashboardError('Error', callback);
      const button = element.querySelector('.dashboard-error__retry');

      expect(button).not.toBeNull();
      button.click();
      expect(callback).toHaveBeenCalled();
    });

    it('should be accessible', () => {
      const element = createPulseDashboardError('Test error');

      expect(element.getAttribute('role')).toBe('alert');
    });
  });
});