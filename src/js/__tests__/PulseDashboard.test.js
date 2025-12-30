import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSparkline, createMiniSparkline, calculateTrend } from '../components/PulseDashboard/Sparkline.js';
import { createTrendArrow, createMiniTrendArrow, getTrendDirection, formatPercentage } from '../components/PulseDashboard/TrendArrow.js';
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
  createPulseDashboardError
} from '../components/PulseDashboard/index.js';
import {
  average,
  daysSince,
  daysBetween,
  getTrendDirection as calculatorGetTrendDirection,
  getMetricStatus,
  getDefaultMetric,
  clamp,
  percentageChange,
  safeParseDate,
  emptySparkline,
  calculateVelocityScore,
  calculateCommunityMomentum,
  calculateIssueTemperature,
  calculatePRHealth,
  calculateBusFactor,
  calculateFreshnessIndex,
  calculateOverallPulse,
  calculateAllMetrics
} from '../components/PulseDashboard/PulseCalculator.js';

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

  describe('getTrendDirection', () => {
    it('should return up for positive values above threshold', () => {
      expect(getTrendDirection(5)).toBe('up');
      expect(getTrendDirection(100)).toBe('up');
    });

    it('should return down for negative values below threshold', () => {
      expect(getTrendDirection(-5)).toBe('down');
      expect(getTrendDirection(-100)).toBe('down');
    });

    it('should return stable for values near zero', () => {
      expect(getTrendDirection(0)).toBe('stable');
      expect(getTrendDirection(0.5)).toBe('stable');
      expect(getTrendDirection(-0.5)).toBe('stable');
      expect(getTrendDirection(1)).toBe('stable');
      expect(getTrendDirection(-1)).toBe('stable');
    });

    it('should return stable for NaN', () => {
      expect(getTrendDirection(NaN)).toBe('stable');
    });

    it('should return stable for non-number types', () => {
      expect(getTrendDirection('15')).toBe('stable');
      expect(getTrendDirection(null)).toBe('stable');
      expect(getTrendDirection(undefined)).toBe('stable');
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
      expect(formatPercentage(0.5, 'stable')).toBe('0.5%');
    });

    it('should clamp to 999%', () => {
      expect(formatPercentage(1500, 'up')).toBe('+999%');
      expect(formatPercentage(-2000, 'down')).toBe('-999%');
    });

    it('should remove trailing .0', () => {
      expect(formatPercentage(25, 'up')).toBe('+25%');
      expect(formatPercentage(10, 'down')).toBe('-10%');
    });

    it('should handle NaN gracefully', () => {
      expect(formatPercentage(NaN, 'stable')).toBe('0%');
    });

    it('should handle non-numbers gracefully', () => {
      expect(formatPercentage('invalid', 'stable')).toBe('0%');
      expect(formatPercentage(null, 'stable')).toBe('0%');
    });
  });
});

// =============================================================================
// Visualizations Tests
// =============================================================================

