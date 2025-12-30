/**
 * Specialized Visualizations for Pulse Dashboard
 * Contains temperature indicator, PR funnel, contributor bars, and freshness gauge
 *
 * @example
 * import { createTemperatureIndicator, createPRFunnel, createContributorBars, createFreshnessGauge } from './visualizations.js';
 *
 * // Temperature indicator for issue health
 * const temp = createTemperatureIndicator('hot'); // 'hot' | 'warm' | 'cool'
 *
 * // PR funnel showing opened → merged → closed flow
 * const funnel = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
 *
 * // Contributor distribution bars
 * const bars = createContributorBars([
 *   { login: 'user1', percentage: 45 },
 *   { login: 'user2', percentage: 30 }
 * ]);
 *
 * // Freshness gauge with score and days
 * const gauge = createFreshnessGauge(85, 3);
 *
 * @module components/PulseDashboard/visualizations
 */

import { escapeHtml } from '../../common.js';

// =============================================================================
// Temperature Indicator
// =============================================================================

/**
 * Temperature levels for issue health classification
 */
const TEMPERATURE_LEVELS = {
  hot: { label: 'Hot', colorClass: 'temperature-indicator--hot', fillPercent: 100 },
  warm: { label: 'Warm', colorClass: 'temperature-indicator--warm', fillPercent: 60 },
  cool: { label: 'Cool', colorClass: 'temperature-indicator--cool', fillPercent: 30 }
};

/**
 * Create a temperature indicator for issue health visualization
 * Shows a thermometer-style bar with Hot/Warm/Cool classification
 *
 * @param {string | null} temperature - Temperature level ('hot' | 'warm' | 'cool')
 * @returns {HTMLElement} Temperature indicator element
 */
export const createTemperatureIndicator = (temperature) => {
  const container = document.createElement('div');
  container.className = 'temperature-indicator';
  container.setAttribute('aria-hidden', 'true');

  // Handle null/invalid temperature
  const level = TEMPERATURE_LEVELS[temperature] || TEMPERATURE_LEVELS.cool;
  container.classList.add(level.colorClass);

  // Create thermometer bar
  const bar = document.createElement('div');
  bar.className = 'temperature-indicator__bar';

  const fill = document.createElement('div');
  fill.className = 'temperature-indicator__fill';
  fill.style.setProperty('--fill-percent', `${level.fillPercent}%`);
  bar.appendChild(fill);

  // Create label
  const label = document.createElement('span');
  label.className = 'temperature-indicator__label';
  label.textContent = level.label;

  // Create temperature markers
  const markers = document.createElement('div');
  markers.className = 'temperature-indicator__markers';
  markers.innerHTML = `
    <span class="temperature-indicator__marker temperature-indicator__marker--cool">Cool</span>
    <span class="temperature-indicator__marker temperature-indicator__marker--warm">Warm</span>
    <span class="temperature-indicator__marker temperature-indicator__marker--hot">Hot</span>
  `;

  container.appendChild(bar);
  container.appendChild(markers);

  return container;
};

/**
 * Get temperature level from numeric ratio/score
 * Useful for converting issue health ratios to temperature
 *
 * @param {number} ratio - Issue health ratio (0-1 or percentage)
 * @returns {'hot' | 'warm' | 'cool'} Temperature level
 */
export const getTemperatureLevel = (ratio) => {
  if (typeof ratio !== 'number' || isNaN(ratio)) return 'cool';

  // Normalize if percentage
  const normalized = ratio > 1 ? ratio / 100 : ratio;

  if (normalized >= 0.7) return 'hot';
  if (normalized >= 0.4) return 'warm';
  return 'cool';
};

// =============================================================================
// PR Funnel
// =============================================================================

/**
 * Default funnel stages configuration
 */
const FUNNEL_STAGES = [
  { key: 'opened', label: 'Opened', colorClass: 'pr-funnel__stage--opened' },
  { key: 'merged', label: 'Merged', colorClass: 'pr-funnel__stage--merged' },
  { key: 'closed', label: 'Closed', colorClass: 'pr-funnel__stage--closed' }
];

/**
 * Create a PR funnel visualization showing opened → merged → closed flow
 * Displays counts at each stage with merge rate percentage
 *
 * @param {Object | null} funnel - Funnel data
 * @param {number} [funnel.opened=0] - Number of opened PRs
 * @param {number} [funnel.merged=0] - Number of merged PRs
 * @param {number} [funnel.closed=0] - Number of closed (unmerged) PRs
 * @returns {HTMLElement} PR funnel element
 */
