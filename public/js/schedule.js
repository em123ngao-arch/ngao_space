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
  modalYear: 2026,
  modalMonth: 10,
  analyticsPeriod: 'day', // 'day' | 'week' | 'month'

  init() {
    const today = new Date();
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth() + 1;
    this.modalYear = this.viewYear;
    this.modalMonth = this.viewMonth;
    this.selectedDate = StorageManager.getTodayDateStr();

    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 1. Month Navigation (In Header)
    const btnPrevMonth = document.getElementById('btn-prev-month');
    const btnNextMonth = document.getElementById('btn-next-month');
    const btnTodayPill = document.getElementById('btn-today-pill');
    const btnOpenMonthModal = document.getElementById('btn-open-month-modal');

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

    // Mở modal lịch tháng toàn cảnh
    btnOpenMonthModal?.addEventListener('click', () => {
      this.openMonthModal();
    });

    // Modal Month Navigation & Close
    const modalBackdrop = document.getElementById('modal-month-calendar');
    const btnCloseModal = document.getElementById('btn-close-month-modal');
    const btnModalPrev = document.getElementById('btn-month-modal-prev');
    const btnModalNext = document.getElementById('btn-month-modal-next');
    const btnModalToday = document.getElementById('btn-month-modal-today');

    btnCloseModal?.addEventListener('click', () => {
      this.closeMonthModal();
    });

    modalBackdrop?.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        this.closeMonthModal();
      }
    });

    btnModalPrev?.addEventListener('click', () => {
      this.modalMonth--;
      if (this.modalMonth < 1) {
        this.modalMonth = 12;
        this.modalYear--;
      }
      this.renderMonthModal();
      if (window.playChime) window.playChime(500, 0.08);
    });

    btnModalNext?.addEventListener('click', () => {
      this.modalMonth++;
      if (this.modalMonth > 12) {
        this.modalMonth = 1;
        this.modalYear++;
      }
      this.renderMonthModal();
      if (window.playChime) window.playChime(560, 0.08);
    });

    btnModalToday?.addEventListener('click', () => {
      const now = new Date();
      this.modalYear = now.getFullYear();
      this.modalMonth = now.getMonth() + 1;
      this.renderMonthModal();
      if (window.playChime) window.playChime(620, 0.08);
    });

    // Analytics Switcher Tabs (Ngày / Tuần / Tháng)
    const analyticsTabs = document.querySelectorAll('.btn-analytics-tab');
    analyticsTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const period = tab.getAttribute('data-period');
        if (!period || period === this.analyticsPeriod) return;

        this.analyticsPeriod = period;
        analyticsTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        this.renderAnalytics();
        if (window.playChime) window.playChime(600, 0.08);
      });
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

    // 5. Growth Journal Events (Nhật ký trưởng thành cuối ngày)
    this.bindJournalEvents();

    // 6. Modal Edit Task Events (CRUD - Update Task)
    const modalEditTask = document.getElementById('modal-edit-task');
    const btnCloseEditTaskX = document.getElementById('btn-close-edit-task-x');
    const btnCancelEditTask = document.getElementById('btn-cancel-edit-task');
    const formEditTask = document.getElementById('form-edit-task');

    btnCloseEditTaskX?.addEventListener('click', () => {
      this.closeEditTaskModal();
    });

    btnCancelEditTask?.addEventListener('click', () => {
      this.closeEditTaskModal();
    });

    modalEditTask?.addEventListener('click', (e) => {
      if (e.target === modalEditTask) {
        this.closeEditTaskModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalEditTask?.classList.contains('active')) {
        this.closeEditTaskModal();
      }
    });

    formEditTask?.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskId = document.getElementById('edit-task-id')?.value;
      const title = document.getElementById('edit-task-title')?.value;
      const period = document.getElementById('edit-task-period')?.value;
      const category = document.getElementById('edit-task-category')?.value;
      const time = document.getElementById('edit-task-time')?.value;

      if (!taskId || !title || !title.trim()) {
        if (window.showToast) window.showToast('Vui lòng nhập tên nhiệm vụ!', 'warning');
        return;
      }

      StorageManager.updateTask(taskId, {
        title: title.trim(),
        period,
        category,
        time: time ? time.trim() : ''
      }, this.selectedDate);

      this.closeEditTaskModal();
      this.render();

      if (window.showToast) window.showToast('Đã cập nhật nhiệm vụ thành công!', 'success');
      if (window.playChime) window.playChime(760, 0.16);
    });
  },

  handleIncardAdd(period) {
    const inputTitle = document.getElementById(`incard-title-${period}`);
    const selectStart = document.getElementById(`incard-start-${period}`);
    const selectEnd = document.getElementById(`incard-end-${period}`);
    const selectCat = document.getElementById(`incard-cat-${period}`);

    const title = (inputTitle?.value || '').trim();
    if (!title) {
      if (window.showToast) window.showToast('Vui lòng nhập nội dung công việc!', 'warning');
      inputTitle?.focus();
      return;
    }

    const startTime = selectStart?.value || '';
    const endTime = selectEnd?.value || '';

    if (!startTime || !endTime) {
      if (window.showToast) window.showToast('Vui lòng chọn khung giờ hợp lệ!', 'warning');
      return;
    }

    const time = `${startTime} - ${endTime}`;
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

    if (window.showToast) window.showToast(`Đã thêm việc (${time}): ${title}`, 'success');
    if (window.playChime) window.playChime(760, 0.16);
  },

  // --------------------------------------------------------------------------
  // Dynamic Time Range Picker (Linh hoạt, tự do chọn giờ, không chặn trùng lịch)
  // Khung giờ theo buổi: Morning (06:00-12:00), Afternoon (12:00-18:00), Evening (18:00-24:00)
  // Bước nhảy 5 phút: Cho phép tùy chỉnh mọi độ dài công việc (5p, 15p, 30p, 1h, 2h...)
  // --------------------------------------------------------------------------
  getPeriodTimeBounds(period) {
    switch (period) {
      case 'morning':   return { startM: 6 * 60,  endM: 12 * 60 }; // 06:00 - 12:00
      case 'afternoon': return { startM: 12 * 60, endM: 18 * 60 }; // 12:00 - 18:00
      case 'evening':   return { startM: 18 * 60, endM: 24 * 60 }; // 18:00 - 24:00
      default:          return { startM: 6 * 60,  endM: 24 * 60 };
    }
  },

  minutesToTimeStr(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  },

  timeStrToMinutes(str) {
    if (!str) return null;
    const parts = str.trim().split(':');
    if (parts.length < 2) return null;
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  },

  renderTimePickers() {
    ['morning', 'afternoon', 'evening'].forEach(period => {
      const selectStart = document.getElementById(`incard-start-${period}`);
      const selectEnd = document.getElementById(`incard-end-${period}`);
      if (!selectStart || !selectEnd) return;

      const { startM: periodStart, endM: periodEnd } = this.getPeriodTimeBounds(period);
      const step = 5;

      // 1. Render Start Select
      const curStartVal = selectStart.value;
      selectStart.innerHTML = '';

      for (let m = periodStart; m < periodEnd; m += step) {
        const timeStr = this.minutesToTimeStr(m);
        const opt = document.createElement('option');
        opt.value = timeStr;
        opt.textContent = timeStr;
        selectStart.appendChild(opt);
      }

      // Giữ giá trị đang chọn nếu còn hợp lệ, ngược lại lấy mốc đầu buổi
      if (curStartVal && selectStart.querySelector(`option[value="${curStartVal}"]`)) {
        selectStart.value = curStartVal;
      } else {
        selectStart.value = this.minutesToTimeStr(periodStart);
      }

      // 2. Render End Select tương ứng
      this.updateEndSelect(period, periodEnd, step);

      // Gắn sự kiện change (dùng thuộc tính trực tiếp để luôn cập nhật theo thời gian thực)
      selectStart.onchange = () => {
        this.updateEndSelect(period, periodEnd, step);
      };
    });
  },

  updateEndSelect(period, periodEnd, step = 5) {
    const selectStart = document.getElementById(`incard-start-${period}`);
    const selectEnd = document.getElementById(`incard-end-${period}`);
    if (!selectStart || !selectEnd) return;

    const startMinutes = this.timeStrToMinutes(selectStart.value);
    const curEndVal = selectEnd.value;
    selectEnd.innerHTML = '';

    if (startMinutes === null) return;

    let defaultEndVal = null;

    // Giờ kết thúc chạy từ startMinutes + step đến hết buổi
    for (let m = startMinutes + step; m <= periodEnd; m += step) {
      const timeStr = this.minutesToTimeStr(m);
      const diffMinutes = m - startMinutes;

      let durationLabel = '';
      if (diffMinutes < 60) {
        durationLabel = `+${diffMinutes}p`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        durationLabel = mins > 0 ? `+${hours}h${mins}p` : `+${hours}h`;
      }

      const opt = document.createElement('option');
      opt.value = timeStr;
      opt.textContent = `${timeStr} (${durationLabel})`;
      selectEnd.appendChild(opt);

      // Gợi ý mặc định việc kéo dài 30 phút (hoặc mốc khả dụng đầu tiên)
      if (!defaultEndVal && diffMinutes >= 30) {
        defaultEndVal = timeStr;
      }
    }

    if (!defaultEndVal && selectEnd.options.length > 0) {
      defaultEndVal = selectEnd.options[0].value;
    }

    // Chọn giá trị kết thúc: giữ giá trị cũ nếu vẫn sau startMinutes, ngược lại lấy defaultEndVal
    const curEndMinutes = this.timeStrToMinutes(curEndVal);
    if (curEndMinutes && curEndMinutes > startMinutes && selectEnd.querySelector(`option[value="${curEndVal}"]`)) {
      selectEnd.value = curEndVal;
    } else if (defaultEndVal) {
      selectEnd.value = defaultEndVal;
    }
  },

  render() {
    this.renderCalendarNav();
    this.renderTasks();
    this.renderTimePickers();
    this.renderJournal();
    this.renderAnalytics();
  },

  // --------------------------------------------------------------------------
  // Calendar Navigation: Month Title, Week Strip (7 Ngày) & Status
  // --------------------------------------------------------------------------
  renderCalendarNav() {
    const monthLabel = document.getElementById('current-month-label');
    if (monthLabel) {
      monthLabel.textContent = `Tháng ${this.viewMonth} / ${this.viewYear}`;
    }

    // Cập nhật huy hiệu Tuần thứ bao nhiêu trong năm
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
            <div class="task-info-block" title="Bấm để chỉnh sửa nhiệm vụ" style="cursor: pointer;">
              <span class="task-time-pill">${task.time ? task.time : 'Trong buổi'}${creatorText}</span>
              <p class="task-title">${this.escapeHTML(task.title)}</p>
              <span class="task-category-pill ${cat.class}">${cat.label}</span>
            </div>
          </div>
          <div class="task-actions-group">
            <button class="task-btn-edit" title="Chỉnh sửa nhiệm vụ" data-id="${task.id}">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
              </svg>
            </button>
            <button class="task-btn-delete" title="Xóa công việc" data-id="${task.id}">✕</button>
          </div>
        `;

        // Checkbox event
        card.querySelector('.task-checkbox-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          StorageManager.toggleTask(task.id, this.selectedDate);
          this.render();
          if (window.playChime) window.playChime(task.completed ? 440 : 660, 0.12);
        });

        // Edit button event
        card.querySelector('.task-btn-edit').addEventListener('click', (e) => {
          e.stopPropagation();
          this.openEditTaskModal(task);
        });

        // Click task info block to edit
        card.querySelector('.task-info-block').addEventListener('click', (e) => {
          e.stopPropagation();
          this.openEditTaskModal(task);
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

  // --------------------------------------------------------------------------
  // MONTH CALENDAR MODAL (30 Ngày & Tỷ Lệ Xanh/Đỏ)
  // --------------------------------------------------------------------------
  openMonthModal() {
    this.modalYear = this.viewYear;
    this.modalMonth = this.viewMonth;
    this.renderMonthModal();

    const modal = document.getElementById('modal-month-calendar');
    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    if (window.playChime) window.playChime(620, 0.12);
  },

  closeMonthModal() {
    const modal = document.getElementById('modal-month-calendar');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  // --------------------------------------------------------------------------
  // EDIT TASK MODAL (CRUD - Update Task)
  // --------------------------------------------------------------------------
  openEditTaskModal(task) {
    if (!task) return;
    const modal = document.getElementById('modal-edit-task');
    const inputId = document.getElementById('edit-task-id');
    const inputTitle = document.getElementById('edit-task-title');
    const selectPeriod = document.getElementById('edit-task-period');
    const selectCategory = document.getElementById('edit-task-category');
    const inputTime = document.getElementById('edit-task-time');

    if (inputId) inputId.value = task.id;
    if (inputTitle) inputTitle.value = task.title || '';
    if (selectPeriod) selectPeriod.value = task.period || 'morning';
    if (selectCategory) selectCategory.value = task.category || 'study';
    if (inputTime) inputTime.value = task.time || '';

    if (modal) {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    setTimeout(() => {
      inputTitle?.focus();
    }, 50);
    if (window.playChime) window.playChime(620, 0.1);
  },

  closeEditTaskModal() {
    const modal = document.getElementById('modal-edit-task');
    if (modal) {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }
  },

  renderMonthModal() {
    const titleText = document.getElementById('month-modal-title-text');
    const subtitleText = document.getElementById('month-modal-subtitle-text');
    const gridContainer = document.getElementById('month-grid-cells');

    const year = this.modalYear;
    const month = this.modalMonth;

    if (titleText) {
      titleText.textContent = `Lịch Toàn Cảnh Tháng ${month} / ${year}`;
    }

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const currentWeekOfYear = this.getWeekOfYear(firstDayOfMonth);
    if (subtitleText) {
      subtitleText.textContent = `Bắt đầu từ tuần thứ ${currentWeekOfYear} / 52 trong năm • Bấm ngày để xem & sửa việc`;
    }

    if (!gridContainer) return;

    // Số ngày trong tháng
    const daysInMonth = new Date(year, month, 0).getDate();
    // Ngày 1 trong tháng rơi vào thứ mấy (0: CN, 1: T2, ..., 6: T7)
    const firstDayIndex = firstDayOfMonth.getDay();
    // Monday-based offset (T2 = 0, T3 = 1, ..., CN = 6)
    const mondayOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    // Ngày của tháng trước để lấp đầy ô trống đầu tiên
    const prevMonthDays = new Date(year, month - 1, 0).getDate();

    const cellsHtml = [];
    const todayStr = StorageManager.getTodayDateStr();

    // 1. Ngày của tháng trước
    for (let i = mondayOffset - 1; i >= 0; i--) {
      const dNum = prevMonthDays - i;
      cellsHtml.push(`
        <div class="month-day-cell other-month">
          <div class="cell-top-row">
            <span class="cell-day-num">${dNum}</span>
          </div>
          <div class="cell-ratio-bar-wrap">
            <div class="cell-ratio-track">
              <div class="cell-ratio-fill-empty"></div>
            </div>
            <span class="cell-ratio-label label-empty">-</span>
          </div>
        </div>
      `);
    }

    // 2. Ngày trong tháng hiện tại
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = String(day).padStart(2, '0');
      const monthStr = String(month).padStart(2, '0');
      const fullDateStr = `${year}-${monthStr}-${dayStr}`;

      const tasks = StorageManager.getDayTasks(fullDateStr);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;

      const isToday = fullDateStr === todayStr;
      const isSelected = fullDateStr === this.selectedDate;

      let ratioBarHtml = '';
      let labelHtml = '';

      if (total === 0) {
        ratioBarHtml = `
          <div class="cell-ratio-track">
            <div class="cell-ratio-fill-empty"></div>
          </div>
        `;
        labelHtml = `<span class="cell-ratio-label label-empty">0 việc</span>`;
      } else {
        const percent = Math.round((completed / total) * 100);
        const greenWidth = percent;
        const redWidth = 100 - percent;

        ratioBarHtml = `
          <div class="cell-ratio-track" title="${completed}/${total} hoàn thành (${percent}%)">
            ${greenWidth > 0 ? `<div class="cell-ratio-fill-green" style="width: ${greenWidth}%;"></div>` : ''}
            ${redWidth > 0 ? `<div class="cell-ratio-fill-red" style="width: ${redWidth}%;"></div>` : ''}
          </div>
        `;

        if (percent === 100) {
          labelHtml = `<span class="cell-ratio-label label-perfect">${completed}/${total} (100%)</span>`;
        } else if (percent > 0) {
          labelHtml = `<span class="cell-ratio-label label-progress">${percent}% (${completed}/${total})</span>`;
        } else {
          labelHtml = `<span class="cell-ratio-label label-none">0% (${total} việc)</span>`;
        }
      }

      cellsHtml.push(`
        <div class="month-day-cell ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" 
             data-date="${fullDateStr}">
          <div class="cell-top-row">
            <span class="cell-day-num">${day}</span>
            <span class="cell-task-counter">${total > 0 ? `${total}v` : ''}</span>
          </div>
          <div class="cell-ratio-bar-wrap">
            ${ratioBarHtml}
            ${labelHtml}
          </div>
        </div>
      `);
    }

    // 3. Ngày của tháng sau để đủ số hàng lưới (35 hoặc 42 ô)
    const totalFilled = mondayOffset + daysInMonth;
    const totalGridCells = totalFilled <= 35 ? 35 : 42;
    const remainingDays = totalGridCells - totalFilled;

    for (let day = 1; day <= remainingDays; day++) {
      cellsHtml.push(`
        <div class="month-day-cell other-month">
          <div class="cell-top-row">
            <span class="cell-day-num">${day}</span>
          </div>
          <div class="cell-ratio-bar-wrap">
            <div class="cell-ratio-track">
              <div class="cell-ratio-fill-empty"></div>
            </div>
            <span class="cell-ratio-label label-empty">-</span>
          </div>
        </div>
      `);
    }

    gridContainer.innerHTML = cellsHtml.join('');

    // Bắt sự kiện chọn ngày từ trong Modal
    gridContainer.querySelectorAll('.month-day-cell[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const date = cell.getAttribute('data-date');
        if (date) {
          this.selectedDate = date;
          // Đồng bộ lại viewYear và viewMonth nếu khác
          const parts = date.split('-');
          this.viewYear = parseInt(parts[0], 10);
          this.viewMonth = parseInt(parts[1], 10);

          this.closeMonthModal();
          this.render();

          if (window.showToast) {
            window.showToast(`Đã chuyển sang xem ngày: ${this.formatFullDayTitle(date)}`, 'info');
          }
          if (window.playChime) window.playChime(660, 0.12);
        }
      });
    });
  },

  // --------------------------------------------------------------------------
  // BÁO CÁO TIẾN BỘ & NĂNG SUẤT (NGÀY / TUẦN / THÁNG)
  // --------------------------------------------------------------------------
  renderAnalytics() {
    const captionEl = document.getElementById('analytics-chart-caption');
    const container = document.getElementById('analytics-bars-container');
    const kpiTotalEl = document.getElementById('kpi-total-tasks');
    const kpiCompletedEl = document.getElementById('kpi-completed-tasks');
    const kpiCompletedSubEl = document.getElementById('kpi-completed-tasks-sub');
    const kpiTrendEl = document.getElementById('kpi-trend-status');
    const kpiTrendSubEl = document.getElementById('kpi-trend-sub');

    if (!container) return;

    let barsData = [];

    if (this.analyticsPeriod === 'day') {
      if (captionEl) captionEl.textContent = 'So sánh tỷ lệ hoàn thành qua 7 ngày gần nhất';
      barsData = this.getAnalytics7Days();
    } else if (this.analyticsPeriod === 'week') {
      if (captionEl) captionEl.textContent = 'So sánh năng suất qua 4 tuần gần nhất trong năm';
      barsData = this.getAnalytics4Weeks();
    } else {
      if (captionEl) captionEl.textContent = `So sánh tiến độ học tập qua các tháng trong năm ${this.viewYear}`;
      barsData = this.getAnalyticsMonths(this.viewYear);
    }

    // Tính tổng KPI cho kỳ phân tích
    let totalAll = 0;
    let completedAll = 0;
    barsData.forEach(item => {
      totalAll += item.total;
      completedAll += item.completed;
    });

    const percentAll = totalAll > 0 ? Math.round((completedAll / totalAll) * 100) : 0;

    if (kpiTotalEl) kpiTotalEl.textContent = totalAll;
    if (kpiCompletedEl) kpiCompletedEl.textContent = completedAll;
    if (kpiCompletedSubEl) kpiCompletedSubEl.textContent = `${percentAll}% tỉ lệ hoàn thành`;

    if (kpiTrendEl && kpiTrendSubEl) {
      if (percentAll >= 85) {
        kpiTrendEl.textContent = 'Xuất sắc ⭐';
        kpiTrendEl.className = 'kpi-value text-emerald';
        kpiTrendSubEl.textContent = 'Hiệu suất kỷ luật cao';
      } else if (percentAll >= 50) {
        kpiTrendEl.textContent = 'Tiến bộ ổn định 👍';
        kpiTrendEl.className = 'kpi-value text-blue';
        kpiTrendSubEl.textContent = 'Duy trì nhịp đều đặn';
      } else if (totalAll > 0) {
        kpiTrendEl.textContent = 'Cần cố gắng thêm 💪';
        kpiTrendEl.className = 'kpi-value';
        kpiTrendSubEl.textContent = 'Cùng nhau nhắc nhở';
      } else {
        kpiTrendEl.textContent = 'Chưa có dữ liệu';
        kpiTrendEl.className = 'kpi-value text-muted';
        kpiTrendSubEl.textContent = 'Hãy lên lịch thêm việc';
      }
    }

    // Render Bar Rows
    container.innerHTML = barsData.map(item => {
      const total = item.total;
      const completed = item.completed;
      let barInner = '';
      let metricsText = '';

      if (total === 0) {
        barInner = `<div class="bar-segment-empty"></div>`;
        metricsText = `0 việc`;
      } else {
        const percent = Math.round((completed / total) * 100);
        const greenWidth = percent;
        const redWidth = 100 - percent;

        barInner = `
          ${greenWidth > 0 ? `<div class="bar-segment-green" style="width: ${greenWidth}%;" title="Đã xong ${completed} việc (${percent}%)"></div>` : ''}
          ${redWidth > 0 ? `<div class="bar-segment-red" style="width: ${redWidth}%;" title="Chưa xong ${total - completed} việc (${100 - percent}%)"></div>` : ''}
        `;
        metricsText = `${completed}/${total} (${percent}%)`;
      }

      return `
        <div class="bar-row-item">
          <span class="bar-row-label" title="${item.label}">${item.label}</span>
          <div class="bar-row-track-wrap">
            <div class="bar-row-track">
              ${barInner}
            </div>
          </div>
          <span class="bar-row-metrics">${metricsText}</span>
        </div>
      `;
    }).join('');
  },

  getAnalytics7Days() {
    const list = [];
    const today = new Date();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dateNum}`;

      const tasks = StorageManager.getDayTasks(dateStr);
      const total = tasks.length;
      const completed = tasks.filter(t => t.completed).length;

      const isToday = i === 0;
      const label = isToday ? `Hôm nay (${dateNum}/${m})` : `${dayNames[d.getDay()]} (${dateNum}/${m})`;

      list.push({ label, total, completed, dateStr });
    }
    return list;
  },

  getAnalytics4Weeks() {
    const list = [];
    const today = new Date();
    // Monday of current week
    const dayOfWeek = today.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() + diffToMonday);

    for (let w = 3; w >= 0; w--) {
      const weekMon = new Date(currentMonday);
      weekMon.setDate(currentMonday.getDate() - (w * 7));

      const weekNum = this.getWeekOfYear(weekMon);
      let total = 0;
      let completed = 0;

      for (let d = 0; d < 7; d++) {
        const cur = new Date(weekMon);
        cur.setDate(weekMon.getDate() + d);
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const dt = String(cur.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dt}`;

        const dayTasks = StorageManager.getDayTasks(dateStr);
        total += dayTasks.length;
        completed += dayTasks.filter(t => t.completed).length;
      }

      const label = w === 0 ? `Tuần ${weekNum} (Hiện tại)` : `Tuần ${weekNum}`;
      list.push({ label, total, completed });
    }
    return list;
  },

  getAnalyticsMonths(year) {
    const list = [];
    const state = StorageManager.getState();
    const allDays = (state.schedule && state.schedule.days) || {};

    for (let m = 1; m <= 12; m++) {
      const mStr = String(m).padStart(2, '0');
      const prefix = `${year}-${mStr}-`;
      let total = 0;
      let completed = 0;

      Object.keys(allDays).forEach(dateKey => {
        if (dateKey.startsWith(prefix)) {
          const dayTasks = allDays[dateKey].tasks || [];
          total += dayTasks.length;
          completed += dayTasks.filter(t => t.completed).length;
        }
      });

      list.push({
        label: `Tháng ${m}`,
        total,
        completed
      });
    }
    return list;
  },

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
  },

  // --------------------------------------------------------------------------
  // Growth Journal Controller (Tổng Kết & Nhật Ký Trưởng Thành Cuối Ngày)
  // --------------------------------------------------------------------------
  journalActiveUserTab: 'ngan', // 'ngan' | 'bao'

  bindJournalEvents() {
    // 1. Tab Switcher (Xem của Ngân / Xem của Bảo)
    const tabNgan = document.getElementById('tab-journal-ngan');
    const tabBao = document.getElementById('tab-journal-bao');

    tabNgan?.addEventListener('click', () => {
      this.journalActiveUserTab = 'ngan';
      tabNgan.classList.add('active');
      tabBao?.classList.remove('active');
      this.renderJournal();
      if (window.playChime) window.playChime(540, 0.08);
    });

    tabBao?.addEventListener('click', () => {
      this.journalActiveUserTab = 'bao';
      tabBao.classList.add('active');
      tabNgan?.classList.remove('active');
      this.renderJournal();
      if (window.playChime) window.playChime(580, 0.08);
    });

    // 2. Nút 1-chạm nạp các việc đã làm xong hôm nay vào Top 3 đột phá
    const btnQuickFill = document.getElementById('btn-quick-fill-wins');
    btnQuickFill?.addEventListener('click', () => {
      this.handleQuickFillWins();
    });

    // 3. Form Submit (Lưu nhật ký cuối ngày)
    const form = document.getElementById('journal-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSaveJournal();
    });
  },

  renderJournal() {
    const journalSection = document.getElementById('section-growth-journal');
    if (!journalSection) return;

    const currentUser = StorageManager.getCurrentUser();
    const todayStr = StorageManager.getTodayDateStr();
    const dateTag = document.getElementById('journal-current-date-tag');
    if (dateTag) {
      dateTag.textContent = this.selectedDate === todayStr ? 'Hôm nay' : this.formatDisplayDate(this.selectedDate);
    }

    // Mặc định ban đầu chọn tab theo user đang đăng nhập nếu chưa chỉnh
    if (!this._userTabInitialized) {
      this._userTabInitialized = true;
      this.journalActiveUserTab = currentUser.id === 'bao' ? 'bao' : 'ngan';
    }

    // Cập nhật trạng thái active của tab
    const tabNgan = document.getElementById('tab-journal-ngan');
    const tabBao = document.getElementById('tab-journal-bao');
    if (this.journalActiveUserTab === 'ngan') {
      tabNgan?.classList.add('active');
      tabBao?.classList.remove('active');
    } else {
      tabBao?.classList.add('active');
      tabNgan?.classList.remove('active');
    }

    const dayJournal = StorageManager.getDayJournal(this.selectedDate);
    const formView = document.getElementById('journal-form');
    const partnerView = document.getElementById('journal-partner-view');

    // Nếu tab đang chọn trùng với user đang đăng nhập: Hiện FORM cho phép sửa / lưu
    if (this.journalActiveUserTab === currentUser.id) {
      if (formView) formView.style.display = 'flex';
      if (partnerView) partnerView.style.display = 'none';
      this.populateJournalForm(dayJournal[currentUser.id]);
    } else {
      // Nếu tab đang chọn là của đối phương: Hiện READ-ONLY VIEW kèm nút Thả Tim Động Viên
      if (formView) formView.style.display = 'none';
      if (partnerView) partnerView.style.display = 'flex';
      this.renderPartnerJournalView(this.journalActiveUserTab, dayJournal[this.journalActiveUserTab], currentUser);
    }
  },

  populateJournalForm(userData) {
    const win1 = document.getElementById('journal-win-1');
    const win2 = document.getElementById('journal-win-2');
    const win3 = document.getElementById('journal-win-3');
    const lesson = document.getElementById('journal-lesson');
    const career = document.getElementById('journal-career');
    const statusText = document.getElementById('journal-status-text');
    const indicatorDot = document.getElementById('journal-indicator-dot');

    if (userData) {
      const wins = userData.topWins || [];
      if (win1) win1.value = wins[0] || '';
      if (win2) win2.value = wins[1] || '';
      if (win3) win3.value = wins[2] || '';
      if (lesson) lesson.value = userData.lessonLearned || '';
      if (career) career.value = userData.careerValue || '';

      const updatedTime = new Date(userData.updatedAt || Date.now());
      const timeStr = `${String(updatedTime.getHours()).padStart(2, '0')}:${String(updatedTime.getMinutes()).padStart(2, '0')}`;
      if (statusText) statusText.textContent = `Đã lưu lúc ${timeStr}`;
      if (indicatorDot) indicatorDot.className = 'status-indicator-dot saved';
    } else {
      if (win1) win1.value = '';
      if (win2) win2.value = '';
      if (win3) win3.value = '';
      if (lesson) lesson.value = '';
      if (career) career.value = '';
      if (statusText) statusText.textContent = 'Chưa lưu nhật ký hôm nay';
      if (indicatorDot) indicatorDot.className = 'status-indicator-dot';
    }
  },

  handleQuickFillWins() {
    const tasks = StorageManager.getDayTasks(this.selectedDate);
    const completedTasks = tasks.filter(t => t.completed);

    if (completedTasks.length === 0) {
      if (window.showToast) {
        window.showToast('Chưa có việc nào được đánh dấu hoàn thành để gợi ý!', 'info');
      }
      return;
    }

    const win1 = document.getElementById('journal-win-1');
    const win2 = document.getElementById('journal-win-2');
    const win3 = document.getElementById('journal-win-3');

    // Nạp tối đa 3 việc hoàn thành đầu tiên
    if (win1 && completedTasks[0]) win1.value = completedTasks[0].title;
    if (win2 && completedTasks[1]) win2.value = completedTasks[1].title;
    if (win3 && completedTasks[2]) win3.value = completedTasks[2].title;

    if (window.showToast) {
      window.showToast(`Đã tự động nạp ${Math.min(completedTasks.length, 3)} việc hoàn thành vào Top 3 đột phá!`, 'success');
    }
    if (window.playChime) window.playChime(750, 0.12);
  },

  handleSaveJournal() {
    const currentUser = StorageManager.getCurrentUser();
    const win1 = (document.getElementById('journal-win-1')?.value || '').trim();
    const win2 = (document.getElementById('journal-win-2')?.value || '').trim();
    const win3 = (document.getElementById('journal-win-3')?.value || '').trim();
    const lesson = (document.getElementById('journal-lesson')?.value || '').trim();
    const career = (document.getElementById('journal-career')?.value || '').trim();

    const topWins = [win1, win2, win3].filter(w => Boolean(w));

    if (topWins.length === 0 && !lesson && !career) {
      if (window.showToast) window.showToast('Vui lòng ghi ít nhất 1 việc đột phá hoặc 1 bài học rút ra!', 'warning');
      return;
    }

    const journalPayload = {
      topWins,
      lessonLearned: lesson,
      careerValue: career
    };

    StorageManager.saveDayJournal(this.selectedDate, currentUser.id, journalPayload);
    this.renderJournal();

    // Visual button feedback
    const btn = document.getElementById('btn-save-journal');
    const label = document.getElementById('btn-journal-label');
    const iconWrap = document.getElementById('btn-journal-icon-wrap');
    if (btn) {
      btn.classList.add('is-saved');
      if (label) label.textContent = 'Đã Khắc Ghi Thành Công!';
      if (iconWrap) {
        iconWrap.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
      }
      setTimeout(() => {
        btn.classList.remove('is-saved');
        if (label) label.textContent = 'Lưu Dấu Trưởng Thành';
        if (iconWrap) {
          iconWrap.innerHTML = `<svg class="journal-icon-quill" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path><line x1="16" y1="8" x2="2" y2="22"></line><line x1="17.5" y1="15" x2="9" y2="15"></line></svg>`;
        }
      }, 2200);
    }

    if (window.showToast) {
      window.showToast('Đã lưu nhật ký trưởng thành cuối ngày thành công!', 'success');
    }
    if (window.playChime) window.playChime(880, 0.22);
  },

  renderPartnerJournalView(partnerId, partnerData, currentUser) {
    const container = document.getElementById('journal-partner-view');
    if (!container) return;

    const partnerName = partnerId === 'ngan' ? 'Ngân 🌸' : 'Bảo 🌊';

    if (!partnerData || ((!partnerData.topWins || partnerData.topWins.length === 0) && !partnerData.lessonLearned && !partnerData.careerValue)) {
      container.innerHTML = `
        <div class="partner-empty-journal">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
          </svg>
          <p><strong>${partnerName}</strong> chưa viết nhật ký tổng kết cho ngày ${this.formatDisplayDate(this.selectedDate)}.</p>
          <span style="font-size: 11px; opacity: 0.8;">Hãy nhắc nhở hoặc chờ đối phương cập nhật nhé!</span>
        </div>
      `;
      return;
    }

    const winsHtml = (partnerData.topWins && partnerData.topWins.length > 0)
      ? partnerData.topWins.map((w, idx) => `
          <div class="partner-win-item">
            <span class="win-badge">0${idx + 1}</span>
            <span>${this.escapeHTML(w)}</span>
          </div>
        `).join('')
      : '<p style="font-size: 11.5px; color: var(--text-muted); font-style: italic;">Chưa ghi điểm đột phá.</p>';

    const lessonHtml = partnerData.lessonLearned
      ? this.escapeHTML(partnerData.lessonLearned)
      : '<span style="color: var(--text-muted); font-style: italic;">Chưa ghi bài học.</span>';

    const careerHtml = partnerData.careerValue
      ? this.escapeHTML(partnerData.careerValue)
      : '<span style="color: var(--text-muted); font-style: italic;">Chưa ghi giá trị sự nghiệp.</span>';

    const hasReacted = Boolean(partnerData.reactions && partnerData.reactions[currentUser.id]);
    const reactCount = Object.keys(partnerData.reactions || {}).length;

    container.innerHTML = `
      <div class="journal-partner-card">
        <div class="partner-card-header">
          <div class="partner-name-badge">
            <span>Nhật Ký Của ${partnerName}</span>
          </div>
          <span style="font-size: 11px; color: var(--text-muted);">
            ${partnerData.updatedAt ? 'Cập nhật ' + new Date(partnerData.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
          </span>
        </div>

        <div class="partner-wins-section">
          <label class="journal-field-label" style="margin-bottom: 6px;">
            <span class="field-num">1</span>
            <strong>3 Việc Đột Phá Đã Đạt Được:</strong>
          </label>
          <div class="partner-wins-list">
            ${winsHtml}
          </div>
        </div>

        <div class="journal-two-cols">
          <div class="partner-note-box">
            <span class="partner-note-label">💡 Bài Học / Chiêm Nghiệm:</span>
            <p class="partner-note-content">${lessonHtml}</p>
          </div>
          <div class="partner-note-box">
            <span class="partner-note-label">🚀 Giá Trị Cho Sự Nghiệp & Ước Mơ:</span>
            <p class="partner-note-content">${careerHtml}</p>
          </div>
        </div>

        <div class="partner-react-bar">
          <div style="font-size: 11.5px; color: var(--text-muted);">
            ${reactCount > 0 ? `Đã nhận được ${reactCount} lượt động viên ❤️` : 'Hãy tiếp thêm động lực cho đối phương nhé!'}
          </div>
          <button type="button" class="btn-react-heart ${hasReacted ? 'reacted' : ''}" id="btn-react-journal" data-target="${partnerId}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="${hasReacted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            <span>${hasReacted ? 'Đã Thả Tim Động Viên' : 'Thả Tim Động Viên'}</span>
          </button>
        </div>
      </div>
    `;

    // Gắn sự kiện Thả tim
    const reactBtn = container.querySelector('#btn-react-journal');
    reactBtn?.addEventListener('click', () => {
      this.toggleJournalReaction(partnerId);
    });
  },

  toggleJournalReaction(targetUserId) {
    const currentUser = StorageManager.getCurrentUser();
    StorageManager.toggleJournalReaction(this.selectedDate, targetUserId, currentUser.id);
    this.renderJournal();

    if (window.showToast) {
      window.showToast(`Đã gửi tương tác động viên đến nhật ký của đối phương!`, 'success');
    }
    if (window.playChime) window.playChime(950, 0.18);
  }
};

