/**
 * NGAOS — STORAGE & STATE ENGINE (V2)
 * Clean slate state management via LocalStorage
 * Safe schema migrations, export/import JSON and preset templates
 */

const STORAGE_KEY = 'NGAOS_STATE_V2';

const PRESET_TEMPLATES = {
  campus: [
    { id: 'c1', period: 'morning', time: '07:00 - 07:30', title: 'Thức dậy, vệ sinh cá nhân & ăn sáng', category: 'routine', completed: false },
    { id: 'c2', period: 'morning', time: '07:30 - 11:30', title: 'Học ca sáng trên giảng đường (Tập trung ghi chép)', category: 'study', completed: false },
    { id: 'c3', period: 'afternoon', time: '12:00 - 13:00', title: 'Ăn trưa & chợp mắt 30 phút nạp lại năng lượng', category: 'routine', completed: false },
    { id: 'c4', period: 'afternoon', time: '13:30 - 16:30', title: 'Học ca chiều / Thảo luận nhóm tại thư viện', category: 'study', completed: false },
    { id: 'c5', period: 'afternoon', time: '17:00 - 17:45', title: 'Đi dạo nhẹ nhàng / Vận động thể dục', category: 'health', completed: false },
    { id: 'c6', period: 'evening', time: '18:30 - 19:30', title: 'Cơm tối & trò chuyện thư giãn', category: 'routine', completed: false },
    { id: 'c7', period: 'evening', time: '20:00 - 22:00', title: 'Ôn bài, hoàn thiện bài tập về nhà & chuẩn bị tài liệu', category: 'study', completed: false },
    { id: 'c8', period: 'evening', time: '22:30 - 23:00', title: 'Skincare, uống nước ấm & đi ngủ đúng giờ', category: 'health', completed: false }
  ],
  'self-study': [
    { id: 's1', period: 'morning', time: '07:30 - 08:30', title: 'Ăn sáng, cafe & lên mục tiêu trọng tâm trong ngày', category: 'routine', completed: false },
    { id: 's2', period: 'morning', time: '08:30 - 11:30', title: 'Nghiên cứu tài liệu chuyên sâu & viết đề án (Deep Work)', category: 'project', completed: false },
    { id: 's3', period: 'afternoon', time: '12:00 - 13:30', title: 'Ăn trưa dinh dưỡng & nghe nhạc thư giãn', category: 'routine', completed: false },
    { id: 's4', period: 'afternoon', time: '14:00 - 17:00', title: 'Thực hành bài tập đề án, sửa lỗi & hoàn thiện báo cáo', category: 'project', completed: false },
    { id: 's5', period: 'afternoon', time: '17:30 - 18:15', title: 'Tập yoga / Chạy bộ nhẹ nhàng', category: 'health', completed: false },
    { id: 's6', period: 'evening', time: '19:00 - 20:00', title: 'Bữa tối cùng gia đình / bạn bè', category: 'routine', completed: false },
    { id: 's7', period: 'evening', time: '20:15 - 22:00', title: 'Đọc 1 chương sách chuyên môn & tổng hợp ghi chú', category: 'study', completed: false },
    { id: 's8', period: 'evening', time: '22:30 - 23:00', title: 'Viết nhật ký ngày & chuẩn bị ngủ sớm', category: 'health', completed: false }
  ],
  weekend: [
    { id: 'w1', period: 'morning', time: '08:00 - 09:00', title: 'Thức dậy thong thả, tận hưởng bữa sáng & cafe cuối tuần', category: 'routine', completed: false },
    { id: 'w2', period: 'morning', time: '09:30 - 11:30', title: 'Dọn dẹp phòng ốc, giặt ủi & sắp xếp lại bàn học', category: 'routine', completed: false },
    { id: 'w3', period: 'afternoon', time: '13:30 - 15:30', title: 'Xem lại tài chính tuần & lên lịch trình tuần mới', category: 'routine', completed: false },
    { id: 'w4', period: 'afternoon', time: '16:00 - 18:30', title: 'Gặp bạn bè / Dạo phố đổi gió', category: 'health', completed: false },
    { id: 'w5', period: 'evening', time: '19:30 - 21:30', title: 'Xem một bộ phim hay / Nghe podcast yêu thích', category: 'routine', completed: false },
    { id: 'w6', period: 'evening', time: '22:00 - 23:00', title: 'Đắp mặt nạ, chăm sóc da & ngủ ngon hồi phục sức khỏe', category: 'health', completed: false }
  ]
};

function getCleanInitialState() {
  return {
    version: 2,
    schedule: {
      activePreset: '',
      tasks: [] // Clean slate: Không chứa dữ liệu mẫu giả
    },
    finance: {
      weeklyBudget: 1500000,
      savingsGoal: {
        title: 'Mục Tiêu Tiết Kiệm Lớn',
        targetAmount: 25000000,
        currentAmount: 0,
        history: []
      },
      transactions: [] // Clean slate: Không chứa giao dịch ảo
    }
  };
}