export const createPRFunnel = (funnel) => {
  const container = document.createElement('div');
  container.className = 'pr-funnel';
  container.setAttribute('aria-label', 'Pull request flow visualization');

  // Handle null/invalid data
  if (!funnel || typeof funnel !== 'object') {
    container.classList.add('pr-funnel--empty');
    const emptyMessage = document.createElement('span');
    emptyMessage.className = 'pr-funnel__empty';
    emptyMessage.textContent = 'No PR data';
    container.appendChild(emptyMessage);
    return container;
  }

  const opened = typeof funnel.opened === 'number' ? funnel.opened : 0;
  const merged = typeof funnel.merged === 'number' ? funnel.merged : 0;
  const closed = typeof funnel.closed === 'number' ? funnel.closed : 0;

  // Calculate merge rate
  const mergeRate = opened > 0 ? Math.round((merged / opened) * 100) : 0;
  const maxValue = Math.max(opened, merged, closed, 1);

  // Create stages container
  const stages = document.createElement('div');
  stages.className = 'pr-funnel__stages';

  FUNNEL_STAGES.forEach((stage, index) => {
    const value = { opened, merged, closed }[stage.key];
    const widthPercent = (value / maxValue) * 100;

    const stageEl = document.createElement('div');
    stageEl.className = `pr-funnel__stage ${stage.colorClass}`;

    const bar = document.createElement('div');
    bar.className = 'pr-funnel__bar';
    bar.style.setProperty('--bar-width', `${widthPercent}%`);

    const stageLabel = document.createElement('span');
    stageLabel.className = 'pr-funnel__label';
    stageLabel.textContent = stage.label;

    const stageValue = document.createElement('span');
    stageValue.className = 'pr-funnel__value';
    stageValue.textContent = formatCount(value);

    stageEl.appendChild(bar);
    stageEl.appendChild(stageLabel);
    stageEl.appendChild(stageValue);

    // Add arrow between stages (except last)
    if (index < FUNNEL_STAGES.length - 1) {
      const arrow = document.createElement('span');
      arrow.className = 'pr-funnel__arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '→';
      stageEl.appendChild(arrow);
    }

    stages.appendChild(stageEl);
  });

  // Create merge rate indicator
  const rateEl = document.createElement('div');
  rateEl.className = 'pr-funnel__rate';
  rateEl.innerHTML = `
    <span class="pr-funnel__rate-label">Merge Rate</span>
    <span class="pr-funnel__rate-value">${mergeRate}%</span>
  `;

  container.appendChild(stages);
  container.appendChild(rateEl);

  return container;
};

/**
 * Format count for display (abbreviate large numbers)
 * @param {number} count - Raw count
 * @returns {string} Formatted count
 */
const formatCount = (count) => {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1) + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1) + 'k';
  }
  return String(count);
};

// =============================================================================
// Contributor Bars
// =============================================================================

/**
 * Maximum number of contributors to display
 */
const MAX_CONTRIBUTORS = 5;

/**
 * Create horizontal bar chart showing contribution distribution among top contributors
 * Bars render proportionally with tooltips showing contributor login and percentage
 *
 * @param {Array<{login: string, percentage: number}> | null} distribution - Contributor data
 * @returns {HTMLElement} Contributor bars element
 */
