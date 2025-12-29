import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber, 
  formatDate, 
  getLanguageColor,
  showToast,
  Icons
} from './common.js';

initTheme();

const repoGrid = document.getElementById('repo-grid');
const favoritesSection = document.getElementById('favorites-section');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');

const createRepoCard = (repo) => {
  const card = document.createElement('article');
  card.className = 'repo-card';
  card.dataset.repoId = repo.id;
  
  card.innerHTML = `
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="repo-card__name">${repo.full_name}</a>
      <button class="repo-card__favorite active" aria-label="Remove from favorites" data-id="${repo.id}">
        ${Icons.star}
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
      <span class="repo-card__updated">Added ${formatDate(new Date(repo.addedAt).toISOString())}</span>
    </footer>
  `;
  
  return card;
};

const renderFavorites = () => {
  const favorites = Storage.getFavorites();
  
  if (favorites.length === 0) {
    favoritesSection.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  favoritesSection.classList.remove('hidden');
  
  resultsCount.innerHTML = `<strong>${favorites.length}</strong> saved ${favorites.length === 1 ? 'repository' : 'repositories'}`;
  
  repoGrid.innerHTML = '';
  const fragment = document.createDocumentFragment();
  
  favorites.sort((a, b) => b.addedAt - a.addedAt).forEach(repo => {
    fragment.appendChild(createRepoCard(repo));
  });
  
  repoGrid.appendChild(fragment);
};

const handleFavoriteClick = (e) => {
  const btn = e.target.closest('.repo-card__favorite');
  if (!btn) return;
  
  const repoId = parseInt(btn.dataset.id);
  Storage.removeFavorite(repoId);
  showToast('Removed from favorites', 'info');
  
  renderFavorites();
};

repoGrid.addEventListener('click', handleFavoriteClick);
themeToggle.addEventListener('click', toggleTheme);

renderFavorites();
