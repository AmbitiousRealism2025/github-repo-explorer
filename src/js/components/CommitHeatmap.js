export const createCommitHeatmap = (commitData) => {
  const container = document.createElement('div');
  container.className = 'commit-heatmap';
  
  const weeks = commitData || [];
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
