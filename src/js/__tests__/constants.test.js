import { describe, it, expect } from 'vitest';
import {
  API_BASE,
  API_VERSION,
  CACHE_TTL_MS,
  CACHE_MAX_ENTRIES,
  DEFAULT_PER_PAGE,
  MAX_SEARCH_PAGES,
  MAX_SEARCH_RESULTS,
  STORAGE_VERSION,
  STORAGE_KEYS,
  DEBOUNCE_SEARCH_MS,
  DEBOUNCE_FILTER_MS,
  TRENDING_DAYS_BACK,
  TOAST_DURATION_MS,
  TOAST_FADE_MS,
  TRENDING_CATEGORIES
} from '../constants.js';

describe('Constants', () => {
  describe('API Constants', () => {
    it('should have API_BASE defined', () => {
      expect(API_BASE).toBe('https://api.github.com');
    });

    it('should have API_VERSION defined', () => {
      expect(API_VERSION).toBe('2022-11-28');
    });
  });

  describe('Cache Constants', () => {
    it('should have CACHE_TTL_MS as 5 minutes', () => {
      expect(CACHE_TTL_MS).toBe(5 * 60 * 1000);
    });

    it('should have CACHE_MAX_ENTRIES as 50', () => {
      expect(CACHE_MAX_ENTRIES).toBe(50);
    });
  });

  describe('Search Constants', () => {
    it('should have DEFAULT_PER_PAGE as 30', () => {
      expect(DEFAULT_PER_PAGE).toBe(30);
    });

    it('should have MAX_SEARCH_PAGES as 34', () => {
      expect(MAX_SEARCH_PAGES).toBe(34);
    });

    it('should have MAX_SEARCH_RESULTS as 1000', () => {
      expect(MAX_SEARCH_RESULTS).toBe(1000);
    });
  });

  describe('Storage Constants', () => {
    it('should have STORAGE_VERSION defined', () => {
      expect(STORAGE_VERSION).toBe('1.0');
    });

    it('should have all STORAGE_KEYS defined', () => {
      expect(STORAGE_KEYS.FAVORITES).toBe('gh-explorer-favorites');
      expect(STORAGE_KEYS.THEME).toBe('gh-explorer-theme');
      expect(STORAGE_KEYS.TOKEN).toBe('gh-token');
    });
  });

  describe('UI Constants', () => {
    it('should have DEBOUNCE_SEARCH_MS as 500', () => {
      expect(DEBOUNCE_SEARCH_MS).toBe(500);
    });

    it('should have DEBOUNCE_FILTER_MS as 300', () => {
      expect(DEBOUNCE_FILTER_MS).toBe(300);
    });

    it('should have TRENDING_DAYS_BACK as 7', () => {
      expect(TRENDING_DAYS_BACK).toBe(7);
    });

    it('should have TOAST_DURATION_MS as 4000', () => {
      expect(TOAST_DURATION_MS).toBe(4000);
    });

    it('should have TOAST_FADE_MS as 300', () => {
      expect(TOAST_FADE_MS).toBe(300);
    });
  });

  describe('Trending Categories', () => {
    it('should have TRENDING_CATEGORIES defined', () => {
      expect(TRENDING_CATEGORIES).toBeDefined();
    });

    it('should have "all" category as first entry', () => {
      expect(TRENDING_CATEGORIES.all).toBeDefined();
      expect(TRENDING_CATEGORIES.all.label).toBe('All Categories');
      expect(TRENDING_CATEGORIES.all.topics).toEqual([]);
      expect(TRENDING_CATEGORIES.all.keywords).toEqual([]);
    });

    it('should have 8 categories total', () => {
      expect(Object.keys(TRENDING_CATEGORIES)).toHaveLength(8);
    });

    it('should have required properties for each category', () => {
      Object.entries(TRENDING_CATEGORIES).forEach(([key, value]) => {
        expect(value).toHaveProperty('label');
        expect(value).toHaveProperty('topics');
        expect(value).toHaveProperty('keywords');
        expect(Array.isArray(value.topics)).toBe(true);
        expect(Array.isArray(value.keywords)).toBe(true);
      });
    });
  });
});