describe('visualizations', () => {
  describe('createTemperatureIndicator', () => {
    it('should create temperature indicator container', () => {
      const element = createTemperatureIndicator('hot');

      expect(element.className).toContain('temperature-indicator');
    });

    it('should set aria-hidden for accessibility', () => {
      const element = createTemperatureIndicator('warm');

      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    it('should apply hot modifier class', () => {
      const element = createTemperatureIndicator('hot');

      expect(element.className).toContain('temperature-indicator--hot');
    });

    it('should apply warm modifier class', () => {
      const element = createTemperatureIndicator('warm');

      expect(element.className).toContain('temperature-indicator--warm');
    });

    it('should apply cool modifier class', () => {
      const element = createTemperatureIndicator('cool');

      expect(element.className).toContain('temperature-indicator--cool');
    });

    it('should default to cool for null temperature', () => {
      const element = createTemperatureIndicator(null);

      expect(element.className).toContain('temperature-indicator--cool');
    });

    it('should default to cool for invalid temperature', () => {
      const element = createTemperatureIndicator('invalid');

      expect(element.className).toContain('temperature-indicator--cool');
    });

    it('should create temperature bar element', () => {
      const element = createTemperatureIndicator('hot');
      const bar = element.querySelector('.temperature-indicator__bar');

      expect(bar).not.toBeNull();
    });

    it('should create temperature fill element', () => {
      const element = createTemperatureIndicator('warm');
      const fill = element.querySelector('.temperature-indicator__fill');

      expect(fill).not.toBeNull();
    });

    it('should create markers for all temperature levels', () => {
      const element = createTemperatureIndicator('hot');
      const markers = element.querySelectorAll('.temperature-indicator__marker');

      expect(markers.length).toBe(3);
    });
  });

  describe('getTemperatureLevel', () => {
    it('should return hot for ratio >= 0.7', () => {
      expect(getTemperatureLevel(0.7)).toBe('hot');
      expect(getTemperatureLevel(0.85)).toBe('hot');
      expect(getTemperatureLevel(1.0)).toBe('hot');
    });

    it('should return warm for ratio >= 0.4', () => {
      expect(getTemperatureLevel(0.4)).toBe('warm');
      expect(getTemperatureLevel(0.5)).toBe('warm');
      expect(getTemperatureLevel(0.69)).toBe('warm');
    });

    it('should return cool for ratio < 0.4', () => {
      expect(getTemperatureLevel(0)).toBe('cool');
      expect(getTemperatureLevel(0.2)).toBe('cool');
      expect(getTemperatureLevel(0.39)).toBe('cool');
    });

    it('should handle percentage values > 1', () => {
      expect(getTemperatureLevel(70)).toBe('hot');
      expect(getTemperatureLevel(50)).toBe('warm');
      expect(getTemperatureLevel(20)).toBe('cool');
    });

    it('should return cool for null/NaN', () => {
      expect(getTemperatureLevel(null)).toBe('cool');
      expect(getTemperatureLevel(NaN)).toBe('cool');
      expect(getTemperatureLevel(undefined)).toBe('cool');
    });
  });

  describe('createPRFunnel', () => {
    it('should create PR funnel container', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });

      expect(element.className).toContain('pr-funnel');
    });

    it('should set aria-label for accessibility', () => {
      const element = createPRFunnel({ opened: 10, merged: 5, closed: 2 });

      expect(element.getAttribute('aria-label')).toContain('Pull request');
    });

    it('should display empty state for null data', () => {
      const element = createPRFunnel(null);

      expect(element.className).toContain('pr-funnel--empty');
      expect(element.textContent).toContain('No PR data');
    });

    it('should display empty state for invalid data', () => {
      const element = createPRFunnel('invalid');

      expect(element.className).toContain('pr-funnel--empty');
    });

    it('should create three stage elements', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
      const stages = element.querySelectorAll('.pr-funnel__stage');

      expect(stages.length).toBe(3);
    });

    it('should display opened stage', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
      const openedStage = element.querySelector('.pr-funnel__stage--opened');

      expect(openedStage).not.toBeNull();
      expect(openedStage.textContent).toContain('Opened');
      expect(openedStage.textContent).toContain('25');
    });

    it('should display merged stage', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
      const mergedStage = element.querySelector('.pr-funnel__stage--merged');

      expect(mergedStage).not.toBeNull();
      expect(mergedStage.textContent).toContain('Merged');
      expect(mergedStage.textContent).toContain('18');
    });

    it('should display closed stage', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
      const closedStage = element.querySelector('.pr-funnel__stage--closed');

      expect(closedStage).not.toBeNull();
      expect(closedStage.textContent).toContain('Closed');
      expect(closedStage.textContent).toContain('5');
    });

    it('should calculate and display merge rate', () => {
      const element = createPRFunnel({ opened: 100, merged: 75, closed: 25 });
      const rate = element.querySelector('.pr-funnel__rate-value');

      expect(rate.textContent).toBe('75%');
    });

    it('should handle zero opened PRs', () => {
      const element = createPRFunnel({ opened: 0, merged: 0, closed: 0 });
      const rate = element.querySelector('.pr-funnel__rate-value');

      expect(rate.textContent).toBe('0%');
    });

    it('should handle missing values gracefully', () => {
      const element = createPRFunnel({ opened: 10 });
      const stages = element.querySelectorAll('.pr-funnel__stage');

      expect(stages.length).toBe(3);
    });

    it('should include arrows between stages', () => {
      const element = createPRFunnel({ opened: 25, merged: 18, closed: 5 });
      const arrows = element.querySelectorAll('.pr-funnel__arrow');

      expect(arrows.length).toBe(2); // Between opened-merged and merged-closed
    });

    it('should format large numbers with abbreviations', () => {
      const element = createPRFunnel({ opened: 1500, merged: 1200, closed: 300 });

      expect(element.textContent).toContain('1.5k');
    });
  });

  describe('createContributorBars', () => {
    it('should create contributor bars container', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45 }
      ]);

      expect(element.className).toContain('contributor-bars');
    });

    it('should set role="list" for accessibility', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45 }
      ]);

      expect(element.getAttribute('role')).toBe('list');
    });

    it('should display empty state for null data', () => {
      const element = createContributorBars(null);

      expect(element.className).toContain('contributor-bars--empty');
      expect(element.textContent).toContain('No contributor data');
    });

    it('should display empty state for empty array', () => {
      const element = createContributorBars([]);

      expect(element.className).toContain('contributor-bars--empty');
    });

    it('should create row for each contributor', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45 },
        { login: 'user2', percentage: 30 },
        { login: 'user3', percentage: 25 }
      ]);
      const rows = element.querySelectorAll('.contributor-bars__row');

      expect(rows.length).toBe(3);
    });

    it('should limit to 5 contributors maximum', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 30 },
        { login: 'user2', percentage: 20 },
        { login: 'user3', percentage: 15 },
        { login: 'user4', percentage: 15 },
        { login: 'user5', percentage: 10 },
        { login: 'user6', percentage: 5 },
        { login: 'user7', percentage: 5 }
      ]);
      const rows = element.querySelectorAll('.contributor-bars__row');

      expect(rows.length).toBe(5);
    });

    it('should show "others" summary for additional contributors', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 30 },
        { login: 'user2', percentage: 20 },
        { login: 'user3', percentage: 15 },
        { login: 'user4', percentage: 15 },
        { login: 'user5', percentage: 10 },
        { login: 'user6', percentage: 5 },
        { login: 'user7', percentage: 5 }
      ]);
      const others = element.querySelector('.contributor-bars__others');

      expect(others).not.toBeNull();
      expect(others.textContent).toContain('+2 others');
      expect(others.textContent).toContain('10%');
    });

    it('should display contributor login names', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45 }
      ]);

      expect(element.textContent).toContain('user1');
    });

    it('should display percentage values', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45.7 }
      ]);

      expect(element.textContent).toContain('46%');
    });

    it('should display rank numbers', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 45 },
        { login: 'user2', percentage: 30 }
      ]);
      const ranks = element.querySelectorAll('.contributor-bars__rank');

      expect(ranks[0].textContent).toBe('1');
      expect(ranks[1].textContent).toBe('2');
    });

    it('should apply critical class for top contributor > 50%', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 55 }
      ]);
      const bar = element.querySelector('.contributor-bars__bar--critical');

      expect(bar).not.toBeNull();
    });

    it('should apply warning class for top contributor > 30%', () => {
      const element = createContributorBars([
        { login: 'user1', percentage: 40 }
      ]);
      const bar = element.querySelector('.contributor-bars__bar--warning');

      expect(bar).not.toBeNull();
    });

    it('should handle missing login gracefully', () => {
      const element = createContributorBars([
        { percentage: 45 }
      ]);

      expect(element.textContent).toContain('Unknown');
    });

    it('should handle missing percentage gracefully', () => {
      const element = createContributorBars([
        { login: 'user1' }
      ]);

      expect(element.textContent).toContain('0%');
    });
  });

  describe('getBusFactorRisk', () => {
    it('should return critical for null distribution', () => {
      expect(getBusFactorRisk(null)).toBe('critical');
    });

    it('should return critical for empty distribution', () => {
      expect(getBusFactorRisk([])).toBe('critical');
    });

    it('should return critical for top contributor > 50%', () => {
      expect(getBusFactorRisk([{ login: 'user1', percentage: 55 }])).toBe('critical');
      expect(getBusFactorRisk([{ login: 'user1', percentage: 80 }])).toBe('critical');
    });

    it('should return warning for top contributor > 30%', () => {
      expect(getBusFactorRisk([{ login: 'user1', percentage: 35 }])).toBe('warning');
      expect(getBusFactorRisk([{ login: 'user1', percentage: 50 }])).toBe('warning');
    });

    it('should return healthy for top contributor <= 30%', () => {
      expect(getBusFactorRisk([{ login: 'user1', percentage: 30 }])).toBe('healthy');
      expect(getBusFactorRisk([{ login: 'user1', percentage: 20 }])).toBe('healthy');
    });
  });

  describe('createFreshnessGauge', () => {
    it('should create freshness gauge container', () => {
      const element = createFreshnessGauge(85, 3);

      expect(element.className).toContain('freshness-gauge');
    });

    it('should set role="meter" for accessibility', () => {
      const element = createFreshnessGauge(75, 5);

      expect(element.getAttribute('role')).toBe('meter');
    });

    it('should set aria-valuenow', () => {
      const element = createFreshnessGauge(75, 5);

      expect(element.getAttribute('aria-valuenow')).toBe('75');
    });

    it('should set aria-valuemin and aria-valuemax', () => {
      const element = createFreshnessGauge(75, 5);

      expect(element.getAttribute('aria-valuemin')).toBe('0');
      expect(element.getAttribute('aria-valuemax')).toBe('100');
    });

    it('should apply fresh modifier class for recent repos', () => {
      const element = createFreshnessGauge(90, 3);

      expect(element.className).toContain('freshness-gauge--fresh');
    });

    it('should apply recent modifier class', () => {
      const element = createFreshnessGauge(70, 15);

      expect(element.className).toContain('freshness-gauge--recent');
    });

    it('should apply aging modifier class', () => {
      const element = createFreshnessGauge(40, 60);

      expect(element.className).toContain('freshness-gauge--aging');
    });

    it('should apply stale modifier class', () => {
      const element = createFreshnessGauge(10, 200);

      expect(element.className).toContain('freshness-gauge--stale');
    });

    it('should create SVG gauge element', () => {
      const element = createFreshnessGauge(85, 3);
      const svg = element.querySelector('.freshness-gauge__svg');

      expect(svg).not.toBeNull();
    });

    it('should display score value', () => {
      const element = createFreshnessGauge(85, 3);
      const score = element.querySelector('.freshness-gauge__score');

      expect(score.textContent).toBe('85');
    });

    it('should display freshness label', () => {
      const element = createFreshnessGauge(90, 3);
      const label = element.querySelector('.freshness-gauge__label');

      expect(label.textContent).toBe('Fresh');
    });

    it('should display days since push', () => {
      const element = createFreshnessGauge(85, 5);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('5 days');
    });

    it('should format "Today" for 0 days', () => {
      const element = createFreshnessGauge(100, 0);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('Today');
    });

    it('should format "1 day" for single day', () => {
      const element = createFreshnessGauge(95, 1);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('1 day');
    });

    it('should format weeks for 7-29 days', () => {
      const element = createFreshnessGauge(70, 14);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('2 weeks');
    });

    it('should format months for 30-364 days', () => {
      const element = createFreshnessGauge(40, 90);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('3 months');
    });

    it('should format years for 365+ days', () => {
      const element = createFreshnessGauge(5, 730);
      const days = element.querySelector('.freshness-gauge__days-value');

      expect(days.textContent).toBe('2 years');
    });

    it('should handle null days gracefully', () => {
      const element = createFreshnessGauge(50, null);
      const daysLabel = element.querySelector('.freshness-gauge__days-label');

      expect(daysLabel.textContent).toContain('No release data');
    });

    it('should clamp score to 0-100 range', () => {
      const element1 = createFreshnessGauge(-10, 5);
      const element2 = createFreshnessGauge(150, 5);

      expect(element1.getAttribute('aria-valuenow')).toBe('0');
      expect(element2.getAttribute('aria-valuenow')).toBe('100');
    });

    it('should handle null score gracefully', () => {
      const element = createFreshnessGauge(null, 5);

      expect(element.getAttribute('aria-valuenow')).toBe('0');
    });
  });

  describe('getFreshnessLevel', () => {
    it('should return fresh for days <= 7', () => {
      expect(getFreshnessLevel(0)).toBe('fresh');
      expect(getFreshnessLevel(3)).toBe('fresh');
      expect(getFreshnessLevel(7)).toBe('fresh');
    });

    it('should return recent for days <= 30', () => {
      expect(getFreshnessLevel(8)).toBe('recent');
      expect(getFreshnessLevel(15)).toBe('recent');
      expect(getFreshnessLevel(30)).toBe('recent');
    });

    it('should return aging for days <= 90', () => {
      expect(getFreshnessLevel(31)).toBe('aging');
      expect(getFreshnessLevel(60)).toBe('aging');
      expect(getFreshnessLevel(90)).toBe('aging');
    });

    it('should return stale for days > 90', () => {
      expect(getFreshnessLevel(91)).toBe('stale');
      expect(getFreshnessLevel(365)).toBe('stale');
      expect(getFreshnessLevel(1000)).toBe('stale');
    });

    it('should return stale for null days', () => {
      expect(getFreshnessLevel(null)).toBe('stale');
    });

    it('should return stale for NaN', () => {
      expect(getFreshnessLevel(NaN)).toBe('stale');
    });
  });

  describe('calculateFreshnessScore', () => {
    it('should return 100 for 0 days', () => {
      expect(calculateFreshnessScore(0)).toBe(100);
    });

    it('should return ~80 for 7 days', () => {
      const score = calculateFreshnessScore(7);
      expect(score).toBeGreaterThanOrEqual(79);
      expect(score).toBeLessThanOrEqual(81);
    });

    it('should return ~50 for 30 days', () => {
      const score = calculateFreshnessScore(30);
      expect(score).toBeGreaterThanOrEqual(49);
      expect(score).toBeLessThanOrEqual(51);
    });

    it('should return ~20 for 90 days', () => {
      const score = calculateFreshnessScore(90);
      expect(score).toBeGreaterThanOrEqual(19);
      expect(score).toBeLessThanOrEqual(21);
    });

    it('should approach 0 for very old repos', () => {
      const score = calculateFreshnessScore(365);
      expect(score).toBeLessThanOrEqual(10);
    });

    it('should return 0 for null days', () => {
      expect(calculateFreshnessScore(null)).toBe(0);
    });

    it('should return 0 for negative days', () => {
      expect(calculateFreshnessScore(-5)).toBe(0);
    });

    it('should return 0 for NaN', () => {
      expect(calculateFreshnessScore(NaN)).toBe(0);
    });

    it('should never return negative values', () => {
      expect(calculateFreshnessScore(10000)).toBeGreaterThanOrEqual(0);
    });
  });
});

// =============================================================================
// MetricCard Tests
// =============================================================================

