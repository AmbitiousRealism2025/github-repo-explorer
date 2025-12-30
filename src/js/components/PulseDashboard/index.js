/**
 * PulseDashboard Component
 * Main dashboard container for displaying repository vital signs
 *
 * @example
 * import { createPulseDashboard, createPulseDashboardSkeleton, createPulseDashboardError } from './components/PulseDashboard';
 *
 * // Create dashboard with pulse data
 * const dashboard = createPulseDashboard(pulseData);
 * container.appendChild(dashboard);
 *
 * // Loading state
 * const skeleton = createPulseDashboardSkeleton();
 * container.appendChild(skeleton);
 *
 * // Error state with retry
 * const error = createPulseDashboardError(() => loadData());
 * container.appendChild(error);
 *
 * @module components/PulseDashboard
 */

import { escapeHtml } from '../../common.js';
import { createMetricCard, createMetricCardSkeleton } from './MetricCard.js';

// Re-export all sub-components
export { createSparkline, createMiniSparkline, calculateTrend } from './Sparkline.js';
export { createTrendArrow, createMiniTrendArrow, getTrendDirection, formatPercentage } from './TrendArrow.js';
export {
  createTemperatureIndicator,
  getTemperatureLevel,
  createPRFunnel,
  createContributorBars,
  getBusFactorRisk,
  createFreshnessGauge,
  getFreshnessLevel,
  calculateFreshnessScore
} from './visualizations.js';
export { createMetricCard, createCompactMetricCard, createMetricCardSkeleton } from './MetricCard.js';

/**
 * Dashboard status configuration
 */
const DASHBOARD_STATUS = {
  thriving: { label: 'Thriving', icon: '🟢', description: 'Repository is highly active and healthy' },
  stable: { label: 'Stable', icon: '🟡', description: 'Repository shows consistent activity' },
  cooling: { label: 'Cooling', icon: '🟠', description: 'Repository activity is declining' },
  at_risk: { label: 'At Risk', icon: '🔴', description: 'Repository may be dying or unmaintained' }
};

/**
 * Default status for unknown values
 */
const DEFAULT_STATUS = { label: 'Unknown', icon: '⚪', description: 'Unable to determine status' };

/**
 * Metric card configurations for the 6 vital signs
 */
const METRIC_CONFIGS = [
  {
    key: 'commitVelocity',
    type: 'standard',
    title: 'Commit Velocity',
    unit: 'commits/week',
    label: 'Last 90 days'
  },
  {
    key: 'issueHealth',
    type: 'temperature',
    title: 'Issue Health',
    label: 'Open vs Closed ratio'
  },
  {
    key: 'prHealth',
    type: 'funnel',
    title: 'PR Health',
    label: 'Pull request flow'
  },
  {
    key: 'busFactor',
    type: 'busFactor',
    title: 'Bus Factor',
    label: 'Contributor concentration'
  },
  {
    key: 'releaseFreshness',
    type: 'freshness',
    title: 'Release Freshness',
    label: 'Last update'
  },
  {
    key: 'communityHealth',
    type: 'standard',
    title: 'Community Health',
    unit: 'engagement score',
    label: 'Stars, forks, and watchers'
  }
];

/**
 * Get status configuration with fallback
 * @param {string} status - Status key
 * @returns {Object} Status configuration
 */
const getStatusConfig = (status) => {
  return DASHBOARD_STATUS[status] || DEFAULT_STATUS;
};

/**
 * Calculate overall status from individual metric statuses
 * @param {Object} pulseData - Pulse data object
 * @returns {string} Overall status key
 */
const calculateOverallStatus = (pulseData) => {
  if (!pulseData || typeof pulseData !== 'object') {
    return 'stable';
  }

  // If overall status is explicitly provided, use it
  if (pulseData.overallStatus && DASHBOARD_STATUS[pulseData.overallStatus]) {
    return pulseData.overallStatus;
  }

  // Otherwise, calculate from individual metrics
  const statuses = METRIC_CONFIGS.map(config => {
    const metric = pulseData[config.key];
    return metric?.status;
  }).filter(Boolean);

  if (statuses.length === 0) return 'stable';

  // Count statuses
  const counts = {
    thriving: statuses.filter(s => s === 'thriving').length,
    stable: statuses.filter(s => s === 'stable').length,
    cooling: statuses.filter(s => s === 'cooling').length,
    at_risk: statuses.filter(s => s === 'at_risk').length
  };

  // Determine overall status based on worst case with threshold
  if (counts.at_risk >= 2) return 'at_risk';
  if (counts.cooling >= 3 || counts.at_risk >= 1) return 'cooling';
  if (counts.thriving >= 4) return 'thriving';
  return 'stable';
};

