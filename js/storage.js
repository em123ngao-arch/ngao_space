/**
 * NGAOS — STORAGE & STATE ENGINE
 * Centralized, persistent state management via LocalStorage
 * Safe schema migrations, export/import JSON and preset templates
 */

const STORAGE_KEY = 'NGAOS_STATE_V1';

const PRESET_TEMPLATES = {
  campus: [
    { id: 'c1', period: 'morning', time: '07:00 - 07:30', title: 'Thức dậy, vệ sinh cá nhân & ăn sáng', category: 'routine', completed: true },
    { id: 'c2', period: 'morning', time: '07:30 - 11:30', title: 'Học ca sáng trên giảng đường (Tập trung ghi chép)', category: 'study', completed: true },
    { id: 'c3', period: 'afternoon', time: '12:00 - 13:00', title: 'Ăn trưa & chợp mắt 30 phút nạp lại năng lượng', category: 'routine', completed: false },
    { id: 'c4', period: 'afternoon', time: '13:30 - 16:30', title: 'Học ca chiều / Thảo luận nhóm tại thư viện', category: 'study', completed: false },
    { id: 'c5', period: 'afternoon', time: '17:00 - 17:45', title: 'Đi dạo nhẹ nhàng / Vận động thể dục', category: 'health', completed: false },
    { id: 'c6', period: 'evening', time: '18:30 - 19:30', title: 'Cơm tối & trò chuyện thư giãn', category: 'routine', completed: false },
    { id: 'c7', period: 'evening', time: '20:00 - 22:00', title: 'Ôn bài, hoàn thiện bài tập về nhà & chuẩn bị tài liệu', category: 'study', completed: false },
    { id: 'c8', period: 'evening', time: '22:30 - 23:00', title: 'Skincare, uống nước ấm & đi ngủ đúng giờ', category: 'health', completed: false }
  ],
  'self-study': [
    { id: 's1', period: 'morning', time: '07:30 - 08:30', title: 'Ăn sáng, cafe & lên mục tiêu trọng tâm trong ngày', category: 'routine', completed: true },
    { id: 's2', period: 'morning', time: '08:30 - 11:30', title: 'Nghiên cứu tài liệu chuyên sâu & viết đề án (Deep Work)', category: 'project', completed: false },
    { id: 's3', period: 'afternoon', time: '12:00 - 13:30', title: 'Ăn trưa dinh dưỡng & nghe nhạc thư giãn', category: 'routine', completed: false },
    { id: 's4', period: 'afternoon', time: '14:00 - 17:00', title: 'Thực hành bài tập đề án, sửa lỗi & hoàn thiện báo cáo', category: 'project', completed: false },
    { id: 's5', period: 'afternoon', time: '17:30 - 18:15', title: 'Tập yoga / Chạy bộ nhẹ nhàng', category: 'health', completed: false },
    { id: 's6', period: 'evening', time: '19:00 - 20:00', title: 'Bữa tối cùng gia đình / bạn bè', category: 'routine', completed: false },
    { id: 's7', period: 'evening', time: '20:15 - 22:00', title: 'Đọc 1 chương sách chuyên môn & tổng hợp ghi chú', category: 'study', completed: false },
    { id: 's8', period: 'evening', time: '22:30 - 23:00', title: 'Viết nhật ký ngày & chuẩn bị ngủ sớm', category: 'health', completed: false }
  ],
  weekend: [
    { id: 'w1', period: 'morning', time: '08:00 - 09:00', title: 'Thức dậy thong thả, tận hưởng bữa sáng & cafe cuối tuần', category: 'routine', completed: true },
    { id: 'w2', period: 'morning', time: '09:30 - 11:30', title: 'Dọn dẹp phòng ốc, giặt ủi & sắp xếp lại bàn học', category: 'routine', completed: false },
    { id: 'w3', period: 'afternoon', time: '13:30 - 15:30', title: 'Xem lại tài chính tuần & lên lịch trình tuần mới', category: 'routine', completed: false },
    { id: 'w4', period: 'afternoon', time: '16:00 - 18:30', title: 'Gặp bạn bè / Dạo phố đổi gió', category: 'health', completed: false },
    { id: 'w5', period: 'evening', time: '19:30 - 21:30', title: 'Xem một bộ phim hay / Nghe podcast yêu thích', category: 'routine', completed: false },
    { id: 'w6', period: 'evening', time: '22:00 - 23:00', title: 'Đắp mặt nạ, chăm sóc da & ngủ ngon hồi phục sức khỏe', category: 'health', completed: false }
  ]
};

