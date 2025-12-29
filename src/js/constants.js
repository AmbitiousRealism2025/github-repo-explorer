export const API_BASE = 'https://api.github.com';
export const API_VERSION = '2022-11-28';

export const CACHE_TTL_MS = 5 * 60 * 1000;
export const CACHE_MAX_ENTRIES = 50;

export const DEFAULT_PER_PAGE = 30;
export const MAX_SEARCH_PAGES = 34;
export const MAX_SEARCH_RESULTS = 1000;

export const STORAGE_VERSION = '1.0';
export const STORAGE_KEYS = {
  FAVORITES: 'gh-explorer-favorites',
  THEME: 'gh-explorer-theme',
  TOKEN: 'gh-token'
};

export const DEBOUNCE_SEARCH_MS = 500;
export const DEBOUNCE_FILTER_MS = 300;

export const TRENDING_DAYS_BACK = 7;

export const TOAST_DURATION_MS = 4000;
export const TOAST_FADE_MS = 300;
