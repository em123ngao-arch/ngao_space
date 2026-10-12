/**
 * NGAOS — TIMELINE & DAILY PLANNER
 * Clean, minimal, human-friendly daily schedule
 */

const TIMELINE_STORAGE_KEY = 'NGAAN_TIMELINE_EVENTS_V3';

const defaultEvents = [
  { id: 1, time: '07:00', hourSlot: 7, title: 'Thức dậy & Skincare buổi sáng', category: 'routine', duration: '30m', completed: true },
  { id: 2, time: '08:00', hourSlot: 8, title: 'Ăn sáng & Xem lại việc hôm nay', category: 'routine', duration: '30m', completed: true },
  { id: 3, time: '08:30', hourSlot: 8, title: 'Học chuyên môn: Nghiên cứu tài liệu', category: 'study', duration: '90m', completed: false },
  { id: 4, time: '11:30', hourSlot: 11, title: 'Nghỉ giải lao, uống nước', category: 'health', duration: '30m', completed: false },
  { id: 5, time: '12:00', hourSlot: 12, title: 'Ăn trưa & Nghỉ trưa', category: 'routine', duration: '60m', completed: false },
  { id: 6, time: '14:00', hourSlot: 14, title: 'Làm bài tập & Thực hành đề án', category: 'study', duration: '90m', completed: false },
  { id: 7, time: '17:30', hourSlot: 17, title: 'Vận động nhẹ / Đi dạo thư giãn', category: 'health', duration: '45m', completed: false },
  { id: 8, time: '19:00', hourSlot: 19, title: 'Bữa tối & Thư giãn', category: 'routine', duration: '60m', completed: false },
  { id: 9, time: '20:30', hourSlot: 20, title: 'Đọc sách & Ôn bài', category: 'study', duration: '60m', completed: false },
  { id: 10, time: '22:30', hourSlot: 22, title: 'Skincare & Đi ngủ sớm', category: 'health', duration: '30m', completed: false }
];

let timelineEvents = JSON.parse(localStorage.getItem(TIMELINE_STORAGE_KEY)) || defaultEvents;

function saveTimelineEvents() {
  localStorage.setItem(TIMELINE_STORAGE_KEY, JSON.stringify(timelineEvents));
}

window.initTimeline = function () {
  renderTimeline();
  updateNowIndicator();
  setInterval(updateNowIndicator, 60000);
  setupQuickAddEvent();
};

window.renderTimeline = function () {
  renderTimeline();
};

window.setTimelineEvents = function (newEvents) {
  timelineEvents = newEvents;
  saveTimelineEvents();
  renderTimeline();
  updateNowIndicator();
};

function renderTimeline() {
  const container = document.getElementById('timeline-slots-container');
  if (!container) return;

  container.innerHTML = '';

  for (let h = 6; h <= 23; h++) {
    const hourFormatted = `${h.toString().padStart(2, '0')}:00`;
    const slot = document.createElement('div');
    slot.className = 'timeline-hour-slot';
    slot.setAttribute('data-hour', h);

    const label = document.createElement('div');
    label.className = 'hour-label';
    label.textContent = hourFormatted;

    const track = document.createElement('div');
    track.className = 'hour-content-track';
    track.setAttribute('id', `hour-track-${h}`);

    const matchingEvents = timelineEvents.filter(ev => ev.hourSlot === h);
    matchingEvents.forEach(ev => {
      const card = createEventCard(ev);
      track.appendChild(card);
    });

    slot.appendChild(label);
    slot.appendChild(track);
    container.appendChild(slot);
  }
}

function createEventCard(ev) {
  const card = document.createElement('div');
  card.className = `timeline-event-card cat-${ev.category} ${ev.completed ? 'completed' : ''}`;
  card.setAttribute('id', `event-card-${ev.id}`);

  let catLabel = 'Lịch ngày';
  if (ev.category === 'study') catLabel = 'Học tập';
  else if (ev.category === 'health') catLabel = 'Sức khỏe';
  else if (ev.category === 'love') catLabel = 'Yêu thương';

  card.innerHTML = `
    <div class="event-details">
      <div class="event-title">${ev.title}</div>
      <div class="event-meta">
        <span>${ev.time}</span>
        <span>•</span>
        <span>${ev.duration}</span>
        <span class="event-tag">${catLabel}</span>
      </div>
    </div>
    <button class="event-check-btn" title="Hoàn thành">${ev.completed ? '✓' : ''}</button>
  `;

  card.querySelector('.event-check-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    ev.completed = !ev.completed;
    saveTimelineEvents();
    if (window.playChime) window.playChime(ev.completed ? 750 : 450, 0.12);
    renderTimeline();
    if (window.updateLifeBalanceScore) window.updateLifeBalanceScore();
  });

  return card;
}

function updateNowIndicator() {
  const line = document.getElementById('now-indicator');
  const badge = document.getElementById('now-indicator-badge');
  const container = document.getElementById('timeline-slots-container');
  if (!line || !container) return;

  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  if (badge) {
    badge.textContent = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  if (h < 6 || h >= 24) {
    line.style.display = 'none';
    return;
  }

  line.style.display = 'flex';
  const targetSlot = container.querySelector(`[data-hour="${h}"]`);
  if (targetSlot) {
    const slotTop = targetSlot.offsetTop;
    const slotHeight = targetSlot.offsetHeight;
    const offsetInSlot = (m / 60) * slotHeight;
    line.style.top = `${slotTop + offsetInSlot}px`;
  }
}

function setupQuickAddEvent() {
  const btn = document.getElementById('btn-quick-add-event');
  const inputTitle = document.getElementById('input-event-title');
  const inputTime = document.getElementById('input-event-time');
  const selectCat = document.getElementById('select-event-cat');

  if (!btn || !inputTitle || !inputTime) return;

  btn.onclick = () => {
    const title = inputTitle.value.trim();
    const timeVal = inputTime.value || '15:00';
    const cat = selectCat ? selectCat.value : 'study';

    if (!title) return;

    const parts = timeVal.split(':');
    const hourSlot = parseInt(parts[0], 10);

    const newEv = {
      id: Date.now(),
      time: timeVal,
      hourSlot: hourSlot,
      title: title,
      category: cat,
      duration: '45m',
      completed: false
    };

    timelineEvents.push(newEv);
    timelineEvents.sort((a, b) => a.time.localeCompare(b.time));
    saveTimelineEvents();

    inputTitle.value = '';
    if (window.playChime) window.playChime(650, 0.15);
    renderTimeline();
    updateNowIndicator();
    if (window.updateLifeBalanceScore) window.updateLifeBalanceScore();
  };

  inputTitle.onkeypress = (e) => {
    if (e.key === 'Enter') btn.click();
  };
}
