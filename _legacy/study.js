/**
 * NGAAN OS — ZEN STUDY HUB & MINIMALIST FOCUS TIMER
 * Clean Circular Timer, Ambient Waves & Subject Goal Checklist
 */

const STUDY_STORAGE_KEY = 'NGAAN_STUDY_TASKS_V2';

let focusInterval = null;
let currentTimerSeconds = 25 * 60;
let initialTimerSeconds = 25 * 60;
let isTimerActive = false;

const defaultStudyTasks = [
  { id: 1, subject: 'Chuyên Ngành', tagColor: 'badge-cyan', title: 'Hoàn thành chương 4: Phân tích mô hình dữ liệu', completed: true },
  { id: 2, subject: 'Đề Án', tagColor: 'badge-purple', title: 'Soạn thảo 5 trang báo cáo tiến độ tuần', completed: false },
  { id: 3, subject: 'Ngoại Ngữ', tagColor: 'badge-amber', title: 'Đọc 1 bài báo nghiên cứu quốc tế & ghi từ vựng', completed: false }
];

let studyTasks = JSON.parse(localStorage.getItem(STUDY_STORAGE_KEY)) || defaultStudyTasks;

function saveStudyTasks() {
  localStorage.setItem(STUDY_STORAGE_KEY, JSON.stringify(studyTasks));
}

window.initStudyModule = function () {
  initFocusTimer();
  renderSubjectTasks();
  setupAddSubjectTask();
};

function formatTimerDigits(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function initFocusTimer() {
  const digits = document.getElementById('timer-digits');
  const circle = document.getElementById('timer-progress-ring');
  const btnStart = document.getElementById('btn-timer-toggle');
  const btnReset = document.getElementById('btn-timer-reset');
  const modePills = document.querySelectorAll('.timer-pill-btn');
  const statusLabel = document.getElementById('timer-status-label');

  if (!digits || !circle) return;

  const circumference = 2 * Math.PI * 75; // radius = 75
  circle.style.strokeDasharray = `${circumference}`;
  circle.style.strokeDashoffset = `0`;

  function updateCircleProgress() {
    const fraction = (initialTimerSeconds - currentTimerSeconds) / initialTimerSeconds;
    const offset = circumference * (1 - fraction);
    circle.style.strokeDashoffset = `${offset}`;
    digits.textContent = formatTimerDigits(currentTimerSeconds);
  }

  // Switch Modes
  modePills.forEach(pill => {
    pill.addEventListener('click', () => {
      if (isTimerActive) {
        clearInterval(focusInterval);
        isTimerActive = false;
        if (btnStart) btnStart.textContent = 'Bắt Đầu';
      }

      modePills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      const mins = parseInt(pill.getAttribute('data-mins'), 10);
      initialTimerSeconds = mins * 60;
      currentTimerSeconds = initialTimerSeconds;
      updateCircleProgress();
      if (statusLabel) statusLabel.textContent = 'Sẵn sàng';
      if (window.playChime) window.playChime(520, 0.1);
    });
  });

  // Start / Pause
  if (btnStart) {
    btnStart.onclick = () => {
      if (isTimerActive) {
        clearInterval(focusInterval);
        isTimerActive = false;
        btnStart.textContent = 'Tiếp Tục';
        if (statusLabel) statusLabel.textContent = 'Tạm dừng';
      } else {
        isTimerActive = true;
        btnStart.textContent = 'Tạm Dừng';
        if (statusLabel) statusLabel.textContent = 'Đang tập trung';

        focusInterval = setInterval(() => {
          if (currentTimerSeconds > 0) {
            currentTimerSeconds--;
            updateCircleProgress();
          } else {
            clearInterval(focusInterval);
            isTimerActive = false;
            btnStart.textContent = 'Bắt Đầu';
            currentTimerSeconds = initialTimerSeconds;
            updateCircleProgress();
            if (statusLabel) statusLabel.textContent = 'Hoàn thành';
            if (window.playChime) window.playChime(880, 0.4);
            alert('🌸 Xuất sắc! Bé đã hoàn thành một phiên học tập trung. Hãy để mắt nghỉ ngơi 5 phút nhé!');
          }
        }, 1000);
      }
      if (window.playChime) window.playChime(620, 0.12);
    };
  }

  // Reset
  if (btnReset) {
    btnReset.onclick = () => {
      clearInterval(focusInterval);
      isTimerActive = false;
      currentTimerSeconds = initialTimerSeconds;
      updateCircleProgress();
      if (btnStart) btnStart.textContent = 'Bắt Đầu';
      if (statusLabel) statusLabel.textContent = 'Sẵn sàng';
      if (window.playChime) window.playChime(420, 0.1);
    };
  }

  updateCircleProgress();
}

// Render Subject Tasks
function renderSubjectTasks() {
  const container = document.getElementById('subject-tasks-container');
  if (!container) return;

  container.innerHTML = '';

  studyTasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = `subject-item-card ${task.completed ? 'done' : ''}`;
    card.innerHTML = `
      <div class="subject-item-left">
        <span class="subject-badge-pill ${task.tagColor}">${task.subject}</span>
        <span class="subject-title-text">${task.title}</span>
      </div>
      <div style="display:flex;align-items:center;gap:8px;">
        <button class="event-check-btn" title="Hoàn thành">${task.completed ? '✓' : ''}</button>
        <button class="btn-delete-task" style="background:none;border:none;color:var(--text-tertiary);cursor:pointer;font-size:13px;" title="Xóa">✕</button>
      </div>
    `;

    card.querySelector('.event-check-btn').onclick = () => {
      task.completed = !task.completed;
      saveStudyTasks();
      if (window.playChime) window.playChime(task.completed ? 750 : 420, 0.12);
      renderSubjectTasks();
    };

    card.querySelector('.btn-delete-task').onclick = (e) => {
      e.stopPropagation();
      studyTasks.splice(idx, 1);
      saveStudyTasks();
      renderSubjectTasks();
    };

    container.appendChild(card);
  });
}

// Quick Add Subject Task
function setupAddSubjectTask() {
  const btn = document.getElementById('btn-add-subject-task');
  const inputTitle = document.getElementById('input-subject-task-title');
  const selectSubj = document.getElementById('select-subject-type');

  if (!btn || !inputTitle) return;

  btn.onclick = () => {
    const val = inputTitle.value.trim();
    if (!val) return;

    let subj = 'Chuyên Ngành';
    let color = 'badge-cyan';
    if (selectSubj && selectSubj.value === 'de-an') {
      subj = 'Đề Án';
      color = 'badge-purple';
    } else if (selectSubj && selectSubj.value === 'ngoai-ngu') {
      subj = 'Ngoại Ngữ';
      color = 'badge-amber';
    }

    studyTasks.push({
      id: Date.now(),
      subject: subj,
      tagColor: color,
      title: val,
      completed: false
    });

    saveStudyTasks();
    inputTitle.value = '';
    if (window.playChime) window.playChime(640, 0.12);
    renderSubjectTasks();
  };

  inputTitle.onkeypress = (e) => {
    if (e.key === 'Enter') btn.click();
  };
}
