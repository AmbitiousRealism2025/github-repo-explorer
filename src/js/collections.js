import { initTheme, toggleTheme, Storage, formatNumber, formatDate, showToast, escapeHtml } from './common.js';
import { initErrorBoundary } from './errorBoundary.js';

// Import validation constants
const MAX_IMPORT_SIZE = 10 * 1024; // 10KB max for base64 payload
const MAX_REPOS_PER_IMPORT = 100;  // Maximum repositories per import
const MAX_NAME_LENGTH = 100;       // Maximum collection name length

/**
 * Validates imported collection data structure and content
 * @param {Object} data - Parsed import data
 * @returns {boolean} True if valid, false otherwise
 */
const validateImportData = (data) => {
  // Check basic structure
  if (!data || typeof data !== 'object') return false;
  
  // Validate name
  if (!data.name || typeof data.name !== 'string') return false;
  if (data.name.length > MAX_NAME_LENGTH) return false;
  if (data.name.trim().length === 0) return false;
  
  // Validate repos array
  if (!Array.isArray(data.repos)) return false;
  if (data.repos.length > MAX_REPOS_PER_IMPORT) return false;
  
  // Validate each repo entry (must be string in "owner/repo" format)
  return data.repos.every(r => 
    typeof r === 'string' && 
    r.includes('/') && 
    r.split('/').length === 2 &&
    r.split('/').every(part => part.trim().length > 0)
  );
};

initTheme();
initErrorBoundary();

const collectionsList = document.getElementById('collections-list');
const emptyState = document.getElementById('empty-state');
const createBtn = document.getElementById('create-collection-btn');
const modal = document.getElementById('collection-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const collectionNameInput = document.getElementById('collection-name');
const collectionDescInput = document.getElementById('collection-description');
const themeToggle = document.getElementById('theme-toggle');

let editingCollectionId = null;

const renderCollections = () => {
  const collections = Storage.getCollections();
  
  if (collections.length === 0) {
    collectionsList.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }
  
  emptyState.classList.add('hidden');
  
  collectionsList.innerHTML = collections.map(collection => `
    <div class="collection-card" data-id="${collection.id}">
      <div class="collection-card__header">
        <h3 class="collection-card__name">${escapeHtml(collection.name)}</h3>
        <div class="collection-card__actions">
          <button class="btn btn--sm btn--ghost collection-edit" data-id="${collection.id}" aria-label="Edit collection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn btn--sm btn--ghost collection-delete" data-id="${collection.id}" aria-label="Delete collection">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
            </svg>
          </button>
        </div>
      </div>
      ${collection.description ? `<p class="collection-card__description">${escapeHtml(collection.description)}</p>` : ''}
      <div class="collection-card__meta">
        <span class="collection-card__count">${collection.repos.length} repositories</span>
        <span class="collection-card__date">Created ${formatDate(collection.createdAt)}</span>
      </div>
      <div class="collection-card__repos">
        ${collection.repos.slice(0, 3).map(repo => `
          <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="collection-card__repo">
            ${escapeHtml(repo.full_name)}
          </a>
        `).join('')}
        ${collection.repos.length > 3 ? `<span class="collection-card__more">+${collection.repos.length - 3} more</span>` : ''}
      </div>
      <div class="collection-card__footer">
        <button class="btn btn--sm btn--secondary collection-export" data-id="${collection.id}">
          Export as Markdown
        </button>
        <button class="btn btn--sm btn--secondary collection-share" data-id="${collection.id}">
          Copy Share Link
        </button>
      </div>
    </div>
  `).join('');
  
  attachCollectionListeners();
};

const attachCollectionListeners = () => {
  document.querySelectorAll('.collection-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.id;
      const collection = Storage.getCollections().find(c => c.id === id);
      if (collection) {
        editingCollectionId = id;
        modalTitle.textContent = 'Edit Collection';
        collectionNameInput.value = collection.name;
        collectionDescInput.value = collection.description || '';
        modal.classList.add('open');
      }
    });
  });
  
  document.querySelectorAll('.collection-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this collection?')) {
        Storage.deleteCollection(btn.dataset.id);
        renderCollections();
        showToast('Collection deleted', 'success');
      }
    });
  });
  
  document.querySelectorAll('.collection-export').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const collection = Storage.getCollections().find(c => c.id === btn.dataset.id);
      if (collection) {
        const markdown = generateMarkdown(collection);
        navigator.clipboard.writeText(markdown);
        showToast('Markdown copied to clipboard', 'success');
      }
    });
  });
  
  document.querySelectorAll('.collection-share').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const collection = Storage.getCollections().find(c => c.id === btn.dataset.id);
      if (collection) {
        // Use UTF-8 encoding before base64 to handle Unicode characters
        const jsonStr = JSON.stringify({
          name: collection.name,
          repos: collection.repos.map(r => r.full_name)
        });
        const shareData = btoa(unescape(encodeURIComponent(jsonStr)));
        const shareUrl = `${window.location.origin}/collections.html#import=${shareData}`;
        navigator.clipboard.writeText(shareUrl);
        showToast('Share link copied to clipboard', 'success');
      }
    });
  });
};