describe('MetricCard', () => {
  describe('createMetricCard', () => {
    it('should create metric card container', () => {
      const element = createMetricCard({ title: 'Test Metric' });

      expect(element.tagName.toLowerCase()).toBe('article');
      expect(element.className).toContain('pulse-card');
    });

    it('should set role="region" for accessibility', () => {
      const element = createMetricCard({ title: 'Test Metric' });

      expect(element.getAttribute('role')).toBe('region');
    });

    it('should set aria-label with title and status', () => {
      const element = createMetricCard({ title: 'Commit Velocity', status: 'thriving' });

      expect(element.getAttribute('aria-label')).toContain('Commit Velocity');
      expect(element.getAttribute('aria-label')).toContain('Thriving');
    });

    it('should create header with title', () => {
      const element = createMetricCard({ title: 'Test Metric' });
      const title = element.querySelector('.pulse-card__title');

      expect(title).not.toBeNull();
      expect(title.textContent).toBe('Test Metric');
    });

    it('should create status icon in header', () => {
      const element = createMetricCard({ title: 'Test', status: 'thriving' });
      const icon = element.querySelector('.pulse-card__status-icon');

      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe('🟢');
    });

    it('should apply thriving status modifier', () => {
      const element = createMetricCard({ title: 'Test', status: 'thriving' });

      expect(element.className).toContain('pulse-card--thriving');
    });

    it('should apply stable status modifier', () => {
      const element = createMetricCard({ title: 'Test', status: 'stable' });

      expect(element.className).toContain('pulse-card--stable');
    });

    it('should apply cooling status modifier', () => {
      const element = createMetricCard({ title: 'Test', status: 'cooling' });

      expect(element.className).toContain('pulse-card--cooling');
    });

    it('should apply at_risk status modifier', () => {
      const element = createMetricCard({ title: 'Test', status: 'at_risk' });

      expect(element.className).toContain('pulse-card--at_risk');
    });

    it('should handle unknown status gracefully', () => {
      const element = createMetricCard({ title: 'Test', status: 'unknown' });

      // Should not throw and should render
      expect(element.className).toContain('pulse-card');
    });

    it('should create footer with label', () => {
      const element = createMetricCard({ title: 'Test', label: 'Last 90 days' });
      const label = element.querySelector('.pulse-card__label');

      expect(label).not.toBeNull();
      expect(label.textContent).toBe('Last 90 days');
    });

    it('should handle null metric gracefully', () => {
      const element = createMetricCard(null);

      expect(element.className).toContain('pulse-card');
      expect(element.querySelector('.pulse-card__title').textContent).toBe('Metric');
    });

    it('should handle undefined metric gracefully', () => {
      const element = createMetricCard(undefined);

      expect(element.className).toContain('pulse-card');
    });

    // Standard type tests
    describe('standard type', () => {
      it('should apply standard type modifier', () => {
        const element = createMetricCard({ title: 'Test' }, 'standard');

        expect(element.className).toContain('pulse-card--standard');
      });

      it('should create body with value container', () => {
        const element = createMetricCard({
          title: 'Commits',
          value: 45
        }, 'standard');
        const valueContainer = element.querySelector('.pulse-card__value-container');

        expect(valueContainer).not.toBeNull();
      });

      it('should display metric value', () => {
        const element = createMetricCard({
          title: 'Commits',
          value: 45
        }, 'standard');
        const value = element.querySelector('.pulse-card__value');

        expect(value.textContent).toBe('45');
      });

      it('should format large values with abbreviations', () => {
        const element = createMetricCard({
          title: 'Stars',
          value: 15000
        }, 'standard');
        const value = element.querySelector('.pulse-card__value');

        expect(value.textContent).toBe('15.0k');
      });

      it('should display value unit', () => {
        const element = createMetricCard({
          title: 'Velocity',
          value: 45,
          unit: 'commits/week'
        }, 'standard');
        const unit = element.querySelector('.pulse-card__unit');

        expect(unit).not.toBeNull();
        expect(unit.textContent).toBe('commits/week');
      });

      it('should include trend arrow', () => {
        const element = createMetricCard({
          title: 'Commits',
          value: 45,
          trend: 12.5
        }, 'standard');
        const trend = element.querySelector('.pulse-card__trend');
        const arrow = trend.querySelector('.trend-arrow');

        expect(arrow).not.toBeNull();
      });

      it('should include sparkline', () => {
        const element = createMetricCard({
          title: 'Commits',
          value: 45,
          sparklineData: [10, 15, 20, 25, 30, 35, 40, 45]
        }, 'standard');
        const sparkline = element.querySelector('.pulse-card__sparkline');

        expect(sparkline).not.toBeNull();
        expect(sparkline.querySelector('.sparkline')).not.toBeNull();
      });

      it('should show unavailable state for missing data', () => {
        const element = createMetricCard({
          title: 'Empty Metric'
        }, 'standard');
        const unavailable = element.querySelector('.pulse-card__unavailable-message');

        expect(unavailable).not.toBeNull();
        expect(unavailable.textContent).toContain('Data unavailable');
      });

      it('should handle null value with placeholder', () => {
        const element = createMetricCard({
          title: 'Test',
          value: null,
          sparklineData: [1, 2, 3]
        }, 'standard');
        const value = element.querySelector('.pulse-card__value');

        expect(value.textContent).toBe('--');
      });
    });

    // Temperature type tests
    describe('temperature type', () => {
      it('should apply temperature type modifier', () => {
        const element = createMetricCard({ title: 'Issue Health', temperature: 'hot' }, 'temperature');

        expect(element.className).toContain('pulse-card--temperature');
      });

      it('should create temperature indicator', () => {
        const element = createMetricCard({
          title: 'Issue Health',
          temperature: 'hot'
        }, 'temperature');
        const indicator = element.querySelector('.temperature-indicator');

        expect(indicator).not.toBeNull();
      });

      it('should show hot temperature', () => {
        const element = createMetricCard({
          title: 'Issue Health',
          temperature: 'hot'
        }, 'temperature');
        const indicator = element.querySelector('.temperature-indicator');

        expect(indicator.className).toContain('temperature-indicator--hot');
      });

      it('should show warm temperature', () => {
        const element = createMetricCard({
          title: 'Issue Health',
          temperature: 'warm'
        }, 'temperature');
        const indicator = element.querySelector('.temperature-indicator');

        expect(indicator.className).toContain('temperature-indicator--warm');
      });

      it('should show cool temperature', () => {
        const element = createMetricCard({
          title: 'Issue Health',
          temperature: 'cool'
        }, 'temperature');
        const indicator = element.querySelector('.temperature-indicator');

        expect(indicator.className).toContain('temperature-indicator--cool');
      });

      it('should include optional trend arrow', () => {
        const element = createMetricCard({
          title: 'Issue Health',
          temperature: 'warm',
          trend: -5
        }, 'temperature');
        const trend = element.querySelector('.pulse-card__trend');

        expect(trend).not.toBeNull();
      });

      it('should show unavailable state when temperature is undefined', () => {
        const element = createMetricCard({
          title: 'Issue Health'
        }, 'temperature');
        const unavailable = element.querySelector('.pulse-card__unavailable-message');

        expect(unavailable).not.toBeNull();
      });
    });

    // Funnel type tests
    describe('funnel type', () => {
      it('should apply funnel type modifier', () => {
        const element = createMetricCard({
          title: 'PR Health',
          funnel: { opened: 25, merged: 18, closed: 5 }
        }, 'funnel');

        expect(element.className).toContain('pulse-card--funnel');
      });

      it('should create PR funnel visualization', () => {
        const element = createMetricCard({
          title: 'PR Health',
          funnel: { opened: 25, merged: 18, closed: 5 }
        }, 'funnel');
        const funnel = element.querySelector('.pr-funnel');

        expect(funnel).not.toBeNull();
      });

      it('should display all funnel stages', () => {
        const element = createMetricCard({
          title: 'PR Health',
          funnel: { opened: 25, merged: 18, closed: 5 }
        }, 'funnel');
        const stages = element.querySelectorAll('.pr-funnel__stage');

        expect(stages.length).toBe(3);
      });

      it('should show unavailable state for missing funnel', () => {
        const element = createMetricCard({
          title: 'PR Health'
        }, 'funnel');
        const unavailable = element.querySelector('.pulse-card__unavailable-message');

        expect(unavailable).not.toBeNull();
      });
    });

    // Bus Factor type tests
    describe('busFactor type', () => {
      it('should apply busFactor type modifier', () => {
        const element = createMetricCard({
          title: 'Bus Factor',
          distribution: [{ login: 'user1', percentage: 45 }]
        }, 'busFactor');

        expect(element.className).toContain('pulse-card--busFactor');
      });

      it('should create contributor bars visualization', () => {
        const element = createMetricCard({
          title: 'Bus Factor',
          distribution: [
            { login: 'user1', percentage: 45 },
            { login: 'user2', percentage: 30 }
          ]
        }, 'busFactor');
        const bars = element.querySelector('.contributor-bars');

        expect(bars).not.toBeNull();
      });

      it('should display contributor rows', () => {
        const element = createMetricCard({
          title: 'Bus Factor',
          distribution: [
            { login: 'user1', percentage: 45 },
            { login: 'user2', percentage: 30 }
          ]
        }, 'busFactor');
        const rows = element.querySelectorAll('.contributor-bars__row');

        expect(rows.length).toBe(2);
      });

      it('should show unavailable state for missing distribution', () => {
        const element = createMetricCard({
          title: 'Bus Factor'
        }, 'busFactor');
        const unavailable = element.querySelector('.pulse-card__unavailable-message');

        expect(unavailable).not.toBeNull();
      });
    });

    // Freshness type tests
    describe('freshness type', () => {
      it('should apply freshness type modifier', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          score: 85,
          daysSincePush: 3
        }, 'freshness');

        expect(element.className).toContain('pulse-card--freshness');
      });

      it('should create freshness gauge visualization', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          score: 85,
          daysSincePush: 3
        }, 'freshness');
        const gauge = element.querySelector('.freshness-gauge');

        expect(gauge).not.toBeNull();
      });

      it('should display score in gauge', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          score: 85,
          daysSincePush: 3
        }, 'freshness');
        const score = element.querySelector('.freshness-gauge__score');

        expect(score.textContent).toBe('85');
      });

      it('should display days since push', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          score: 85,
          daysSincePush: 5
        }, 'freshness');
        const days = element.querySelector('.freshness-gauge__days-value');

        expect(days.textContent).toBe('5 days');
      });

      it('should show unavailable state for missing score and days', () => {
        const element = createMetricCard({
          title: 'Release Freshness'
        }, 'freshness');
        const unavailable = element.querySelector('.pulse-card__unavailable-message');

        expect(unavailable).not.toBeNull();
      });

      it('should render with only score', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          score: 75
        }, 'freshness');
        const gauge = element.querySelector('.freshness-gauge');

        expect(gauge).not.toBeNull();
      });

      it('should render with only daysSincePush', () => {
        const element = createMetricCard({
          title: 'Release Freshness',
          daysSincePush: 10
        }, 'freshness');
        const gauge = element.querySelector('.freshness-gauge');

        expect(gauge).not.toBeNull();
      });
    });

    // Default type fallback
    describe('type fallback', () => {
      it('should default to standard type when type is omitted', () => {
        const element = createMetricCard({
          title: 'Test',
          value: 100,
          sparklineData: [1, 2, 3]
        });

        expect(element.className).toContain('pulse-card--standard');
      });

      it('should fallback to standard for unknown type', () => {
        const element = createMetricCard({
          title: 'Test',
          value: 100
        }, 'unknown');

        expect(element.className).toContain('pulse-card--unknown');
        // Should still try to render standard body
        expect(element.querySelector('.pulse-card__body')).not.toBeNull();
      });
    });
  });

  describe('createCompactMetricCard', () => {
    it('should create compact card with modifier class', () => {
      const element = createCompactMetricCard({ title: 'Test' });

      expect(element.className).toContain('pulse-card--compact');
    });

    it('should support all card types', () => {
      const standardCard = createCompactMetricCard({ title: 'Test', value: 10 }, 'standard');
      const tempCard = createCompactMetricCard({ title: 'Test', temperature: 'hot' }, 'temperature');
      const funnelCard = createCompactMetricCard({ title: 'Test', funnel: { opened: 5 } }, 'funnel');

      expect(standardCard.className).toContain('pulse-card--compact');
      expect(tempCard.className).toContain('pulse-card--compact');
      expect(funnelCard.className).toContain('pulse-card--compact');
    });
  });

  describe('createMetricCardSkeleton', () => {
    it('should create skeleton card', () => {
      const element = createMetricCardSkeleton();

      expect(element.className).toContain('pulse-card');
      expect(element.className).toContain('pulse-card--skeleton');
    });

    it('should set aria-hidden for accessibility', () => {
      const element = createMetricCardSkeleton();

      expect(element.getAttribute('aria-hidden')).toBe('true');
    });

    it('should include skeleton header elements', () => {
      const element = createMetricCardSkeleton();
      const header = element.querySelector('.pulse-card__header');

      expect(header).not.toBeNull();
      expect(header.querySelector('.pulse-card__skeleton-line--title')).not.toBeNull();
      expect(header.querySelector('.pulse-card__skeleton-circle')).not.toBeNull();
    });

    it('should include skeleton body elements', () => {
      const element = createMetricCardSkeleton();
      const body = element.querySelector('.pulse-card__body');

      expect(body).not.toBeNull();
      expect(body.querySelector('.pulse-card__skeleton-line--value')).not.toBeNull();
      expect(body.querySelector('.pulse-card__skeleton-line--trend')).not.toBeNull();
      expect(body.querySelector('.pulse-card__skeleton-line--sparkline')).not.toBeNull();
    });

    it('should include skeleton footer elements', () => {
      const element = createMetricCardSkeleton();
      const footer = element.querySelector('.pulse-card__footer');

      expect(footer).not.toBeNull();
      expect(footer.querySelector('.pulse-card__skeleton-line--label')).not.toBeNull();
    });
  });
});

