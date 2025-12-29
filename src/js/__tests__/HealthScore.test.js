import { describe, it, expect } from 'vitest';
import { calculateHealthScore, createHealthScore } from '../components/HealthScore.js';

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

describe('HealthScore', () => {
  describe('calculateHealthScore', () => {
    describe('Maintenance Score', () => {
      it('should score 100 for repo pushed within 7 days', () => {
        const repo = createMockRepo({ pushed_at: new Date().toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(100);
      });

      it('should score 80 for repo pushed within 30 days', () => {
        const date = new Date();
        date.setDate(date.getDate() - 15);
        const repo = createMockRepo({ pushed_at: date.toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(80);
      });

      it('should score 60 for repo pushed within 90 days', () => {
        const date = new Date();
        date.setDate(date.getDate() - 60);
        const repo = createMockRepo({ pushed_at: date.toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(60);
      });

      it('should score 40 for repo pushed within 180 days', () => {
        const date = new Date();
        date.setDate(date.getDate() - 120);
        const repo = createMockRepo({ pushed_at: date.toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(40);
      });

      it('should score 20 for repo pushed within 365 days', () => {
        const date = new Date();
        date.setDate(date.getDate() - 300);
        const repo = createMockRepo({ pushed_at: date.toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(20);
      });

      it('should score 10 for repo pushed over 365 days ago', () => {
        const date = new Date();
        date.setDate(date.getDate() - 400);
        const repo = createMockRepo({ pushed_at: date.toISOString() });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.maintenance).toBe(10);
      });
    });

    describe('Community Score', () => {
      it('should score 100 for 10000+ stars', () => {
        const repo = createMockRepo({ stargazers_count: 15000 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(100);
      });

      it('should score 80 for 1000+ stars', () => {
        const repo = createMockRepo({ stargazers_count: 5000 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(80);
      });

      it('should score 60 for 100+ stars', () => {
        const repo = createMockRepo({ stargazers_count: 500 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(60);
      });

      it('should score 40 for 10+ stars', () => {
        const repo = createMockRepo({ stargazers_count: 50 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(40);
      });

      it('should score 20 for less than 10 stars', () => {
        const repo = createMockRepo({ stargazers_count: 5 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(20);
      });

      it('should handle null stargazers_count', () => {
        const repo = createMockRepo({ stargazers_count: null });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.community).toBe(20);
      });
    });

    describe('Documentation Score', () => {
      it('should score higher with readme', () => {
        const repo = createMockRepo();
        const withReadme = calculateHealthScore(repo, { hasReadme: true });
        const withoutReadme = calculateHealthScore(repo, { hasReadme: false });
        expect(withReadme.breakdown.documentation).toBeGreaterThan(withoutReadme.breakdown.documentation);
      });

      it('should add points for license', () => {
        const repoWithLicense = createMockRepo({ license: { name: 'MIT' } });
        const repoWithoutLicense = createMockRepo({ license: null });
        const withLicense = calculateHealthScore(repoWithLicense);
        const withoutLicense = calculateHealthScore(repoWithoutLicense);
        expect(withLicense.breakdown.documentation).toBeGreaterThan(withoutLicense.breakdown.documentation);
      });

      it('should add points for homepage', () => {
        const repoWithHomepage = createMockRepo({ homepage: 'https://example.com' });
        const repoWithoutHomepage = createMockRepo({ homepage: null });
        const withHomepage = calculateHealthScore(repoWithHomepage);
        const withoutHomepage = calculateHealthScore(repoWithoutHomepage);
        expect(withHomepage.breakdown.documentation).toBeGreaterThan(withoutHomepage.breakdown.documentation);
      });

      it('should add points for description', () => {
        const repoWithDesc = createMockRepo({ description: 'A great repo' });
        const repoWithoutDesc = createMockRepo({ description: null });
        const withDesc = calculateHealthScore(repoWithDesc);
        const withoutDesc = calculateHealthScore(repoWithoutDesc);
        expect(withDesc.breakdown.documentation).toBeGreaterThan(withoutDesc.breakdown.documentation);
      });

      it('should cap documentation at 100', () => {
        const repo = createMockRepo({
          license: { name: 'MIT' },
          homepage: 'https://example.com',
          description: 'Test'
        });
        const result = calculateHealthScore(repo, { hasReadme: true });
        expect(result.breakdown.documentation).toBeLessThanOrEqual(100);
      });
    });

    describe('Activity Score', () => {
      it('should score 100 for 10+ active weeks in last 12 weeks', () => {
        const commitActivity = Array(52).fill(null).map((_, i) => ({
          week: Date.now() / 1000 - (51 - i) * 7 * 24 * 60 * 60,
          total: i >= 40 ? 10 : 0
        }));
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity });
        expect(result.breakdown.activity).toBe(100);
      });

      it('should score 80 for 6+ active weeks', () => {
        const commitActivity = Array(52).fill(null).map((_, i) => ({
          week: Date.now() / 1000 - (51 - i) * 7 * 24 * 60 * 60,
          total: i >= 44 ? 10 : 0
        }));
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity });
        expect(result.breakdown.activity).toBe(80);
      });

      it('should score 60 for 3+ active weeks', () => {
        const commitActivity = Array(52).fill(null).map((_, i) => ({
          week: Date.now() / 1000 - (51 - i) * 7 * 24 * 60 * 60,
          total: i >= 48 ? 10 : 0
        }));
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity });
        expect(result.breakdown.activity).toBe(60);
      });

      it('should score 40 for 1+ active weeks', () => {
        const commitActivity = Array(52).fill(null).map((_, i) => ({
          week: Date.now() / 1000 - (51 - i) * 7 * 24 * 60 * 60,
          total: i === 51 ? 10 : 0
        }));
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity });
        expect(result.breakdown.activity).toBe(40);
      });

      it('should score 20 for no active weeks', () => {
        const commitActivity = Array(52).fill(null).map(() => ({
          week: Date.now() / 1000,
          total: 0
        }));
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity });
        expect(result.breakdown.activity).toBe(20);
      });

      it('should fallback to push date when no commit activity', () => {
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity: null });
        expect(result.breakdown.activity).toBeGreaterThan(0);
      });

      it('should handle empty commit activity array', () => {
        const repo = createMockRepo();
        const result = calculateHealthScore(repo, { commitActivity: [] });
        expect(result.breakdown.activity).toBeGreaterThan(0);
      });
    });

    describe('Engagement Score', () => {
      it('should score 100 for 1000+ forks', () => {
        const repo = createMockRepo({ forks_count: 1500 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.engagement).toBe(100);
      });

      it('should score 80 for 100+ forks', () => {
        const repo = createMockRepo({ forks_count: 500 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.engagement).toBe(80);
      });

      it('should score 60 for 10+ forks', () => {
        const repo = createMockRepo({ forks_count: 50 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.engagement).toBe(60);
      });

      it('should score 40 for 1+ forks', () => {
        const repo = createMockRepo({ forks_count: 5 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.engagement).toBe(40);
      });

      it('should score 20 for 0 forks', () => {
        const repo = createMockRepo({ forks_count: 0 });
        const result = calculateHealthScore(repo);
        expect(result.breakdown.engagement).toBe(20);
      });
    });

    describe('Total Score', () => {
      it('should return weighted total score', () => {
        const repo = createMockRepo();
        const result = calculateHealthScore(repo);
        expect(result.total).toBeGreaterThanOrEqual(0);
        expect(result.total).toBeLessThanOrEqual(100);
      });

      it('should return breakdown and weights', () => {
        const repo = createMockRepo();
        const result = calculateHealthScore(repo);
        expect(result.breakdown).toBeDefined();
        expect(result.weights).toBeDefined();
        expect(result.weights.maintenance).toBe(30);
        expect(result.weights.community).toBe(25);
        expect(result.weights.documentation).toBe(15);
        expect(result.weights.activity).toBe(20);
        expect(result.weights.engagement).toBe(10);
      });
    });
  });

  describe('createHealthScore', () => {
    it('should create health score container element', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      expect(element.className).toBe('health-score');
    });

    it('should display score number', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      const scoreNumber = element.querySelector('.health-score__number');
      expect(scoreNumber).not.toBeNull();
      expect(parseInt(scoreNumber.textContent)).toBeGreaterThanOrEqual(0);
    });

    it('should display score label', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      const label = element.querySelector('.health-score__label');
      expect(label).not.toBeNull();
      expect(['Excellent', 'Good', 'Fair', 'Needs Work']).toContain(label.textContent);
    });

    it('should display breakdown metrics', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      const metrics = element.querySelectorAll('.health-score__metric');
      expect(metrics.length).toBe(5);
    });

    it('should show "Excellent" for score >= 80', () => {
      const repo = createMockRepo({
        stargazers_count: 50000,
        forks_count: 5000,
        pushed_at: new Date().toISOString()
      });
      const element = createHealthScore(repo, { hasReadme: true });
      expect(element.getAttribute('data-score-class')).toBe('excellent');
    });

    it('should show "Good" for score >= 60', () => {
      const repo = createMockRepo({
        stargazers_count: 1000,
        forks_count: 100,
        pushed_at: new Date().toISOString()
      });
      const element = createHealthScore(repo, { hasReadme: true });
      const scoreClass = element.getAttribute('data-score-class');
      expect(['excellent', 'good']).toContain(scoreClass);
    });

    it('should show "Needs Work" for score < 40', () => {
      const date = new Date();
      date.setDate(date.getDate() - 500);
      const repo = createMockRepo({
        stargazers_count: 1,
        forks_count: 0,
        pushed_at: date.toISOString(),
        license: null,
        homepage: null,
        description: null
      });
      const element = createHealthScore(repo, { hasReadme: false });
      expect(element.getAttribute('data-score-class')).toBe('poor');
    });

    it('should set score color CSS variable', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      expect(element.style.getPropertyValue('--health-score-color')).toBeTruthy();
    });

    it('should render SVG gauge', () => {
      const repo = createMockRepo();
      const element = createHealthScore(repo);
      const svg = element.querySelector('.health-score__ring');
      expect(svg).not.toBeNull();
    });
  });
});
