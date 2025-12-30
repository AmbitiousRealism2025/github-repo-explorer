import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Storage,
  initTheme,
  toggleTheme,
  formatNumber,
  formatDate,
  debounce,
  getLanguageColor,
  showToast,
  escapeHtml,
  safeText,
  createElement,
  Icons,
  sanitizeUrl
} from '../common.js';

describe('Storage', () => {
  describe('Favorites', () => {
    const mockRepo = {
      id: 123,
      full_name: 'owner/repo',
      description: 'Test repo',
      html_url: 'https://github.com/owner/repo',
      stargazers_count: 100,
      forks_count: 10,
      language: 'JavaScript',
      updated_at: '2025-01-01T00:00:00Z'
    };

    it('should return empty array when no favorites exist', () => {
      expect(Storage.getFavorites()).toEqual([]);
    });

    it('should add a favorite', () => {
      const result = Storage.addFavorite(mockRepo);
      expect(result.length).toBe(1);
      expect(result[0].id).toBe(123);
      expect(result[0].full_name).toBe('owner/repo');
    });

    it('should not add duplicate favorites', () => {
      Storage.addFavorite(mockRepo);
      const result = Storage.addFavorite(mockRepo);
      expect(result.length).toBe(1);
    });

    it('should remove a favorite', () => {
      Storage.addFavorite(mockRepo);
      const result = Storage.removeFavorite(123);
      expect(result.length).toBe(0);
    });

    it('should check if repo is favorite', () => {
      expect(Storage.isFavorite(123)).toBe(false);
      Storage.addFavorite(mockRepo);
      expect(Storage.isFavorite(123)).toBe(true);
    });

    it('should handle corrupted storage data', () => {
      localStorage.setItem('gh-explorer-favorites', 'invalid json');
      expect(Storage.getFavorites()).toEqual([]);
    });

    it('should handle old version storage data', () => {
      localStorage.setItem('gh-explorer-favorites', JSON.stringify({
        version: '0.1',
        data: [{ id: 1 }]
      }));
      expect(Storage.getFavorites()).toEqual([]);
    });
  });

  describe('Theme', () => {
    it('should return light theme by default', () => {
      expect(Storage.getTheme()).toBe('light');
    });

    it('should set and get theme', () => {
      Storage.setTheme('dark');
      expect(Storage.getTheme()).toBe('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('Token', () => {
    it('should return null when no token exists', () => {
      expect(Storage.getToken()).toBeNull();
    });

    it('should set and get token', () => {
      Storage.setToken('test-token');
      expect(Storage.getToken()).toBe('test-token');
    });

    it('should remove token when set to null', () => {
      Storage.setToken('test-token');
      Storage.setToken(null);
      expect(Storage.getToken()).toBeNull();
    });
  });

  describe('Notes', () => {
    it('should return empty object when no notes exist', () => {
      expect(Storage.getNotes()).toEqual({});
    });

    it('should save and get a note', () => {
      Storage.saveNote('owner/repo', 'My note');
      const note = Storage.getNote('owner/repo');
      expect(note.content).toBe('My note');
      expect(note.updatedAt).toBeDefined();
    });

    it('should return null for non-existent note', () => {
      expect(Storage.getNote('nonexistent/repo')).toBeNull();
    });

    it('should delete note when content is empty', () => {
      Storage.saveNote('owner/repo', 'My note');
      Storage.saveNote('owner/repo', '');
      expect(Storage.getNote('owner/repo')).toBeNull();
    });

    it('should delete a note', () => {
      Storage.saveNote('owner/repo', 'My note');
      Storage.deleteNote('owner/repo');
      expect(Storage.getNote('owner/repo')).toBeNull();
    });

    it('should handle corrupted notes data', () => {
      localStorage.setItem('gh-explorer-notes', 'invalid');
      expect(Storage.getNotes()).toEqual({});
    });
  });

  describe('Discovery Stats', () => {
    it('should return default stats when none exist', () => {
      const stats = Storage.getDiscoveryStats();
      expect(stats.explored).toEqual([]);
      expect(stats.languages).toEqual({});
      expect(stats.streak).toBe(0);
      expect(stats.lastVisit).toBeNull();
    });

    it('should track exploration', () => {
      const repo = { id: 123, language: 'JavaScript' };
      const stats = Storage.trackExploration(repo);
      expect(stats.explored).toContain(123);
      expect(stats.languages.JavaScript).toBe(1);
      expect(stats.streak).toBe(1);
    });

    it('should not add duplicate repo to explored', () => {
      const repo = { id: 123, language: 'JavaScript' };
      Storage.trackExploration(repo);
      const stats = Storage.trackExploration(repo);
      expect(stats.explored.filter(id => id === 123).length).toBe(1);
    });

    it('should increment language count', () => {
      const repo = { id: 123, language: 'JavaScript' };
      Storage.trackExploration(repo);
      Storage.trackExploration({ id: 456, language: 'JavaScript' });
      const stats = Storage.getDiscoveryStats();
      expect(stats.languages.JavaScript).toBe(2);
    });

    it('should handle repo without language', () => {
      const repo = { id: 123 };
      const stats = Storage.trackExploration(repo);
      expect(Object.keys(stats.languages).length).toBe(0);
    });

    it('should handle corrupted stats data', () => {
      localStorage.setItem('gh-explorer-stats', 'invalid');
      expect(Storage.getDiscoveryStats()).toEqual({
        explored: [],
        languages: {},
        streak: 0,
        lastVisit: null
      });
    });
  });

  describe('Collections', () => {
    it('should return empty array when no collections exist', () => {
      expect(Storage.getCollections()).toEqual([]);
    });

    it('should create a collection', () => {
      const collection = Storage.createCollection('My Collection', 'Description');
      expect(collection.name).toBe('My Collection');
      expect(collection.description).toBe('Description');
      expect(collection.repos).toEqual([]);
      expect(collection.id).toBeDefined();
    });

    it('should update a collection', () => {
      const collection = Storage.createCollection('Original');
      Storage.updateCollection(collection.id, { name: 'Updated' });
      const collections = Storage.getCollections();
      expect(collections[0].name).toBe('Updated');
    });

    it('should delete a collection', () => {
      const collection = Storage.createCollection('To Delete');
      Storage.deleteCollection(collection.id);
      expect(Storage.getCollections()).toEqual([]);
    });

    it('should add repo to collection', () => {
      const collection = Storage.createCollection('My Collection');
      const repo = { id: 123, full_name: 'owner/repo', description: 'Test', stargazers_count: 100, language: 'JS' };
      Storage.addToCollection(collection.id, repo);
      const collections = Storage.getCollections();
      expect(collections[0].repos.length).toBe(1);
      expect(collections[0].repos[0].id).toBe(123);
    });

    it('should not add duplicate repo to collection', () => {
      const collection = Storage.createCollection('My Collection');
      const repo = { id: 123, full_name: 'owner/repo' };
      Storage.addToCollection(collection.id, repo);
      Storage.addToCollection(collection.id, repo);
      const collections = Storage.getCollections();
      expect(collections[0].repos.length).toBe(1);
    });

    it('should remove repo from collection', () => {
      const collection = Storage.createCollection('My Collection');
      const repo = { id: 123, full_name: 'owner/repo' };
      Storage.addToCollection(collection.id, repo);
      Storage.removeFromCollection(collection.id, 123);
      const collections = Storage.getCollections();
      expect(collections[0].repos.length).toBe(0);
    });

    it('should handle corrupted collections data', () => {
      localStorage.setItem('gh-explorer-collections', 'invalid');
      expect(Storage.getCollections()).toEqual([]);
    });
  });
});

describe('Theme Functions', () => {
  it('initTheme should set theme from storage', () => {
    localStorage.setItem('gh-explorer-theme', 'dark');
    initTheme();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggleTheme should switch between light and dark', () => {
    Storage.setTheme('light');
    expect(toggleTheme()).toBe('dark');
    expect(toggleTheme()).toBe('light');
  });
});

describe('formatNumber', () => {
  it('should format numbers under 1000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('should format thousands with k suffix', () => {
    expect(formatNumber(1000)).toBe('1.0k');
    expect(formatNumber(1500)).toBe('1.5k');
    expect(formatNumber(999999)).toBe('1000.0k');
  });

  it('should format millions with M suffix', () => {
    expect(formatNumber(1000000)).toBe('1.0M');
    expect(formatNumber(1500000)).toBe('1.5M');
  });
});

describe('formatDate', () => {
  it('should format recent dates as "just now"', () => {
    const now = new Date();
    expect(formatDate(now.toISOString())).toBe('just now');
  });

  it('should format minutes ago', () => {
    const date = new Date(Date.now() - 30 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('30 minutes ago');
  });

  it('should format hours ago', () => {
    const date = new Date(Date.now() - 2 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('2 hours ago');
  });

  it('should format 1 hour ago', () => {
    const date = new Date(Date.now() - 1 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('1 hour ago');
  });

  it('should format yesterday', () => {
    const date = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('yesterday');
  });

  it('should format days ago', () => {
    const date = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('5 days ago');
  });

  it('should format weeks ago', () => {
    const date = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('2 weeks ago');
  });

  it('should format months ago', () => {
    const date = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('2 months ago');
  });

  it('should format years ago', () => {
    const date = new Date(Date.now() - 400 * 24 * 60 * 60 * 1000);
    expect(formatDate(date.toISOString())).toBe('1 years ago');
  });
});

describe('debounce', () => {
  it('should debounce function calls', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('should pass arguments to debounced function', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced('arg1', 'arg2');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    vi.useRealTimers();
  });
});

describe('getLanguageColor', () => {
  it('should return correct color for known languages', () => {
    expect(getLanguageColor('JavaScript')).toBe('#f1e05a');
    expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    expect(getLanguageColor('Python')).toBe('#3572A5');
  });

  it('should return default color for unknown languages', () => {
    expect(getLanguageColor('UnknownLang')).toBe('#8b949e');
  });
});

describe('showToast', () => {
  it('should create toast container if not exists', () => {
    showToast('Test message');
    expect(document.getElementById('toast-container')).not.toBeNull();
  });

  it('should add toast with correct class', () => {
    showToast('Test message', 'success');
    const toast = document.querySelector('.toast--success');
    expect(toast).not.toBeNull();
    expect(toast.textContent).toBe('Test message');
  });

  it('should use info type by default', () => {
    showToast('Test message');
    const toast = document.querySelector('.toast--info');
    expect(toast).not.toBeNull();
  });
});

describe('escapeHtml', () => {
  it('should escape HTML entities', () => {
    expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should return empty string for null/undefined', () => {
    expect(escapeHtml(null)).toBe('');
    expect(escapeHtml(undefined)).toBe('');
  });

  it('should handle normal strings', () => {
    expect(escapeHtml('Hello World')).toBe('Hello World');
  });
});

describe('safeText', () => {
  it('should set text content safely', () => {
    const el = document.createElement('div');
    safeText(el, '<script>alert("xss")</script>');
    expect(el.textContent).toBe('<script>alert("xss")</script>');
    expect(el.innerHTML).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
  });

  it('should handle null/undefined', () => {
    const el = document.createElement('div');
    safeText(el, null);
    expect(el.textContent).toBe('');
    safeText(el, undefined);
    expect(el.textContent).toBe('');
  });
});

describe('createElement', () => {
  it('should create element with tag', () => {
    const el = createElement('div');
    expect(el.tagName).toBe('DIV');
  });

  it('should set className', () => {
    const el = createElement('div', 'my-class');
    expect(el.className).toBe('my-class');
  });

  it('should set text content', () => {
    const el = createElement('div', 'my-class', 'Hello');
    expect(el.textContent).toBe('Hello');
  });
});

describe('Icons', () => {
  it('should have required icons defined', () => {
    expect(Icons.star).toBeDefined();
    expect(Icons.starOutline).toBeDefined();
    expect(Icons.fork).toBeDefined();
    expect(Icons.folder).toBeDefined();
    expect(Icons.folderPlus).toBeDefined();
    expect(Icons.check).toBeDefined();
    expect(Icons.plus).toBeDefined();
  });
});

describe('sanitizeUrl', () => {
  describe('valid URLs', () => {
    it('should allow http URLs', () => {
      expect(sanitizeUrl('http://example.com')).toBe('http://example.com');
    });

    it('should allow https URLs', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com');
    });

    it('should allow URLs with paths and query strings', () => {
      expect(sanitizeUrl('https://example.com/path?query=1')).toBe('https://example.com/path?query=1');
    });

    it('should allow URLs with ports', () => {
      expect(sanitizeUrl('https://example.com:8080')).toBe('https://example.com:8080');
    });
  });

  describe('blocked URLs (XSS prevention)', () => {
    it('should block javascript: URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    });

    it('should block javascript: URLs with encoding tricks', () => {
      expect(sanitizeUrl('javascript:alert(document.cookie)')).toBeNull();
    });

    it('should block data: URLs', () => {
      expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
    });

    it('should block vbscript: URLs', () => {
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBeNull();
    });

    it('should block file: URLs', () => {
      expect(sanitizeUrl('file:///etc/passwd')).toBeNull();
    });

    it('should block ftp: URLs', () => {
      expect(sanitizeUrl('ftp://example.com')).toBeNull();
    });
  });

  describe('invalid inputs', () => {
    it('should return null for null input', () => {
      expect(sanitizeUrl(null)).toBeNull();
    });

    it('should return null for undefined input', () => {
      expect(sanitizeUrl(undefined)).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(sanitizeUrl('')).toBeNull();
    });

    it('should return null for malformed URLs', () => {
      expect(sanitizeUrl('not-a-url')).toBeNull();
    });

    it('should return null for non-string inputs', () => {
      expect(sanitizeUrl(123)).toBeNull();
      expect(sanitizeUrl({})).toBeNull();
      expect(sanitizeUrl([])).toBeNull();
    });
  });
});
