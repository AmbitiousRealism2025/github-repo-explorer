import { describe, it, expect, beforeEach } from 'vitest';
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