export const createContributorBars = (distribution) => {
  const container = document.createElement('div');
  container.className = 'contributor-bars';
  container.setAttribute('role', 'list');
  container.setAttribute('aria-label', 'Contributor distribution');

  // Handle null/empty distribution
  if (!distribution || !Array.isArray(distribution) || distribution.length === 0) {
    container.classList.add('contributor-bars--empty');
    const emptyMessage = document.createElement('span');
    emptyMessage.className = 'contributor-bars__empty';
    emptyMessage.textContent = 'No contributor data';
    container.appendChild(emptyMessage);
    return container;
  }

  // Limit to top contributors
  const topContributors = distribution.slice(0, MAX_CONTRIBUTORS);

  // Find max percentage for relative bar sizing
  const maxPercentage = Math.max(...topContributors.map(c => c.percentage || 0), 1);

  topContributors.forEach((contributor, index) => {
    const { login = 'Unknown', percentage = 0 } = contributor;
    const relativeWidth = (percentage / maxPercentage) * 100;

    const row = document.createElement('div');
    row.className = 'contributor-bars__row';
    row.setAttribute('role', 'listitem');

    // Rank indicator
    const rank = document.createElement('span');
    rank.className = 'contributor-bars__rank';
    rank.textContent = `${index + 1}`;

    // Contributor name
    const name = document.createElement('span');
    name.className = 'contributor-bars__name';
    name.textContent = login;
    name.setAttribute('title', login);

    // Bar container
    const barContainer = document.createElement('div');
    barContainer.className = 'contributor-bars__bar-container';

    const bar = document.createElement('div');
    bar.className = 'contributor-bars__bar';
    bar.style.setProperty('--bar-width', `${relativeWidth}%`);

    // Apply risk color based on concentration (high % = higher risk)
    if (index === 0 && percentage > 50) {
      bar.classList.add('contributor-bars__bar--critical');
    } else if (index === 0 && percentage > 30) {
      bar.classList.add('contributor-bars__bar--warning');
    }

    barContainer.appendChild(bar);

    // Percentage value
    const value = document.createElement('span');
    value.className = 'contributor-bars__value';
    value.textContent = `${Math.round(percentage)}%`;

    row.appendChild(rank);
    row.appendChild(name);
    row.appendChild(barContainer);
    row.appendChild(value);

    container.appendChild(row);
  });

  // Add summary if there are more contributors
  if (distribution.length > MAX_CONTRIBUTORS) {
    const othersCount = distribution.length - MAX_CONTRIBUTORS;
    const othersPercentage = distribution
      .slice(MAX_CONTRIBUTORS)
      .reduce((sum, c) => sum + (c.percentage || 0), 0);

    const others = document.createElement('div');
    others.className = 'contributor-bars__others';
    others.textContent = `+${othersCount} others (${Math.round(othersPercentage)}%)`;
    container.appendChild(others);
  }

  return container;
};

/**
 * Calculate bus factor risk level from contribution distribution
 *
 * @param {Array<{login: string, percentage: number}> | null} distribution - Contributor data
 * @returns {'critical' | 'warning' | 'healthy'} Risk level
 */
export const getBusFactorRisk = (distribution) => {
  if (!distribution || !Array.isArray(distribution) || distribution.length === 0) {
    return 'critical';
  }

  const topContributor = distribution[0];
  if (!topContributor) return 'critical';

  const topPercentage = topContributor.percentage || 0;

  if (topPercentage > 50) return 'critical';
  if (topPercentage > 30) return 'warning';
  return 'healthy';
};

// =============================================================================
// Freshness Gauge
// =============================================================================

/**
 * Freshness classification thresholds (in days)
 */
const FRESHNESS_THRESHOLDS = {
  fresh: 7,     // Updated within 7 days
  recent: 30,   // Updated within 30 days
  aging: 90,    // Updated within 90 days
  stale: Infinity  // Older than 90 days
};

/**
 * Freshness labels and styling
 */
const FRESHNESS_LABELS = {
  fresh: { label: 'Fresh', colorClass: 'freshness-gauge--fresh' },
  recent: { label: 'Recent', colorClass: 'freshness-gauge--recent' },
  aging: { label: 'Aging', colorClass: 'freshness-gauge--aging' },
  stale: { label: 'Stale', colorClass: 'freshness-gauge--stale' }
};

/**
 * Create a freshness gauge visualization
 * Circular gauge showing freshness score (0-100) with days since push
 *
 * @param {number | null} score - Freshness score (0-100)
 * @param {number | null} daysSincePush - Days since last push
 * @returns {HTMLElement} Freshness gauge element
 */
