/**
 * NGAOS — STORAGE & STATE ENGINE (V3)
 * Full CRUD for Big Savings Goals, 2-User Auth System (Bảo & Ngân), and Clean SVG Icons
 */

const STORAGE_KEY = 'NGAOS_STATE_V3';
const AUTH_KEY = 'NGAOS_AUTH_V3';

const AUTH_USERS = [
  { id: 'bao', name: 'Bảo', role: 'Người đồng hành', pin: '1234', avatarColor: '#0284c7' },
  { id: 'ngan', name: 'Ngân', role: 'Chủ nhân không gian', pin: '5678', avatarColor: '#059669' }
];

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
    version: 3,
    schedule: {
      activePreset: '',
      tasks: [] // Clean slate
    },
    finance: {
      weeklyBudget: 1500000,
      goals: [
        {
          id: 'goal_laptop',
          title: 'Quỹ Mua Laptop Mới',
          targetAmount: 25000000,
          currentAmount: 0,
          deadline: '2026-12-31',
          creator: 'ngan',
          category: 'tech'
        }
      ],
      transactions: [] // Clean slate
    },
    chat: {
      messages: [
        {
          id: 'msg_initial_1',
          sender: 'bao',
          senderName: 'Bảo',
          type: 'text',
          text: 'Chào Ngân! Hôm nay học tập thật tốt nhé em bé, anh luôn ở đây tiếp năng lượng cho em!',
          time: '08:00',
          timestamp: Date.now() - 3600000
        }
      ]
    }
  };
}

