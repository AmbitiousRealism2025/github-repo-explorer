import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createCloneCommands } from '../components/CloneCommands.js';
import { createRepoNotes } from '../components/RepoNotes.js';
import { createCommitHeatmap } from '../components/CommitHeatmap.js';
import { createDiscoveryStats } from '../components/DiscoveryStats.js';
import { Storage } from '../common.js';

describe('CloneCommands', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue()
      }
    });
  });

  it('should create clone commands container', () => {
    const element = createCloneCommands('owner/repo');
    expect(element.className).toBe('clone-commands');
  });

  it('should show 4 tabs by default', () => {
    const element = createCloneCommands('owner/repo');
    const tabs = element.querySelectorAll('.clone-commands__tab');
    expect(tabs.length).toBe(4);
  });

  it('should show 5 tabs with dev container', () => {
    const element = createCloneCommands('owner/repo', true);
    const tabs = element.querySelectorAll('.clone-commands__tab');
    expect(tabs.length).toBe(5);
  });

  it('should have HTTPS command selected by default', () => {
    const element = createCloneCommands('owner/repo');
    const input = element.querySelector('.clone-commands__input');
    expect(input.value).toContain('git clone https://');
  });

  it('should switch command on tab click', () => {
    const element = createCloneCommands('owner/repo');
    const sshTab = element.querySelectorAll('.clone-commands__tab')[1];
    const input = element.querySelector('.clone-commands__input');
    
    sshTab.click();
    
    expect(input.value).toContain('git@github.com:');
    expect(sshTab.classList.contains('active')).toBe(true);
  });

  it('should copy to clipboard on copy button click', async () => {
    const element = createCloneCommands('owner/repo');
    const copyBtn = element.querySelector('.clone-commands__copy');
    
    copyBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(navigator.clipboard.writeText).toHaveBeenCalled();
  });

  it('should fallback to execCommand when clipboard API fails', async () => {
    navigator.clipboard.writeText = vi.fn().mockRejectedValue(new Error('fail'));
    document.execCommand = vi.fn();
    
    const element = createCloneCommands('owner/repo');
    document.body.appendChild(element);
    const copyBtn = element.querySelector('.clone-commands__copy');
    
    copyBtn.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    
    expect(document.execCommand).toHaveBeenCalledWith('copy');
  });
});

describe('RepoNotes', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create notes container', () => {
    const element = createRepoNotes('owner/repo');
    expect(element.className).toBe('repo-notes');
  });

  it('should show empty textarea for new repo', () => {
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    expect(textarea.value).toBe('');
  });

  it('should show existing note', () => {
    Storage.saveNote('owner/repo', 'My existing note');
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    expect(textarea.value).toBe('My existing note');
  });

  it('should save note on button click', () => {
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    const saveBtn = element.querySelector('.repo-notes__save');
    
    textarea.value = 'New note content';
    saveBtn.click();
    
    const savedNote = Storage.getNote('owner/repo');
    expect(savedNote.content).toBe('New note content');
  });

  it('should clear note when saving empty content', () => {
    Storage.saveNote('owner/repo', 'Existing note');
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    const saveBtn = element.querySelector('.repo-notes__save');
    
    textarea.value = '';
    saveBtn.click();
    
    expect(Storage.getNote('owner/repo')).toBeNull();
  });

  it('should auto-save on blur if content changed', () => {
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    
    textarea.value = 'Auto-saved note';
    textarea.dispatchEvent(new Event('blur'));
    
    const savedNote = Storage.getNote('owner/repo');
    expect(savedNote.content).toBe('Auto-saved note');
  });

  it('should not auto-save on blur if content unchanged', () => {
    Storage.saveNote('owner/repo', 'Original note');
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    const status = element.querySelector('.repo-notes__status');
    
    textarea.dispatchEvent(new Event('blur'));
    
    expect(status.textContent).toBe('');
  });

  it('should update status display', () => {
    const element = createRepoNotes('owner/repo');
    const textarea = element.querySelector('.repo-notes__textarea');
    const saveBtn = element.querySelector('.repo-notes__save');
    const status = element.querySelector('.repo-notes__status');
    
    textarea.value = 'Test note';
    saveBtn.click();
    
    expect(status.textContent).toBe('Saved');
    expect(status.classList.contains('repo-notes__status--success')).toBe(true);
  });
});

