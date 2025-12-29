import { searchRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber, 
  formatDate, 
  getLanguageColor,
  debounce,
  getUrlParam,
  setUrlParams,
  showToast,
  updateRateLimitDisplay,
  Icons
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';

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

const createRepoCard = (repo) => {
  const isFavorite = Storage.isFavorite(repo.id);
  const card = document.createElement('article');
  card.className = 'repo-card';
  card.dataset.repoId = repo.id;
  
  card.innerHTML = `
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="repo-card__name">${repo.full_name}</a>
      <button class="repo-card__favorite ${isFavorite ? 'active' : ''}" aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites" data-repo='${JSON.stringify({
        id: repo.id,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        updated_at: repo.updated_at
      }).replace(/'/g, "&#39;")}'>
        ${isFavorite ? Icons.star : Icons.starOutline}
      </button>
    </header>
    <p class="repo-card__description">${repo.description || 'No description available'}</p>
    <footer class="repo-card__footer">
      ${repo.language ? `
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${getLanguageColor(repo.language)}"></span>
          ${repo.language}
        </span>
      ` : ''}
      <span class="repo-card__stat">
        ${Icons.star}
        ${formatNumber(repo.stargazers_count)}
      </span>
      <span class="repo-card__stat">
        ${Icons.fork}
        ${formatNumber(repo.forks_count)}
      </span>
      <span class="repo-card__updated">Updated ${formatDate(repo.updated_at)}</span>
    </footer>
  `;
  
  return card;
};

const renderResults = (repos) => {
  repoGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  repos.forEach(repo => {
    fragment.appendChild(createRepoCard(repo));
  });
  
  repoGrid.appendChild(fragment);
};

const renderPagination = () => {
  const totalPages = Math.min(Math.ceil(totalResults / 30), 34);
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }
  
  let html = '';
  
  html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Prev</button>`;
  
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    html += `<button class="pagination__btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="pagination__btn" style="border: none;">...</span>`;
  }
  
  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination__btn" style="border: none;">...</span>`;
    html += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
  }
  
  html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next</button>`;
  
  pagination.innerHTML = html;
};

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
    
    renderResults(result.data.items);
    renderPagination();
    showState('results');
    
    if (result.rateLimit) {
      updateRateLimitDisplay(result.rateLimit);
    }
  } catch (error) {
    errorMessage.textContent = error.message;
    showState('error');
  }
};

const handleFavoriteClick = (e) => {
  const btn = e.target.closest('.repo-card__favorite');
  if (!btn) return;
  
  const repoData = JSON.parse(btn.dataset.repo);
  const isFavorite = Storage.isFavorite(repoData.id);
  
  if (isFavorite) {
    Storage.removeFavorite(repoData.id);
    btn.classList.remove('active');
    btn.innerHTML = Icons.starOutline;
    showToast('Removed from favorites', 'info');
  } else {
    Storage.addFavorite(repoData);
    btn.classList.add('active');
    btn.innerHTML = Icons.star;
    showToast('Added to favorites', 'success');
  }
};

const handlePaginationClick = (e) => {
  const btn = e.target.closest('.pagination__btn');
  if (!btn || btn.disabled || !btn.dataset.page) return;
  
  const page = parseInt(btn.dataset.page);
  performSearch(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
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

repoGrid.addEventListener('click', handleFavoriteClick);
pagination.addEventListener('click', handlePaginationClick);
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
  showToast(token ? 'Token saved' : 'Token cleared', 'success');
});

clearTokenBtn.addEventListener('click', () => {
  Storage.setToken(null);
  githubTokenInput.value = '';
  showToast('Token cleared', 'info');
});

initFromUrl();
