import { API_BASE, API_VERSION, CACHE_TTL_MS, CACHE_MAX_ENTRIES, TRENDING_DAYS_BACK, TRENDING_CATEGORIES } from './constants.js';

const RETRY_CONFIG = { MAX_RETRIES: 3, INITIAL_BACKOFF_MS: 1000, BACKOFF_MULTIPLIER: 2 };

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

/**
 * Clears the internal API response cache
 * @returns {void}
 */
export const clearCache = () => {
  cache.clear();
  console.log('[Cache] Cleared');
};

const fetchWithRetry = async (url, retries = RETRY_CONFIG.MAX_RETRIES, backoff = RETRY_CONFIG.INITIAL_BACKOFF_MS, useCache = true) => {
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
    const isHttpError = error.message.startsWith('HTTP ') ||
      error.message.includes('Rate limit') ||
      error.message.includes('Resource not found') ||
      error.message.includes('Forbidden');
    
    if (retries > 0 && !isHttpError) {
      const jitter = Math.random() * 100;
      await sleep(backoff + jitter);
      return fetchWithRetry(url, retries - 1, backoff * RETRY_CONFIG.BACKOFF_MULTIPLIER, useCache);
    }
    throw error;
  }
};

/**
 * Searches GitHub repositories with optional filters
 * @param {string} query - Search query string
 * @param {Object} [options={}] - Search options
 * @param {string} [options.language=''] - Filter by programming language
 * @param {number} [options.minStars=0] - Minimum star count filter
 * @param {string} [options.sort='stars'] - Sort field (stars, forks, updated)
 * @param {string} [options.order='desc'] - Sort order (asc, desc)
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.perPage=30] - Results per page (max 100)
 * @returns {Promise<{data: {items: Array, total_count: number}, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails after retries or rate limit exceeded
 */
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
  if (language) q += `+language:${language}`;
  if (minStars > 0) q += `+stars:>=${minStars}`;
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=${order}&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};

/**
 * Fetches trending repositories created within the last 7 days
 * @param {Object} [options={}] - Filter options
 * @param {string} [options.language=''] - Filter by programming language
 * @param {string} [options.category='all'] - Filter by category (matches TRENDING_CATEGORIES keys)
 * @param {number} [options.page=1] - Page number for pagination
 * @param {number} [options.perPage=30] - Results per page (max 100)
 * @returns {Promise<{data: {items: Array, total_count: number}, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails after retries
 */
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
    if (categoryConfig && categoryConfig.topics.length > 0) {
      const topicFilters = categoryConfig.topics.map(t => `topic:${t}`);
      q += ` (${topicFilters.join(' OR ')})`;
    }
  }
  
  const url = `${API_BASE}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&page=${page}&per_page=${perPage}`;
  
  return fetchWithRetry(url);
};

/**
 * Fetches detailed information for a single repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @returns {Promise<{data: Object, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When repository not found or API request fails
 */
export const getRepository = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}`;
  return fetchWithRetry(url);
};

const decodeBase64Utf8 = (base64) => {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

/**
 * Fetches and decodes the README file for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @returns {Promise<{data: {content: string, decodedContent: string, ...} | null, rateLimit: Object | null}>}
 */
export const getRepositoryReadme = async (owner, repo) => {
  try {
    const url = `${API_BASE}/repos/${owner}/${repo}/readme`;
    const response = await fetchWithRetry(url);
    
    if (response.data.content) {
      const decoded = decodeBase64Utf8(response.data.content);
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

/**
 * Fetches programming language breakdown for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @returns {Promise<{data: Object<string, number>, rateLimit: {remaining: number, limit: number, reset: number}}>} Language names as keys, byte counts as values
 * @throws {Error} When API request fails
 */
export const getRepositoryLanguages = async (owner, repo) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/languages`;
  return fetchWithRetry(url);
};

