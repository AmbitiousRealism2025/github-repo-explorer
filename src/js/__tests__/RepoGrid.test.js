import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createRepoCard,
  renderRepoGrid,
  renderPagination,
  handleFavoriteToggle,
  handleFavoriteRemove,
  handlePaginationClick,
  handleCollectionClick,
  handleCollectionKeydown,
  initCollectionPickerCloseHandler
} from '../components/RepoGrid.js';
import { Storage } from '../common.js';

const mockRepo = {
  id: 123,
  full_name: 'owner/repo',
  description: 'Test description',
  html_url: 'https://github.com/owner/repo',
  stargazers_count: 1000,
  forks_count: 100,
  language: 'JavaScript',
  updated_at: '2025-01-01T00:00:00Z'
};

describe('RepoGrid', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    localStorage.clear();
  });

  describe('createRepoCard', () => {
    it('should create a card with repo information', () => {
      const card = createRepoCard(mockRepo);
      expect(card.tagName).toBe('ARTICLE');
      expect(card.className).toBe('repo-card');
      expect(card.querySelector('.repo-card__name').textContent).toBe('owner/repo');
      expect(card.querySelector('.repo-card__description').textContent).toBe('Test description');
    });

    it('should show favorite button as inactive by default', () => {
      const card = createRepoCard(mockRepo);
      const favoriteBtn = card.querySelector('.repo-card__favorite');
      expect(favoriteBtn.classList.contains('active')).toBe(false);
    });

    it('should show favorite button as active for favorited repo', () => {
      Storage.addFavorite(mockRepo);
      const card = createRepoCard(mockRepo);
      const favoriteBtn = card.querySelector('.repo-card__favorite');
      expect(favoriteBtn.classList.contains('active')).toBe(true);
    });

    it('should format star count', () => {
      const card = createRepoCard(mockRepo);
      expect(card.innerHTML).toContain('1.0k');
    });

    it('should show collection button by default', () => {
      const card = createRepoCard(mockRepo);
      expect(card.querySelector('.repo-card__collection')).not.toBeNull();
    });

    it('should hide collection button when showCollectionButton is false', () => {
      const card = createRepoCard(mockRepo, { showCollectionButton: false });
      expect(card.querySelector('.repo-card__collection')).toBeNull();
    });

    it('should handle missing description', () => {
      const repoNoDesc = { ...mockRepo, description: null };
      const card = createRepoCard(repoNoDesc);
      expect(card.querySelector('.repo-card__description').textContent).toBe('No description available');
    });

    it('should handle missing language', () => {
      const repoNoLang = { ...mockRepo, language: null };
      const card = createRepoCard(repoNoLang);
      expect(card.querySelector('.repo-card__language')).toBeNull();
    });

    it('should show remove-only button when showRemoveOnly is true', () => {
      const card = createRepoCard(mockRepo, { showRemoveOnly: true });
      const favoriteBtn = card.querySelector('.repo-card__favorite');
      expect(favoriteBtn.classList.contains('active')).toBe(true);
      expect(favoriteBtn.dataset.id).toBe('123');
    });

    it('should use custom date field', () => {
      const repoWithAddedAt = { ...mockRepo, addedAt: Date.now() };
      const card = createRepoCard(repoWithAddedAt, { dateField: 'addedAt', datePrefix: 'Added' });
      expect(card.innerHTML).toContain('Added');
    });

    it('should escape HTML in repo name and description', () => {
      const xssRepo = {
        ...mockRepo,
        full_name: '<script>alert("xss")</script>',
        description: '<img onerror="alert(1)">'
      };
      const card = createRepoCard(xssRepo);
      const nameEl = card.querySelector('.repo-card__name');
      const descEl = card.querySelector('.repo-card__description');
      expect(nameEl.textContent).toBe('<script>alert("xss")</script>');
      expect(descEl.textContent).toBe('<img onerror="alert(1)">');
      expect(nameEl.innerHTML).not.toContain('<script>');
      expect(descEl.innerHTML).not.toContain('<img');
    });
  });

  describe('renderRepoGrid', () => {
    it('should render multiple repo cards', () => {
      const container = document.createElement('div');
      const repos = [
        mockRepo,
        { ...mockRepo, id: 456, full_name: 'other/repo' }
      ];
      renderRepoGrid(container, repos);
      expect(container.querySelectorAll('.repo-card').length).toBe(2);
    });

    it('should clear container before rendering', () => {
      const container = document.createElement('div');
      container.innerHTML = '<div>Old content</div>';
      renderRepoGrid(container, [mockRepo]);
      expect(container.innerHTML).not.toContain('Old content');
    });

    it('should pass options to card creation', () => {
      const container = document.createElement('div');
      renderRepoGrid(container, [mockRepo], { showCollectionButton: false });
      expect(container.querySelector('.repo-card__collection')).toBeNull();
    });
  });

  describe('renderPagination', () => {
    it('should render pagination buttons', () => {
      const container = document.createElement('div');
      renderPagination(container, 1, 100);
      expect(container.querySelectorAll('.pagination__btn').length).toBeGreaterThan(0);
    });

    it('should not render pagination for single page', () => {
      const container = document.createElement('div');
      renderPagination(container, 1, 10);
      expect(container.innerHTML).toBe('');
    });

    it('should disable prev button on first page', () => {
      const container = document.createElement('div');
      renderPagination(container, 1, 100);
      const prevBtn = container.querySelector('[data-page="0"]');
      expect(prevBtn.disabled).toBe(true);
    });

    it('should disable next button on last page', () => {
      const container = document.createElement('div');
      renderPagination(container, 4, 100);
      const nextBtn = container.querySelector('[data-page="5"]');
      expect(nextBtn.disabled).toBe(true);
    });

    it('should mark current page as active', () => {
      const container = document.createElement('div');
      renderPagination(container, 2, 100);
      const activeBtn = container.querySelector('.pagination__btn.active');
      expect(activeBtn.dataset.page).toBe('2');
    });

    it('should show ellipsis for large page ranges', () => {
      const container = document.createElement('div');
      renderPagination(container, 10, 1000);
      expect(container.innerHTML).toContain('...');
    });

    it('should show first page button when not in range', () => {
      const container = document.createElement('div');
      renderPagination(container, 10, 1000);
      expect(container.querySelector('[data-page="1"]')).not.toBeNull();
    });
  });

  describe('handleFavoriteToggle', () => {
    it('should add favorite when not favorited', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__favorite');
      
      const onUpdate = vi.fn();
      handleFavoriteToggle({ target: btn }, onUpdate);
      
      expect(Storage.isFavorite(123)).toBe(true);
      expect(onUpdate).toHaveBeenCalledWith(expect.any(Object), true);
    });

    it('should remove favorite when already favorited', () => {
      Storage.addFavorite(mockRepo);
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__favorite');
      
      const onUpdate = vi.fn();
      handleFavoriteToggle({ target: btn }, onUpdate);
      
      expect(Storage.isFavorite(123)).toBe(false);
      expect(onUpdate).toHaveBeenCalledWith(expect.any(Object), false);
    });

    it('should do nothing if not clicking favorite button', () => {
      const onUpdate = vi.fn();
      handleFavoriteToggle({ target: document.body }, onUpdate);
      expect(onUpdate).not.toHaveBeenCalled();
    });
  });

  describe('handleFavoriteRemove', () => {
    it('should remove favorite', () => {
      Storage.addFavorite(mockRepo);
      const card = createRepoCard(mockRepo, { showRemoveOnly: true });
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__favorite');
      
      const onRemove = vi.fn();
      handleFavoriteRemove({ target: btn }, onRemove);
      
      expect(Storage.isFavorite(123)).toBe(false);
      expect(onRemove).toHaveBeenCalledWith(123);
    });

    it('should do nothing if not clicking favorite button', () => {
      const onRemove = vi.fn();
      handleFavoriteRemove({ target: document.body }, onRemove);
      expect(onRemove).not.toHaveBeenCalled();
    });
  });

  describe('handlePaginationClick', () => {
    it('should call onPageChange with page number', () => {
      const container = document.createElement('div');
      renderPagination(container, 1, 100);
      document.body.appendChild(container);
      
      const btn = container.querySelector('[data-page="2"]');
      const onPageChange = vi.fn();
      
      handlePaginationClick({ target: btn }, onPageChange);
      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('should not call onPageChange for disabled button', () => {
      const container = document.createElement('div');
      renderPagination(container, 1, 100);
      document.body.appendChild(container);
      
      const prevBtn = container.querySelector('[data-page="0"]');
      const onPageChange = vi.fn();
      
      handlePaginationClick({ target: prevBtn }, onPageChange);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it('should do nothing if not clicking pagination button', () => {
      const onPageChange = vi.fn();
      handlePaginationClick({ target: document.body }, onPageChange);
      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Collection Picker', () => {
    it('should open collection picker on button click', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__collection');
      
      handleCollectionClick({ target: btn });
      
      const picker = card.querySelector('.collection-picker');
      expect(picker.classList.contains('open')).toBe(true);
    });

    it('should close collection picker when open and clicking button', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__collection');
      
      handleCollectionClick({ target: btn });
      handleCollectionClick({ target: btn });
      
      const picker = card.querySelector('.collection-picker');
      expect(picker.classList.contains('open')).toBe(false);
    });

    it('should show empty state when no collections', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__collection');
      
      handleCollectionClick({ target: btn });
      
      const list = card.querySelector('.collection-picker__list');
      expect(list.innerHTML).toContain('No collections yet');
    });

    it('should list existing collections', () => {
      Storage.createCollection('My Collection');
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      const btn = card.querySelector('.repo-card__collection');
      
      handleCollectionClick({ target: btn });
      
      const list = card.querySelector('.collection-picker__list');
      expect(list.innerHTML).toContain('My Collection');
    });

    it('should add repo to collection on item click', () => {
      const collection = Storage.createCollection('My Collection');
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const item = card.querySelector('.collection-picker__item');
      const onUpdate = vi.fn();
      handleCollectionClick({ target: item }, onUpdate);
      
      const collections = Storage.getCollections();
      expect(collections[0].repos.length).toBe(1);
      expect(onUpdate).toHaveBeenCalled();
    });

    it('should create new collection and add repo', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const input = card.querySelector('.collection-picker__input');
      input.value = 'New Collection';
      
      const addBtn = card.querySelector('.collection-picker__add-btn');
      const onUpdate = vi.fn();
      handleCollectionClick({ target: addBtn }, onUpdate);
      
      const collections = Storage.getCollections();
      expect(collections.length).toBe(1);
      expect(collections[0].name).toBe('New Collection');
      expect(collections[0].repos.length).toBe(1);
    });

    it('should not create collection with empty name', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const addBtn = card.querySelector('.collection-picker__add-btn');
      handleCollectionClick({ target: addBtn });
      
      expect(Storage.getCollections().length).toBe(0);
    });

    it('should show checkmark for repos already in collection', () => {
      const collection = Storage.createCollection('My Collection');
      Storage.addToCollection(collection.id, mockRepo);
      
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const item = card.querySelector('.collection-picker__item');
      expect(item.classList.contains('collection-picker__item--active')).toBe(true);
      expect(item.disabled).toBe(true);
    });

    it('should detect imported repos by full_name (fix for imported collection bug)', () => {
      const collection = Storage.createCollection('Imported Collection');
      Storage.addToCollection(collection.id, { id: 'owner/repo', full_name: 'owner/repo' });
      
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const item = card.querySelector('.collection-picker__item');
      expect(item.classList.contains('collection-picker__item--active')).toBe(true);
      expect(item.disabled).toBe(true);
    });

    it('should do nothing for click outside wrapper', () => {
      const onUpdate = vi.fn();
      handleCollectionClick({ target: document.body }, onUpdate);
      expect(onUpdate).not.toHaveBeenCalled();
    });

    it('should not add to disabled item', () => {
      const collection = Storage.createCollection('My Collection');
      Storage.addToCollection(collection.id, mockRepo);
      
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const item = card.querySelector('.collection-picker__item');
      const initialRepoCount = Storage.getCollections()[0].repos.length;
      handleCollectionClick({ target: item });
      
      expect(Storage.getCollections()[0].repos.length).toBe(initialRepoCount);
    });
  });

  describe('handleCollectionKeydown', () => {
    it('should trigger add button on Enter in input', () => {
      Storage.createCollection('Test');
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const input = card.querySelector('.collection-picker__input');
      input.value = 'New Collection';
      
      const addBtn = card.querySelector('.collection-picker__add-btn');
      addBtn.click = vi.fn();
      
      handleCollectionKeydown({ key: 'Enter', target: input });
      expect(addBtn.click).toHaveBeenCalled();
    });

    it('should close picker on Escape', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const picker = card.querySelector('.collection-picker');
      expect(picker.classList.contains('open')).toBe(true);
      
      handleCollectionKeydown({ key: 'Escape', target: picker });
      expect(picker.classList.contains('open')).toBe(false);
    });

    it('should do nothing for other keys', () => {
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const input = card.querySelector('.collection-picker__input');
      const addBtn = card.querySelector('.collection-picker__add-btn');
      addBtn.click = vi.fn();
      
      handleCollectionKeydown({ key: 'Tab', target: input });
      expect(addBtn.click).not.toHaveBeenCalled();
    });
  });

  describe('initCollectionPickerCloseHandler', () => {
    it('should close pickers on outside click', () => {
      initCollectionPickerCloseHandler();
      
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      // Add an outside element to click on
      const outsideElement = document.createElement('div');
      outsideElement.className = 'outside-target';
      document.body.appendChild(outsideElement);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const picker = card.querySelector('.collection-picker');
      expect(picker.classList.contains('open')).toBe(true);
      
      // Click on the outside element (not document directly - jsdom issue)
      outsideElement.click();
      expect(picker.classList.contains('open')).toBe(false);
    });

    it('should close pickers on Escape key', () => {
      initCollectionPickerCloseHandler();
      
      const card = createRepoCard(mockRepo);
      document.body.appendChild(card);
      
      const btn = card.querySelector('.repo-card__collection');
      handleCollectionClick({ target: btn });
      
      const picker = card.querySelector('.collection-picker');
      expect(picker.classList.contains('open')).toBe(true);
      
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(picker.classList.contains('open')).toBe(false);
    });
  });
});
