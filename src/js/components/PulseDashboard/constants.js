/**
 * PulseDashboard Constants
 * Thresholds, status labels, and default values for repository pulse metrics
 *
 * @module components/PulseDashboard/constants
 */

// =============================================================================
// STATUS THRESHOLDS
// =============================================================================

/**
 * Score thresholds for determining metric status
 * @type {Object}
 */
export const STATUS_THRESHOLDS = {
  THRIVING: 75,
  STABLE: 50,
  COOLING: 25
  // Below COOLING is AT_RISK
};

/**
 * Status labels with human-readable descriptions
 * @type {Object}
 */
export const STATUS_LABELS = {
  thriving: { label: 'Thriving', class: 'thriving', description: 'Excellent health and activity' },
  stable: { label: 'Stable', class: 'stable', description: 'Healthy and maintained' },
  cooling: { label: 'Cooling', class: 'cooling', description: 'Declining activity' },
  at_risk: { label: 'At Risk', class: 'at-risk', description: 'Needs attention' }
};

/**
 * Trend direction thresholds (percentage change)
 * @type {Object}
 */
export const TREND_THRESHOLDS = {
  SIGNIFICANT: 5,   // Above this = up/down direction
  NOTABLE: 15,      // Above this = strong trend
  DRAMATIC: 30      // Above this = dramatic change
};

// =============================================================================
// VELOCITY SCORE THRESHOLDS
// =============================================================================

/**
 * Velocity score configuration for commit activity analysis
 * Compares recent (last 4 weeks) vs previous (prior 12 weeks)
 * @type {Object}
 */
export const VELOCITY = {
  RECENT_WEEKS: 4,
  PREVIOUS_WEEKS: 12,
  SPARKLINE_WEEKS: 13,

  // Commits per week thresholds
  COMMITS: {
    EXCELLENT: 20,
    GOOD: 10,
    FAIR: 5,
    MINIMAL: 1
  },

  // Growth rate thresholds (percentage)
  GROWTH: {
    THRIVING: 25,   // >25% increase = thriving
    STABLE: -10,    // -10% to +25% = stable
    COOLING: -30    // -30% to -10% = cooling
    // Below -30% = at_risk
  }
};

// =============================================================================
// COMMUNITY MOMENTUM THRESHOLDS
// =============================================================================

/**
 * Community momentum configuration for star/fork growth analysis
 * @type {Object}
 */
export const COMMUNITY = {
  // Star count tiers (matches HealthScore pattern)
  STARS: {
    EXCELLENT: 10000,
    GOOD: 1000,
    FAIR: 100,
    EMERGING: 10
  },

  // Daily star growth rate thresholds
  GROWTH_RATE: {
    THRIVING: 5,    // >5 stars/day average
    STABLE: 1,      // 1-5 stars/day
    COOLING: 0.1    // 0.1-1 stars/day
    // Below 0.1 = at_risk
  },

  // Fork ratio thresholds (forks / stars)
  FORK_RATIO: {
    HIGH: 0.3,      // >30% fork rate = high engagement
    MEDIUM: 0.1,    // 10-30% = medium
    LOW: 0.05       // 5-10% = low
    // Below 5% = minimal
  },

  // Days for sparkline approximation
  SPARKLINE_DAYS: 30
};

// =============================================================================
// ISSUE TEMPERATURE THRESHOLDS
// =============================================================================

/**
 * Issue temperature configuration for issue health analysis
 * Cool = healthy (issues getting resolved), Hot = problematic (piling up)
 * @type {Object}
 */
export const ISSUES = {
  // Analysis window (days)
  WINDOW_DAYS: 30,

  // Close rate thresholds (percentage of issues closed)
  CLOSE_RATE: {
    COOL: 70,       // >70% closed = Cool (healthy)
    WARM: 40,       // 40-70% = Warm
    HOT: 20         // 20-40% = Hot
    // Below 20% = Critical (very hot)
  },

  // Average response time thresholds (days)
  RESPONSE_TIME: {
    EXCELLENT: 1,
    GOOD: 3,
    FAIR: 7,
    SLOW: 14
  },

  // Temperature labels
  TEMPERATURE: {
    cool: { label: 'Cool', class: 'cool', description: 'Issues resolved quickly' },
    warm: { label: 'Warm', class: 'warm', description: 'Moderate issue activity' },
    hot: { label: 'Hot', class: 'hot', description: 'Issues piling up' },
    critical: { label: 'Critical', class: 'critical', description: 'Urgent attention needed' }
  }
};

// =============================================================================
// PR HEALTH THRESHOLDS
// =============================================================================

/**
 * PR health configuration for pull request analysis
 * @type {Object}
 */
export const PR_HEALTH = {
  // Analysis window (days)
  WINDOW_DAYS: 30,

  // Merge rate thresholds (percentage of PRs merged)
  MERGE_RATE: {
    EXCELLENT: 80,
    GOOD: 60,
    FAIR: 40,
    POOR: 20
  },

  // Time to merge thresholds (days)
  TIME_TO_MERGE: {
    EXCELLENT: 1,
    GOOD: 3,
    FAIR: 7,
    SLOW: 14
  },

  // PR volume thresholds (PRs per week)
  VOLUME: {
    HIGH: 10,
    MEDIUM: 5,
    LOW: 1
  }
};

// =============================================================================
// BUS FACTOR THRESHOLDS
// =============================================================================

/**
 * Bus factor configuration for contributor concentration risk
 * Lower bus factor = higher risk (1 = single point of failure)
 * @type {Object}
 */
