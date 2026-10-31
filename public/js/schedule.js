/**
 * NGAOS — SCHEDULE & CALENDAR MODULE (V4.0)
 * Hệ thống quản lý Lịch & Công việc 3 Trục:
 * 1. Chế độ xem đa tầng: Chi Tiết Ngày (Sáng -> Tối) | Bảng 4 Tuần (Horizon) | Bảng Tháng Toàn Cảnh
 * 2. Hệ thống Nhãn màu liên kết: Admin môn JAVA (cam), Đề Án (xanh), Chuyên Môn (tím)...
 * 3. Chuỗi thời gian liên tục: Quá khứ đã làm gì -> Việc hôm nay -> Sắp tới có gì đợi
 * 4. Cảnh báo nổi bật cho các công việc quan trọng / deadline
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
  modalYear: 2026,
  modalMonth: 10,
  currentViewMode: 'day', // 'day' | 'four-weeks' | 'month'
  filterTag: null,

  init() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth() + 1;
    this.modalYear = this.viewYear;
    this.modalMonth = this.viewMonth;
    this.selectedDate = StorageManager.getTodayDateStr();

    const state = StorageManager.getState();
    if (state.schedule?.viewMode) {
      this.currentViewMode = state.schedule.viewMode;
    }

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 1. Navigation Tháng & Hôm Nay
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnTodayPill = document.getElementById('btn-today-pill');
    const btnOpenMonthModal = document.getElementById('btn-open-month-modal');

    btnPrevMonth?.addEventListener('click', () => {
      this.prevMonth();
    });

    btnNextMonth?.addEventListener('click', () => {
      this.nextMonth();
    });

    btnTodayPill?.addEventListener('click', () => {
      this.goToToday();
    });

    btnOpenMonthModal?.addEventListener('click', () => {
      this.setViewMode('month');
    });

    // 2. Bộ chuyển đổi 3 Chế Độ Xem (Day | Four-Weeks | Month)
    const modeButtons = document.querySelectorAll('.view-mode-btn');
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.getAttribute('data-mode');
        if (mode) this.setViewMode(mode);
      });
    });

    // 3. Form Thêm Việc Trong Ngày (Daily Timeline View)
    const btnDayAdd = document.getElementById('btn-day-add-task');
    const inputDayTitle = document.getElementById('day-input-title');

    btnDayAdd?.addEventListener('click', () => {
      this.handleDailyAddTask();
    });

    inputDayTitle?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleDailyAddTask();
      }
    });

    // 4. Bảng Tháng Inline Navigation
    const btnMonthInlinePrev = document.getElementById('btn-month-inline-prev');
    const btnMonthInlineNext = document.getElementById('btn-month-inline-next');
    const btnMonthInlineToday = document.getElementById('btn-month-inline-today');

    btnMonthInlinePrev?.addEventListener('click', () => {
      this.prevMonth();
    });

    btnMonthInlineNext?.addEventListener('click', () => {
      this.nextMonth();
    });

    btnMonthInlineToday?.addEventListener('click', () => {
      this.goToToday();
    });

    // 5. Modal Quản Lý Nhãn Dán (CRUD Tags) Events
    const btnOpenManageTags = document.getElementById('btn-open-manage-tags');
    const btnQuickManageTags = document.getElementById('btn-quick-manage-tags');
    const btnCloseManageTags = document.getElementById('btn-close-manage-tags');
    const modalManageTags = document.getElementById('modal-manage-tags');
    const formManageTag = document.getElementById('form-manage-tag');
    const btnCancelEditTag = document.getElementById('btn-cancel-edit-tag');

    btnOpenManageTags?.addEventListener('click', () => this.openManageTagsModal());
    btnQuickManageTags?.addEventListener('click', () => this.openManageTagsModal());
    btnCloseManageTags?.addEventListener('click', () => this.closeManageTagsModal());

    modalManageTags?.addEventListener('click', (e) => {
      if (e.target === modalManageTags) this.closeManageTagsModal();
    });

    btnCancelEditTag?.addEventListener('click', () => this.resetTagForm());

    formManageTag?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleTagFormSubmit();
    });

    // 6. Modal Tag Chain Events
    const modalTagChain = document.getElementById('modal-tag-chain');
    const btnCloseTagChain = document.getElementById('btn-close-tag-chain');

    btnCloseTagChain?.addEventListener('click', () => {
      this.closeTagChainModal();
    });

    modalTagChain?.addEventListener('click', (e) => {
      if (e.target === modalTagChain) this.closeTagChainModal();
    });

    // 7. Modal Quick Add Task Events (Thêm nhanh từ ô ngày Tháng / 4 Tuần)
    const modalQuickAdd = document.getElementById('modal-quick-add-task');
    const btnCloseQuickAdd = document.getElementById('btn-close-quick-add');
    const btnCancelQuickAdd = document.getElementById('btn-cancel-quick-add');
    const formQuickAdd = document.getElementById('form-quick-add-task');

    btnCloseQuickAdd?.addEventListener('click', () => this.closeQuickAddModal());
    btnCancelQuickAdd?.addEventListener('click', () => this.closeQuickAddModal());
    modalQuickAdd?.addEventListener('click', (e) => {
      if (e.target === modalQuickAdd) this.closeQuickAddModal();
    });

    formQuickAdd?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleQuickAddSubmit();
    });

    // 8. Modal Edit Task Events
    const modalEditTask = document.getElementById('modal-edit-task');
    const btnCloseEditTaskX = document.getElementById('btn-close-edit-task-x');
    const btnCancelEditTask = document.getElementById('btn-cancel-edit-task');
    const formEditTask = document.getElementById('form-edit-task');

    btnCloseEditTaskX?.addEventListener('click', () => this.closeEditTaskModal());
    btnCancelEditTask?.addEventListener('click', () => this.closeEditTaskModal());
    modalEditTask?.addEventListener('click', (e) => {
      if (e.target === modalEditTask) this.closeEditTaskModal();
    });

    formEditTask?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleEditTaskSubmit();
    });

    // Phím tắt Esc đóng mọi modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTagChainModal();
        this.closeQuickAddModal();
        this.closeEditTaskModal();
        this.closeMonthModal();
        this.closeManageTagsModal();
      }
    });
  },

  // --------------------------------------------------------------------------
  // Navigation Actions
  // --------------------------------------------------------------------------
  prevMonth() {
    this.viewMonth--;
    if (this.viewMonth < 1) {
      this.viewMonth = 12;
      this.viewYear--;
    }
    this.modalMonth = this.viewMonth;
    this.modalYear = this.viewYear;
    this.render();
    if (window.playChime) window.playChime(500, 0.1);
  },

  nextMonth() {
    this.viewMonth++;
    if (this.viewMonth > 12) {
      this.viewMonth = 1;
      this.viewYear++;
    }
    this.modalMonth = this.viewMonth;
    this.modalYear = this.viewYear;
    this.render();
    if (window.playChime) window.playChime(560, 0.1);
  },

  goToToday() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth() + 1;
    this.modalYear = this.viewYear;
    this.modalMonth = this.viewMonth;
    this.selectedDate = StorageManager.getTodayDateStr();
    this.render();
    if (window.showToast) window.showToast('Đã quay về lịch hôm nay!', 'info');
    if (window.playChime) window.playChime(640, 0.12);
  },

  setViewMode(mode) {
    if (!['day', 'four-weeks', 'month'].includes(mode)) return;
    this.currentViewMode = mode;

    // Lưu lựa chọn vào state
    const state = StorageManager.getState();
    if (state.schedule) {
      state.schedule.viewMode = mode;
      StorageManager.saveState(state);
    }

    this.render();
    if (window.playChime) window.playChime(600, 0.1);
  },

  // --------------------------------------------------------------------------
  // Master Render Loop
  // --------------------------------------------------------------------------
  render() {
    // 1. Cập nhật thanh View Switcher & Ẩn/Hiện Containers
    const modeButtons = document.querySelectorAll('.view-mode-btn');
    modeButtons.forEach(btn => {
      const mode = btn.getAttribute('data-mode');
      if (mode === this.currentViewMode) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const containerDay = document.getElementById('container-view-day');
    const containerFourWeeks = document.getElementById('container-view-four-weeks');
    const containerMonth = document.getElementById('container-view-month');

    if (containerDay) containerDay.style.display = this.currentViewMode === 'day' ? 'block' : 'none';
    if (containerFourWeeks) containerFourWeeks.style.display = this.currentViewMode === 'four-weeks' ? 'block' : 'none';
    if (containerMonth) containerMonth.style.display = this.currentViewMode === 'month' ? 'block' : 'none';

    // 2. Render Top Nav Bar (Tháng / Tuần / Selected Day)
    this.renderCalendarNav();

    // 3. Render Dropdown Options cho Nhãn
    this.renderTagSelectOptions();

    // 4. Render nội dung tương ứng theo View
    if (this.currentViewMode === 'day') {
      this.renderDailyTimeline();
      this.renderTagFilterChips();
    } else if (this.currentViewMode === 'four-weeks') {
      this.renderFourWeeksView();
    } else if (this.currentViewMode === 'month') {
      this.renderMonthInlineView();
    }
  },

  renderCalendarNav() {
    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) {
      monthLabel.textContent = `Tháng ${this.viewMonth} / ${this.viewYear}`;
    }

    const weekBadge = document.getElementById('schedule-week-of-year-badge');
    if (weekBadge) {
      const weekNum = this.getWeekOfYear(new Date(this.selectedDate));
      weekBadge.textContent = `Tuần ${weekNum}`;
    }

    const selectedDayTitle = document.getElementById('selected-day-title');
    const selectedDayStatusPill = document.getElementById('selected-day-status-pill');
    const todayStr = StorageManager.getTodayDateStr();

    if (selectedDayTitle) {
      const isToday = this.selectedDate === todayStr;
      const formatted = this.formatFullDayTitle(this.selectedDate);
      selectedDayTitle.textContent = isToday ? `Hôm nay, ${formatted}` : formatted;
    }

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

    this.renderWeekStrip();
  },

  renderWeekStrip() {
    const stripContainer = document.getElementById('week-strip-container');
    if (!stripContainer) return;

    const selDateObj = new Date(this.selectedDate);
    const dayOfWeek = selDateObj.getDay();
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

  renderTagSelectOptions() {
    const tags = StorageManager.getAllTags();
    const selects = [
      document.getElementById('day-select-tag'),
      document.getElementById('quick-add-tag'),
      document.getElementById('edit-task-tag')
    ];

    selects.forEach(select => {
      if (!select) return;
      const curVal = select.value;
      select.innerHTML = tags.map(t => {
        const colorName = StorageManager.TAG_PALETTE[t.color]?.name || t.color;
        return `<option value="${t.name}">${t.name} (${colorName})</option>`;
      }).join('');

      if (curVal && select.querySelector(`option[value="${curVal}"]`)) {
        select.value = curVal;
      }
    });
  },

  // --------------------------------------------------------------------------
  // VIEW 1: CHI TIẾT NGÀY (CHRONOLOGICAL TIMELINE SÁNG -> TỐI)
  // --------------------------------------------------------------------------
  renderTagFilterChips() {
    const container = document.getElementById('day-tags-filter-chips');
    if (!container) return;

    const tags = StorageManager.getAllTags();
    let html = `
      <button type="button" class="tag-filter-chip ${!this.filterTag ? 'active' : ''}" data-tag="">
        Tất cả
      </button>
    `;

    tags.forEach(t => {
      const isActive = this.filterTag === t.name;
      html += `
        <button type="button" class="tag-filter-chip ${isActive ? 'active' : ''} tag-pill-${t.color}" data-tag="${t.name}">
          ${t.name}
        </button>
      `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.tag-filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const tag = chip.getAttribute('data-tag') || null;
        this.filterTag = tag;
        this.renderDailyTimeline();
        this.renderTagFilterChips();
      });
    });
  },

  renderDailyTimeline() {
    const container = document.getElementById('daily-timeline-list');
    const countBadge = document.getElementById('timeline-summary-count');
    if (!container) return;

    let tasks = StorageManager.getDayTasks(this.selectedDate);

    // Lọc theo tag nếu có
    if (this.filterTag) {
      tasks = tasks.filter(t => (t.tag || '').trim().toLowerCase() === this.filterTag.trim().toLowerCase());
    }

    if (countBadge) {
      const completed = tasks.filter(t => t.completed).length;
      countBadge.textContent = `${completed}/${tasks.length} việc`;
    }

    // Sắp xếp tự động theo mốc thời gian từ Sáng đến Tối
    const timeToMins = (t) => {
      if (!t) return 9999;
      const p = t.trim().split(':');
      if (p.length < 2) return 9999;
      return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
    };

    tasks.sort((a, b) => {
      const mA = timeToMins(a.time);
      const mB = timeToMins(b.time);
      if (mA !== mB) return mA - mB;
      // Nếu cùng giờ, việc quan trọng xếp trước
      if (a.important && !b.important) return -1;
      if (!a.important && b.important) return 1;
      return 0;
    });

    if (tasks.length === 0) {
      container.innerHTML = `
        <div style="padding: 28px 16px; text-align: center; color: var(--text-muted); font-size: 13.5px; background: var(--card-subtle); border-radius: var(--radius-md);">
          <div style="font-size: 26px; margin-bottom: 6px;">🍃</div>
          Chưa có công việc nào trong ngày này.<br>
          <span style="font-size: 12px; opacity: 0.8;">Nhập công việc ở khung phía trên và nhấn Enter để lưu lại.</span>
        </div>
      `;
      return;
    }

    container.innerHTML = tasks.map(task => {
      const tagColor = task.tagColor || StorageManager.getTagColor(task.tag);
      const isImportant = !!task.important;
      const isCompleted = !!task.completed;
      const timeStr = task.time ? task.time : 'Linh hoạt';

      return `
        <div class="timeline-task-item ${isImportant ? 'is-important' : ''} ${isCompleted ? 'is-completed' : ''}" id="task-row-${task.id}">
          <input type="checkbox" class="timeline-task-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Đánh dấu hoàn thành">
          <span class="timeline-task-time-badge">${timeStr}</span>

          <div class="timeline-task-body">
            <span class="timeline-task-title">${this.escapeHTML(task.title)}</span>
            
            ${task.tag ? `
              <span class="tag-pill tag-pill-${tagColor}" data-tag="${task.tag}" title="Bấm để xem chuỗi liên kết: ${task.tag}">
                ${this.escapeHTML(task.tag)}
              </span>
            ` : ''}

            ${isImportant ? `
              <span class="timeline-task-important-badge" title="Công việc ưu tiên quan trọng">
                ⭐ Quan Trọng
              </span>
            ` : ''}
          </div>

          <div class="timeline-task-actions">
            <button type="button" class="task-btn-edit" data-id="${task.id}" title="Chỉnh sửa việc">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button type="button" class="task-btn-delete" data-id="${task.id}" title="Xóa">✕</button>
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện Checkbox
    container.querySelectorAll('.timeline-task-checkbox').forEach(chk => {
      chk.addEventListener('change', () => {
        const id = chk.getAttribute('data-id');
        StorageManager.toggleTask(id, this.selectedDate);
        this.render();
        if (window.playChime) window.playChime(chk.checked ? 660 : 440, 0.12);
        if (chk.checked && window.showToast) {
          window.showToast('Tuyệt vời! Đã ghi nhận vào Done-Log thành tựu.', 'success');
        }
      });
    });

    // Bắt sự kiện Click Nhãn để mở Tag Chain Modal
    container.querySelectorAll('.tag-pill[data-tag]').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = pill.getAttribute('data-tag');
        if (tag) this.openTagChainModal(tag);
      });
    });

    // Bắt sự kiện Sửa việc
    container.querySelectorAll('.task-btn-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const t = tasks.find(x => x.id === id);
        if (t) this.openEditTaskModal(t);
      });
    });

    // Bắt sự kiện Xóa việc
    container.querySelectorAll('.task-btn-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        StorageManager.deleteTask(id, this.selectedDate);
        this.render();
        if (window.showToast) window.showToast('Đã xóa công việc khỏi ngày.', 'info');
      });
    });

    // Cập nhật thanh tiến độ ngày
    const total = tasks.length;
    const done = tasks.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const progressFraction = document.getElementById('progress-fraction');
    const progressBar = document.getElementById('daily-progress-bar');
    const progressDateLabel = document.getElementById('progress-date-label');

    if (progressDateLabel) {
      progressDateLabel.textContent = this.selectedDate === StorageManager.getTodayDateStr() ? 'Tiến độ hôm nay' : `Tiến độ ngày ${this.formatDisplayDate(this.selectedDate)}`;
    }
    if (progressFraction) {
      progressFraction.textContent = `${done}/${total} việc (${pct}%)`;
    }
    if (progressBar) {
      progressBar.style.width = `${pct}%`;
    }
  },

  handleDailyAddTask() {
    const inputTitle = document.getElementById('day-input-title');
    const inputTime = document.getElementById('day-input-time');
    const selectTag = document.getElementById('day-select-tag');
    const checkImportant = document.getElementById('day-checkbox-important');

    const title = (inputTitle?.value || '').trim();
    if (!title) {
      if (window.showToast) window.showToast('Vui lòng nhập tên công việc!', 'warning');
      inputTitle?.focus();
      return;
    }

    const time = inputTime?.value || '';
    const tag = selectTag?.value || 'Admin môn JAVA';
    const tagColor = StorageManager.getTagColor(tag);
    const important = checkImportant ? checkImportant.checked : false;

    StorageManager.addTask({
      title,
      time,
      tag,
      tagColor,
      important,
      date: this.selectedDate
    });

    if (inputTitle) inputTitle.value = '';
    if (checkImportant) checkImportant.checked = false;

    this.render();
    if (window.showToast) window.showToast(`Đã thêm việc (${time}): ${title}`, 'success');
    if (window.playChime) window.playChime(760, 0.16);
  },

  // --------------------------------------------------------------------------
  // VIEW 2: BẢNG 4 TUẦN (HORIZON ROADMAP 4 TUẦN TỚI)
  // --------------------------------------------------------------------------
  renderFourWeeksView() {
    const gridContainer = document.getElementById('four-weeks-grid');
    if (!gridContainer) return;

    const weeks = StorageManager.getFourWeeksData(this.selectedDate);

    gridContainer.innerHTML = weeks.map(w => {
      const daysHtml = w.days.map(d => {
        const isCurrentSelected = d.dateStr === this.selectedDate;
        const taskPillsHtml = d.tasks.slice(0, 3).map(t => {
          const color = t.tagColor || StorageManager.getTagColor(t.tag);
          return `
            <div class="horizon-mini-task ${t.completed ? 'is-done' : ''} tag-pill-${color}" title="${this.escapeHTML(t.title)}">
              ${t.important ? '⭐ ' : ''}${this.escapeHTML(t.title)}
            </div>
          `;
        }).join('');

        const moreCount = d.tasks.length > 3 ? `<div style="font-size: 10px; color: var(--text-muted); font-weight: 600;">+${d.tasks.length - 3} việc nữa</div>` : '';

        return `
          <div class="horizon-day-row ${d.isToday ? 'is-today' : ''} ${isCurrentSelected ? 'is-selected' : ''}" data-date="${d.dateStr}">
            <div class="horizon-day-top">
              <span class="horizon-day-date">${d.dayName} (${d.dayNumber}/${d.monthNumber})</span>
              <button type="button" class="btn-mini-add-task" data-date="${d.dateStr}" title="Thêm việc cho ngày này">+</button>
            </div>
            <div class="horizon-day-tasks">
              ${taskPillsHtml}
              ${moreCount}
            </div>
          </div>
        `;
      }).join('');

      return `
        <div class="week-horizon-card">
          <div class="week-horizon-header">
            <div>
              <div class="week-horizon-title">${w.label}</div>
              <div class="week-horizon-range">${w.rangeStr}</div>
            </div>
            <div class="week-horizon-meter">
              <span class="week-horizon-fraction">${w.completedTasks}/${w.totalTasks} việc (${w.percent}%)</span>
              <div class="week-meter-track">
                <div class="week-meter-fill" style="width: ${w.percent}%;"></div>
              </div>
            </div>
          </div>

          <div class="week-days-stack">
            ${daysHtml}
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện chọn ngày từ bảng 4 tuần -> Nhảy sang Chi tiết Ngày
    gridContainer.querySelectorAll('.horizon-day-row[data-date]').forEach(row => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-mini-add-task')) return;
        const date = row.getAttribute('data-date');
        if (date) {
          this.selectedDate = date;
          this.setViewMode('day');
          if (window.showToast) {
            window.showToast(`Đã chọn ngày: ${this.formatFullDayTitle(date)}`, 'info');
          }
        }
      });
    });

    // Bắt sự kiện nút '+' thêm nhanh
    gridContainer.querySelectorAll('.btn-mini-add-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.getAttribute('data-date');
        if (date) this.openQuickAddModal(date);
      });
    });
  },

  // --------------------------------------------------------------------------
  // VIEW 3: BẢNG THÁNG TOÀN CẢNH (MONTH GRID CÓ MINI TAGS & NÚT '+')
  // --------------------------------------------------------------------------
  renderMonthInlineView() {
    const titleText = document.getElementById('month-inline-title');
    const gridContainer = document.getElementById('month-inline-grid-cells');
    if (!gridContainer) return;

    const year = this.viewYear;
    const month = this.viewMonth;

    if (titleText) {
      titleText.textContent = `Bảng Tháng Toàn Cảnh: Tháng ${month} / ${year}`;
    }

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayIndex = firstDayOfMonth.getDay();
    const mondayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
    const prevMonthDays = new Date(year, month - 1, 0).getDate();
    const todayStr = StorageManager.getTodayDateStr();

    const cellsHtml = [];

    // 1. Ngày tháng trước
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      cellsHtml.push(`
        <div class="month-cell-box other-month">
          <div class="month-cell-top">
            <span class="month-cell-num">${dNum}</span>
          </div>
        </div>
      `);
    }

    // 2. Ngày trong tháng
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;

      const tasks = StorageManager.getDayTasks(dateStr);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDate;

      const taskChips = tasks.slice(0, 2).map(t => {
        const color = t.tagColor || StorageManager.getTagColor(t.tag);
        return `
          <div class="month-mini-chip tag-pill-${color}" title="${this.escapeHTML(t.title)}">
            ${t.important ? '⭐ ' : ''}${this.escapeHTML(t.title)}
          </div>
        `;
      }).join('');

      const more = tasks.length > 2 ? `<div style="font-size: 9.5px; color: var(--text-muted); font-weight: 700;">+${tasks.length - 2}</div>` : '';

      cellsHtml.push(`
        <div class="month-cell-box ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateStr}">
          <div class="month-cell-top">
            <span class="month-cell-num">${day}</span>
            <button type="button" class="btn-mini-add-task" data-date="${dateStr}" title="Ghi việc nhanh">+</button>
          </div>
          <div class="month-cell-tasks-list">
            ${taskChips}
            ${more}
          </div>
        </div>
      `);
    }

    gridContainer.innerHTML = cellsHtml.join('');

    // Bắt sự kiện click ô ngày -> Chuyển sang xem Chi tiết ngày
    gridContainer.querySelectorAll('.month-cell-box[data-date]').forEach(cell => {
      cell.addEventListener('click', (e) => {
        if (e.target.closest('.btn-mini-add-task')) return;
        const date = cell.getAttribute('data-date');
        if (date) {
          this.selectedDate = date;
          this.setViewMode('day');
          if (window.showToast) {
            window.showToast(`Đã chuyển sang xem: ${this.formatFullDayTitle(date)}`, 'info');
          }
        }
      });
    });

    // Bắt sự kiện nút '+' ghi việc nhanh
    gridContainer.querySelectorAll('.btn-mini-add-task').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const date = btn.getAttribute('data-date');
        if (date) this.openQuickAddModal(date);
      });
    });
  },

  // --------------------------------------------------------------------------
  // MODAL CHUỖI LIÊN KẾT NHÃN (QUÁ KHỨ -> HÔM NAY -> TƯƠNG LAI)
  // --------------------------------------------------------------------------
  openTagChainModal(tagName) {
    if (!tagName) return;
    const modal = document.getElementById('modal-tag-chain');
    const pill = document.getElementById('modal-tag-chain')?.querySelector('#tag-chain-modal-pill');
    const dot = document.getElementById('tag-chain-dot-indicator');
    const statPill = document.getElementById('tag-chain-stat-pill');

    const pastList = document.getElementById('tag-chain-past-list');
    const todayList = document.getElementById('tag-chain-today-list');
    const futureList = document.getElementById('tag-chain-future-list');

    const pastCount = document.getElementById('tag-chain-past-count');
    const todayCount = document.getElementById('tag-chain-today-count');
    const futureCount = document.getElementById('tag-chain-future-count');

    const chainData = StorageManager.getTasksByTag(tagName);
    if (!chainData) return;

    if (pill) {
      pill.textContent = tagName;
      pill.className = `tag-chain-pill-large tag-pill-${chainData.color}`;
    }

    if (dot) {
      const palette = StorageManager.TAG_PALETTE[chainData.color];
      dot.style.background = palette ? palette.dot : '#f97316';
    }

    if (statPill) {
      const pct = chainData.totalCount > 0 ? Math.round((chainData.completedCount / chainData.totalCount) * 100) : 0;
      statPill.textContent = `${chainData.completedCount}/${chainData.totalCount} hoàn thành (${pct}%)`;
    }

    // 1. Render Quá khứ
    if (pastCount) pastCount.textContent = `${chainData.past.length} việc`;
    if (pastList) {
      if (chainData.past.length === 0) {
        pastList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); font-style: italic;">Chưa có công việc nào trong quá khứ.</div>`;
      } else {
        pastList.innerHTML = chainData.past.map(t => `
          <div class="stage-task-row">
            <div class="stage-task-left">
              <span>${t.completed ? '✅' : '⏳'}</span>
              <span style="${t.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${this.escapeHTML(t.title)}</span>
            </div>
            <span class="stage-date-badge">${this.formatDisplayDate(t.date)}</span>
          </div>
        `).join('');
      }
    }

    // 2. Render Hôm nay
    if (todayCount) todayCount.textContent = `${chainData.today.length} việc`;
    if (todayList) {
      if (chainData.today.length === 0) {
        todayList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); font-style: italic;">Hôm nay chưa có việc nào của nhãn này.</div>`;
      } else {
        todayList.innerHTML = chainData.today.map(t => `
          <div class="stage-task-row" style="background: rgba(2, 132, 199, 0.08);">
            <div class="stage-task-left">
              <span>${t.completed ? '✅' : '📌'}</span>
              <strong style="${t.completed ? 'text-decoration: line-through; opacity: 0.7;' : ''}">${this.escapeHTML(t.title)}</strong>
              ${t.important ? '<span style="color: #ea580c; font-size: 11px;">⭐ Quan Trọng</span>' : ''}
            </div>
            <span class="stage-date-badge" style="color: var(--ocean-blue); font-weight: 700;">${t.time || 'Hôm nay'}</span>
          </div>
        `).join('');
      }
    }

    // 3. Render Tương lai
    if (futureCount) futureCount.textContent = `${chainData.future.length} việc`;
    if (futureList) {
      if (chainData.future.length === 0) {
        futureList.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); font-style: italic;">Chưa có lịch cho những ngày sắp tới.</div>`;
      } else {
        futureList.innerHTML = chainData.future.map(t => `
          <div class="stage-task-row">
            <div class="stage-task-left">
              <span>🗓️</span>
              <span>${this.escapeHTML(t.title)}</span>
              ${t.important ? '<span style="color: #ea580c; font-size: 11px;">⭐ Quan Trọng</span>' : ''}
            </div>
            <span class="stage-date-badge">${this.formatDisplayDate(t.date)}</span>
          </div>
        `).join('');
      }
    }

    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    if (window.playChime) window.playChime(620, 0.12);
  },

  closeTagChainModal() {
    const modal = document.getElementById('modal-tag-chain');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  // --------------------------------------------------------------------------
  // MODAL QUICK ADD TASK (THÊM NHANH TỪ Ô NGÀY)
  // --------------------------------------------------------------------------
  openQuickAddModal(dateStr) {
    const modal = document.getElementById('modal-quick-add-task');
    const title = document.getElementById('quick-add-modal-title');
    const inputDate = document.getElementById('quick-add-date');
    const inputTitle = document.getElementById('quick-add-title');
    const checkImportant = document.getElementById('quick-add-important');

    if (title) title.textContent = `Thêm Việc Cho Ngày: ${this.formatFullDayTitle(dateStr)}`;
    if (inputDate) inputDate.value = dateStr;
    if (inputTitle) inputTitle.value = '';
    if (checkImportant) checkImportant.checked = false;

    this.renderTagSelectOptions();

    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    setTimeout(() => inputTitle?.focus(), 50);
    if (window.playChime) window.playChime(620, 0.1);
  },

  closeQuickAddModal() {
    const modal = document.getElementById('modal-quick-add-task');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  handleQuickAddSubmit() {
    const dateStr = document.getElementById('quick-add-date')?.value;
    const title = document.getElementById('quick-add-title')?.value;
    const time = document.getElementById('quick-add-time')?.value;
    const tag = document.getElementById('quick-add-tag')?.value;
    const important = document.getElementById('quick-add-important')?.checked;

    if (!title || !title.trim()) {
      if (window.showToast) window.showToast('Vui lòng nhập tên công việc!', 'warning');
      return;
    }

    StorageManager.addTask({
      title: title.trim(),
      time: time ? time.trim() : '',
      tag: tag || 'Admin môn JAVA',
      tagColor: StorageManager.getTagColor(tag),
      important: !!important,
      date: dateStr
    });

    this.closeQuickAddModal();
    this.render();

    if (window.showToast) window.showToast(`Đã thêm việc cho ngày ${this.formatDisplayDate(dateStr)}!`, 'success');
    if (window.playChime) window.playChime(760, 0.16);
  },

  // --------------------------------------------------------------------------
  // MODAL EDIT TASK (CRUD - CẬP NHẬT CÔNG VIỆC)
  // --------------------------------------------------------------------------
  openEditTaskModal(task) {
    if (!task) return;
    const modal = document.getElementById('modal-edit-task');
    const inputId = document.getElementById('edit-task-id');
    const inputTitle = document.getElementById('edit-task-title');
    const inputTime = document.getElementById('edit-task-time');
    const selectTag = document.getElementById('edit-task-tag');
    const checkImportant = document.getElementById('edit-task-important');

    this.renderTagSelectOptions();

    if (inputId) inputId.value = task.id;
    if (inputTitle) inputTitle.value = task.title || '';
    if (inputTime) inputTime.value = task.time || '';
    if (selectTag && task.tag) selectTag.value = task.tag;
    if (checkImportant) checkImportant.checked = !!task.important;

    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    setTimeout(() => inputTitle?.focus(), 50);
    if (window.playChime) window.playChime(620, 0.1);
  },

  closeEditTaskModal() {
    const modal = document.getElementById('modal-edit-task');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  handleEditTaskSubmit() {
    const taskId = document.getElementById('edit-task-id')?.value;
    const title = document.getElementById('edit-task-title')?.value;
    const time = document.getElementById('edit-task-time')?.value;
    const tag = document.getElementById('edit-task-tag')?.value;
    const important = document.getElementById('edit-task-important')?.checked;

    if (!taskId || !title || !title.trim()) {
      if (window.showToast) window.showToast('Vui lòng nhập tên công việc!', 'warning');
      return;
    }

    StorageManager.updateTask(taskId, {
      title: title.trim(),
      time: time ? time.trim() : '',
      tag: tag || 'Admin môn JAVA',
      tagColor: StorageManager.getTagColor(tag),
      important: !!important
    }, this.selectedDate);

    this.closeEditTaskModal();
    this.render();

    if (window.showToast) window.showToast('Đã lưu thay đổi nhiệm vụ!', 'success');
    if (window.playChime) window.playChime(760, 0.16);
  },

  // --------------------------------------------------------------------------
  // MODAL QUẢN LÝ NHÃN DÁN (FULL CRUD TAGS)
  // --------------------------------------------------------------------------
  selectedTagColor: 'orange',

  openManageTagsModal() {
    const modal = document.getElementById('modal-manage-tags');
    this.resetTagForm();
    this.renderTagColorSwatches();
    this.renderManageTagsList();

    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    const input = document.getElementById('tag-form-name');
    setTimeout(() => input?.focus(), 50);
    if (window.playChime) window.playChime(620, 0.1);
  },

  closeManageTagsModal() {
    const modal = document.getElementById('modal-manage-tags');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  renderTagColorSwatches() {
    const container = document.getElementById('tag-color-swatches');
    if (!container) return;

    const palette = StorageManager.TAG_PALETTE;
    const colors = Object.keys(palette);

    container.innerHTML = colors.map(c => {
      const isSelected = c === this.selectedTagColor;
      const dotColor = palette[c].dot;
      return `
        <button type="button" class="tag-color-swatch-btn ${isSelected ? 'selected' : ''}" 
                data-color="${c}" 
                style="background-color: ${dotColor};" 
                title="${palette[c].name}">
        </button>
      `;
    }).join('');

    container.querySelectorAll('.tag-color-swatch-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.getAttribute('data-color');
        if (c) {
          this.selectedTagColor = c;
          this.renderTagColorSwatches();
        }
      });
    });
  },

  renderManageTagsList() {
    const listContainer = document.getElementById('manage-tags-list');
    const countBadge = document.getElementById('manage-tags-total-count');
    if (!listContainer) return;

    const tags = StorageManager.getAllTags();
    if (countBadge) countBadge.textContent = `${tags.length} nhãn`;

    if (tags.length === 0) {
      listContainer.innerHTML = `<div style="text-align: center; color: var(--text-muted); font-size: 12.5px; padding: 16px;">Chưa có nhãn nào. Hãy tạo nhãn mới ở trên.</div>`;
      return;
    }

    listContainer.innerHTML = tags.map(t => {
      const taskCount = StorageManager.countTasksByTag(t.name);
      return `
        <div class="tag-manage-row" data-tag-name="${this.escapeHTML(t.name)}">
          <div class="tag-manage-left">
            <span class="tag-pill tag-pill-${t.color}">
              ${this.escapeHTML(t.name)}
            </span>
            <span class="tag-manage-count">${taskCount} công việc</span>
          </div>
          <div class="tag-manage-actions">
            <button type="button" class="btn-tag-action-edit" data-tag="${this.escapeHTML(t.name)}" title="Sửa tên hoặc màu nhãn">
              Sửa
            </button>
            <button type="button" class="btn-tag-action-delete" data-tag="${this.escapeHTML(t.name)}" title="Xóa nhãn này">
              Xóa
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện Sửa nhãn
    listContainer.querySelectorAll('.btn-tag-action-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-tag');
        this.editTagInModal(name);
      });
    });

    // Bắt sự kiện Xóa nhãn
    listContainer.querySelectorAll('.btn-tag-action-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-tag');
        this.deleteTagInModal(name);
      });
    });
  },

  editTagInModal(name) {
    const inputOrig = document.getElementById('tag-form-original-name');
    const inputName = document.getElementById('tag-form-name');
    const labelTitle = document.getElementById('tag-form-title-label');
    const btnSubmit = document.getElementById('btn-submit-tag');
    const btnCancel = document.getElementById('btn-cancel-edit-tag');

    const tags = StorageManager.getAllTags();
    const found = tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!found) return;

    if (inputOrig) inputOrig.value = found.name;
    if (inputName) inputName.value = found.name;
    if (labelTitle) labelTitle.textContent = `Đang sửa nhãn: "${found.name}"`;
    if (btnSubmit) btnSubmit.textContent = 'Lưu Thay Đổi';
    if (btnCancel) btnCancel.style.display = 'inline-block';

    this.selectedTagColor = found.color || 'orange';
    this.renderTagColorSwatches();
    inputName?.focus();
  },

  deleteTagInModal(name) {
    if (!confirm(`Bạn có chắc chắn muốn xóa nhãn "${name}" không?`)) return;

    const res = StorageManager.deleteTag(name);
    if (res.success) {
      if (this.filterTag && this.filterTag.toLowerCase() === name.toLowerCase()) {
        this.filterTag = null;
      }
      this.renderManageTagsList();
      this.render();
      if (window.showToast) window.showToast(`Đã xóa nhãn "${name}".`, 'info');
      if (window.playChime) window.playChime(480, 0.1);
    }
  },

  resetTagForm() {
    const inputOrig = document.getElementById('tag-form-original-name');
    const inputName = document.getElementById('tag-form-name');
    const labelTitle = document.getElementById('tag-form-title-label');
    const btnSubmit = document.getElementById('btn-submit-tag');
    const btnCancel = document.getElementById('btn-cancel-edit-tag');

    if (inputOrig) inputOrig.value = '';
    if (inputName) inputName.value = '';
    if (labelTitle) labelTitle.textContent = 'Tên nhãn môn / dự án mới';
    if (btnSubmit) btnSubmit.textContent = '+ Tạo Nhãn Mới';
    if (btnCancel) btnCancel.style.display = 'none';

    this.selectedTagColor = 'orange';
    this.renderTagColorSwatches();
  },

  handleTagFormSubmit() {
    const inputOrig = document.getElementById('tag-form-original-name');
    const inputName = document.getElementById('tag-form-name');
    const originalName = inputOrig?.value || '';
    const newName = (inputName?.value || '').trim();

    if (!newName) {
      if (window.showToast) window.showToast('Vui lòng nhập tên nhãn!', 'warning');
      return;
    }

    if (originalName) {
      // Update Tag
      const res = StorageManager.updateTag(originalName, newName, this.selectedTagColor);
      if (!res.success) {
        if (window.showToast) window.showToast(res.message, 'warning');
        return;
      }
      if (this.filterTag && this.filterTag.toLowerCase() === originalName.toLowerCase()) {
        this.filterTag = newName;
      }
      if (window.showToast) window.showToast(`Đã cập nhật nhãn: "${newName}"!`, 'success');
    } else {
      // Create Tag
      const res = StorageManager.createTag(newName, this.selectedTagColor);
      if (!res.success) {
        if (window.showToast) window.showToast(res.message, 'warning');
        return;
      }
      if (window.showToast) window.showToast(`Đã tạo nhãn mới: "${newName}"!`, 'success');
    }

    this.resetTagForm();
    this.renderManageTagsList();
    this.render();
    if (window.playChime) window.playChime(760, 0.15);
  },

  closeMonthModal() {
    const modal = document.getElementById('modal-month-calendar');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  // --------------------------------------------------------------------------
  // Utility Functions
  // --------------------------------------------------------------------------
  getWeekOfYear(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
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
