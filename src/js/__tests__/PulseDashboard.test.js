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
  it('should return default metric for null participation', () => {
    const result = calculateVelocityScore(null);
    expect(result.status).toBe('stable');
    expect(result.label).toBe('Commit data unavailable');
  });

  it('should return default metric for undefined participation', () => {
    const result = calculateVelocityScore(undefined);
    expect(result.status).toBe('stable');
  });

  it('should return default metric for missing all array', () => {
    const result = calculateVelocityScore({});
    expect(result.status).toBe('stable');
  });

  it('should return default metric for non-array all', () => {
    const result = calculateVelocityScore({ all: 'not an array' });
    expect(result.status).toBe('stable');
  });

  it('should handle insufficient commit history', () => {
    const result = calculateVelocityScore({ all: [1, 2] });
    expect(result.label).toBe('Insufficient commit history');
  });

  it('should detect increasing activity (direction up)', () => {
    const participation = createMockParticipation({ recentAvg: 20, previousAvg: 10 });
    const result = calculateVelocityScore(participation);
    expect(result.direction).toBe('up');
    expect(result.trend).toBeGreaterThan(0);
  });

  it('should detect declining activity (direction down)', () => {
    const participation = createMockParticipation({ recentAvg: 5, previousAvg: 15 });
    const result = calculateVelocityScore(participation);
    expect(result.direction).toBe('down');
    expect(result.trend).toBeLessThan(0);
  });

  it('should detect stable activity', () => {
    const participation = createMockParticipation({ recentAvg: 10, previousAvg: 10 });
    const result = calculateVelocityScore(participation);
    expect(result.direction).toBe('stable');
  });

  it('should return thriving status for high growth', () => {
    const participation = createMockParticipation({ recentAvg: 20, previousAvg: 10 });
    const result = calculateVelocityScore(participation);
    expect(result.status).toBe('thriving');
  });

  it('should return at_risk status for severe decline', () => {
    const participation = createMockParticipation({ recentAvg: 2, previousAvg: 15 });
    const result = calculateVelocityScore(participation);
    expect(result.status).toBe('at_risk');
  });

  it('should include sparklineData with 13 weeks', () => {
    const participation = createMockParticipation();
    const result = calculateVelocityScore(participation);
    expect(result.sparklineData).toHaveLength(13);
  });

  it('should return MetricResult shape', () => {
    const participation = createMockParticipation();
    const result = calculateVelocityScore(participation);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('sparklineData');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('label');
  });

  it('should handle all zero commits', () => {
    const participation = { all: Array(52).fill(0) };
    const result = calculateVelocityScore(participation);
    expect(result.value).toBe(0);
    expect(result.direction).toBe('stable');
  });
});

// =============================================================================
// COMMUNITY MOMENTUM TESTS
// =============================================================================

describe('calculateCommunityMomentum', () => {
  it('should return default metric for null repo', () => {
    const result = calculateCommunityMomentum(null);
    expect(result.label).toBe('Growth data unavailable');
  });

  it('should handle repo with low stars', () => {
    const repo = createMockRepo({ stargazers_count: 5 });
    const result = calculateCommunityMomentum(repo);
    expect(result.value).toBe(5);
    expect(result.status).toBeDefined();
  });

  it('should handle repo with zero stars', () => {
    const repo = createMockRepo({ stargazers_count: 0, forks_count: 0 });
    const result = calculateCommunityMomentum(repo);
    expect(result.value).toBe(0);
  });

  it('should calculate star count correctly', () => {
    const repo = createMockRepo({ stargazers_count: 5000 });
    const result = calculateCommunityMomentum(repo);
    expect(result.value).toBe(5000);
  });

  it('should format large star counts with K suffix in label', () => {
    const repo = createMockRepo({ stargazers_count: 10000 });
    const result = calculateCommunityMomentum(repo);
    expect(result.label).toContain('10K');
  });

  it('should detect growth from events', () => {
    const repo = createMockRepo({ stargazers_count: 1000 });
    const events = Array(10).fill(null).map(() => createMockEvent({ type: 'WatchEvent' }));
    const result = calculateCommunityMomentum(repo, events);
    expect(result.recentStars).toBe(10);
  });

  it('should count fork events', () => {
    const repo = createMockRepo({ stargazers_count: 1000 });
    const events = [
      createMockEvent({ type: 'ForkEvent' }),
      createMockEvent({ type: 'ForkEvent' })
    ];
    const result = calculateCommunityMomentum(repo, events);
    expect(result.recentForks).toBe(2);
  });

  it('should return MetricResult shape', () => {
    const repo = createMockRepo();
    const result = calculateCommunityMomentum(repo);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('sparklineData');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('label');
  });

  it('should include sparklineData', () => {
    const repo = createMockRepo();
    const result = calculateCommunityMomentum(repo);
    expect(Array.isArray(result.sparklineData)).toBe(true);
    expect(result.sparklineData.length).toBe(30);
  });
});

