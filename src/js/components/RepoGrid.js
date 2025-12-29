import { Storage, formatNumber, formatDate, getLanguageColor, showToast, Icons, escapeHtml } from '../common.js';
import { MAX_SEARCH_PAGES, DEFAULT_PER_PAGE } from '../constants.js';

export const createRepoCard = (repo, options = {}) => {
  const {
    dateField = 'updated_at',
    datePrefix = 'Updated',
    showRemoveOnly = false
  } = options;

  const isFavorite = Storage.isFavorite(repo.id);
  const card = document.createElement('article');
  card.className = 'repo-card';
  card.dataset.repoId = repo.id;

  const safeFullName = escapeHtml(repo.full_name);
  const safeDescription = escapeHtml(repo.description) || 'No description available';

  const repoData = JSON.stringify({
    id: repo.id,
    full_name: repo.full_name,
    description: repo.description,
    html_url: repo.html_url,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
    language: repo.language,
    updated_at: repo.updated_at
  }).replace(/'/g, "&#39;");

  let dateValue;
  if (dateField === 'addedAt' && repo.addedAt) {
    dateValue = new Date(repo.addedAt).toISOString();
  } else {
    dateValue = repo[dateField];
  }

  const favoriteButton = showRemoveOnly
    ? `<button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${repo.id}">
        ${Icons.star}
      </button>`
    : `<button class="repo-card__favorite ${isFavorite ? 'active' : ''}" 
        aria-label="${isFavorite ? 'Remove from' : 'Add to'} favorites" 
        data-repo='${repoData}'>
        ${isFavorite ? Icons.star : Icons.starOutline}
      </button>`;

  card.innerHTML = `
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="repo-card__name">${safeFullName}</a>
      ${favoriteButton}
    </header>
    <p class="repo-card__description">${safeDescription}</p>
    <footer class="repo-card__footer">
      ${repo.language ? `
        <span class="repo-card__language">
          <span class="language-dot" style="--lang-color: ${getLanguageColor(repo.language)}"></span>
          ${escapeHtml(repo.language)}
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
      <span class="repo-card__updated">${datePrefix} ${formatDate(dateValue)}</span>
    </footer>
  `;

  return card;
};

export const renderRepoGrid = (container, repos, options = {}) => {
  container.innerHTML = '';
  const fragment = document.createDocumentFragment();

  repos.forEach(repo => {
    fragment.appendChild(createRepoCard(repo, options));
  });

  container.appendChild(fragment);
};

export const renderPagination = (container, currentPage, totalResults, perPage = DEFAULT_PER_PAGE) => {
  const totalPages = Math.min(Math.ceil(totalResults / perPage), MAX_SEARCH_PAGES);
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }

  let html = '';

  html += `<button class="pagination__btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">Prev</button>`;

  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  if (startPage > 1) {
    html += `<button class="pagination__btn" data-page="1">1</button>`;
    if (startPage > 2) html += `<span class="pagination__ellipsis">...</span>`;
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `<button class="pagination__btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) html += `<span class="pagination__ellipsis">...</span>`;
    html += `<button class="pagination__btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="pagination__btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next</button>`;

  container.innerHTML = html;
};

export const handleFavoriteToggle = (e, onUpdate) => {
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

  if (onUpdate) onUpdate(repoData, !isFavorite);
};

export const handleFavoriteRemove = (e, onRemove) => {
  const btn = e.target.closest('.repo-card__favorite');
  if (!btn) return;

  const repoId = parseInt(btn.dataset.id);
  Storage.removeFavorite(repoId);
  showToast('Removed from favorites', 'info');

  if (onRemove) onRemove(repoId);
};

export const handlePaginationClick = (e, onPageChange) => {
  const btn = e.target.closest('.pagination__btn');
  if (!btn || btn.disabled || !btn.dataset.page) return;

  const page = parseInt(btn.dataset.page);
  onPageChange(page);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
