import { Storage, showToast, escapeHtml } from '../common.js';

export const createRepoNotes = (repoFullName) => {
  const existingNote = Storage.getNote(repoFullName);
  
  const container = document.createElement('div');
  container.className = 'repo-notes';
  container.innerHTML = `
    <div class="repo-notes__header">
      <span class="repo-notes__title">My Notes</span>
      <span class="repo-notes__status"></span>
    </div>
    <textarea 
      class="repo-notes__textarea" 
      placeholder="Add private notes about this repository..."
      rows="4"
    >${existingNote ? escapeHtml(existingNote.content) : ''}</textarea>
    <div class="repo-notes__footer">
      <span class="repo-notes__hint">Notes are saved locally in your browser</span>
      <button class="repo-notes__save btn btn--sm btn--primary">Save Note</button>
    </div>
  `;

  const textarea = container.querySelector('.repo-notes__textarea');
  const saveBtn = container.querySelector('.repo-notes__save');
  const status = container.querySelector('.repo-notes__status');

  let saveTimeout;

  const updateStatus = (text, type = 'info') => {
    status.textContent = text;
    status.className = `repo-notes__status repo-notes__status--${type}`;
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      status.textContent = '';
    }, 2000);
  };

  saveBtn.addEventListener('click', () => {
    Storage.saveNote(repoFullName, textarea.value);
    if (textarea.value.trim()) {
      updateStatus('Saved', 'success');
      showToast('Note saved', 'success');
    } else {
      updateStatus('Cleared', 'info');
      showToast('Note cleared', 'info');
    }
  });

  textarea.addEventListener('blur', () => {
    const current = Storage.getNote(repoFullName);
    const currentContent = current ? current.content : '';
    if (textarea.value !== currentContent) {
      Storage.saveNote(repoFullName, textarea.value);
      updateStatus('Auto-saved', 'success');
    }
  });

  return container;
};
