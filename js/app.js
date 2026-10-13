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
// Toast Notification Engine (Vector Icons)
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

  const iconSvg = window.AppIcons ? (type === 'success' ? window.AppIcons.check : window.AppIcons.target) : '•';

  pill.innerHTML = `
    <span class="toast-icon-wrap">${iconSvg}</span>
    <span>${message}</span>
  `;

  container.appendChild(pill);

  requestAnimationFrame(() => {
    pill.classList.add('show');
  });

  setTimeout(() => {
    pill.classList.remove('show');
    setTimeout(() => {
      pill.remove();
    }, 250);
  }, 2600);
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
// Care / Encouragement Modal
// ----------------------------------------------------------------------------
function setupCareModal() {
  const pill = document.getElementById('care-note-pill');
  const modal = document.getElementById('modal-love');
  const btnClose = document.getElementById('btn-close-modal-love');

  if (!modal) return;

  pill?.addEventListener('click', () => {
    modal.classList.add('active');
    window.playChime(620, 0.2);
  });

  btnClose?.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
  });
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

// ----------------------------------------------------------------------------
// Initialization
// ----------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderDate();
  setupTabSwitching();
  setupCareModal();
  setupDataTools();

  // Initialize Modules
  if (window.CloudSync) CloudSync.init();
  if (window.AuthModule) AuthModule.init();
  if (window.ScheduleModule) ScheduleModule.init();
  if (window.FinanceModule) FinanceModule.init();
  if (window.ChatModule) ChatModule.init();
});
