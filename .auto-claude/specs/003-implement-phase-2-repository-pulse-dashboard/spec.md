# Specification: Implement Phase 2 - Repository Pulse Dashboard Metrics Calculation Engine

## Overview

This task implements Phase 2 of the Repository Pulse Dashboard: the Metrics Calculation Engine. The engine will calculate six "vital signs" that answer the critical question "Is this repo dying?" through predictive trend analysis. This includes building calculation modules for Velocity Score, Community Momentum, Issue Temperature, PR Health, Bus Factor, and Freshness Index, plus an overall pulse aggregator. The implementation follows existing patterns established in HealthScore.js and integrates with the existing API layer.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature implementation that adds significant new functionality (metrics calculation engine) to the application. It requires creating new modules, following established patterns, and will be used by subsequent phases for visualization.

## Task Scope

### Services Involved
- **main** (primary) - Single-page vanilla JavaScript application using Vite

### This Task Will:
- [ ] Create `src/js/components/PulseDashboard/` directory structure
- [ ] Create `PulseCalculator.js` with shared interfaces, types, and utility functions
- [ ] Implement `calculateVelocityScore()` for commit velocity analysis
- [ ] Implement `calculateCommunityMomentum()` for star/fork growth analysis
- [ ] Implement `calculateIssueTemperature()` for issue health metrics
- [ ] Implement `calculatePRHealth()` for pull request metrics
- [ ] Implement `calculateBusFactor()` for contributor concentration risk
- [ ] Implement `calculateFreshnessIndex()` for repository staleness analysis
- [ ] Implement `calculateOverallPulse()` for aggregated status determination
- [ ] Create comprehensive unit tests for all calculators
- [ ] Add JSDoc documentation for all public functions

### Out of Scope:
- Phase 1 (API Layer) - Already complete or separate task
- Phase 3 (Sparkline Visualization) - Future phase
- Phase 4 (Dashboard UI Components) - Future phase
- Phase 5 (Pulse Animation System) - Future phase
- Phase 6 (Integration & Polish) - Future phase
- CSS styling for dashboard components
- HTML modifications to detail.html

## Service Context

### Main Service

**Tech Stack:**
- Language: JavaScript (Vanilla ES6+)
- Framework: None (Vanilla JS)
- Build Tool: Vite
- Testing: Vitest with jsdom

**Entry Point:** `src/js/detail.js`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173 (Vite dev server)

**Test Command:**
```bash
npm test
npm run test:watch
```

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/js/components/PulseDashboard/PulseCalculator.js` | main | Create new file with all 7 metric calculators |
| `src/js/components/PulseDashboard/index.js` | main | Create new file to export public API |
| `src/js/components/PulseDashboard/constants.js` | main | Create new file with thresholds, colors, labels |
| `src/js/__tests__/PulseDashboard.test.js` | main | Create comprehensive tests for calculators |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/js/components/HealthScore.js` | Calculation structure, scoring tiers, weighted averages, return objects |
| `src/js/api.js` | How data is fetched and structured from GitHub API |
| `src/js/__tests__/HealthScore.test.js` | Test structure, mock data creation, edge case testing |
| `src/js/common.js` | Utility functions like `formatNumber`, `formatDate` |
| `docs/repository-pulse-dashboard-implementation-plan.md` | Complete function signatures and implementation details |

## Patterns to Follow

### Pattern 1: Calculation Function Structure

From `src/js/components/HealthScore.js`:

```javascript
export const calculateHealthScore = (repo, options = {}) => {
  const {
    hasReadme = true,
    commitActivity = null
  } = options;

  // Define weights for each metric
  const weights = {
    maintenance: 30,
    community: 25,
    // ...
  };

  // Calculate individual scores
  let scores = {
    maintenance: 0,
    community: 0,
    // ...
  };

  // Logic to calculate each score...

  // Return structured result
  return {
    total: totalScore,
    breakdown: scores,
    weights
  };
};
```

**Key Points:**
- Use options object with defaults for optional parameters
- Return structured object with total, breakdown, and metadata
- Use clear scoring tiers with constants

### Pattern 2: Test Mock Data Creation

From `src/js/__tests__/HealthScore.test.js`:

```javascript
const createMockRepo = (overrides = {}) => ({
  id: 123,
  full_name: 'owner/repo',
  description: 'Test description',
  pushed_at: new Date().toISOString(),
  stargazers_count: 100,
  forks_count: 10,
  license: null,
  homepage: null,
  ...overrides
});
```

