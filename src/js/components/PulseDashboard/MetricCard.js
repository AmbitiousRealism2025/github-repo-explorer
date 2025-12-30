/**
 * MetricCard Component
 * Individual metric card for the Pulse Dashboard with support for 5 variants:
 * standard, temperature, funnel, busFactor, and freshness
 *
 * @example
 * import { createMetricCard } from './components/PulseDashboard/MetricCard.js';
 *
 * // Standard metric card
 * const card = createMetricCard({
 *   title: 'Commit Velocity',
 *   value: 45,
 *   unit: 'commits/week',
 *   trend: 12.5,
 *   sparklineData: [10, 15, 20, 25, 30, 35, 40, 45],
 *   status: 'thriving'
 * }, 'standard');
 *
 * // Temperature card for issue health
 * const tempCard = createMetricCard({
 *   title: 'Issue Health',
 *   temperature: 'hot',
 *   status: 'at_risk'
 * }, 'temperature');
 *
 * @module components/PulseDashboard/MetricCard
 */

import { formatNumber, escapeHtml } from '../../common.js';
import { createSparkline } from './Sparkline.js';
import { createTrendArrow } from './TrendArrow.js';
import {
  createTemperatureIndicator,
  createPRFunnel,
  createContributorBars,
  createFreshnessGauge
} from './visualizations.js';

/**
 * Status configuration for card styling
 */
const STATUS_CONFIG = {
  thriving: { label: 'Thriving', icon: '🟢', modifier: 'pulse-card--thriving' },
  stable: { label: 'Stable', icon: '🟡', modifier: 'pulse-card--stable' },
  cooling: { label: 'Cooling', icon: '🟠', modifier: 'pulse-card--cooling' },
  at_risk: { label: 'At Risk', icon: '🔴', modifier: 'pulse-card--at_risk' }
};

/**
 * Default status for unknown/invalid status values
 */
const DEFAULT_STATUS = { label: 'Unknown', icon: '⚪', modifier: '' };

/**
 * Get status configuration with fallback
 * @param {string} status - Status key
 * @returns {Object} Status configuration
 */
const getStatusConfig = (status) => {
  return STATUS_CONFIG[status] || DEFAULT_STATUS;
};

/**
 * Create status icon element
 * @param {string} status - Status key
 * @returns {HTMLElement} Status icon span
 */
const createStatusIcon = (status) => {
  const config = getStatusConfig(status);
  const icon = document.createElement('span');
  icon.className = 'pulse-card__status-icon';
  icon.textContent = config.icon;
  icon.setAttribute('aria-label', config.label);
  return icon;
};

/**
 * Create card header with title and status
 * @param {string} title - Card title
 * @param {string} status - Status key
 * @returns {HTMLElement} Header element
 */
const createCardHeader = (title, status) => {
  const header = document.createElement('div');
  header.className = 'pulse-card__header';

  const titleEl = document.createElement('h3');
  titleEl.className = 'pulse-card__title';
  titleEl.textContent = title || 'Metric';

  const statusIcon = createStatusIcon(status);

  header.appendChild(titleEl);
  header.appendChild(statusIcon);

  return header;
};

/**
 * Create card footer with label/description
 * @param {string} label - Footer label text
 * @returns {HTMLElement} Footer element
 */
const createCardFooter = (label) => {
  const footer = document.createElement('div');
  footer.className = 'pulse-card__footer';

  const labelEl = document.createElement('span');
  labelEl.className = 'pulse-card__label';
  labelEl.textContent = label || '';

  footer.appendChild(labelEl);

  return footer;
};

/**
 * Create standard metric card body with value, trend, and sparkline
 * @param {Object} metric - Metric data
 * @returns {HTMLElement} Body element
 */
