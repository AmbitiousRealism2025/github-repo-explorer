/**
 * Repository DNA Component
 * Creates a unique visual "fingerprint" for each repository
 *
 * @example
 * import { createRepositoryDNA } from './components/RepositoryDNA/index.js';
 *
 * const dnaWidget = createRepositoryDNA(repoData, { animate: true });
 * container.appendChild(dnaWidget);
 *
 * @module components/RepositoryDNA
 */

import { generateDNAData, generateDNADescription } from './DNAGenerator.js';
import { createDNACanvas, createAnimatedDNACanvas } from './DNARenderer.js';
import { downloadDNAImage, copyDNAToClipboard, DNACache, getDNADataUrl } from './DNAExporter.js';

/**
 * Create a Repository DNA visualization component
 * @param {Object} repo - Repository data object from GitHub API
 * @param {Object} [options] - Component options
 * @param {number} [options.size=200] - Canvas size in pixels
 * @param {boolean} [options.animate=true] - Enable pulse animation
 * @param {boolean} [options.showLabel=true] - Show "Repository DNA" label
 * @param {boolean} [options.showActions=true] - Show download/copy buttons
 * @param {Object} [options.languages] - Language breakdown from API
 * @returns {HTMLElement} - DNA component element
 */
export function createRepositoryDNA(repo, options = {}) {
  const {
    size = 200,
    animate = true,
    showLabel = true,
    showActions = true,
    languages = {},
  } = options;

  // Generate DNA data
  const dnaData = generateDNAData(repo, { languages });

  // Create container
  const container = document.createElement('div');
  container.className = 'repo-dna';
  if (animate) {
    container.classList.add('repo-dna--animate');
  }

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = animate && !prefersReducedMotion;

  // Create canvas
  let canvas;
  let animationController = null;

  if (shouldAnimate) {
    animationController = createAnimatedDNACanvas(dnaData, size);
    canvas = animationController.canvas;
  } else {
    canvas = createDNACanvas(dnaData, size);
  }

  // Set accessibility attributes
  const description = generateDNADescription(dnaData);
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', description);

  // Build component HTML
  container.innerHTML = `
    <div class="repo-dna__header">
      ${showLabel ? '<span class="repo-dna__title">Repository DNA</span>' : ''}
    </div>
    <div class="repo-dna__canvas-wrapper"></div>
    ${showActions ? `
      <div class="repo-dna__actions">
        <button class="repo-dna__action btn btn--sm btn--ghost" data-action="download" title="Download DNA image">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="repo-dna__action-icon">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          <span>Download</span>
        </button>
        <button class="repo-dna__action btn btn--sm btn--ghost" data-action="copy" title="Copy DNA to clipboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="repo-dna__action-icon">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          <span>Copy</span>
        </button>
      </div>
    ` : ''}
    <div class="repo-dna__meta">
      <span class="repo-dna__language" style="--lang-color: ${dnaData.colors.primary}">
        ${dnaData.metadata.language}
      </span>
      <span class="repo-dna__info">${dnaData.geometry.sides}-sided • ${dnaData.pattern.density} density</span>
    </div>
  `;

  // Insert canvas
  const canvasWrapper = container.querySelector('.repo-dna__canvas-wrapper');
  canvasWrapper.appendChild(canvas);

  // Set up action handlers
  if (showActions) {
    const downloadBtn = container.querySelector('[data-action="download"]');
    const copyBtn = container.querySelector('[data-action="copy"]');

    downloadBtn.addEventListener('click', () => {
      downloadDNAImage(dnaData);
      showToast('DNA image downloaded!');
    });

    copyBtn.addEventListener('click', async () => {
      const success = await copyDNAToClipboard(dnaData);
      if (success) {
        showToast('DNA copied to clipboard!');
      } else {
        showToast('Failed to copy DNA', 'error');
      }
    });
  }

  // Handle visibility for animation performance
  if (animationController && typeof IntersectionObserver !== 'undefined') {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animationController.start();
        } else {
          animationController.stop();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(container);

    // Clean up on removal
    const originalRemove = container.remove.bind(container);
    container.remove = () => {
      observer.disconnect();
      animationController.stop();
      originalRemove();
    };
  }

  // Store DNA data on element for external access
  container._dnaData = dnaData;

  return container;
}

/**
 * Create a mini DNA badge for card views
 * @param {Object} repo - Repository data
 * @param {number} [size=40] - Badge size
 * @returns {HTMLElement} - Mini DNA badge element
 */
export function createDNABadge(repo, size = 40) {
  const dnaData = generateDNAData(repo);

  // Check cache first
  let dataUrl = DNACache.get(repo.id);
  if (!dataUrl) {
    dataUrl = getDNADataUrl(dnaData, size * 2); // 2x for retina
    DNACache.set(repo.id, dataUrl);
  }

  const badge = document.createElement('div');
  badge.className = 'repo-dna-badge';
  badge.style.width = `${size}px`;
  badge.style.height = `${size}px`;

  const img = document.createElement('img');
  img.src = dataUrl;
  img.alt = `DNA for ${repo.full_name}`;
  img.className = 'repo-dna-badge__img';

  badge.appendChild(img);
  return badge;
}

/**
 * Show a toast notification
 * @param {string} message - Toast message
 * @param {string} [type='success'] - Toast type
 */
function showToast(message, type = 'success') {
  // Use global showToast if available, otherwise create simple toast
  if (typeof window.showToast === 'function') {
    window.showToast(message);
    return;
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 24px;
    background: var(--color-bg-secondary, #333);
    color: var(--color-text-primary, #fff);
    border-radius: 8px;
    z-index: 10000;
    animation: fadeIn 0.2s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 2000);
}

// Export sub-modules for advanced usage
export { generateDNAData, generateDNADescription } from './DNAGenerator.js';
export { createDNACanvas, createAnimatedDNACanvas, renderForExport, renderForSocialShare } from './DNARenderer.js';
export { downloadDNAImage, downloadSocialShareImage, copyDNAToClipboard, DNACache } from './DNAExporter.js';
export { LANGUAGE_COLORS, getLanguageColor } from './colors.js';
