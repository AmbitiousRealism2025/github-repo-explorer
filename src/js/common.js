import { STORAGE_VERSION, STORAGE_KEYS, TOAST_DURATION_MS, TOAST_FADE_MS } from './constants.js';

const FAVORITES_KEY = STORAGE_KEYS.FAVORITES;
const THEME_KEY = STORAGE_KEYS.THEME;
const TOKEN_KEY = STORAGE_KEYS.TOKEN;

export const Storage = {
  getFavorites() {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.version === STORAGE_VERSION ? parsed.data : [];
    } catch {
      return [];
    }
  },

  saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      data: favorites,
      timestamp: Date.now()
    }));
  },

  addFavorite(repo) {
    const favorites = this.getFavorites();
    if (!favorites.find(f => f.id === repo.id)) {
      favorites.push({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        updated_at: repo.updated_at,
        addedAt: Date.now()
      });
      this.saveFavorites(favorites);
    }
    return favorites;
  },

  removeFavorite(repoId) {
    const favorites = this.getFavorites().filter(f => f.id !== repoId);
    this.saveFavorites(favorites);
    return favorites;
  },

  isFavorite(repoId) {
    return this.getFavorites().some(f => f.id === repoId);
  },

  getTheme() {
    return localStorage.getItem(THEME_KEY) || 'light';
  },

  setTheme(theme) {
    localStorage.setItem(THEME_KEY, theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  getNotes() {
    try {
      const raw = localStorage.getItem('gh-explorer-notes');
      if (!raw) return {};
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  getNote(repoFullName) {
    const notes = this.getNotes();
    return notes[repoFullName] || null;
  },

  saveNote(repoFullName, content) {
    const notes = this.getNotes();
    if (content && content.trim()) {
      notes[repoFullName] = {
        content: content.trim(),
        updatedAt: Date.now()
      };
    } else {
      delete notes[repoFullName];
    }
    localStorage.setItem('gh-explorer-notes', JSON.stringify(notes));
  },

  deleteNote(repoFullName) {
    const notes = this.getNotes();
    delete notes[repoFullName];
    localStorage.setItem('gh-explorer-notes', JSON.stringify(notes));
  },

  getDiscoveryStats() {
    try {
      const raw = localStorage.getItem('gh-explorer-stats');
      if (!raw) return { explored: [], languages: {}, streak: 0, lastVisit: null };
      return JSON.parse(raw);
    } catch {
      return { explored: [], languages: {}, streak: 0, lastVisit: null };
    }
  },

  trackExploration(repo) {
    const stats = this.getDiscoveryStats();
    const today = new Date().toDateString();
    
    if (!stats.explored.includes(repo.id)) {
      stats.explored.push(repo.id);
    }
    
    if (repo.language) {
      stats.languages[repo.language] = (stats.languages[repo.language] || 0) + 1;
    }
    
    if (stats.lastVisit !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (stats.lastVisit === yesterday.toDateString()) {
        stats.streak += 1;
      } else if (stats.lastVisit !== today) {
        stats.streak = 1;
      }
      stats.lastVisit = today;
    }
    
    localStorage.setItem('gh-explorer-stats', JSON.stringify(stats));
    return stats;
  },

  getCollections() {
    try {
      const raw = localStorage.getItem('gh-explorer-collections');
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveCollections(collections) {
    localStorage.setItem('gh-explorer-collections', JSON.stringify(collections));
  },

  createCollection(name, description = '') {
    const collections = this.getCollections();
    const newCollection = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      name,
      description,
      repos: [],
      createdAt: Date.now()
    };
    collections.push(newCollection);
    this.saveCollections(collections);
    return newCollection;
  },

  updateCollection(id, updates) {
    const collections = this.getCollections();
    const idx = collections.findIndex(c => c.id === id);
    if (idx !== -1) {
      collections[idx] = { ...collections[idx], ...updates };
      this.saveCollections(collections);
    }
  },

  deleteCollection(id) {
    const collections = this.getCollections().filter(c => c.id !== id);
    this.saveCollections(collections);
  },

  addToCollection(collectionId, repo) {
    const collections = this.getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection && !collection.repos.find(r => r.id === repo.id)) {
      collection.repos.push({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        stargazers_count: repo.stargazers_count,
        language: repo.language
      });
      this.saveCollections(collections);
    }
  },

  removeFromCollection(collectionId, repoId) {
    const collections = this.getCollections();
    const collection = collections.find(c => c.id === collectionId);
    if (collection) {
      collection.repos = collection.repos.filter(r => r.id !== repoId);
      this.saveCollections(collections);
    }
  }
};

export const initTheme = () => {
  const savedTheme = Storage.getTheme();
  document.documentElement.setAttribute('data-theme', savedTheme);
};

export const toggleTheme = () => {
  const current = Storage.getTheme();
  const next = current === 'light' ? 'dark' : 'light';
  Storage.setTheme(next);
  return next;
};

export const formatNumber = (num) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'k';
  }
  return num.toString();
};

export const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins <= 1 ? 'just now' : `${diffMins} minutes ago`;
    }
    return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
  }
  
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  
  return `${Math.floor(diffDays / 365)} years ago`;
};