**Key Points:**
- Create factory functions for mock data
- Use overrides pattern for test customization
- Test edge cases (null values, empty arrays)

### Pattern 3: Metric Result Type

From implementation plan:

```javascript
/**
 * @typedef {Object} MetricResult
 * @property {number|string} value - Current metric value
 * @property {number} trend - Change percentage (-100 to +100)
 * @property {'up' | 'down' | 'stable'} direction
 * @property {number[]} sparklineData - Data points for visualization
 * @property {'thriving' | 'stable' | 'cooling' | 'at_risk'} status
 * @property {string} label - Human-readable summary
 */
```

**Key Points:**
- Consistent return type across all calculators
- Include trend direction and percentage
- Provide sparkline-ready data array
- Use status enum for overall classification

## Requirements

### Functional Requirements

1. **Velocity Score Calculator**
   - Description: Calculate commit velocity by comparing last 4 weeks vs previous 12 weeks
   - Inputs: GitHub stats/participation data (52 weeks of commit counts)
   - Outputs: MetricResult with commits/week value, trend percentage, 13-week sparkline
   - Acceptance: Returns valid MetricResult for valid data, handles null/empty data gracefully

2. **Community Momentum Calculator**
   - Description: Calculate star/fork growth rate comparing recent vs historical average
   - Inputs: Repository data (stars, forks, created_at), optional events data
   - Outputs: MetricResult with star count, growth trend, approximate sparkline
   - Acceptance: Handles repos with low star counts, approximates trend without star history

3. **Issue Temperature Calculator**
   - Description: Calculate issue health by comparing open rate vs close rate with response time
   - Inputs: Array of issues with created_at, closed_at, state
   - Outputs: MetricResult with Hot/Warm/Cool indicator, close rate, avg response time
   - Acceptance: Correct classification (Cool = healthy, Hot = problematic), handles no issues

4. **PR Health Calculator**
   - Description: Calculate PR merge rate and time-to-merge trend
   - Inputs: Array of pull requests with created_at, merged_at, state
   - Outputs: MetricResult with merge rate percentage, funnel data (opened/merged/closed/open)
   - Acceptance: Accurate merge rate calculation, handles repos with no PRs

5. **Bus Factor Calculator**
   - Description: Analyze commit concentration among top contributors
   - Inputs: Contributor stats array (total commits per contributor)
   - Outputs: MetricResult with bus factor (1-10), risk level, top 5 contributor distribution
   - Acceptance: Correctly identifies high-risk single contributor dominance

6. **Freshness Index Calculator**
   - Description: Calculate repo freshness based on last push, last release, update date
   - Inputs: Repository data, optional releases array
   - Outputs: MetricResult with freshness score (0-100), days since push, last release tag
   - Acceptance: Fresh/Recent/Aging/Stale classification, handles no releases

7. **Overall Pulse Calculator**
   - Description: Aggregate all six metrics into single repository status
   - Inputs: Object containing all six MetricResult objects
   - Outputs: Overall status, average score, pulse animation speed, concerns count, summary
   - Acceptance: Correct aggregation, identifies number of concerning metrics

### Edge Cases

1. **Empty/null participation data** - Return default stable metric with zero values
2. **Repo with no stars** - Community momentum shows low score, not error
3. **No issues in last 30 days** - Issue temperature returns default "Cool" (healthy)
4. **No PRs ever** - PR health returns default stable with explanatory label
5. **Single contributor** - Bus factor = 1 with "Critical" risk level
6. **No releases** - Freshness penalized but not errored, shows "None" for last release
7. **Invalid dates** - Use fallback dates, don't crash
8. **Partial data** - Overall pulse calculates from available metrics only

## Implementation Notes

### DO
- Follow the pattern in `HealthScore.js` for calculation structure and return types
- Reuse utility functions from `common.js` (formatNumber, formatDate)
- Use JSDoc for all public functions with @typedef for types
- Create helper functions for shared logic (average, daysSince, daysBetween)
- Export a `calculateAllMetrics()` function that calls all calculators
- Keep calculations pure - no side effects or DOM manipulation
- Handle edge cases gracefully with sensible defaults

