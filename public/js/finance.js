/**
 * NGAOS — ADVANCED PERSONAL FINANCE MODULE (V3)
 * Full CRUD for Big Savings Goals, Clean SVG Icons (Zero AI Emojis),
 * Weekly/Daily Hierarchy, and Visual Comparison Engine
 */

const FINANCE_CATEGORIES = {
  food:   { label: 'Ăn Uống & Cafe',    iconKey: 'food' },
  study:  { label: 'Học Tập & Sách',    iconKey: 'study' },
  shop:   { label: 'Mua Sắm & Vật Dụng', iconKey: 'shop' },
  travel: { label: 'Di Chuyển & Xăng',   iconKey: 'travel' },
  health: { label: 'Sức Khỏe & Thuốc',   iconKey: 'health' },
  other:  { label: 'Khoản Khác',        iconKey: 'other' }
};

function formatVND(num) {
  return (Number(num) || 0).toLocaleString('vi-VN') + ' đ';
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function getWeekInfo() {
  const now = new Date();
  const weekNo = getWeekNumber(now);
  const totalWeeks = 52;
  const remainingWeeks = Math.max(1, totalWeeks - weekNo);
  return {
    week: weekNo,
    totalWeeks,
    remainingWeeks,
    year: now.getFullYear()
  };
}

function formatLocalDateStr(d) {
  if (!d) return '';
  const dateObj = (typeof d === 'string') ? new Date(d) : d;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getCurrentWeekDates() {
  const now = new Date();
  const currentDay = now.getDay();
  const distanceToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const monday = new Date(now);
  monday.setDate(now.getDate() + distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const days = [];
  const dayNames = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];
  const shortNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const dateStr = formatLocalDateStr(d);
    const isToday = d.toDateString() === now.toDateString();

    days.push({
      index: i,
      name: dayNames[i],
      shortName: shortNames[i],
      date: d,
      dateStr: dateStr,
      isToday: isToday
    });
  }

  return days;
}

function formatReadableDate(isoString) {
  try {
    const d = new Date(isoString);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();

    const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });

    if (isToday) return `Hôm nay lúc ${timeStr}`;
    if (isYesterday) return `Hôm qua lúc ${timeStr}`;

    const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    return `${dateStr} lúc ${timeStr}`;
  } catch (e) {
    return 'Gần đây';
  }
}