describe('CommitHeatmap', () => {
  it('should create heatmap container', () => {
    const element = createCommitHeatmap([]);
    expect(element.className).toBe('commit-heatmap');
  });

  it('should show empty state for no data', () => {
    const element = createCommitHeatmap([]);
    expect(element.innerHTML).toContain('not available yet');
  });

  it('should show empty state for non-array data', () => {
    const element = createCommitHeatmap({ message: 'processing' });
    expect(element.innerHTML).toContain('not available yet');
  });

  it('should show empty state for null data', () => {
    const element = createCommitHeatmap(null);
    expect(element.innerHTML).toContain('not available yet');
  });

  it('should render cells for commit data', () => {
    const commitData = [
      { week: Date.now() / 1000, days: [1, 2, 3, 4, 5, 6, 7], total: 28 }
    ];
    const element = createCommitHeatmap(commitData);
    const cells = element.querySelectorAll('.commit-heatmap__cell');
    expect(cells.length).toBeGreaterThan(0);
  });

  it('should assign correct levels based on commit count', () => {
    const commitData = [
      { week: Date.now() / 1000, days: [0, 1, 5, 10, 15, 20, 25], total: 76 }
    ];
    const element = createCommitHeatmap(commitData);
    
    expect(element.querySelector('.commit-heatmap__cell--0')).not.toBeNull();
    expect(element.querySelector('.commit-heatmap__cell--4')).not.toBeNull();
  });

  it('should show legend', () => {
    const commitData = [
      { week: Date.now() / 1000, days: [1, 2, 3, 4, 5, 6, 7], total: 28 }
    ];
    const element = createCommitHeatmap(commitData);
    expect(element.querySelector('.commit-heatmap__legend')).not.toBeNull();
    expect(element.innerHTML).toContain('Less');
    expect(element.innerHTML).toContain('More');
  });

  it('should handle missing days array', () => {
    const commitData = [
      { week: Date.now() / 1000, total: 10 }
    ];
    const element = createCommitHeatmap(commitData);
    const cells = element.querySelectorAll('.commit-heatmap__cells .commit-heatmap__cell');
    expect(cells.length).toBe(7);
  });

  it('should include date in cell title', () => {
    const commitData = [
      { week: Date.now() / 1000, days: [5, 0, 0, 0, 0, 0, 0], total: 5 }
    ];
    const element = createCommitHeatmap(commitData);
    const firstCell = element.querySelector('.commit-heatmap__cells .commit-heatmap__cell');
    expect(firstCell.title).toContain('commits');
  });
});

describe('DiscoveryStats', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should create discovery stats container', () => {
    const element = createDiscoveryStats();
    expect(element.className).toBe('discovery-stats');
  });

  it('should show zero stats for new user', () => {
    const element = createDiscoveryStats();
    const values = element.querySelectorAll('.discovery-stats__value');
    expect(values[0].textContent).toBe('0');
    expect(values[1].textContent).toBe('0');
    expect(values[2].textContent).toBe('0');
  });

  it('should show explored repos count', () => {
    Storage.trackExploration({ id: 1, language: 'JavaScript' });
    Storage.trackExploration({ id: 2, language: 'Python' });
    
    const element = createDiscoveryStats();
    const reposValue = element.querySelector('.discovery-stats__value');
    expect(reposValue.textContent).toBe('2');
  });

  it('should show languages count', () => {
    Storage.trackExploration({ id: 1, language: 'JavaScript' });
    Storage.trackExploration({ id: 2, language: 'Python' });
    Storage.trackExploration({ id: 3, language: 'JavaScript' });
    
    const element = createDiscoveryStats();
    const values = element.querySelectorAll('.discovery-stats__value');
    expect(values[1].textContent).toBe('2');
  });

  it('should show streak', () => {
    Storage.trackExploration({ id: 1, language: 'JavaScript' });
    
    const element = createDiscoveryStats();
    const values = element.querySelectorAll('.discovery-stats__value');
    expect(values[2].textContent).toBe('1');
  });

  it('should show top languages when available', () => {
    Storage.trackExploration({ id: 1, language: 'JavaScript' });
    Storage.trackExploration({ id: 2, language: 'JavaScript' });
    Storage.trackExploration({ id: 3, language: 'Python' });
    
    const element = createDiscoveryStats();
    expect(element.innerHTML).toContain('Top Languages');
    expect(element.innerHTML).toContain('JavaScript (2)');
    expect(element.innerHTML).toContain('Python (1)');
  });

  it('should not show top languages section when no languages', () => {
    const element = createDiscoveryStats();
    expect(element.innerHTML).not.toContain('Top Languages');
  });

  it('should limit top languages to 5', () => {
    const languages = ['JS', 'Python', 'Go', 'Rust', 'Ruby', 'Java', 'C++'];
    languages.forEach((lang, i) => {
      Storage.trackExploration({ id: i, language: lang });
    });
    
    const element = createDiscoveryStats();
    const tags = element.querySelectorAll('.discovery-stats__tag');
    expect(tags.length).toBe(5);
  });

  it('should sort languages by count', () => {
    Storage.trackExploration({ id: 1, language: 'Python' });
    Storage.trackExploration({ id: 2, language: 'JavaScript' });
    Storage.trackExploration({ id: 3, language: 'JavaScript' });
    Storage.trackExploration({ id: 4, language: 'JavaScript' });
    
    const element = createDiscoveryStats();
    const tags = element.querySelectorAll('.discovery-stats__tag');
    expect(tags[0].textContent).toContain('JavaScript');
  });
});