### DON'T
- Create UI components in this phase (that's Phase 4)
- Modify api.js (that's Phase 1)
- Add CSS styles (that's Phase 4-5)
- Use external libraries - vanilla JS only
- Throw errors for missing data - return defaults instead

## Development Environment

### Start Services

```bash
npm install    # Install dependencies
npm run dev    # Start Vite dev server
npm test       # Run tests once
npm run test:watch  # Run tests in watch mode
```

### Service URLs
- Development: http://localhost:5173
- Detail Page: http://localhost:5173/detail.html?repo=owner/repo

### Required Environment Variables
- None required for this phase
- Optional: `gh-token` in localStorage for higher API rate limits

## Success Criteria

The task is complete when:

1. [ ] `src/js/components/PulseDashboard/PulseCalculator.js` exists with all 7 calculators
2. [ ] `src/js/components/PulseDashboard/index.js` exports public API
3. [ ] `src/js/components/PulseDashboard/constants.js` contains thresholds and labels
4. [ ] All calculators return valid MetricResult objects
5. [ ] Edge cases handled gracefully (null data, empty arrays)
6. [ ] `calculateAllMetrics()` aggregates all individual calculators
7. [ ] No console errors when processing valid or invalid data
8. [ ] Existing tests still pass (`npm test` shows 283+ tests passing)
9. [ ] New tests added in `PulseDashboard.test.js` with 90%+ coverage
10. [ ] All functions have JSDoc documentation

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| calculateVelocityScore handles empty data | `src/js/__tests__/PulseDashboard.test.js` | Returns default metric for null participation |
| calculateVelocityScore detects increasing activity | `src/js/__tests__/PulseDashboard.test.js` | direction='up' when recent > previous |
| calculateVelocityScore detects declining activity | `src/js/__tests__/PulseDashboard.test.js` | direction='down' when recent < previous |
| calculateCommunityMomentum handles low stars | `src/js/__tests__/PulseDashboard.test.js` | Returns valid result for 0-10 stars |
| calculateIssueTemperature classifies correctly | `src/js/__tests__/PulseDashboard.test.js` | Hot/Warm/Cool based on close rate |
| calculatePRHealth calculates merge rate | `src/js/__tests__/PulseDashboard.test.js` | Accurate percentage, includes funnel data |
| calculateBusFactor identifies single contributor | `src/js/__tests__/PulseDashboard.test.js` | value=1, riskLevel='Critical' |
| calculateFreshnessIndex respects push date | `src/js/__tests__/PulseDashboard.test.js` | Higher score for recent push |
| calculateOverallPulse aggregates correctly | `src/js/__tests__/PulseDashboard.test.js` | Counts concerns, sets correct status |
| All calculators return MetricResult shape | `src/js/__tests__/PulseDashboard.test.js` | value, trend, direction, status, label exist |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| calculateAllMetrics with real-ish data | PulseCalculator | All 6 metrics + overall pulse returned |
| Edge case: all null inputs | PulseCalculator | No crashes, defaults returned |
| Partial data scenario | PulseCalculator | Available metrics calculated, missing gracefully handled |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Import and use calculators | 1. Import from index.js 2. Call calculateAllMetrics | Valid pulse data object returned |

### Browser Verification (if frontend)
N/A for this phase - pure calculation module with no UI

### Database Verification (if applicable)
N/A - no database in this application

### QA Sign-off Requirements
- [ ] All unit tests pass (`npm test` shows green)
- [ ] All new tests for PulseCalculator pass
- [ ] No regressions in existing functionality (283+ tests still passing)
- [ ] Edge cases covered (null, empty, partial data)
- [ ] JSDoc documentation complete for all public functions
- [ ] Code follows established patterns from HealthScore.js
- [ ] No security vulnerabilities introduced
- [ ] Console is clean (no errors or warnings from calculators)

## Appendix: Implementation Reference

### Helper Utility Functions to Create

```javascript
/**
 * Calculate average of an array of numbers
 */
function average(arr) {
  if (!arr?.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Calculate days since a given date
 */
function daysSince(dateString) {
  return Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Calculate days between two dates
 */
function daysBetween(startDate, endDate) {
  return Math.floor((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
}

/**
 * Get trend direction from percentage change
 */
function getTrendDirection(change, threshold = 5) {
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

/**
 * Get status from score (0-100)
 */
function getMetricStatus(score) {
  if (score >= 75) return 'thriving';
  if (score >= 50) return 'stable';
  if (score >= 25) return 'cooling';
  return 'at_risk';
}

/**
 * Create default metric for missing data
 */
function getDefaultMetric(type) {
  return {
    value: 0,
    trend: 0,
    direction: 'stable',
    sparklineData: [],
    status: 'stable',
    label: `${type} data unavailable`
  };
}
```

### File Structure

```
src/js/components/PulseDashboard/
├── index.js              # Public exports
├── PulseCalculator.js    # All 7 calculation functions
└── constants.js          # Thresholds, colors, labels
```
