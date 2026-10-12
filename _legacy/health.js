/**
 * NGAAN OS - HEALTH & VITALITY MODULE
 * Water Intake Tracker, Sleep & Battery, Vitamins & Wellness Checklists
 */

window.initHealthModule = function () {
  renderWaterTracker();
  renderSleepAndBattery();
  renderHealthChecklist();
};

// ============================================================================
// Water Tracker (8 Cups = 2000ml)
// ============================================================================
function renderWaterTracker() {
  const container = document.getElementById('water-cups-grid');
  const progressFill = document.getElementById('water-progress-fill');
  const progressText = document.getElementById('water-progress-text');
  const quickMetricWater = document.getElementById('metric-water-val');

  if (!container) return;

  container.innerHTML = '';
  const cups = AppState.health.waterCups;
  let drunkCount = 0;

  cups.forEach((isDrunk, index) => {
    if (isDrunk) drunkCount++;
    const cup = document.createElement('div');
    cup.className = `cup-item ${isDrunk ? 'drunk' : ''}`;
    cup.setAttribute('id', `cup-${index + 1}`);
    cup.innerHTML = `
      <span class="cup-icon">${isDrunk ? '💧' : '🥛'}</span>
      <span class="cup-label">${(index + 1) * 250}ml</span>
    `;

    cup.addEventListener('click', () => {
      cups[index] = !cups[index];
      saveState();
      playWaterSound();
      renderWaterTracker();

      // Check if all cups reached
      const newDrunkCount = cups.filter(c => c).length;
      if (newDrunkCount === 8) {
        triggerConfetti();
      }
    });

    container.appendChild(cup);
  });

  const totalMl = drunkCount * 250;
  const percentage = Math.round((totalMl / 2000) * 100);

  if (progressFill) progressFill.style.width = `${percentage}%`;
  if (progressText) progressText.textContent = `${totalMl} / 2000 ml (${percentage}%)`;
  if (quickMetricWater) quickMetricWater.textContent = `${totalMl}ml`;
}

// ============================================================================
// Sleep & Energy Battery Level
// ============================================================================
function renderSleepAndBattery() {
  const sleepHours = AppState.health.sleepHours || 7.5;
  const batteryPercentElem = document.getElementById('battery-percent-display');
  const batteryBar = document.getElementById('battery-level-bar');
  const sleepDesc = document.getElementById('sleep-time-desc');
  const quickMetricEnergy = document.getElementById('metric-energy-val');

  // Compute energy based on sleep
  let energy = Math.min(100, Math.round((sleepHours / 8) * 100));
  if (sleepHours < 5) energy = 45;

  AppState.health.energyLevel = energy;

  if (batteryPercentElem) batteryPercentElem.textContent = `${energy}%`;
  if (batteryBar) {
    batteryBar.style.width = `${energy}%`;
    if (energy < 60) {
      batteryBar.style.background = 'linear-gradient(90deg, #f59e0b, #ef4444)';
    } else {
      batteryBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
    }
  }
  if (sleepDesc) {
    sleepDesc.textContent = `Ngủ ngon ${sleepHours} tiếng đêm qua`;
  }
  if (quickMetricEnergy) quickMetricEnergy.textContent = `${energy}%`;
}

// ============================================================================
// Health & Routine Checklist
// ============================================================================
function renderHealthChecklist() {
  const container = document.getElementById('health-checklist-items');
  if (!container) return;

  const items = [
    { id: 'vitamin', text: 'Uống Vitamin D & Sắt sau ăn sáng', completed: AppState.health.vitaminsTaken },
    { id: 'workout', text: 'Vận động / Yoga nhẹ nhàng 20 phút', completed: AppState.health.workoutDone },
    { id: 'skincare', text: 'Skincare đầy đủ & Kem chống nắng', completed: AppState.health.skincareDone || false },
    { id: 'stretch', text: 'Thư giãn mắt sau các phiên học', completed: AppState.health.stretchDone || false }
  ];

  container.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = `checklist-item ${item.completed ? 'completed' : ''}`;
    row.innerHTML = `
      <div class="checklist-left">
        <div class="custom-checkbox">
          ${item.completed ? '<span style="color:#fff;font-size:12px">✓</span>' : ''}
        </div>
        <span class="checklist-text">${item.text}</span>
      </div>
      <span style="font-size:12px;color:var(--text-dim);">${item.completed ? 'Hoàn thành' : 'Chưa'}</span>
    `;

    row.addEventListener('click', () => {
      if (item.id === 'vitamin') AppState.health.vitaminsTaken = !AppState.health.vitaminsTaken;
      if (item.id === 'workout') AppState.health.workoutDone = !AppState.health.workoutDone;
      if (item.id === 'skincare') AppState.health.skincareDone = !AppState.health.skincareDone;
      if (item.id === 'stretch') AppState.health.stretchDone = !AppState.health.stretchDone;

      saveState();
      playChime(item.completed ? 450 : 700, 0.15);
      renderHealthChecklist();
    });

    container.appendChild(row);
  });
}
