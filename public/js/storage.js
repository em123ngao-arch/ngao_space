/**
 * NGAOS — STORAGE & STATE ENGINE (V3)
 * Full CRUD for Big Savings Goals, 2-User Auth System (Bảo & Ngân), and Clean SVG Icons
 */

const STORAGE_KEY = 'NGAOS_STATE_V3';
const AUTH_KEY = 'NGAOS_AUTH_V3';

const TAG_PALETTE = {
  orange:  { name: 'Cam', bg: '#fff7ed', border: '#fdba74', text: '#c2410c', badgeBg: '#ffedd5', badgeText: '#9a3412', dot: '#f97316' },
  blue:    { name: 'Xanh dương', bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', badgeBg: '#dbeafe', badgeText: '#1e40af', dot: '#3b82f6' },
  purple:  { name: 'Tím', bg: '#faf5ff', border: '#d8b4fe', text: '#7e22ce', badgeBg: '#f3e8ff', badgeText: '#6b21a8', dot: '#a855f7' },
  emerald: { name: 'Xanh ngọc', bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', badgeBg: '#d1fae5', badgeText: '#065f46', dot: '#10b981' },
  rose:    { name: 'Đỏ hồng', bg: '#fff1f2', border: '#fda4af', text: '#be123c', badgeBg: '#ffe4e6', badgeText: '#9f1239', dot: '#f43f5e' },
  amber:   { name: 'Hổ phách', bg: '#fffbeb', border: '#fcd34d', text: '#b45309', badgeBg: '#fef3c7', badgeText: '#92400e', dot: '#f59e0b' }
};

const DEFAULT_TAGS = [
  { name: 'Admin môn JAVA', color: 'orange' },
  { name: 'Chuyên Môn', color: 'purple' },
  { name: 'Đề Án', color: 'blue' },
  { name: 'Sinh Hoạt', color: 'emerald' },
  { name: 'Ôn Thi', color: 'amber' },
  { name: 'Deadline Gấp', color: 'rose' }
];

const AUTH_USERS = [
  { id: 'bao', name: 'Bảo', role: 'Người đồng hành', pin: '1234', avatarColor: '#0284c7', avatarUrl: 'assets/avatars/bao.png' },
  { id: 'ngan', name: 'Ngân', role: 'Chủ nhân không gian', pin: '5678', avatarColor: '#059669', avatarUrl: 'assets/avatars/ngan.png' }
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
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  
  // Ngày mai để demo tính năng liên kết công việc
  const tomorrowObj = new Date(d);
  tomorrowObj.setDate(d.getDate() + 1);
  const tomorrow = `${tomorrowObj.getFullYear()}-${String(tomorrowObj.getMonth() + 1).padStart(2, '0')}-${String(tomorrowObj.getDate()).padStart(2, '0')}`;

  const defaultTasks = [
    { id: 't_java_1', time: '08:30', title: 'Admin môn JAVA: Thiết kế giao diện quản trị viên & Đăng ký môn', tag: 'Admin môn JAVA', tagColor: 'orange', important: true, completed: false, period: 'morning' },
    { id: 's2', time: '10:00', title: 'Nghiên cứu tài liệu chuyên sâu & viết đề án (Deep Work)', tag: 'Đề Án', tagColor: 'blue', important: false, completed: false, period: 'morning' },
    { id: 's4', time: '14:30', title: 'Thực hành bài tập đề án, sửa lỗi & hoàn thiện báo cáo', tag: 'Đề Án', tagColor: 'blue', important: true, completed: false, period: 'afternoon' },
    { id: 's7', time: '20:15', title: 'Đọc 1 chương sách chuyên môn & tổng hợp ghi chú', tag: 'Chuyên Môn', tagColor: 'purple', important: false, completed: false, period: 'evening' }
  ];

  const tomorrowTasks = [
    { id: 't_java_2', time: '09:00', title: 'Admin môn JAVA: Viết API phân quyền Spring Security & Test Postman', tag: 'Admin môn JAVA', tagColor: 'orange', important: true, completed: false, period: 'morning' },
    { id: 't_review', time: '15:00', title: 'Họp nhóm tổng kết tuần & Review tiến độ', tag: 'Chuyên Môn', tagColor: 'purple', important: false, completed: false, period: 'afternoon' }
  ];

  return {
    version: 3,
    schedule: {
      viewMode: 'day',
      activePreset: 'self-study',
      tags: JSON.parse(JSON.stringify(DEFAULT_TAGS)),
      tasks: defaultTasks,
      days: {
        [today]: {
          activePreset: 'self-study',
          tasks: defaultTasks
        },
        [tomorrow]: {
          activePreset: 'self-study',
          tasks: tomorrowTasks
        }
      }
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
      transactions: []
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

      // Tương thích ngược: Đảm bảo có tags & migrate task sang schema mới
      if (!Array.isArray(parsed.schedule.tags)) {
        parsed.schedule.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
      }
      if (!parsed.schedule.viewMode) {
        parsed.schedule.viewMode = 'day';
      }

      let stateMigrated = false;
      const migrateTaskObj = (t) => {
        if (!t.tag) {
          stateMigrated = true;
          if (t.title && t.title.toLowerCase().includes('java')) {
            t.tag = 'Admin môn JAVA';
            t.tagColor = 'orange';
            t.important = true;
          } else if (t.category === 'project') {
            t.tag = 'Đề Án';
            t.tagColor = 'blue';
          } else if (t.category === 'routine' || t.category === 'health') {
            t.tag = 'Sinh Hoạt';
            t.tagColor = 'emerald';
          } else {
            t.tag = 'Chuyên Môn';
            t.tagColor = 'purple';
          }
        }
        if (!t.tagColor) {
          t.tagColor = t.tag === 'Admin môn JAVA' ? 'orange' : 'purple';
          stateMigrated = true;
        }
        if (t.important === undefined) {
          t.important = false;
          stateMigrated = true;
        }
      };

      if (parsed.schedule.tasks) parsed.schedule.tasks.forEach(migrateTaskObj);
      if (parsed.schedule.days) {
        Object.values(parsed.schedule.days).forEach(day => {
          if (day.tasks) day.tasks.forEach(migrateTaskObj);
        });
      }
      if (stateMigrated) {
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

  broadcastChannel: null,
  sseSource: null,

  // --------------------------------------------------------------------------
  // Real-Time Multi-Browser & Multi-Tab Synchronization (Edge <-> Chrome)
  // --------------------------------------------------------------------------
  init() {
    this.initSyncChannels();
    this.fetchServerState();
  },

  initSyncChannels() {
    // 1. BroadcastChannel: Đồng bộ tức thì 0ms giữa các tab cùng trình duyệt
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('ngaos_sync_channel');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.state) {
            this.handleRemoteState(event.data.state, event.data.sender, event.data.meta);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel fallback:', e);
      }
    }

    // 2. Storage Event fallback
    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const parsed = JSON.parse(event.newValue);
          this.handleRemoteState(parsed, null, { source: 'localStorage' });
        } catch (e) {}
      }
    });

    // 3. Server-Sent Events (SSE): Đồng bộ thời gian thực cho localhost (Edge <-> Chrome)
    if (this.isLocalServer() && typeof EventSource !== 'undefined') {
      try {
        this.sseSource = new EventSource('/api/events');
        this.sseSource.addEventListener('sync', (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data && data.state) {
              this.handleRemoteState(data.state, data.sender, data);
            }
          } catch (e) {
            console.error('Lỗi nhận SSE sync:', e);
          }
        });
      } catch (e) {
        console.warn('Không thể kết nối SSE server:', e);
      }
    }
  },

  isLocalServer() {
    return ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  },

  fetchServerState() {
    if (!this.isLocalServer()) return;
    fetch('/api/state')
      .then(res => res.json())
      .then(data => {
        if (data && data.state) {
          const local = this.getState();
          // Nếu server đã có dữ liệu và mới hơn hoặc local chưa có
          if (!local.updatedAt || (data.state.updatedAt && data.state.updatedAt > local.updatedAt)) {
            this.handleRemoteState(data.state, null, { source: 'init_fetch' });
          } else if (local.updatedAt && (!data.state.updatedAt || local.updatedAt > data.state.updatedAt)) {
            // Đẩy local lên server đồng bộ
            this.pushStateToServer(local);
          }
        }
      })
      .catch(() => {});
  },

  handleRemoteState(remoteState, sender, meta = {}) {
    if (!remoteState || !remoteState.schedule || !remoteState.finance) return;

    const currentState = this.getState();
    const currentUser = this.getCurrentUser();

    // Phát hiện tin nhắn mới từ đối phương
    if (remoteState.chat && Array.isArray(remoteState.chat.messages)) {
      const currentMessages = (currentState.chat && currentState.chat.messages) || [];
      const currentIds = new Set(currentMessages.map(m => m.id));

      const newPartnerMessages = remoteState.chat.messages.filter(m => 
        !currentIds.has(m.id) && m.sender !== currentUser.id
      );

      if (newPartnerMessages.length > 0 && window.ChatModule) {
        newPartnerMessages.forEach(msg => {
          window.ChatModule.handleIncomingMessage(msg);
        });
      }
    }

    // Cập nhật localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remoteState));
    } catch (e) {}

    // Cập nhật giao diện tự động
    if (window.ScheduleModule) window.ScheduleModule.render();
    if (window.FinanceModule) window.FinanceModule.render();
    if (window.ChatModule) {
      window.ChatModule.renderMonitor();
      window.ChatModule.renderMessages();
    }
  },

  pushStateToServer(state, meta = {}) {
    if (!this.isLocalServer()) return;
    const currentUser = this.getCurrentUser();
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state,
        sender: currentUser.id,
        meta
      })
    }).catch(() => {});
  },

  saveState(state, meta = {}) {
    try {
      if (state && typeof state === 'object') {
        state.updatedAt = Date.now();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

      // 1. Gửi đồng bộ sang Server để phát qua SSE tới các trình duyệt khác (Edge <-> Chrome)
      this.pushStateToServer(state, meta);

      // 2. Gửi qua BroadcastChannel tới các tab cùng trình duyệt
      const currentUser = this.getCurrentUser();
      if (this.broadcastChannel) {
        try {
          this.broadcastChannel.postMessage({
            state,
            sender: currentUser.id,
            meta
          });
        } catch (e) {}
      }

      // 3. Tự động đẩy dữ liệu lên Firebase Firestore nếu đã kết nối (Debounced 800ms)
      if (window.CloudSync) {
        if (typeof window.CloudSync.pushUpdateDebounced === 'function') {
          window.CloudSync.pushUpdateDebounced(state);
        } else if (typeof window.CloudSync.pushUpdate === 'function') {
          window.CloudSync.pushUpdate(state);
        }
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
  // Schedule Operations (Date-aware: Month / Week / Day)
  // --------------------------------------------------------------------------
  TAG_PALETTE,
  DEFAULT_TAGS,

  getAllTags() {
    const state = this.getState();
    return state.schedule?.tags || DEFAULT_TAGS;
  },

  getTagColor(tagName) {
    if (!tagName) return 'orange';
    const tags = this.getAllTags();
    const found = tags.find(t => t.name.toLowerCase() === tagName.trim().toLowerCase());
    return found ? found.color : 'orange';
  },

  registerTag(tagName, color = 'orange') {
    if (!tagName || !tagName.trim()) return;
    const name = tagName.trim();
    const state = this.getState();
    if (!state.schedule.tags) state.schedule.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));
    const exists = state.schedule.tags.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (!exists) {
      state.schedule.tags.push({ name, color });
      this.saveState(state);
    } else if (color && exists.color !== color) {
      exists.color = color;
      this.saveState(state);
    }
  },

  createTag(name, color = 'orange') {
    if (!name || !name.trim()) return { success: false, message: 'Tên nhãn không được để trống' };
    const trimmed = name.trim();
    const state = this.getState();
    if (!state.schedule.tags) state.schedule.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));

    const exists = state.schedule.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      return { success: false, message: `Nhãn "${trimmed}" đã tồn tại!` };
    }

    const newTag = { name: trimmed, color: color || 'orange' };
    state.schedule.tags.push(newTag);
    this.saveState(state);
    return { success: true, tag: newTag };
  },

  updateTag(oldName, newName, newColor) {
    if (!oldName || !newName || !newName.trim()) return { success: false, message: 'Dữ liệu không hợp lệ' };
    const trimmedNew = newName.trim();
    const state = this.getState();
    if (!state.schedule.tags) state.schedule.tags = JSON.parse(JSON.stringify(DEFAULT_TAGS));

    const tagIndex = state.schedule.tags.findIndex(t => t.name.toLowerCase() === oldName.trim().toLowerCase());
    if (tagIndex === -1) {
      return { success: false, message: 'Không tìm thấy nhãn cần sửa' };
    }

    if (trimmedNew.toLowerCase() !== oldName.trim().toLowerCase()) {
      const duplicate = state.schedule.tags.find(t => t.name.toLowerCase() === trimmedNew.toLowerCase());
      if (duplicate) {
        return { success: false, message: `Nhãn "${trimmedNew}" đã tồn tại!` };
      }
    }

    const updatedColor = newColor || state.schedule.tags[tagIndex].color || 'orange';
    state.schedule.tags[tagIndex] = { name: trimmedNew, color: updatedColor };

    const normOld = oldName.trim().toLowerCase();
    const updateTaskTag = (t) => {
      if ((t.tag || '').trim().toLowerCase() === normOld) {
        t.tag = trimmedNew;
        t.tagColor = updatedColor;
      }
    };

    if (state.schedule.tasks) state.schedule.tasks.forEach(updateTaskTag);
    if (state.schedule.days) {
      Object.values(state.schedule.days).forEach(day => {
        if (day.tasks) day.tasks.forEach(updateTaskTag);
      });
    }

    this.saveState(state);
    return { success: true, tag: state.schedule.tags[tagIndex] };
  },

  deleteTag(name) {
    if (!name) return { success: false, message: 'Tên nhãn không hợp lệ' };
    const norm = name.trim().toLowerCase();
    const state = this.getState();
    if (!state.schedule.tags) return { success: true };

    state.schedule.tags = state.schedule.tags.filter(t => t.name.toLowerCase() !== norm);

    const clearTaskTag = (t) => {
      if ((t.tag || '').trim().toLowerCase() === norm) {
        t.tag = '';
        t.tagColor = '';
      }
    };

    if (state.schedule.tasks) state.schedule.tasks.forEach(clearTaskTag);
    if (state.schedule.days) {
      Object.values(state.schedule.days).forEach(day => {
        if (day.tasks) day.tasks.forEach(clearTaskTag);
      });
    }

    this.saveState(state);
    return { success: true };
  },

  countTasksByTag(tagName) {
    if (!tagName) return 0;
    const state = this.getState();
    const norm = tagName.trim().toLowerCase();
    let count = 0;
    if (state.schedule?.days) {
      Object.values(state.schedule.days).forEach(day => {
        (day.tasks || []).forEach(t => {
          if ((t.tag || '').trim().toLowerCase() === norm) count++;
        });
      });
    }
    return count;
  },

  getTasksByTag(tagName) {
    if (!tagName) return null;
    const state = this.getState();
    const todayStr = this.getTodayDateStr();
    const days = state.schedule?.days || {};
    const normTag = tagName.trim().toLowerCase();
    const color = this.getTagColor(tagName);

    const result = {
      tag: tagName,
      color: color,
      past: [],
      today: [],
      future: [],
      totalCount: 0,
      completedCount: 0
    };

    const sortedDates = Object.keys(days).sort();
    for (const dStr of sortedDates) {
      const dayTasks = days[dStr]?.tasks || [];
      const matches = dayTasks.filter(t => (t.tag || '').trim().toLowerCase() === normTag);
      for (const t of matches) {
        const item = { ...t, date: dStr };
        result.totalCount++;
        if (t.completed) result.completedCount++;

        if (dStr < todayStr) {
          result.past.push(item);
        } else if (dStr === todayStr) {
          result.today.push(item);
        } else {
          result.future.push(item);
        }
      }
    }

    return result;
  },

  getFourWeeksData(anchorDateStr) {
    const todayStr = this.getTodayDateStr();
    const anchor = new Date(anchorDateStr || todayStr);
    
    // Tìm Thứ Hai của tuần chứa anchorDateStr
    const dayOfWeek = anchor.getDay(); // 0: CN, 1: T2, ..., 6: T7
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const firstMonday = new Date(anchor);
    firstMonday.setDate(anchor.getDate() + diffToMonday);

    const weeks = [];
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

    for (let w = 0; w < 4; w++) {
      const weekStartDate = new Date(firstMonday);
      weekStartDate.setDate(firstMonday.getDate() + w * 7);

      const weekDays = [];
      let totalTasks = 0;
      let completedTasks = 0;

      for (let d = 0; d < 7; d++) {
        const curDate = new Date(weekStartDate);
        curDate.setDate(weekStartDate.getDate() + d);

        const y = curDate.getFullYear();
        const m = String(curDate.getMonth() + 1).padStart(2, '0');
        const dt = String(curDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${dt}`;

        const tasks = this.getDayTasks(dateStr);
        const dayTotal = tasks.length;
        const dayDone = tasks.filter(t => t.completed).length;

        totalTasks += dayTotal;
        completedTasks += dayDone;

        weekDays.push({
          dateStr,
          dayNumber: curDate.getDate(),
          monthNumber: curDate.getMonth() + 1,
          dayName: dayNames[d],
          isToday: dateStr === todayStr,
          isPast: dateStr < todayStr,
          tasks,
          total: dayTotal,
          completed: dayDone
        });
      }

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekStartDate.getDate() + 6);

      const percent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      let weekLabel = w === 0 ? 'Tuần Này (Hiện Tại)' : (w === 1 ? 'Tuần Tới (+1)' : `Tuần +${w}`);
      const startStr = `${weekStartDate.getDate()}/${weekStartDate.getMonth() + 1}`;
      const endStr = `${weekEndDate.getDate()}/${weekEndDate.getMonth() + 1}`;

      weeks.push({
        weekIndex: w,
        label: weekLabel,
        rangeStr: `${startStr} - ${endStr}`,
        days: weekDays,
        totalTasks,
        completedTasks,
        percent
      });
    }

    return weeks;
  },

  getTodayDateStr() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  ensureDaySchedule(state, dateStr) {
    if (!state.schedule) state.schedule = { activePreset: '', tasks: [], days: {} };
    if (!state.schedule.days) state.schedule.days = {};
    if (!state.schedule.days[dateStr]) {
      // Nếu là ngày hôm nay và state.schedule.tasks đang có việc cũ thì khởi tạo từ đó
      const todayStr = this.getTodayDateStr();
      if (dateStr === todayStr && state.schedule.tasks && state.schedule.tasks.length > 0) {
        state.schedule.days[dateStr] = {
          tasks: JSON.parse(JSON.stringify(state.schedule.tasks)),
          activePreset: state.schedule.activePreset || ''
        };
      } else {
        // Ngày mới hoàn toàn độc lập bắt đầu trống
        state.schedule.days[dateStr] = {
          tasks: [],
          activePreset: ''
        };
      }
    }
    return state.schedule.days[dateStr];
  },

  getDayTasks(dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const dayData = this.ensureDaySchedule(state, targetDate);
    return dayData.tasks || [];
  },

  loadPreset(presetKey, dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const template = PRESET_TEMPLATES[presetKey];
    if (!template) return state;

    const dayData = this.ensureDaySchedule(state, targetDate);
    dayData.activePreset = presetKey;
    dayData.tasks = JSON.parse(JSON.stringify(template));

    // Đồng bộ vào state.schedule.tasks nếu là hôm nay
    if (targetDate === this.getTodayDateStr()) {
      state.schedule.activePreset = presetKey;
      state.schedule.tasks = dayData.tasks;
    }

    this.saveState(state);
    return state;
  },

  addTask({ period, time, title, category, date, tag, tagColor, important }) {
    const targetDate = date || this.getTodayDateStr();
    const state = this.getState();
    const currentUser = this.getCurrentUser();

    let taskTag = (tag || '').trim();
    let taskColor = tagColor;

    if (!taskTag) {
      if (title.toLowerCase().includes('java')) {
        taskTag = 'Admin môn JAVA';
        taskColor = 'orange';
      } else if (category === 'project') {
        taskTag = 'Đề Án';
        taskColor = 'blue';
      } else if (category === 'routine' || category === 'health') {
        taskTag = 'Sinh Hoạt';
        taskColor = 'emerald';
      } else {
        taskTag = 'Chuyên Môn';
        taskColor = 'purple';
      }
    }

    if (!taskColor) {
      taskColor = this.getTagColor(taskTag);
    }

    this.registerTag(taskTag, taskColor);

    const newTask = {
      id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      period: period || 'morning',
      time: (time || '').trim(),
      title: title.trim(),
      category: category || 'study',
      tag: taskTag,
      tagColor: taskColor,
      important: !!important,
      completed: false,
      completedAt: null,
      createdBy: currentUser.id,
      date: targetDate
    };

    const dayData = this.ensureDaySchedule(state, targetDate);
    dayData.tasks.push(newTask);

    if (targetDate === this.getTodayDateStr()) {
      state.schedule.tasks = dayData.tasks;
    }

    this.saveState(state);
    return { state, newTask };
  },

  toggleTask(taskId, dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const dayData = this.ensureDaySchedule(state, targetDate);
    const task = dayData.tasks.find(t => t.id === taskId);
    if (task) {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      if (targetDate === this.getTodayDateStr()) {
        state.schedule.tasks = dayData.tasks;
      }
      this.saveState(state);
    }
    return state;
  },

  updateTask(taskId, updates, dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const dayData = this.ensureDaySchedule(state, targetDate);
    const task = dayData.tasks.find(t => t.id === taskId);
    if (task && updates) {
      if (updates.title !== undefined) task.title = updates.title.trim();
      if (updates.time !== undefined) task.time = (updates.time || '').trim();
      if (updates.category !== undefined) task.category = updates.category;
      if (updates.period !== undefined) task.period = updates.period;
      if (updates.tag !== undefined) task.tag = (updates.tag || '').trim();
      if (updates.tagColor !== undefined) task.tagColor = updates.tagColor;
      if (updates.important !== undefined) task.important = !!updates.important;
      if (task.tag) {
        this.registerTag(task.tag, task.tagColor || this.getTagColor(task.tag));
      }
      if (targetDate === this.getTodayDateStr()) {
        state.schedule.tasks = dayData.tasks;
      }
      this.saveState(state);
    }
    return state;
  },

  deleteTask(taskId, dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const dayData = this.ensureDaySchedule(state, targetDate);
    dayData.tasks = dayData.tasks.filter(t => t.id !== taskId);
    if (targetDate === this.getTodayDateStr()) {
      state.schedule.tasks = dayData.tasks;
    }
    this.saveState(state);
    return state;
  },

  clearTasks(dateStr) {
    const targetDate = dateStr || this.getTodayDateStr();
    const state = this.getState();
    const dayData = this.ensureDaySchedule(state, targetDate);
    dayData.tasks = [];
    dayData.activePreset = '';
    if (targetDate === this.getTodayDateStr()) {
      state.schedule.tasks = [];
      state.schedule.activePreset = '';
    }
    this.saveState(state);
    return state;
  },

  getMonthStatsSummary(year, month) {
    const state = this.getState();
    const days = (state.schedule && state.schedule.days) || {};
    const prefix = `${year}-${String(month).padStart(2, '0')}`;
    const result = {};

    Object.keys(days).forEach(dateStr => {
      if (dateStr.startsWith(prefix)) {
        const dTasks = days[dateStr].tasks || [];
        const total = dTasks.length;
        const completed = dTasks.filter(t => t.completed).length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        result[dateStr] = { total, completed, percent };
      }
    });

    return result;
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
        nudgeTitle = 'Tiếp thêm động lực';
        nudgeText = currentUser.id === 'bao'
          ? 'Em bé của anh học giỏi lắm, anh luôn ở đây đồng hành cùng em. Cố lên nào!'
          : 'Hôm nay em học rất tốt, cảm ơn anh đã luôn ủng hộ em!';
        break;
      case 'miss':
        nudgeTitle = 'Gửi gắm yêu thương';
        nudgeText = currentUser.id === 'bao'
          ? 'Đang làm việc mà tự nhiên thấy nhớ cô bé má bánh bao này quá nè! ❤️'
          : 'Em đang học bài mà tự dưng nhớ anh quá đi! ❤️';
        break;
      case 'sleep':
        nudgeTitle = 'Nhắc ngủ sớm';
        nudgeText = currentUser.id === 'bao'
          ? 'Muộn rồi em bé ơi, cất sách vở rồi đi ngủ sớm cho da đẹp và mắt khỏe nha! Chúc em ngủ ngon 🌙'
          : 'Muộn rồi anh ơi, nghỉ ngơi đi ngủ sớm giữ gìn sức khỏe nha! Chúc anh ngủ ngon 🌙';
        break;
      default:
        nudgeTitle = 'Lời nhắn yêu thương';
        nudgeText = 'Gửi gắm yêu thương đến bạn!';
        break;
    }

    return this.addChatMessage(nudgeText, 'nudge', { nudgeType, nudgeTitle });
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
