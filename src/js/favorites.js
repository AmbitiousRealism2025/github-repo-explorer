import { 
  initTheme, 
  toggleTheme, 
  Storage
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { 
  renderRepoGrid, 
  handleFavoriteRemove,
  handleCollectionClick,
  handleCollectionKeydown,
  initCollectionPickerCloseHandler
} from './components/RepoGrid.js';

initTheme();
initErrorBoundary();

const repoGrid = document.getElementById('repo-grid');
const favoritesSection = document.getElementById('favorites-section');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('empty-state');
const themeToggle = document.getElementById('theme-toggle');

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
  
  const sortedFavorites = favorites.sort((a, b) => b.addedAt - a.addedAt);
  
  renderRepoGrid(repoGrid, sortedFavorites, { 
    dateField: 'addedAt', 
    datePrefix: 'Added',
    showRemoveOnly: true 
  });
};

repoGrid.addEventListener('click', (e) => {
  handleFavoriteRemove(e, () => renderFavorites());
  handleCollectionClick(e);
});
repoGrid.addEventListener('keydown', handleCollectionKeydown);
themeToggle.addEventListener('click', toggleTheme);
initCollectionPickerCloseHandler();

renderFavorites();
