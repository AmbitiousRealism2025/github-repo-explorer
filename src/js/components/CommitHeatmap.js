/**
 * CommitHeatmap Component
 * Renders a GitHub-style contribution heatmap showing commit activity over 52 weeks
 * 
 * @example
 * import { createCommitHeatmap } from './components/CommitHeatmap.js';
 * import { getCommitActivity } from '../api.js';
 * 
 * // Fetch commit data and create heatmap
 * const { data: commitData } = await getCommitActivity(owner, repo);
 * const heatmap = createCommitHeatmap(commitData);
 * container.appendChild(heatmap);
 * 
 * // Handles null/processing states gracefully
 * const heatmap = createCommitHeatmap(null); // Shows "data not available" message
 * 
 * @module components/CommitHeatmap
 */
export const createCommitHeatmap = (commitData) => {
  const container = document.createElement('div');
  container.className = 'commit-heatmap';
  
  // Guard against non-array responses (GitHub returns 202 "processing" object when stats aren't ready)
  const weeks = Array.isArray(commitData) ? commitData : [];
  
  if (weeks.length === 0) {
    container.innerHTML = `
      <div class="commit-heatmap__header">
        <span class="commit-heatmap__title">Commit Activity</span>
      </div>
      <div class="commit-heatmap__empty">
        <p>Commit data not available yet. GitHub is processing stats.</p>
      </div>
    `;
    return container;
  }
  
  const maxCommits = Math.max(...weeks.flatMap(w => w.days || []), 1);
  
  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= maxCommits * 0.25) return 1;
    if (count <= maxCommits * 0.5) return 2;
    if (count <= maxCommits * 0.75) return 3;
    return 4;
  };

  let cellsHtml = '';
  weeks.forEach((week) => {
    const days = week.days || [0, 0, 0, 0, 0, 0, 0];
    days.forEach((count, dayIndex) => {
      const date = new Date(week.week * 1000);
      date.setDate(date.getDate() + dayIndex);
      const level = getLevel(count);
      cellsHtml += `<div class="commit-heatmap__cell commit-heatmap__cell--${level}" 
        title="${date.toDateString()}: ${count} commits"></div>`;
    });
  });

  container.innerHTML = `
    <div class="commit-heatmap__header">
      <span class="commit-heatmap__title">Commit Activity</span>
    </div>
    <div class="commit-heatmap__grid">
      <div class="commit-heatmap__cells">
        ${cellsHtml}
      </div>
    </div>
    <div class="commit-heatmap__legend">
      <span>Less</span>
      <div class="commit-heatmap__cell commit-heatmap__cell--0"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--1"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--2"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--3"></div>
      <div class="commit-heatmap__cell commit-heatmap__cell--4"></div>
      <span>More</span>
    </div>
  `;

  return container;
};
