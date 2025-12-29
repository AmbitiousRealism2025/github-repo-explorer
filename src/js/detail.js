import { getRepository, getRepositoryReadme, getRepositoryLanguages, getRepositoryEvents, getCommitActivity } from './api.js';
import { 
  initTheme, 
  toggleTheme, 
  Storage, 
  formatNumber, 
  formatDate, 
  getLanguageColor,
  getUrlParam,
  updateRateLimitDisplay,
  Icons
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { createCloneCommands } from './components/CloneCommands.js';
import { createRepoNotes } from './components/RepoNotes.js';
import { createCommitHeatmap } from './components/CommitHeatmap.js';

initTheme();
initErrorBoundary();

const loadingState = document.getElementById('loading-state');
const detailContent = document.getElementById('detail-content');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');
const themeToggle = document.getElementById('theme-toggle');

const repoName = document.getElementById('repo-name');
const repoDescription = document.getElementById('repo-description');
const favoriteBtn = document.getElementById('favorite-btn');
const favoriteText = document.getElementById('favorite-text');
const githubLink = document.getElementById('github-link');

const statStars = document.getElementById('stat-stars');
const statForks = document.getElementById('stat-forks');
const statWatchers = document.getElementById('stat-watchers');
const statIssues = document.getElementById('stat-issues');

const readmeContent = document.getElementById('readme-content');
const languageChart = document.getElementById('language-chart');
const languageLegend = document.getElementById('language-legend');
const activityTimeline = document.getElementById('activity-timeline');
const repoInfo = document.getElementById('repo-info');
const cloneCommandsContainer = document.getElementById('clone-commands-container');
const repoNotesContainer = document.getElementById('repo-notes-container');
const commitHeatmapContainer = document.getElementById('commit-heatmap-container');

let currentRepo = null;

const showState = (state) => {
  loadingState.classList.add('hidden');
  detailContent.classList.add('hidden');
  errorState.classList.add('hidden');
  
  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'content':
      detailContent.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
  }
};

const createLanguageChart = (languages) => {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) {
    languageChart.innerHTML = '<p class="text-sm text-muted">No language data available</p>';
    return;
  }
  
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  let offset = 0;
  const segments = Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([lang, bytes]) => {
      const percentage = bytes / total;
      const dashLength = circumference * percentage;
      const segment = { lang, percentage, offset, dashLength, color: getLanguageColor(lang) };
      offset += dashLength;
      return segment;
    });
  
  languageChart.innerHTML = `
    <svg viewBox="0 0 100 100" class="language-chart">
      <g transform="rotate(-90 50 50)">
        ${segments.map(s => `
          <circle
            cx="50" cy="50" r="${radius}"
            fill="none"
            stroke="${s.color}"
            stroke-width="16"
            stroke-dasharray="${s.dashLength} ${circumference - s.dashLength}"
            stroke-dashoffset="-${s.offset}"
          />
        `).join('')}
      </g>
    </svg>
  `;
  
  languageLegend.innerHTML = segments.map(s => `
    <div class="language-legend-item">
      <span class="language-legend-name">
        <span class="language-dot" style="--lang-color: ${s.color}"></span>
        ${s.lang}
      </span>
      <span class="language-legend-percent">${(s.percentage * 100).toFixed(1)}%</span>
    </div>
  `).join('');
};

const getEventIcon = (type) => {
  switch (type) {
    case 'PushEvent': return Icons.push;
    case 'PullRequestEvent': return Icons.pullRequest;
    case 'IssuesEvent': return Icons.issue;
    case 'WatchEvent': return Icons.star;
    default: return Icons.activity;
  }
};

const getEventDescription = (event) => {
  switch (event.type) {
    case 'PushEvent':
      const commits = event.payload.commits?.length || 0;
      return `${event.actor.login} pushed ${commits} commit${commits !== 1 ? 's' : ''}`;
    case 'PullRequestEvent':
      return `${event.actor.login} ${event.payload.action} a pull request`;
    case 'IssuesEvent':
      return `${event.actor.login} ${event.payload.action} an issue`;
    case 'WatchEvent':
      return `${event.actor.login} starred this repository`;
    case 'ForkEvent':
      return `${event.actor.login} forked this repository`;
    case 'CreateEvent':
      return `${event.actor.login} created ${event.payload.ref_type} ${event.payload.ref || ''}`;
    default:
      return `${event.actor.login} performed ${event.type.replace('Event', '')}`;
  }
};

