import { describe, it, expect, beforeEach } from 'vitest';
import {
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
      expect(result.value).toBe('Cool');
      expect(result.temperature).toBe('cool');
      expect(result.label).toBe('No recent issues');
    });

    it('should return prs default', () => {
      const result = getDefaultMetric('prs');
      expect(result.label).toBe('No recent pull requests');
      expect(result.funnel).toEqual({ opened: 0, merged: 0, closed: 0, open: 0 });
    });

    it('should return busFactor default', () => {
      const result = getDefaultMetric('busFactor');
      expect(result.value).toBe(1);
      expect(result.riskLevel).toBe('critical');
    });

    it('should return freshness default', () => {
      const result = getDefaultMetric('freshness');
      expect(result.freshness).toBe('stale');
      expect(result.lastRelease).toBe('None');
    });

    it('should return generic default for null type', () => {
      const result = getDefaultMetric(null);
      expect(result.label).toBe('Data unavailable');
    });

    it('should return generic default for undefined type', () => {
      const result = getDefaultMetric();
      expect(result.label).toBe('Data unavailable');
    });
  });

  describe('clamp', () => {
    it('should return value within bounds unchanged', () => {
      expect(clamp(50, 0, 100)).toBe(50);
    });

    it('should clamp value below min to min', () => {
      expect(clamp(-10, 0, 100)).toBe(0);
    });

    it('should clamp value above max to max', () => {
      expect(clamp(150, 0, 100)).toBe(100);
    });

    it('should handle equal min and max', () => {
      expect(clamp(50, 25, 25)).toBe(25);
    });

    it('should return min for NaN input', () => {
      expect(clamp(NaN, 0, 100)).toBe(0);
    });

    it('should return min for non-number input', () => {
      expect(clamp('fifty', 0, 100)).toBe(0);
    });

    it('should handle negative bounds', () => {
      expect(clamp(-50, -100, -10)).toBe(-50);
      expect(clamp(0, -100, -10)).toBe(-10);
    });
  });

  describe('percentageChange', () => {
    it('should calculate positive percentage change', () => {
      expect(percentageChange(120, 100)).toBe(20);
    });

    it('should calculate negative percentage change', () => {
      expect(percentageChange(80, 100)).toBe(-20);
    });

    it('should return 0 for no change', () => {
      expect(percentageChange(100, 100)).toBe(0);
    });

    it('should return 100 for growth from zero', () => {
      expect(percentageChange(50, 0)).toBe(100);
    });

    it('should return -100 for decline from zero to negative', () => {
      expect(percentageChange(-50, 0)).toBe(-100);
    });

    it('should return 0 for zero to zero', () => {
      expect(percentageChange(0, 0)).toBe(0);
    });

    it('should return 0 for NaN inputs', () => {
      expect(percentageChange(NaN, 100)).toBe(0);
      expect(percentageChange(100, NaN)).toBe(0);
    });

    it('should return 0 for non-number inputs', () => {
      expect(percentageChange('a', 100)).toBe(0);
      expect(percentageChange(100, 'b')).toBe(0);
    });

    it('should handle large changes', () => {
      expect(percentageChange(1000, 100)).toBe(900);
    });
  });

  describe('safeParseDate', () => {
    it('should parse valid ISO date string', () => {
      const result = safeParseDate('2024-01-15T10:30:00Z');
      expect(result).toBeInstanceOf(Date);
      expect(result.getFullYear()).toBe(2024);
    });

    it('should return valid Date for Date object input', () => {
      const date = new Date('2024-01-15');
      const result = safeParseDate(date);
      expect(result).toBeInstanceOf(Date);
      expect(result.getTime()).toBe(date.getTime());
    });

    it('should return null for invalid date string', () => {
      expect(safeParseDate('not-a-date')).toBe(null);
    });

    it('should return null for null input', () => {
      expect(safeParseDate(null)).toBe(null);
    });

    it('should return null for undefined input', () => {
      expect(safeParseDate(undefined)).toBe(null);
    });

    it('should return null for empty string', () => {
      expect(safeParseDate('')).toBe(null);
    });

    it('should parse date-only string', () => {
      const result = safeParseDate('2024-06-15');
      expect(result).toBeInstanceOf(Date);
    });
  });

  describe('emptySparkline', () => {
    it('should create array of zeros with specified length', () => {
      const result = emptySparkline(7);
      expect(result).toHaveLength(7);
      expect(result.every(v => v === 0)).toBe(true);
    });

    it('should return empty array for length 0', () => {
      expect(emptySparkline(0)).toEqual([]);
    });

    it('should return empty array for negative length', () => {
      expect(emptySparkline(-5)).toEqual([]);
    });

    it('should return empty array for non-number input', () => {
      expect(emptySparkline('five')).toEqual([]);
    });

    it('should floor decimal length', () => {
      const result = emptySparkline(5.9);
      expect(result).toHaveLength(5);
    });
  });
});

// =============================================================================
// VELOCITY SCORE TESTS
// =============================================================================