const createStandardBody = (metric) => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--standard';

  // Main value display
  const valueContainer = document.createElement('div');
  valueContainer.className = 'pulse-card__value-container';

  const valueEl = document.createElement('span');
  valueEl.className = 'pulse-card__value';
  valueEl.textContent = formatMetricValue(metric.value);

  if (metric.unit) {
    const unitEl = document.createElement('span');
    unitEl.className = 'pulse-card__unit';
    unitEl.textContent = metric.unit;
    valueContainer.appendChild(valueEl);
    valueContainer.appendChild(unitEl);
  } else {
    valueContainer.appendChild(valueEl);
  }

  // Trend arrow
  const trendContainer = document.createElement('div');
  trendContainer.className = 'pulse-card__trend';
  const trendArrow = createTrendArrow(metric.trend);
  trendContainer.appendChild(trendArrow);

  // Sparkline
  const sparklineContainer = document.createElement('div');
  sparklineContainer.className = 'pulse-card__sparkline';
  const sparkline = createSparkline(metric.sparklineData);
  sparklineContainer.appendChild(sparkline);

  body.appendChild(valueContainer);
  body.appendChild(trendContainer);
  body.appendChild(sparklineContainer);

  return body;
};

/**
 * Create temperature variant card body
 * @param {Object} metric - Metric data with temperature property
 * @returns {HTMLElement} Body element
 */
const createTemperatureBody = (metric) => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--temperature';

  const tempIndicator = createTemperatureIndicator(metric.temperature);
  body.appendChild(tempIndicator);

  // Add trend if available
  if (typeof metric.trend === 'number') {
    const trendContainer = document.createElement('div');
    trendContainer.className = 'pulse-card__trend';
    const trendArrow = createTrendArrow(metric.trend);
    trendContainer.appendChild(trendArrow);
    body.appendChild(trendContainer);
  }

  return body;
};

/**
 * Create PR funnel variant card body
 * @param {Object} metric - Metric data with funnel property
 * @returns {HTMLElement} Body element
 */
const createFunnelBody = (metric) => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--funnel';

  const funnel = createPRFunnel(metric.funnel);
  body.appendChild(funnel);

  return body;
};

/**
 * Create bus factor variant card body
 * @param {Object} metric - Metric data with distribution property
 * @returns {HTMLElement} Body element
 */
const createBusFactorBody = (metric) => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--bus-factor';

  const bars = createContributorBars(metric.distribution);
  body.appendChild(bars);

  return body;
};

/**
 * Create freshness variant card body
 * @param {Object} metric - Metric data with score and daysSincePush
 * @returns {HTMLElement} Body element
 */
const createFreshnessBody = (metric) => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--freshness';

  const gauge = createFreshnessGauge(metric.score, metric.daysSincePush);
  body.appendChild(gauge);

  return body;
};

/**
 * Create empty/unavailable state body
 * @returns {HTMLElement} Body element with unavailable message
 */
const createUnavailableBody = () => {
  const body = document.createElement('div');
  body.className = 'pulse-card__body pulse-card__body--unavailable';

  const message = document.createElement('span');
  message.className = 'pulse-card__unavailable-message';
  message.textContent = 'Data unavailable';

  body.appendChild(message);

  return body;
};

/**
 * Format metric value for display
 * Handles large numbers and null/undefined values
 * @param {number | null} value - Raw metric value
 * @returns {string} Formatted value string
 */
const formatMetricValue = (value) => {
  if (value === null || value === undefined) {
    return '--';
  }

  if (typeof value !== 'number' || isNaN(value)) {
    return '--';
  }

  return formatNumber(value);
};

/**
 * Validate metric data for a given card type
 * @param {Object} metric - Metric data
 * @param {string} type - Card type
 * @returns {boolean} Whether metric has required data
 */
const isValidMetric = (metric, type) => {
  if (!metric || typeof metric !== 'object') {
    return false;
  }

  switch (type) {
    case 'standard':
      return metric.value !== undefined || metric.sparklineData;
    case 'temperature':
      return metric.temperature !== undefined;
    case 'funnel':
      return metric.funnel !== undefined;
    case 'busFactor':
      return metric.distribution !== undefined;
    case 'freshness':
      return metric.score !== undefined || metric.daysSincePush !== undefined;
    default:
      return true;
  }
};

