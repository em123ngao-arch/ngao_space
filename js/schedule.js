/**
 * NGAOS — SCHEDULE & CALENDAR MODULE (V3.5)
 * Practical daily routine, study planner & history tracker
 * 1. Quản lý theo Tháng / Tuần / Ngày được chọn
 * 2. Khung giờ 3 buổi chuẩn mực: Sáng (06-12), Chiều (12-18), Tối (18-24)
 * 3. Thêm việc trực tiếp trong từng buổi: Giờ xổ ra dạng select, mẫu việc nhanh 1-chạm
 * 4. Mỗi ngày là một danh sách việc hoàn toàn độc lập, theo dõi ngày trước hoàn thành thế nào
 */

const CATEGORY_MAP = {
  study:   { label: 'Chuyên Môn', class: 'cat-study' },
  project: { label: 'Đề Án',     class: 'cat-project' },
  routine: { label: 'Sinh Hoạt',  class: 'cat-routine' },
  health:  { label: 'Sức Khỏe',   class: 'cat-health' }
};

window.ScheduleModule = {
  selectedDate: '', // 'YYYY-MM-DD'
  viewYear: 2026,
  viewMonth: 10,   // 1 - 12

  init() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth() + 1;
    this.selectedDate = StorageManager.getTodayDateStr();

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 1. Month Navigation
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnTodayPill = document.getElementById('btn-today-pill');

    btnPrevMonth?.addEventListener('click', () => {
      this.viewMonth--;
      if (this.viewMonth < 1) {
        this.viewMonth = 12;
        this.viewYear--;
      }
      this.render();
      if (window.playChime) window.playChime(500, 0.1);
    });

    btnNextMonth?.addEventListener('click', () => {
      this.viewMonth++;
      if (this.viewMonth > 12) {
        this.viewMonth = 1;
        this.viewYear++;
      }
      this.render();
      if (window.playChime) window.playChime(560, 0.1);
    });

    btnTodayPill?.addEventListener('click', () => {
      const today = new Date();
      this.viewYear = today.getFullYear();
      this.viewMonth = today.getMonth() + 1;
      this.selectedDate = StorageManager.getTodayDateStr();
      this.render();
      if (window.showToast) window.showToast('Đã quay về lịch hôm nay!', 'info');
      if (window.playChime) window.playChime(640, 0.12);
    });

    // 2. Preset Selector Chips (Áp dụng cho ngày đang xem)
    const presetChips = document.querySelectorAll('.preset-chip');
    presetChips.forEach(chip => {
      chip.addEventListener('click', () => {
        const presetKey = chip.getAttribute('data-preset');
        if (!presetKey) return;

        StorageManager.loadPreset(presetKey, this.selectedDate);
        this.render();

        const names = {
          campus: 'Ngày Học Trên Trường',
          'self-study': 'Ngày Tự Học & Đề Án',
          weekend: 'Cuối Tuần Hồi Phục'
        };
        if (window.showToast) {
          window.showToast(`Đã áp dụng mẫu cho ngày ${this.formatDisplayDate(this.selectedDate)}: ${names[presetKey] || presetKey}`, 'success');
        }
        if (window.playChime) window.playChime(620, 0.18);
      });
    });

    // 3. In-card Add Task Forms (+ Thêm việc trực tiếp trong từng buổi)
    const addButtons = document.querySelectorAll('.btn-incard-add');
    addButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        this.handleIncardAdd(period);
      });
    });

    // Enter key on in-card input
    ['morning', 'afternoon', 'evening'].forEach(period => {
      const input = document.getElementById(`incard-title-${period}`);
      input?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.handleIncardAdd(period);
        }
      });
    });

    // 4. In-card Quick Preset Buttons (Mẫu nhanh 1-chạm)
    const quickPresets = document.querySelectorAll('.btn-incard-preset');
    quickPresets.forEach(btn => {
      btn.addEventListener('click', () => {
        const period = btn.getAttribute('data-period');
        const time = btn.getAttribute('data-time') || '';
        const title = btn.getAttribute('data-title') || '';
        const category = btn.getAttribute('data-cat') || 'routine';

        StorageManager.addTask({
          period,
          time,
          title,
          category,
          date: this.selectedDate
        });

        this.render();
        if (window.showToast) window.showToast(`Đã thêm nhanh: ${title}`, 'success');
        if (window.playChime) window.playChime(720, 0.15);
      });
    });
  },

  handleIncardAdd(period) {
    const inputTitle = document.getElementById(`incard-title-${period}`);
    const selectTime = document.getElementById(`incard-time-${period}`);
    const selectCat = document.getElementById(`incard-cat-${period}`);

    const title = (inputTitle?.value || '').trim();
    if (!title) {
      if (window.showToast) window.showToast('Vui lòng nhập nội dung công việc!', 'warning');
      inputTitle?.focus();
      return;
    }

    const time = selectTime?.value || '';
    const category = selectCat?.value || 'study';

    StorageManager.addTask({
      period,
      time,
      title,
      category,
      date: this.selectedDate
    });

    if (inputTitle) inputTitle.value = '';
    this.render();

    if (window.showToast) window.showToast('Đã thêm việc vào buổi này!', 'success');
    if (window.playChime) window.playChime(760, 0.16);
  },

  render() {
    this.renderCalendarNav();
    this.renderTasks();
  },

  // --------------------------------------------------------------------------
  // Calendar Navigation: Month Title, Week Strip (7 Ngày) & Status
  // --------------------------------------------------------------------------
  renderCalendarNav() {
    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) {
      monthLabel.textContent = `Tháng ${this.viewMonth} / ${this.viewYear}`;
    }

    const selectedDayTitle = document.getElementById('selected-day-title');
    const selectedDayStatusPill = document.getElementById('selected-day-status-pill');
    const todayStr = StorageManager.getTodayDateStr();

    if (selectedDayTitle) {
      const isToday = this.selectedDate === todayStr;
      const formatted = this.formatFullDayTitle(this.selectedDate);
      selectedDayTitle.textContent = isToday ? `Hôm nay, ${formatted}` : formatted;
    }

    // Lấy danh sách việc của ngày đang chọn
    const dayTasks = StorageManager.getDayTasks(this.selectedDate);
    const dayTotal = dayTasks.length;
    const dayCompleted = dayTasks.filter(t => t.completed).length;
    const dayPercent = dayTotal > 0 ? Math.round((dayCompleted / dayTotal) * 100) : 0;

    if (selectedDayStatusPill) {
      if (dayTotal === 0) {
        selectedDayStatusPill.textContent = 'Chưa lên lịch';
        selectedDayStatusPill.className = 'day-banner-status';
      } else {
        selectedDayStatusPill.textContent = `${dayCompleted}/${dayTotal} việc (${dayPercent}%)`;
        if (dayPercent === 100) {
          selectedDayStatusPill.className = 'day-banner-status status-good';
        } else if (dayPercent > 0) {
          selectedDayStatusPill.className = 'day-banner-status status-mid';
        } else {
          selectedDayStatusPill.className = 'day-banner-status';
        }
      }
    }

    // Render Băng Chuyền 7 Ngày (Tuần của ngày đang chọn)
    this.renderWeekStrip();
  },

  renderWeekStrip() {
    const stripContainer = document.getElementById('week-strip-container');
    if (!stripContainer) return;

    // Tính toán 7 ngày trong tuần chứa selectedDate (từ Thứ Hai đến Chủ Nhật)
    const selDateObj = new Date(this.selectedDate);
    const dayOfWeek = selDateObj.getDay(); // 0: CN, 1: T2, ..., 6: T7
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

    const monday = new Date(selDateObj);
    monday.setDate(selDateObj.getDate() + diffToMonday);

    const weekDays = [];
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dateNum}`;

      weekDays.push({
        dateStr,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: dateStr === StorageManager.getTodayDateStr(),
        isSelected: dateStr === this.selectedDate
      });
    }

    stripContainer.innerHTML = weekDays.map(item => {
      const tasks = StorageManager.getDayTasks(item.dateStr);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;

      let dotClass = 'dot-empty';
      let titleTooltip = `${item.dayName} (${item.dayNumber}): Chưa có việc`;

      if (total > 0) {
        if (completed === total) {
          dotClass = 'dot-complete';
          titleTooltip = `${item.dayName} (${item.dayNumber}): Hoàn thành 100% (${completed}/${total})`;
        } else if (completed > 0) {
          dotClass = 'dot-partial';
          titleTooltip = `${item.dayName} (${item.dayNumber}): Đã xong ${completed}/${total} việc`;
        } else {
          titleTooltip = `${item.dayName} (${item.dayNumber}): 0/${total} việc`;
        }
      }

      return `
        <div class="week-day-cell ${item.isSelected ? 'active' : ''} ${item.isToday ? 'is-today' : ''}" 
             data-date="${item.dateStr}" 
             title="${titleTooltip}">
          <span class="day-cell-name">${item.dayName}</span>
          <span class="day-cell-number">${item.dayNumber}</span>
          <span class="day-cell-dot ${dotClass}"></span>
        </div>
      `;
    }).join('');

    // Bắt sự kiện bấm vào từng ngày trên tuần
    stripContainer.querySelectorAll('.week-day-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.getAttribute('data-date');
        if (date && date !== this.selectedDate) {
          this.selectedDate = date;
          this.render();
          if (window.playChime) window.playChime(600, 0.1);
        }
      });
    });
  },

  // --------------------------------------------------------------------------
  // Render Tasks By 3 Periods
  // --------------------------------------------------------------------------
  renderTasks() {
    const tasks = StorageManager.getDayTasks(this.selectedDate);
    const dayData = StorageManager.ensureDaySchedule(StorageManager.getState(), this.selectedDate);
    const activePreset = dayData.activePreset || '';

    // Update Preset Chip active status for this day
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
          <div style="padding: 18px 12px; text-align: center; color: var(--text-muted); font-size: 12.5px;">
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
              <p class="task-title">${this.escapeHTML(task.title)}</p>
              <span class="task-category-pill ${cat.class}">${cat.label}</span>
            </div>
          </div>
          <button class="task-btn-delete" title="Xóa công việc" data-id="${task.id}">✕</button>
        `;

        // Checkbox event
        card.querySelector('.task-checkbox-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.toggleTask(task.id, this.selectedDate);
          this.render();
          if (window.playChime) window.playChime(task.completed ? 440 : 660, 0.12);
        });

        // Delete event
        card.querySelector('.task-btn-delete').addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.deleteTask(task.id, this.selectedDate);
          this.render();
          if (window.showToast) window.showToast('Đã xóa công việc.', 'info');
        });

        container.appendChild(card);
      });
    });

    // Update Daily Progress Bar for selected date
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const progressFraction = document.getElementById('progress-fraction');
    const progressBar = document.getElementById('daily-progress-bar');
    const progressDateLabel = document.getElementById('progress-date-label');

    if (progressDateLabel) {
      progressDateLabel.textContent = this.selectedDate === StorageManager.getTodayDateStr() ? 'Tiến độ hôm nay' : `Tiến độ ngày ${this.formatDisplayDate(this.selectedDate)}`;
    }
    if (progressFraction) {
      progressFraction.textContent = `${completed}/${total} việc (${percent}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }

    // Cập nhật thanh theo dõi tiến độ học tập trong khung Chat
    if (window.ChatModule) {
      window.ChatModule.renderMonitor();
    }
  },

  formatDisplayDate(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return dateStr;
  },

  formatFullDayTitle(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    const parts = dateStr.split('-');
    const dayOfWeek = dayNames[d.getDay()];
    return `${dayOfWeek} (${parts[2]}/${parts[1]})`;
  },

  escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};
