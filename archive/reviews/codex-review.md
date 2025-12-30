# Code Review: GitHub Repository Explorer

## Findings (ordered by severity)

### Critical
- XSS risk in repo info rendering: `src/js/detail.js:166-174` interpolates `repo.homepage` (and other repo fields) directly into `innerHTML` without escaping or scheme validation, so a repo can inject HTML or a `javascript:` link that executes when the detail page loads.

### Major
- Language filter double-encoding breaks special languages: `src/js/api.js:116-120` encodes the language before encoding the full query, so `c++`/`c#` become `%252B`/`%2523` and GitHub search won’t match; the UI explicitly offers those values (`index.html:60-72`).
- Commit activity 202 handling is missing: `src/js/api.js:54-79` always calls `response.json()`, which throws on the commit-activity endpoint’s 202/empty response; `src/js/detail.js:254-256` only renders the heatmap on fulfilled results, so users see a blank module instead of the “processing” message.

### Moderate
- README decoding corrupts non-ASCII content: `src/js/api.js:166-173` uses `atob`, which is not UTF-8 safe and will render mojibake for READMEs containing Unicode characters.
- Collection import round‑trip fails for Unicode: share links are encoded with UTF-8 (`btoa(unescape(encodeURIComponent(...)))`) but decoded with plain `atob` (`src/js/collections.js:186-190`), so names/descriptions with non-ASCII characters are corrupted or throw on import.

## Missing tests
- Search query encoding with special characters (e.g., `c++`, `c#`) to prevent double-encoding regressions.
- Commit-activity 202/empty-body handling to ensure the “processing” state renders.
- UTF-8 README decode coverage using non-ASCII fixtures.
- Collection share-link import/export round-trip with Unicode.

## Questions / assumptions
- Should `repo.homepage` links be restricted to `http(s)` only, or should other schemes be allowed?
- When commit stats are still processing, do you want a persistent placeholder (current UI suggests yes) or should the section be hidden?

## Summary
This is a well-structured vanilla JS app with good modularization and tests, but there are a few data-handling edge cases plus a security issue on the detail page that should be addressed.