function getInitialDemoState() {
  const now = new Date();
  const formatIso = (offsetDays, hours, mins) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(hours, mins, 0, 0);
    return d.toISOString();
  };

  return {
    version: 1,
    schedule: {
      activePreset: 'campus',
      tasks: JSON.parse(JSON.stringify(PRESET_TEMPLATES.campus))
    },
    finance: {
      weeklyBudget: 1500000,
      savingsGoal: {
        title: 'Mục Tiêu Tích Lũy Cuối Năm',
        targetAmount: 25000000,
        currentAmount: 16500000
      },
      transactions: [
        {
          id: 'tx_demo_1',
          type: 'expense',
          desc: 'Ăn trưa cơm tấm cùng bạn',
          amount: 45000,
          category: 'food',
          date: formatIso(0, 12, 15)
        },
        {
          id: 'tx_demo_2',
          type: 'expense',
          desc: 'Mua giáo trình Chuyên ngành & sổ tay',
          amount: 135000,
          category: 'study',
          date: formatIso(0, 10, 30)
        },
        {
          id: 'tx_demo_3',
          type: 'expense',
          desc: 'Đổ xăng xe máy',
          amount: 70000,
          category: 'travel',
          date: formatIso(1, 17, 45)
        },
        {
          id: 'tx_demo_4',
          type: 'expense',
          desc: 'Cafe học bài cuối tuần',
          amount: 55000,
          category: 'food',
          date: formatIso(2, 15, 20)
        },
        {
          id: 'tx_demo_5',
          type: 'income',
          desc: 'Tiền thưởng hỗ trợ đề án nghiên cứu',
          amount: 500000,
          category: 'other',
          date: formatIso(2, 9, 0)
        }
      ]
    }
  };
}

const StorageManager = {
  PRESETS: PRESET_TEMPLATES,

  getState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initialState = getInitialDemoState();
        this.saveState(initialState);
        return initialState;
      }
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.schedule || !parsed.finance) {
        throw new Error('Invalid state structure');
      }
      return parsed;
    } catch (e) {
      console.warn('Lỗi khi đọc LocalStorage, khởi tạo lại state chuẩn:', e);
      const fallback = getInitialDemoState();
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

  // --------------------------------------------------------------------------
  // Finance Operations
  // --------------------------------------------------------------------------
  setWeeklyBudget(amount) {
    const state = this.getState();
    state.finance.weeklyBudget = Math.max(0, Number(amount) || 0);
    this.saveState(state);
    return state;
  },

  addTransaction({ type, desc, amount, category }) {
    const state = this.getState();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type === 'income' ? 'income' : 'expense',
      desc: (desc || 'Giao dịch').trim(),
      amount: Math.abs(Number(amount) || 0),
      category: category || 'food',
      date: new Date().toISOString()
    };

    state.finance.transactions.unshift(newTx);
    this.saveState(state);
    return { state, newTx };
  },

  deleteTransaction(txId) {
    const state = this.getState();
    state.finance.transactions = state.finance.transactions.filter(t => t.id !== txId);
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
    const num = Math.abs(Number(amount) || 0);
    state.finance.savingsGoal.currentAmount += num;
    this.saveState(state);
    return state;
  },

  updateSavingsGoal(target, current) {
    const state = this.getState();
    if (target !== undefined) state.finance.savingsGoal.targetAmount = Math.max(0, Number(target) || 0);
    if (current !== undefined) state.finance.savingsGoal.currentAmount = Math.max(0, Number(current) || 0);
    this.saveState(state);
    return state;
  },

  // --------------------------------------------------------------------------
  // Backup / Restore Tools
  // --------------------------------------------------------------------------
  exportJSON() {
    const state = this.getState();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ngaos_backup_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  },

  importJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || !parsed.schedule || !parsed.finance) {
        throw new Error('File sao lưu không đúng định dạng của NgaOS');
      }
      this.saveState(parsed);
      return { success: true, state: parsed };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  resetToDemo() {
    const demo = getInitialDemoState();
    this.saveState(demo);
    return demo;
  }
};

window.StorageManager = StorageManager;