export const debounce = (fn, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const getUrlParam = (param) => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
};

export const setUrlParams = (params) => {
  const url = new URL(window.location.href);
  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, '', url);
};

const LANGUAGE_COLORS = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Java: '#b07219',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Lua: '#000080',
  Scala: '#c22d40',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  R: '#198CE7',
  Julia: '#9558B2',
  Clojure: '#db5855',
  Perl: '#0298c3',
  Objective_C: '#438eff'
};

export const getLanguageColor = (language) => {
  return LANGUAGE_COLORS[language] || '#8b949e';
};

export const showToast = (message, type = 'info') => {
  const container = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), TOAST_FADE_MS);
  }, TOAST_DURATION_MS);
};

const createToastContainer = () => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
};

export const updateRateLimitDisplay = (rateLimit) => {
  const el = document.getElementById('rate-limit-display');
  if (el && rateLimit) {
    const resetTime = new Date(rateLimit.reset * 1000).toLocaleTimeString();
    el.textContent = `API: ${rateLimit.remaining}/${rateLimit.limit} (resets ${resetTime})`;
  }
};

export const Icons = {
  star: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.75.75 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Z"/></svg>`,
  starOutline: `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M8 .75l1.882 3.815 4.21.612-3.046 2.97.719 4.192L8 10.347l-3.766 1.98.72-4.194L1.907 5.163l4.21-.611L8 .75z"/></svg>`,
  fork: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M5 5.372v.878c0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.878a2.25 2.25 0 1 1 1.5 0v.878a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.128a2.251 2.251 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.878a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>`,
  github: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
  externalLink: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 2h3.5a.75.75 0 0 1 0 1.5h-3.5a.25.25 0 0 0-.25.25v8.5c0 .138.112.25.25.25h8.5a.25.25 0 0 0 .25-.25v-3.5a.75.75 0 0 1 1.5 0v3.5A1.75 1.75 0 0 1 12.25 14h-8.5A1.75 1.75 0 0 1 2 12.25v-8.5C2 2.784 2.784 2 3.75 2Zm6.854-1h4.146a.25.25 0 0 1 .25.25v4.146a.25.25 0 0 1-.427.177L13.03 4.03 9.28 7.78a.751.751 0 0 1-1.042-.018.751.751 0 0 1-.018-1.042l3.75-3.75-1.543-1.543A.25.25 0 0 1 10.604 1Z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`,
  book: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M0 1.75A.75.75 0 0 1 .75 1h4.253c1.227 0 2.317.59 3 1.501A3.743 3.743 0 0 1 11.006 1h4.245a.75.75 0 0 1 .75.75v10.5a.75.75 0 0 1-.75.75h-4.507a2.25 2.25 0 0 0-1.591.659l-.622.621a.75.75 0 0 1-1.06 0l-.622-.621A2.25 2.25 0 0 0 5.258 13H.75a.75.75 0 0 1-.75-.75Zm7.251 10.324.004-5.073-.002-2.253A2.25 2.25 0 0 0 5.003 2.5H1.5v9h3.757a3.75 3.75 0 0 1 1.994.574ZM8.755 4.75l-.004 7.322a3.752 3.752 0 0 1 1.992-.572H14.5v-9h-3.495a2.25 2.25 0 0 0-2.25 2.25Z"/></svg>`,
  activity: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  trending: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`,
  push: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1 2.5A2.5 2.5 0 0 1 3.5 0h8.75a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0V1.5h-8a1 1 0 0 0-1 1v6.708A2.493 2.493 0 0 1 3.5 9h3.25a.75.75 0 0 1 0 1.5H3.5a1 1 0 0 0 0 2h5.75a.75.75 0 0 1 0 1.5H3.5A2.5 2.5 0 0 1 1 11.5Zm13.23 7.79h-.001l-1.224-1.224v6.184a.75.75 0 0 1-1.5 0V9.066L10.28 10.29a.75.75 0 0 1-1.06-1.061l2.505-2.504a.75.75 0 0 1 1.06 0l2.505 2.504a.75.75 0 0 1-1.061 1.06Z"/></svg>`,
  pullRequest: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/></svg>`,
  issue: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/></svg>`,
  folder: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3H13.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.5A2 2 0 0 1 .5 13V3.87ZM2.5 2a1 1 0 0 0-1 1v.166a1 1 0 0 1 .5-.166h3.672a1 1 0 0 0 .707-.293l.828-.828A1 1 0 0 1 7.5 2h-5Z"/></svg>`,
  folderPlus: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M.54 3.87.5 3a2 2 0 0 1 2-2h3.672a2 2 0 0 1 1.414.586l.828.828A2 2 0 0 0 9.828 3H13.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2.5A2 2 0 0 1 .5 13V3.87ZM2.5 2a1 1 0 0 0-1 1v.166a1 1 0 0 1 .5-.166h3.672a1 1 0 0 0 .707-.293l.828-.828A1 1 0 0 1 7.5 2h-5ZM8 5.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V10a.5.5 0 0 1-1 0V8.5H6a.5.5 0 0 1 0-1h1.5V6a.5.5 0 0 1 .5-.5Z"/></svg>`,
  check: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z"/></svg>`,
  plus: `<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 2a.75.75 0 0 1 .75.75v4.5h4.5a.75.75 0 0 1 0 1.5h-4.5v4.5a.75.75 0 0 1-1.5 0v-4.5h-4.5a.75.75 0 0 1 0-1.5h4.5v-4.5A.75.75 0 0 1 8 2Z"/></svg>`
};

// ============================================
// DOM Sanitization Utilities (XSS Prevention)
// ============================================

/**
 * Safely set text content (XSS-safe)
 * @param {HTMLElement} element - Target element
 * @param {string} text - Text to set
 */
export const safeText = (element, text) => {
  element.textContent = text ?? '';
};

/**
 * Create element with safe text content
 * @param {string} tag - HTML tag name
 * @param {string} className - CSS class(es)
 * @param {string} text - Text content
 * @returns {HTMLElement}
 */
export const createElement = (tag, className, text = '') => {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
};

/**
 * Escape HTML entities for safe attribute insertion
 * @param {string} str - String to escape
 * @returns {string}
 */
export const escapeHtml = (str) => {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

/**
 * Sanitize a URL to only allow safe schemes (http, https)
 * Prevents XSS via javascript: or data: URLs
 * @param {string} url - URL to sanitize
 * @returns {string|null} - Sanitized URL or null if unsafe/invalid
 */
export const sanitizeUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol) ? url : null;
  } catch {
    return null;
  }
};
