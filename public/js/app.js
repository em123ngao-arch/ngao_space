/**
 * NGAOS — MAIN APP CONTROLLER (V3)
 * Lightweight orchestrator:
 * - 2-User Auth System (Bảo & Ngân)
 * - Realtime Vietnamese Date
 * - Segmented Tab Switching
 * - Clean SVG Toast Notifications (Zero Emojis)
 * - Audio Chime Synthesizer
 * - Data Backup / Restore & Reset
 */

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

window.playChime = function (freq = 587.33, duration = 0.2) {
  try {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.35, audioCtx.currentTime + duration);

    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {}
};

// ----------------------------------------------------------------------------
// Toast Notification Engine (Vector Icons & Modern Glass HUD)
// ----------------------------------------------------------------------------
window.showToast = function (message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const pill = document.createElement('div');
  pill.className = `toast-pill toast-${type}`;

  let iconSvg = '';
  if (type === 'success') {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
  } else if (type === 'warning') {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
  } else {
    iconSvg = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
  }

  pill.innerHTML = `
    <span class="toast-icon-wrap">${iconSvg}</span>
    <span class="toast-text">${message}</span>
  `;

  container.appendChild(pill);

  requestAnimationFrame(() => {
    pill.classList.add('show');
  });

  setTimeout(() => {
    pill.classList.remove('show');
    setTimeout(() => {
      pill.remove();
    }, 350);
  }, 3200);
};

// ----------------------------------------------------------------------------
// Realtime Date
// ----------------------------------------------------------------------------
function updateHeaderDate() {
  const dateElem = document.getElementById('header-realtime-date');
  if (!dateElem) return;

  const now = new Date();
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const dayName = days[now.getDay()];
  const dateNum = now.getDate().toString().padStart(2, '0');
  const monthNum = (now.getMonth() + 1).toString().padStart(2, '0');

  dateElem.textContent = `${dayName}, ${dateNum}/${monthNum}`;
}

// ----------------------------------------------------------------------------
// Tab Switching
// ----------------------------------------------------------------------------
function setupTabSwitching() {
  const tabBtnSchedule = document.getElementById('tab-btn-schedule');
  const tabBtnFinance = document.getElementById('tab-btn-finance');
  const viewSchedule = document.getElementById('view-schedule');
  const viewFinance = document.getElementById('view-finance');

  function switchTab(target) {
    if (target === 'schedule') {
      tabBtnSchedule?.classList.add('active');
      tabBtnSchedule?.setAttribute('aria-selected', 'true');
      tabBtnFinance?.classList.remove('active');
      tabBtnFinance?.setAttribute('aria-selected', 'false');

      viewSchedule?.classList.add('active');
      viewFinance?.classList.remove('active');
    } else {
      tabBtnFinance?.classList.add('active');
      tabBtnFinance?.setAttribute('aria-selected', 'true');
      tabBtnSchedule?.classList.remove('active');
      tabBtnSchedule?.setAttribute('aria-selected', 'false');

      viewFinance?.classList.add('active');
      viewSchedule?.classList.remove('active');
    }
    window.playChime(560, 0.12);
  }

  tabBtnSchedule?.addEventListener('click', () => switchTab('schedule'));
  tabBtnFinance?.addEventListener('click', () => switchTab('finance'));
}

// ----------------------------------------------------------------------------
// User Guide Modal & Shortcut Controller
// ----------------------------------------------------------------------------
function setupGuideModal() {
  const btnOpen = document.getElementById('btn-open-guide');
  const modal = document.getElementById('modal-guide');
  const btnClose = document.getElementById('btn-close-guide-modal');
  const btnConfirm = document.getElementById('btn-guide-confirm');

  if (!modal) return;

  const openGuide = () => {
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    window.playChime(523.25, 0.18);
  };

  const closeGuide = (markSeen = false) => {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    if (markSeen) {
      try {
        localStorage.setItem('ngaos_seen_guide', 'true');
      } catch (e) {}
    }
  };

  btnOpen?.addEventListener('click', openGuide);
  btnClose?.addEventListener('click', () => closeGuide(false));
  btnConfirm?.addEventListener('click', () => {
    closeGuide(true);
    if (window.showToast) {
      window.showToast('Chúc bạn một ngày học tập & làm việc thật năng suất! 🚀', 'success');
    }
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeGuide(false);
  });

  // Keyboard shortcut: Press '?' anywhere (outside input/textarea) to toggle guide, Esc to close
  document.addEventListener('keydown', (e) => {
    const isEditing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (e.key === '?' && !isEditing) {
      e.preventDefault();
      if (modal.classList.contains('active')) {
        closeGuide(false);
      } else {
        openGuide();
      }
    } else if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeGuide(false);
    }
  });

  // Open guide if URL route has /guide or #guide or ?guide=1
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (path === '/guide' || hash === '#guide' || search.includes('guide')) {
    setTimeout(openGuide, 400);
  } else {
    // First-time visitor gentle prompt
    try {
      if (!localStorage.getItem('ngaos_seen_guide')) {
        setTimeout(openGuide, 1200);
      }
    } catch (e) {}
  }
}

