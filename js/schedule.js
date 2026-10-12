/**
 * NGAOS — SCHEDULE & TASK MODULE
 * Real, practical daily routine and study planner
 * Handles Morning / Afternoon / Evening buckets, preset templates, and live progress
 */

const CATEGORY_MAP = {
  study: { label: '📚 Chuyên Môn', class: 'cat-study' },
  project: { label: '💻 Đề Án', class: 'cat-project' },
  routine: { label: '🌿 Sinh Hoạt', class: 'cat-routine' },
  health: { label: '💊 Sức Khỏe', class: 'cat-health' }
};

window.ScheduleModule = {
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 1. Preset Selector Chips
    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const presetKey = chip.getAttribute('data-preset');
        if (!presetKey) return;

        const state = StorageManager.getState();
        if (state.schedule.activePreset === presetKey) return;

        // Confirm if there are custom uncompleted tasks
        StorageManager.loadPreset(presetKey);
        this.render();
        if (window.showToast) {
          const names = {
            campus: 'Ngày Học Trên Trường',
            'self-study': 'Ngày Tự Học & Đề Án',
            weekend: 'Cuối Tuần Hồi Phục'
          };
          window.showToast(`Đã áp dụng mẫu: ${names[presetKey] || presetKey}`, 'success');
        }
        if (window.playChime) window.playChime(580, 0.2);
      });
    });

    // 2. Add New Task Form
    const btnAdd = document.getElementById('btn-add-task');
    const inputTitle = document.getElementById('new-task-title');
    const inputTime = document.getElementById('new-task-time');
    const selectPeriod = document.getElementById('new-task-period');
    const selectCat = document.getElementById('new-task-cat');

    const handleAddTask = () => {
      const title = (inputTitle?.value || '').trim();
      if (!title) {
        if (window.showToast) window.showToast('Vui lòng nhập nội dung công việc!', 'warning');
        if (inputTitle) inputTitle.focus();
        return;
      }

      const period = selectPeriod?.value || 'morning';
      const time = inputTime?.value || '';
      const category = selectCat?.value || 'study';

      StorageManager.addTask({ period, time, title, category });

      // Reset form
      if (inputTitle) inputTitle.value = '';
      if (inputTime) inputTime.value = '';

      this.render();

      if (window.showToast) window.showToast('Đã thêm công việc vào lịch!', 'success');
      if (window.playChime) window.playChime(740, 0.15);
    };

    if (btnAdd) btnAdd.addEventListener('click', handleAddTask);
    if (inputTitle) {
      inputTitle.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTask();
      });
    }
  },

  render() {
    const state = StorageManager.getState();
    const tasks = state.schedule.tasks || [];
    const activePreset = state.schedule.activePreset || 'campus';

    // Update Preset Chip active status
    document.querySelectorAll('.preset-chip').forEach(chip => {
      const p = chip.getAttribute('data-preset');
      if (p === activePreset) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Bucket tasks by periods
    const periods = {
      morning: tasks.filter(t => t.period === 'morning'),
      afternoon: tasks.filter(t => t.period === 'afternoon'),
      evening: tasks.filter(t => t.period === 'evening')
    };

    // Render each bucket
    this.renderPeriodBucket('morning', periods.morning);
    this.renderPeriodBucket('afternoon', periods.afternoon);
    this.renderPeriodBucket('evening', periods.evening);

    // Compute progress
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progressText = document.getElementById('schedule-progress-text');
    const progressBar = document.getElementById('schedule-progress-bar');

    if (progressText) {
      progressText.textContent = `${completed}/${total} việc (${percent}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
      if (percent === 100 && total > 0) {
        progressBar.style.background = 'linear-gradient(90deg, #059669, #10b981)';
      } else {
        progressBar.style.background = '';
      }
    }
  },

  renderPeriodBucket(periodName, taskList) {
    const listElem = document.getElementById(`list-${periodName}`);
    const countElem = document.getElementById(`count-${periodName}`);

    if (countElem) {
      const completedCount = taskList.filter(t => t.completed).length;
      countElem.textContent = `${completedCount}/${taskList.length} việc`;
    }

    if (!listElem) return;
    listElem.innerHTML = '';

    if (taskList.length === 0) {
      const emptyNotice = document.createElement('div');
      emptyNotice.className = 'empty-period-note';
      emptyNotice.style.cssText = 'padding: 16px; text-align: center; color: var(--text-muted); font-size: 12.5px; font-style: italic;';
      emptyNotice.textContent = 'Chưa có công việc nào trong buổi này ✨';
      listElem.appendChild(emptyNotice);
      return;
    }

    taskList.forEach(task => {
      const catInfo = CATEGORY_MAP[task.category] || CATEGORY_MAP.study;
      const card = document.createElement('div');
      card.className = `task-item-card ${task.completed ? 'completed' : ''}`;
      card.setAttribute('data-id', task.id);

      card.innerHTML = `
        <div class="task-item-left">
          <button class="task-checkbox-btn" title="${task.completed ? 'Đánh dấu chưa xong' : 'Đánh dấu hoàn thành'}">
            ${task.completed ? '✓' : ''}
          </button>
          <div class="task-info-block">
            ${task.time ? `<span class="task-time-pill">⏰ ${task.time}</span>` : ''}
            <span class="task-title">${escapeHTML(task.title)}</span>
            <span class="task-category-pill ${catInfo.class}">${catInfo.label}</span>
          </div>
        </div>
        <button class="task-btn-delete" title="Xóa công việc này" aria-label="Xóa">✕</button>
      `;

      // Checkbox event
      const checkBtn = card.querySelector('.task-checkbox-btn');
      checkBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        StorageManager.toggleTask(task.id);
        this.render();
        if (window.playChime) window.playChime(task.completed ? 480 : 680, 0.15);
      });

      // Delete event
      const delBtn = card.querySelector('.task-btn-delete');
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        StorageManager.deleteTask(task.id);
        this.render();
        if (window.showToast) window.showToast('Đã xóa công việc khỏi lịch', 'info');
      });

      listElem.appendChild(card);
    });
  }
};

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
