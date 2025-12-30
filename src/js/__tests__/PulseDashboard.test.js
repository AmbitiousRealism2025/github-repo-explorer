import { describe, it, expect, beforeEach } from 'vitest';
import { createSparkline, createMiniSparkline, calculateTrend } from '../components/PulseDashboard/Sparkline.js';
import { createTrendArrow, createMiniTrendArrow, getTrendDirection, formatPercentage } from '../components/PulseDashboard/TrendArrow.js';

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