export const createFreshnessGauge = (score, daysSincePush) => {
  const container = document.createElement('div');
  container.className = 'freshness-gauge';

  // Handle null/invalid values
  const validScore = typeof score === 'number' && !isNaN(score) ? Math.max(0, Math.min(100, score)) : 0;
  const validDays = typeof daysSincePush === 'number' && !isNaN(daysSincePush) ? Math.max(0, daysSincePush) : null;

  // Determine freshness level
  const level = getFreshnessLevel(validDays);
  const { label, colorClass } = FRESHNESS_LABELS[level];
  container.classList.add(colorClass);

  // Create SVG circular gauge
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 120 120');
  svg.setAttribute('class', 'freshness-gauge__svg');
  svg.setAttribute('aria-hidden', 'true');

  const strokeWidth = 10;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const fillLength = (validScore / 100) * circumference;

  // Background circle
  const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  bgCircle.setAttribute('cx', '60');
  bgCircle.setAttribute('cy', '60');
  bgCircle.setAttribute('r', String(radius));
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', 'var(--color-bg-tertiary)');
  bgCircle.setAttribute('stroke-width', String(strokeWidth));
  svg.appendChild(bgCircle);

  // Progress circle
  const progressCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  progressCircle.setAttribute('cx', '60');
  progressCircle.setAttribute('cy', '60');
  progressCircle.setAttribute('r', String(radius));
  progressCircle.setAttribute('fill', 'none');
  progressCircle.setAttribute('stroke', 'currentColor');
  progressCircle.setAttribute('stroke-width', String(strokeWidth));
  progressCircle.setAttribute('stroke-linecap', 'round');
  progressCircle.setAttribute('stroke-dasharray', `${fillLength.toFixed(2)} ${circumference.toFixed(2)}`);
  progressCircle.setAttribute('transform', 'rotate(-90 60 60)');
  progressCircle.setAttribute('class', 'freshness-gauge__progress');
  svg.appendChild(progressCircle);

  // Create gauge value display
  const valueContainer = document.createElement('div');
  valueContainer.className = 'freshness-gauge__value-container';

  const scoreEl = document.createElement('span');
  scoreEl.className = 'freshness-gauge__score';
  scoreEl.textContent = String(Math.round(validScore));

  const labelEl = document.createElement('span');
  labelEl.className = 'freshness-gauge__label';
  labelEl.textContent = label;

  valueContainer.appendChild(scoreEl);
  valueContainer.appendChild(labelEl);

  // Create gauge wrapper for positioning
  const gaugeWrapper = document.createElement('div');
  gaugeWrapper.className = 'freshness-gauge__wrapper';
  gaugeWrapper.appendChild(svg);
  gaugeWrapper.appendChild(valueContainer);

  // Create days indicator
  const daysEl = document.createElement('div');
  daysEl.className = 'freshness-gauge__days';
  if (validDays !== null) {
    daysEl.innerHTML = `
      <span class="freshness-gauge__days-value">${formatDays(validDays)}</span>
      <span class="freshness-gauge__days-label">since last push</span>
    `;
  } else {
    daysEl.innerHTML = `
      <span class="freshness-gauge__days-label">No release data</span>
    `;
  }

  container.appendChild(gaugeWrapper);
  container.appendChild(daysEl);

  // Set accessible attributes
  container.setAttribute('role', 'meter');
  container.setAttribute('aria-valuenow', String(Math.round(validScore)));
  container.setAttribute('aria-valuemin', '0');
  container.setAttribute('aria-valuemax', '100');
  container.setAttribute('aria-label', `Freshness score: ${Math.round(validScore)} out of 100, ${label}`);

  return container;
};

/**
 * Determine freshness level from days since push
 *
 * @param {number | null} days - Days since last push
 * @returns {'fresh' | 'recent' | 'aging' | 'stale'} Freshness level
 */
export const getFreshnessLevel = (days) => {
  if (days === null || typeof days !== 'number' || isNaN(days)) {
    return 'stale';
  }

  if (days <= FRESHNESS_THRESHOLDS.fresh) return 'fresh';
  if (days <= FRESHNESS_THRESHOLDS.recent) return 'recent';
  if (days <= FRESHNESS_THRESHOLDS.aging) return 'aging';
  return 'stale';
};

/**
 * Format days for display
 *
 * @param {number} days - Number of days
 * @returns {string} Formatted days string
 */
const formatDays = (days) => {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  if (days < 365) {
    const months = Math.floor(days / 30);
    return months === 1 ? '1 month' : `${months} months`;
  }
  const years = Math.floor(days / 365);
  return years === 1 ? '1 year' : `${years} years`;
};

/**
 * Calculate freshness score from days since push
 * Score decreases as days increase
 *
 * @param {number | null} days - Days since last push
 * @returns {number} Freshness score (0-100)
 */
export const calculateFreshnessScore = (days) => {
  if (days === null || typeof days !== 'number' || isNaN(days) || days < 0) {
    return 0;
  }

  // Fresh (0-7 days): 100-80
  if (days <= 7) {
    return 100 - (days / 7) * 20;
  }

  // Recent (8-30 days): 79-50
  if (days <= 30) {
    return 79 - ((days - 7) / 23) * 29;
  }

  // Aging (31-90 days): 49-20
  if (days <= 90) {
    return 49 - ((days - 30) / 60) * 29;
  }

  // Stale (90+ days): 19-0, asymptotically approaching 0
  const staleScore = 19 * Math.exp(-((days - 90) / 180));
  return Math.max(0, Math.round(staleScore));
};
