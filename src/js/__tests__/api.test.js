import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  searchRepositories,
  getTrendingRepositories,
  getRepository,
  getRepositoryReadme,
  getRepositoryLanguages,
  getRepositoryEvents,
  checkRateLimit,
  getCommitActivity,
  clearCache
} from '../api.js';

const mockFetchResponse = (data, options = {}) => {
  const response = {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: vi.fn().mockResolvedValue(data),
    headers: new Map([
      ['x-ratelimit-remaining', options.remaining ?? '59'],
      ['x-ratelimit-limit', options.limit ?? '60'],
      ['x-ratelimit-reset', options.reset ?? String(Math.floor(Date.now() / 1000) + 3600)]
    ])
  };
  response.headers.get = (key) => response.headers.get(key);
  return response;
};

describe('API', () => {
  beforeEach(() => {
    clearCache();
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('searchRepositories', () => {
    it('should search repositories with query', async () => {
      const mockData = { items: [{ id: 1, name: 'test' }], total_count: 1 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: (key) => {
            const headers = {
              'x-ratelimit-remaining': '59',
              'x-ratelimit-limit': '60',
              'x-ratelimit-reset': String(Math.floor(Date.now() / 1000) + 3600)
            };
            return headers[key];
          }
        }
      });

      const result = await searchRepositories('react');
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search/repositories?q=react'),
        expect.any(Object)
      );
    });

    it('should include language filter', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('react', { language: 'JavaScript' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('language%3AJavaScript'),
        expect.any(Object)
      );
    });

    it('should include minStars filter', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('react', { minStars: 100 });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('stars%3A%3E%3D100'),
        expect.any(Object)
      );
    });

    it('should correctly encode C++ language (single encoding)', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('game', { language: 'C++' });
      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('language%3AC%2B%2B');
      expect(calledUrl).not.toContain('language%3AC%252B%252B');
    });

    it('should correctly encode C# language (single encoding)', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('dotnet', { language: 'C#' });
      const calledUrl = global.fetch.mock.calls[0][0];
      expect(calledUrl).toContain('language%3AC%23');
      expect(calledUrl).not.toContain('language%3AC%2523');
    });
  });

  describe('getTrendingRepositories', () => {
    it('should fetch trending repos from past week', async () => {
      const mockData = { items: [{ id: 1 }], total_count: 1 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getTrendingRepositories();
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('created%3A%3E'),
        expect.any(Object)
      );
    });

    it('should include language filter for trending', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await getTrendingRepositories({ language: 'Python' });
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('language%3APython'),
        expect.any(Object)
      );
    });

    it('should include category topics in query', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: { get: () => '59' }
      });

      await getTrendingRepositories({ category: 'cli' });
      const calledUrl = global.fetch.mock.calls[0][0];
      
      // Should include topic:cli OR topic:command-line etc
      expect(calledUrl).toMatch(/topic%3Acli/);
    });

    it('should include category keywords in query', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: { get: () => '59' }
      });

      await getTrendingRepositories({ category: 'cli' });
      const calledUrl = global.fetch.mock.calls[0][0];
      
      // Should include keyword search in name/description
      expect(calledUrl).toMatch(/cli.*in%3Aname%2Cdescription/);
    });

    it('should combine category and language filters', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: { get: () => '59' }
      });

      await getTrendingRepositories({ category: 'cli', language: 'Rust' });
      const calledUrl = global.fetch.mock.calls[0][0];
      
      expect(calledUrl).toMatch(/language%3ARust/);
      expect(calledUrl).toMatch(/topic%3Acli/);
    });

    it('should not add category filter for "all" category', async () => {
      const mockData = { items: [], total_count: 0 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: { get: () => '59' }
      });

      await getTrendingRepositories({ category: 'all' });
      const calledUrl = global.fetch.mock.calls[0][0];
      
      expect(calledUrl).not.toMatch(/topic%3A/);
    });
  });

  describe('getRepository', () => {
    it('should fetch repository details', async () => {
      const mockData = { id: 1, full_name: 'owner/repo' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getRepository('owner', 'repo');
      expect(result.data).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('repos/owner/repo'),
        expect.any(Object)
      );
    });
  });

  describe('getRepositoryReadme', () => {
    it('should fetch and decode readme', async () => {
      const content = btoa('# Hello World');
      const mockData = { content, encoding: 'base64' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getRepositoryReadme('owner', 'repo');
      expect(result.data.decodedContent).toBe('# Hello World');
    });

    it('should handle missing readme', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Resource not found'));

      const result = await getRepositoryReadme('owner', 'repo');
      expect(result.data).toBeNull();
    });

    it('should correctly decode UTF-8 characters in README', async () => {
      const originalText = '# 日本語 README 🎉';
      const encoder = new TextEncoder();
      const bytes = encoder.encode(originalText);
      const binaryString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
      const content = btoa(binaryString);
      
      const mockData = { content, encoding: 'base64' };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getRepositoryReadme('owner', 'repo');
      expect(result.data.decodedContent).toBe(originalText);
    });
  });

  describe('getRepositoryLanguages', () => {
    it('should fetch repository languages', async () => {
      const mockData = { JavaScript: 50000, TypeScript: 30000 };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getRepositoryLanguages('owner', 'repo');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('getRepositoryEvents', () => {
    it('should fetch repository events', async () => {
      const mockData = [{ id: '1', type: 'PushEvent' }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getRepositoryEvents('owner', 'repo');
      expect(result.data).toEqual(mockData);
    });
  });

  describe('getCommitActivity', () => {
    it('should fetch commit activity', async () => {
      const mockData = [{ week: 1234567890, days: [1, 2, 3, 4, 5, 6, 7], total: 28 }];
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await getCommitActivity('owner', 'repo');
      expect(result.data).toEqual(mockData);
    });

    it('should retry once on 202 status and return processing flag on second 202', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          status: 202,
          json: () => Promise.resolve(null),
          headers: {
            get: () => '59'
          }
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 202,
          json: () => Promise.resolve(null),
          headers: {
            get: () => '59'
          }
        });

      const result = await getCommitActivity('owner', 'repo');
      expect(global.fetch).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ data: null, processing: true, rateLimit: null });
    });
  });

  describe('checkRateLimit', () => {
    it('should fetch rate limit info', async () => {
      const mockData = { resources: { core: { remaining: 59, limit: 60 } } };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      const result = await checkRateLimit();
      expect(result.data).toEqual(mockData);
    });
  });

  describe('Error Handling', () => {
    it('should handle rate limit error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: (key) => {
            if (key === 'x-ratelimit-remaining') return '0';
            if (key === 'x-ratelimit-reset') return String(Math.floor(Date.now() / 1000) + 3600);
            return null;
          }
        }
      });

      await expect(searchRepositories('test')).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 404 error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: () => null
        }
      });

      await expect(getRepository('owner', 'nonexistent')).rejects.toThrow('Resource not found');
    });

    it('should handle generic HTTP error', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: {
          get: () => null
        }
      });

      await expect(searchRepositories('test')).rejects.toThrow('HTTP 500');
    });

    it('should handle 403 without rate limit', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        headers: {
          get: (key) => {
            if (key === 'x-ratelimit-remaining') return '10';
            return null;
          }
        }
      });

      await expect(searchRepositories('test')).rejects.toThrow('Forbidden');
    });
  });

  describe('Caching', () => {
    it('should cache responses', async () => {
      const mockData = { items: [{ id: 1 }] };
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('react');
      await searchRepositories('react');

      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should clear cache', async () => {
      const mockData = { items: [{ id: 1 }] };
      global.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockData),
        headers: {
          get: () => '59'
        }
      });

      await searchRepositories('react');
      clearCache();
      await searchRepositories('react');

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
