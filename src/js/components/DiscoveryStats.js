/**
 * DiscoveryStats Component
 * Displays personal exploration statistics including repos explored,
 * languages discovered, day streak, and top languages
 * 
 * @example
 * import { createDiscoveryStats } from './components/DiscoveryStats.js';
 * 
 * // Create discovery stats widget (reads from localStorage automatically)
 * const statsWidget = createDiscoveryStats();
 * container.appendChild(statsWidget);
 * 
 * // Widget displays:
 * // - Total repos explored count
 * // - Number of unique languages seen
 * // - Current day streak
 * // - Top 5 most viewed languages
 * 
 * @module components/DiscoveryStats
 */
import { Storage } from '../common.js';

export const createDiscoveryStats = () => {
  const stats = Storage.getDiscoveryStats();
  const topLanguages = Object.entries(stats.languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.createElement('div');
  container.className = 'discovery-stats';
  container.innerHTML = `
    <div class="discovery-stats__header">
      <span class="discovery-stats__title">Your Exploration</span>
    </div>
    <div class="discovery-stats__grid">
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${stats.explored.length}</span>
        <span class="discovery-stats__label">Repos Explored</span>
      </div>
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${Object.keys(stats.languages).length}</span>
        <span class="discovery-stats__label">Languages</span>
      </div>
      <div class="discovery-stats__item">
        <span class="discovery-stats__value">${stats.streak}</span>
        <span class="discovery-stats__label">Day Streak</span>
      </div>
    </div>
    ${topLanguages.length > 0 ? `
      <div class="discovery-stats__languages">
        <span class="discovery-stats__subtitle">Top Languages</span>
        <div class="discovery-stats__tags">
          ${topLanguages.map(([lang, count]) => `
            <span class="discovery-stats__tag">${lang} (${count})</span>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  return container;
};