const StorageManager = {
  PRESETS: PRESET_TEMPLATES,
  USERS: AUTH_USERS,

  // --------------------------------------------------------------------------
  // Authentication (2 Users: Bảo & Ngân)
  // --------------------------------------------------------------------------
  getCurrentUser() {
    try {
      const saved = localStorage.getItem(AUTH_KEY);
      if (saved) {
        const found = AUTH_USERS.find(u => u.id === saved);
        if (found) return found;
      }
      return AUTH_USERS[1]; // Mặc định là Ngân
    } catch (e) {
      return AUTH_USERS[1];
    }
  },

  setCurrentUser(userId, pin = '') {
    const user = AUTH_USERS.find(u => u.id === userId);
    if (!user) return { success: false, message: 'Người dùng không tồn tại' };

    if (pin && pin !== user.pin) {
      return { success: false, message: 'Mã PIN bảo mật không chính xác' };
    }

    try {
      localStorage.setItem(AUTH_KEY, user.id);
      return { success: true, user };
    } catch (e) {
      return { success: false, message: 'Lỗi lưu phiên đăng nhập' };
    }
  },

  logoutUser() {
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch (e) {}
  },

  // --------------------------------------------------------------------------
  // Core State
  // --------------------------------------------------------------------------
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
      if (!Array.isArray(parsed.finance.goals)) {
        parsed.finance.goals = getCleanInitialState().finance.goals;
        this.saveState(parsed);
      }
      if (!parsed.chat || !Array.isArray(parsed.chat.messages)) {
        parsed.chat = getCleanInitialState().chat;
        this.saveState(parsed);
      }
      return parsed;
    } catch (e) {
      console.warn('Khởi tạo lại state V3 chuẩn:', e);
      const fallback = getCleanInitialState();
      this.saveState(fallback);
      return fallback;
    }
  },

  saveState(state) {
    try {
      if (state && typeof state === 'object') {
        state.updatedAt = Date.now();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      // Tự động đẩy dữ liệu lên Firebase Firestore nếu đã kết nối
      if (window.CloudSync && typeof window.CloudSync.pushUpdate === 'function') {
        window.CloudSync.pushUpdate(state);
      }
    } catch (e) {
      console.error('Không thể lưu vào LocalStorage:', e);
    }
  },

  setState(newState) {
    try {
      if (!newState || !newState.schedule || !newState.finance) return;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Không thể cập nhật state từ đám mây:', e);
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
    const currentUser = this.getCurrentUser();
    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      period: period || 'morning',
      time: (time || '').trim(),
      title: title.trim(),
      category: category || 'study',
      completed: false,
      createdBy: currentUser.id
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
  // Finance Operations: Weekly Budget
  // --------------------------------------------------------------------------
  setWeeklyBudget(amount) {
    const state = this.getState();
    state.finance.weeklyBudget = Math.max(0, Number(amount) || 0);
    this.saveState(state);
    return state;
  },

  // --------------------------------------------------------------------------
  // Finance Operations: BIG SAVINGS GOALS (FULL CRUD)
  // --------------------------------------------------------------------------
  getGoals() {
    const state = this.getState();
    return state.finance.goals || [];
  },

  addGoal({ title, targetAmount, deadline, category }) {
    const state = this.getState();
    if (!Array.isArray(state.finance.goals)) state.finance.goals = [];

    const currentUser = this.getCurrentUser();
    const newGoal = {
      id: 'goal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title.trim(),
      targetAmount: Math.max(100000, Number(targetAmount) || 1000000),
      currentAmount: 0,
      deadline: deadline || '2026-12-31',
      category: category || 'general',
      creator: currentUser.id,
      createdAt: new Date().toISOString()
    };

    state.finance.goals.unshift(newGoal);
    this.saveState(state);
    return { state, newGoal };
  },

  updateGoal(goalId, { title, targetAmount, deadline, category }) {
    const state = this.getState();
    const goal = (state.finance.goals || []).find(g => g.id === goalId);
    if (!goal) return { success: false, message: 'Không tìm thấy mục tiêu' };

    if (title) goal.title = title.trim();
    if (targetAmount && targetAmount > 0) goal.targetAmount = Number(targetAmount);
    if (deadline) goal.deadline = deadline;
    if (category) goal.category = category;

    this.saveState(state);
    return { success: true, state, goal };
  },

  deleteGoal(goalId) {
    const state = this.getState();
    state.finance.goals = (state.finance.goals || []).filter(g => g.id !== goalId);
    this.saveState(state);
    return state;
  },

  depositToGoal(goalId, amount) {
    const state = this.getState();
    const goal = (state.finance.goals || []).find(g => g.id === goalId);
    if (!goal) return { success: false, message: 'Không tìm thấy mục tiêu' };

    const depositAmt = Math.max(0, Number(amount) || 0);
    goal.currentAmount = (goal.currentAmount || 0) + depositAmt;
    this.saveState(state);
    return { success: true, state, goal };
  },

  withdrawFromGoal(goalId, amount) {
    const state = this.getState();
    const goal = (state.finance.goals || []).find(g => g.id === goalId);
    if (!goal) return { success: false, message: 'Không tìm thấy mục tiêu' };

    const withdrawAmt = Math.min(goal.currentAmount || 0, Number(amount) || 0);
    goal.currentAmount = Math.max(0, (goal.currentAmount || 0) - withdrawAmt);
    this.saveState(state);
    return { success: true, state, goal };
  },

  // --------------------------------------------------------------------------
  // Finance Operations: Transactions
  // --------------------------------------------------------------------------
  addTransaction({ type, desc, amount, category, date }) {
    const state = this.getState();
    const currentUser = this.getCurrentUser();
    const newTx = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      type: type || 'expense',
      desc: desc.trim(),
      amount: Math.max(0, Number(amount) || 0),
      category: category || 'food',
      date: date || new Date().toISOString(),
      creator: currentUser.id
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

  // --------------------------------------------------------------------------
  // Chat & Study Status Operations
  // --------------------------------------------------------------------------
  getChatMessages() {
    const state = this.getState();
    return (state.chat && state.chat.messages) || [];
  },

  addChatMessage(text, type = 'text', meta = {}) {
    if (!text || !text.trim()) return null;
    const state = this.getState();
    const currentUser = this.getCurrentUser();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newMsg = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender: currentUser.id,
      senderName: currentUser.name,
      type: type, // 'text' | 'nudge'
      text: text.trim(),
      time: timeStr,
      timestamp: Date.now(),
      ...meta
    };

    if (!state.chat) state.chat = { messages: [] };
    state.chat.messages.push(newMsg);

    // Giữ tối đa 100 tin nhắn gần nhất
    if (state.chat.messages.length > 100) {
      state.chat.messages = state.chat.messages.slice(-100);
    }

    this.saveState(state);
    return newMsg;
  },

  sendQuickNudge(nudgeType) {
    const currentUser = this.getCurrentUser();
    let nudgeText = '';
    let nudgeTitle = '';

    switch (nudgeType) {
      case 'water':
        nudgeTitle = 'Nhắc uống nước';
        nudgeText = currentUser.id === 'bao' 
          ? 'Em bé ơi, học chăm chỉ nhưng nhớ uống một cốc nước ấm cho khỏe khoắn nhé!'
          : 'Anh ơi, làm việc nhớ uống nước đều đặn nha!';
        break;
      case 'rest':
        nudgeTitle = 'Nhắc nghỉ giải lao';
        nudgeText = currentUser.id === 'bao'
          ? 'Nhìn màn hình lâu rồi đó em, đứng dậy vươn vai và thả lỏng mắt 5 phút đi nha!'
          : 'Nghỉ tay xíu đi anh, đừng ngồi một chỗ lâu quá nhé!';
        break;
      case 'meal':
        nudgeTitle = 'Nhắc ăn cơm';
        nudgeText = currentUser.id === 'bao'
          ? 'Đến giờ ăn cơm rồi em ơi, đi nạp năng lượng đầy đủ rồi hẵng học tiếp nhé!'
          : 'Đến bữa ăn rồi nè, anh nhớ ăn uống đúng giờ nhé!';
        break;
      case 'cheer':
      default:
        nudgeTitle = 'Tiếp thêm động lực';
        nudgeText = currentUser.id === 'bao'
          ? 'Em bé của anh học giỏi lắm, anh luôn ở đây đồng hành cùng em. Cố lên nào!'
          : 'Hôm nay em học rất tốt, cảm ơn anh đã luôn ủng hộ em!';
        break;
    }

    return this.addChatMessage(nudgeText, 'nudge', { nudgeType, nudgeTitle });
  },

  getStudyStatusSummary() {
    const state = this.getState();
    const tasks = (state.schedule && state.schedule.tasks) || [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const hour = new Date().getHours();
    let currentPeriod = 'morning';
    let periodName = 'Buổi Sáng';
    if (hour >= 12 && hour < 18) {
      currentPeriod = 'afternoon';
      periodName = 'Buổi Chiều';
    } else if (hour >= 18 || hour < 6) {
      currentPeriod = 'evening';
      periodName = 'Buổi Tối';
    }

    const completedTasks = tasks.filter(t => t.completed);
    const lastCompleted = completedTasks.length > 0 ? completedTasks[completedTasks.length - 1] : null;

    return {
      total,
      completed,
      percent,
      currentPeriod,
      periodName,
      lastCompletedTitle: lastCompleted ? lastCompleted.title : null
    };
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
    const str = JSON.stringify(state, null, 2);
    const blob = new Blob([str], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngaos_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    return str;
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
