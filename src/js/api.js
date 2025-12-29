import { API_BASE, API_VERSION, CACHE_TTL_MS, CACHE_MAX_ENTRIES, TRENDING_DAYS_BACK, TRENDING_CATEGORIES } from './constants.js';

const getHeaders = () => {
  const headers = {
    'Accept': 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION
  };
  
  const token = localStorage.getItem('gh-token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const cache = new Map();

const getCachedResponse = (url) => {
  const cached = cache.get(url);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
    cache.delete(url);
    return null;
  }
  
  console.log(`[Cache] HIT: ${url.substring(0, 60)}...`);
  return cached.data;
};

const setCachedResponse = (url, data) => {
  cache.set(url, { data, timestamp: Date.now() });
  
  if (cache.size > CACHE_MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
};

export const clearCache = () => {
  cache.clear();
  console.log('[Cache] Cleared');
};

const fetchWithRetry = async (url, retries = 3, backoff = 1000, useCache = true) => {
  if (useCache) {
    const cached = getCachedResponse(url);
    if (cached) return cached;
  }

  try {
    const response = await fetch(url, { headers: getHeaders() });
    
    if (response.status === 403) {
      const remaining = response.headers.get('x-ratelimit-remaining');
      const resetTime = response.headers.get('x-ratelimit-reset');
      
      if (remaining === '0') {
        const resetDate = new Date(parseInt(resetTime) * 1000);
        throw new Error(`Rate limit exceeded. Resets at ${resetDate.toLocaleTimeString()}`);
      }
      
      throw new Error('Forbidden: Check your access token');
    }
    
    if (response.status === 404) {
      throw new Error('Resource not found');
    }
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = {
      data: await response.json(),
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };

    if (useCache) {
      setCachedResponse(url, result);
    }

    return result;
  } catch (error) {
    if (retries > 0 && !error.message.includes('Rate limit')) {
      const jitter = Math.random() * 100;
      await sleep(backoff + jitter);
      return fetchWithRetry(url, retries - 1, backoff * 2, useCache);
    }
    throw error;
  }
};

export const searchRepositories = async (query, options = {}) => {
  const {
    language = '',
    minStars = 0,
    sort = 'stars',
    order = 'desc',
    page = 1,
    perPage = 30
  } = options;
  
  let q = query;
  if (language) q += `+language:${encodeURIComponent(language)}`;
  if (minStars > 0) q += `+stars:>=${minStars}`;
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};

export const getTrendingRepositories = async (options = {}) => {
  const {
    language = '',
    category = 'all',
    page = 1,
    perPage = 30
  } = options;
  
  const date = new Date();
  date.setDate(date.getDate() - TRENDING_DAYS_BACK);
  const dateStr = date.toISOString().split('T')[0];
  
  let q = `created:>${dateStr}`;
  
  if (language) {
    q += ` language:${language}`;
  }
  
  if (category && category !== 'all') {
    const categoryConfig = TRENDING_CATEGORIES[category];
    if (categoryConfig && (categoryConfig.topics.length > 0 || categoryConfig.keywords.length > 0)) {
      const topicFilters = categoryConfig.topics.map(t => `topic:${t}`);
      const keywordFilters = categoryConfig.keywords.map(k => `${k} in:name,description`);
      const allFilters = [...topicFilters, ...keywordFilters];
      
      if (allFilters.length > 0) {
        q += ` (${allFilters.join(' OR ')})`;
      }
    }
  }
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};

export const getRepository = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}`;
  return fetchWithRetry(url);
};

export const getRepositoryReadme = async (owner, repo) => {
  try {
    const url = `${API_BASE}/repos/${owner}/${repo}/readme`;
    const response = await fetchWithRetry(url);
    
    if (response.data.content) {
      const decoded = atob(response.data.content);
      return { ...response, data: { ...response.data, decodedContent: decoded } };
    }
    
    return response;
  } catch (error) {
    if (error.message.includes('not found')) {
      return { data: null, rateLimit: null };
    }
    throw error;
  }
};

export const getRepositoryLanguages = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/languages`;
  return fetchWithRetry(url);
};

export const getRepositoryEvents = async (owner, repo, perPage = 10) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/events?per_page=${perPage}`;
  return fetchWithRetry(url);
};

export const checkRateLimit = async () => {
  const url = `${API_BASE}/rate_limit`;
  return fetchWithRetry(url);
};

export const getCommitActivity = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/commit_activity`;
  return fetchWithRetry(url);
};
