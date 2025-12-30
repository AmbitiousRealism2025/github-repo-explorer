# Repository Pulse Dashboard Implementation Plan

*Created: December 30, 2025*

This document outlines a phased approach to implementing the Repository Pulse Dashboard - a real-time trend analysis system that shows whether a repository is accelerating, stable, or declining.

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Data Collection & API Layer](#phase-1-data-collection--api-layer)
3. [Phase 2: Metrics Calculation Engine](#phase-2-metrics-calculation-engine)
4. [Phase 3: Sparkline Visualization](#phase-3-sparkline-visualization)
5. [Phase 4: Dashboard UI Components](#phase-4-dashboard-ui-components)
6. [Phase 5: Pulse Animation System](#phase-5-pulse-animation-system)
7. [Phase 6: Integration & Polish](#phase-6-integration--polish)
8. [Technical Specifications](#technical-specifications)
9. [File Structure](#file-structure)
10. [Testing Strategy](#testing-strategy)

---

## Overview

### Goal
Create a dynamic dashboard displaying six "vital signs" that answer the critical question: **"Is this repo dying?"** through predictive trend analysis rather than static metrics.

### Key Metrics

| Metric | Calculation | Visual |
|--------|-------------|--------|
| **Velocity Score** | Commits/week: last month vs previous 3 months | Sparkline + trend arrow |
| **Community Momentum** | New stars/forks rate (30 days vs historical average) | Growth rate percentage |
| **Issue Temperature** | Open rate vs close rate with response time | Hot/Warm/Cool indicator |
| **PR Health** | Merge rate, time-to-merge trend, review participation | Funnel visualization |
| **Bus Factor** | Concentration of commits among top contributors | Risk indicator (1-10) |
| **Freshness Index** | Dependency age, last release, changelog activity | Freshness gauge |

### Status Indicators

| Status | Criteria | Color |
|--------|----------|-------|
| Thriving | Strong positive trends across 4+ metrics | Green |
| Stable | Consistent activity, no major changes | Yellow |
| Cooling | Declining metrics in 2+ areas | Orange |
| At Risk | Multiple concerning signals (3+ declining) | Red |

---

## Phase 1: Data Collection & API Layer

**Goal:** Extend the API layer to fetch all data required for trend calculations.

### Tasks

#### 1.1 Add New API Endpoints to `api.js`
- [ ] Create `getRepositoryStats(owner, repo)` - Fetch participation stats
- [ ] Create `getContributorStats(owner, repo)` - Fetch contributor activity
- [ ] Create `getIssueStats(owner, repo)` - Fetch issue metrics
- [ ] Create `getPullRequestStats(owner, repo)` - Fetch PR metrics
- [ ] Create `getReleaseHistory(owner, repo)` - Fetch release timeline

```javascript
// New API functions to implement in api.js

/**
 * Get weekly commit activity for the last year
 * Endpoint: GET /repos/{owner}/{repo}/stats/participation
 */
export async function getParticipationStats(owner, repo) {
  return fetchWithCache(`repos/${owner}/${repo}/stats/participation`);
}

/**
 * Get contributor commit activity
 * Endpoint: GET /repos/{owner}/{repo}/stats/contributors
 */
export async function getContributorStats(owner, repo) {
  return fetchWithCache(`repos/${owner}/${repo}/stats/contributors`);
}

/**
 * Get issues with created/closed timestamps
 * Endpoint: GET /repos/{owner}/{repo}/issues
 */
export async function getIssueTimeline(owner, repo, params = {}) {
  const query = new URLSearchParams({
    state: 'all',
    per_page: 100,
    sort: 'created',
    direction: 'desc',
    ...params
  });
  return fetchWithCache(`repos/${owner}/${repo}/issues?${query}`);
}

/**
 * Get pull requests with merge timestamps
 * Endpoint: GET /repos/{owner}/{repo}/pulls
 */
export async function getPullRequestTimeline(owner, repo, params = {}) {
  const query = new URLSearchParams({
    state: 'all',
    per_page: 100,
    sort: 'created',
    direction: 'desc',
    ...params
  });
  return fetchWithCache(`repos/${owner}/${repo}/pulls?${query}`);
}

/**
 * Get release history
 * Endpoint: GET /repos/{owner}/{repo}/releases
 */
export async function getReleaseHistory(owner, repo) {
  return fetchWithCache(`repos/${owner}/${repo}/releases?per_page=30`);
}
```

#### 1.2 Implement Rate-Limit Aware Batch Fetching
- [ ] Create `fetchPulseData(owner, repo)` aggregator function
- [ ] Implement parallel fetching with rate limit awareness
- [ ] Add specific handling for 202 "computing" responses
- [ ] Implement progressive loading (show partial data)

```javascript
/**
 * Fetch all pulse dashboard data with parallel requests
 * Returns partial data if some endpoints fail
 */
export async function fetchPulseData(owner, repo) {
  const results = await Promise.allSettled([
    getParticipationStats(owner, repo),
    getContributorStats(owner, repo),
    getIssueTimeline(owner, repo),
    getPullRequestTimeline(owner, repo),
    getReleaseHistory(owner, repo),
    getCommitActivity(owner, repo), // existing
  ]);

  return {
    participation: results[0].status === 'fulfilled' ? results[0].value : null,
    contributors: results[1].status === 'fulfilled' ? results[1].value : null,
    issues: results[2].status === 'fulfilled' ? results[2].value : null,
    pullRequests: results[3].status === 'fulfilled' ? results[3].value : null,
    releases: results[4].status === 'fulfilled' ? results[4].value : null,
    commits: results[5].status === 'fulfilled' ? results[5].value : null,
  };
}
```

#### 1.3 Add Data Caching Strategy
- [ ] Extend in-memory cache TTL for stats endpoints (longer than 5 min)
- [ ] Add localStorage fallback for expensive calculations
- [ ] Implement cache versioning for pulse data

### Deliverables
- Extended `api.js` with 5+ new endpoint functions
- Batch data fetcher with error resilience
- Enhanced caching for statistics endpoints

### Estimated Complexity: Medium

---

## Phase 2: Metrics Calculation Engine

**Goal:** Build calculation modules for each of the six pulse metrics.

### Tasks

#### 2.1 Create PulseCalculator Module
- [ ] Create `src/js/components/PulseDashboard/PulseCalculator.js`
- [ ] Define shared interfaces and types
- [ ] Implement trend comparison utilities

```javascript
// Core types and utilities

/**
 * @typedef {Object} MetricResult
 * @property {number} value - Current metric value
 * @property {number} trend - Change percentage (-100 to +100)
 * @property {'up' | 'down' | 'stable'} direction
 * @property {number[]} sparklineData - 90-day data points
 * @property {string} status - 'thriving' | 'stable' | 'cooling' | 'at_risk'
 */

/**
 * Calculate trend direction from percentage change
 */
export function getTrendDirection(change, threshold = 5) {
  if (change > threshold) return 'up';
  if (change < -threshold) return 'down';
  return 'stable';
}

/**
 * Get status from metric score (0-100)
 */
export function getMetricStatus(score) {
  if (score >= 75) return 'thriving';
  if (score >= 50) return 'stable';
  if (score >= 25) return 'cooling';
  return 'at_risk';
}
```

#### 2.2 Implement Velocity Score Calculator
- [ ] Create `calculateVelocityScore(participationData)`
- [ ] Compare last 4 weeks vs previous 12 weeks
- [ ] Generate weekly sparkline data points
- [ ] Handle sparse commit data gracefully

```javascript
/**
 * Calculate commit velocity score
 * @param {Object} participation - GitHub stats/participation response
 * @returns {MetricResult}
 */
export function calculateVelocityScore(participation) {
  if (!participation?.all) return getDefaultMetric('velocity');

  const weeks = participation.all; // 52 weeks of commit counts

  // Last 4 weeks vs previous 12 weeks
  const recentWeeks = weeks.slice(-4);
  const previousWeeks = weeks.slice(-16, -4);

  const recentAvg = average(recentWeeks);
  const previousAvg = average(previousWeeks);

  const change = previousAvg > 0
    ? ((recentAvg - previousAvg) / previousAvg) * 100
    : 0;

  // Score: 0-100 based on activity level and trend
  const activityScore = Math.min(100, (recentAvg / 10) * 50);
  const trendScore = Math.min(50, Math.max(0, 25 + change));

  return {
    value: recentAvg.toFixed(1),
    trend: change.toFixed(1),
    direction: getTrendDirection(change),
    sparklineData: weeks.slice(-13), // Last 90 days (13 weeks)
    status: getMetricStatus(activityScore + trendScore),
    label: `${recentAvg.toFixed(1)} commits/week`
  };
}
```

#### 2.3 Implement Community Momentum Calculator
- [ ] Create `calculateCommunityMomentum(repo, starHistory)`
- [ ] Calculate star velocity (stars per day, recent vs historical)
- [ ] Factor in fork rate
- [ ] Handle repos with low star counts

```javascript
/**
 * Calculate community growth momentum
 * Note: GitHub API doesn't provide star history, use repo.stargazers_count
 * and watchers over time approximation
 */
export function calculateCommunityMomentum(repo, events) {
  const repoAge = daysSince(repo.created_at);
  const starsPerDay = repo.stargazers_count / repoAge;

  // Estimate recent activity from watch/star events if available
  const recentStarEvents = events?.filter(e =>
    e.type === 'WatchEvent' &&
    daysSince(e.created_at) <= 30
  ).length || 0;

  const historicalRate = starsPerDay * 30; // Expected in 30 days
  const change = historicalRate > 0
    ? ((recentStarEvents - historicalRate) / historicalRate) * 100
    : 0;

  return {
    value: repo.stargazers_count,
    trend: change.toFixed(1),
    direction: getTrendDirection(change, 10),
    sparklineData: generateApproximateSparkline(repo.stargazers_count, repoAge),
    status: getMetricStatus(calculateMomentumScore(starsPerDay, change)),
    label: `${formatNumber(repo.stargazers_count)} stars`
  };
}
```

#### 2.4 Implement Issue Temperature Calculator
- [ ] Create `calculateIssueTemperature(issues)`
- [ ] Compare open rate vs close rate
- [ ] Factor in average response time
- [ ] Generate temperature indicator (Hot/Warm/Cool)

```javascript
/**
 * Calculate issue health "temperature"
 */
export function calculateIssueTemperature(issues) {
  if (!issues?.length) return getDefaultMetric('issues');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentIssues = issues.filter(i =>
    new Date(i.created_at) >= thirtyDaysAgo
  );

  const opened = recentIssues.length;
  const closed = recentIssues.filter(i => i.state === 'closed').length;

  // Calculate average response time (first comment or close)
  const responseTimes = recentIssues
    .filter(i => i.closed_at)
    .map(i => daysBetween(i.created_at, i.closed_at));

  const avgResponseTime = average(responseTimes) || 0;

  // Temperature score: higher close rate + faster response = cooler (good)
  const closeRate = opened > 0 ? (closed / opened) * 100 : 100;
  const responseScore = Math.max(0, 100 - avgResponseTime * 5);
  const score = (closeRate * 0.6) + (responseScore * 0.4);

  // Temperature label (inverted - hot means problems)
  const temperature = score >= 70 ? 'Cool' : score >= 40 ? 'Warm' : 'Hot';

  return {
    value: `${opened} / ${closed}`,
    trend: closeRate - 50, // 50% is baseline
    direction: closeRate >= 50 ? 'up' : 'down',
    sparklineData: generateIssueSparkline(issues),
    status: getMetricStatus(score),
    label: `${temperature} - ${avgResponseTime.toFixed(0)}d avg response`,
    temperature
  };
}
```

#### 2.5 Implement PR Health Calculator
- [ ] Create `calculatePRHealth(pullRequests)`
- [ ] Calculate merge rate and time-to-merge trend
- [ ] Generate funnel visualization data
- [ ] Factor in review participation

```javascript
/**
 * Calculate PR health metrics
 */
export function calculatePRHealth(pullRequests) {
  if (!pullRequests?.length) return getDefaultMetric('prs');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const recentPRs = pullRequests.filter(pr =>
    new Date(pr.created_at) >= thirtyDaysAgo
  );

  const merged = recentPRs.filter(pr => pr.merged_at).length;
  const closed = recentPRs.filter(pr => pr.state === 'closed').length;
  const open = recentPRs.filter(pr => pr.state === 'open').length;

  // Time to merge for merged PRs
  const mergeTimes = recentPRs
    .filter(pr => pr.merged_at)
    .map(pr => daysBetween(pr.created_at, pr.merged_at));

  const avgMergeTime = average(mergeTimes) || 0;
  const mergeRate = recentPRs.length > 0
    ? (merged / recentPRs.length) * 100
    : 0;

  // Score based on merge rate and speed
  const score = (mergeRate * 0.5) + Math.max(0, 50 - avgMergeTime * 2);

  return {
    value: mergeRate.toFixed(0),
    trend: mergeRate - 50,
    direction: mergeRate >= 50 ? 'up' : 'down',
    sparklineData: generatePRSparkline(pullRequests),
    status: getMetricStatus(score),
    label: `${mergeRate.toFixed(0)}% merged, ${avgMergeTime.toFixed(1)}d avg`,
    funnel: { opened: recentPRs.length, merged, closed, open }
  };
}
```

#### 2.6 Implement Bus Factor Calculator
- [ ] Create `calculateBusFactor(contributors)`
- [ ] Analyze commit concentration among top contributors
- [ ] Calculate risk level (1-10 scale)
- [ ] Provide contributor distribution data

```javascript
/**
 * Calculate bus factor (contributor concentration risk)
 * Lower is worse - indicates high dependency on few contributors
 */
export function calculateBusFactor(contributors) {
  if (!contributors?.length) return getDefaultMetric('busFactor');

  // Sort by total commits
  const sorted = [...contributors].sort((a, b) => b.total - a.total);
  const totalCommits = sorted.reduce((sum, c) => sum + c.total, 0);

  // Calculate how many contributors make up 80% of commits
  let accumulated = 0;
  let busFactorCount = 0;

  for (const contributor of sorted) {
    accumulated += contributor.total;
    busFactorCount++;
    if (accumulated >= totalCommits * 0.8) break;
  }

  // Score: more contributors for 80% = better (max 10)
  const busFactor = Math.min(10, busFactorCount);

  // Risk assessment
  const riskLevel = busFactor <= 1 ? 'Critical'
    : busFactor <= 2 ? 'High'
    : busFactor <= 4 ? 'Medium'
    : 'Low';

  // Top contributor percentage
  const topContributorPct = sorted[0]
    ? ((sorted[0].total / totalCommits) * 100).toFixed(0)
    : 0;

  return {
    value: busFactor,
    trend: 0, // Bus factor doesn't have a trend
    direction: busFactor >= 3 ? 'up' : 'down',
    sparklineData: sorted.slice(0, 10).map(c => c.total),
    status: getMetricStatus(busFactor * 10),
    label: `${busFactor} contributors for 80%, top: ${topContributorPct}%`,
    riskLevel,
    distribution: sorted.slice(0, 5).map(c => ({
      login: c.author?.login || 'Unknown',
      commits: c.total,
      percentage: ((c.total / totalCommits) * 100).toFixed(1)
    }))
  };
}
```

#### 2.7 Implement Freshness Index Calculator
- [ ] Create `calculateFreshnessIndex(repo, releases)`
- [ ] Factor in last commit, last release, repo update date
- [ ] Calculate staleness based on typical update frequency
- [ ] Generate freshness gauge value

```javascript
/**
 * Calculate freshness index based on recent activity
 */
export function calculateFreshnessIndex(repo, releases) {
  const daysSinceUpdate = daysSince(repo.updated_at);
  const daysSincePush = daysSince(repo.pushed_at);

  // Last release date
  const lastRelease = releases?.[0];
  const daysSinceRelease = lastRelease
    ? daysSince(lastRelease.published_at)
    : Infinity;

  // Score each factor (lower days = better)
  const updateScore = Math.max(0, 100 - daysSinceUpdate * 2);
  const pushScore = Math.max(0, 100 - daysSincePush * 3);
  const releaseScore = daysSinceRelease === Infinity
    ? 30 // Penalty for no releases
    : Math.max(0, 100 - daysSinceRelease);

  // Weighted average
  const score = (updateScore * 0.2) + (pushScore * 0.5) + (releaseScore * 0.3);

  // Freshness label
  const freshness = score >= 80 ? 'Fresh'
    : score >= 50 ? 'Recent'
    : score >= 25 ? 'Aging'
    : 'Stale';

  return {
    value: score.toFixed(0),
    trend: -daysSincePush, // Negative = getting staler
    direction: daysSincePush <= 7 ? 'up' : daysSincePush <= 30 ? 'stable' : 'down',
    sparklineData: generateFreshnessSparkline(releases),
    status: getMetricStatus(score),
    label: `${freshness} - Last push: ${daysSincePush}d ago`,
    freshness,
    lastRelease: lastRelease?.tag_name || 'None',
    daysSincePush
  };
}
```

#### 2.8 Create Overall Pulse Calculator
- [ ] Create `calculateOverallPulse(metrics)`
- [ ] Aggregate all six metrics into single status
- [ ] Determine pulse animation speed
- [ ] Generate summary insights

```javascript
/**
 * Calculate overall repository pulse status
 */
export function calculateOverallPulse(metrics) {
  const statusScores = {
    thriving: 4,
    stable: 3,
    cooling: 2,
    at_risk: 1
  };

  const metricsList = [
    metrics.velocity,
    metrics.momentum,
    metrics.issues,
    metrics.prs,
    metrics.busFactor,
    metrics.freshness
  ].filter(Boolean);

  const avgScore = average(metricsList.map(m => statusScores[m.status]));

  // Overall status
  const overall = avgScore >= 3.5 ? 'thriving'
    : avgScore >= 2.5 ? 'stable'
    : avgScore >= 1.5 ? 'cooling'
    : 'at_risk';

  // Count concerning metrics
  const concerns = metricsList.filter(m =>
    m.status === 'cooling' || m.status === 'at_risk'
  );

  // Pulse animation speed (faster = more active)
  const pulseSpeed = avgScore >= 3 ? 'fast'
    : avgScore >= 2 ? 'normal'
    : 'slow';

  return {
    status: overall,
    score: avgScore,
    pulseSpeed,
    concerns: concerns.length,
    summary: generatePulseSummary(metrics, overall),
    insights: generateInsights(metrics)
  };
}
```

### Deliverables
- `PulseCalculator.js` with 7 metric calculators
- Overall pulse aggregation logic
- Utility functions for trend analysis
- JSDoc documentation for all functions

### Estimated Complexity: High

---

## Phase 3: Sparkline Visualization

**Goal:** Create a reusable sparkline component for 90-day trend visualization.

### Tasks

#### 3.1 Create Sparkline Component
- [ ] Create `src/js/components/PulseDashboard/Sparkline.js`
- [ ] Implement SVG-based sparkline rendering
- [ ] Support positive/negative trend coloring
- [ ] Add optional area fill under line

```javascript
/**
 * Create a sparkline SVG element
 * @param {number[]} data - Array of data points
 * @param {Object} options - Configuration options
 */
export function createSparkline(data, options = {}) {
  const {
    width = 100,
    height = 30,
    strokeColor = 'currentColor',
    fillColor = null,
    strokeWidth = 1.5,
    showDots = false,
    trend = null // 'up' | 'down' | 'stable'
  } = options;

  if (!data?.length) {
    return createEmptySparkline(width, height);
  }

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('class', 'sparkline');
  svg.setAttribute('aria-hidden', 'true');

  // Normalize data to fit height
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return { x, y };
  });

  // Create path
  const pathData = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  // Optional area fill
  if (fillColor) {
    const areaPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    areaPath.setAttribute('d', `${pathData} L ${width} ${height} L 0 ${height} Z`);
    areaPath.setAttribute('fill', fillColor);
    areaPath.setAttribute('opacity', '0.2');
    svg.appendChild(areaPath);
  }

  // Main line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', pathData);
  line.setAttribute('fill', 'none');
  line.setAttribute('stroke', getTrendColor(trend) || strokeColor);
  line.setAttribute('stroke-width', strokeWidth);
  line.setAttribute('stroke-linecap', 'round');
  line.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(line);

  return svg;
}

function getTrendColor(trend) {
  const colors = {
    up: 'var(--color-success)',
    down: 'var(--color-error)',
    stable: 'var(--color-warning)'
  };
  return colors[trend] || null;
}
```

#### 3.2 Add Sparkline Styling
- [ ] Add CSS for sparkline container
- [ ] Implement hover state showing exact values
- [ ] Support dark/light theme colors

```css
/* Sparkline styles for components.css */
.sparkline {
  display: block;
  width: 100%;
  height: 100%;
}

.sparkline-container {
  position: relative;
  width: 100px;
  height: 30px;
}

.sparkline-tooltip {
  position: absolute;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.sparkline-container:hover .sparkline-tooltip {
  opacity: 1;
}
```

#### 3.3 Create Trend Arrow Component
- [ ] Create `TrendArrow.js` for directional indicators
- [ ] Support up/down/stable states with animations
- [ ] Include percentage change display

```javascript
/**
 * Create trend arrow indicator
 */
export function createTrendArrow(direction, change) {
  const container = document.createElement('span');
  container.className = `trend-arrow trend-arrow--${direction}`;

  const arrow = direction === 'up' ? '↑'
    : direction === 'down' ? '↓'
    : '→';

  const changeText = change !== 0
    ? `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    : '';

  container.innerHTML = `
    <span class="trend-arrow__icon">${arrow}</span>
    ${changeText ? `<span class="trend-arrow__change">${changeText}</span>` : ''}
  `;

  return container;
}
```

### Deliverables
- `Sparkline.js` component with SVG rendering
- `TrendArrow.js` indicator component
- CSS styles for both components
- Responsive sizing support

### Estimated Complexity: Medium

---

## Phase 4: Dashboard UI Components

**Goal:** Build the visual dashboard with six vital sign cards.

### Tasks

#### 4.1 Create Metric Card Component
- [ ] Create `src/js/components/PulseDashboard/MetricCard.js`
- [ ] Implement card layout with value, sparkline, trend
- [ ] Support different card variants (standard, temperature, funnel)
- [ ] Add status indicator styling

```javascript
/**
 * Create a metric card for the pulse dashboard
 */
export function createMetricCard(metric, type = 'standard') {
  const card = document.createElement('div');
  card.className = `pulse-card pulse-card--${metric.status}`;

  const statusIcon = getStatusIcon(metric.status);
  const sparkline = createSparkline(metric.sparklineData, {
    trend: metric.direction,
    width: 80,
    height: 24
  });
  const trendArrow = createTrendArrow(metric.direction, metric.trend);

  card.innerHTML = `
    <div class="pulse-card__header">
      <h3 class="pulse-card__title">${getMetricTitle(type)}</h3>
      <span class="pulse-card__status" title="${metric.status}">
        ${statusIcon}
      </span>
    </div>
    <div class="pulse-card__body">
      <div class="pulse-card__value">${metric.value}</div>
      <div class="pulse-card__trend"></div>
      <div class="pulse-card__sparkline"></div>
    </div>
    <div class="pulse-card__footer">
      <span class="pulse-card__label">${metric.label}</span>
    </div>
  `;

  card.querySelector('.pulse-card__trend').appendChild(trendArrow);
  card.querySelector('.pulse-card__sparkline').appendChild(sparkline);

  // Add type-specific content
  if (type === 'temperature' && metric.temperature) {
    addTemperatureIndicator(card, metric.temperature);
  } else if (type === 'funnel' && metric.funnel) {
    addFunnelVisualization(card, metric.funnel);
  } else if (type === 'busFactor' && metric.distribution) {
    addContributorBars(card, metric.distribution);
  }

  return card;
}
```

#### 4.2 Create Temperature Indicator
- [ ] Implement Hot/Warm/Cool visual indicator
- [ ] Use thermometer or gradient visualization
- [ ] Animate based on temperature level

```javascript
/**
 * Add temperature indicator to issue card
 */
function addTemperatureIndicator(card, temperature) {
  const indicator = document.createElement('div');
  indicator.className = `temperature-indicator temperature-indicator--${temperature.toLowerCase()}`;

  indicator.innerHTML = `
    <div class="temperature-indicator__bar"></div>
    <span class="temperature-indicator__label">${temperature}</span>
  `;

  card.querySelector('.pulse-card__body').appendChild(indicator);
}
```

#### 4.3 Create PR Funnel Visualization
- [ ] Implement funnel SVG showing opened → merged → closed flow
- [ ] Show conversion rates at each stage
- [ ] Animate funnel on load

```javascript
/**
 * Add funnel visualization to PR card
 */
function addFunnelVisualization(card, funnel) {
  const { opened, merged, closed, open } = funnel;

  const funnelEl = document.createElement('div');
  funnelEl.className = 'pr-funnel';

  const mergeRate = opened > 0 ? ((merged / opened) * 100).toFixed(0) : 0;

  funnelEl.innerHTML = `
    <div class="pr-funnel__stage pr-funnel__stage--opened">
      <span class="pr-funnel__count">${opened}</span>
      <span class="pr-funnel__label">Opened</span>
    </div>
    <div class="pr-funnel__arrow">→</div>
    <div class="pr-funnel__stage pr-funnel__stage--merged">
      <span class="pr-funnel__count">${merged}</span>
      <span class="pr-funnel__label">Merged</span>
    </div>
    <div class="pr-funnel__rate">${mergeRate}%</div>
  `;

  card.querySelector('.pulse-card__body').appendChild(funnelEl);
}
```

#### 4.4 Create Bus Factor Risk Display
- [ ] Implement contributor distribution bar chart
- [ ] Show top contributors with percentage
- [ ] Color-code risk level

```javascript
/**
 * Add contributor distribution to bus factor card
 */
function addContributorBars(card, distribution) {
  const barsEl = document.createElement('div');
  barsEl.className = 'bus-factor-bars';

  distribution.forEach((contributor, index) => {
    const bar = document.createElement('div');
    bar.className = 'bus-factor-bar';
    bar.style.width = `${contributor.percentage}%`;
    bar.style.opacity = 1 - (index * 0.15);
    bar.title = `${contributor.login}: ${contributor.percentage}%`;
    barsEl.appendChild(bar);
  });

  card.querySelector('.pulse-card__body').appendChild(barsEl);
}
```

#### 4.5 Create Freshness Gauge
- [ ] Implement circular or linear gauge for freshness
- [ ] Show days since last activity
- [ ] Color gradient from fresh (green) to stale (red)

```javascript
/**
 * Create freshness gauge visualization
 */
export function createFreshnessGauge(score, daysSincePush) {
  const gauge = document.createElement('div');
  gauge.className = 'freshness-gauge';

  const rotation = (score / 100) * 180; // 0-180 degrees

  gauge.innerHTML = `
    <svg viewBox="0 0 100 50" class="freshness-gauge__svg">
      <path class="freshness-gauge__track" d="M 10 45 A 35 35 0 0 1 90 45" />
      <path class="freshness-gauge__fill" d="M 10 45 A 35 35 0 0 1 90 45"
        style="stroke-dasharray: ${rotation * 1.1}, 180" />
    </svg>
    <div class="freshness-gauge__value">${score}</div>
    <div class="freshness-gauge__label">${daysSincePush}d</div>
  `;

  return gauge;
}
```

#### 4.6 Create Dashboard Container
- [ ] Create `src/js/components/PulseDashboard/index.js`
- [ ] Implement responsive grid layout for 6 cards
- [ ] Add overall pulse status header
- [ ] Include loading and error states

```javascript
/**
 * Create the complete pulse dashboard
 */
export function createPulseDashboard(pulseData) {
  const dashboard = document.createElement('div');
  dashboard.className = 'pulse-dashboard';

  const { metrics, overall } = pulseData;

  // Header with overall status
  const header = document.createElement('div');
  header.className = `pulse-dashboard__header pulse-dashboard__header--${overall.status}`;
  header.innerHTML = `
    <div class="pulse-dashboard__pulse" data-speed="${overall.pulseSpeed}">
      <span class="pulse-dashboard__pulse-dot"></span>
    </div>
    <h2 class="pulse-dashboard__title">Repository Pulse</h2>
    <span class="pulse-dashboard__status">${formatStatus(overall.status)}</span>
    ${overall.concerns > 0
      ? `<span class="pulse-dashboard__concerns">${overall.concerns} concerns</span>`
      : ''}
  `;
  dashboard.appendChild(header);

  // Metrics grid
  const grid = document.createElement('div');
  grid.className = 'pulse-dashboard__grid';

  // Add all six metric cards
  grid.appendChild(createMetricCard(metrics.velocity, 'standard'));
  grid.appendChild(createMetricCard(metrics.momentum, 'standard'));
  grid.appendChild(createMetricCard(metrics.issues, 'temperature'));
  grid.appendChild(createMetricCard(metrics.prs, 'funnel'));
  grid.appendChild(createMetricCard(metrics.busFactor, 'busFactor'));
  grid.appendChild(createMetricCard(metrics.freshness, 'freshness'));

  dashboard.appendChild(grid);

  // Summary insights
  if (overall.summary) {
    const summary = document.createElement('div');
    summary.className = 'pulse-dashboard__summary';
    summary.textContent = overall.summary;
    dashboard.appendChild(summary);
  }

  return dashboard;
}
```

### Deliverables
- `MetricCard.js` with multiple visualization variants
- `index.js` dashboard container component
- Temperature, funnel, gauge sub-components
- CSS styles for all dashboard elements

### Estimated Complexity: High

---

## Phase 5: Pulse Animation System

**Goal:** Create the heartbeat-like pulse animation that responds to repository activity.

### Tasks

#### 5.1 Implement CSS Pulse Animation
- [ ] Create keyframe animation for pulse dot
- [ ] Support three speeds (fast/normal/slow)
- [ ] Add ripple effect on pulse
- [ ] Respect prefers-reduced-motion

```css
/* Pulse animation styles */
.pulse-dashboard__pulse {
  position: relative;
  width: 24px;
  height: 24px;
}

.pulse-dashboard__pulse-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: pulse-beat var(--pulse-duration, 2s) ease-in-out infinite;
}

/* Speed variants */
[data-speed="fast"] { --pulse-duration: 1s; }
[data-speed="normal"] { --pulse-duration: 2s; }
[data-speed="slow"] { --pulse-duration: 4s; }

/* Status colors */
.pulse-dashboard__header--thriving .pulse-dashboard__pulse-dot {
  background: var(--color-success);
  box-shadow: 0 0 0 0 var(--color-success);
}

.pulse-dashboard__header--stable .pulse-dashboard__pulse-dot {
  background: var(--color-warning);
  box-shadow: 0 0 0 0 var(--color-warning);
}

.pulse-dashboard__header--cooling .pulse-dashboard__pulse-dot {
  background: var(--color-warning-dark);
  box-shadow: 0 0 0 0 var(--color-warning-dark);
}

.pulse-dashboard__header--at_risk .pulse-dashboard__pulse-dot {
  background: var(--color-error);
  box-shadow: 0 0 0 0 var(--color-error);
}

@keyframes pulse-beat {
  0% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 currentColor;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    box-shadow: 0 0 0 8px transparent;
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 0 currentColor;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .pulse-dashboard__pulse-dot {
    animation: none;
  }
}
```

#### 5.2 Add Card Status Animations
- [ ] Implement subtle glow for card status
- [ ] Add hover state animations
- [ ] Create entrance animations for cards

```css
/* Card status glow */
.pulse-card {
  transition: box-shadow 0.3s ease, transform 0.2s ease;
}

.pulse-card--thriving {
  box-shadow: 0 0 0 1px var(--color-success-subtle);
}

.pulse-card--at_risk {
  box-shadow: 0 0 0 1px var(--color-error-subtle);
  animation: attention-pulse 3s ease-in-out infinite;
}

@keyframes attention-pulse {
  0%, 100% { box-shadow: 0 0 0 1px var(--color-error-subtle); }
  50% { box-shadow: 0 0 8px 2px var(--color-error-subtle); }
}

/* Entrance animation */
.pulse-card {
  animation: card-enter 0.4s ease-out backwards;
}

.pulse-card:nth-child(1) { animation-delay: 0.05s; }
.pulse-card:nth-child(2) { animation-delay: 0.1s; }
.pulse-card:nth-child(3) { animation-delay: 0.15s; }
.pulse-card:nth-child(4) { animation-delay: 0.2s; }
.pulse-card:nth-child(5) { animation-delay: 0.25s; }
.pulse-card:nth-child(6) { animation-delay: 0.3s; }

@keyframes card-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### 5.3 Implement Sparkline Animations
- [ ] Add draw animation for sparkline paths
- [ ] Animate trend arrows
- [ ] Create smooth data updates

```css
/* Sparkline animation */
.sparkline path {
  stroke-dasharray: 200;
  stroke-dashoffset: 200;
  animation: sparkline-draw 1s ease-out forwards;
}

@keyframes sparkline-draw {
  to { stroke-dashoffset: 0; }
}

/* Trend arrow animation */
.trend-arrow--up .trend-arrow__icon {
  animation: arrow-bounce-up 0.6s ease-out;
}

.trend-arrow--down .trend-arrow__icon {
  animation: arrow-bounce-down 0.6s ease-out;
}

@keyframes arrow-bounce-up {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes arrow-bounce-down {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}
```

### Deliverables
- Complete CSS animation system
- Three pulse speed variants
- Card entrance and status animations
- Accessibility-compliant reduced motion support

### Estimated Complexity: Medium

---

## Phase 6: Integration & Polish

**Goal:** Integrate the dashboard into the detail page and add finishing touches.

### Tasks

#### 6.1 Update Detail Page HTML
- [ ] Add pulse dashboard container to `detail.html`
- [ ] Position between header and existing content
- [ ] Add loading skeleton placeholder

```html
<!-- Add to detail.html after repo header -->
<section id="pulse-dashboard-container" class="detail-section">
  <div class="pulse-dashboard-loading">
    <div class="pulse-dashboard-skeleton">
      <div class="skeleton-header"></div>
      <div class="skeleton-grid">
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
        <div class="skeleton-card"></div>
      </div>
    </div>
  </div>
</section>
```

#### 6.2 Update Detail Page Script
- [ ] Import pulse dashboard components
- [ ] Fetch pulse data after repo load
- [ ] Handle loading and error states
- [ ] Implement progressive enhancement

```javascript
// In detail.js
import { createPulseDashboard } from './components/PulseDashboard/index.js';
import { fetchPulseData } from './api.js';
import { calculateAllMetrics } from './components/PulseDashboard/PulseCalculator.js';

async function loadPulseDashboard(owner, repo) {
  const container = getRequiredElement('pulse-dashboard-container');

  try {
    // Show loading state
    container.classList.add('loading');

    // Fetch all required data
    const pulseData = await fetchPulseData(owner, repo);

    // Calculate metrics
    const metrics = calculateAllMetrics(pulseData);

    // Render dashboard
    container.innerHTML = '';
    container.appendChild(createPulseDashboard(metrics));
    container.classList.remove('loading');

  } catch (error) {
    console.error('Failed to load pulse dashboard:', error);
    container.innerHTML = `
      <div class="pulse-dashboard-error">
        <p>Unable to load pulse data</p>
        <button onclick="loadPulseDashboard('${owner}', '${repo}')">Retry</button>
      </div>
    `;
  }
}

// Call after repo loads
loadPulseDashboard(repoOwner, repoName);
```

#### 6.3 Add Dashboard CSS to Components
- [ ] Add all dashboard styles to `components.css`
- [ ] Implement responsive grid (2 cols on tablet, 1 on mobile)
- [ ] Ensure dark/light theme compatibility
- [ ] Add skeleton loading styles

```css
/* Dashboard layout */
.pulse-dashboard {
  background: var(--color-bg-secondary);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.pulse-dashboard__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 1024px) {
  .pulse-dashboard__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .pulse-dashboard__grid {
    grid-template-columns: 1fr;
  }
}

/* Metric card */
.pulse-card {
  background: var(--color-bg);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--color-border);
}

.pulse-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pulse-card__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin: 0;
}

.pulse-card__value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.pulse-card__body {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pulse-card__sparkline {
  flex: 1;
  min-width: 60px;
}

.pulse-card__footer {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
}
```

#### 6.4 Create Unit Tests
- [ ] Create `src/js/__tests__/PulseDashboard.test.js`
- [ ] Test all metric calculators
- [ ] Test edge cases (empty data, partial data)
- [ ] Test sparkline generation
- [ ] Test status determination logic

```javascript
// Test examples
describe('PulseCalculator', () => {
  describe('calculateVelocityScore', () => {
    it('returns default metric for empty participation data', () => {
      const result = calculateVelocityScore(null);
      expect(result.status).toBe('stable');
      expect(result.value).toBe(0);
    });

    it('calculates correct trend for increasing activity', () => {
      const participation = {
        all: [...Array(12).fill(5), ...Array(4).fill(10)]
      };
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('up');
      expect(result.trend).toBeGreaterThan(0);
    });

    it('calculates correct trend for declining activity', () => {
      const participation = {
        all: [...Array(12).fill(10), ...Array(4).fill(2)]
      };
      const result = calculateVelocityScore(participation);
      expect(result.direction).toBe('down');
      expect(result.trend).toBeLessThan(0);
    });
  });

  describe('calculateBusFactor', () => {
    it('identifies high-risk single contributor dominance', () => {
      const contributors = [
        { total: 950, author: { login: 'main-dev' }},
        { total: 50, author: { login: 'other' }}
      ];
      const result = calculateBusFactor(contributors);
      expect(result.value).toBe(1);
      expect(result.riskLevel).toBe('Critical');
    });
  });
});
```

#### 6.5 Documentation & Polish
- [ ] Add JSDoc comments to all public functions
- [ ] Update CLAUDE.md with pulse dashboard section
- [ ] Add tooltips explaining each metric
- [ ] Create helpful empty states

```javascript
/**
 * Generate helpful empty state messages
 */
function getEmptyStateMessage(metricType) {
  const messages = {
    velocity: 'No commit data available. This repo may be new or private.',
    momentum: 'Star history requires extended API access.',
    issues: 'No issues found in the last 30 days.',
    prs: 'No pull requests found in the last 30 days.',
    busFactor: 'Contributor data is still being computed.',
    freshness: 'Unable to determine freshness metrics.'
  };
  return messages[metricType] || 'Data unavailable';
}
```

### Deliverables
- Fully integrated pulse dashboard on detail page
- Responsive CSS with theme support
- Comprehensive test coverage
- Updated documentation

### Estimated Complexity: Medium

---

## Technical Specifications

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Dependencies
- No external libraries (vanilla JS + SVG)
- Uses existing `api.js` infrastructure

### Performance Targets

| Metric | Target |
|--------|--------|
| Data fetch (parallel) | < 2s |
| Calculation time | < 100ms |
| Initial render | < 50ms |
| Animation FPS | 60fps |
| Memory overhead | < 500KB |

### API Rate Limits Consideration

| Endpoint | Calls Needed | Notes |
|----------|--------------|-------|
| stats/participation | 1 | May return 202 |
| stats/contributors | 1 | May return 202 |
| issues | 1-3 | Paginated |
| pulls | 1-3 | Paginated |
| releases | 1 | Usually small |
| events | 1 | For star velocity |

**Total: 6-10 API calls per dashboard load**

---

## File Structure

```
src/js/components/PulseDashboard/
├── index.js              # Main dashboard component export
├── PulseCalculator.js    # All metric calculation functions
├── MetricCard.js         # Individual metric card component
├── Sparkline.js          # Sparkline SVG generator
├── TrendArrow.js         # Trend indicator component
├── visualizations.js     # Temperature, funnel, gauge helpers
└── constants.js          # Thresholds, colors, labels

src/js/__tests__/
└── PulseDashboard.test.js  # Comprehensive tests

src/css/
└── components.css        # Dashboard styles (appended)
```

---

## Testing Strategy

### Unit Tests

| Module | Test Focus |
|--------|------------|
| PulseCalculator | Metric calculations, edge cases, trends |
| Sparkline | SVG generation, data normalization |
| MetricCard | Rendering, status colors |
| Overall | Status aggregation, insights |

### Integration Tests
- Dashboard renders in detail page
- Data fetching handles errors gracefully
- Loading states display correctly
- Theme switching works

### Visual Tests
- Screenshot comparisons for different statuses
- Responsive layout at breakpoints
- Animation smoothness

### Target Coverage
- PulseCalculator: 95%
- Sparkline: 90%
- Overall: 85%

---

## Implementation Summary

| Phase | Focus | Complexity |
|-------|-------|------------|
| 1 | Data Collection & API Layer | Medium |
| 2 | Metrics Calculation Engine | High |
| 3 | Sparkline Visualization | Medium |
| 4 | Dashboard UI Components | High |
| 5 | Pulse Animation System | Medium |
| 6 | Integration & Polish | Medium |

---

## Success Criteria

1. **Accuracy**: Metrics correctly calculated from GitHub data
2. **Performance**: Dashboard loads within 3 seconds
3. **Responsiveness**: Works on all screen sizes
4. **Accessibility**: Screen reader compatible, reduced motion support
5. **Reliability**: Graceful handling of missing/incomplete data
6. **Clarity**: Users understand what each metric means

---

## Future Enhancements (Post-MVP)

- **Historical Trends**: Track pulse changes over time
- **Pulse Alerts**: Notify when status changes
- **Comparison Mode**: Compare pulse between two repos
- **Custom Thresholds**: User-adjustable metric weights
- **Export Report**: Generate PDF pulse report
- **Dependency Health**: Integrate with dependency vulnerability data
- **Community Sentiment**: Analyze issue/PR sentiment

---

*Document created by Claude Code - December 30, 2025*
