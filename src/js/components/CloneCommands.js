import { showToast, escapeHtml } from '../common.js';

export const createCloneCommands = (fullName, hasDevContainer = false) => {
  const commands = [
    { label: 'HTTPS', cmd: `git clone https://github.com/${fullName}.git` },
    { label: 'SSH', cmd: `git clone git@github.com:${fullName}.git` },
    { label: 'GitHub CLI', cmd: `gh repo clone ${fullName}` },
    { label: 'Degit', cmd: `npx degit ${fullName} my-project` },
  ];

  if (hasDevContainer) {
    commands.push({ label: 'Dev Container', cmd: `gh cs create -r ${fullName}` });
  }

  const container = document.createElement('div');
  container.className = 'clone-commands';
  container.innerHTML = `
    <div class="clone-commands__header">
      <span class="clone-commands__title">Clone</span>
    </div>
    <div class="clone-commands__tabs">
      ${commands.map((c, i) => `
        <button class="clone-commands__tab ${i === 0 ? 'active' : ''}" data-index="${i}">
          ${escapeHtml(c.label)}
        </button>
      `).join('')}
    </div>
    <div class="clone-commands__input-wrapper">
      <input type="text" class="clone-commands__input" value="${escapeHtml(commands[0].cmd)}" readonly>
      <button class="clone-commands__copy" aria-label="Copy to clipboard">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>
    </div>
  `;

  const input = container.querySelector('.clone-commands__input');
  const tabs = container.querySelectorAll('.clone-commands__tab');
  const copyBtn = container.querySelector('.clone-commands__copy');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      input.value = commands[parseInt(tab.dataset.index)].cmd;
    });
  });

  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      showToast('Copied to clipboard', 'success');
    } catch {
      // Fallback for file://, HTTP, or browsers without Clipboard API
      try {
        input.select();
        input.setSelectionRange(0, 99999); // Mobile support
        const success = document.execCommand('copy');
        if (success) {
          showToast('Copied to clipboard', 'success');
        } else {
          throw new Error('execCommand returned false');
        }
      } catch {
        showToast('Failed to copy - please copy manually', 'error');
      }
    }
  });

  return container;
};
