# Specification: Implement Phase 1 - Data Collection & API Layer for Pulse Dashboard

## Overview

Extend the existing GitHub API layer (`src/js/api.js`) to fetch all data required for the Repository Pulse Dashboard's trend calculations. This phase adds 5 new API endpoint functions for fetching participation stats, contributor activity, issue timelines, pull request timelines, and release history. It also includes a batch data fetcher (`fetchPulseData`) that aggregates all pulse-related API calls with proper error resilience and 202 response handling.

## Workflow Type

**Type**: feature

**Rationale**: This is a new feature addition that extends the existing API layer with new capabilities. No existing functionality is being modified or refactored - we're purely adding new exported functions to support the upcoming Pulse Dashboard feature.

## Task Scope

### Services Involved
- **main** (primary) - Vanilla JavaScript frontend with Vite build system

### This Task Will:
- [ ] Add `getParticipationStats(owner, repo)` function to fetch weekly commit activity
- [ ] Add `getContributorStats(owner, repo)` function to fetch contributor commit activity
- [ ] Add `getIssueTimeline(owner, repo, params)` function to fetch issues with timestamps
- [ ] Add `getPullRequestTimeline(owner, repo, params)` function to fetch PRs with merge data
- [ ] Add `getReleaseHistory(owner, repo)` function to fetch release timeline
- [ ] Add `fetchPulseData(owner, repo)` aggregator that fetches all data in parallel
- [ ] Handle 202 "computing" responses from GitHub stats endpoints with retry logic
- [ ] Add extended cache TTL constant for statistics endpoints

### Out of Scope:
- Metric calculation logic (Phase 2)
- UI components and visualizations (Phases 3-5)
- Integration into detail.html page (Phase 6)
- localStorage fallback caching (deferred - may add if needed)
- Cache versioning (deferred - may add if needed)

## Service Context

### Main Service

**Tech Stack:**
- Language: JavaScript (ES Modules)
- Framework: Vanilla JS with Vite
- Testing: Vitest with jsdom
- Key directories: `src/js/`, `src/css/`

**Entry Point:** `src/js/api.js`

**How to Run:**
```bash
npm run dev
```

**Port:** 5173 (Vite dev server)

**Test Command:**
```bash
npm test
```

## Files to Modify

| File | Service | What to Change |
|------|---------|---------------|
| `src/js/api.js` | main | Add 6 new exported functions: `getParticipationStats`, `getContributorStats`, `getIssueTimeline`, `getPullRequestTimeline`, `getReleaseHistory`, `fetchPulseData` |
| `src/js/constants.js` | main | Add `STATS_CACHE_TTL_MS` constant for extended stats caching (10 minutes) |
| `src/js/__tests__/api.test.js` | main | Add tests for all 6 new API functions |

## Files to Reference

These files show patterns to follow:

| File | Pattern to Copy |
|------|----------------|
| `src/js/api.js` | Existing API function structure, JSDoc comments, `fetchWithRetry` usage, 202 handling pattern from `getCommitActivity` |
| `src/js/constants.js` | Constant naming conventions and export pattern |
| `src/js/__tests__/api.test.js` | Test structure, mocking patterns for fetch |

## Patterns to Follow

### Pattern 1: API Function Structure

From `src/js/api.js` - `getRepositoryEvents`:

```javascript
/**
 * Fetches recent events/activity for a repository
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {number} [perPage=10] - Number of events to fetch (max 100)
 * @returns {Promise<{data: Array, rateLimit: {remaining: number, limit: number, reset: number}}>}
 * @throws {Error} When API request fails
 */
export const getRepositoryEvents = async (owner, repo, perPage = 10) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/events?per_page=${perPage}`;
  return fetchWithRetry(url);
};
```

**Key Points:**
- Use JSDoc with `@param`, `@returns`, `@throws` annotations
- Use arrow function with `async`
- Build URL using `API_BASE` constant
- Return result from `fetchWithRetry`
- Export as named constant

### Pattern 2: 202 Response Handling

From `src/js/api.js` - `getCommitActivity`:

```javascript
export const getCommitActivity = async (owner, repo, retryOnce = true) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/commit_activity`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 202) {
      if (retryOnce) {
        await sleep(2000);
        return getCommitActivity(owner, repo, false);
      }
      return { data: null, processing: true, rateLimit: null };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      processing: false,
      rateLimit: { /* ... */ }
    };
  } catch (error) {
    throw error;
  }
};
```

**Key Points:**
- Stats endpoints may return 202 while GitHub computes data
- Use `retryOnce` parameter to limit retry attempts
- Wait 2 seconds before retry
- Return `{ data: null, processing: true }` if still 202 after retry
- Include `processing` flag in response object

### Pattern 3: Query Parameters with URLSearchParams

From implementation plan:

```javascript
export async function getIssueTimeline(owner, repo, params = {}) {
  const query = new URLSearchParams({
    state: 'all',
    per_page: 100,
    sort: 'created',
    direction: 'desc',
    ...params
  });
  return fetchWithRetry(`repos/${owner}/${repo}/issues?${query}`);
}
```

