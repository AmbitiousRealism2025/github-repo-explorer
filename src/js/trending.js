import { getTrendingRepositories } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber, 
  formatDate, 
  getLanguageColor,
  showToast,
  updateRateLimitDisplay,
  Icons
} from './common.js';

initTheme();

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
      <span class="repo-card__updated">Created ${formatDate(repo.created_at)}</span>
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
    
    totalResults = Math.min(result.data.total_count, 1000);
    resultsCount.innerHTML = `<strong>${formatNumber(totalResults)}</strong> trending repositories this week`;
    
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
  loadTrending(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

languageFilter.addEventListener('change', () => loadTrending(1));
repoGrid.addEventListener('click', handleFavoriteClick);
pagination.addEventListener('click', handlePaginationClick);
retryBtn?.addEventListener('click', () => loadTrending(currentPage));
themeToggle.addEventListener('click', toggleTheme);

loadTrending();
