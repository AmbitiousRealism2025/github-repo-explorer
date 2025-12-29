import { Storage, formatNumber, formatDate, getLanguageColor, showToast, Icons, escapeHtml } from '../common.js';
import { MAX_SEARCH_PAGES, DEFAULT_PER_PAGE } from '../constants.js';

export const createRepoCard = (repo, options = {}) => {
  const {
    dateField = 'updated_at',
    datePrefix = 'Updated',
    showRemoveOnly = false,
    showCollectionButton = true
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
  }).replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

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

  const collectionButton = showCollectionButton
    ? `<div class="repo-card__collection-wrapper">
        <button class="repo-card__collection" aria-label="Add to collection" data-repo='${repoData}'>
          ${Icons.folderPlus}
        </button>
        <div class="collection-picker" aria-hidden="true">
          <div class="collection-picker__header">Add to Collection</div>
          <div class="collection-picker__list"></div>
          <div class="collection-picker__create">
            <input type="text" class="collection-picker__input" placeholder="New collection name..." maxlength="50">
            <button class="collection-picker__add-btn" aria-label="Create collection">${Icons.plus}</button>
          </div>
        </div>
      </div>`
    : '';

  card.innerHTML = `
    <header class="repo-card__header">
      <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="repo-card__name">${safeFullName}</a>
      <div class="repo-card__actions">
        ${collectionButton}
        ${favoriteButton}
      </div>
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

const renderCollectionList = (picker, repoData) => {
  const list = picker.querySelector('.collection-picker__list');
  const collections = Storage.getCollections();
  
  if (collections.length === 0) {
    list.innerHTML = '<div class="collection-picker__empty">No collections yet</div>';
    return;
  }

  list.innerHTML = collections.map(col => {
    // Check both id and full_name to handle imported collections (which use full_name as id)
    const isInCollection = col.repos.some(r => 
      r.id === repoData.id || r.full_name === repoData.full_name
    );
    return `
      <button class="collection-picker__item ${isInCollection ? 'collection-picker__item--active' : ''}" 
              data-collection-id="${col.id}"
              ${isInCollection ? 'disabled' : ''}>
        ${Icons.folder}
        <span class="collection-picker__item-name">${escapeHtml(col.name)}</span>
        ${isInCollection ? `<span class="collection-picker__item-check">${Icons.check}</span>` : ''}
      </button>
    `;
  }).join('');
};

const closeAllOtherPickers = () => {
  document.querySelectorAll('.collection-picker.open').forEach(p => {
    p.classList.remove('open');
    p.setAttribute('aria-hidden', 'true');
  });
};

const openCollectionPicker = (wrapper, repoData) => {
  closeAllOtherPickers();

  const picker = wrapper.querySelector('.collection-picker');
  renderCollectionList(picker, repoData);
  picker.classList.add('open');
  picker.setAttribute('aria-hidden', 'false');

  const input = picker.querySelector('.collection-picker__input');
  if (input) input.focus();
};

const closeCollectionPicker = (picker) => {
  picker.classList.remove('open');
  picker.setAttribute('aria-hidden', 'true');
  const input = picker.querySelector('.collection-picker__input');
  if (input) input.value = '';
};

const handleToggleButton = (btn, picker, wrapper) => {
  const repoData = JSON.parse(btn.dataset.repo);
  if (picker.classList.contains('open')) {
    closeCollectionPicker(picker);
  } else {
    openCollectionPicker(wrapper, repoData);
  }
};

const handleCollectionItemSelect = (item, wrapper, picker, onUpdate) => {
  const collectionId = item.dataset.collectionId;
  const collectionBtn = wrapper.querySelector('.repo-card__collection');
  const repoData = JSON.parse(collectionBtn.dataset.repo);
  
  Storage.addToCollection(collectionId, repoData);
  const collection = Storage.getCollections().find(c => c.id === collectionId);
  showToast(`Added to "${collection?.name}"`, 'success');
  
  renderCollectionList(picker, repoData);
  
  if (onUpdate) onUpdate(repoData, collectionId);
};

const handleCreateCollection = (picker, wrapper, onUpdate) => {
  const input = picker.querySelector('.collection-picker__input');
  const name = input.value.trim();
  
  if (!name) return;
  
  const collectionBtn = wrapper.querySelector('.repo-card__collection');
  const repoData = JSON.parse(collectionBtn.dataset.repo);
  
  const newCollection = Storage.createCollection(name);
  Storage.addToCollection(newCollection.id, repoData);
  showToast(`Created "${name}" and added repo`, 'success');
  
  input.value = '';
  renderCollectionList(picker, repoData);
  
  if (onUpdate) onUpdate(repoData, newCollection.id);
};

export const handleCollectionClick = (e, onUpdate) => {
  const wrapper = e.target.closest('.repo-card__collection-wrapper');
  if (!wrapper) return;

  const btn = e.target.closest('.repo-card__collection');
  const picker = wrapper.querySelector('.collection-picker');
  
  if (btn) {
    handleToggleButton(btn, picker, wrapper);
    return;
  }

  const item = e.target.closest('.collection-picker__item');
  if (item && !item.disabled) {
    handleCollectionItemSelect(item, wrapper, picker, onUpdate);
    return;
  }

  const addBtn = e.target.closest('.collection-picker__add-btn');
  if (addBtn) {
    handleCreateCollection(picker, wrapper, onUpdate);
  }
};

export const handleCollectionKeydown = (e) => {
  if (e.key === 'Enter') {
    const input = e.target.closest('.collection-picker__input');
    if (input) {
      const addBtn = input.parentElement.querySelector('.collection-picker__add-btn');
      addBtn?.click();
    }
  }
  if (e.key === 'Escape') {
    const picker = e.target.closest('.collection-picker');
    if (picker) closeCollectionPicker(picker);
  }
};

export const initCollectionPickerCloseHandler = () => {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.repo-card__collection-wrapper')) {
      document.querySelectorAll('.collection-picker.open').forEach(closeCollectionPicker);
    }
  });
  
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.collection-picker.open').forEach(closeCollectionPicker);
    }
  });
};
