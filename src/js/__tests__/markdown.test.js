import { describe, it, expect, beforeEach } from 'vitest';
import { renderMarkdown, isSecurityInitialized, _resetForTesting } from '../markdown.js';

describe('Markdown Renderer', () => {
  beforeEach(() => {
    _resetForTesting();
  });

  describe('renderMarkdown', () => {
    it('should return empty string for null input', () => {
      expect(renderMarkdown(null)).toBe('');
    });

    it('should return empty string for undefined input', () => {
      expect(renderMarkdown(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(renderMarkdown('')).toBe('');
    });

    it('should return empty string for non-string input', () => {
      expect(renderMarkdown(123)).toBe('');
      expect(renderMarkdown({})).toBe('');
      expect(renderMarkdown([])).toBe('');
    });

    it('should render basic markdown headings', () => {
      const html = renderMarkdown('# Hello World');
      expect(html).toContain('<h1');
      expect(html).toContain('Hello World');
    });

    it('should render bold text', () => {
      const html = renderMarkdown('**bold text**');
      expect(html).toContain('<strong>bold text</strong>');
    });

    it('should render italic text', () => {
      const html = renderMarkdown('*italic text*');
      expect(html).toContain('<em>italic text</em>');
    });

    it('should render links', () => {
      const html = renderMarkdown('[GitHub](https://github.com)');
      expect(html).toContain('<a');
      expect(html).toContain('href="https://github.com"');
      expect(html).toContain('GitHub');
    });

    it('should render unordered lists', () => {
      const html = renderMarkdown('- Item 1\n- Item 2');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
      expect(html).toContain('Item 1');
      expect(html).toContain('Item 2');
    });

    it('should render ordered lists', () => {
      const html = renderMarkdown('1. First\n2. Second');
      expect(html).toContain('<ol>');
      expect(html).toContain('<li>');
    });

    it('should render code blocks', () => {
      const html = renderMarkdown('```\nconst x = 1;\n```');
      expect(html).toContain('<pre>');
      expect(html).toContain('<code>');
    });

    it('should render inline code', () => {
      const html = renderMarkdown('Use `npm install`');
      expect(html).toContain('<code>npm install</code>');
    });

    it('should render blockquotes', () => {
      const html = renderMarkdown('> This is a quote');
      expect(html).toContain('<blockquote>');
      expect(html).toContain('This is a quote');
    });

    it('should render tables', () => {
      const markdown = '| A | B |\n|---|---|\n| 1 | 2 |';
      const html = renderMarkdown(markdown);
      expect(html).toContain('<table>');
      expect(html).toContain('<th>');
      expect(html).toContain('<td>');
    });

    it('should render images', () => {
      const html = renderMarkdown('![Alt text](https://example.com/image.png)');
      expect(html).toContain('<img');
      expect(html).toContain('src="https://example.com/image.png"');
      expect(html).toContain('alt="Alt text"');
    });
  });

  describe('Security - XSS Prevention', () => {
    it('should strip script tags', () => {
      const html = renderMarkdown('<script>alert("xss")</script>');
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('alert');
    });

    it('should strip onclick handlers', () => {
      const html = renderMarkdown('<a href="#" onclick="alert(1)">Click</a>');
      expect(html).not.toContain('onclick');
    });

    it('should strip javascript: URLs', () => {
      const html = renderMarkdown('[Click](javascript:alert(1))');
      expect(html).not.toContain('javascript:');
    });

    it('should strip data: URLs in images', () => {
      const html = renderMarkdown('![img](data:text/html,<script>alert(1)</script>)');
      // The src attribute should be removed, leaving an img without src
      expect(html).toContain('<img');
      expect(html).not.toContain('src="data:');
    });

    it('should strip style tags', () => {
      const html = renderMarkdown('<style>body { display: none; }</style>');
      expect(html).not.toContain('<style>');
    });

    it('should strip iframe tags', () => {
      const html = renderMarkdown('<iframe src="https://evil.com"></iframe>');
      expect(html).not.toContain('<iframe');
    });

    it('should strip form elements', () => {
      const html = renderMarkdown('<form action="https://evil.com"><input type="submit"></form>');
      expect(html).not.toContain('<form');
      expect(html).not.toContain('<input');
    });

    it('should strip object and embed tags', () => {
      const html = renderMarkdown('<object data="evil.swf"></object><embed src="evil.swf">');
      expect(html).not.toContain('<object');
      expect(html).not.toContain('<embed');
    });
  });

  describe('Security - Reverse Tabnabbing Prevention', () => {
    it('should add rel="noopener noreferrer" to external links', () => {
      const html = renderMarkdown('[External](https://example.com)');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('should add target="_blank" to external links', () => {
      const html = renderMarkdown('[External](https://example.com)');
      expect(html).toContain('target="_blank"');
    });

    it('should not add target to anchor links', () => {
      const html = renderMarkdown('[Section](#section)');
      expect(html).not.toContain('target="_blank"');
    });

    it('should preserve security attributes on links with existing target', () => {
      // When HTML link has target already
      const html = renderMarkdown('<a href="https://evil.com" target="_blank">Click</a>');
      expect(html).toContain('rel="noopener noreferrer"');
    });

    it('should handle mailto links without target', () => {
      const html = renderMarkdown('[Email](mailto:test@example.com)');
      // mailto links should still get target="_blank" per our implementation
      expect(html).toContain('href="mailto:test@example.com"');
    });
  });

  describe('Security Initialization', () => {
    it('should initialize security hooks on first render', () => {
      expect(isSecurityInitialized()).toBe(false);
      renderMarkdown('# Test');
      expect(isSecurityInitialized()).toBe(true);
    });

    it('should not reinitialize on subsequent renders', () => {
      renderMarkdown('# First');
      expect(isSecurityInitialized()).toBe(true);
      renderMarkdown('# Second');
      expect(isSecurityInitialized()).toBe(true);
    });
  });

  describe('GitHub Flavored Markdown', () => {
    it('should convert line breaks', () => {
      const html = renderMarkdown('Line 1\nLine 2');
      expect(html).toContain('<br');
    });

    it('should render strikethrough', () => {
      const html = renderMarkdown('~~deleted~~');
      expect(html).toContain('<del>deleted</del>');
    });

    it('should render task list items as list items', () => {
      // Note: marked GFM renders task syntax but not as HTML checkboxes by default
      const html = renderMarkdown('- [ ] Unchecked\n- [x] Checked');
      expect(html).toContain('<ul>');
      expect(html).toContain('<li>');
      expect(html).toContain('Unchecked');
      expect(html).toContain('Checked');
    });
  });

  describe('Edge Cases', () => {
    it('should handle deeply nested markdown', () => {
      const markdown = '> ## Heading in quote\n> - Item in quote\n>   - Nested item';
      const html = renderMarkdown(markdown);
      expect(html).toContain('<blockquote>');
      expect(html).toContain('<h2');
      expect(html).toContain('<ul>');
    });

    it('should handle mixed HTML and markdown', () => {
      const markdown = '# Title\n\n<div>Some HTML</div>\n\n**Bold**';
      const html = renderMarkdown(markdown);
      expect(html).toContain('<h1');
      expect(html).toContain('<div>');
      expect(html).toContain('<strong>');
    });

    it('should handle very long content', () => {
      const longContent = '# Title\n\n' + 'Lorem ipsum. '.repeat(1000);
      const html = renderMarkdown(longContent);
      expect(html).toContain('<h1');
      expect(html.length).toBeGreaterThan(10000);
    });

    it('should handle unicode content', () => {
      const markdown = '# 你好世界\n\nこんにちは 🎉';
      const html = renderMarkdown(markdown);
      expect(html).toContain('你好世界');
      expect(html).toContain('こんにちは');
      expect(html).toContain('🎉');
    });
  });
});
