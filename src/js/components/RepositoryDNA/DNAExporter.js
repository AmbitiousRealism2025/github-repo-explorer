/**
 * DNAExporter Module
 * Handles downloading and sharing DNA visualizations
 *
 * @module components/RepositoryDNA/DNAExporter
 */

import { renderForExport, renderForSocialShare } from './DNARenderer.js';

/**
 * Download DNA as PNG image
 * @param {Object} dnaData - DNA data structure
 * @param {Object} [options] - Download options
 * @param {number} [options.size=800] - Image size in pixels
 * @param {string} [options.filename] - Custom filename (without extension)
 */
export function downloadDNAImage(dnaData, options = {}) {
  const { size = 800, filename } = options;

  const canvas = renderForExport(dnaData, size);
  const defaultFilename = dnaData.repoName.replace('/', '-') + '-dna';
  const finalFilename = filename || defaultFilename;

  const link = document.createElement('a');
  link.download = `${finalFilename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download social share image
 * @param {Object} dnaData - DNA data structure
 * @param {Object} [options] - Download options
 * @param {string} [options.filename] - Custom filename (without extension)
 */
export function downloadSocialShareImage(dnaData, options = {}) {
  const { filename } = options;

  const canvas = renderForSocialShare(dnaData);
  const defaultFilename = dnaData.repoName.replace('/', '-') + '-dna-share';
  const finalFilename = filename || defaultFilename;

  const link = document.createElement('a');
  link.download = `${finalFilename}.png`;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Copy DNA image to clipboard
 * @param {Object} dnaData - DNA data structure
 * @param {number} [size=400] - Image size
 * @returns {Promise<boolean>} - Success status
 */
export async function copyDNAToClipboard(dnaData, size = 400) {
  const canvas = renderForExport(dnaData, size);

  try {
    // Modern Clipboard API
    if (navigator.clipboard && navigator.clipboard.write) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      return true;
    }

    // Fallback: copy data URL as text
    const dataUrl = canvas.toDataURL('image/png');
    await navigator.clipboard.writeText(dataUrl);
    return true;
  } catch (error) {
    console.error('Failed to copy DNA to clipboard:', error);
    return false;
  }
}

/**
 * Get DNA as data URL
 * @param {Object} dnaData - DNA data structure
 * @param {number} [size=400] - Image size
 * @returns {string} - Data URL
 */
export function getDNADataUrl(dnaData, size = 400) {
  const canvas = renderForExport(dnaData, size);
  return canvas.toDataURL('image/png');
}

/**
 * DNA Cache Manager
 * Caches rendered DNA images in localStorage
 */
export const DNACache = {
  CACHE_KEY: 'gh-explorer-dna-cache',
  CACHE_VERSION: 1,
  MAX_ENTRIES: 50,

  /**
   * Get cached DNA data URL
   * @param {number} repoId - Repository ID
   * @returns {string|null} - Cached data URL or null
   */
  get(repoId) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');
      const entry = cache[repoId];

      if (entry && entry.version === this.CACHE_VERSION) {
        // Update last accessed time
        entry.lastAccessed = Date.now();
        localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
        return entry.dataUrl;
      }
    } catch (error) {
      console.warn('DNA cache read error:', error);
    }
    return null;
  },

  /**
   * Set cached DNA data URL
   * @param {number} repoId - Repository ID
   * @param {string} dataUrl - Data URL to cache
   */
  set(repoId, dataUrl) {
    try {
      const cache = JSON.parse(localStorage.getItem(this.CACHE_KEY) || '{}');

      // Prune if too many entries
      const entries = Object.entries(cache);
      if (entries.length >= this.MAX_ENTRIES) {
        // Remove least recently accessed
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        const toRemove = entries.slice(0, 10);
        toRemove.forEach(([key]) => delete cache[key]);
      }

      cache[repoId] = {
        version: this.CACHE_VERSION,
        dataUrl,
        lastAccessed: Date.now(),
        created: Date.now(),
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('DNA cache write error:', error);
    }
  },

  /**
   * Clear all cached DNA
   */
  clear() {
    localStorage.removeItem(this.CACHE_KEY);
  },
};