// =============================================================================
// PulseDashboard Main Component Tests
// =============================================================================

describe('PulseDashboard', () => {
  // Helper to create mock pulse data
  const createMockPulseData = (overrides = {}) => ({
    commitVelocity: {
      value: 25,
      trend: 12.5,
      status: 'thriving',
      sparklineData: [15, 18, 20, 22, 25, 23, 28, 25]
    },
    issueHealth: {
      temperature: 'warm',
      trend: -3.2,
      status: 'stable'
    },
    prHealth: {
      funnel: { opened: 30, merged: 22, closed: 5 },
      status: 'thriving'
    },
    busFactor: {
      distribution: [
        { login: 'user1', percentage: 35 },
        { login: 'user2', percentage: 25 },
        { login: 'user3', percentage: 20 }
      ],
      status: 'stable'
    },
    releaseFreshness: {
      score: 85,
      daysSincePush: 5,
      status: 'thriving'
    },
    communityHealth: {
      value: 850,
      trend: 8.3,
      status: 'thriving',
      sparklineData: [700, 720, 750, 780, 800, 820, 840, 850]
    },
    ...overrides
  });

  describe('createPulseDashboard', () => {
    it('should create dashboard container', () => {
      const element = createPulseDashboard(createMockPulseData());

      expect(element.tagName.toLowerCase()).toBe('section');
      expect(element.className).toContain('pulse-dashboard');
    });

    it('should set aria-label for accessibility', () => {
      const element = createPulseDashboard(createMockPulseData());

      expect(element.getAttribute('aria-label')).toBe('Repository Pulse Dashboard');
    });

    it('should create header element', () => {
      const element = createPulseDashboard(createMockPulseData());
      const header = element.querySelector('.pulse-dashboard__header');

      expect(header).not.toBeNull();
    });

    it('should display "Repository Pulse" title', () => {
      const element = createPulseDashboard(createMockPulseData());
      const title = element.querySelector('.pulse-dashboard__title');

      expect(title).not.toBeNull();
      expect(title.textContent).toBe('Repository Pulse');
    });

    it('should display repository name when provided', () => {
      const element = createPulseDashboard(createMockPulseData({ repoName: 'owner/repo' }));
      const subtitle = element.querySelector('.pulse-dashboard__subtitle');

      expect(subtitle).not.toBeNull();
      expect(subtitle.textContent).toBe('owner/repo');
    });

    it('should not display subtitle when repoName is not provided', () => {
      const element = createPulseDashboard(createMockPulseData());
      const subtitle = element.querySelector('.pulse-dashboard__subtitle');

      expect(subtitle).toBeNull();
    });

    it('should create status section with role="status"', () => {
      const element = createPulseDashboard(createMockPulseData());
      const status = element.querySelector('.pulse-dashboard__status');

      expect(status).not.toBeNull();
      expect(status.getAttribute('role')).toBe('status');
      expect(status.getAttribute('aria-live')).toBe('polite');
    });

    it('should display thriving status icon', () => {
      const element = createPulseDashboard(createMockPulseData());
      const icon = element.querySelector('.pulse-dashboard__status-icon');

      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe('🟢');
    });

    it('should create metric cards grid', () => {
      const element = createPulseDashboard(createMockPulseData());
      const grid = element.querySelector('.pulse-dashboard__grid');

      expect(grid).not.toBeNull();
      expect(grid.getAttribute('role')).toBe('list');
      expect(grid.getAttribute('aria-label')).toBe('Repository vital signs');
    });

    it('should create 6 metric cards', () => {
      const element = createPulseDashboard(createMockPulseData());
      const cards = element.querySelectorAll('.pulse-card');

      expect(cards.length).toBe(6);
    });

    it('should assign listitem role to each card', () => {
      const element = createPulseDashboard(createMockPulseData());
      const cards = element.querySelectorAll('.pulse-card');

      cards.forEach(card => {
        expect(card.getAttribute('role')).toBe('listitem');
      });
    });

    it('should set data-status attribute on container', () => {
      const element = createPulseDashboard(createMockPulseData());

      expect(element.dataset.status).toBeDefined();
    });

    it('should handle null pulseData gracefully', () => {
      const element = createPulseDashboard(null);

      expect(element.className).toContain('pulse-dashboard');
      expect(element.querySelectorAll('.pulse-card').length).toBe(6);
    });

    it('should handle undefined pulseData gracefully', () => {
      const element = createPulseDashboard(undefined);

      expect(element.className).toContain('pulse-dashboard');
    });

    it('should handle empty object pulseData', () => {
      const element = createPulseDashboard({});

      expect(element.className).toContain('pulse-dashboard');
      expect(element.querySelectorAll('.pulse-card').length).toBe(6);
    });

    // Status calculation tests
    describe('overall status calculation', () => {
      it('should use overallStatus when explicitly provided', () => {
        const element = createPulseDashboard(createMockPulseData({ overallStatus: 'cooling' }));

        expect(element.dataset.status).toBe('cooling');
      });

      it('should calculate thriving when 4+ metrics are thriving', () => {
        const data = createMockPulseData({
          commitVelocity: { value: 50, status: 'thriving' },
          issueHealth: { temperature: 'hot', status: 'thriving' },
          prHealth: { funnel: { opened: 30 }, status: 'thriving' },
          busFactor: { distribution: [], status: 'thriving' },
          releaseFreshness: { score: 95, status: 'thriving' },
          communityHealth: { value: 1000, status: 'stable' }
        });
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('thriving');
      });

      it('should calculate at_risk when 2+ metrics are at_risk', () => {
        const data = createMockPulseData({
          commitVelocity: { value: 0, status: 'at_risk' },
          issueHealth: { temperature: 'cool', status: 'at_risk' },
          prHealth: { funnel: { opened: 0 }, status: 'stable' }
        });
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('at_risk');
      });

      it('should calculate cooling when 3+ metrics are cooling', () => {
        const data = createMockPulseData({
          commitVelocity: { value: 5, status: 'cooling' },
          issueHealth: { temperature: 'cool', status: 'cooling' },
          prHealth: { funnel: { opened: 5 }, status: 'cooling' },
          busFactor: { distribution: [], status: 'stable' }
        });
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('cooling');
      });

      it('should calculate cooling when 1 metric is at_risk', () => {
        const data = createMockPulseData({
          commitVelocity: { value: 0, status: 'at_risk' },
          issueHealth: { temperature: 'warm', status: 'stable' },
          prHealth: { funnel: { opened: 10 }, status: 'stable' },
          busFactor: { distribution: [], status: 'stable' }
        });
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('cooling');
      });

      it('should default to stable when no clear pattern', () => {
        const data = createMockPulseData({
          commitVelocity: { value: 15, status: 'stable' },
          issueHealth: { temperature: 'warm', status: 'stable' },
          prHealth: { funnel: { opened: 10 }, status: 'stable' }
        });
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('stable');
      });

      it('should default to stable for empty statuses', () => {
        const data = {
          commitVelocity: { value: 10 },
          issueHealth: { temperature: 'warm' }
        };
        const element = createPulseDashboard(data);

        expect(element.dataset.status).toBe('stable');
      });
    });

    // Status display tests
    describe('status display', () => {
      it('should display thriving label and description', () => {
        const element = createPulseDashboard(createMockPulseData({ overallStatus: 'thriving' }));
        const label = element.querySelector('.pulse-dashboard__status-label');
        const desc = element.querySelector('.pulse-dashboard__status-description');

        expect(label.textContent).toBe('Thriving');
        expect(desc.textContent).toContain('highly active');
      });

      it('should display stable label and description', () => {
        const element = createPulseDashboard(createMockPulseData({ overallStatus: 'stable' }));
        const label = element.querySelector('.pulse-dashboard__status-label');
        const desc = element.querySelector('.pulse-dashboard__status-description');

        expect(label.textContent).toBe('Stable');
        expect(desc.textContent).toContain('consistent activity');
      });

      it('should display cooling label and description', () => {
        const element = createPulseDashboard(createMockPulseData({ overallStatus: 'cooling' }));
        const label = element.querySelector('.pulse-dashboard__status-label');
        const desc = element.querySelector('.pulse-dashboard__status-description');

        expect(label.textContent).toBe('Cooling');
        expect(desc.textContent).toContain('declining');
      });

      it('should display at_risk label and description', () => {
        const element = createPulseDashboard(createMockPulseData({ overallStatus: 'at_risk' }));
        const label = element.querySelector('.pulse-dashboard__status-label');
        const desc = element.querySelector('.pulse-dashboard__status-description');

        expect(label.textContent).toBe('At Risk');
        expect(desc.textContent).toContain('dying or unmaintained');
      });

      it('should fall back to calculated status for invalid status value', () => {
        // When overallStatus is invalid, it falls back to calculating from metrics
        const data = createMockPulseData();
        data.overallStatus = 'invalid_status';
        const element = createPulseDashboard(data);
        const label = element.querySelector('.pulse-dashboard__status-label');

        // Mock data has 4 thriving metrics, so calculated status is 'thriving'
        expect(label.textContent).toBe('Thriving');
      });

      it('should display correct status icons', () => {
        const testCases = [
          { status: 'thriving', icon: '🟢' },
          { status: 'stable', icon: '🟡' },
          { status: 'cooling', icon: '🟠' },
          { status: 'at_risk', icon: '🔴' }
        ];

        testCases.forEach(({ status, icon }) => {
          const element = createPulseDashboard(createMockPulseData({ overallStatus: status }));
          const iconElement = element.querySelector('.pulse-dashboard__status-icon');
          expect(iconElement.textContent).toBe(icon);
        });
      });

      it('should set aria-hidden on status icon', () => {
        const element = createPulseDashboard(createMockPulseData());
        const icon = element.querySelector('.pulse-dashboard__status-icon');

        expect(icon.getAttribute('aria-hidden')).toBe('true');
      });
    });

    // Metric card content tests
    describe('metric cards content', () => {
      it('should render commit velocity card with sparkline', () => {
        const element = createPulseDashboard(createMockPulseData());
        const cards = element.querySelectorAll('.pulse-card');
        const velocityCard = cards[0];

        expect(velocityCard.textContent).toContain('Commit Velocity');
        expect(velocityCard.querySelector('.sparkline')).not.toBeNull();
      });

      it('should render issue health card with temperature indicator', () => {
        const element = createPulseDashboard(createMockPulseData());
        const tempIndicator = element.querySelector('.temperature-indicator');

        expect(tempIndicator).not.toBeNull();
      });

      it('should render PR health card with funnel', () => {
        const element = createPulseDashboard(createMockPulseData());
        const funnel = element.querySelector('.pr-funnel');

        expect(funnel).not.toBeNull();
      });

      it('should render bus factor card with contributor bars', () => {
        const element = createPulseDashboard(createMockPulseData());
        const bars = element.querySelector('.contributor-bars');

        expect(bars).not.toBeNull();
      });

      it('should render freshness card with gauge', () => {
        const element = createPulseDashboard(createMockPulseData());
        const gauge = element.querySelector('.freshness-gauge');

        expect(gauge).not.toBeNull();
      });

      it('should handle missing metric data gracefully', () => {
        const partialData = {
          commitVelocity: { value: 25, status: 'thriving' }
          // Other metrics are missing
        };
        const element = createPulseDashboard(partialData);
        const cards = element.querySelectorAll('.pulse-card');

        // Should still render all 6 cards
        expect(cards.length).toBe(6);
      });
    });
  });

  describe('createPulseDashboardSkeleton', () => {
    it('should create skeleton dashboard container', () => {
      const element = createPulseDashboardSkeleton();

      expect(element.tagName.toLowerCase()).toBe('section');
      expect(element.className).toContain('pulse-dashboard');
      expect(element.className).toContain('pulse-dashboard--loading');
    });

    it('should set aria-label for loading state', () => {
      const element = createPulseDashboardSkeleton();

      expect(element.getAttribute('aria-label')).toBe('Loading Repository Pulse Dashboard');
    });

    it('should set aria-busy to true', () => {
      const element = createPulseDashboardSkeleton();

      expect(element.getAttribute('aria-busy')).toBe('true');
    });

    it('should create skeleton header', () => {
      const element = createPulseDashboardSkeleton();
      const header = element.querySelector('.pulse-dashboard__header--skeleton');

      expect(header).not.toBeNull();
      expect(header.getAttribute('aria-hidden')).toBe('true');
    });

    it('should create title skeleton line', () => {
      const element = createPulseDashboardSkeleton();
      const titleSkeleton = element.querySelector('.pulse-dashboard__skeleton-line--title');

      expect(titleSkeleton).not.toBeNull();
    });

    it('should create status skeleton line', () => {
      const element = createPulseDashboardSkeleton();
      const statusSkeleton = element.querySelector('.pulse-dashboard__skeleton-line--status');

      expect(statusSkeleton).not.toBeNull();
    });

    it('should create skeleton grid', () => {
      const element = createPulseDashboardSkeleton();
      const grid = element.querySelector('.pulse-dashboard__grid');

      expect(grid).not.toBeNull();
      expect(grid.getAttribute('aria-hidden')).toBe('true');
    });

    it('should create 6 skeleton metric cards', () => {
      const element = createPulseDashboardSkeleton();
      const skeletonCards = element.querySelectorAll('.pulse-card--skeleton');

      expect(skeletonCards.length).toBe(6);
    });

    it('should have skeleton header and body elements in cards', () => {
      const element = createPulseDashboardSkeleton();
      const firstCard = element.querySelector('.pulse-card--skeleton');

      expect(firstCard.querySelector('.pulse-card__header')).not.toBeNull();
      expect(firstCard.querySelector('.pulse-card__body')).not.toBeNull();
    });
  });

  describe('createPulseDashboardError', () => {
    it('should create error dashboard container', () => {
      const element = createPulseDashboardError(() => {});

      expect(element.tagName.toLowerCase()).toBe('section');
      expect(element.className).toContain('pulse-dashboard');
      expect(element.className).toContain('pulse-dashboard--error');
    });

    it('should set aria-label for error state', () => {
      const element = createPulseDashboardError(() => {});

      expect(element.getAttribute('aria-label')).toBe('Repository Pulse Dashboard - Error');
    });

    it('should set role="alert" for screen readers', () => {
      const element = createPulseDashboardError(() => {});

      expect(element.getAttribute('role')).toBe('alert');
    });

    it('should create error content container', () => {
      const element = createPulseDashboardError(() => {});
      const content = element.querySelector('.pulse-dashboard__error-content');

      expect(content).not.toBeNull();
    });

    it('should display error icon', () => {
      const element = createPulseDashboardError(() => {});
      const icon = element.querySelector('.pulse-dashboard__error-icon');

      expect(icon).not.toBeNull();
      expect(icon.textContent).toBe('⚠️');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });

    it('should display error message', () => {
      const element = createPulseDashboardError(() => {});
      const message = element.querySelector('.pulse-dashboard__error-message');

      expect(message).not.toBeNull();
      expect(message.textContent).toContain('Unable to load');
    });

    it('should display error description', () => {
      const element = createPulseDashboardError(() => {});
      const description = element.querySelector('.pulse-dashboard__error-description');

      expect(description).not.toBeNull();
      expect(description.textContent).toContain('problem fetching');
    });

    it('should create retry button', () => {
      const element = createPulseDashboardError(() => {});
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      expect(button).not.toBeNull();
      expect(button.tagName.toLowerCase()).toBe('button');
      expect(button.type).toBe('button');
      expect(button.textContent).toBe('Retry');
    });

    it('should set aria-label on retry button', () => {
      const element = createPulseDashboardError(() => {});
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      expect(button.getAttribute('aria-label')).toBe('Retry loading pulse data');
    });

    it('should call onRetry callback when retry button is clicked', () => {
      const onRetry = vi.fn();
      const element = createPulseDashboardError(onRetry);
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      button.click();

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry callback multiple times on multiple clicks', () => {
      const onRetry = vi.fn();
      const element = createPulseDashboardError(onRetry);
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      button.click();
      button.click();
      button.click();

      expect(onRetry).toHaveBeenCalledTimes(3);
    });

    it('should handle undefined onRetry gracefully', () => {
      const element = createPulseDashboardError(undefined);
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      // Should not throw when clicking
      expect(() => button.click()).not.toThrow();
    });

    it('should handle null onRetry gracefully', () => {
      const element = createPulseDashboardError(null);
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      // Should not throw when clicking
      expect(() => button.click()).not.toThrow();
    });

    it('should handle non-function onRetry gracefully', () => {
      const element = createPulseDashboardError('not a function');
      const button = element.querySelector('.pulse-dashboard__retry-btn');

      // Should not throw when clicking
      expect(() => button.click()).not.toThrow();
    });
  });
});