const StorageManager = {
  PRESETS: PRESET_TEMPLATES,

  getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initialState = getCleanInitialState();
        this.saveState(initialState);
        return initialState;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.schedule || !parsed.finance) {
        throw new Error('Invalid state structure');
      }
      return parsed;
    } catch (e) {
      console.warn('Lỗi khi đọc LocalStorage, khởi tạo lại state sạch:', e);
      const fallback = getCleanInitialState();
      this.saveState(fallback);
      return fallback;
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Không thể lưu vào LocalStorage:', e);
    }
  },

  // --------------------------------------------------------------------------
  // Schedule Operations
  // --------------------------------------------------------------------------
  loadPreset(presetKey) {
    const state = this.getState();
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return state;

    state.schedule.activePreset = presetKey;
    state.schedule.tasks = JSON.parse(JSON.stringify(template));
    this.saveState(state);
    return state;
  },

  addTask({ period, time, title, category }) {
    const state = this.getState();
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      period: period || 'morning',
      time: (time || '').trim(),
      title: title.trim(),
      category: category || 'study',
      completed: false
    };

    state.schedule.tasks.push(newTask);
    this.saveState(state);
    return { state, newTask };
  },

  toggleTask(taskId) {
    const state = this.getState();
    const task = state.schedule.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      this.saveState(state);
    }
    return state;
  },

  deleteTask(taskId) {
    const state = this.getState();
    state.schedule.tasks = state.schedule.tasks.filter(t => t.id !== taskId);
    this.saveState(state);
    return state;
  },

  clearTasks() {
    const state = this.getState();
    state.schedule.tasks = [];
    state.schedule.activePreset = '';
    this.saveState(state);
    return state;
  },

  // --------------------------------------------------------------------------
  // Finance Operations
  // --------------------------------------------------------------------------
  setWeeklyBudget(amount) {
    const state = this.getState();
    state.finance.weeklyBudget = Math.max(0, Number(amount) || 0);
    this.saveState(state);
    return state;
  },

  addTransaction({ type, desc, amount, category, date }) {
    const state = this.getState();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type || 'expense',
      desc: desc.trim(),
      amount: Math.max(0, Number(amount) || 0),
      category: category || 'food',
      date: date || new Date().toISOString()
    };

    if (!Array.isArray(state.finance.transactions)) {
      state.finance.transactions = [];
    }
    state.finance.transactions.unshift(newTx);
    this.saveState(state);
    return { state, newTx };
  },

  deleteTransaction(txId) {
    const state = this.getState();
    state.finance.transactions = (state.finance.transactions || []).filter(t => t.id !== txId);
    this.saveState(state);
    return state;
  },

  clearTransactions() {
    const state = this.getState();
    state.finance.transactions = [];
    this.saveState(state);
    return state;
  },

  depositSavings(amount) {
    const state = this.getState();
    if (!state.finance.savingsGoal) {
      state.finance.savingsGoal = { title: 'Mục Tiêu Tiết Kiệm Lớn', targetAmount: 25000000, currentAmount: 0, history: [] };
    }
    state.finance.savingsGoal.currentAmount = (state.finance.savingsGoal.currentAmount || 0) + Number(amount);
    if (!Array.isArray(state.finance.savingsGoal.history)) {
      state.finance.savingsGoal.history = [];
    }
    state.finance.savingsGoal.history.unshift({
      date: new Date().toISOString(),
      amount: Number(amount),
      action: 'deposit'
    });
    this.saveState(state);
    return state;
  },

  withdrawSavings(amount) {
    const state = this.getState();
    if (!state.finance.savingsGoal) return state;
    const withdrawAmt = Math.min(state.finance.savingsGoal.currentAmount || 0, Number(amount));
    state.finance.savingsGoal.currentAmount = Math.max(0, (state.finance.savingsGoal.currentAmount || 0) - withdrawAmt);
    if (!Array.isArray(state.finance.savingsGoal.history)) {
      state.finance.savingsGoal.history = [];
    }
    state.finance.savingsGoal.history.unshift({
      date: new Date().toISOString(),
      amount: withdrawAmt,
      action: 'withdraw'
    });
    this.saveState(state);
    return state;
  },

  updateSavingsGoal({ title, targetAmount }) {
    const state = this.getState();
    if (!state.finance.savingsGoal) {
      state.finance.savingsGoal = { title: 'Mục Tiêu Tiết Kiệm Lớn', targetAmount: 25000000, currentAmount: 0, history: [] };
    }
    if (title) state.finance.savingsGoal.title = title.trim();
    if (targetAmount && targetAmount > 0) state.finance.savingsGoal.targetAmount = Number(targetAmount);
    this.saveState(state);
    return state;
  },

  // --------------------------------------------------------------------------
  // Reset & Backup Tools
  // --------------------------------------------------------------------------
  resetToClean() {
    const clean = getCleanInitialState();
    this.saveState(clean);
    return clean;
  },

  exportJSON() {
    const state = this.getState();
    return JSON.stringify(state, null, 2);
  },

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.schedule || !parsed.finance) {
        throw new Error('Cấu trúc file sao lưu không hợp lệ');
      }
      this.saveState(parsed);
      return { success: true, state: parsed };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
};

window.StorageManager = StorageManager;
