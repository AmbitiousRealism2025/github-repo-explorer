import { searchRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber,
  debounce,
  getUrlParam,
  setUrlParams,
  updateRateLimitDisplay
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  renderPagination, 
  handleFavoriteToggle, 
  handlePaginationClick 
} from './components/RepoGrid.js';

initTheme();
initErrorBoundary();

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const languageFilter = document.getElementById('language-filter');
const starsFilter = document.getElementById('stars-filter');
const sortFilter = document.getElementById('sort-filter');
const repoGrid = document.getElementById('repo-grid');
const resultsSection = document.getElementById('results-section');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const pagination = document.getElementById('pagination');
const themeToggle = document.getElementById('theme-toggle');
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const settingsClose = document.getElementById('settings-close');
const githubTokenInput = document.getElementById('github-token');
const saveTokenBtn = document.getElementById('save-token');
const clearTokenBtn = document.getElementById('clear-token');
const retryBtn = document.getElementById('retry-btn');

let currentPage = 1;
let currentQuery = '';
let totalResults = 0;

const showState = (state) => {
  emptyState.classList.add('hidden');
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsSection.classList.add('hidden');
  
  switch (state) {
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
    case 'results':
      resultsSection.classList.remove('hidden');
      break;
  }
};

const performSearch = async (page = 1) => {
  const query = searchInput.value.trim();
  if (!query) {
    showState('empty');
    return;
  }
  
  currentQuery = query;
  currentPage = page;
  
  setUrlParams({
    q: query,
    lang: languageFilter.value,
    stars: starsFilter.value,
    sort: sortFilter.value,
    page: page > 1 ? page : null
  });
  
  showState('loading');
  
  try {
    const result = await searchRepositories(query, {
      language: languageFilter.value,
      minStars: parseInt(starsFilter.value) || 0,
      sort: sortFilter.value,
      page: page
    });
    
    totalResults = result.data.total_count;
    resultsCount.innerHTML = `<strong>${formatNumber(totalResults)}</strong> repositories found`;
    
    renderRepoGrid(repoGrid, result.data.items, { dateField: 'updated_at', datePrefix: 'Updated' });
    renderPagination(pagination, currentPage, totalResults);
    showState('results');
    
    if (result.rateLimit) {
      updateRateLimitDisplay(result.rateLimit);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    showState('error');
  }
};

const initFromUrl = () => {
  const query = getUrlParam('q');
  const lang = getUrlParam('lang');
  const stars = getUrlParam('stars');
  const sort = getUrlParam('sort');
  const page = getUrlParam('page');
  
  if (query) searchInput.value = query;
  if (lang) languageFilter.value = lang;
  if (stars) starsFilter.value = stars;
  if (sort) sortFilter.value = sort;
  
  if (query) {
    performSearch(parseInt(page) || 1);
  }
};

searchBtn.addEventListener('click', () => performSearch(1));
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') performSearch(1);
});

const debouncedSearch = debounce(() => performSearch(1), 500);
languageFilter.addEventListener('change', debouncedSearch);
starsFilter.addEventListener('change', debouncedSearch);
sortFilter.addEventListener('change', debouncedSearch);

repoGrid.addEventListener('click', (e) => handleFavoriteToggle(e));
pagination.addEventListener('click', (e) => handlePaginationClick(e, performSearch));
retryBtn?.addEventListener('click', () => performSearch(currentPage));

themeToggle.addEventListener('click', toggleTheme);

settingsBtn.addEventListener('click', () => {
  githubTokenInput.value = Storage.getToken() || '';
  settingsModal.classList.add('open');
});

settingsClose.addEventListener('click', () => {
  settingsModal.classList.remove('open');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('open');
  }
});

saveTokenBtn.addEventListener('click', () => {
  const token = githubTokenInput.value.trim();
  Storage.setToken(token);
  settingsModal.classList.remove('open');
});

clearTokenBtn.addEventListener('click', () => {
  Storage.setToken(null);
  githubTokenInput.value = '';
});

initFromUrl();
