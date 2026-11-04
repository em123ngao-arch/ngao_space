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
  currentFourWeeksIndex: 0,
  filterTag: null,

  // Visual Time-Grid state
  timegridInitialized: false,
  isSelecting: false,
  selectStartY: 0,
  popoverStartMin: 540, // 09:00 default
  popoverEndMin: 720,   // 12:00 default
  popoverSelectedTag: '',
  isResizing: false,
  resizingTaskId: null,
  resizingStartMin: 0,
  isMoving: false,
  movingTaskId: null,
  movingDuration: 0,
  movingOffsetY: 0,
  liveClockInterval: null,

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
    this.initTimeGridInteractions();
    this.startLiveClock();
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

    // Khi ở Bảng 4 Tuần hoặc Bảng Tháng, ẩn toàn bộ calendar-nav-section (vì Bảng Tháng đã có cụm chuyển tháng riêng, 4 Tuần là roadmap riêng)
    const calNavSection = document.querySelector('.calendar-nav-section');
    if (calNavSection) calNavSection.style.display = this.currentViewMode === 'day' ? 'flex' : 'none';

    // 2. Render Top Nav Bar (Tháng / Tuần / Selected Day)
    this.renderCalendarNav();

    // 3. Render Dropdown Options cho Nhãn
    this.renderTagSelectOptions();

    // 3.5 Render Thanh Lọc Nhãn Toàn Cục (Đồng bộ Ngày, 4 Tuần, Tháng)
    this.renderGlobalFilterBar();

    // 4. Render nội dung tương ứng theo View
    if (this.currentViewMode === 'day') {
      this.renderDayView();
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

    const selectedDayTitle = document.getElementById('selected-day-title');
    const selectedDayStatusPill = document.getElementById('selected-day-status-pill');
    const clockText = document.getElementById('timegrid-clock-text');
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
        selectedDayStatusPill.textContent = 'Chưa lên việc';
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

    if (clockText) {
      const now = new Date();
      const curH = String(now.getHours()).padStart(2, '0');
      const curM = String(now.getMinutes()).padStart(2, '0');
      clockText.textContent = `${curH}:${curM}`;
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
  // THANH LỌC NHÃN TOÀN CỤC (GLOBAL TAG FILTER BAR - ĐỒNG BỘ 3 KHUNG NHÌN)
  // --------------------------------------------------------------------------
  renderGlobalFilterBar() {
    const container = document.getElementById('global-filter-chips-container');
    const statusBar = document.getElementById('filter-active-status-bar');
    const statusText = document.getElementById('filter-active-status-text');
    const btnClear = document.getElementById('btn-clear-global-filter');
    if (!container) return;

    const tags = StorageManager.getAllTags();
    const totalAll = StorageManager.countAllTasks();
    const totalImportant = StorageManager.countImportantTasks();

    let chipsHtml = `
      <span class="global-filter-pill tag-all ${!this.filterTag ? 'active' : ''}" data-tag="" title="Xem toàn bộ công việc">
        Tất cả <span class="global-filter-count">${totalAll}</span>
      </span>
    `;

    tags.forEach(tag => {
      const count = StorageManager.countTasksByTag(tag.name);
      const isSelected = this.filterTag === tag.name;
      chipsHtml += `
        <span class="global-filter-pill tag-pill-${tag.color} ${isSelected ? 'active' : ''}" 
              draggable="true" 
              data-tag="${this.escapeHTML(tag.name)}" 
              data-color="${tag.color}"
              title="Bấm để lọc hoặc kéo thả vào khung giờ bên dưới">
          ${this.escapeHTML(tag.name)} <span class="global-filter-count">${count}</span>
        </span>
      `;
    });

    const isImportantSelected = this.filterTag === '__important__';
    chipsHtml += `
      <span class="global-filter-pill tag-pill-star ${isImportantSelected ? 'active' : ''}" data-tag="__important__" title="Lọc các việc ưu tiên quan trọng">
        ⭐ Quan Trọng <span class="global-filter-count">${totalImportant}</span>
      </span>
    `;

    container.innerHTML = chipsHtml;

    // Gán sự kiện click và drag cho từng pill
    container.querySelectorAll('.global-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const targetTag = pill.getAttribute('data-tag') || null;
        if (this.filterTag === targetTag) {
          this.filterTag = null;
        } else {
          this.filterTag = targetTag;
        }
        this.render();
        if (window.playChime) window.playChime(this.filterTag ? 660 : 520, 0.1);
      });

      if (pill.getAttribute('data-color')) {
        pill.addEventListener('dragstart', (e) => {
          const tagName = pill.getAttribute('data-tag');
          const tagColor = pill.getAttribute('data-color');
          e.dataTransfer.setData('text/plain', tagName);
          e.dataTransfer.setData('application/x-tag-color', tagColor);
          pill.classList.add('is-dragging');
        });
        pill.addEventListener('dragend', () => {
          pill.classList.remove('is-dragging');
        });
      }
    });

    // Cập nhật thanh trạng thái khi đang lọc
    if (this.filterTag) {
      if (statusBar) statusBar.style.display = 'flex';
      let countFound = 0;
      let label = '';
      if (this.filterTag === '__important__') {
        countFound = totalImportant;
        label = '⭐ Việc Quan Trọng';
      } else {
        countFound = StorageManager.countTasksByTag(this.filterTag);
        label = this.filterTag;
      }
      if (statusText) {
        statusText.innerHTML = `Đang lọc theo nhãn: <strong>${this.escapeHTML(label)}</strong> • Tìm thấy <strong>${countFound} việc</strong> (áp dụng trên cả Ngày, Tuần, Tháng)`;
      }
    } else {
      if (statusBar) statusBar.style.display = 'none';
    }

    // Nút Bỏ lọc
    if (btnClear && !btnClear._hasFilterBound) {
      btnClear._hasFilterBound = true;
      btnClear.addEventListener('click', () => {
        this.filterTag = null;
        this.render();
        if (window.playChime) window.playChime(500, 0.1);
      });
    }
  },

  // --------------------------------------------------------------------------
  // VIEW 1: CHI TIẾT NGÀY (VISUAL TIME-GRID & DRAG-AND-DROP PLANNER)
  // --------------------------------------------------------------------------
  timeToMinutes(timeStr) {
    if (!timeStr) return null;
    const parts = timeStr.trim().split(':');
    if (parts.length < 2) return null;
    const h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return null;
    return h * 60 + m;
  },

  minutesToTime(mins) {
    mins = Math.max(0, Math.min(1440, mins));
    const h = Math.floor(mins / 60) % 24;
    const m = mins % 60;
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  },

  formatDuration(startMin, endMin) {
    const diff = Math.max(0, endMin - startMin);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
    if (h > 0 && m > 0) return `${h}h${m}p`;
    if (h > 0) return `${h} tiếng`;
    return `${m} phút`;
  },

  renderDayView() {
    this.renderVisualTimeGrid();
  },

  renderVisualTimeGrid() {
    const gutter = document.getElementById('timegrid-time-gutter');
    const hourLines = document.getElementById('timegrid-hour-lines');
    const tasksLayer = document.getElementById('timegrid-tasks-layer');
    if (!gutter || !tasksLayer) return;

    // 1. Gutter & Hour lines (06:00 to 23:00)
    let gutterHTML = '';
    let hourLinesHTML = '';
    for (let h = 6; h <= 23; h++) {
      const timeLabel = String(h).padStart(2, '0') + ':00';
      gutterHTML += `<div class="timegrid-gutter-hour"><span>${timeLabel}</span></div>`;
      hourLinesHTML += `
        <div class="timegrid-hour-slot">
          <div class="timegrid-half-hour-line"></div>
        </div>
      `;
    }
    gutter.innerHTML = gutterHTML;
    if (hourLines) hourLines.innerHTML = hourLinesHTML;

    // 2. Now Indicator
    this.updateNowIndicator();

    // 3. Tasks Layer (Hỗ trợ xếp cạnh nhau thông minh nếu cùng giờ)
    let tasks = StorageManager.getDayTasks(this.selectedDate);
    if (this.filterTag === '__important__') {
      tasks = tasks.filter(t => !!t.important);
    } else if (this.filterTag) {
      tasks = tasks.filter(t => (t.tag || '').trim().toLowerCase() === this.filterTag.trim().toLowerCase());
    }

    const processedTasks = tasks.map(task => {
      let startMin = null;
      let endMin = null;

      if (task.startTime && task.endTime) {
        startMin = this.timeToMinutes(task.startTime);
        endMin = this.timeToMinutes(task.endTime);
      } else if (task.time && task.time.includes('-')) {
        const parts = task.time.split('-');
        startMin = this.timeToMinutes(parts[0]);
        endMin = this.timeToMinutes(parts[1]);
      } else if (task.time) {
        startMin = this.timeToMinutes(task.time);
        if (startMin !== null) endMin = startMin + 60;
      }

      if (startMin === null) startMin = 540; // 09:00 default
      if (endMin === null || endMin <= startMin) endMin = startMin + 60;

      return {
        ...task,
        startMin,
        endMin,
        top: Math.max(0, startMin - 360),
        height: Math.max(34, endMin - startMin)
      };
    });

    // Sắp xếp và chia cột cho các công việc trùng khung giờ
    processedTasks.sort((a, b) => a.startMin - b.startMin || (b.endMin - b.startMin) - (a.endMin - a.startMin));

    const columns = [];
    processedTasks.forEach(task => {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (columns[c] <= task.startMin) {
          columns[c] = task.endMin;
          task.col = c;
          placed = true;
          break;
        }
      }
      if (!placed) {
        task.col = columns.length;
        columns.push(task.endMin);
      }
    });

    processedTasks.forEach(task => {
      const overlapping = processedTasks.filter(other => !(other.endMin <= task.startMin || other.startMin >= task.endMin));
      task.totalCols = Math.max(...overlapping.map(o => o.col)) + 1;
    });

    tasksLayer.innerHTML = processedTasks.map(task => {
      const tagColor = task.tagColor || StorageManager.getTagColor(task.tag) || 'blue';
      const isImportant = !!task.important;
      const isCompleted = !!task.completed;
      const displayTime = `${this.minutesToTime(task.startMin)} - ${this.minutesToTime(task.endMin)}`;

      const widthPercent = (100 / (task.totalCols || 1)).toFixed(2);
      const leftPercent = ((task.col || 0) * (100 / (task.totalCols || 1))).toFixed(2);
      const style = `top: ${task.top}px; height: ${task.height}px; left: calc(${leftPercent}% + 6px); width: calc(${widthPercent}% - 12px);`;

      return `
        <div class="timegrid-task-block tag-color-${tagColor} ${isImportant ? 'is-important' : ''} ${isCompleted ? 'is-completed' : ''}" 
             id="timegrid-task-${task.id}" 
             data-id="${task.id}"
             data-start-min="${task.startMin}"
             data-end-min="${task.endMin}"
             style="${style}">
          <div class="task-block-top-row">
            <div class="task-block-meta-left">
              <input type="checkbox" class="task-block-checkbox" data-id="${task.id}" ${isCompleted ? 'checked' : ''} title="Đánh dấu hoàn thành">
              <span class="task-block-time-badge">${displayTime}</span>
              ${task.tag ? `<span class="task-block-tag-badge tag-pill-${tagColor}" data-tag="${this.escapeHTML(task.tag)}" title="Xem chuỗi công việc ${this.escapeHTML(task.tag)}">${this.escapeHTML(task.tag)}</span>` : ''}
              ${isImportant ? `<span class="task-block-important-star" title="Công việc quan trọng">⭐</span>` : ''}
            </div>
            <div class="task-block-actions">
              <button type="button" class="btn-task-block-action btn-task-edit" data-id="${task.id}" title="Sửa chi tiết">✏️</button>
              <button type="button" class="btn-task-block-action btn-task-del" data-id="${task.id}" title="Xóa">✕</button>
            </div>
          </div>
          <div class="task-block-title" title="${this.escapeHTML(task.title)}">${this.escapeHTML(task.title)}</div>
          <div class="task-resize-handle" data-id="${task.id}" title="Kéo lên/xuống để chỉnh thời lượng">
            <div class="task-resize-handle-bar"></div>
          </div>
        </div>
      `;
    }).join('');

    // Bind task events
    tasksLayer.querySelectorAll('.task-block-checkbox').forEach(chk => {
      chk.addEventListener('change', (e) => {
        e.stopPropagation();
        const id = chk.getAttribute('data-id');
        StorageManager.toggleTask(id, this.selectedDate);
        this.render();
        if (window.playChime) window.playChime(chk.checked ? 660 : 440, 0.12);
        if (chk.checked && window.showToast) {
          window.showToast('Tuyệt vời! Đã hoàn thành công việc.', 'success');
        }
      });
    });

    tasksLayer.querySelectorAll('.btn-task-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const t = tasks.find(x => x.id === id);
        if (t) this.openEditTaskModal(t);
      });
    });

    tasksLayer.querySelectorAll('.btn-task-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        StorageManager.deleteTask(id, this.selectedDate);
        this.render();
        if (window.showToast) window.showToast('Đã xóa công việc khỏi ngày.', 'info');
      });
    });

    tasksLayer.querySelectorAll('.task-block-tag-badge').forEach(badge => {
      badge.addEventListener('click', (e) => {
        e.stopPropagation();
        const tag = badge.getAttribute('data-tag');
        if (tag) this.openTagChainModal(tag);
      });
    });

    tasksLayer.querySelectorAll('.task-resize-handle').forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        const id = handle.getAttribute('data-id');
        const taskBlock = document.getElementById(`timegrid-task-${id}`);
        if (!taskBlock) return;
        this.isResizing = true;
        this.resizingTaskId = id;
        this.resizingStartMin = parseInt(taskBlock.getAttribute('data-start-min'), 10);
        document.body.style.cursor = 'ns-resize';
      });
    });

    tasksLayer.querySelectorAll('.timegrid-task-block').forEach(block => {
      block.addEventListener('mousedown', (e) => {
        if (e.target.closest('.btn-task-block-action, .task-block-checkbox, .task-resize-handle, .task-block-tag-badge')) return;
        e.preventDefault();
        const id = block.getAttribute('data-id');
        const sMin = parseInt(block.getAttribute('data-start-min'), 10);
        const eMin = parseInt(block.getAttribute('data-end-min'), 10);
        this.isMoving = true;
        this.movingTaskId = id;
        this.movingDuration = eMin - sMin;
        const canvas = document.getElementById('timegrid-canvas');
        const rect = canvas.getBoundingClientRect();
        this.movingOffsetY = (e.clientY - rect.top) - (sMin - 360);
        block.classList.add('is-moving');
        document.body.style.cursor = 'grabbing';
      });
    });
  },

  updateNowIndicator() {
    const indicator = document.getElementById('timegrid-now-indicator');
    const clockText = document.getElementById('timegrid-clock-text');
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    if (clockText) clockText.textContent = `Giờ thực tế: ${curH}:${curM}`;

    if (!indicator) return;
    const isToday = this.selectedDate === StorageManager.getTodayDateStr();
    if (!isToday) {
      indicator.style.display = 'none';
      return;
    }

    const curTotalMins = now.getHours() * 60 + now.getMinutes();
    if (curTotalMins >= 360 && curTotalMins <= 1440) {
      const topY = curTotalMins - 360;
      indicator.style.display = 'flex';
      indicator.style.top = `${topY}px`;
    } else {
      indicator.style.display = 'none';
    }
  },

  startLiveClock() {
    if (this.liveClockInterval) clearInterval(this.liveClockInterval);
    this.liveClockInterval = setInterval(() => {
      this.updateNowIndicator();
    }, 30000);
  },

  renderPopoverTagChips(selectedTag) {
    const container = document.getElementById('popover-tags-chips');
    if (!container) return;

    const tags = StorageManager.getAllTags();
    const currentTag = selectedTag || this.popoverSelectedTag || (tags[0] ? tags[0].name : 'Admin môn JAVA');
    this.popoverSelectedTag = currentTag;

    container.innerHTML = tags.map(tag => {
      const isSel = tag.name === currentTag;
      return `
        <span class="popover-chip-pill tag-pill-${tag.color} ${isSel ? 'selected' : ''}" data-tag="${this.escapeHTML(tag.name)}">
          ${this.escapeHTML(tag.name)}
        </span>
      `;
    }).join('');

    container.querySelectorAll('.popover-chip-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        e.stopPropagation();
        const tName = pill.getAttribute('data-tag');
        this.popoverSelectedTag = tName;
        this.renderPopoverTagChips(tName);
      });
    });
  },

  openCreatePopover({ startMin, endMin, preselectedTag, topY }) {
    const popover = document.getElementById('timegrid-create-popover');
    const backdrop = document.getElementById('timegrid-popover-backdrop');
    const timeRangeText = document.getElementById('popover-time-range-text');
    const durationText = document.getElementById('popover-duration-text');
    const inputTitle = document.getElementById('popover-task-title');
    const checkImportant = document.getElementById('popover-important-checkbox');
    if (!popover) return;

    this.popoverStartMin = startMin;
    this.popoverEndMin = endMin;
    if (preselectedTag) this.popoverSelectedTag = preselectedTag;

    if (timeRangeText) {
      timeRangeText.textContent = `${this.minutesToTime(startMin)} - ${this.minutesToTime(endMin)}`;
    }
    if (durationText) {
      durationText.textContent = `(${this.formatDuration(startMin, endMin)})`;
    }

    this.renderPopoverTagChips(preselectedTag);

    if (inputTitle) {
      inputTitle.value = preselectedTag ? preselectedTag : '';
      setTimeout(() => {
        inputTitle.focus();
        if (preselectedTag) inputTitle.select();
      }, 50);
    }
    if (checkImportant) checkImportant.checked = false;

    // Position popover
    if (window.innerWidth <= 640) {
      // Mobile: bottom sheet via fixed bottom
      popover.style.top = '';
      popover.style.left = '';
    } else {
      // Desktop: position fixed relative to canvas selection
      const canvas = document.getElementById('timegrid-canvas');
      const rect = canvas ? canvas.getBoundingClientRect() : { top: 100, left: 100 };
      const popTop = Math.max(70, Math.min(window.innerHeight - 300, rect.top + (startMin - 360)));
      popover.style.top = `${popTop}px`;
      popover.style.left = `${Math.min(window.innerWidth - 380, rect.left + 50)}px`;
    }
    popover.style.display = 'block';

    if (backdrop) {
      backdrop.style.display = 'block';
    }
  },

  closeCreatePopover() {
    const popover = document.getElementById('timegrid-create-popover');
    const selBox = document.getElementById('timegrid-selection-box');
    const backdrop = document.getElementById('timegrid-popover-backdrop');
    if (popover) popover.style.display = 'none';
    if (selBox) selBox.style.display = 'none';
    if (backdrop) backdrop.style.display = 'none';
  },

  initTimeGridInteractions() {
    if (this.timegridInitialized) return;
    this.timegridInitialized = true;

    // 1. Popover buttons & Backdrop
    const btnPopoverClose = document.getElementById('btn-popover-close');
    const btnPopoverCancel = document.getElementById('btn-popover-cancel');
    const formPopover = document.getElementById('form-popover-create');
    const backdrop = document.getElementById('timegrid-popover-backdrop');
    const popoverEl = document.getElementById('timegrid-create-popover');

    if (popoverEl) {
      popoverEl.addEventListener('click', (e) => e.stopPropagation());
      popoverEl.addEventListener('mousedown', (e) => e.stopPropagation());
      popoverEl.addEventListener('touchstart', (e) => e.stopPropagation());
      popoverEl.addEventListener('touchend', (e) => e.stopPropagation());
    }

    btnPopoverClose?.addEventListener('click', () => this.closeCreatePopover());
    btnPopoverCancel?.addEventListener('click', () => this.closeCreatePopover());
    backdrop?.addEventListener('click', () => this.closeCreatePopover());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeCreatePopover();
    });

    formPopover?.addEventListener('submit', (e) => {
      e.preventDefault();
      const inputTitle = document.getElementById('popover-task-title');
      const checkImportant = document.getElementById('popover-important-checkbox');
      const title = (inputTitle?.value || '').trim();
      if (!title) {
        if (window.showToast) window.showToast('Vui lòng nhập tên công việc!', 'warning');
        inputTitle?.focus();
        return;
      }

      const tag = this.popoverSelectedTag || 'Admin môn JAVA';
      const tagColor = StorageManager.getTagColor(tag);
      const important = checkImportant ? checkImportant.checked : false;
      const startTime = this.minutesToTime(this.popoverStartMin);
      const endTime = this.minutesToTime(this.popoverEndMin);

      StorageManager.addTask({
        title,
        startTime,
        endTime,
        time: `${startTime} - ${endTime}`,
        tag,
        tagColor,
        important,
        date: this.selectedDate
      });

      this.closeCreatePopover();
      this.render();

      if (window.showToast) window.showToast(`Đã lên lịch (${startTime} - ${endTime}): ${title}`, 'success');
      if (window.playChime) window.playChime(760, 0.16);
    });

    // 3. Canvas Drag-to-Select & Drag-over / Drop
    const canvas = document.getElementById('timegrid-canvas');
    const selBox = document.getElementById('timegrid-selection-box');
    const selLabel = document.getElementById('selection-time-label');
    if (!canvas) return;

    canvas.addEventListener('mousedown', (e) => {
      if (e.target.closest('.timegrid-task-block, .btn-task-block-action, .task-block-checkbox, .task-resize-handle, #timegrid-create-popover')) {
        return;
      }
      this.closeCreatePopover();
      this.isSelecting = true;
      const rect = canvas.getBoundingClientRect();
      this.selectStartY = e.clientY - rect.top;

      let startMin = Math.round((360 + this.selectStartY) / 15) * 15;
      startMin = Math.max(360, Math.min(1410, startMin));
      let endMin = startMin + 30;

      this.popoverStartMin = startMin;
      this.popoverEndMin = endMin;

      if (selBox && selLabel) {
        selBox.style.display = 'flex';
        selBox.style.top = `${startMin - 360}px`;
        selBox.style.height = `${endMin - startMin}px`;
        selLabel.textContent = `${this.minutesToTime(startMin)} - ${this.minutesToTime(endMin)} (${this.formatDuration(startMin, endMin)})`;
      }
    });

    window.addEventListener('mousemove', (e) => {
      const cvs = document.getElementById('timegrid-canvas');
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();

      // Selection drag
      if (this.isSelecting) {
        const curY = Math.max(0, Math.min(1080, e.clientY - rect.top));
        const minY = Math.min(this.selectStartY, curY);
        const maxY = Math.max(this.selectStartY, curY);

        let sMin = Math.round((360 + minY) / 15) * 15;
        let eMin = Math.round((360 + maxY) / 15) * 15;
        if (eMin <= sMin) eMin = sMin + 30;

        sMin = Math.max(360, Math.min(1410, sMin));
        eMin = Math.max(sMin + 15, Math.min(1440, eMin));

        this.popoverStartMin = sMin;
        this.popoverEndMin = eMin;

        if (selBox && selLabel) {
          selBox.style.top = `${sMin - 360}px`;
          selBox.style.height = `${eMin - sMin}px`;
          selLabel.textContent = `${this.minutesToTime(sMin)} - ${this.minutesToTime(eMin)} (${this.formatDuration(sMin, eMin)})`;
        }
      }

      // Resizing task
      if (this.isResizing) {
        const curY = Math.max(0, Math.min(1080, e.clientY - rect.top));
        let eMin = Math.round((360 + curY) / 15) * 15;
        eMin = Math.max(this.resizingStartMin + 15, Math.min(1440, eMin));

        const block = document.getElementById(`timegrid-task-${this.resizingTaskId}`);
        if (block) {
          block.style.height = `${eMin - this.resizingStartMin}px`;
          const badge = block.querySelector('.task-block-time-badge');
          if (badge) {
            badge.textContent = `${this.minutesToTime(this.resizingStartMin)} - ${this.minutesToTime(eMin)}`;
          }
        }
      }

      // Moving task
      if (this.isMoving) {
        const targetY = (e.clientY - rect.top) - this.movingOffsetY;
        let sMin = Math.round((360 + targetY) / 15) * 15;
        sMin = Math.max(360, Math.min(1440 - this.movingDuration, sMin));
        let eMin = sMin + this.movingDuration;

        const block = document.getElementById(`timegrid-task-${this.movingTaskId}`);
        if (block) {
          block.style.top = `${sMin - 360}px`;
          const badge = block.querySelector('.task-block-time-badge');
          if (badge) {
            badge.textContent = `${this.minutesToTime(sMin)} - ${this.minutesToTime(eMin)}`;
          }
        }
      }
    });

    window.addEventListener('mouseup', (e) => {
      const cvs = document.getElementById('timegrid-canvas');
      if (!cvs) return;
      const rect = cvs.getBoundingClientRect();

      // Finalize selection
      if (this.isSelecting) {
        this.isSelecting = false;
        let duration = this.popoverEndMin - this.popoverStartMin;
        if (duration < 15) {
          // Bấm 1 nhấp chuột không kéo -> Tự động đặt khối 1 tiếng (60 phút)
          let startMin = Math.round((360 + this.selectStartY) / 30) * 30;
          startMin = Math.max(360, Math.min(1380, startMin));
          let endMin = startMin + 60;
          this.popoverStartMin = startMin;
          this.popoverEndMin = endMin;
          if (selBox && selLabel) {
            selBox.style.display = 'flex';
            selBox.style.top = `${startMin - 360}px`;
            selBox.style.height = `${endMin - startMin}px`;
            selLabel.textContent = `${this.minutesToTime(startMin)} - ${this.minutesToTime(endMin)} (1 tiếng)`;
          }
        }
        this.openCreatePopover({
          startMin: this.popoverStartMin,
          endMin: this.popoverEndMin,
          topY: this.popoverStartMin - 360
        });
      }

      // Finalize resize
      if (this.isResizing) {
        this.isResizing = false;
        document.body.style.cursor = '';
        const curY = Math.max(0, Math.min(1080, e.clientY - rect.top));
        let eMin = Math.round((360 + curY) / 15) * 15;
        eMin = Math.max(this.resizingStartMin + 15, Math.min(1440, eMin));

        const sTime = this.minutesToTime(this.resizingStartMin);
        const eTime = this.minutesToTime(eMin);

        StorageManager.updateTask(this.resizingTaskId, {
          startTime: sTime,
          endTime: eTime,
          time: `${sTime} - ${eTime}`
        }, this.selectedDate);

        this.render();
        if (window.showToast) window.showToast(`Đã đổi thời lượng: ${sTime} - ${eTime}`, 'success');
      }

      // Finalize move
      if (this.isMoving) {
        this.isMoving = false;
        document.body.style.cursor = '';
        const targetY = (e.clientY - rect.top) - this.movingOffsetY;
        let sMin = Math.round((360 + targetY) / 15) * 15;
        sMin = Math.max(360, Math.min(1440 - this.movingDuration, sMin));
        let eMin = sMin + this.movingDuration;

        const sTime = this.minutesToTime(sMin);
        const eTime = this.minutesToTime(eMin);

        StorageManager.updateTask(this.movingTaskId, {
          startTime: sTime,
          endTime: eTime,
          time: `${sTime} - ${eTime}`
        }, this.selectedDate);

        this.render();
        if (window.showToast) window.showToast(`Đã chuyển giờ: ${sTime} - ${eTime}`, 'success');
      }
    });

    // Touch Tap-to-Create trên Mobile
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    canvas.addEventListener('touchstart', (e) => {
      if (e.target.closest('.timegrid-task-block, .btn-task-block-action, .task-block-checkbox, .task-resize-handle, #timegrid-create-popover')) {
        return;
      }
      const t = e.touches[0];
      touchStartX = t.clientX;
      touchStartY = t.clientY;
      touchStartTime = Date.now();
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
      if (e.target.closest('.timegrid-task-block, .btn-task-block-action, .task-block-checkbox, .task-resize-handle, #timegrid-create-popover')) {
        return;
      }
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - touchStartX);
      const dy = Math.abs(t.clientY - touchStartY);
      const dt = Date.now() - touchStartTime;

      // Nếu chạm nhẹ < 12px và < 350ms (không phải cuộn màn hình)
      if (dx < 12 && dy < 12 && dt < 350) {
        const rect = canvas.getBoundingClientRect();
        const tapY = t.clientY - rect.top;
        let startMin = Math.round((360 + tapY) / 30) * 30;
        startMin = Math.max(360, Math.min(1380, startMin));
        let endMin = startMin + 60;

        this.popoverStartMin = startMin;
        this.popoverEndMin = endMin;

        if (selBox && selLabel) {
          selBox.style.display = 'flex';
          selBox.style.top = `${startMin - 360}px`;
          selBox.style.height = `${endMin - startMin}px`;
          selLabel.textContent = `${this.minutesToTime(startMin)} - ${this.minutesToTime(endMin)} (1 tiếng)`;
        }

        this.openCreatePopover({
          startMin,
          endMin,
          topY: startMin - 360
        });
      }
    }, { passive: true });

    // Tag Tray Drop on Canvas
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      canvas.classList.add('drag-over-active');
    });

    canvas.addEventListener('dragleave', () => {
      canvas.classList.remove('drag-over-active');
    });

    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      canvas.classList.remove('drag-over-active');
      const tagName = e.dataTransfer.getData('text/plain');
      if (!tagName) return;

      const rect = canvas.getBoundingClientRect();
      const dropY = e.clientY - rect.top;
      let startMin = Math.round((360 + dropY) / 15) * 15;
      startMin = Math.max(360, Math.min(1380, startMin));
      let endMin = Math.min(1440, startMin + 60);

      this.popoverStartMin = startMin;
      this.popoverEndMin = endMin;
      this.popoverSelectedTag = tagName;

      if (selBox && selLabel) {
        selBox.style.display = 'flex';
        selBox.style.top = `${startMin - 360}px`;
        selBox.style.height = `${endMin - startMin}px`;
        selLabel.textContent = `${this.minutesToTime(startMin)} - ${this.minutesToTime(endMin)} (${this.formatDuration(startMin, endMin)})`;
      }

      this.openCreatePopover({
        startMin,
        endMin,
        preselectedTag: tagName,
        topY: startMin - 360
      });
    });
  },

  // --------------------------------------------------------------------------
  // VIEW 2: BẢNG 4 TUẦN (HORIZON ROADMAP 4 TUẦN TỚI)
  // --------------------------------------------------------------------------
  renderFourWeeksView() {
    const gridContainer = document.getElementById('four-weeks-grid');
    if (!gridContainer) return;

    const weeks = StorageManager.getFourWeeksData(this.selectedDate);
    const pillsContainer = document.getElementById('four-weeks-mobile-pills');
    const dotsContainer = document.getElementById('four-weeks-dots-indicator');

    // 1. Render Mobile Quick Week Switcher Pills
    if (pillsContainer) {
      pillsContainer.innerHTML = weeks.map((w, idx) => {
        const isActive = idx === this.currentFourWeeksIndex;
        const countBadge = w.totalTasks > 0 ? `${w.completedTasks}/${w.totalTasks}` : '0';
        return `
          <button type="button" class="fw-pill-btn ${isActive ? 'active' : ''}" data-week-idx="${idx}">
            <span class="fw-pill-label">${idx === 0 ? '📍 Tuần Này' : `Tuần +${idx}`}</span>
            <span class="fw-pill-range">${w.rangeStr}</span>
            <span class="fw-pill-badge ${w.totalTasks > 0 ? 'has-tasks' : ''}">${countBadge}</span>
          </button>
        `;
      }).join('');

      pillsContainer.querySelectorAll('.fw-pill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt(btn.getAttribute('data-week-idx'), 10);
          this.scrollToWeek(idx);
        });
      });
    }

    // 2. Render Carousel Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = weeks.map((_, idx) => `
        <span class="fw-dot ${idx === this.currentFourWeeksIndex ? 'active' : ''}" data-index="${idx}" title="Chuyển đến Tuần ${idx === 0 ? 'Này' : '+' + idx}"></span>
      `).join('');

      dotsContainer.querySelectorAll('.fw-dot').forEach(dot => {
        dot.addEventListener('click', () => {
          const idx = parseInt(dot.getAttribute('data-index'), 10);
          this.scrollToWeek(idx);
        });
      });
    }

    // 3. Render 4 Week Cards
    gridContainer.innerHTML = weeks.map((w, wIdx) => {
      let weekTotal = 0;
      let weekCompleted = 0;

      // 7-day mini strip on top of each week card
      const miniStripHtml = `
        <div class="week-mini-strip">
          ${w.days.map(d => {
            const hasTasks = d.tasks && d.tasks.length > 0;
            return `
              <div class="mini-strip-item ${d.isToday ? 'is-today' : ''} ${hasTasks ? 'has-tasks' : ''}" data-date="${d.dateStr}" title="${d.dayName} (${d.dayNumber}/${d.monthNumber})${hasTasks ? ` • ${d.tasks.length} việc` : ''}">
                <span class="mini-strip-day">${d.dayName}</span>
                <span class="mini-strip-num">${d.dayNumber}</span>
                ${hasTasks ? `<span class="mini-strip-indicator" title="${d.tasks.length} việc"></span>` : ''}
              </div>
            `;
          }).join('')}
        </div>
      `;

      const daysHtml = w.days.map(d => {
        const isCurrentSelected = d.dateStr === this.selectedDate;

        let dayTasks = d.tasks;
        if (this.filterTag === '__important__') {
          dayTasks = dayTasks.filter(t => !!t.important);
        } else if (this.filterTag) {
          dayTasks = dayTasks.filter(t => (t.tag || '').trim().toLowerCase() === this.filterTag.trim().toLowerCase());
        }

        weekTotal += dayTasks.length;
        weekCompleted += dayTasks.filter(t => t.completed).length;

        const hasTasks = dayTasks.length > 0;

        const taskPillsHtml = dayTasks.slice(0, 3).map(t => {
          const color = t.tagColor || StorageManager.getTagColor(t.tag);
          return `
            <div class="horizon-mini-task ${t.completed ? 'is-done' : ''} tag-pill-${color}" title="${this.escapeHTML(t.title)}">
              ${t.important ? '⭐ ' : ''}${this.escapeHTML(t.title)}
            </div>
          `;
        }).join('');

        const moreCount = dayTasks.length > 3 ? `<div class="horizon-more-count">+${dayTasks.length - 3} việc nữa</div>` : '';

        return `
          <div class="horizon-day-row ${d.isToday ? 'is-today' : ''} ${isCurrentSelected ? 'is-selected' : ''} ${!hasTasks ? 'is-empty' : ''}" data-date="${d.dateStr}">
            <div class="horizon-day-top">
              <div class="horizon-day-date-group">
                <span class="horizon-day-date">${d.dayName} <span class="horizon-day-subdate">(${d.dayNumber}/${d.monthNumber})</span></span>
                ${d.isToday ? '<span class="horizon-today-badge">Hôm nay</span>' : ''}
              </div>
              <div class="horizon-day-actions">
                ${hasTasks ? `<span class="horizon-count-chip">${dayTasks.length} việc</span>` : '<span class="horizon-empty-hint">Trống</span>'}
                <button type="button" class="btn-mini-add-task" data-date="${d.dateStr}" title="Thêm việc cho ngày này">+</button>
              </div>
            </div>
            ${hasTasks ? `
              <div class="horizon-day-tasks">
                ${taskPillsHtml}
                ${moreCount}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      const percent = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0;

      return `
        <div class="week-horizon-card ${wIdx === this.currentFourWeeksIndex ? 'is-active-week' : ''}" data-week-index="${wIdx}" id="week-card-${wIdx}">
          <div class="week-horizon-header">
            <div>
              <div class="week-horizon-title-row">
                <span class="week-horizon-title">${w.label}</span>
                ${wIdx === 0 ? '<span class="week-current-pill">Hiện tại</span>' : ''}
              </div>
              <div class="week-horizon-range">${w.rangeStr}</div>
            </div>
            <div class="week-horizon-meter">
              <span class="week-horizon-fraction">${weekCompleted}/${weekTotal} việc (${percent}%)</span>
              <div class="week-meter-track">
                <div class="week-meter-fill" style="width: ${percent}%;"></div>
              </div>
            </div>
          </div>

          ${miniStripHtml}

          <div class="week-days-stack">
            ${daysHtml}
          </div>
        </div>
      `;
    }).join('');

    // Bắt sự kiện chọn ngày từ bảng 4 tuần -> Nhảy sang Chi tiết Ngày
    gridContainer.querySelectorAll('.horizon-day-row[data-date], .mini-strip-item[data-date]').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.closest('.btn-mini-add-task')) return;
        const date = el.getAttribute('data-date');
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

    // Kích hoạt bộ điều hướng tuần & theo dõi vuốt Snap Scroll trên mobile
    this.initFourWeeksScrollTracker();
  },

  scrollToWeek(index) {
    if (index < 0 || index > 3) return;
    this.currentFourWeeksIndex = index;
    const gridContainer = document.getElementById('four-weeks-grid');
    const targetCard = document.getElementById(`week-card-${index}`);
    if (gridContainer && targetCard) {
      const scrollLeft = targetCard.offsetLeft - gridContainer.offsetLeft;
      gridContainer.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
    }
    this.updateFourWeeksActiveUI(index);
  },

  updateFourWeeksActiveUI(index) {
    this.currentFourWeeksIndex = index;
    document.querySelectorAll('.fw-pill-btn').forEach((btn, idx) => {
      btn.classList.toggle('active', idx === index);
      if (idx === index) {
        btn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
    });
    document.querySelectorAll('.fw-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === index);
    });
    document.querySelectorAll('.week-horizon-card').forEach((card, idx) => {
      card.classList.toggle('is-active-week', idx === index);
    });
  },

  initFourWeeksScrollTracker() {
    const gridContainer = document.getElementById('four-weeks-grid');
    if (!gridContainer) return;

    // Previous / Next Buttons
    const btnPrev = document.getElementById('btn-four-weeks-prev');
    const btnNext = document.getElementById('btn-four-weeks-next');

    if (btnPrev && !btnPrev._boundFw) {
      btnPrev._boundFw = true;
      btnPrev.addEventListener('click', () => {
        if (this.currentFourWeeksIndex > 0) {
          this.scrollToWeek(this.currentFourWeeksIndex - 1);
        }
      });
    }

    if (btnNext && !btnNext._boundFw) {
      btnNext._boundFw = true;
      btnNext.addEventListener('click', () => {
        if (this.currentFourWeeksIndex < 3) {
          this.scrollToWeek(this.currentFourWeeksIndex + 1);
        }
      });
    }

    // Theo dõi thao tác vuốt trượt ngang
    let scrollTimer = null;
    gridContainer.addEventListener('scroll', () => {
      if (scrollTimer) clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const cards = Array.from(gridContainer.querySelectorAll('.week-horizon-card'));
        if (!cards.length) return;
        const scrollLeft = gridContainer.scrollLeft;
        const containerWidth = gridContainer.offsetWidth;
        const center = scrollLeft + containerWidth / 2;

        let closestIdx = 0;
        let minDiff = Infinity;
        cards.forEach((card, idx) => {
          const cardCenter = card.offsetLeft + card.offsetWidth / 2;
          const diff = Math.abs(center - cardCenter);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = idx;
          }
        });

        if (closestIdx !== this.currentFourWeeksIndex) {
          this.updateFourWeeksActiveUI(closestIdx);
        }
      }, 70);
    }, { passive: true });
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
      titleText.textContent = `Tháng ${month} / ${year}`;
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

      let tasks = StorageManager.getDayTasks(dateStr);
      if (this.filterTag === '__important__') {
        tasks = tasks.filter(t => !!t.important);
      } else if (this.filterTag) {
        tasks = tasks.filter(t => (t.tag || '').trim().toLowerCase() === this.filterTag.trim().toLowerCase());
      }
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