/**
 * Fetches recent events/activity for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {number} [perPage=10] - Number of events to fetch (max 100)
 * @returns {Promise<{data: Array, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const getRepositoryEvents = async (owner, repo, perPage = 10) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/events?per_page=${perPage}`;
  return fetchWithRetry(url);
};

/**
 * Checks current GitHub API rate limit status
 * @returns {Promise<{data: {resources: Object, rate: Object}, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const checkRateLimit = async () => {
  const url = `${API_BASE}/rate_limit`;
  return fetchWithRetry(url);
};

/**
 * Fetches weekly commit activity for the past year (52 weeks)
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {boolean} [retryOnce=true] - Whether to retry once if GitHub returns 202 (processing)
 * @returns {Promise<{data: Array<{week: number, days: number[], total: number}> | null, processing: boolean, rateLimit: Object | null}>}
 * @throws {Error} When API request fails
 */
export const getCommitActivity = async (owner, repo, retryOnce = true) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/commit_activity`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 202) {
      if (retryOnce) {
        await sleep(2000);
        return getCommitActivity(owner, repo, false);
      }
      return { data: null, processing: true, rateLimit: null };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      processing: false,
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches weekly participation stats (commit counts) for the last year
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {boolean} [retryOnce=true] - Whether to retry once if GitHub returns 202 (processing)
 * @returns {Promise<{data: {all: number[], owner: number[]} | null, processing: boolean, rateLimit: Object | null}>}
 * @throws {Error} When API request fails
 */
export const getParticipationStats = async (owner, repo, retryOnce = true) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/participation`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 202) {
      if (retryOnce) {
        await sleep(2000);
        return getParticipationStats(owner, repo, false);
      }
      return { data: null, processing: true, rateLimit: null };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      processing: false,
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches contributor commit activity for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {boolean} [retryOnce=true] - Whether to retry once if GitHub returns 202 (processing)
 * @returns {Promise<{data: Array<{author: Object, total: number, weeks: Array}> | null, processing: boolean, rateLimit: Object | null}>}
 * @throws {Error} When API request fails
 */
export const getContributorStats = async (owner, repo, retryOnce = true) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/contributors`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 202) {
      if (retryOnce) {
        await sleep(2000);
        return getContributorStats(owner, repo, false);
      }
      return { data: null, processing: true, rateLimit: null };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      processing: false,
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Fetches issues with created/closed timestamps for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {Object} [params={}] - Optional query parameters to override defaults
 * @param {string} [params.state='all'] - Issue state filter (open, closed, all)
 * @param {string} [params.sort='created'] - Sort field (created, updated, comments)
 * @param {string} [params.direction='desc'] - Sort direction (asc, desc)
 * @param {number} [params.per_page=100] - Results per page (max 100)
 * @returns {Promise<{data: Array, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const getIssueTimeline = async (owner, repo, params = {}) => {
  const query = new URLSearchParams({
    state: 'all',
    per_page: '100',
    sort: 'created',
    direction: 'desc',
    ...params
  });
  const url = `${API_BASE}/repos/${owner}/${repo}/issues?${query}`;
  return fetchWithRetry(url);
};

/**
 * Fetches pull requests with merge timestamps for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {Object} [params={}] - Optional query parameters to override defaults
 * @param {string} [params.state='all'] - PR state filter (open, closed, all)
 * @param {string} [params.sort='created'] - Sort field (created, updated, popularity, long-running)
 * @param {string} [params.direction='desc'] - Sort direction (asc, desc)
 * @param {number} [params.per_page=100] - Results per page (max 100)
 * @returns {Promise<{data: Array, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const getPullRequestTimeline = async (owner, repo, params = {}) => {
  const query = new URLSearchParams({
    state: 'all',
    per_page: '100',
    sort: 'created',
    direction: 'desc',
    ...params
  });
  const url = `${API_BASE}/repos/${owner}/${repo}/pulls?${query}`;
  return fetchWithRetry(url);
};

/**
 * Fetches release history for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {number} [perPage=30] - Number of releases to fetch (max 100)
 * @returns {Promise<{data: Array, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const getReleaseHistory = async (owner, repo, perPage = 30) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/releases?per_page=${perPage}`;
  return fetchWithRetry(url);
};