// =============================================================================
// PULSE CALCULATOR TESTS
// =============================================================================

describe('PulseCalculator', () => {
  // ==========================================================================
  // UTILITY FUNCTIONS
  // ==========================================================================

  describe('Utility Functions', () => {
    describe('average', () => {
      it('should calculate average of numbers', () => {
        expect(average([1, 2, 3, 4, 5])).toBe(3);
      });

      it('should handle single value', () => {
        expect(average([10])).toBe(10);
      });

      it('should handle zeros', () => {
        expect(average([0, 0, 0])).toBe(0);
      });

      it('should filter out non-numeric values', () => {
        // 'invalid' gets converted to 0 via Number() || 0, so [1, 2, 0, 3] / 4 = 1.5
        expect(average([1, 2, 'invalid', 3])).toBe(1.5);
      });

      it('should return 0 for empty array', () => {
        expect(average([])).toBe(0);
      });

      it('should return 0 for null', () => {
        expect(average(null)).toBe(0);
      });

      it('should return 0 for undefined', () => {
        expect(average(undefined)).toBe(0);
      });

      it('should handle floating point numbers', () => {
        expect(average([1.5, 2.5, 3.5])).toBeCloseTo(2.5);
      });
    });

    describe('daysSince', () => {
      it('should calculate days since a date', () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        expect(daysSince(yesterday.toISOString())).toBe(1);
      });

      it('should return 0 for current date', () => {
        const now = new Date();
        expect(daysSince(now.toISOString())).toBe(0);
      });

      it('should return Infinity for null', () => {
        expect(daysSince(null)).toBe(Infinity);
      });

      it('should return Infinity for invalid date', () => {
        expect(daysSince('invalid-date')).toBe(Infinity);
      });

      it('should handle Date object', () => {
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        expect(daysSince(yesterday)).toBe(1);
      });

      it('should floor the result', () => {
        const almostTwoDays = new Date(Date.now() - 1.9 * 24 * 60 * 60 * 1000);
        expect(daysSince(almostTwoDays)).toBe(1);
      });
    });

    describe('daysBetween', () => {
      it('should calculate days between two dates', () => {
        const date1 = '2024-01-01';
        const date2 = '2024-01-15';
        expect(daysBetween(date1, date2)).toBe(14);
      });

      it('should return absolute value (order independent)', () => {
        const date1 = '2024-01-15';
        const date2 = '2024-01-01';
        expect(daysBetween(date1, date2)).toBe(14);
      });

      it('should return 0 for same date', () => {
        const date = '2024-01-01';
        expect(daysBetween(date, date)).toBe(0);
      });

      it('should return 0 for null dates', () => {
        expect(daysBetween(null, '2024-01-01')).toBe(0);
        expect(daysBetween('2024-01-01', null)).toBe(0);
      });

      it('should return 0 for invalid dates', () => {
        expect(daysBetween('invalid', '2024-01-01')).toBe(0);
      });

      it('should handle Date objects', () => {
        const date1 = new Date('2024-01-01');
        const date2 = new Date('2024-01-15');
        expect(daysBetween(date1, date2)).toBe(14);
      });
    });

    describe('getTrendDirection', () => {
      it('should return up for values above threshold', () => {
        expect(calculatorGetTrendDirection(10)).toBe('up');
      });

      it('should return down for values below negative threshold', () => {
        expect(calculatorGetTrendDirection(-10)).toBe('down');
      });

      it('should return stable for values within threshold', () => {
        expect(calculatorGetTrendDirection(3)).toBe('stable');
        expect(calculatorGetTrendDirection(-3)).toBe('stable');
      });

      it('should return stable for zero', () => {
        expect(calculatorGetTrendDirection(0)).toBe('stable');
      });

      it('should respect custom threshold', () => {
        expect(calculatorGetTrendDirection(3, 2)).toBe('up');
        expect(calculatorGetTrendDirection(-3, 2)).toBe('down');
      });

      it('should return stable for NaN', () => {
        expect(calculatorGetTrendDirection(NaN)).toBe('stable');
      });

      it('should return stable for non-number', () => {
        expect(calculatorGetTrendDirection('invalid')).toBe('stable');
      });
    });

    describe('getMetricStatus', () => {
      it('should return thriving for score >= 75', () => {
        expect(getMetricStatus(75)).toBe('thriving');
        expect(getMetricStatus(100)).toBe('thriving');
      });

      it('should return stable for score >= 50', () => {
        expect(getMetricStatus(50)).toBe('stable');
        expect(getMetricStatus(60)).toBe('stable');
      });

      it('should return cooling for score >= 25', () => {
        expect(getMetricStatus(25)).toBe('cooling');
        expect(getMetricStatus(40)).toBe('cooling');
      });

      it('should return at_risk for score < 25', () => {
        expect(getMetricStatus(0)).toBe('at_risk');
        expect(getMetricStatus(20)).toBe('at_risk');
      });

      it('should return stable for NaN', () => {
        expect(getMetricStatus(NaN)).toBe('stable');
      });

      it('should return stable for non-number', () => {
        expect(getMetricStatus('invalid')).toBe('stable');
      });
    });

    describe('getDefaultMetric', () => {
      it('should return velocity default', () => {
        const result = getDefaultMetric('velocity');
        expect(result.label).toBe('Commit data unavailable');
        expect(result.status).toBe('stable');
      });

      it('should return momentum default', () => {
        const result = getDefaultMetric('momentum');
        expect(result.label).toBe('Growth data unavailable');
      });

      it('should return issues default', () => {
        const result = getDefaultMetric('issues');
        expect(result.value).toBe('Cool');
        expect(result.temperature).toBe('cool');
      });

      it('should return prs default', () => {
        const result = getDefaultMetric('prs');
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
      });

      it('should return generic default for unknown type', () => {
        const result = getDefaultMetric('unknown');
        expect(result.label).toBe('unknown data unavailable');
      });

      it('should return generic default for no type', () => {
        const result = getDefaultMetric();
        expect(result.label).toBe('Data unavailable');
      });
    });

    describe('clamp', () => {
      it('should clamp value above max', () => {
        expect(clamp(150, 0, 100)).toBe(100);
      });

      it('should clamp value below min', () => {
        expect(clamp(-10, 0, 100)).toBe(0);
      });

      it('should return value within range', () => {
        expect(clamp(50, 0, 100)).toBe(50);
      });

      it('should handle value at boundaries', () => {
        expect(clamp(0, 0, 100)).toBe(0);
        expect(clamp(100, 0, 100)).toBe(100);
      });

      it('should return min for NaN', () => {
        expect(clamp(NaN, 0, 100)).toBe(0);
      });

      it('should return min for non-number', () => {
        expect(clamp('invalid', 0, 100)).toBe(0);
      });
    });

    describe('percentageChange', () => {
      it('should calculate positive percentage change', () => {
        expect(percentageChange(120, 100)).toBe(20);
      });

      it('should calculate negative percentage change', () => {
        expect(percentageChange(80, 100)).toBe(-20);
      });

      it('should return 0 for same values', () => {
        expect(percentageChange(100, 100)).toBe(0);
      });

      it('should return 100 for growth from zero', () => {
        expect(percentageChange(50, 0)).toBe(100);
      });

      it('should return -100 for decline to negative from zero', () => {
        expect(percentageChange(-50, 0)).toBe(-100);
      });

      it('should return 0 for zero to zero', () => {
        expect(percentageChange(0, 0)).toBe(0);
      });

      it('should return 0 for NaN values', () => {
        expect(percentageChange(NaN, 100)).toBe(0);
        expect(percentageChange(100, NaN)).toBe(0);
      });

      it('should return 0 for non-numbers', () => {
        expect(percentageChange('invalid', 100)).toBe(0);
      });
    });

    describe('safeParseDate', () => {
      it('should parse valid ISO date string', () => {
        const result = safeParseDate('2024-06-15T12:00:00Z');
        expect(result).toBeInstanceOf(Date);
        expect(result.getFullYear()).toBe(2024);
        expect(result.getMonth()).toBe(5); // June (0-indexed)
      });

      it('should return Date object as-is', () => {
        const date = new Date('2024-01-01');
        const result = safeParseDate(date);
        expect(result).toBeInstanceOf(Date);
      });

      it('should return null for invalid date', () => {
        expect(safeParseDate('invalid')).toBeNull();
      });

      it('should return null for null', () => {
        expect(safeParseDate(null)).toBeNull();
      });

      it('should return null for undefined', () => {
        expect(safeParseDate(undefined)).toBeNull();
      });

      it('should return null for empty string', () => {
        expect(safeParseDate('')).toBeNull();
      });
    });

    describe('emptySparkline', () => {
      it('should create array of zeros', () => {
        const result = emptySparkline(5);
        expect(result).toEqual([0, 0, 0, 0, 0]);
      });

      it('should handle zero length', () => {
        expect(emptySparkline(0)).toEqual([]);
      });

      it('should floor decimal length', () => {
        const result = emptySparkline(3.7);
        expect(result).toEqual([0, 0, 0]);
      });

      it('should return empty array for negative length', () => {
        expect(emptySparkline(-5)).toEqual([]);
      });

      it('should return empty array for non-number', () => {
        expect(emptySparkline('invalid')).toEqual([]);
      });
    });
  });

  // ==========================================================================
  // CALCULATOR FUNCTIONS
  // ==========================================================================

  describe('Calculator Functions', () => {
    describe('calculateVelocityScore', () => {
      it('should calculate velocity with thriving status', () => {
        // Recent weeks (last 4): 30 commits/week
        // Previous weeks (prior 12): 10 commits/week
        // Growth: 200% = thriving
        const participation = {
          all: Array(48).fill(10).concat(Array(4).fill(30))
        };
        const result = calculateVelocityScore(participation);

        expect(result.status).toBe('thriving');
        expect(result.direction).toBe('up');
        expect(result.value).toBe(30);
        expect(result.sparklineData).toHaveLength(13);
      });

      it('should calculate velocity with stable status', () => {
        // Flat activity
        const participation = {
          all: Array(52).fill(10)
        };
        const result = calculateVelocityScore(participation);

        expect(result.status).toBe('stable');
        expect(result.direction).toBe('stable');
        expect(result.value).toBe(10);
      });

      it('should calculate velocity with cooling status', () => {
        // Moderate decline: -15 to -30% range for cooling
        const participation = {
          all: Array(48).fill(20).concat(Array(4).fill(15))
        };
        const result = calculateVelocityScore(participation);

        expect(result.status).toBe('cooling');
        expect(result.direction).toBe('down');
      });

      it('should calculate velocity with at_risk status', () => {
        // Sharp decline
        const participation = {
          all: Array(48).fill(30).concat(Array(4).fill(5))
        };
        const result = calculateVelocityScore(participation);

        expect(result.status).toBe('at_risk');
        expect(result.direction).toBe('down');
      });

      it('should return default for null participation', () => {
        const result = calculateVelocityScore(null);
        expect(result.status).toBe('stable');
        expect(result.label).toBe('Commit data unavailable');
      });

      it('should return default for missing all array', () => {
        const result = calculateVelocityScore({});
        expect(result.label).toBe('Commit data unavailable');
      });

      it('should handle insufficient data', () => {
        const participation = { all: [1, 2] };
        const result = calculateVelocityScore(participation);
        expect(result.label).toBe('Insufficient commit history');
      });

      it('should include metadata', () => {
        const participation = {
          all: Array(52).fill(10)
        };
        const result = calculateVelocityScore(participation);

        expect(result).toHaveProperty('recentAvg');
        expect(result).toHaveProperty('previousAvg');
        expect(result).toHaveProperty('score');
      });
    });

    describe('calculateCommunityMomentum', () => {
      it('should calculate momentum for popular repo', () => {
        const repo = {
          stargazers_count: 10000,
          forks_count: 1000,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateCommunityMomentum(repo);

        expect(result.value).toBe(10000);
        expect(result.status).toBe('thriving');
        expect(result).toHaveProperty('forkRatio');
      });

      it('should calculate momentum for emerging repo', () => {
        const repo = {
          stargazers_count: 50,
          forks_count: 5,
          created_at: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateCommunityMomentum(repo);

        expect(result.value).toBe(50);
        expect(result.sparklineData).toHaveLength(30);
      });

      it('should handle recent events for growth calculation', () => {
        const repo = {
          stargazers_count: 100,
          forks_count: 10,
          created_at: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString()
        };
        const events = [
          { type: 'WatchEvent', created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
          { type: 'WatchEvent', created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
          { type: 'ForkEvent', created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
        ];
        const result = calculateCommunityMomentum(repo, events);

        expect(result.recentStars).toBe(2);
        expect(result.recentForks).toBe(1);
      });

      it('should format large star counts with K suffix', () => {
        const repo = {
          stargazers_count: 5500,
          forks_count: 500,
          created_at: '2020-01-01'
        };
        const result = calculateCommunityMomentum(repo);

        expect(result.label).toContain('5.5K');
      });

      it('should return default for null repo', () => {
        const result = calculateCommunityMomentum(null);
        expect(result.label).toBe('Growth data unavailable');
      });

      it('should handle zero stars', () => {
        const repo = {
          stargazers_count: 0,
          forks_count: 0,
          created_at: '2024-01-01'
        };
        const result = calculateCommunityMomentum(repo);

        expect(result.value).toBe(0);
        expect(result.forkRatio).toBe(0);
      });
    });

    describe('calculateIssueTemperature', () => {
      it('should calculate cool temperature for healthy repos', () => {
        const issues = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' }
        ];
        const result = calculateIssueTemperature(issues);

        expect(result.temperature).toBe('cool');
        expect(result.status).toBe('thriving');
        expect(result.value).toBe('Cool');
      });

      it('should calculate warm temperature for moderate activity', () => {
        // Warm: 40-70% close rate. 3 closed out of 6 total = 50%
        const issues = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' },
          { created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' },
          { created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' }
        ];
        const result = calculateIssueTemperature(issues);

        expect(result.temperature).toBe('warm');
        expect(result.status).toBe('stable');
      });

      it('should calculate hot temperature for problematic repos', () => {
        // Hot: 20-40% close rate. 3 closed out of 10 total = 30%
        const issues = Array(10).fill(0).map((_, i) => ({
          created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
          state: i < 3 ? 'closed' : 'open',
          closed_at: i < 3 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString() : null
        }));
        const result = calculateIssueTemperature(issues);

        expect(result.temperature).toBe('hot');
        expect(result.status).toBe('cooling');
      });

      it('should calculate response time', () => {
        const issues = [
          { created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' }
        ];
        const result = calculateIssueTemperature(issues);

        expect(result.avgResponseDays).toBeGreaterThan(0);
        expect(result.label).toContain('avg');
      });

      it('should return default for no issues', () => {
        const result = calculateIssueTemperature([]);
        expect(result.temperature).toBe('cool');
        expect(result.label).toBe('No recent issues');
      });

      it('should filter issues by window (30 days)', () => {
        const oldIssue = {
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          state: 'open'
        };
        const recentIssue = {
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          state: 'open'
        };
        const result = calculateIssueTemperature([oldIssue, recentIssue]);

        expect(result.totalCount).toBe(1);
      });

      it('should include sparkline data', () => {
        const issues = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' }
        ];
        const result = calculateIssueTemperature(issues);

        expect(result.sparklineData).toHaveLength(30);
      });
    });

    describe('calculatePRHealth', () => {
      it('should calculate excellent PR health', () => {
        const prs = Array(10).fill(0).map((_, i) => ({
          created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
          merged_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          merged: true,
          state: 'closed'
        }));
        const result = calculatePRHealth(prs);

        expect(result.mergeRate).toBeGreaterThan(90);
        expect(result.status).toBe('thriving');
      });

      it('should calculate PR funnel correctly', () => {
        const prs = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), merged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), merged: true, state: 'closed' },
          { created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), merged_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(), merged: true, state: 'closed' },
          { created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' },
          { created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' }
        ];
        const result = calculatePRHealth(prs);

        expect(result.funnel.opened).toBe(4);
        expect(result.funnel.merged).toBe(2);
        expect(result.funnel.closed).toBe(1);
        expect(result.funnel.open).toBe(1);
      });

      it('should calculate time to merge', () => {
        const prs = [
          { created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), merged_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), merged: true, state: 'closed' }
        ];
        const result = calculatePRHealth(prs);

        expect(result.avgTimeToMerge).toBeGreaterThan(0);
        expect(result.label).toContain('avg');
      });

      it('should return default for no PRs', () => {
        const result = calculatePRHealth([]);
        expect(result.label).toBe('No recent pull requests');
        expect(result.funnel).toEqual({ opened: 0, merged: 0, closed: 0, open: 0 });
      });

      it('should filter PRs by window (30 days)', () => {
        const oldPR = {
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          merged: true,
          state: 'closed'
        };
        const recentPR = {
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          merged: true,
          state: 'closed'
        };
        const result = calculatePRHealth([oldPR, recentPR]);

        expect(result.totalOpened).toBe(1);
      });

      it('should include sparkline data', () => {
        const prs = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), merged: true, state: 'closed' }
        ];
        const result = calculatePRHealth(prs);

        expect(result.sparklineData).toHaveLength(30);
      });

      it('should handle only open PRs', () => {
        const prs = [
          { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), state: 'open' }
        ];
        const result = calculatePRHealth(prs);

        expect(result.label).toContain('open PRs');
      });
    });

    describe('calculateBusFactor', () => {
      it('should calculate high bus factor for distributed contributions', () => {
        const contributors = [
          { total: 100, author: { login: 'dev1' } },
          { total: 90, author: { login: 'dev2' } },
          { total: 80, author: { login: 'dev3' } },
          { total: 70, author: { login: 'dev4' } },
          { total: 60, author: { login: 'dev5' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.value).toBeGreaterThan(5);
        expect(result.riskLevel).toBe('healthy');
        expect(result.status).toBe('thriving');
      });

      it('should calculate low bus factor for concentrated contributions', () => {
        const contributors = [
          { total: 900, author: { login: 'solo' } },
          { total: 50, author: { login: 'dev2' } },
          { total: 50, author: { login: 'dev3' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.value).toBeLessThanOrEqual(3);
        expect(result.riskLevel).toBe('critical');
      });

      it('should calculate bus factor for single contributor', () => {
        const contributors = [
          { total: 500, author: { login: 'solo' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.value).toBe(1);
        expect(result.riskLevel).toBe('critical');
        expect(result.status).toBe('at_risk');
        expect(result.topConcentration).toBe(100);
      });

      it('should calculate significant contributors correctly', () => {
        const contributors = [
          { total: 100, author: { login: 'dev1' } },
          { total: 50, author: { login: 'dev2' } },
          { total: 30, author: { login: 'dev3' } },
          { total: 20, author: { login: 'dev4' } },
          { total: 5, author: { login: 'dev5' } },  // Below 5% threshold
          { total: 3, author: { login: 'dev6' } }   // Below 5% threshold
        ];
        const result = calculateBusFactor(contributors);

        expect(result.significantContributors).toBe(4);
      });

      it('should return default for null contributors', () => {
        const result = calculateBusFactor(null);
        expect(result.value).toBe(1);
        expect(result.riskLevel).toBe('critical');
        expect(result.label).toBe('Contributor data unavailable');
      });

      it('should return default for empty array', () => {
        const result = calculateBusFactor([]);
        expect(result.riskLevel).toBe('critical');
      });

      it('should filter out invalid contributors', () => {
        const contributors = [
          { total: 100, author: { login: 'dev1' } },
          { total: 0, author: { login: 'dev2' } },  // Zero contributions
          { total: 50, author: null },               // No author
          null,                                       // Null entry
          { total: 30, author: { login: 'dev3' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.contributorCount).toBe(2);
      });

      it('should include sparkline with contributor distribution', () => {
        const contributors = [
          { total: 100, author: { login: 'dev1' } },
          { total: 50, author: { login: 'dev2' } },
          { total: 30, author: { login: 'dev3' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.sparklineData).toHaveLength(10);
        expect(result.sparklineData[0]).toBeGreaterThan(0); // Top contributor percentage
      });

      it('should calculate 80% threshold contributors', () => {
        const contributors = [
          { total: 400, author: { login: 'dev1' } },
          { total: 200, author: { login: 'dev2' } },
          { total: 100, author: { login: 'dev3' } },
          { total: 100, author: { login: 'dev4' } },
          { total: 100, author: { login: 'dev5' } },
          { total: 100, author: { login: 'dev6' } }
        ];
        const result = calculateBusFactor(contributors);

        expect(result.contributorsFor80Percent).toBeLessThanOrEqual(contributors.length);
      });
    });

    describe('calculateFreshnessIndex', () => {
      it('should calculate fresh status for recent activity', () => {
        // Fresh requires <= 7 days since push
        const repo = {
          pushed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        };
        const releases = [
          { published_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), tag_name: 'v1.0.0' }
        ];
        const result = calculateFreshnessIndex(repo, releases);

        expect(result.freshness).toBe('fresh');
        expect(result.status).toBe('thriving');
      });

      it('should calculate recent status for moderate activity', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.freshness).toBe('recent');
        expect(result.status).toBe('stable');
      });

      it('should calculate aging status for older repos', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.freshness).toBe('aging');
        expect(result.status).toBe('cooling');
      });

      it('should calculate stale status for very old repos', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 150 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.freshness).toBe('stale');
        expect(result.status).toBe('at_risk');
      });

      it('should include release data in calculation', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        };
        const releases = [
          { published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), tag_name: 'v1.0.0' }
        ];
        const result = calculateFreshnessIndex(repo, releases);

        expect(result.lastRelease).toBe('v1.0.0');
        expect(result.daysSinceRelease).toBeLessThan(10);
      });

      it('should handle no releases', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo, []);

        expect(result.lastRelease).toBe('None');
        expect(result.daysSinceRelease).toBeNull();
      });

      it('should return default for null repo', () => {
        const result = calculateFreshnessIndex(null);
        expect(result.freshness).toBe('stale');
        expect(result.label).toBe('Update data unavailable');
      });

      it('should format label for today', () => {
        const repo = {
          pushed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.label).toContain('today');
      });

      it('should format label for weeks ago', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.label).toMatch(/\d+w ago/);
      });

      it('should include weighted score', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.value).toBeGreaterThan(0);
        expect(result.value).toBeLessThanOrEqual(100);
        expect(result).toHaveProperty('pushScore');
        expect(result).toHaveProperty('releaseScore');
        expect(result).toHaveProperty('updateScore');
      });

      it('should include sparkline data', () => {
        const repo = {
          pushed_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        };
        const result = calculateFreshnessIndex(repo);

        expect(result.sparklineData).toHaveLength(10);
      });
    });

    describe('calculateOverallPulse', () => {
      it('should calculate thriving overall status', () => {
        const metrics = {
          velocity: { status: 'thriving', score: 90 },
          momentum: { status: 'thriving', score: 85 },
          issues: { status: 'thriving', score: 80 },
          prs: { status: 'stable', score: 70 },
          busFactor: { status: 'stable', score: 75 },
          freshness: { status: 'thriving', score: 95 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.status).toBe('thriving');
        expect(result.score).toBeGreaterThan(75);
        expect(result.concerns.count).toBe(0);
      });

      it('should calculate stable overall status', () => {
        const metrics = {
          velocity: { status: 'stable', score: 60 },
          momentum: { status: 'stable', score: 65 },
          issues: { status: 'stable', score: 55 },
          prs: { status: 'stable', score: 70 },
          busFactor: { status: 'stable', score: 60 },
          freshness: { status: 'stable', score: 65 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.status).toBe('stable');
        expect(result.concerns.count).toBe(0);
      });

      it('should identify concerns correctly', () => {
        const metrics = {
          velocity: { status: 'thriving', score: 80 },
          momentum: { status: 'stable', score: 60 },
          issues: { status: 'cooling', score: 35 },
          prs: { status: 'at_risk', score: 20 },
          busFactor: { status: 'cooling', score: 30 },
          freshness: { status: 'stable', score: 55 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.concerns.count).toBe(3);
        expect(result.concerns.metrics).toHaveLength(3);
        expect(result.concerns.metrics[0].severity).toBe('high'); // at_risk comes first
      });

      it('should handle missing metrics gracefully', () => {
        const metrics = {
          velocity: { status: 'stable', score: 60 },
          momentum: null,
          issues: undefined,
          prs: { status: 'stable', score: 65 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.status).toBeDefined();
        expect(result.score).toBeGreaterThan(0);
      });

      it('should return default for null metrics', () => {
        const result = calculateOverallPulse(null);
        expect(result.status).toBe('stable');
        expect(result.label).toBe('Insufficient data for analysis');
      });

      it('should calculate pulse speed based on status', () => {
        const metrics = {
          velocity: { status: 'thriving', score: 90 },
          momentum: { status: 'thriving', score: 90 },
          issues: { status: 'thriving', score: 90 },
          prs: { status: 'thriving', score: 90 },
          busFactor: { status: 'thriving', score: 90 },
          freshness: { status: 'thriving', score: 90 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.pulseSpeed).toBe(800); // Fast pulse for thriving
      });

      it('should include breakdown of all metrics', () => {
        const metrics = {
          velocity: { status: 'thriving', score: 90 },
          momentum: { status: 'stable', score: 60 },
          issues: { status: 'cooling', score: 35 },
          prs: { status: 'at_risk', score: 20 },
          busFactor: { status: 'stable', score: 65 },
          freshness: { status: 'thriving', score: 85 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.breakdown).toHaveProperty('velocity');
        expect(result.breakdown).toHaveProperty('momentum');
        expect(result.breakdown).toHaveProperty('issues');
        expect(result.breakdown).toHaveProperty('prs');
        expect(result.breakdown).toHaveProperty('busFactor');
        expect(result.breakdown).toHaveProperty('freshness');
      });

      it('should calculate average trend', () => {
        const metrics = {
          velocity: { status: 'stable', score: 60, trend: 10 },
          momentum: { status: 'stable', score: 60, trend: 5 },
          issues: { status: 'stable', score: 60, trend: -5 },
          prs: { status: 'stable', score: 60, trend: 0 },
          busFactor: { status: 'stable', score: 60, trend: 0 },
          freshness: { status: 'stable', score: 60, trend: 0 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.trend).toBeDefined();
        expect(result.direction).toBeDefined();
      });

      it('should include status labels and descriptions', () => {
        const metrics = {
          velocity: { status: 'stable', score: 60 },
          momentum: { status: 'stable', score: 60 },
          issues: { status: 'stable', score: 60 },
          prs: { status: 'stable', score: 60 },
          busFactor: { status: 'stable', score: 60 },
          freshness: { status: 'stable', score: 60 }
        };
        const result = calculateOverallPulse(metrics);

        expect(result.statusLabel).toBeDefined();
        expect(result.statusDescription).toBeDefined();
      });
    });

    describe('calculateAllMetrics', () => {
      it('should calculate all metrics from pulse data', () => {
        const pulseData = {
          repo: {
            stargazers_count: 1000,
            forks_count: 100,
            created_at: '2020-01-01',
            pushed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          participation: {
            all: Array(52).fill(10)
          },
          issues: [
            { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), closed_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), state: 'closed' }
          ],
          prs: [
            { created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), merged_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), merged: true, state: 'closed' }
          ],
          contributors: [
            { total: 100, author: { login: 'dev1' } },
            { total: 50, author: { login: 'dev2' } }
          ],
          events: [],
          releases: []
        };
        const result = calculateAllMetrics(pulseData);

        expect(result).toHaveProperty('metrics');
        expect(result).toHaveProperty('overall');
        expect(result.metrics).toHaveProperty('velocity');
        expect(result.metrics).toHaveProperty('momentum');
        expect(result.metrics).toHaveProperty('issues');
        expect(result.metrics).toHaveProperty('prs');
        expect(result.metrics).toHaveProperty('busFactor');
        expect(result.metrics).toHaveProperty('freshness');
      });

      it('should handle minimal data', () => {
        const pulseData = {
          repo: { stargazers_count: 10 }
        };
        const result = calculateAllMetrics(pulseData);

        expect(result.metrics.velocity).toBeDefined();
        expect(result.metrics.momentum).toBeDefined();
        expect(result.overall).toBeDefined();
      });

      it('should return defaults for null data', () => {
        const result = calculateAllMetrics(null);

        expect(result.metrics.velocity.status).toBe('stable');
        expect(result.overall.status).toBe('stable');
      });

      it('should return defaults for empty object', () => {
        const result = calculateAllMetrics({});

        expect(result.metrics).toBeDefined();
        expect(result.overall).toBeDefined();
      });

      it('should calculate overall pulse from individual metrics', () => {
        const pulseData = {
          repo: {
            stargazers_count: 10000,
            forks_count: 1000,
            created_at: '2020-01-01',
            pushed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          participation: {
            all: Array(48).fill(10).concat(Array(4).fill(30))
          },
          issues: Array(5).fill(0).map((_, i) => ({
            created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
            closed_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            state: 'closed'
          })),
          prs: Array(5).fill(0).map((_, i) => ({
            created_at: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000).toISOString(),
            merged_at: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
            merged: true,
            state: 'closed'
          })),
          contributors: [
            { total: 100, author: { login: 'dev1' } },
            { total: 90, author: { login: 'dev2' } },
            { total: 80, author: { login: 'dev3' } }
          ],
          events: [],
          releases: [
            { published_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), tag_name: 'v1.0.0' }
          ]
        };
        const result = calculateAllMetrics(pulseData);

        expect(result.overall.status).toBeTruthy();
        expect(result.overall.score).toBeGreaterThan(0);
        expect(result.overall.concerns).toBeDefined();
      });
    });
  });
});
