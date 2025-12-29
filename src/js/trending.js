import { getTrendingRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  formatNumber,
  updateRateLimitDisplay
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  renderPagination, 
  handleFavoriteToggle, 
  handlePaginationClick,
  handleCollectionClick,
  handleCollectionKeydown,
  initCollectionPickerCloseHandler
} from './components/RepoGrid.js';
import { MAX_SEARCH_RESULTS, TRENDING_CATEGORIES } from './constants.js';

initTheme();
initErrorBoundary();

const languageFilter = document.getElementById('language-filter');
const repoGrid = document.getElementById('repo-grid');
const resultsSection = document.getElementById('results-section');
const resultsCount = document.getElementById('results-count');
const loadingState = document.getElementById('loading-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const pagination = document.getElementById('pagination');
const themeToggle = document.getElementById('theme-toggle');
const retryBtn = document.getElementById('retry-btn');
const categoryFilter = document.getElementById('category-filter');
const emptyState = document.getElementById('empty-state');
const emptyStateTitle = document.getElementById('empty-state-title');
const emptyStateActions = document.getElementById('empty-state-actions');

const populateCategoryDropdown = () => {
  categoryFilter.innerHTML = Object.entries(TRENDING_CATEGORIES)
    .map(([key, { label }]) => `<option value="${key}">${label}</option>`)
    .join('');
};

let currentPage = 1;
let totalResults = 0;

const showState = (state) => {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsSection.classList.add('hidden');
  emptyState.classList.add('hidden');
  
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
    case 'results':
      resultsSection.classList.remove('hidden');
      break;
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
  }
};

const renderEmptyState = () => {
  const category = categoryFilter.value;
  const language = languageFilter.value;
  const categoryLabel = TRENDING_CATEGORIES[category]?.label || 'repos';
  const languageLabel = languageFilter.options[languageFilter.selectedIndex]?.text || '';
  
  let title = 'No trending ';
  if (language && category !== 'all') {
    title += `${languageLabel} ${categoryLabel}`;
  } else if (language) {
    title += `${languageLabel} repos`;
  } else if (category !== 'all') {
    title += categoryLabel;
  } else {
    title += 'repositories';
  }
  title += ' this week';
  
  emptyStateTitle.textContent = title;
  
  const buttons = [];
  
  if (category !== 'all') {
    buttons.push(`<button class="btn btn--secondary" data-action="reset-category">Show all ${language ? languageLabel + ' repos' : 'trending'}</button>`);
  }
  
  if (language) {
    buttons.push(`<button class="btn btn--secondary" data-action="reset-language">Show all ${category !== 'all' ? categoryLabel : 'trending'}</button>`);
  }
  
  emptyStateActions.innerHTML = buttons.join('');
};

const loadTrending = async (page = 1) => {
  currentPage = page;
  showState('loading');
  
  try {
    const result = await getTrendingRepositories({
      language: languageFilter.value,
      category: categoryFilter.value,
      page: page
    });
    
    if (result.data.items.length === 0 && (categoryFilter.value !== 'all' || languageFilter.value)) {
      renderEmptyState();
      showState('empty');
      if (result.rateLimit) {
        updateRateLimitDisplay(result.rateLimit);
      }
      return;
    }
    
    totalResults = Math.min(result.data.total_count, MAX_SEARCH_RESULTS);
    
    const categoryLabel = TRENDING_CATEGORIES[categoryFilter.value]?.label;
    const languageLabel = languageFilter.options[languageFilter.selectedIndex]?.text;
    
    let countMessage = `<strong>${formatNumber(totalResults)}</strong> trending`;
    if (categoryFilter.value !== 'all') {
      countMessage += ` <strong>${categoryLabel}</strong>`;
    }
    if (languageFilter.value) {
      countMessage += ` in <strong>${languageLabel}</strong>`;
    }
    countMessage += ' this week';
    
    resultsCount.innerHTML = countMessage;
    
    renderRepoGrid(repoGrid, result.data.items, { dateField: 'created_at', datePrefix: 'Created' });
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

populateCategoryDropdown();

categoryFilter.addEventListener('change', () => loadTrending(1));
languageFilter.addEventListener('change', () => loadTrending(1));

emptyStateActions.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  if (action === 'reset-category') {
    categoryFilter.value = 'all';
    loadTrending(1);
  } else if (action === 'reset-language') {
    languageFilter.value = '';
    loadTrending(1);
  }
});

repoGrid.addEventListener('click', (e) => {
  handleFavoriteToggle(e);
  handleCollectionClick(e);
});
repoGrid.addEventListener('keydown', handleCollectionKeydown);
pagination.addEventListener('click', (e) => handlePaginationClick(e, loadTrending));
retryBtn?.addEventListener('click', () => loadTrending(currentPage));
themeToggle.addEventListener('click', toggleTheme);
initCollectionPickerCloseHandler();

loadTrending();