window.FinanceModule = {
  selectedDayFilter: null,

  init() {
    this.bindEvents();
    this.setDefaultDateInput();
    this.render();
  },

  setDefaultDateInput() {
    const transDateInput = document.getElementById('trans-date');
    if (transDateInput) {
      transDateInput.value = formatLocalDateStr(new Date());
    }
  },

  bindEvents() {
    // 1. Save Weekly Budget
    const btnSaveBudget = document.getElementById('btn-save-weekly-budget');
    const inputBudget = document.getElementById('input-weekly-budget');

    const handleSaveBudget = () => {
      const val = Number(inputBudget?.value);
      if (isNaN(val) || val <= 0) {
        if (window.showToast) window.showToast('Vui lòng nhập hạn mức tuần hợp lệ (> 0 đ)!', 'warning');
        return;
      }
      StorageManager.setWeeklyBudget(val);
      this.render();
      if (window.showToast) window.showToast(`Đã lưu hạn mức tuần mới: ${formatVND(val)}`, 'success');
      if (window.playChime) window.playChime(640, 0.15);
    };

    if (btnSaveBudget) btnSaveBudget.addEventListener('click', handleSaveBudget);
    if (inputBudget) {
      inputBudget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveBudget();
      });
    }

    // 2. CREATE NEW BIG SAVINGS GOAL (C trong CRUD)
    const btnAddNewGoal = document.getElementById('btn-add-new-goal');
    if (btnAddNewGoal) {
      btnAddNewGoal.addEventListener('click', () => {
        const title = prompt('Nhập tên mục tiêu lớn mới (ví dụ: Quỹ Học Phí, Quỹ Mua Xe Máy...):');
        if (!title || !title.trim()) return;

        const targetStr = prompt(`Nhập số tiền mục tiêu cần tích lũy cho "${title.trim()}" (VNĐ):`, '20000000');
        if (targetStr === null) return;
        const targetAmount = Number(targetStr);
        if (isNaN(targetAmount) || targetAmount <= 0) {
          if (window.showToast) window.showToast('Số tiền mục tiêu không hợp lệ!', 'warning');
          return;
        }

        StorageManager.addGoal({
          title: title.trim(),
          targetAmount: targetAmount,
          deadline: '2026-12-31'
        });

        this.render();
        if (window.showToast) window.showToast(`Đã tạo mục tiêu lớn: ${title.trim()} (${formatVND(targetAmount)})`, 'success');
        if (window.playChime) window.playChime(760, 0.2);
      });
    }

    // 3. Add Transaction Form with Date Selection
    const btnAddTrans = document.getElementById('btn-add-trans');
    const inputDesc = document.getElementById('trans-desc');
    const inputAmount = document.getElementById('trans-amount');
    const selectCat = document.getElementById('trans-cat');
    const inputDate = document.getElementById('trans-date');

    const handleAddTrans = () => {
      const desc = (inputDesc?.value || '').trim();
      const amountVal = Number(inputAmount?.value);

      if (!desc) {
        if (window.showToast) window.showToast('Vui lòng nhập nội dung chi tiêu!', 'warning');
        if (inputDesc) inputDesc.focus();
        return;
      }

      if (isNaN(amountVal) || amountVal <= 0) {
        if (window.showToast) window.showToast('Vui lòng nhập số tiền hợp lệ (> 0 đ)!', 'warning');
        if (inputAmount) inputAmount.focus();
        return;
      }

      const radioType = document.querySelector('input[name="trans-type"]:checked');
      const type = radioType ? radioType.value : 'expense';
      const category = selectCat?.value || 'food';

      let selectedIso = new Date().toISOString();
      if (inputDate && inputDate.value) {
        const parts = inputDate.value.split('-');
        if (parts.length === 3) {
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          const now = new Date();
          const localDate = new Date(year, month, day, now.getHours(), now.getMinutes(), now.getSeconds());
          selectedIso = localDate.toISOString();
        }
      }

      StorageManager.addTransaction({
        type,
        desc,
        amount: amountVal,
        category,
        date: selectedIso
      });

      if (inputDesc) inputDesc.value = '';
      if (inputAmount) inputAmount.value = '';

      this.render();

      const typeLabel = type === 'expense' ? 'khoản chi' : 'khoản thu';
      if (window.showToast) {
        window.showToast(`Đã lưu ${typeLabel}: ${formatVND(amountVal)}`, 'success');
      }
      if (window.playChime) window.playChime(type === 'expense' ? 520 : 780, 0.15);
    };

    if (btnAddTrans) btnAddTrans.addEventListener('click', handleAddTrans);
    if (inputAmount) {
      inputAmount.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleAddTrans();
      });
    }

    // 4. Clear Transactions
    const btnClearTrans = document.getElementById('btn-clear-week-trans');
    if (btnClearTrans) {
      btnClearTrans.addEventListener('click', () => {
        const state = StorageManager.getState();
        if ((state.finance.transactions || []).length === 0) {
          if (window.showToast) window.showToast('Lịch sử chi tiêu đang trống.', 'info');
          return;
        }

        if (confirm('Bạn có chắc muốn xóa sạch toàn bộ lịch sử chi tiêu không?')) {
          StorageManager.clearTransactions();
          this.selectedDayFilter = null;
          this.render();
          if (window.showToast) window.showToast('Đã xóa sạch lịch sử chi tiêu.', 'info');
        }
      });
    }

    // 5. Button Show All Days (Reset day filter)
    const btnShowAllDays = document.getElementById('btn-show-all-days');
    if (btnShowAllDays) {
      btnShowAllDays.addEventListener('click', () => {
        this.selectedDayFilter = null;
        this.render();
      });
    }
  },

  render() {
    const state = StorageManager.getState();
    const { finance } = state;
    const weekInfo = getWeekInfo();
    const weekDays = getCurrentWeekDates();
    const transactions = finance.transactions || [];

    // ========================================================================
    // 1. RENDER BIG SAVINGS GOALS (FULL CRUD LIST)
    // ========================================================================
    const goalsListContainer = document.getElementById('big-goals-list');
    const goals = StorageManager.getGoals();

    if (goalsListContainer) {
      goalsListContainer.innerHTML = '';

      if (goals.length === 0) {
        goalsListContainer.innerHTML = `
          <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
            Chưa có mục tiêu lớn nào. Bấm nút "+ Thêm Mục Tiêu Lớn" phía trên để bắt đầu kế hoạch tích lũy!
          </div>
        `;
      } else {
        goals.forEach(goal => {
          const target = goal.targetAmount || 1000000;
          const current = goal.currentAmount || 0;
          const missing = Math.max(0, target - current);
          const percent = Math.min(100, Math.round((current / target) * 100));

          const neededWeekly = Math.round(missing / weekInfo.remainingWeeks);
          const neededDaily = Math.round(neededWeekly / 7);

          const creatorUser = StorageManager.USERS.find(u => u.id === goal.creator) || StorageManager.USERS[1];

          const card = document.createElement('div');
          card.className = 'goal-item-card';
          card.innerHTML = `
            <div class="goal-item-top">
              <div class="goal-title-wrap">
                <span class="goal-badge-icon">${window.AppIcons ? window.AppIcons.target : '•'}</span>
                <div>
                  <h4 class="goal-item-title">${goal.title}</h4>
                  <span class="goal-creator-pill">Tạo bởi: ${creatorUser.name}</span>
                </div>
              </div>

              <!-- Action buttons: Edit & Delete (U & D trong CRUD) -->
              <div class="goal-item-actions">
                <button class="btn-tool-sm btn-edit-goal" data-id="${goal.id}" title="Sửa mục tiêu">
                  ${window.AppIcons ? window.AppIcons.edit : 'Sửa'}
                  <span>Sửa</span>
                </button>
                <button class="btn-tool-sm btn-delete-goal text-danger" data-id="${goal.id}" title="Xóa mục tiêu">
                  ${window.AppIcons ? window.AppIcons.trash : 'Xóa'}
                  <span>Xóa</span>
                </button>
              </div>
            </div>

            <div class="big-goal-hero-grid">
              <div class="big-goal-main-stat">
                <span class="stat-meta">ĐÃ TÍCH LŨY</span>
                <div class="stat-number-large stat-emerald">${formatVND(current)}</div>
                <div class="goal-sub-stats">
                  <span>Mục tiêu: <strong>${formatVND(target)}</strong></span>
                  <span>Còn thiếu: <strong style="color: var(--coral-rose);">${formatVND(missing)}</strong></span>
                </div>
              </div>

              <div class="big-goal-pace-stat">
                <div class="goal-percent-badge">${percent}%</div>
                <div class="goal-needed-pills">
                  <span class="needed-pill">Cần ~${formatVND(neededWeekly)} / tuần</span>
                  <span class="needed-pill">~${formatVND(neededDaily)} / ngày</span>
                </div>
              </div>
            </div>

            <!-- Progress bar with milestones -->
            <div class="goal-meter-section">
              <div class="progress-bar-track progress-bar-large">
                <div class="progress-bar-fill fill-emerald" style="width: ${percent}%;"></div>
              </div>
              <div class="goal-milestones">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100% Đạt</span>
              </div>
            </div>

            <!-- Deposit Row (U trong CRUD) -->
            <div class="goal-actions-bar">
              <div class="deposit-buttons-group">
                <span class="deposit-label">Nạp nhanh:</span>
                <button class="btn-deposit" data-id="${goal.id}" data-amount="100000">+ 100k</button>
                <button class="btn-deposit" data-id="${goal.id}" data-amount="200000">+ 200k</button>
                <button class="btn-deposit" data-id="${goal.id}" data-amount="500000">+ 500k</button>
                <button class="btn-deposit" data-id="${goal.id}" data-amount="1000000">+ 1 Triệu</button>
              </div>

              <div class="goal-custom-inputs">
                <input type="number" class="form-input form-input-sm input-goal-custom" placeholder="Số tiền..." style="max-width: 120px;">
                <button class="btn-secondary btn-sm btn-goal-custom-deposit" data-id="${goal.id}">+ Nạp</button>
                <button class="btn-secondary btn-sm btn-goal-withdraw" data-id="${goal.id}" title="Rút bớt tiền quỹ">- Rút</button>
              </div>
            </div>
          `;

          // Bind deposit buttons
          card.querySelectorAll('.btn-deposit').forEach(btn => {
            btn.addEventListener('click', () => {
              const gid = btn.getAttribute('data-id');
              const amt = Number(btn.getAttribute('data-amount') || 0);
              StorageManager.depositToGoal(gid, amt);
              this.render();
              if (window.showToast) window.showToast(`Đã nạp +${formatVND(amt)} vào "${goal.title}"`, 'success');
              if (window.playChime) window.playChime(760, 0.2);
            });
          });

          // Custom deposit
          const customBtn = card.querySelector('.btn-goal-custom-deposit');
          const customInput = card.querySelector('.input-goal-custom');
          customBtn?.addEventListener('click', () => {
            const amt = Number(customInput?.value);
            if (isNaN(amt) || amt <= 0) {
              if (window.showToast) window.showToast('Vui lòng nhập số tiền hợp lệ (> 0 đ)!', 'warning');
              return;
            }
            StorageManager.depositToGoal(goal.id, amt);
            this.render();
            if (window.showToast) window.showToast(`Đã nạp +${formatVND(amt)} vào "${goal.title}"`, 'success');
            if (window.playChime) window.playChime(780, 0.2);
          });

          // Withdraw
          const withdrawBtn = card.querySelector('.btn-goal-withdraw');
          withdrawBtn?.addEventListener('click', () => {
            const amtStr = prompt(`Nhập số tiền muốn rút từ "${goal.title}" (VNĐ):`, '100000');
            if (amtStr === null) return;
            const amt = Number(amtStr);
            if (isNaN(amt) || amt <= 0) return;
            StorageManager.withdrawFromGoal(goal.id, amt);
            this.render();
            if (window.showToast) window.showToast(`Đã rút -${formatVND(amt)} từ "${goal.title}"`, 'info');
          });

          // Edit Goal (U)
          const editBtn = card.querySelector('.btn-edit-goal');
          editBtn?.addEventListener('click', () => {
            const newTitle = prompt('Nhập tên mới cho mục tiêu:', goal.title);
            if (!newTitle || !newTitle.trim()) return;

            const newTargetStr = prompt('Nhập số tiền mục tiêu mới (VNĐ):', goal.targetAmount);
            if (newTargetStr === null) return;
            const newTarget = Number(newTargetStr);
            if (isNaN(newTarget) || newTarget <= 0) return;

            StorageManager.updateGoal(goal.id, {
              title: newTitle.trim(),
              targetAmount: newTarget
            });
            this.render();
            if (window.showToast) window.showToast(`Đã cập nhật mục tiêu "${newTitle.trim()}"`, 'success');
          });

          // Delete Goal (D)
          const deleteBtn = card.querySelector('.btn-delete-goal');
          deleteBtn?.addEventListener('click', () => {
            if (confirm(`Bạn có chắc chắn muốn xóa mục tiêu "${goal.title}" không?`)) {
              StorageManager.deleteGoal(goal.id);
              this.render();
              if (window.showToast) window.showToast(`Đã xóa mục tiêu "${goal.title}"`, 'info');
            }
          });

          goalsListContainer.appendChild(card);
        });
      }
    }

    // ========================================================================
    // 2. RENDER WEEKLY OVERVIEW & METRICS
    // ========================================================================
    const budget = finance.weeklyBudget || 1500000;
    const elemWeekBadge = document.getElementById('finance-week-badge');
    if (elemWeekBadge) {
      elemWeekBadge.textContent = `Tuần ${weekInfo.week} / ${weekInfo.totalWeeks} Tuần (${weekInfo.year})`;
    }

    const elemBudgetVal = document.getElementById('weekly-budget-text');
    if (elemBudgetVal) elemBudgetVal.textContent = formatVND(budget);

    const mondayDate = weekDays[0].date;
    const sundayDate = new Date(weekDays[6].date);
    sundayDate.setHours(23, 59, 59, 999);

    let weekSpent = 0;
    let weekIncome = 0;

    transactions.forEach(t => {
      const tDate = new Date(t.date);
      if (tDate >= mondayDate && tDate <= sundayDate) {
        if (t.type === 'expense') weekSpent += t.amount;
        else if (t.type === 'income') weekIncome += t.amount;
      }
    });

    const weekRemaining = Math.max(0, budget - weekSpent);
    const spentPercent = budget > 0 ? Math.min(100, Math.round((weekSpent / budget) * 100)) : 0;

    const elemWeekSpent = document.getElementById('weekly-spent-text');
    if (elemWeekSpent) elemWeekSpent.textContent = formatVND(weekSpent);

    const elemSpentPercent = document.getElementById('weekly-spent-percent');
    if (elemSpentPercent) elemSpentPercent.textContent = `${spentPercent}% hạn mức đã dùng`;

    const elemWeekRemaining = document.getElementById('weekly-remaining-amount');
    if (elemWeekRemaining) elemWeekRemaining.textContent = formatVND(weekRemaining);

    const safeDailyRate = Math.round(budget / 7);
    const elemBurnRate = document.getElementById('weekly-burn-rate-note');
    if (elemBurnRate) {
      elemBurnRate.textContent = `Định mức an toàn: ~${formatVND(safeDailyRate)} / ngày`;
    }

    const elemWeekMeter = document.getElementById('weekly-meter-bar');
    if (elemWeekMeter) {
      elemWeekMeter.style.width = `${spentPercent}%`;
      elemWeekMeter.className = 'progress-bar-fill ' + (spentPercent > 90 ? 'fill-rose' : spentPercent > 70 ? 'fill-amber' : 'fill-blue');
    }

    // Status Pill
    const statusPill = document.getElementById('weekly-status-pill');
    if (statusPill) {
      if (weekSpent > budget) {
        statusPill.textContent = 'Bội chi';
        statusPill.style.background = 'var(--coral-rose-soft)';
        statusPill.style.color = 'var(--coral-rose)';
      } else if (spentPercent >= 80) {
        statusPill.textContent = 'Cảnh báo';
        statusPill.style.background = 'var(--sun-amber-soft)';
        statusPill.style.color = 'var(--sun-amber)';
      } else {
        statusPill.textContent = 'An toàn';
        statusPill.style.background = 'var(--sea-emerald-soft)';
        statusPill.style.color = 'var(--sea-emerald)';
      }
    }

    // ========================================================================
    // 3. RENDER DAY-BY-DAY COMPARISON (7 DAYS VISUAL BAR CHART)
    // ========================================================================
    const daysContainer = document.getElementById('days-comparison-bars');
    if (daysContainer) {
      daysContainer.innerHTML = '';

      let maxDaySpend = safeDailyRate * 1.5;
      const dailySpends = weekDays.map(dayInfo => {
        let dayTotal = 0;
        transactions.forEach(t => {
          const tDate = new Date(t.date);
          const tDateStr = formatLocalDateStr(tDate);
          if (tDateStr === dayInfo.dateStr && t.type === 'expense') {
            dayTotal += t.amount;
          }
        });
        if (dayTotal > maxDaySpend) maxDaySpend = dayTotal;
        return { ...dayInfo, total: dayTotal };
      });

      dailySpends.forEach(d => {
        const heightPercent = maxDaySpend > 0 ? Math.max(8, Math.min(100, Math.round((d.total / maxDaySpend) * 100))) : 8;
        const isSelected = this.selectedDayFilter === d.dateStr;
        const isOverBudget = d.total > safeDailyRate;

        const col = document.createElement('div');
        col.className = `day-column-card ${d.isToday ? 'today-col' : ''} ${isSelected ? 'selected-col' : ''}`;
        col.title = `Bấm để xem giao dịch ${d.name}`;

        let barColorClass = 'bar-safe';
        if (d.total === 0) barColorClass = 'bar-zero';
        else if (isOverBudget) barColorClass = 'bar-danger';
        else if (d.total > safeDailyRate * 0.75) barColorClass = 'bar-warning';

        col.innerHTML = `
          <div class="day-col-header">
            <span class="day-name">${d.shortName}</span>
            <span class="day-date-mini">${d.date.getDate()}/${d.date.getMonth() + 1}</span>
            ${d.isToday ? '<span class="today-tag">Nay</span>' : ''}
          </div>
          <div class="day-bar-track">
            <div class="day-bar-fill ${barColorClass}" style="height: ${heightPercent}%;"></div>
          </div>
          <div class="day-spend-label">${d.total > 0 ? formatVND(d.total) : '0 đ'}</div>
        `;

        col.addEventListener('click', () => {
          if (this.selectedDayFilter === d.dateStr) {
            this.selectedDayFilter = null;
          } else {
            this.selectedDayFilter = d.dateStr;
          }
          this.render();
        });

        daysContainer.appendChild(col);
      });
    }

    const filterLabel = document.getElementById('current-day-filter-label');
    const btnShowAll = document.getElementById('btn-show-all-days');
    if (filterLabel) {
      if (this.selectedDayFilter) {
        const found = weekDays.find(d => d.dateStr === this.selectedDayFilter);
        filterLabel.textContent = `Đang lọc: ${found ? found.name : this.selectedDayFilter}`;
        if (btnShowAll) btnShowAll.style.display = 'inline-block';
      } else {
        filterLabel.textContent = `Đang xem: Cả Tuần (${weekInfo.week})`;
        if (btnShowAll) btnShowAll.style.display = 'none';
      }
    }

    // ========================================================================
    // 4. RENDER WEEK-OVER-WEEK COMPARISON TABLE
    // ========================================================================
    const tbodyWeeks = document.getElementById('weeks-compare-tbody');
    if (tbodyWeeks) {
      tbodyWeeks.innerHTML = '';

      const currentWk = weekInfo.week;
      const weeksToCompare = [currentWk - 3, currentWk - 2, currentWk - 1, currentWk].filter(w => w > 0);

      let prevWeekSpend = null;

      weeksToCompare.forEach(wkNum => {
        let wkSpend = 0;
        let isCurrent = wkNum === currentWk;

        transactions.forEach(t => {
          const tWk = getWeekNumber(new Date(t.date));
          if (tWk === wkNum && t.type === 'expense') {
            wkSpend += t.amount;
          }
        });

        const wkSaved = Math.max(0, budget - wkSpend);
        let trendHtml = '<span class="badge-neutral">Chuẩn tuần</span>';

        if (prevWeekSpend !== null && prevWeekSpend > 0) {
          const diff = wkSpend - prevWeekSpend;
          const diffPercent = Math.round((Math.abs(diff) / prevWeekSpend) * 100);
          if (diff > 0) {
            trendHtml = `<span class="badge-expense">+${diffPercent}%</span>`;
          } else if (diff < 0) {
            trendHtml = `<span class="badge-saving">-${diffPercent}%</span>`;
          } else {
            trendHtml = `<span class="badge-neutral">Bằng</span>`;
          }
        } else if (isCurrent) {
          trendHtml = wkSpend > budget ? '<span class="badge-expense">Bội chi</span>' : '<span class="badge-saving">Đang diễn ra</span>';
        }

        prevWeekSpend = wkSpend;

        const tr = document.createElement('tr');
        if (isCurrent) tr.className = 'current-week-row';

        tr.innerHTML = `
          <td><strong>Tuần ${wkNum}</strong> ${isCurrent ? '<span class="today-tag">Hiện tại</span>' : ''}</td>
          <td class="text-bold ${wkSpend > budget ? 'text-expense' : ''}">${formatVND(wkSpend)}</td>
          <td>${formatVND(budget)}</td>
          <td class="text-saving font-mono">${formatVND(wkSaved)}</td>
          <td>${trendHtml}</td>
        `;
        tbodyWeeks.appendChild(tr);
      });
    }

    // ========================================================================
    // 5. RENDER TRANSACTION LEDGER (WITH DAY FILTERING)
    // ========================================================================
    const listContainer = document.getElementById('transactions-list');
    const countLabel = document.getElementById('trans-count-label');

    if (listContainer) {
      listContainer.innerHTML = '';

      let filteredTx = transactions;
      if (this.selectedDayFilter) {
        filteredTx = transactions.filter(t => {
          const tDateStr = formatLocalDateStr(new Date(t.date));
          return tDateStr === this.selectedDayFilter;
        });
      }

      if (countLabel) {
        countLabel.textContent = `${filteredTx.length} giao dịch được ghi nhận`;
      }

      if (filteredTx.length === 0) {
        listContainer.innerHTML = `
          <div style="padding: 28px 16px; text-align: center; color: var(--text-muted); font-size: 13px;">
            ${this.selectedDayFilter ? 'Chưa có khoản chi nào trong ngày này.' : 'Chưa có giao dịch nào được ghi chép. Hãy nhập khoản chi tiêu đầu tiên phía trên!'}
          </div>
        `;
      } else {
        filteredTx.forEach(t => {
          const cat = FINANCE_CATEGORIES[t.category] || FINANCE_CATEGORIES.other;
          const isExpense = t.type === 'expense';
          const sign = isExpense ? '-' : '+';
          const amountClass = isExpense ? 'expense' : 'income';
          const iconSvg = window.AppIcons && window.AppIcons[cat.iconKey] ? window.AppIcons[cat.iconKey] : '•';

          const creatorUser = StorageManager.USERS.find(u => u.id === t.creator) || StorageManager.USERS[1];

          const row = document.createElement('div');
          row.className = 'trans-item-row';
          row.innerHTML = `
            <div class="trans-item-left">
              <div class="trans-cat-icon">${iconSvg}</div>
              <div class="trans-text-block">
                <span class="trans-item-desc">${t.desc}</span>
                <span class="trans-item-date">${formatReadableDate(t.date)} • ${cat.label} • Bởi ${creatorUser.name}</span>
              </div>
            </div>
            <div class="trans-item-right">
              <span class="trans-amount-text ${amountClass}">${sign} ${formatVND(t.amount)}</span>
              <button class="trans-btn-delete" title="Xóa giao dịch này" data-id="${t.id}">✕</button>
            </div>
          `;

          row.querySelector('.trans-btn-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            const id = e.currentTarget.getAttribute('data-id');
            StorageManager.deleteTransaction(id);
            this.render();
            if (window.showToast) window.showToast('Đã xóa giao dịch.', 'info');
          });

          listContainer.appendChild(row);
        });
      }
    }
  }
};
