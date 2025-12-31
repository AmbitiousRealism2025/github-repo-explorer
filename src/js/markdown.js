/**
 * Secure Markdown Renderer
 *
 * Renders markdown to sanitized HTML using marked + DOMPurify.
 * Includes security hooks to prevent reverse tabnabbing attacks.
 */

import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for GitHub-flavored markdown
marked.setOptions({
  gfm: true,
  breaks: true
});

/**
 * Initialize DOMPurify with security hooks
 * Must be called once before rendering
 */
let isInitialized = false;

const initializeDOMPurify = () => {
  if (isInitialized) return;

  // Add hook to prevent reverse tabnabbing and block dangerous URLs
  DOMPurify.addHook('afterSanitizeAttributes', (node) => {
    // Handle links - prevent reverse tabnabbing
    if (node.tagName === 'A') {
      // If link has target attribute, add security rel
      if (node.hasAttribute('target')) {
        node.setAttribute('rel', 'noopener noreferrer');
      }
      // Make all external links open in new tab with security attributes
      if (node.hasAttribute('href') && !node.getAttribute('href')?.startsWith('#')) {
        node.setAttribute('target', '_blank');
        node.setAttribute('rel', 'noopener noreferrer');
      }
    }

    // Handle images - block data: URLs to prevent XSS
    if (node.tagName === 'IMG') {
      const src = node.getAttribute('src') || '';
      if (src.startsWith('data:')) {
        node.removeAttribute('src');
      }
    }
  });

  isInitialized = true;
};

/**
 * DOMPurify configuration for README content
 */
const SANITIZE_CONFIG = {
  // Allow common HTML elements for markdown
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
    'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'div', 'span',
    'details', 'summary',
    'sup', 'sub',
    'kbd', 'mark'
  ],
  // Allow necessary attributes
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'class', 'id',
    'target', 'rel',
    'width', 'height',
    'align', 'colspan', 'rowspan'
  ],
  // Only allow safe URL protocols
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
  // Forbid data: and javascript: URLs in src and href
  FORBID_ATTR: [],
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input']
};

/**
 * Render markdown to sanitized HTML
 *
 * @param {string} markdown - Raw markdown content
 * @returns {string} Sanitized HTML string
 *
 * @example
 * const html = renderMarkdown('# Hello\n\nThis is **bold**');
 * element.innerHTML = html;
 */
export const renderMarkdown = (markdown) => {
  if (!markdown || typeof markdown !== 'string') {
    return '';
  }

  // Ensure DOMPurify hooks are set up
  initializeDOMPurify();

  // Parse markdown to HTML
  const rawHtml = marked.parse(markdown);

  // Sanitize HTML to prevent XSS
  const cleanHtml = DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG);

  return cleanHtml;
};

/**
 * Check if DOMPurify is properly initialized
 * Useful for testing
 *
 * @returns {boolean} Whether the security hooks are set up
 */
export const isSecurityInitialized = () => isInitialized;

/**
 * Reset initialization state (for testing only)
 */
export const _resetForTesting = () => {
  isInitialized = false;
  DOMPurify.removeAllHooks();
};