/**
 * Create dashboard header with overall status
 * @param {string} status - Overall status key
 * @param {string} repoName - Repository name (optional)
 * @returns {HTMLElement} Header element
 */
const createDashboardHeader = (status, repoName = null) => {
  const config = getStatusConfig(status);

  const header = document.createElement('header');
  header.className = 'pulse-dashboard__header';

  const titleSection = document.createElement('div');
  titleSection.className = 'pulse-dashboard__title-section';

  const title = document.createElement('h2');
  title.className = 'pulse-dashboard__title';
  title.textContent = 'Repository Pulse';

  if (repoName) {
    const subtitle = document.createElement('span');
    subtitle.className = 'pulse-dashboard__subtitle';
    subtitle.textContent = repoName;
    titleSection.appendChild(title);
    titleSection.appendChild(subtitle);
  } else {
    titleSection.appendChild(title);
  }

  const statusSection = document.createElement('div');
  statusSection.className = 'pulse-dashboard__status';
  statusSection.setAttribute('role', 'status');
  statusSection.setAttribute('aria-live', 'polite');

  const statusIcon = document.createElement('span');
  statusIcon.className = 'pulse-dashboard__status-icon';
  statusIcon.textContent = config.icon;
  statusIcon.setAttribute('aria-hidden', 'true');

  const statusText = document.createElement('div');
  statusText.className = 'pulse-dashboard__status-text';

  const statusLabel = document.createElement('span');
  statusLabel.className = 'pulse-dashboard__status-label';
  statusLabel.textContent = config.label;

  const statusDesc = document.createElement('span');
  statusDesc.className = 'pulse-dashboard__status-description';
  statusDesc.textContent = config.description;

  statusText.appendChild(statusLabel);
  statusText.appendChild(statusDesc);

  statusSection.appendChild(statusIcon);
  statusSection.appendChild(statusText);

  header.appendChild(titleSection);
  header.appendChild(statusSection);

  return header;
};

/**
 * Create a metric card from pulse data for a specific metric
 * @param {Object} metricData - Data for the specific metric
 * @param {Object} config - Metric configuration
 * @returns {HTMLElement} Metric card element
 */
const createMetricFromData = (metricData, config) => {
  if (!metricData || typeof metricData !== 'object') {
    return createMetricCard({
      title: config.title,
      label: config.label,
      status: 'stable'
    }, config.type);
  }

  const cardData = {
    title: config.title,
    label: config.label,
    status: metricData.status || 'stable'
  };

  // Add type-specific data
  switch (config.type) {
    case 'standard':
      cardData.value = metricData.value;
      cardData.unit = config.unit;
      cardData.trend = metricData.trend;
      cardData.sparklineData = metricData.sparklineData || metricData.history;
      break;
    case 'temperature':
      cardData.temperature = metricData.temperature;
      cardData.trend = metricData.trend;
      break;
    case 'funnel':
      cardData.funnel = metricData.funnel;
      break;
    case 'busFactor':
      cardData.distribution = metricData.distribution;
      break;
    case 'freshness':
      cardData.score = metricData.score;
      cardData.daysSincePush = metricData.daysSincePush;
      break;
  }

  return createMetricCard(cardData, config.type);
};

/**
 * Create the metric cards grid
 * @param {Object} pulseData - Pulse data object
 * @returns {HTMLElement} Grid container with metric cards
 */
const createMetricGrid = (pulseData) => {
  const grid = document.createElement('div');
  grid.className = 'pulse-dashboard__grid';
  grid.setAttribute('role', 'list');
  grid.setAttribute('aria-label', 'Repository vital signs');

  METRIC_CONFIGS.forEach(config => {
    const metricData = pulseData ? pulseData[config.key] : null;
    const card = createMetricFromData(metricData, config);
    card.setAttribute('role', 'listitem');
    grid.appendChild(card);
  });

  return grid;
};

