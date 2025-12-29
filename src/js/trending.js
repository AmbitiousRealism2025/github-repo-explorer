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
import { MAX_SEARCH_RESULTS } from './constants.js';

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

let currentPage = 1;
let totalResults = 0;

const showState = (state) => {
  loadingState.classList.add('hidden');
  errorState.classList.add('hidden');
  resultsSection.classList.add('hidden');
  
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
  }
};

const loadTrending = async (page = 1) => {
  currentPage = page;
  showState('loading');
  
  try {
    const result = await getTrendingRepositories({
      language: languageFilter.value,
      page: page
    });
    
    totalResults = Math.min(result.data.total_count, MAX_SEARCH_RESULTS);
    resultsCount.innerHTML = `<strong>${formatNumber(totalResults)}</strong> trending repositories this week`;
    
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

languageFilter.addEventListener('change', () => loadTrending(1));
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