// =============================================================================
// ISSUE TEMPERATURE TESTS
// =============================================================================

describe('calculateIssueTemperature', () => {
  it('should return default metric for null issues', () => {
    const result = calculateIssueTemperature(null);
    expect(result.value).toBe('Cool');
    expect(result.temperature).toBe('cool');
  });

  it('should return default for empty issues array', () => {
    const result = calculateIssueTemperature([]);
    expect(result.label).toBe('No recent issues');
  });

  it('should classify as cool for high close rate', () => {
    const issues = createMockIssueSet({ closedCount: 8, openCount: 2 });
    const result = calculateIssueTemperature(issues);
    expect(result.temperature).toBe('cool');
    expect(result.status).toBe('thriving');
  });

  it('should classify as warm for medium close rate', () => {
    const issues = createMockIssueSet({ closedCount: 5, openCount: 5 });
    const result = calculateIssueTemperature(issues);
    expect(['cool', 'warm']).toContain(result.temperature);
  });

  it('should classify as hot for low close rate', () => {
    const issues = createMockIssueSet({ closedCount: 2, openCount: 8 });
    const result = calculateIssueTemperature(issues);
    expect(['hot', 'critical']).toContain(result.temperature);
  });

  it('should calculate correct close rate', () => {
    const issues = createMockIssueSet({ closedCount: 7, openCount: 3 });
    const result = calculateIssueTemperature(issues);
    expect(result.closeRate).toBe(70);
  });

  it('should track open and closed counts', () => {
    const issues = createMockIssueSet({ closedCount: 6, openCount: 4 });
    const result = calculateIssueTemperature(issues);
    expect(result.closedCount).toBe(6);
    expect(result.openCount).toBe(4);
    expect(result.totalCount).toBe(10);
  });

  it('should handle all open issues (0% closed)', () => {
    const issues = createMockIssueSet({ closedCount: 0, openCount: 5 });
    const result = calculateIssueTemperature(issues);
    expect(result.closeRate).toBe(0);
    expect(result.temperature).toBe('critical');
  });

  it('should return MetricResult shape', () => {
    const issues = createMockIssueSet();
    const result = calculateIssueTemperature(issues);
    expect(result).toHaveProperty('value');
    expect(result).toHaveProperty('trend');
    expect(result).toHaveProperty('direction');
    expect(result).toHaveProperty('sparklineData');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('label');
  });

  it('should filter issues outside window', () => {
    const oldIssue = createMockIssue({
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    });
    const result = calculateIssueTemperature([oldIssue]);
    expect(result.label).toBe('No recent issues');
  });
});

// =============================================================================
// PR HEALTH TESTS
// =============================================================================

describe('calculatePRHealth', () => {
  it('should return default metric for null PRs', () => {
    const result = calculatePRHealth(null);
    expect(result.label).toBe('No recent pull requests');
  });

  it('should return default for empty PRs array', () => {
    const result = calculatePRHealth([]);
    expect(result.funnel).toEqual({ opened: 0, merged: 0, closed: 0, open: 0 });
  });

  it('should calculate merge rate correctly', () => {
    const prs = createMockPRSet({ mergedCount: 8, closedCount: 2, openCount: 0 });
    const result = calculatePRHealth(prs);
    expect(result.mergeRate).toBe(80);
  });

  it('should track funnel metrics', () => {
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
  });

  it('should handle all PRs open', () => {
    const prs = createMockPRSet({ mergedCount: 0, closedCount: 0, openCount: 5 });
    const result = calculatePRHealth(prs);
    expect(result.funnel.open).toBe(5);
    expect(result.mergeRate).toBe(0);
  });

  it('should return MetricResult shape', () => {
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

  it('should filter PRs outside window', () => {
    const oldPR = createMockPR({
      created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    });
    const result = calculatePRHealth([oldPR]);
    expect(result.label).toBe('No recent pull requests');
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
