/**
 * NGAOS — PERSONAL FINANCE MODULE
 * Practical weekly budget tracker, quick cashflow ledger, and year-end savings piggy bank
 */

const FINANCE_CATEGORIES = {
  food: { label: 'Ăn Uống & Cafe', icon: '🍜' },
  study: { label: 'Học Tập & Sách', icon: '📚' },
  shop: { label: 'Mua Sắm & Mỹ Phẩm', icon: '🛍️' },
  travel: { label: 'Di Chuyển & Xăng', icon: '🛵' },
  health: { label: 'Thuốc & Sức Khỏe', icon: '💊' },
  other: { label: 'Khoản Khác', icon: '✨' }
};

function formatVND(num) {
  return (Number(num) || 0).toLocaleString('vi-VN') + ' đ';
}

function getWeekInfo() {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
  const totalWeeks = 52;
  const remainingWeeks = Math.max(1, totalWeeks - weekNo);
  return {
    week: weekNo,
    totalWeeks,
    remainingWeeks,
    year: date.getUTCFullYear()
  };
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
  init() {
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    // 1. Change Weekly Budget
    const btnSaveBudget = document.getElementById('btn-save-weekly-budget');
    const inputBudget = document.getElementById('input-weekly-budget');

    const handleSaveBudget = () => {
      const val = Number(inputBudget?.value);
      if (isNaN(val) || val <= 0) {
        if (window.showToast) window.showToast('Vui lòng nhập số tiền hạn mức hợp lệ (> 0 đ)!', 'warning');
        return;
      }
      StorageManager.setWeeklyBudget(val);
      this.render();
      if (window.showToast) window.showToast(`Đã cập nhật hạn mức tuần: ${formatVND(val)}`, 'success');
      if (window.playChime) window.playChime(640, 0.15);
    };

    if (btnSaveBudget) btnSaveBudget.addEventListener('click', handleSaveBudget);
    if (inputBudget) {
      inputBudget.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSaveBudget();
      });
    }

    // 2. Deposit into Savings Goal Buttons
    const depositButtons = document.querySelectorAll('.btn-deposit');
    depositButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const amount = Number(btn.getAttribute('data-amount') || 0);
        if (amount <= 0) return;

        StorageManager.depositSavings(amount);
        this.render();
        if (window.showToast) window.showToast(`Đã nạp +${formatVND(amount)} vào mục tiêu tích lũy! 🌱`, 'success');
        if (window.playChime) window.playChime(760, 0.2);
      });
    });

    // 3. Add Transaction Form
    const btnAddTrans = document.getElementById('btn-add-trans');
    const inputDesc = document.getElementById('trans-desc');
    const inputAmount = document.getElementById('trans-amount');
    const selectCat = document.getElementById('trans-cat');

    const handleAddTrans = () => {
      const desc = (inputDesc?.value || '').trim();
      const amountVal = Number(inputAmount?.value);

      if (!desc) {
        if (window.showToast) window.showToast('Vui lòng nhập nội dung thu/chi!', 'warning');
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

      StorageManager.addTransaction({
        type,
        desc,
        amount: amountVal,
        category
      });

      // Reset form
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

    // 4. Clear Week Transactions
    const btnClearTrans = document.getElementById('btn-clear-week-trans');
    if (btnClearTrans) {
      btnClearTrans.addEventListener('click', () => {
        const state = StorageManager.getState();
        if ((state.finance.transactions || []).length === 0) {
          if (window.showToast) window.showToast('Lịch sử tuần này đang trống.', 'info');
          return;
        }

        if (confirm('Bạn có chắc muốn làm mới lịch sử chi tiêu tuần này không?')) {
          StorageManager.clearTransactions();
          this.render();
          if (window.showToast) window.showToast('Đã làm mới dữ liệu chi tiêu tuần này.', 'info');
        }
      });
    }
  },

  render() {
    const state = StorageManager.getState();
    const { finance } = state;
    const weekInfo = getWeekInfo();

    // 1. Weekly Badge
    const weekBadge = document.getElementById('finance-week-badge');
    if (weekBadge) {
      weekBadge.textContent = `Tuần ${weekInfo.week} / ${weekInfo.totalWeeks} Tuần (Năm ${weekInfo.year})`;
    }

    // 2. Weekly Spending Calculation
    const budget = finance.weeklyBudget || 1500000;
    const transactions = finance.transactions || [];

    let totalSpent = 0;
    let totalIncome = 0;

    transactions.forEach(t => {
      if (t.type === 'expense') totalSpent += t.amount;
      else if (t.type === 'income') totalIncome += t.amount;
    });

    const remaining = Math.max(0, budget - totalSpent);
    const spentPercent = budget > 0 ? Math.min(100, Math.round((totalSpent / budget) * 100)) : 0;

    const remainingElem = document.getElementById('weekly-remaining-amount');
    const spentTextElem = document.getElementById('weekly-spent-text');
    const budgetTextElem = document.getElementById('weekly-budget-text');
    const meterBar = document.getElementById('weekly-meter-bar');
    const statusPill = document.getElementById('weekly-status-pill');
    const inputBudget = document.getElementById('input-weekly-budget');

    if (remainingElem) remainingElem.textContent = formatVND(remaining);
    if (spentTextElem) spentTextElem.textContent = formatVND(totalSpent);
    if (budgetTextElem) budgetTextElem.textContent = formatVND(budget);
    if (inputBudget && !inputBudget.value) inputBudget.value = budget;

    if (meterBar) {
      meterBar.style.width = `${spentPercent}%`;
      meterBar.className = 'progress-bar-fill';

      if (spentPercent > 90) {
        meterBar.classList.add('fill-rose');
        meterBar.style.background = 'linear-gradient(90deg, #f43f5e, #e11d48)';
      } else if (spentPercent > 70) {
        meterBar.classList.add('fill-amber');
        meterBar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
      } else {
        meterBar.classList.add('fill-blue');
        meterBar.style.background = 'linear-gradient(90deg, #0ea5e9, #0284c7)';
      }
    }

    if (statusPill) {
      if (totalSpent > budget) {
        statusPill.textContent = 'Bội chi / Vượt mức 🚨';
        statusPill.style.background = '#ffe4e6';
        statusPill.style.color = '#e11d48';
      } else if (spentPercent > 75) {
        statusPill.textContent = 'Cần chú ý ⚠️';
        statusPill.style.background = '#fef3c7';
        statusPill.style.color = '#d97706';
      } else {
        statusPill.textContent = 'An toàn 🌱';
        statusPill.style.background = '#d1fae5';
        statusPill.style.color = '#059669';
      }
    }

    // 3. Year-End Goal Card
    const goal = finance.savingsGoal || { targetAmount: 25000000, currentAmount: 16500000 };
    const goalRemainingWeeks = weekInfo.remainingWeeks;

    const goalRemainWeeksElem = document.getElementById('goal-remaining-weeks-text');
    const goalCurrentElem = document.getElementById('goal-current-amount');
    const goalPercentElem = document.getElementById('goal-percent-text');
    const goalTargetElem = document.getElementById('goal-target-amount');
    const goalNeededWeeklyElem = document.getElementById('goal-needed-weekly-text');
    const goalMeterBar = document.getElementById('goal-meter-bar');

    const goalPercent = goal.targetAmount > 0
      ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
      : 0;

    const deficit = Math.max(0, goal.targetAmount - goal.currentAmount);
    const neededPerWeek = goalRemainingWeeks > 0 ? Math.round(deficit / goalRemainingWeeks) : 0;

    if (goalRemainWeeksElem) goalRemainWeeksElem.textContent = `Còn ${goalRemainingWeeks} tuần nữa hết năm`;
    if (goalCurrentElem) goalCurrentElem.textContent = formatVND(goal.currentAmount);
    if (goalPercentElem) goalPercentElem.textContent = `${goalPercent}%`;
    if (goalTargetElem) goalTargetElem.textContent = formatVND(goal.targetAmount);
    if (goalNeededWeeklyElem) {
      if (deficit <= 0) {
        goalNeededWeeklyElem.textContent = 'Đã hoàn thành mục tiêu! 🎉';
      } else {
        goalNeededWeeklyElem.textContent = `Cần ~${formatVND(neededPerWeek)} / tuần`;
      }
    }
    if (goalMeterBar) {
      goalMeterBar.style.width = `${goalPercent}%`;
      goalMeterBar.className = 'progress-bar-fill fill-emerald';
    }

    // 4. Transactions List
    const transListContainer = document.getElementById('transactions-list');
    const transCountLabel = document.getElementById('trans-count-label');

    if (transCountLabel) {
      transCountLabel.textContent = `${transactions.length} giao dịch trong tuần này`;
    }

    if (!transListContainer) return;
    transListContainer.innerHTML = '';

    if (transactions.length === 0) {
      const emptyItem = document.createElement('div');
      emptyItem.style.cssText = 'padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px; font-style: italic;';
      emptyItem.textContent = 'Chưa có khoản thu chi nào được ghi chép trong tuần này ✨';
      transListContainer.appendChild(emptyItem);
      return;
    }

    transactions.forEach(tx => {
      const cat = FINANCE_CATEGORIES[tx.category] || FINANCE_CATEGORIES.other;
      const row = document.createElement('div');
      row.className = 'trans-item-row';
      row.setAttribute('data-id', tx.id);

      const sign = tx.type === 'expense' ? '-' : '+';
      const amountClass = tx.type === 'expense' ? 'expense' : 'income';

      row.innerHTML = `
        <div class="trans-item-left">
          <div class="trans-cat-icon">${cat.icon}</div>
          <div class="trans-text-block">
            <span class="trans-item-desc">${escapeHTML(tx.desc)}</span>
            <span class="trans-item-date">${formatReadableDate(tx.date)} • ${cat.label}</span>
          </div>
        </div>
        <div class="trans-item-right">
          <span class="trans-amount-text ${amountClass}">
            ${sign} ${formatVND(tx.amount)}
          </span>
          <button class="trans-btn-delete" title="Xóa khoản này" aria-label="Xóa">✕</button>
        </div>
      `;

      row.querySelector('.trans-btn-delete').addEventListener('click', (e) => {
        e.stopPropagation();
        StorageManager.deleteTransaction(tx.id);
        this.render();
        if (window.showToast) window.showToast('Đã xóa giao dịch khỏi sổ tay', 'info');
      });

      transListContainer.appendChild(row);
    });
  }
};

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
