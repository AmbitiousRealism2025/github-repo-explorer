import {
  initTheme,
  toggleTheme,
  Storage,
  initMobileNav,
  getRequiredElement
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
initMobileNav();
initErrorBoundary();

const repoGrid = getRequiredElement('repo-grid');
const favoritesSection = getRequiredElement('favorites-section');
const resultsCount = getRequiredElement('results-count');
const emptyState = getRequiredElement('empty-state');
const themeToggle = getRequiredElement('theme-toggle');

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