**Key Points:**
- Use `URLSearchParams` for building query strings
- Provide sensible defaults that can be overridden via `params`
- Spread `params` to allow caller customization

## Requirements

### Functional Requirements

1. **getParticipationStats Function**
   - Description: Fetches weekly commit activity for the last year (52 weeks) from `/repos/{owner}/{repo}/stats/participation`
   - Acceptance: Returns `{ data: { all: number[], owner: number[] }, processing: boolean, rateLimit: Object }` or handles 202 response with retry

2. **getContributorStats Function**
   - Description: Fetches contributor commit activity from `/repos/{owner}/{repo}/stats/contributors`
   - Acceptance: Returns array of contributor objects with weekly commit data, handles 202 with retry

3. **getIssueTimeline Function**
   - Description: Fetches issues with created/closed timestamps from `/repos/{owner}/{repo}/issues`
   - Acceptance: Returns up to 100 issues sorted by creation date descending, supports optional params override

4. **getPullRequestTimeline Function**
   - Description: Fetches pull requests with merge timestamps from `/repos/{owner}/{repo}/pulls`
   - Acceptance: Returns up to 100 PRs sorted by creation date descending, includes `merged_at` field

5. **getReleaseHistory Function**
   - Description: Fetches release history from `/repos/{owner}/{repo}/releases`
   - Acceptance: Returns up to 30 most recent releases with `published_at` timestamps

6. **fetchPulseData Aggregator Function**
   - Description: Fetches all pulse-related data in parallel using `Promise.allSettled`
   - Acceptance: Returns object with `participation`, `contributors`, `issues`, `pullRequests`, `releases`, `commits` keys; failed requests return `null` for that key instead of throwing

7. **Extended Cache TTL for Stats**
   - Description: Add `STATS_CACHE_TTL_MS` constant (10 minutes) for stats endpoints that are expensive to compute
   - Acceptance: New constant exported from `constants.js`

### Edge Cases

1. **202 Response After Retry** - Return `{ data: null, processing: true }` to allow UI to show "computing" state
2. **Partial Data in fetchPulseData** - Continue with available data if some endpoints fail; only include successful results
3. **Empty Repository** - Handle repos with no issues, PRs, or releases gracefully (return empty arrays)
4. **Rate Limit During Batch Fetch** - `Promise.allSettled` prevents one failure from blocking others
5. **Private Repos Without Token** - Return 404 error for individual endpoints, null in aggregator

## Implementation Notes

### DO
- Follow the exact JSDoc comment style from existing `api.js` functions
- Use `fetchWithRetry` for endpoints that don't need 202 handling (issues, PRs, releases)
- Use the direct `fetch` pattern from `getCommitActivity` for stats endpoints (participation, contributors)
- Use `Promise.allSettled` in `fetchPulseData` to handle partial failures gracefully
- Include the existing `getCommitActivity` in `fetchPulseData` aggregation
- Add `processing` flag to stats endpoint responses for UI state handling
- Export all new functions as named exports

### DON'T
- Don't modify existing functions or their signatures
- Don't add localStorage caching yet (keep scope minimal)
- Don't add cache versioning yet (defer to future phase)
- Don't throw errors in `fetchPulseData` - catch and return nulls instead
- Don't change the existing cache TTL for non-stats endpoints

## Development Environment

### Start Services

```bash
npm run dev
```

### Service URLs
- Frontend: http://localhost:5173

### Required Environment Variables
- None required (GitHub token optional, stored in localStorage as `gh-token`)

### GitHub API Endpoints Used

| Endpoint | Rate Limit Category | May Return 202 |
|----------|--------------------|--------------:|
| `/repos/{owner}/{repo}/stats/participation` | Core (5000/hr auth) | Yes |
| `/repos/{owner}/{repo}/stats/contributors` | Core (5000/hr auth) | Yes |
| `/repos/{owner}/{repo}/issues` | Core (5000/hr auth) | No |
| `/repos/{owner}/{repo}/pulls` | Core (5000/hr auth) | No |
| `/repos/{owner}/{repo}/releases` | Core (5000/hr auth) | No |

## Success Criteria

The task is complete when:

1. [ ] `getParticipationStats` function is implemented and exported
2. [ ] `getContributorStats` function is implemented and exported
3. [ ] `getIssueTimeline` function is implemented and exported
4. [ ] `getPullRequestTimeline` function is implemented and exported
5. [ ] `getReleaseHistory` function is implemented and exported
6. [ ] `fetchPulseData` aggregator function is implemented and exported
7. [ ] `STATS_CACHE_TTL_MS` constant is added to constants.js
8. [ ] All new functions have proper JSDoc documentation
9. [ ] 202 response handling works correctly for stats endpoints
10. [ ] All unit tests pass
11. [ ] Existing tests still pass (no regressions)
12. [ ] Manual verification: calling `fetchPulseData('facebook', 'react')` returns data for all 6 categories

## QA Acceptance Criteria

**CRITICAL**: These criteria must be verified by the QA Agent before sign-off.

