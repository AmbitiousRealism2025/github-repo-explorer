import { vi, beforeEach, afterEach } from 'vitest';

const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

global.fetch = vi.fn();

beforeEach(() => {
  localStorageMock.clear();
  vi.clearAllMocks();
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  vi.restoreAllMocks();
});
