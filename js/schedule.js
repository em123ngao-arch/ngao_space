/**
 * NGAOS — SCHEDULE & TASK MODULE (V3)
 * Practical daily routine and study planner
 * Handles Morning / Afternoon / Evening buckets, preset templates, and live progress
 * Zero AI emojis — Clean minimalist typography and vector indicators
 */

const CATEGORY_MAP = {
  study:   { label: 'Chuyên Môn', class: 'cat-study' },
  project: { label: 'Đề Án',     class: 'cat-project' },
  routine: { label: 'Sinh Hoạt',  class: 'cat-routine' },
  health:  { label: 'Sức Khỏe',   class: 'cat-health' }
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
    const activePreset = state.schedule.activePreset || '';

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
    const buckets = {
      morning: [],
      afternoon: [],
      evening: []
    };

    tasks.forEach(t => {
      if (buckets[t.period]) buckets[t.period].push(t);
      else buckets.morning.push(t);
    });

    // Render each bucket
    ['morning', 'afternoon', 'evening'].forEach(period => {
      const container = document.getElementById(`list-${period}`);
      const countBadge = document.getElementById(`count-${period}`);
      const periodTasks = buckets[period];

      if (countBadge) {
        const completedCount = periodTasks.filter(t => t.completed).length;
        countBadge.textContent = `${completedCount}/${periodTasks.length} việc`;
      }

      if (!container) return;
      container.innerHTML = '';

      if (periodTasks.length === 0) {
        container.innerHTML = `
          <div style="padding: 24px 12px; text-align: center; color: var(--text-muted); font-size: 13px;">
            Chưa có công việc nào trong buổi này.
          </div>
        `;
        return;
      }

      periodTasks.forEach(task => {
        const cat = CATEGORY_MAP[task.category] || CATEGORY_MAP.study;
        const card = document.createElement('div');
        card.className = `task-item-card ${task.completed ? 'completed' : ''}`;
        card.id = `card-${task.id}`;

        const creator = StorageManager.USERS.find(u => u.id === task.createdBy);
        const creatorText = creator ? ` • ${creator.name}` : '';

        card.innerHTML = `
          <div class="task-item-left">
            <button class="task-checkbox-btn" aria-label="Hoàn thành công việc" data-id="${task.id}">
              ${task.completed ? (window.AppIcons ? window.AppIcons.check : '✓') : ''}
            </button>
            <div class="task-info-block">
              <span class="task-time-pill">${task.time ? task.time : 'Trong buổi'}${creatorText}</span>
              <p class="task-title">${task.title}</p>
              <span class="task-category-pill ${cat.class}">${cat.label}</span>
            </div>
          </div>
          <button class="task-btn-delete" title="Xóa công việc" data-id="${task.id}">✕</button>
        `;

        // Checkbox event
        card.querySelector('.task-checkbox-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.toggleTask(task.id);
          this.render();
          if (window.playChime) window.playChime(task.completed ? 440 : 660, 0.12);
        });

        // Delete event
        card.querySelector('.task-btn-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.deleteTask(task.id);
          this.render();
          if (window.showToast) window.showToast('Đã xóa công việc.', 'info');
        });

        container.appendChild(card);
      });
    });

    // Update Daily Progress Bar
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progressFraction = document.getElementById('progress-fraction');
    const progressBar = document.getElementById('daily-progress-bar');

    if (progressFraction) {
      progressFraction.textContent = `${completed}/${total} việc (${percent}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
  }
};