### Unit Tests
| Test | File | What to Verify |
|------|------|----------------|
| getParticipationStats returns data | `src/js/__tests__/api.test.js` | Returns participation object with `all` array |
| getParticipationStats handles 202 | `src/js/__tests__/api.test.js` | Returns `processing: true` after retry exhausted |
| getContributorStats returns data | `src/js/__tests__/api.test.js` | Returns array of contributor objects |
| getContributorStats handles 202 | `src/js/__tests__/api.test.js` | Returns `processing: true` after retry exhausted |
| getIssueTimeline returns issues | `src/js/__tests__/api.test.js` | Returns array with issue objects |
| getIssueTimeline accepts params | `src/js/__tests__/api.test.js` | Params override defaults in URL |
| getPullRequestTimeline returns PRs | `src/js/__tests__/api.test.js` | Returns array with PR objects |
| getReleaseHistory returns releases | `src/js/__tests__/api.test.js` | Returns array with release objects |
| fetchPulseData returns all categories | `src/js/__tests__/api.test.js` | Returns object with 6 keys |
| fetchPulseData handles partial failures | `src/js/__tests__/api.test.js` | Failed endpoints return null, others succeed |
| STATS_CACHE_TTL_MS is exported | `src/js/__tests__/constants.test.js` | Constant equals 10 * 60 * 1000 |

### Integration Tests
| Test | Services | What to Verify |
|------|----------|----------------|
| Real API call test | api.js ↔ GitHub | `fetchPulseData('facebook', 'react')` returns data (can be manual test) |

### End-to-End Tests
| Flow | Steps | Expected Outcome |
|------|-------|------------------|
| Pulse Data Fetch | 1. Import `fetchPulseData` 2. Call with valid repo 3. Check response | All 6 categories have data or are processing |

### Browser Verification (if frontend)
| Page/Component | URL | Checks |
|----------------|-----|--------|
| N/A for Phase 1 | N/A | API-only changes, no UI verification needed |

### Database Verification (if applicable)
N/A - No database in this project

### QA Sign-off Requirements
- [ ] All unit tests pass (`npm test`)
- [ ] All new functions are properly exported from `api.js`
- [ ] JSDoc comments follow existing conventions
- [ ] No regressions in existing 283+ tests
- [ ] Code follows established patterns in `api.js`
- [ ] No security vulnerabilities introduced (no new user input handling)
- [ ] Manual verification with real GitHub repo shows data returned

## Implementation Order

1. **constants.js** - Add `STATS_CACHE_TTL_MS` constant
2. **api.js** - Add `getParticipationStats` (uses 202 pattern)
3. **api.js** - Add `getContributorStats` (uses 202 pattern)
4. **api.js** - Add `getIssueTimeline` (simple fetchWithRetry)
5. **api.js** - Add `getPullRequestTimeline` (simple fetchWithRetry)
6. **api.js** - Add `getReleaseHistory` (simple fetchWithRetry)
7. **api.js** - Add `fetchPulseData` aggregator
8. **api.test.js** - Add tests for all new functions
9. **Verify** - Run `npm test` and manual verification

## Code Templates

### Template: Stats Endpoint with 202 Handling

```javascript
/**
 * Get [description]
 * Endpoint: GET /repos/{owner}/{repo}/stats/[endpoint]
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {boolean} [retryOnce=true] - Whether to retry once if GitHub returns 202
 * @returns {Promise<{data: [Type] | null, processing: boolean, rateLimit: Object | null}>}
 * @throws {Error} When API request fails
 */
export const get[Name] = async (owner, repo, retryOnce = true) => {
  const url = `${API_BASE}/repos/${owner}/${repo}/stats/[endpoint]`;

  try {
    const response = await fetch(url, { headers: getHeaders() });

    if (response.status === 202) {
      if (retryOnce) {
        await sleep(2000);
        return get[Name](owner, repo, false);
      }
      return { data: null, processing: true, rateLimit: null };
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return {
      data: await response.json(),
      processing: false,
      rateLimit: {
        remaining: parseInt(response.headers.get('x-ratelimit-remaining') || '0'),
        limit: parseInt(response.headers.get('x-ratelimit-limit') || '0'),
        reset: parseInt(response.headers.get('x-ratelimit-reset') || '0')
      }
    };
  } catch (error) {
    throw error;
  }
};
```

### Template: Simple List Endpoint

```javascript
/**
 * Get [description]
 * Endpoint: GET /repos/{owner}/{repo}/[endpoint]
 * @param {string} owner - Repository owner's username
 * @param {string} repo - Repository name
 * @param {Object} [params={}] - Optional query parameters
 * @returns {Promise<{data: Array, rateLimit: Object}>}
 * @throws {Error} When API request fails
 */
export const get[Name] = async (owner, repo, params = {}) => {
  const query = new URLSearchParams({
    per_page: 100,
    ...params
  });
  const url = `${API_BASE}/repos/${owner}/${repo}/[endpoint]?${query}`;
  return fetchWithRetry(url);
};
```
