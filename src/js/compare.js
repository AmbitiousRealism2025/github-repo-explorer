import { getRepository } from './api.js';
import { initTheme, toggleTheme, formatNumber, formatDate, showToast, getUrlParam, setUrlParams } from './common.js';
import { initErrorBoundary } from './errorBoundary.js';

initTheme();
initErrorBoundary();

const repo1Input = document.getElementById('repo-1');
const repo2Input = document.getElementById('repo-2');
const repo3Input = document.getElementById('repo-3');
const repo4Input = document.getElementById('repo-4');
const compareBtn = document.getElementById('compare-btn');
const loadingState = document.getElementById('loading-state');
const compareResults = document.getElementById('compare-results');
const emptyState = document.getElementById('empty-state');
const compareHeader = document.getElementById('compare-header');
const compareBody = document.getElementById('compare-body');
const themeToggle = document.getElementById('theme-toggle');

const metrics = [
  { key: 'stargazers_count', label: 'Stars', format: formatNumber },
  { key: 'forks_count', label: 'Forks', format: formatNumber },
  { key: 'open_issues_count', label: 'Open Issues', format: formatNumber },
  { key: 'subscribers_count', label: 'Watchers', format: formatNumber },
  { key: 'language', label: 'Primary Language', format: v => v || 'N/A' },
  { key: 'license', label: 'License', format: v => v?.spdx_id || 'None' },
  { key: 'created_at', label: 'Created', format: v => new Date(v).toLocaleDateString() },
  { key: 'pushed_at', label: 'Last Push', format: formatDate },
  { key: 'size', label: 'Size', format: v => `${(v / 1024).toFixed(1)} MB` },
  { key: 'default_branch', label: 'Default Branch', format: v => v },
  { key: 'has_wiki', label: 'Wiki', format: v => v ? 'Yes' : 'No' },
  { key: 'has_pages', label: 'GitHub Pages', format: v => v ? 'Yes' : 'No' },
  { key: 'archived', label: 'Archived', format: v => v ? 'Yes' : 'No' },
];

const showState = (state) => {
  loadingState.classList.add('hidden');
  compareResults.classList.add('hidden');
  emptyState.classList.add('hidden');
  
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'results':
      compareResults.classList.remove('hidden');
      break;
    case 'empty':
      emptyState.classList.remove('hidden');
      break;
  }
};

const findBestValue = (repos, key) => {
  const numericKeys = ['stargazers_count', 'forks_count', 'subscribers_count'];
  if (!numericKeys.includes(key)) return null;
  
  let bestIdx = 0;
  let bestValue = repos[0][key] || 0;
  
  repos.forEach((repo, idx) => {
    const val = repo[key] || 0;
    if (val > bestValue) {
      bestValue = val;
      bestIdx = idx;
    }
  });
  
  return bestIdx;
};

const renderComparison = (repos) => {
  compareHeader.innerHTML = `
    <th class="compare-table__metric">Metric</th>
    ${repos.map(repo => `
      <th class="compare-table__repo">
        <a href="/detail.html?repo=${encodeURIComponent(repo.full_name)}" class="compare-table__repo-link">
          ${repo.full_name}
        </a>
      </th>
    `).join('')}
  `;
  
  compareBody.innerHTML = metrics.map(metric => {
    const bestIdx = findBestValue(repos, metric.key);
    return `
      <tr>
        <td class="compare-table__metric-name">${metric.label}</td>
        ${repos.map((repo, idx) => `
          <td class="compare-table__value ${bestIdx === idx ? 'compare-table__value--best' : ''}">
            ${metric.format(repo[metric.key])}
          </td>
        `).join('')}
      </tr>
    `;
  }).join('');
  
  showState('results');
};

const runComparison = async () => {
  const inputs = [repo1Input, repo2Input, repo3Input, repo4Input];
  const repoNames = inputs
    .map(input => input.value.trim())
    .filter(name => name.length > 0 && name.includes('/'));
  
  if (repoNames.length < 2) {
    showToast('Please enter at least 2 valid repository names (owner/repo)', 'error');
    return;
  }
  
  setUrlParams({ repos: repoNames.join(',') });
  showState('loading');
  
  try {
    const results = await Promise.allSettled(
      repoNames.map(name => {
        const [owner, repo] = name.split('/');
        return getRepository(owner, repo);
      })
    );
    
    const repos = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value.data);
    
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (repos.length < 2) {
      showToast('Could not fetch enough repositories for comparison', 'error');
      showState('empty');
      return;
    }
    
    if (failed > 0) {
      showToast(`${failed} repository(ies) could not be loaded`, 'warning');
    }
    
    renderComparison(repos);
  } catch (error) {
    showToast(error.message, 'error');
    showState('empty');
  }
};

const loadFromUrl = () => {
  const reposParam = getUrlParam('repos');
  if (reposParam) {
    const repos = reposParam.split(',');
    const inputs = [repo1Input, repo2Input, repo3Input, repo4Input];
    repos.forEach((repo, idx) => {
      if (inputs[idx]) {
        inputs[idx].value = repo;
      }
    });
    runComparison();
  }
};

compareBtn.addEventListener('click', runComparison);
themeToggle.addEventListener('click', toggleTheme);

[repo1Input, repo2Input, repo3Input, repo4Input].forEach(input => {
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') runComparison();
  });
});

loadFromUrl();
