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

    // Check if repository fetch failed
    if (repoResult.status === 'rejected') {
      throw new Error(repoResult.reason?.message || 'Failed to load repository');
    }

    currentRepo = repoResult.value.data;

    // Update page metadata
    document.title = `${currentRepo.full_name} - Pulse - GitHub Explorer`;

    // Update header information
    repoName.textContent = currentRepo.full_name;
    repoDescription.textContent = currentRepo.description || 'No description available';
    githubLink.href = currentRepo.html_url;
    viewDetailsBtn.href = `/detail.html?repo=${encodeURIComponent(currentRepo.full_name)}`;

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
