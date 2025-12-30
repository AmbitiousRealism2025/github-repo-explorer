import { describe, it, expect } from 'vitest';

describe('Collection Share Link Encoding', () => {
  it('should encode and decode Unicode collection names correctly', () => {
    const original = { name: '日本語コレクション 🎉', repos: ['owner/repo'] };
    
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(original))));
    
    const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    
    expect(decoded).toEqual(original);
  });

  it('should handle ASCII-only names', () => {
    const original = { name: 'My Collection', repos: ['facebook/react'] };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(original))));
    const decoded = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    expect(decoded).toEqual(original);
  });
});