const generateMarkdown = (collection) => {
  let md = `# ${collection.name}\n\n`;
  if (collection.description) {
    md += `${collection.description}\n\n`;
  }
  md += `## Repositories\n\n`;
  collection.repos.forEach(repo => {
    md += `- [${repo.full_name}](https://github.com/${repo.full_name})`;
    if (repo.description) {
      md += ` - ${repo.description}`;
    }
    md += `\n`;
  });
  return md;
};

const openModal = () => {
  editingCollectionId = null;
  modalTitle.textContent = 'New Collection';
  collectionNameInput.value = '';
  collectionDescInput.value = '';
  modal.classList.add('open');
};

const closeModal = () => {
  modal.classList.remove('open');
  editingCollectionId = null;
};

const saveCollection = () => {
  const name = collectionNameInput.value.trim();
  if (!name) {
    showToast('Please enter a collection name', 'error');
    return;
  }
  
  if (editingCollectionId) {
    Storage.updateCollection(editingCollectionId, {
      name,
      description: collectionDescInput.value.trim()
    });
    showToast('Collection updated', 'success');
  } else {
    Storage.createCollection(name, collectionDescInput.value.trim());
    showToast('Collection created', 'success');
  }
  
  closeModal();
  renderCollections();
};

const checkImportHash = () => {
  const hash = window.location.hash;
  if (hash.startsWith('#import=')) {
    try {
      const importData = hash.substring(8);
      
      if (importData.length > MAX_IMPORT_SIZE) {
        showToast('Import data too large', 'error');
        return;
      }
      
      const data = JSON.parse(decodeURIComponent(escape(atob(importData))));
      
      if (!validateImportData(data)) {
        showToast('Invalid collection format', 'error');
        return;
      }
      
      const existingNames = Storage.getCollections().map(c => c.name);
      let newName = data.name;
      let counter = 1;
      while (existingNames.includes(newName)) {
        newName = `${data.name} (${counter++})`;
      }
      
      Storage.createCollection(newName, `Imported collection with ${data.repos.length} repositories`);
      const collections = Storage.getCollections();
      const newCollection = collections[collections.length - 1];
      
      data.repos.forEach(fullName => {
        Storage.addToCollection(newCollection.id, { full_name: fullName, id: fullName });
      });
      
      window.location.hash = '';
      showToast(`Imported collection "${newName}"`, 'success');
      renderCollections();
    } catch {
      showToast('Invalid import link', 'error');
    }
  }
};

createBtn.addEventListener('click', openModal);
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalSave.addEventListener('click', saveCollection);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
themeToggle.addEventListener('click', toggleTheme);

checkImportHash();
renderCollections();