// ----------------------------------------------------------------------------
// Data Tools
// ----------------------------------------------------------------------------
function setupDataTools() {
  const btnExport = document.getElementById('btn-export-data');
  const btnImport = document.getElementById('btn-import-data');
  const fileInput = document.getElementById('file-import-json');
  const btnReset = document.getElementById('btn-reset-demo');

  btnExport?.addEventListener('click', () => {
    StorageManager.exportJSON();
    window.showToast('Đã tải xuống file sao lưu dữ liệu!', 'success');
  });

  btnImport?.addEventListener('click', () => {
    fileInput?.click();
  });

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target.result;
      const res = StorageManager.importJSON(content);
      if (res.success) {
        ScheduleModule.render();
        FinanceModule.render();
        AuthModule.render();
        window.showToast('Khôi phục dữ liệu thành công!', 'success');
        window.playChime(750, 0.2);
      } else {
        window.showToast('Lỗi: File dữ liệu không hợp lệ!', 'warning');
      }
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  btnReset?.addEventListener('click', () => {
    if (confirm('Bạn có muốn làm mới dữ liệu về trạng thái sạch ban đầu không?')) {
      StorageManager.resetToClean();
      ScheduleModule.render();
      FinanceModule.render();
      AuthModule.render();
      window.showToast('Đã đặt lại dữ liệu sạch ban đầu!', 'info');
      window.playChime(600, 0.15);
    }
  });
}

window.playMessengerChime = function () {
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;

    // Tone 1: High crisp G5 (784Hz)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.08, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.16);

    // Tone 2: Harmonic higher C6 (1046.5Hz)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046.5, now + 0.08);
    gain2.gain.setValueAtTime(0.09, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.28);
  } catch (e) {}
};

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderDate();
  setupTabSwitching();
  setupGuideModal();
  setupDataTools();

  // Initialize Storage Sync (Edge <-> Chrome & multi-tab)
  if (window.StorageManager && typeof StorageManager.init === 'function') {
    StorageManager.init();
  }

  // Initialize Modules
  if (window.CloudSync) CloudSync.init();
  if (window.AuthModule) AuthModule.init();
  if (window.ScheduleModule) ScheduleModule.init();
  if (window.FinanceModule) FinanceModule.init();
  if (window.ChatModule) ChatModule.init();

  // Ocean Day/Night Theme Toggle Event
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  btnThemeToggle?.addEventListener('click', () => {
    if (window.OceanEngine) {
      const nextTheme = window.OceanEngine.toggleTheme();
      window.playChime(nextTheme === 'night' ? 440 : 660, 0.15);
      if (window.showToast) {
        window.showToast(nextTheme === 'night' ? 'Đã bật chế độ: Biển Đêm Ánh Trăng 🌙' : 'Đã bật chế độ: Biển Ngày Tươi Mát ☀️', 'info');
      }
    }
  });

  // Ocean Waves Relaxation Sound Toggle Event
  const btnSoundToggle = document.getElementById('btn-sound-toggle');
  btnSoundToggle?.addEventListener('click', () => {
    if (window.OceanEngine) {
      const isPlaying = window.OceanEngine.toggleSound();
      if (isPlaying) {
        if (window.showToast) window.showToast('Đang phát tiếng sóng biển vỗ về thư giãn... 🌊', 'success');
      } else {
        if (window.showToast) window.showToast('Đã dừng tiếng sóng biển.', 'info');
      }
    }
  });
});