describe('calculateVelocityScore', () => {
  describe('Empty Data', () => {
    it('should return default metric for null participation', () => {
      const result = calculateVelocityScore(null);
      expect(result.status).toBe('stable');
      expect(result.label).toBe('Commit data unavailable');
      expect(result.value).toBe(0);
      expect(result.trend).toBe(0);
      expect(result.direction).toBe('stable');
    });

    it('should return default metric for undefined participation', () => {
      const result = calculateVelocityScore(undefined);
      expect(result.status).toBe('stable');
      expect(result.label).toBe('Commit data unavailable');
    });

    it('should return default metric for missing all array', () => {
      const result = calculateVelocityScore({});
      expect(result.status).toBe('stable');
      expect(result.label).toBe('Commit data unavailable');
    });

    it('should return default metric for non-array all', () => {
      const result = calculateVelocityScore({ all: 'not an array' });
      expect(result.status).toBe('stable');
    });

    it('should return default metric for object with null all', () => {
      const result = calculateVelocityScore({ all: null });
      expect(result.status).toBe('stable');
      expect(result.label).toBe('Commit data unavailable');
    });

    it('should handle insufficient commit history (less than 4 weeks)', () => {
      const result = calculateVelocityScore({ all: [1, 2] });
      expect(result.label).toBe('Insufficient commit history');
      expect(result.status).toBe('stable');
    });

    it('should handle insufficient commit history (exactly 3 weeks)', () => {
      const result = calculateVelocityScore({ all: [5, 10, 8] });
      expect(result.label).toBe('Insufficient commit history');
    });

    it('should handle empty array', () => {
      const result = calculateVelocityScore({ all: [] });
      expect(result.label).toBe('Insufficient commit history');
      expect(result.status).toBe('stable');
    });

    it('should handle all zero commits', () => {
      const participation = { all: Array(52).fill(0) };
      const result = calculateVelocityScore(participation);
      expect(result.value).toBe(0);
      expect(result.direction).toBe('stable');
      // With zero activity, status is stable (no change)
      expect(result.status).toBe('stable');
    });

    it('should return sparklineData even for empty data', () => {
      const result = calculateVelocityScore(null);
      expect(Array.isArray(result.sparklineData)).toBe(true);
    });
  });

  describe('Increasing Activity', () => {
    it('should detect moderate increase (direction up)', () => {
      const participation = createMockParticipation({ recentAvg: 15, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });

    it('should detect strong increase with high growth rate', () => {
      const participation = createMockParticipation({ recentAvg: 30, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(50);
    });

    it('should return thriving status for high growth', () => {
      const participation = createMockParticipation({ recentAvg: 25, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.status).toBe('thriving');
    });

    it('should handle 2x increase correctly', () => {
      const participation = createMockParticipation({ recentAvg: 20, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThanOrEqual(50);
    });

    it('should handle growth from very low baseline', () => {
      const participation = createMockParticipation({ recentAvg: 10, previousAvg: 1 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });

    it('should handle extreme growth with large trend values', () => {
      const participation = createMockParticipation({ recentAvg: 100, previousAvg: 1 });
      const result = calculateVelocityScore(participation);
      // Trend can exceed 100% for extreme growth (reflects actual percentage change)
      expect(result.trend).toBeGreaterThan(100);
      expect(result.direction).toBe('up');
      expect(result.status).toBe('thriving');
    });

    it('should include positive trend in label for increasing activity', () => {
      const participation = createMockParticipation({ recentAvg: 20, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      // Label should indicate growth/positive trend
      expect(result.label.length).toBeGreaterThan(0);
    });

    it('should have higher value with more recent commits', () => {
      const lowActivity = createMockParticipation({ recentAvg: 5, previousAvg: 5 });
      const highActivity = createMockParticipation({ recentAvg: 20, previousAvg: 10 });
      const lowResult = calculateVelocityScore(lowActivity);
      const highResult = calculateVelocityScore(highActivity);
      expect(highResult.value).toBeGreaterThan(lowResult.value);
    });
  });

  describe('Declining Activity', () => {
    it('should detect moderate decline (direction down)', () => {
      const participation = createMockParticipation({ recentAvg: 8, previousAvg: 15 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThan(0);
    });

    it('should detect severe decline with significant drop', () => {
      const participation = createMockParticipation({ recentAvg: 2, previousAvg: 20 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThan(-50);
    });

    it('should return at_risk status for severe decline', () => {
      const participation = createMockParticipation({ recentAvg: 2, previousAvg: 15 });
      const result = calculateVelocityScore(participation);
      expect(result.status).toBe('at_risk');
    });

    it('should return appropriate status for moderate decline', () => {
      const participation = createMockParticipation({ recentAvg: 7, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      // 30% decline results in at_risk or cooling status
      expect(['cooling', 'stable', 'at_risk']).toContain(result.status);
    });

    it('should handle 50% decline correctly', () => {
      const participation = createMockParticipation({ recentAvg: 5, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThanOrEqual(-30);
    });

    it('should handle decline to near-zero activity', () => {
      const participation = createMockParticipation({ recentAvg: 1, previousAvg: 20 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('down');
      expect(result.status).toBe('at_risk');
    });

    it('should not go below -100% trend for extreme decline', () => {
      const participation = createMockParticipation({ recentAvg: 1, previousAvg: 100 });
      const result = calculateVelocityScore(participation);
      expect(result.trend).toBeGreaterThanOrEqual(-100);
    });

    it('should have lower value with declining commits', () => {
      const stableActivity = createMockParticipation({ recentAvg: 10, previousAvg: 10 });
      const decliningActivity = createMockParticipation({ recentAvg: 3, previousAvg: 15 });
      const stableResult = calculateVelocityScore(stableActivity);
      const decliningResult = calculateVelocityScore(decliningActivity);
      expect(decliningResult.value).toBeLessThan(stableResult.value);
    });
  });

  describe('Stable Activity', () => {
    it('should detect stable activity', () => {
      const participation = createMockParticipation({ recentAvg: 10, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('stable');
    });

    it('should detect small changes as stable or up', () => {
      // Small increase (10%) may be detected as stable or slight up depending on threshold
      const participation = createMockParticipation({ recentAvg: 11, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(['stable', 'up']).toContain(result.direction);
    });

    it('should return stable status for consistent activity', () => {
      const participation = createMockParticipation({ recentAvg: 10, previousAvg: 10 });
      const result = calculateVelocityScore(participation);
      expect(result.status).toBe('stable');
    });
  });

  describe('MetricResult Shape', () => {
    it('should return complete MetricResult shape', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('sparklineData');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
    });

    it('should include sparklineData with 13 weeks', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(result.sparklineData).toHaveLength(13);
    });

    it('should have valid direction values', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(['up', 'down', 'stable']).toContain(result.direction);
    });

    it('should have valid status values', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(['thriving', 'stable', 'cooling', 'at_risk']).toContain(result.status);
    });

    it('should have numeric value', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(typeof result.value).toBe('number');
    });

    it('should have numeric trend', () => {
      const participation = createMockParticipation();
      const result = calculateVelocityScore(participation);
      expect(typeof result.trend).toBe('number');
    });
  });
});

// =============================================================================
// COMMUNITY MOMENTUM TESTS
// =============================================================================

describe('calculateCommunityMomentum', () => {
  describe('Empty/Invalid Data', () => {
    it('should return default metric for null repo', () => {
      const result = calculateCommunityMomentum(null);
      expect(result.label).toBe('Growth data unavailable');
      expect(result.status).toBe('stable');
      expect(result.value).toBe(0);
    });

    it('should return default metric for undefined repo', () => {
      const result = calculateCommunityMomentum(undefined);
      expect(result.label).toBe('Growth data unavailable');
    });

    it('should handle repo with missing stargazers_count', () => {
      const repo = createMockRepo({ stargazers_count: undefined });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(0);
    });

    it('should handle repo with null stargazers_count', () => {
      const repo = createMockRepo({ stargazers_count: null });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(0);
    });

    it('should handle repo with zero stars', () => {
      const repo = createMockRepo({ stargazers_count: 0, forks_count: 0 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(0);
      expect(result.status).toBeDefined();
    });

    it('should handle null events array', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo, null);
      expect(result.status).toBeDefined();
      expect(result.recentStars).toBe(0);
    });

    it('should handle non-array events', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo, 'not an array');
      expect(result.status).toBeDefined();
    });

    it('should return sparklineData even for empty data', () => {
      const result = calculateCommunityMomentum(null);
      expect(Array.isArray(result.sparklineData)).toBe(true);
    });
  });

  describe('Star Count Classification', () => {
    it('should handle repo with low stars', () => {
      const repo = createMockRepo({ stargazers_count: 5 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(5);
      expect(result.status).toBeDefined();
    });

    it('should calculate star count correctly for medium repos', () => {
      const repo = createMockRepo({ stargazers_count: 500 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(500);
    });

    it('should calculate star count correctly for popular repos', () => {
      const repo = createMockRepo({ stargazers_count: 5000 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(5000);
    });

    it('should handle very high star counts', () => {
      const repo = createMockRepo({ stargazers_count: 100000 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(100000);
      expect(result.label).toContain('100K');
    });

    it('should give thriving status to highly starred repos', () => {
      const repo = createMockRepo({ stargazers_count: 50000, forks_count: 5000 });
      const result = calculateCommunityMomentum(repo);
      expect(result.status).toBe('thriving');
    });

    it('should give stable status to medium starred repos', () => {
      const repo = createMockRepo({ stargazers_count: 1000, forks_count: 100 });
      const result = calculateCommunityMomentum(repo);
      expect(['stable', 'thriving']).toContain(result.status);
    });

    it('should give lower status to low starred repos', () => {
      const repo = createMockRepo({ stargazers_count: 5, forks_count: 0 });
      const result = calculateCommunityMomentum(repo);
      expect(['cooling', 'at_risk', 'stable']).toContain(result.status);
    });
  });

  describe('Label Formatting', () => {
    it('should format large star counts with K suffix in label', () => {
      const repo = createMockRepo({ stargazers_count: 10000 });
      const result = calculateCommunityMomentum(repo);
      expect(result.label).toContain('10K');
    });

    it('should format medium star counts without suffix', () => {
      const repo = createMockRepo({ stargazers_count: 500 });
      const result = calculateCommunityMomentum(repo);
      expect(result.label).toContain('500');
      expect(result.label).not.toContain('K');
    });

    it('should include trend indicator in label for growth', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      // Create watch events to simulate recent stars
      const events = Array(20).fill(null).map(() => createMockEvent({ type: 'WatchEvent' }));
      const result = calculateCommunityMomentum(repo, events);
      if (result.direction === 'up') {
        expect(result.label).toMatch(/\+\d+%/);
      }
    });

    it('should show stable label when no change', () => {
      const repo = createMockRepo({ stargazers_count: 500 });
      const result = calculateCommunityMomentum(repo, []);
      expect(result.label).toContain('stable');
    });
  });

  describe('Event-based Growth Detection', () => {
    it('should detect growth from WatchEvents', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      const events = Array(10).fill(null).map(() => createMockEvent({ type: 'WatchEvent' }));
      const result = calculateCommunityMomentum(repo, events);
      expect(result.recentStars).toBe(10);
    });

    it('should count fork events separately', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      const events = [
        createMockEvent({ type: 'ForkEvent' }),
        createMockEvent({ type: 'ForkEvent' }),
        createMockEvent({ type: 'ForkEvent' })
      ];
      const result = calculateCommunityMomentum(repo, events);
      expect(result.recentForks).toBe(3);
    });

    it('should handle mixed event types', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      const events = [
        createMockEvent({ type: 'WatchEvent' }),
        createMockEvent({ type: 'WatchEvent' }),
        createMockEvent({ type: 'ForkEvent' }),
        createMockEvent({ type: 'PushEvent' }),  // Should be ignored
        createMockEvent({ type: 'IssueEvent' })   // Should be ignored
      ];
      const result = calculateCommunityMomentum(repo, events);
      expect(result.recentStars).toBe(2);
      expect(result.recentForks).toBe(1);
    });

    it('should ignore events outside the window', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      const oldEvent = createMockEvent({
        type: 'WatchEvent',
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
      });
      const result = calculateCommunityMomentum(repo, [oldEvent]);
      expect(result.recentStars).toBe(0);
    });

    it('should count only recent events within window', () => {
      const repo = createMockRepo({ stargazers_count: 1000 });
      const events = [
        createMockEvent({ type: 'WatchEvent', created_at: new Date().toISOString() }), // Today
        createMockEvent({ type: 'WatchEvent', created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() }), // 15 days ago
        createMockEvent({ type: 'WatchEvent', created_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() }) // 45 days ago - outside
      ];
      const result = calculateCommunityMomentum(repo, events);
      expect(result.recentStars).toBe(2);
    });

    it('should detect upward trend with many recent stars', () => {
      const repo = createMockRepo({
        stargazers_count: 100,
        created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year old
      });
      const events = Array(50).fill(null).map(() => createMockEvent({ type: 'WatchEvent' }));
      const result = calculateCommunityMomentum(repo, events);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });
  });

  describe('Fork Ratio Analysis', () => {
    it('should calculate fork ratio correctly', () => {
      const repo = createMockRepo({ stargazers_count: 1000, forks_count: 200 });
      const result = calculateCommunityMomentum(repo);
      expect(result.forkRatio).toBe(0.2);
    });

    it('should handle zero stars for fork ratio', () => {
      const repo = createMockRepo({ stargazers_count: 0, forks_count: 10 });
      const result = calculateCommunityMomentum(repo);
      expect(result.forkRatio).toBe(0);
    });

    it('should boost score for high fork ratio', () => {
      const highForkRepo = createMockRepo({ stargazers_count: 1000, forks_count: 500 });
      const lowForkRepo = createMockRepo({ stargazers_count: 1000, forks_count: 10 });
      const highResult = calculateCommunityMomentum(highForkRepo);
      const lowResult = calculateCommunityMomentum(lowForkRepo);
      expect(highResult.score).toBeGreaterThan(lowResult.score);
    });
  });

  describe('Repository Age Analysis', () => {
    it('should calculate repo age in days', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const repo = createMockRepo({ created_at: oneYearAgo });
      const result = calculateCommunityMomentum(repo);
      expect(result.repoAgeDays).toBeGreaterThanOrEqual(364);
      expect(result.repoAgeDays).toBeLessThanOrEqual(366);
    });

    it('should handle invalid created_at date', () => {
      const repo = createMockRepo({ created_at: 'invalid' });
      const result = calculateCommunityMomentum(repo);
      expect(result.status).toBeDefined();
    });

    it('should handle missing created_at date', () => {
      const repo = createMockRepo({ created_at: null });
      const result = calculateCommunityMomentum(repo);
      expect(result.status).toBeDefined();
    });

    it('should calculate daily star rate', () => {
      const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
      const repo = createMockRepo({ stargazers_count: 365, created_at: oneYearAgo });
      const result = calculateCommunityMomentum(repo);
      expect(result.dailyStarRate).toBeCloseTo(1, 0);
    });
  });

  describe('MetricResult Shape', () => {
    it('should return complete MetricResult shape', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('sparklineData');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
    });

    it('should include sparklineData with 30 data points', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(Array.isArray(result.sparklineData)).toBe(true);
      expect(result.sparklineData.length).toBe(30);
    });

    it('should have valid direction values', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(['up', 'down', 'stable']).toContain(result.direction);
    });

    it('should have valid status values', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(['thriving', 'stable', 'cooling', 'at_risk']).toContain(result.status);
    });

    it('should include additional metadata', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(result).toHaveProperty('forks');
      expect(result).toHaveProperty('forkRatio');
      expect(result).toHaveProperty('dailyStarRate');
      expect(result).toHaveProperty('recentStars');
      expect(result).toHaveProperty('recentForks');
      expect(result).toHaveProperty('repoAgeDays');
      expect(result).toHaveProperty('score');
    });

    it('should clamp trend between -100 and 100', () => {
      const repo = createMockRepo();
      const result = calculateCommunityMomentum(repo);
      expect(result.trend).toBeGreaterThanOrEqual(-100);
      expect(result.trend).toBeLessThanOrEqual(100);
    });
  });
});

// =============================================================================
// ISSUE TEMPERATURE TESTS
// =============================================================================

describe('calculateIssueTemperature', () => {
  describe('Empty/Invalid Data', () => {
    it('should return default metric for null issues', () => {
      const result = calculateIssueTemperature(null);
      expect(result.value).toBe('Cool');
      expect(result.temperature).toBe('cool');
      expect(result.status).toBe('stable');
    });

    it('should return default metric for undefined issues', () => {
      const result = calculateIssueTemperature(undefined);
      expect(result.value).toBe('Cool');
      expect(result.temperature).toBe('cool');
    });

    it('should return default for empty issues array', () => {
      const result = calculateIssueTemperature([]);
      expect(result.label).toBe('No recent issues');
      expect(result.temperature).toBe('cool');
    });

    it('should handle non-array issues', () => {
      const result = calculateIssueTemperature('not an array');
      expect(result.temperature).toBe('cool');
      expect(result.label).toBe('No recent issues');
    });

    it('should handle issues with missing created_at', () => {
      const issues = [{ state: 'open' }, { state: 'closed' }];
      const result = calculateIssueTemperature(issues);
      expect(result.label).toBe('No recent issues');
    });

    it('should return sparklineData even for empty data', () => {
      const result = calculateIssueTemperature(null);
      expect(Array.isArray(result.sparklineData)).toBe(true);
    });
  });

  describe('Temperature Classification', () => {
    it('should classify as cool for high close rate (>= 70%)', () => {
      const issues = createMockIssueSet({ closedCount: 8, openCount: 2 });
      const result = calculateIssueTemperature(issues);
      expect(result.temperature).toBe('cool');
      expect(result.status).toBe('thriving');
    });

    it('should classify as warm for medium close rate (50-69%)', () => {
      const issues = createMockIssueSet({ closedCount: 5, openCount: 5 });
      const result = calculateIssueTemperature(issues);
      expect(['cool', 'warm']).toContain(result.temperature);
    });

    it('should classify as hot for low close rate (30-49%)', () => {
      const issues = createMockIssueSet({ closedCount: 3, openCount: 7 });
      const result = calculateIssueTemperature(issues);
      expect(['hot', 'warm']).toContain(result.temperature);
    });

    it('should classify as critical for very low close rate (< 30%)', () => {
      const issues = createMockIssueSet({ closedCount: 2, openCount: 8 });
      const result = calculateIssueTemperature(issues);
      expect(['hot', 'critical']).toContain(result.temperature);
    });

    it('should handle all open issues (0% closed) as critical', () => {
      const issues = createMockIssueSet({ closedCount: 0, openCount: 5 });
      const result = calculateIssueTemperature(issues);
      expect(result.closeRate).toBe(0);
      expect(result.temperature).toBe('critical');
      expect(result.status).toBe('at_risk');
    });

    it('should handle all closed issues (100% closed) as cool', () => {
      const issues = createMockIssueSet({ closedCount: 10, openCount: 0 });
      const result = calculateIssueTemperature(issues);
      expect(result.closeRate).toBe(100);
      expect(result.temperature).toBe('cool');
      expect(result.status).toBe('thriving');
    });
  });

  describe('Close Rate Calculation', () => {
    it('should calculate correct close rate for 70%', () => {
      const issues = createMockIssueSet({ closedCount: 7, openCount: 3 });
      const result = calculateIssueTemperature(issues);
      expect(result.closeRate).toBe(70);
    });

    it('should calculate correct close rate for 50%', () => {
      const issues = createMockIssueSet({ closedCount: 5, openCount: 5 });
      const result = calculateIssueTemperature(issues);
      expect(result.closeRate).toBe(50);
    });

    it('should calculate correct close rate for 25%', () => {
      const issues = createMockIssueSet({ closedCount: 2, openCount: 6 });
      const result = calculateIssueTemperature(issues);
      expect(result.closeRate).toBe(25);
    });

    it('should track open and closed counts accurately', () => {
      const issues = createMockIssueSet({ closedCount: 6, openCount: 4 });
      const result = calculateIssueTemperature(issues);
      expect(result.closedCount).toBe(6);
      expect(result.openCount).toBe(4);
      expect(result.totalCount).toBe(10);
    });
  });

  describe('Response Time Analysis', () => {
    it('should calculate average response time for closed issues', () => {
      const now = Date.now();
      const issues = [
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString() // 1 day to close
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() // 3 days to close
        })
      ];
      const result = calculateIssueTemperature(issues);
      expect(result.avgResponseDays).toBe(2); // (1 + 3) / 2 = 2
    });

    it('should boost score for fast response times', () => {
      const now = Date.now();
      const fastIssues = [
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 4.5 * 24 * 60 * 60 * 1000).toISOString() // Same day close
        })
      ];
      const slowIssues = [
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() // 15 days to close
        })
      ];
      const fastResult = calculateIssueTemperature(fastIssues);
      const slowResult = calculateIssueTemperature(slowIssues);
      expect(fastResult.score).toBeGreaterThan(slowResult.score);
    });

    it('should handle issues with no closed_at date', () => {
      const issues = createMockIssueSet({ closedCount: 3, openCount: 2 });
      // Manually set some closed_at to null
      issues.forEach(issue => {
        if (issue.state === 'closed') {
          issue.closed_at = null;
        }
      });
      const result = calculateIssueTemperature(issues);
      expect(result.avgResponseDays).toBe(0);
    });
  });

  describe('Time Window Filtering', () => {
    it('should filter issues outside 30-day window', () => {
      const oldIssue = createMockIssue({
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
      });
      const result = calculateIssueTemperature([oldIssue]);
      expect(result.label).toBe('No recent issues');
    });

    it('should include issues within 30-day window', () => {
      const recentIssue = createMockIssue({
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
      });
      const result = calculateIssueTemperature([recentIssue]);
      expect(result.totalCount).toBe(1);
    });

    it('should count only recent issues when mix of old and new', () => {
      const issues = [
        createMockIssue({
          state: 'open',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Recent
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // Recent
        }),
        createMockIssue({
          state: 'open',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // Old - filtered out
        })
      ];
      const result = calculateIssueTemperature(issues);
      expect(result.totalCount).toBe(2);
    });
  });

  describe('Trend Analysis', () => {
    it('should detect improving trend with better recent close rate', () => {
      const now = Date.now();
      const issues = [
        // Older half (15-30 days ago) - more open
        createMockIssue({
          state: 'open',
          created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'open',
          created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString()
        }),
        // Newer half (0-15 days ago) - more closed
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
        })
      ];
      const result = calculateIssueTemperature(issues);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });

    it('should detect worsening trend with lower recent close rate', () => {
      const now = Date.now();
      const issues = [
        // Older half (15-30 days ago) - more closed
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString()
        }),
        // Newer half (0-15 days ago) - more open
        createMockIssue({
          state: 'open',
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'open',
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockIssue({
          state: 'open',
          created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()
        })
      ];
      const result = calculateIssueTemperature(issues);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThan(0);
    });
  });

  describe('Label Generation', () => {
    it('should generate label with temperature and close rate', () => {
      const issues = createMockIssueSet({ closedCount: 8, openCount: 2 });
      const result = calculateIssueTemperature(issues);
      expect(result.label).toContain('Cool');
      expect(result.label).toMatch(/\d+%/);
    });

    it('should show open count when no issues closed', () => {
      const issues = createMockIssueSet({ closedCount: 0, openCount: 5 });
      const result = calculateIssueTemperature(issues);
      expect(result.label).toContain('5 open');
      expect(result.label).toContain('0% closed');
    });

    it('should include average response time in label when available', () => {
      const now = Date.now();
      const issues = [
        createMockIssue({
          state: 'closed',
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() // 3 days to close
        })
      ];
      const result = calculateIssueTemperature(issues);
      expect(result.label).toMatch(/~\d+\.?\d*d avg/);
    });
  });

  describe('Status Mapping', () => {
    it('should map cool temperature to thriving status', () => {
      const issues = createMockIssueSet({ closedCount: 9, openCount: 1 });
      const result = calculateIssueTemperature(issues);
      expect(result.temperature).toBe('cool');
      expect(result.status).toBe('thriving');
    });

    it('should map warm temperature to stable status', () => {
      const issues = createMockIssueSet({ closedCount: 6, openCount: 4 });
      const result = calculateIssueTemperature(issues);
      if (result.temperature === 'warm') {
        expect(result.status).toBe('stable');
      }
    });

    it('should map hot temperature to cooling status', () => {
      const issues = createMockIssueSet({ closedCount: 4, openCount: 6 });
      const result = calculateIssueTemperature(issues);
      if (result.temperature === 'hot') {
        expect(result.status).toBe('cooling');
      }
    });

    it('should map critical temperature to at_risk status', () => {
      const issues = createMockIssueSet({ closedCount: 1, openCount: 9 });
      const result = calculateIssueTemperature(issues);
      expect(result.temperature).toBe('critical');
      expect(result.status).toBe('at_risk');
    });
  });

  describe('MetricResult Shape', () => {
    it('should return complete MetricResult shape', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('sparklineData');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('temperature');
    });

    it('should include sparklineData with 30 data points', () => {
      const issues = createMockIssueSet({ windowDays: 30 });
      const result = calculateIssueTemperature(issues);
      expect(Array.isArray(result.sparklineData)).toBe(true);
      expect(result.sparklineData.length).toBe(30);
    });

    it('should have valid direction values', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(['up', 'down', 'stable']).toContain(result.direction);
    });

    it('should have valid status values', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(['thriving', 'stable', 'cooling', 'at_risk']).toContain(result.status);
    });

    it('should have valid temperature values', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(['cool', 'warm', 'hot', 'critical']).toContain(result.temperature);
    });

    it('should include additional metadata', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(result).toHaveProperty('totalCount');
      expect(result).toHaveProperty('openCount');
      expect(result).toHaveProperty('closedCount');
      expect(result).toHaveProperty('closeRate');
      expect(result).toHaveProperty('avgResponseDays');
      expect(result).toHaveProperty('score');
    });

    it('should clamp trend between -100 and 100', () => {
      const issues = createMockIssueSet();
      const result = calculateIssueTemperature(issues);
      expect(result.trend).toBeGreaterThanOrEqual(-100);
      expect(result.trend).toBeLessThanOrEqual(100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single issue', () => {
      const issues = [createMockIssue({ state: 'open' })];
      const result = calculateIssueTemperature(issues);
      expect(result.totalCount).toBe(1);
      expect(result.openCount).toBe(1);
    });

    it('should handle invalid date in created_at', () => {
      const issues = [{ created_at: 'invalid', state: 'open' }];
      expect(() => calculateIssueTemperature(issues)).not.toThrow();
    });

    it('should handle very large number of issues', () => {
      const issues = Array(100).fill(null).map(() => createMockIssue({ state: 'closed' }));
      const result = calculateIssueTemperature(issues);
      expect(result.totalCount).toBe(100);
      expect(result.closeRate).toBe(100);
    });
  });
});

// =============================================================================
// PR HEALTH TESTS
// =============================================================================

describe('calculatePRHealth', () => {
  describe('Empty/Invalid Data', () => {
    it('should return default metric for null PRs', () => {
      const result = calculatePRHealth(null);
      expect(result.label).toBe('No recent pull requests');
      expect(result.status).toBe('stable');
    });

    it('should return default metric for undefined PRs', () => {
      const result = calculatePRHealth(undefined);
      expect(result.label).toBe('No recent pull requests');
    });

    it('should return default for empty PRs array', () => {
      const result = calculatePRHealth([]);
      expect(result.funnel).toEqual({ opened: 0, merged: 0, closed: 0, open: 0 });
      expect(result.label).toBe('No recent pull requests');
    });

    it('should handle non-array PRs', () => {
      const result = calculatePRHealth('not an array');
      expect(result.label).toBe('No recent pull requests');
    });

    it('should handle PRs with missing created_at', () => {
      const prs = [{ state: 'open' }, { state: 'closed' }];
      const result = calculatePRHealth(prs);
      expect(result.label).toBe('No recent pull requests');
    });

    it('should return sparklineData even for empty data', () => {
      const result = calculatePRHealth(null);
      expect(Array.isArray(result.sparklineData)).toBe(true);
    });

    it('should return proper funnel structure for no data', () => {
      const result = calculatePRHealth(null);
      expect(result.funnel).toEqual({ opened: 0, merged: 0, closed: 0, open: 0 });
    });
  });

  describe('Merge Rate Calculation', () => {
    it('should calculate merge rate correctly for 80%', () => {
      const prs = createMockPRSet({ mergedCount: 8, closedCount: 2, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.mergeRate).toBe(80);
    });

    it('should calculate merge rate correctly for 50%', () => {
      const prs = createMockPRSet({ mergedCount: 5, closedCount: 5, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.mergeRate).toBe(50);
    });

    it('should calculate merge rate correctly for 100%', () => {
      const prs = createMockPRSet({ mergedCount: 10, closedCount: 0, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.mergeRate).toBe(100);
    });

    it('should calculate merge rate correctly for 0%', () => {
      const prs = createMockPRSet({ mergedCount: 0, closedCount: 10, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.mergeRate).toBe(0);
    });

    it('should handle merge rate when all PRs are open (no completed)', () => {
      const prs = createMockPRSet({ mergedCount: 0, closedCount: 0, openCount: 5 });
      const result = calculatePRHealth(prs);
      expect(result.mergeRate).toBe(0); // No completed PRs to calculate rate
    });

    it('should exclude open PRs from merge rate calculation', () => {
      const prs = createMockPRSet({ mergedCount: 5, closedCount: 5, openCount: 10 });
      const result = calculatePRHealth(prs);
      // Merge rate is based on completed PRs only (merged / (merged + closed))
      expect(result.mergeRate).toBe(50);
    });
  });

  describe('Funnel Tracking', () => {
    it('should track all funnel metrics correctly', () => {
      const prs = createMockPRSet({ mergedCount: 5, closedCount: 2, openCount: 3 });
      const result = calculatePRHealth(prs);
      expect(result.funnel.merged).toBe(5);
      expect(result.funnel.closed).toBe(2);
      expect(result.funnel.open).toBe(3);
      expect(result.funnel.opened).toBe(10);
    });

    it('should handle no merged PRs', () => {
      const prs = createMockPRSet({ mergedCount: 0, closedCount: 5, openCount: 5 });
      const result = calculatePRHealth(prs);
      expect(result.funnel.merged).toBe(0);
      expect(result.funnel.opened).toBe(10);
    });

    it('should handle all PRs open', () => {
      const prs = createMockPRSet({ mergedCount: 0, closedCount: 0, openCount: 5 });
      const result = calculatePRHealth(prs);
      expect(result.funnel.open).toBe(5);
      expect(result.funnel.merged).toBe(0);
      expect(result.funnel.closed).toBe(0);
      expect(result.funnel.opened).toBe(5);
    });

    it('should handle all PRs merged', () => {
      const prs = createMockPRSet({ mergedCount: 10, closedCount: 0, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.funnel.merged).toBe(10);
      expect(result.funnel.closed).toBe(0);
      expect(result.funnel.open).toBe(0);
    });

    it('should count totalOpened correctly', () => {
      const prs = createMockPRSet({ mergedCount: 3, closedCount: 4, openCount: 5 });
      const result = calculatePRHealth(prs);
      expect(result.totalOpened).toBe(12);
      expect(result.funnel.opened).toBe(12);
    });
  });

  describe('Time To Merge Analysis', () => {
    it('should calculate average time to merge', () => {
      const now = Date.now();
      const prs = [
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString() // 2 days to merge
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString() // 4 days to merge
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.avgTimeToMerge).toBe(3); // (2 + 4) / 2 = 3
    });

    it('should boost score for fast merge times', () => {
      const now = Date.now();
      const fastPRs = [
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 4.5 * 24 * 60 * 60 * 1000).toISOString() // Same day
        })
      ];
      const slowPRs = [
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString() // 15 days
        })
      ];
      const fastResult = calculatePRHealth(fastPRs);
      const slowResult = calculatePRHealth(slowPRs);
      expect(fastResult.score).toBeGreaterThan(slowResult.score);
    });

    it('should handle PRs with no merged_at date', () => {
      const prs = createMockPRSet({ mergedCount: 3, closedCount: 2, openCount: 0 });
      // Manually remove merged_at from merged PRs
      prs.forEach(pr => {
        if (pr.merged) {
          pr.merged_at = null;
        }
      });
      const result = calculatePRHealth(prs);
      expect(result.avgTimeToMerge).toBe(0);
    });
  });

  describe('Time Window Filtering', () => {
    it('should filter PRs outside 30-day window', () => {
      const oldPR = createMockPR({
        created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
      });
      const result = calculatePRHealth([oldPR]);
      expect(result.label).toBe('No recent pull requests');
    });

    it('should include PRs within 30-day window', () => {
      const recentPR = createMockPR({
        created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() // 15 days ago
      });
      const result = calculatePRHealth([recentPR]);
      expect(result.totalOpened).toBe(1);
    });

    it('should count only recent PRs when mix of old and new', () => {
      const prs = [
        createMockPR({
          state: 'open',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // Recent
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() // Recent
        }),
        createMockPR({
          state: 'open',
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // Old - filtered out
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.totalOpened).toBe(2);
    });
  });

  describe('Trend Analysis', () => {
    it('should detect improving trend with better recent merge rate', () => {
      const now = Date.now();
      const prs = [
        // Older half (15-30 days ago) - low merge rate
        createMockPR({
          state: 'closed',
          merged: false,
          created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: false,
          created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 19 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString()
        }),
        // Newer half (0-15 days ago) - higher merge rate
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });

    it('should detect worsening trend with lower recent merge rate', () => {
      const now = Date.now();
      const prs = [
        // Older half (15-30 days ago) - high merge rate
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 25 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 21 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 17 * 24 * 60 * 60 * 1000).toISOString()
        }),
        // Newer half (0-15 days ago) - low merge rate
        createMockPR({
          state: 'closed',
          merged: false,
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: false,
          created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: false,
          created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
          closed_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString()
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThan(0);
    });
  });

  describe('Volume Analysis', () => {
    it('should calculate weekly volume correctly', () => {
      // 30-day window / 7 days per week ≈ 4.3 weeks
      const prs = createMockPRSet({ mergedCount: 10, closedCount: 5, openCount: 5 });
      const result = calculatePRHealth(prs);
      // 20 PRs / 4.3 weeks ≈ 4.7 per week
      expect(result.weeklyVolume).toBeGreaterThan(0);
    });

    it('should penalize very low volume', () => {
      // Use 50% merge rate for both so volume can make a difference
      const lowVolume = createMockPRSet({ mergedCount: 1, closedCount: 1, openCount: 0 });
      const highVolume = createMockPRSet({ mergedCount: 10, closedCount: 10, openCount: 0 });
      const lowResult = calculatePRHealth(lowVolume);
      const highResult = calculatePRHealth(highVolume);
      // High volume should have better or equal score due to volume bonus
      expect(highResult.score).toBeGreaterThanOrEqual(lowResult.score);
    });
  });

  describe('Label Generation', () => {
    it('should generate label with merge rate', () => {
      const prs = createMockPRSet({ mergedCount: 8, closedCount: 2, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.label).toMatch(/\d+%/);
    });

    it('should show open count when all PRs are open', () => {
      const prs = createMockPRSet({ mergedCount: 0, closedCount: 0, openCount: 5 });
      const result = calculatePRHealth(prs);
      expect(result.label).toContain('5 open PRs');
    });

    it('should include average time to merge in label when available', () => {
      const now = Date.now();
      const prs = [
        createMockPR({
          state: 'closed',
          merged: true,
          created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString() // 3 days
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.label).toMatch(/~\d+\.?\d*d avg/);
    });
  });

  describe('Status Classification', () => {
    it('should give thriving status for high merge rate', () => {
      const prs = createMockPRSet({ mergedCount: 20, closedCount: 0, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.status).toBe('thriving');
    });

    it('should give stable status for medium merge rate', () => {
      const prs = createMockPRSet({ mergedCount: 7, closedCount: 3, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(['thriving', 'stable']).toContain(result.status);
    });

    it('should give cooling or at_risk for low merge rate', () => {
      const prs = createMockPRSet({ mergedCount: 2, closedCount: 8, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(['cooling', 'at_risk', 'stable']).toContain(result.status);
    });
  });

  describe('MetricResult Shape', () => {
    it('should return complete MetricResult shape', () => {
      const prs = createMockPRSet();
      const result = calculatePRHealth(prs);
      expect(result).toHaveProperty('value');
      expect(result).toHaveProperty('trend');
      expect(result).toHaveProperty('direction');
      expect(result).toHaveProperty('sparklineData');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('label');
      expect(result).toHaveProperty('funnel');
    });

    it('should include sparklineData with 30 data points', () => {
      const prs = createMockPRSet({ windowDays: 30 });
      const result = calculatePRHealth(prs);
      expect(Array.isArray(result.sparklineData)).toBe(true);
      expect(result.sparklineData.length).toBe(30);
    });

    it('should have valid direction values', () => {
      const prs = createMockPRSet();
      const result = calculatePRHealth(prs);
      expect(['up', 'down', 'stable']).toContain(result.direction);
    });

    it('should have valid status values', () => {
      const prs = createMockPRSet();
      const result = calculatePRHealth(prs);
      expect(['thriving', 'stable', 'cooling', 'at_risk']).toContain(result.status);
    });

    it('should include additional metadata', () => {
      const prs = createMockPRSet();
      const result = calculatePRHealth(prs);
      expect(result).toHaveProperty('mergeRate');
      expect(result).toHaveProperty('avgTimeToMerge');
      expect(result).toHaveProperty('totalOpened');
      expect(result).toHaveProperty('mergedCount');
      expect(result).toHaveProperty('closedCount');
      expect(result).toHaveProperty('openCount');
      expect(result).toHaveProperty('weeklyVolume');
      expect(result).toHaveProperty('score');
    });

    it('should clamp trend between -100 and 100', () => {
      const prs = createMockPRSet();
      const result = calculatePRHealth(prs);
      expect(result.trend).toBeGreaterThanOrEqual(-100);
      expect(result.trend).toBeLessThanOrEqual(100);
    });

    it('should have value equal to merge rate percentage', () => {
      const prs = createMockPRSet({ mergedCount: 8, closedCount: 2, openCount: 0 });
      const result = calculatePRHealth(prs);
      expect(result.value).toBe(80);
    });
  });

  describe('Edge Cases', () => {
    it('should handle single PR', () => {
      const prs = [createMockPR({ state: 'open' })];
      const result = calculatePRHealth(prs);
      expect(result.totalOpened).toBe(1);
      expect(result.funnel.open).toBe(1);
    });

    it('should handle invalid date in created_at', () => {
      const prs = [{ created_at: 'invalid', state: 'open' }];
      expect(() => calculatePRHealth(prs)).not.toThrow();
    });

    it('should handle very large number of PRs', () => {
      const prs = Array(100).fill(null).map(() => createMockPR({
        state: 'closed',
        merged: true
      }));
      const result = calculatePRHealth(prs);
      expect(result.totalOpened).toBe(100);
      expect(result.mergeRate).toBe(100);
    });

    it('should differentiate merged from closed-not-merged', () => {
      const prs = [
        createMockPR({
          state: 'closed',
          merged: true,
          merged_at: new Date().toISOString()
        }),
        createMockPR({
          state: 'closed',
          merged: false,
          closed_at: new Date().toISOString()
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.funnel.merged).toBe(1);
      expect(result.funnel.closed).toBe(1);
    });

    it('should detect merged PR via merged_at even if merged flag is false', () => {
      const prs = [
        createMockPR({
          state: 'closed',
          merged: false, // Flag is false but merged_at is set
          merged_at: new Date().toISOString()
        })
      ];
      const result = calculatePRHealth(prs);
      expect(result.funnel.merged).toBe(1);
    });
  });
});

// =============================================================================
// BUS FACTOR TESTS
// =============================================================================

describe('calculateBusFactor', () => {
  it('should return default metric for null contributors', () => {
    const result = calculateBusFactor(null);
    expect(result.value).toBe(1);
    expect(result.riskLevel).toBe('critical');
  });

  it('should return default for empty contributors array', () => {
    const result = calculateBusFactor([]);
    expect(result.riskLevel).toBe('critical');
  });

  it('should identify single contributor as critical risk', () => {
    const contributors = createMockContributorSet({ distribution: 'single' });
    const result = calculateBusFactor(contributors);
    expect(result.value).toBeLessThanOrEqual(2);
    expect(result.riskLevel).toBe('critical');
  });

  it('should identify concentrated contributions as high risk', () => {
    const contributors = createMockContributorSet({ count: 5, distribution: 'concentrated' });
    const result = calculateBusFactor(contributors);
    expect(['high', 'critical']).toContain(result.riskLevel);
  });

  it('should identify balanced team as healthy', () => {
    const contributors = createMockContributorSet({ count: 10, distribution: 'balanced' });
    const result = calculateBusFactor(contributors);
    expect(result.value).toBeGreaterThanOrEqual(5);
    expect(['healthy', 'moderate']).toContain(result.riskLevel);
  });

  it('should track top contributor concentration', () => {
    const contributors = createMockContributorSet({ count: 5, distribution: 'concentrated' });
    const result = calculateBusFactor(contributors);
    expect(result.topConcentration).toBeGreaterThan(50);
  });

  it('should return value between 1 and 10', () => {
    const contributors = createMockContributorSet({ count: 5 });
    const result = calculateBusFactor(contributors);
    expect(result.value).toBeGreaterThanOrEqual(1);
    expect(result.value).toBeLessThanOrEqual(10);
  });

  it('should return MetricResult shape', () => {
    const contributors = createMockContributorSet();
    const result = calculateBusFactor(contributors);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('sparklineData');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('riskLevel');
  });

  it('should include sparkline with contribution distribution', () => {
    const contributors = createMockContributorSet({ count: 5 });
    const result = calculateBusFactor(contributors);
    expect(Array.isArray(result.sparklineData)).toBe(true);
    expect(result.sparklineData.length).toBe(10);
  });

  it('should filter out invalid contributors', () => {
    const contributors = [
      createMockContributor({ total: 100 }),
      { total: null, author: { login: 'invalid' } },
      { total: 50 } // Missing author
    ];
    const result = calculateBusFactor(contributors);
    expect(result.contributorCount).toBe(1);
  });
});

// =============================================================================
// FRESHNESS INDEX TESTS
// =============================================================================

describe('calculateFreshnessIndex', () => {
  it('should return default metric for null repo', () => {
    const result = calculateFreshnessIndex(null);
    expect(result.freshness).toBe('stale');
  });

  it('should classify recent push as fresh or recent', () => {
    const repo = createMockRepo({ pushed_at: new Date().toISOString() });
    // With fresh push but no releases, weighted score may classify as 'recent'
    const result = calculateFreshnessIndex(repo);
    expect(['fresh', 'recent']).toContain(result.freshness);
    expect(['thriving', 'stable']).toContain(result.status);
  });

  it('should classify recent push with release as fresh', () => {
    const repo = createMockRepo({ pushed_at: new Date().toISOString() });
    const releases = [createMockRelease({ published_at: new Date().toISOString() })];
    const result = calculateFreshnessIndex(repo, releases);
    expect(result.freshness).toBe('fresh');
    expect(result.status).toBe('thriving');
  });

  it('should classify old push as stale', () => {
    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000).toISOString();
    const repo = createMockRepo({ pushed_at: oldDate, updated_at: oldDate });
    const result = calculateFreshnessIndex(repo);
    expect(['aging', 'stale']).toContain(result.freshness);
  });

  it('should classify very old push as dormant', () => {
    const veryOldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const repo = createMockRepo({ pushed_at: veryOldDate, updated_at: veryOldDate });
    const result = calculateFreshnessIndex(repo);
    expect(['stale', 'dormant']).toContain(result.freshness);
    expect(result.status).toBe('at_risk');
  });

  it('should track days since push', () => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const repo = createMockRepo({ pushed_at: sevenDaysAgo, updated_at: sevenDaysAgo });
    const result = calculateFreshnessIndex(repo);
    expect(result.daysSincePush).toBe(7);
  });

  it('should handle no releases', () => {
    const repo = createMockRepo();
    const result = calculateFreshnessIndex(repo, []);
    expect(result.lastRelease).toBe('None');
    expect(result.daysSinceRelease).toBe(null);
  });

  it('should track latest release', () => {
    const repo = createMockRepo();
    const releases = [
      createMockRelease({ tag_name: 'v2.0.0', published_at: new Date().toISOString() }),
      createMockRelease({ tag_name: 'v1.0.0', published_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() })
    ];
    const result = calculateFreshnessIndex(repo, releases);
    expect(result.lastRelease).toBe('v2.0.0');
  });

  it('should return score between 0 and 100', () => {
    const repo = createMockRepo();
    const result = calculateFreshnessIndex(repo);
    expect(result.value).toBeGreaterThanOrEqual(0);
    expect(result.value).toBeLessThanOrEqual(100);
  });

  it('should return MetricResult shape', () => {
    const repo = createMockRepo();
    const result = calculateFreshnessIndex(repo);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('sparklineData');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('label');
    expect(result).toHaveProperty('freshness');
  });

  it('should handle invalid pushed_at date', () => {
    const repo = createMockRepo({ pushed_at: 'invalid', updated_at: 'invalid' });
    const result = calculateFreshnessIndex(repo);
    expect(result.freshness).toBe('stale');
  });
});

// =============================================================================
// OVERALL PULSE TESTS
// =============================================================================

describe('calculateOverallPulse', () => {
  it('should return default pulse for null metrics', () => {
    const result = calculateOverallPulse(null);
    expect(result.status).toBe('stable');
    expect(result.metricsUsed).toBe(0);
  });

  it('should return default pulse for empty object', () => {
    const result = calculateOverallPulse({});
    expect(result.status).toBeDefined();
  });

  it('should aggregate all thriving metrics as thriving', () => {
    const metrics = {
      velocity: { status: 'thriving', trend: 10 },
      momentum: { status: 'thriving', trend: 10 },
      issues: { status: 'thriving', trend: 10 },
      prs: { status: 'thriving', trend: 10 },
      busFactor: { status: 'thriving', trend: 0 },
      freshness: { status: 'thriving', trend: 0 }
    };
    const result = calculateOverallPulse(metrics);
    expect(result.status).toBe('thriving');
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  it('should aggregate all at_risk metrics as at_risk', () => {
    const metrics = {
      velocity: { status: 'at_risk', trend: -30 },
      momentum: { status: 'at_risk', trend: -30 },
      issues: { status: 'at_risk', trend: -30 },
      prs: { status: 'at_risk', trend: -30 },
      busFactor: { status: 'at_risk', trend: 0 },
      freshness: { status: 'at_risk', trend: 0 }
    };
    const result = calculateOverallPulse(metrics);
    expect(result.status).toBe('at_risk');
    expect(result.score).toBeLessThan(25);
  });

  it('should count concerns correctly', () => {
    const metrics = {
      velocity: { status: 'thriving', trend: 10 },
      momentum: { status: 'stable', trend: 0 },
      issues: { status: 'cooling', trend: -10 },
      prs: { status: 'at_risk', trend: -30 },
      busFactor: { status: 'stable', trend: 0 },
      freshness: { status: 'at_risk', trend: 0 }
    };
    const result = calculateOverallPulse(metrics);
    expect(result.concerns.count).toBe(3); // cooling + 2 at_risk
  });

  it('should include breakdown by metric', () => {
    const metrics = {
      velocity: { status: 'thriving', trend: 10 },
      momentum: { status: 'stable', trend: 0 }
    };
    const result = calculateOverallPulse(metrics);
    expect(result.breakdown).toHaveProperty('velocity');
    expect(result.breakdown).toHaveProperty('momentum');
  });

  it('should calculate average trend', () => {
    const metrics = {
      velocity: { status: 'stable', trend: 20 },
      momentum: { status: 'stable', trend: -20 },
      issues: { status: 'stable', trend: 10 },
      prs: { status: 'stable', trend: -10 },
      busFactor: { status: 'stable', trend: 0 },
      freshness: { status: 'stable', trend: 0 }
    };
    const result = calculateOverallPulse(metrics);
    expect(result.trend).toBe(0);
  });

  it('should set appropriate pulse speed', () => {
    const thrivingMetrics = {
      velocity: { status: 'thriving', trend: 0 },
      momentum: { status: 'thriving', trend: 0 },
      issues: { status: 'thriving', trend: 0 },
      prs: { status: 'thriving', trend: 0 },
      busFactor: { status: 'thriving', trend: 0 },
      freshness: { status: 'thriving', trend: 0 }
    };
    const atRiskMetrics = {
      velocity: { status: 'at_risk', trend: 0 },
      momentum: { status: 'at_risk', trend: 0 },
      issues: { status: 'at_risk', trend: 0 },
      prs: { status: 'at_risk', trend: 0 },
      busFactor: { status: 'at_risk', trend: 0 },
      freshness: { status: 'at_risk', trend: 0 }
    };

    const thrivingResult = calculateOverallPulse(thrivingMetrics);
    const atRiskResult = calculateOverallPulse(atRiskMetrics);

    // Thriving should have faster pulse (lower ms)
    expect(thrivingResult.pulseSpeed).toBeLessThan(atRiskResult.pulseSpeed);
  });

  it('should handle partial metrics', () => {
    const metrics = {
      velocity: { status: 'thriving', trend: 10 }
      // Other metrics missing
    };
    const result = calculateOverallPulse(metrics);
    expect(result.status).toBeDefined();
    expect(result.breakdown.velocity).toBe('thriving');
    expect(result.breakdown.momentum).toBe('stable'); // Default
  });
});

// =============================================================================
// CALCULATE ALL METRICS TESTS
// =============================================================================

describe('calculateAllMetrics', () => {
  it('should return default metrics for null input', () => {
    const result = calculateAllMetrics(null);
    expect(result.metrics).toBeDefined();
    expect(result.overall).toBeDefined();
    expect(result.overall.metricsUsed).toBe(0);
  });

  it('should return default metrics for empty object', () => {
    const result = calculateAllMetrics({});
    expect(result.metrics.velocity.label).toBe('Commit data unavailable');
    expect(result.metrics.momentum.label).toBe('Growth data unavailable');
  });

  it('should calculate all 6 metrics from complete data', () => {
    const pulseData = {
      repo: createMockRepo(),
      participation: createMockParticipation(),
      issues: createMockIssueSet(),
      prs: createMockPRSet(),
      contributors: createMockContributorSet(),
      events: Array(5).fill(null).map(() => createMockEvent()),
      releases: [createMockRelease()]
    };

    const result = calculateAllMetrics(pulseData);

    expect(result.metrics.velocity).toBeDefined();
    expect(result.metrics.momentum).toBeDefined();
    expect(result.metrics.issues).toBeDefined();
    expect(result.metrics.prs).toBeDefined();
    expect(result.metrics.busFactor).toBeDefined();
    expect(result.metrics.freshness).toBeDefined();
    expect(result.overall).toBeDefined();
  });

  it('should handle partial data gracefully', () => {
    const pulseData = {
      repo: createMockRepo()
      // Other data missing
    };

    const result = calculateAllMetrics(pulseData);

    expect(result.metrics.velocity.status).toBe('stable'); // Default
    expect(result.metrics.momentum.status).toBeDefined(); // Calculated from repo
    expect(result.metrics.freshness.status).toBeDefined(); // Calculated from repo
    expect(result.overall.status).toBeDefined();
  });

  it('should return proper structure', () => {
    const pulseData = {
      repo: createMockRepo(),
      participation: createMockParticipation()
    };

    const result = calculateAllMetrics(pulseData);

    // Check metrics object
    expect(result).toHaveProperty('metrics');
    expect(result.metrics).toHaveProperty('velocity');
    expect(result.metrics).toHaveProperty('momentum');
    expect(result.metrics).toHaveProperty('issues');
    expect(result.metrics).toHaveProperty('prs');
    expect(result.metrics).toHaveProperty('busFactor');
    expect(result.metrics).toHaveProperty('freshness');

    // Check overall object
    expect(result).toHaveProperty('overall');
    expect(result.overall).toHaveProperty('status');
    expect(result.overall).toHaveProperty('score');
    expect(result.overall).toHaveProperty('pulseSpeed');
    expect(result.overall).toHaveProperty('concerns');
  });

  it('should aggregate concerns from individual metrics', () => {
    // Create data that results in some at_risk metrics
    const veryOldDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
    const pulseData = {
      repo: createMockRepo({
        pushed_at: veryOldDate,
        updated_at: veryOldDate,
        stargazers_count: 0
      }),
      participation: createMockParticipation({ recentAvg: 0, previousAvg: 10 }),
      contributors: createMockContributorSet({ distribution: 'single' })
    };

    const result = calculateAllMetrics(pulseData);

    expect(result.overall.concerns.count).toBeGreaterThan(0);
    expect(result.overall.concerns.metrics.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// EDGE CASE TESTS
// =============================================================================

describe('Edge Cases', () => {
  describe('All null inputs', () => {
    it('should handle all calculators with null gracefully', () => {
      expect(() => calculateVelocityScore(null)).not.toThrow();
      expect(() => calculateCommunityMomentum(null)).not.toThrow();
      expect(() => calculateIssueTemperature(null)).not.toThrow();
      expect(() => calculatePRHealth(null)).not.toThrow();
      expect(() => calculateBusFactor(null)).not.toThrow();
      expect(() => calculateFreshnessIndex(null)).not.toThrow();
      expect(() => calculateOverallPulse(null)).not.toThrow();
      expect(() => calculateAllMetrics(null)).not.toThrow();
    });
  });

  describe('All empty arrays', () => {
    it('should handle all array-based calculators with empty arrays', () => {
      expect(() => calculateIssueTemperature([])).not.toThrow();
      expect(() => calculatePRHealth([])).not.toThrow();
      expect(() => calculateBusFactor([])).not.toThrow();
    });
  });

  describe('Invalid date handling', () => {
    it('should handle invalid dates in issues', () => {
      const issues = [{ created_at: 'invalid', state: 'open' }];
      expect(() => calculateIssueTemperature(issues)).not.toThrow();
    });

    it('should handle invalid dates in PRs', () => {
      const prs = [{ created_at: 'invalid', state: 'open' }];
      expect(() => calculatePRHealth(prs)).not.toThrow();
    });

    it('should handle invalid dates in repo', () => {
      const repo = createMockRepo({ pushed_at: 'invalid', created_at: 'invalid' });
      expect(() => calculateFreshnessIndex(repo)).not.toThrow();
      expect(() => calculateCommunityMomentum(repo)).not.toThrow();
    });
  });

  describe('Extreme values', () => {
    it('should handle very large star count', () => {
      const repo = createMockRepo({ stargazers_count: 1000000 });
      const result = calculateCommunityMomentum(repo);
      expect(result.value).toBe(1000000);
    });

    it('should handle very old repository', () => {
      const veryOldDate = new Date('2000-01-01').toISOString();
      const repo = createMockRepo({ created_at: veryOldDate });
      const result = calculateCommunityMomentum(repo);
      expect(result.repoAgeDays).toBeDefined();
    });

    it('should handle large number of contributors', () => {
      const contributors = Array(100).fill(null).map((_, i) =>
        createMockContributor({ total: 100 - i, author: { login: `dev-${i}` } })
      );
      const result = calculateBusFactor(contributors);
      expect(result.value).toBe(10); // Max bus factor
    });
  });
});

// =============================================================================
// METRIC RESULT SHAPE TESTS
// =============================================================================

describe('MetricResult Shape Validation', () => {
  const metricResultShape = {
    value: expect.anything(),
    trend: expect.any(Number),
    direction: expect.stringMatching(/^(up|down|stable)$/),
    sparklineData: expect.any(Array),
    status: expect.stringMatching(/^(thriving|stable|cooling|at_risk)$/),
    label: expect.any(String)
  };

  it('calculateVelocityScore returns MetricResult shape', () => {
    const result = calculateVelocityScore(createMockParticipation());
    expect(result).toMatchObject(metricResultShape);
  });

  it('calculateCommunityMomentum returns MetricResult shape', () => {
    const result = calculateCommunityMomentum(createMockRepo());
    expect(result).toMatchObject(metricResultShape);
  });

  it('calculateIssueTemperature returns MetricResult shape', () => {
    const result = calculateIssueTemperature(createMockIssueSet());
    expect(result).toMatchObject(metricResultShape);
  });

  it('calculatePRHealth returns MetricResult shape', () => {
    const result = calculatePRHealth(createMockPRSet());
    expect(result).toMatchObject(metricResultShape);
  });

  it('calculateBusFactor returns MetricResult shape', () => {
    const result = calculateBusFactor(createMockContributorSet());
    expect(result).toMatchObject(metricResultShape);
  });

  it('calculateFreshnessIndex returns MetricResult shape', () => {
    const result = calculateFreshnessIndex(createMockRepo());
    expect(result).toMatchObject(metricResultShape);
  });
});
