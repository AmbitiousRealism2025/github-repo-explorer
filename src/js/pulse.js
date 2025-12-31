import { getRepository, fetchPulseData } from './api.js';
import {
  initTheme,
  toggleTheme,
  getUrlParam,
  updateRateLimitDisplay,
  formatNumber,
  escapeHtml,
  initMobileNav,
  getRequiredElement
} from './common.js';
import { initErrorBoundary } from './errorBoundary.js';
import { createPulseDashboard } from './components/PulseDashboard/index.js';
import { calculateAllMetrics } from './components/PulseDashboard/PulseCalculator.js';

initTheme();
initMobileNav();
initErrorBoundary();

const loadingState = getRequiredElement('loading-state');
const pulseContent = getRequiredElement('pulse-content');
const errorState = getRequiredElement('error-state');
const errorMessage = getRequiredElement('error-message');
const themeToggle = getRequiredElement('theme-toggle');

const repoName = getRequiredElement('repo-name');
const repoDescription = getRequiredElement('repo-description');
const githubLink = getRequiredElement('github-link');
const viewDetailsBtn = getRequiredElement('view-details-btn');
const pulseContainer = getRequiredElement('pulse-container');

let currentRepo = null;

const showState = (state) => {
  loadingState.classList.add('hidden');
  pulseContent.classList.add('hidden');
  errorState.classList.add('hidden');

  switch (state) {
    case 'loading':
      loadingState.classList.remove('hidden');
      break;
    case 'content':
      pulseContent.classList.remove('hidden');
      break;
    case 'error':
      errorState.classList.remove('hidden');
      break;
  }
};