/**
 * Create body content based on card type
 * @param {Object} metric - Metric data
 * @param {string} type - Card type
 * @returns {HTMLElement} Body element
 */
const createBodyByType = (metric, type) => {
  // Check if metric has valid data
  if (!isValidMetric(metric, type)) {
    return createUnavailableBody();
  }

  switch (type) {
    case 'temperature':
      return createTemperatureBody(metric);
    case 'funnel':
      return createFunnelBody(metric);
    case 'busFactor':
      return createBusFactorBody(metric);
    case 'freshness':
      return createFreshnessBody(metric);
    case 'standard':
    default:
      return createStandardBody(metric);
  }
};

/**
 * Create a metric card for the Pulse Dashboard
 * @param {Object} metric - Metric data
 * @param {string} [metric.title] - Card title
 * @param {string} [metric.status] - Status key (thriving, stable, cooling, at_risk)
 * @param {string} [metric.label] - Footer label
 * @param {number} [metric.value] - Main value (for standard type)
 * @param {string} [metric.unit] - Value unit (for standard type)
 * @param {number} [metric.trend] - Trend percentage (for standard type)
 * @param {number[]} [metric.sparklineData] - Sparkline data (for standard type)
 * @param {string} [metric.temperature] - Temperature level (for temperature type)
 * @param {Object} [metric.funnel] - PR funnel data (for funnel type)
 * @param {Array} [metric.distribution] - Contributor distribution (for busFactor type)
 * @param {number} [metric.score] - Freshness score (for freshness type)
 * @param {number} [metric.daysSincePush] - Days since push (for freshness type)
 * @param {string} [type='standard'] - Card type: 'standard' | 'temperature' | 'funnel' | 'busFactor' | 'freshness'
 * @returns {HTMLElement} Metric card element
 */
export const createMetricCard = (metric, type = 'standard') => {
  const container = document.createElement('article');
  container.className = 'pulse-card';

  // Handle null/undefined metric
  const safeMetric = metric || {};

  // Apply status modifier
  const statusConfig = getStatusConfig(safeMetric.status);
  if (statusConfig.modifier) {
    container.classList.add(statusConfig.modifier);
  }

  // Apply type modifier
  container.classList.add(`pulse-card--${type}`);

  // Set accessibility attributes
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', `${safeMetric.title || 'Metric'} - ${statusConfig.label}`);

  // Create card structure
  const header = createCardHeader(safeMetric.title, safeMetric.status);
  const body = createBodyByType(safeMetric, type);
  const footer = createCardFooter(safeMetric.label);

  container.appendChild(header);
  container.appendChild(body);
  container.appendChild(footer);

  return container;
};

/**
 * Create a compact metric card (smaller variant for dense layouts)
 * @param {Object} metric - Metric data
 * @param {string} [type='standard'] - Card type
 * @returns {HTMLElement} Compact metric card element
 */
export const createCompactMetricCard = (metric, type = 'standard') => {
  const card = createMetricCard(metric, type);
  card.classList.add('pulse-card--compact');
  return card;
};

/**
 * Create a metric card skeleton for loading state
 * @returns {HTMLElement} Skeleton card element
 */
export const createMetricCardSkeleton = () => {
  const container = document.createElement('article');
  container.className = 'pulse-card pulse-card--skeleton';
  container.setAttribute('aria-hidden', 'true');

  container.innerHTML = `
    <div class="pulse-card__header">
      <div class="pulse-card__skeleton-line pulse-card__skeleton-line--title"></div>
      <div class="pulse-card__skeleton-circle"></div>
    </div>
    <div class="pulse-card__body">
      <div class="pulse-card__skeleton-line pulse-card__skeleton-line--value"></div>
      <div class="pulse-card__skeleton-line pulse-card__skeleton-line--trend"></div>
      <div class="pulse-card__skeleton-line pulse-card__skeleton-line--sparkline"></div>
    </div>
    <div class="pulse-card__footer">
      <div class="pulse-card__skeleton-line pulse-card__skeleton-line--label"></div>
    </div>
  `;

  return container;
};

export default createMetricCard;