const renderActivity = (events) => {
  if (!events || events.length === 0) {
    activityTimeline.innerHTML = '<p class="text-sm text-muted">No recent activity</p>';
    return;
  }
  
  activityTimeline.innerHTML = events.slice(0, 5).map(event => `
    <div class="activity-item">
      <div class="activity-icon">${getEventIcon(event.type)}</div>
      <div class="activity-content">
        <p class="activity-title">${getEventDescription(event)}</p>
        <p class="activity-meta">${formatDate(event.created_at)}</p>
      </div>
    </div>
  `).join('');
};

const renderRepoInfo = (repo) => {
  repoInfo.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 8px; font-size: var(--text-sm);">
      ${repo.language ? `<div><strong>Language:</strong> ${repo.language}</div>` : ''}
      <div><strong>Created:</strong> ${new Date(repo.created_at).toLocaleDateString()}</div>
      <div><strong>Last push:</strong> ${formatDate(repo.pushed_at)}</div>
      ${repo.license?.name ? `<div><strong>License:</strong> ${repo.license.name}</div>` : ''}
      ${repo.homepage ? `<div><strong>Homepage:</strong> <a href="${repo.homepage}" target="_blank" rel="noopener">${repo.homepage}</a></div>` : ''}
    </div>
  `;
};

const updateFavoriteButton = () => {
  if (!currentRepo) return;
  
  const isFavorite = Storage.isFavorite(currentRepo.id);
  favoriteBtn.innerHTML = `
    ${isFavorite ? Icons.star : Icons.starOutline}
    <span id="favorite-text">${isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}</span>
  `;
  
  if (isFavorite) {
    favoriteBtn.classList.add('btn--primary');
    favoriteBtn.classList.remove('btn--secondary');
  } else {
    favoriteBtn.classList.remove('btn--primary');
    favoriteBtn.classList.add('btn--secondary');
  }
};

const loadRepository = async () => {
  const repoParam = getUrlParam('repo');
  if (!repoParam) {
    errorMessage.textContent = 'No repository specified';
    showState('error');
    return;
  }
  
  const [owner, repo] = repoParam.split('/');
  if (!owner || !repo) {
    errorMessage.textContent = 'Invalid repository format';
    showState('error');
    return;
  }
  
  showState('loading');
  
  try {
    const [repoResult, readmeResult, languagesResult, eventsResult, commitActivityResult] = await Promise.allSettled([
      getRepository(owner, repo),
      getRepositoryReadme(owner, repo),
      getRepositoryLanguages(owner, repo),
      getRepositoryEvents(owner, repo),
      getCommitActivity(owner, repo)
    ]);
    
    if (repoResult.status === 'rejected') {
      throw new Error(repoResult.reason?.message || 'Failed to load repository');
    }
    
    currentRepo = repoResult.value.data;
    document.title = `${currentRepo.full_name} - GitHub Explorer`;
    
    repoName.textContent = currentRepo.full_name;
    repoDescription.textContent = currentRepo.description || 'No description available';
    githubLink.href = currentRepo.html_url;
    
    statStars.textContent = formatNumber(currentRepo.stargazers_count);
    statForks.textContent = formatNumber(currentRepo.forks_count);
    statWatchers.textContent = formatNumber(currentRepo.subscribers_count);
    statIssues.textContent = formatNumber(currentRepo.open_issues_count);
    
    updateFavoriteButton();
    renderRepoInfo(currentRepo);
    
    Storage.trackExploration(currentRepo);
    
    cloneCommandsContainer.appendChild(createCloneCommands(currentRepo.full_name));
    repoNotesContainer.appendChild(createRepoNotes(currentRepo.full_name));
    
    if (commitActivityResult.status === 'fulfilled' && commitActivityResult.value.data) {
      commitHeatmapContainer.appendChild(createCommitHeatmap(commitActivityResult.value.data));
    }
    
    if (readmeResult.status === 'fulfilled' && readmeResult.value.data?.decodedContent) {
      readmeContent.textContent = readmeResult.value.data.decodedContent;
    } else {
      readmeContent.textContent = 'No README available';
    }
    
    if (languagesResult.status === 'fulfilled') {
      createLanguageChart(languagesResult.value.data);
    }
    
    if (eventsResult.status === 'fulfilled') {
      renderActivity(eventsResult.value.data);
    }
    
    if (repoResult.value.rateLimit) {
      updateRateLimitDisplay(repoResult.value.rateLimit);
    }
    
    showState('content');
  } catch (error) {
    errorMessage.textContent = error.message;
    showState('error');
  }
};

favoriteBtn.addEventListener('click', () => {
  if (!currentRepo) return;
  
  const isFavorite = Storage.isFavorite(currentRepo.id);
  
  if (isFavorite) {
    Storage.removeFavorite(currentRepo.id);
  } else {
    Storage.addFavorite(currentRepo);
  }
  
  updateFavoriteButton();
});

themeToggle.addEventListener('click', toggleTheme);

loadRepository();