export const BUS_FACTOR = {
  // Bus factor scale (1-10)
  MIN: 1,
  MAX: 10,

  // Risk level thresholds
  RISK: {
    HEALTHY: 5,     // 5+ contributors with significant commits = healthy
    MODERATE: 3,    // 3-4 = moderate risk
    HIGH: 2,        // 2 = high risk
    CRITICAL: 1     // 1 = critical (single contributor)
  },

  // Contribution concentration threshold
  // Percentage of commits from top contributor
  CONCENTRATION: {
    DISTRIBUTED: 30,   // <30% from top = well distributed
    MODERATE: 50,      // 30-50% = moderate concentration
    HIGH: 70,          // 50-70% = high concentration
    CRITICAL: 90       // >70% = critical concentration
  },

  // Risk labels
  RISK_LABELS: {
    healthy: { label: 'Healthy', class: 'healthy', description: 'Well-distributed contributions' },
    moderate: { label: 'Moderate', class: 'moderate', description: 'Some concentration risk' },
    high: { label: 'High', class: 'high', description: 'Concentrated contributions' },
    critical: { label: 'Critical', class: 'critical', description: 'Single point of failure' }
  }
};

// =============================================================================
// FRESHNESS INDEX THRESHOLDS
// =============================================================================

/**
 * Freshness index configuration for repository staleness analysis
 * @type {Object}
 */
export const FRESHNESS = {
  // Days since last push thresholds
  PUSH_DAYS: {
    FRESH: 7,       // Within 7 days = fresh
    RECENT: 30,     // Within 30 days = recent
    AGING: 90,      // Within 90 days = aging
    STALE: 180      // Within 180 days = stale
    // Beyond 180 days = dormant
  },

  // Days since last release thresholds
  RELEASE_DAYS: {
    FRESH: 30,
    RECENT: 90,
    AGING: 180,
    STALE: 365
  },

  // Freshness score components (0-100 each)
  SCORES: {
    FRESH: 100,
    RECENT: 75,
    AGING: 50,
    STALE: 25,
    DORMANT: 10
  },

  // Weights for freshness calculation
  WEIGHTS: {
    PUSH: 60,       // Last push is most important
    RELEASE: 25,    // Release recency matters
    UPDATE: 15      // General update time
  },

  // Freshness labels
  LABELS: {
    fresh: { label: 'Fresh', class: 'fresh', description: 'Actively maintained' },
    recent: { label: 'Recent', class: 'recent', description: 'Recently updated' },
    aging: { label: 'Aging', class: 'aging', description: 'Showing signs of age' },
    stale: { label: 'Stale', class: 'stale', description: 'May be unmaintained' },
    dormant: { label: 'Dormant', class: 'dormant', description: 'Likely abandoned' }
  }
};

// =============================================================================
// OVERALL PULSE CONFIGURATION
// =============================================================================

/**
 * Overall pulse aggregation configuration
 * @type {Object}
 */
export const PULSE = {
  // Weights for each metric in overall score
  WEIGHTS: {
    velocity: 20,
    momentum: 15,
    issues: 20,
    prs: 15,
    busFactor: 15,
    freshness: 15
  },

  // Status to score mapping for aggregation
  STATUS_SCORES: {
    thriving: 100,
    stable: 70,
    cooling: 40,
    at_risk: 15
  },

  // Pulse animation speeds (milliseconds per heartbeat)
  ANIMATION_SPEED: {
    thriving: 800,    // Fast pulse
    stable: 1200,     // Normal pulse
    cooling: 1800,    // Slow pulse
    at_risk: 2500     // Very slow pulse
  },

  // Concern thresholds
  CONCERNS: {
    FEW: 1,           // 1-2 metrics at_risk or cooling
    SOME: 3,          // 3-4 metrics
    MANY: 5           // 5+ metrics
  }
};

// =============================================================================
// DEFAULT VALUES
// =============================================================================

/**
 * Default metric result for missing/invalid data
 * @type {Object}
 */
export const DEFAULT_METRIC = {
  value: 0,
  trend: 0,
  direction: 'stable',
  sparklineData: [],
  status: 'stable',
  label: 'Data unavailable'
};

/**
 * Default values for specific metric types
 * @type {Object}
 */
export const DEFAULTS = {
  velocity: {
    ...DEFAULT_METRIC,
    label: 'Commit data unavailable'
  },
  momentum: {
    ...DEFAULT_METRIC,
    label: 'Growth data unavailable'
  },
  issues: {
    ...DEFAULT_METRIC,
    value: 'Cool',
    temperature: 'cool',
    label: 'No recent issues',
    status: 'stable'
  },
  prs: {
    ...DEFAULT_METRIC,
    label: 'No recent pull requests',
    funnel: { opened: 0, merged: 0, closed: 0, open: 0 }
  },
  busFactor: {
    ...DEFAULT_METRIC,
    value: 1,
    riskLevel: 'critical',
    label: 'Contributor data unavailable'
  },
  freshness: {
    ...DEFAULT_METRIC,
    freshness: 'stale',
    daysSincePush: null,
    lastRelease: 'None',
    label: 'Update data unavailable'
  }
};

// =============================================================================
// TIME CONSTANTS
// =============================================================================

/**
 * Time constants in milliseconds
 * @type {Object}
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000
};

/**
 * Time constants in days
 * @type {Object}
 */
export const TIME_DAYS = {
  WEEK: 7,
  MONTH: 30,
  QUARTER: 90,
  HALF_YEAR: 180,
  YEAR: 365
};
