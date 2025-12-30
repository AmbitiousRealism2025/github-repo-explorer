/**
 * HealthScore Component
 * Calculates and displays a repository health score (0-100) based on maintenance,
 * community, documentation, activity, and engagement metrics
 * 
 * @example
 * import { calculateHealthScore, createHealthScore } from './components/HealthScore.js';
 * 
 * // Calculate score programmatically
 * const scoreData = calculateHealthScore(repoData, {
 *   hasReadme: true,
 *   commitActivity: commitActivityArray  // Optional: 52-week commit data
 * });
 * console.log(scoreData.total, scoreData.breakdown);
 * 
 * // Create visual health score widget
 * const healthWidget = createHealthScore(repoData, { hasReadme: true, commitActivity });
 * container.appendChild(healthWidget);
 * 
 * @module components/HealthScore
 */
export const calculateHealthScore = (repo, options = {}) => {
  const {
    hasReadme = true,
    commitActivity = null
  } = options;
  
  const weights = {
    maintenance: 30,
    community: 25,
    documentation: 15,
    activity: 20,
    engagement: 10
  };

  let scores = {
    maintenance: 0,
    community: 0,
    documentation: 0,
    activity: 0,
    engagement: 0
  };

  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceUpdate <= 7) scores.maintenance = 100;
  else if (daysSinceUpdate <= 30) scores.maintenance = 80;
  else if (daysSinceUpdate <= 90) scores.maintenance = 60;
  else if (daysSinceUpdate <= 180) scores.maintenance = 40;
  else if (daysSinceUpdate <= 365) scores.maintenance = 20;
  else scores.maintenance = 10;

  const stars = repo.stargazers_count || 0;
  const forks = repo.forks_count || 0;
  
  if (stars >= 10000) scores.community = 100;
  else if (stars >= 1000) scores.community = 80;
  else if (stars >= 100) scores.community = 60;
  else if (stars >= 10) scores.community = 40;
  else scores.community = 20;

  scores.documentation = hasReadme ? 80 : 20;
  if (repo.license) scores.documentation = Math.min(100, scores.documentation + 20);
  if (repo.homepage) scores.documentation = Math.min(100, scores.documentation + 10);
  if (repo.description) scores.documentation = Math.min(100, scores.documentation + 10);

  if (commitActivity && Array.isArray(commitActivity) && commitActivity.length > 0) {
    const recentWeeks = commitActivity.slice(-12);
    const totalCommits = recentWeeks.reduce((sum, week) => sum + (week.total || 0), 0);
    const activeWeeks = recentWeeks.filter(week => (week.total || 0) > 0).length;
    
    if (activeWeeks >= 10) scores.activity = 100;
    else if (activeWeeks >= 6) scores.activity = 80;
    else if (activeWeeks >= 3) scores.activity = 60;
    else if (activeWeeks >= 1) scores.activity = 40;
    else scores.activity = 20;
  } else {
    scores.activity = daysSinceUpdate <= 30 ? 60 : 30;
  }

  if (forks >= 1000) scores.engagement = 100;
  else if (forks >= 100) scores.engagement = 80;
  else if (forks >= 10) scores.engagement = 60;
  else if (forks >= 1) scores.engagement = 40;
  else scores.engagement = 20;

  const totalScore = Math.round(
    (scores.maintenance * weights.maintenance +
     scores.community * weights.community +
     scores.documentation * weights.documentation +
     scores.activity * weights.activity +
     scores.engagement * weights.engagement) / 100
  );

  return {
    total: totalScore,
    breakdown: scores,
    weights
  };
};

const getScoreLabel = (score) => {
  if (score >= 80) return { label: 'Excellent', class: 'excellent' };
  if (score >= 60) return { label: 'Good', class: 'good' };
  if (score >= 40) return { label: 'Fair', class: 'fair' };
  return { label: 'Needs Work', class: 'poor' };
};

export const createHealthScore = (repo, options = {}) => {
  const scoreData = calculateHealthScore(repo, options);
  const { label, class: scoreClass } = getScoreLabel(scoreData.total);
  
  const container = document.createElement('div');
  container.className = 'health-score';
  
  container.innerHTML = `
    <div class="health-score__header">
      <span class="health-score__title">Repository Health</span>
    </div>
    <div class="health-score__main">
      <div class="health-score__gauge">
        <svg viewBox="0 0 120 120" class="health-score__ring">
          <circle 
            cx="60" cy="60" r="50" 
            fill="none" 
            stroke="var(--color-bg-tertiary)" 
            stroke-width="10"
          />
          <circle 
            cx="60" cy="60" r="50" 
            fill="none" 
            stroke="var(--health-score-color)" 
            stroke-width="10"
            stroke-linecap="round"
            stroke-dasharray="${(scoreData.total / 100) * 314.159} 314.159"
            transform="rotate(-90 60 60)"
            class="health-score__progress"
          />
        </svg>
        <div class="health-score__value">
          <span class="health-score__number">${scoreData.total}</span>
          <span class="health-score__label">${label}</span>
        </div>
      </div>
      <div class="health-score__breakdown">
        ${Object.entries(scoreData.breakdown).map(([key, value]) => `
          <div class="health-score__metric">
            <div class="health-score__metric-header">
              <span class="health-score__metric-name">${formatMetricName(key)}</span>
              <span class="health-score__metric-value">${value}%</span>
            </div>
            <div class="health-score__metric-bar">
              <div class="health-score__metric-fill" style="width: ${value}%"></div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  container.style.setProperty('--health-score-color', getScoreColor(scoreData.total));
  container.setAttribute('data-score-class', scoreClass);
  
  return container;
};

const formatMetricName = (key) => {
  const names = {
    maintenance: 'Maintenance',
    community: 'Community',
    documentation: 'Documentation',
    activity: 'Activity',
    engagement: 'Engagement'
  };
  return names[key] || key;
};

const getScoreColor = (score) => {
  if (score >= 80) return 'var(--color-success, #10b981)';
  if (score >= 60) return 'var(--color-accent, #14b8a6)';
  if (score >= 40) return 'var(--color-warning, #f59e0b)';
  return 'var(--color-danger, #ef4444)';
};