/**
 * Create the complete Pulse Dashboard component
 * @param {Object} pulseData - Pulse data containing all 6 metrics
 * @param {Object} pulseData.commitVelocity - Commit velocity metric data
 * @param {Object} pulseData.issueHealth - Issue health metric data
 * @param {Object} pulseData.prHealth - PR health metric data
 * @param {Object} pulseData.busFactor - Bus factor metric data
 * @param {Object} pulseData.releaseFreshness - Release freshness metric data
 * @param {Object} pulseData.communityHealth - Community health metric data
 * @param {string} [pulseData.overallStatus] - Optional overall status override
 * @param {string} [pulseData.repoName] - Optional repository name for display
 * @returns {HTMLElement} Dashboard container element
 */
export const createPulseDashboard = (pulseData = {}) => {
  const container = document.createElement('section');
  container.className = 'pulse-dashboard';
  container.setAttribute('aria-label', 'Repository Pulse Dashboard');

  // Handle null/undefined pulseData
  const safeData = pulseData || {};

  // Calculate overall status
  const overallStatus = calculateOverallStatus(safeData);
  container.dataset.status = overallStatus;

  // Create header
  const header = createDashboardHeader(overallStatus, safeData.repoName);
  container.appendChild(header);

  // Create metric cards grid
  const grid = createMetricGrid(safeData);
  container.appendChild(grid);

  return container;
};

/**
 * Create a skeleton loading state for the dashboard
 * @returns {HTMLElement} Skeleton dashboard element
 */
export const createPulseDashboardSkeleton = () => {
  const container = document.createElement('section');
  container.className = 'pulse-dashboard pulse-dashboard--loading';
  container.setAttribute('aria-label', 'Loading Repository Pulse Dashboard');
  container.setAttribute('aria-busy', 'true');

  // Skeleton header
  const header = document.createElement('header');
  header.className = 'pulse-dashboard__header pulse-dashboard__header--skeleton';
  header.setAttribute('aria-hidden', 'true');

  const titleSkeleton = document.createElement('div');
  titleSkeleton.className = 'pulse-dashboard__skeleton-line pulse-dashboard__skeleton-line--title';

  const statusSkeleton = document.createElement('div');
  statusSkeleton.className = 'pulse-dashboard__skeleton-line pulse-dashboard__skeleton-line--status';

  header.appendChild(titleSkeleton);
  header.appendChild(statusSkeleton);
  container.appendChild(header);

  // Skeleton grid with 6 cards
  const grid = document.createElement('div');
  grid.className = 'pulse-dashboard__grid';
  grid.setAttribute('aria-hidden', 'true');

  for (let i = 0; i < 6; i++) {
    const skeleton = createMetricCardSkeleton();
    grid.appendChild(skeleton);
  }

  container.appendChild(grid);

  return container;
};

/**
 * Create an error state for the dashboard with retry button
 * @param {Function} onRetry - Callback function to retry loading
 * @returns {HTMLElement} Error state element
 */
export const createPulseDashboardError = (onRetry) => {
  const container = document.createElement('section');
  container.className = 'pulse-dashboard pulse-dashboard--error';
  container.setAttribute('aria-label', 'Repository Pulse Dashboard - Error');
  container.setAttribute('role', 'alert');

  const errorContent = document.createElement('div');
  errorContent.className = 'pulse-dashboard__error-content';

  // Error icon
  const icon = document.createElement('span');
  icon.className = 'pulse-dashboard__error-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = '⚠️';

  // Error message
  const message = document.createElement('p');
  message.className = 'pulse-dashboard__error-message';
  message.textContent = 'Unable to load repository pulse data';

  // Error description
  const description = document.createElement('p');
  description.className = 'pulse-dashboard__error-description';
  description.textContent = 'There was a problem fetching the repository metrics. Please try again.';

  // Retry button
  const retryButton = document.createElement('button');
  retryButton.className = 'pulse-dashboard__retry-btn';
  retryButton.type = 'button';
  retryButton.textContent = 'Retry';
  retryButton.setAttribute('aria-label', 'Retry loading pulse data');

  if (typeof onRetry === 'function') {
    retryButton.addEventListener('click', onRetry);
  }

  errorContent.appendChild(icon);
  errorContent.appendChild(message);
  errorContent.appendChild(description);
  errorContent.appendChild(retryButton);

  container.appendChild(errorContent);

  return container;
};

export default createPulseDashboard;