const loadPulseDashboard = async () => {
  const repoParam = getUrlParam('repo');
  if (!repoParam) {
    errorMessage.textContent = 'No repository specified. Please provide a repository in the format: owner/repo';
    showState('error');
    return;
  }

  const [owner, repo] = repoParam.split('/');
  if (!owner || !repo) {
    errorMessage.textContent = 'Invalid repository format. Expected format: owner/repo';
    showState('error');
    return;
  }

  showState('loading');

  try {
    // Fetch repository data and pulse metrics in parallel
    const [repoResult, pulseDataResult] = await Promise.allSettled([
      getRepository(owner, repo),
      fetchPulseData(owner, repo)
    ]);

    // Check if repository fetch failed with specific error messages
    if (repoResult.status === 'rejected') {
      const errorMsg = repoResult.reason?.message || 'Failed to load repository';

      // Provide user-friendly error messages for common cases
      if (errorMsg.includes('not found') || errorMsg.includes('404')) {
        errorMessage.textContent = `Repository "${repoParam}" not found. Please check the owner and repository name.`;
      } else if (errorMsg.includes('Rate limit')) {
        errorMessage.textContent = `${errorMsg}. Try again later or add a GitHub token in Settings.`;
      } else if (errorMsg.includes('Forbidden')) {
        errorMessage.textContent = 'Access forbidden. This repository may be private or require authentication.';
      } else {
        errorMessage.textContent = errorMsg;
      }

      showState('error');
      return;
    }

    currentRepo = repoResult.value.data;

    // Update page metadata
    document.title = `${currentRepo.full_name} - Pulse - GitHub Explorer`;

    // Update header information
    repoName.textContent = currentRepo.full_name;
    repoDescription.textContent = currentRepo.description || 'No description available';
    githubLink.href = currentRepo.html_url;
    viewDetailsBtn.href = `/detail.html?repo=${encodeURIComponent(currentRepo.full_name)}`;

    // Check if repository is archived
    if (currentRepo.archived) {
      const warningBanner = document.createElement('div');
      warningBanner.className = 'pulse-banner pulse-banner--warning';
      warningBanner.innerHTML = `
        <svg class="pulse-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <div class="pulse-banner__content">
          <strong>Archived Repository:</strong> This repository is archived and read-only. Pulse metrics reflect its final state.
        </div>
      `;
      pulseContent.insertBefore(warningBanner, pulseContent.firstChild);
    }

    // Check if repository is new (< 90 days old)
    const repoAgeDays = Math.floor((Date.now() - new Date(currentRepo.created_at).getTime()) / (1000 * 60 * 60 * 24));
    const isNewRepo = repoAgeDays < 90;

    if (isNewRepo) {
      const infoBanner = document.createElement('div');
      infoBanner.className = 'pulse-banner pulse-banner--info';
      infoBanner.innerHTML = `
        <svg class="pulse-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div class="pulse-banner__content">
          <strong>New Repository:</strong> This repository is ${repoAgeDays} days old. Some metrics may show "Insufficient data" due to limited history.
        </div>
      `;
      pulseContent.insertBefore(infoBanner, pulseContent.firstChild);
    }

    // Get pulse data (may have partial failures)
    const pulseData = pulseDataResult.status === 'fulfilled'
      ? pulseDataResult.value
      : {
          participation: null,
          contributors: null,
          issues: null,
          pullRequests: null,
          releases: null,
          commits: null
        };

    // Check for 202 responses (data being computed) in pulse data
    const isDataProcessing =
      pulseData.participation?.processing ||
      pulseData.contributors?.processing ||
      pulseData.commits?.processing;

    if (isDataProcessing) {
      const processingBanner = document.createElement('div');
      processingBanner.className = 'pulse-banner pulse-banner--info';
      processingBanner.innerHTML = `
        <svg class="pulse-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div class="pulse-banner__content">
          <strong>Computing...</strong> GitHub is still processing some statistics for this repository. Some metrics may be incomplete. Try refreshing in a few moments.
        </div>
      `;
      pulseContent.insertBefore(processingBanner, pulseContent.firstChild);
    }

    // Prepare data for metric calculations
    const metricsInput = {
      repo: currentRepo,
      participation: pulseData.participation,
      issues: pulseData.issues || [],
      prs: pulseData.pullRequests || [],
      contributors: pulseData.contributors || [],
      events: [], // Events are not currently fetched by fetchPulseData
      releases: pulseData.releases || []
    };

    // Calculate all metrics
    const calculatedMetrics = calculateAllMetrics(metricsInput);

    // Prepare dashboard data structure
    const dashboardData = {
      repoName: currentRepo.full_name,
      overallStatus: calculatedMetrics.overall.status,
      commitVelocity: {
        value: calculatedMetrics.metrics.velocity.value,
        trend: calculatedMetrics.metrics.velocity.trend,
        status: calculatedMetrics.metrics.velocity.status,
        sparklineData: calculatedMetrics.metrics.velocity.sparklineData
      },
      issueHealth: {
        temperature: calculatedMetrics.metrics.issues.temperature,
        trend: calculatedMetrics.metrics.issues.trend,
        status: calculatedMetrics.metrics.issues.status
      },
      prHealth: {
        funnel: calculatedMetrics.metrics.prs.funnel,
        status: calculatedMetrics.metrics.prs.status
      },
      busFactor: {
        distribution: calculatedMetrics.metrics.busFactor.sparklineData,
        status: calculatedMetrics.metrics.busFactor.status
      },
      releaseFreshness: {
        score: calculatedMetrics.metrics.freshness.value,
        daysSincePush: calculatedMetrics.metrics.freshness.daysSincePush,
        status: calculatedMetrics.metrics.freshness.status
      },
      communityHealth: {
        value: calculatedMetrics.metrics.momentum.value,
        trend: calculatedMetrics.metrics.momentum.trend,
        status: calculatedMetrics.metrics.momentum.status,
        sparklineData: calculatedMetrics.metrics.momentum.sparklineData
      }
    };

    // Create and render the dashboard
    const dashboard = createPulseDashboard(dashboardData);
    pulseContainer.appendChild(dashboard);

    // Update rate limit display if available
    if (repoResult.value.rateLimit) {
      updateRateLimitDisplay(repoResult.value.rateLimit);
    }

    showState('content');
  } catch (error) {
    console.error('Error loading pulse dashboard:', error);
    errorMessage.textContent = error.message;
    showState('error');
  }
};

themeToggle.addEventListener('click', toggleTheme);

loadPulseDashboard();
