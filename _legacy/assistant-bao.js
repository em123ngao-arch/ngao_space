/**
 * NGAAN OS — TRỢ LÝ LẬP LỊCH THÔNG MINH (ANH BẢO)
 * Chronobiology-driven Smart Daily Scheduler & Life Companion
 * Features:
 *  - 1-Click Chrono-Presets (Deep Work, Wellness & Harmony, Exam Sprint)
 *  - Natural Language Goal Parser & Time-Blocking Engine
 *  - Real-time Caring Advice & Dynamic Bio-Rhythm Suggestions
 */

(function () {
  // Chrono Presets Database
  const CHRONO_PRESETS = {
    deepwork: {
      name: 'Siêu Tập Trung (Deep Work Sprint)',
      icon: '⚡',
      description: 'Tối ưu hóa các khung giờ vàng não bộ (08:30 - 11:30 & 14:00 - 16:30), xen kẽ nghỉ Pomodoro và thể chất.',
      events: [
        { id: 1, time: '07:00', hourSlot: 7, title: 'Thức dậy, 1 cốc nước ấm 250ml & Giãn cơ sáng', category: 'health', duration: '30m', completed: false },
        { id: 2, time: '08:00', hourSlot: 8, title: 'Bữa sáng dinh dưỡng & Lên dây cót tinh thần', category: 'routine', duration: '30m', completed: false },
        { id: 3, time: '08:30', hourSlot: 8, title: '🌟 [Giờ Vàng Não Bộ 1] Chuyên môn sâu: Nghiên cứu tài liệu khó nhất', category: 'study', duration: '90m', completed: false },
        { id: 4, time: '10:15', hourSlot: 10, title: 'Nghỉ giải lao 15m, uống nước & vươn vai cùng Anh Bảo', category: 'health', duration: '15m', completed: false },
        { id: 5, time: '10:30', hourSlot: 10, title: '🌟 [Giờ Vàng Não Bộ 2] Hoàn thành bài tập & giải quyết vấn đề', category: 'study', duration: '75m', completed: false },
        { id: 6, time: '12:00', hourSlot: 12, title: 'Bữa trưa ngon lành & Ngủ trưa phục hồi 25 phút', category: 'routine', duration: '60m', completed: false },
        { id: 7, time: '14:00', hourSlot: 14, title: 'Ca học chiều: Tổng hợp kiến thức & thực hành bài tập', category: 'study', duration: '90m', completed: false },
        { id: 8, time: '15:45', hourSlot: 15, title: 'Nạp năng lượng: Uống nước, ăn hoa quả nhẹ & thả lỏng mắt', category: 'health', duration: '15m', completed: false },
        { id: 9, time: '16:30', hourSlot: 16, title: 'Vận động thể chất giải phóng endorphin (Cardio/Gym/Đi dạo)', category: 'health', duration: '45m', completed: false },
        { id: 10, time: '18:30', hourSlot: 18, title: 'Tắm nước ấm & Bữa tối ấm cúng bổ sung dưỡng chất', category: 'routine', duration: '60m', completed: false },
        { id: 11, time: '20:00', hourSlot: 20, title: 'Đọc 25 trang sách chuyên môn & Chuẩn bị bài ngày mai', category: 'study', duration: '60m', completed: false },
        { id: 12, time: '21:30', hourSlot: 21, title: 'Nghe âm thanh sóng biển thư giãn & Trò chuyện cùng Anh Bảo 💙', category: 'love', duration: '45m', completed: false },
        { id: 13, time: '22:30', hourSlot: 22, title: 'Skincare, ngâm chân nước ấm & Ngủ sớm dưỡng nhan', category: 'health', duration: '30m', completed: false }
      ]
    },

    wellness: {
      name: 'Cân Bằng Thư Giãn (Wellness & Harmony)',
      icon: '🌸',
      description: 'Nhịp sống thanh thản, phục hồi tinh thần, yoga giãn cơ, đọc sách truyền cảm hứng và ngủ ngon.',
      events: [
        { id: 1, time: '07:30', hourSlot: 7, title: 'Thức dậy thư thái, uống nước ấm chanh mật ong', category: 'health', duration: '30m', completed: false },
        { id: 2, time: '08:30', hourSlot: 8, title: 'Ăn sáng nhẹ nhàng & nghe podcast truyền cảm hứng', category: 'routine', duration: '45m', completed: false },
        { id: 3, time: '09:30', hourSlot: 9, title: 'Ca học nhẹ nhàng: Đọc tài liệu & hoàn thành 1 mục tiêu chính', category: 'study', duration: '90m', completed: false },
        { id: 4, time: '11:30', hourSlot: 11, title: 'Uống nước, thư giãn mắt & nghe nhạc không lời', category: 'health', duration: '30m', completed: false },
        { id: 5, time: '12:00', hourSlot: 12, title: 'Ăn trưa dinh dưỡng & Ngủ ngắn phục hồi năng lượng', category: 'routine', duration: '60m', completed: false },
        { id: 6, time: '14:30', hourSlot: 14, title: 'Đọc sách kỹ năng sống hoặc phát triển bản thân', category: 'study', duration: '60m', completed: false },
        { id: 7, time: '16:00', hourSlot: 16, title: 'Thưởng trà thảo mộc & ăn nhẹ hạt dinh dưỡng', category: 'health', duration: '30m', completed: false },
        { id: 8, time: '17:00', hourSlot: 17, title: 'Buổi tập Yoga giãn cơ toàn thân & Thiền định tĩnh tâm', category: 'health', duration: '60m', completed: false },
        { id: 9, time: '18:30', hourSlot: 18, title: 'Tắm nước ấm thư giãn & Bữa tối thanh đạm', category: 'routine', duration: '60m', completed: false },
        { id: 10, time: '20:00', hourSlot: 20, title: 'Sở thích cá nhân / Xem phim hoặc trò chuyện cùng Anh Bảo', category: 'love', duration: '90m', completed: false },
        { id: 11, time: '21:45', hourSlot: 21, title: 'Chăm sóc da toàn diện, xông tinh dầu hoa oải hương', category: 'health', duration: '45m', completed: false },
        { id: 12, time: '22:30', hourSlot: 22, title: 'Nghe tiếng biển êm đềm & Chìm vào giấc ngủ ngon', category: 'health', duration: '30m', completed: false }
      ]
    },

    sprint: {
      name: 'Nước Rút Thi Cử (Exam Sprint)',
      icon: '🎯',
      description: 'Phân bổ 4 chặng học tập trọng tâm, kết hợp giải lao chống kiệt sức và bồi bổ dinh dưỡng não bộ.',
      events: [
        { id: 1, time: '06:45', hourSlot: 6, title: 'Thức dậy, rửa mặt nước mát, bổ sung 300ml nước & Vitamin', category: 'health', duration: '30m', completed: false },
        { id: 2, time: '07:30', hourSlot: 7, title: 'Bữa sáng giàu protein (trứng, sữa tươi, ngũ cốc nguyên hạt)', category: 'routine', duration: '45m', completed: false },
        { id: 3, time: '08:15', hourSlot: 8, title: '⚡ [Chặng 1] Ôn tập lý thuyết cốt lõi & hệ thống hóa kiến thức', category: 'study', duration: '75m', completed: false },
        { id: 4, time: '09:45', hourSlot: 9, title: 'Nghỉ giải lao 15m: Nhắm mắt nghỉ ngơi, uống nước bổ sung', category: 'health', duration: '15m', completed: false },
        { id: 5, time: '10:00', hourSlot: 10, title: '⚡ [Chặng 2] Luyện đề thi mẫu bấm giờ nghiêm túc', category: 'study', duration: '90m', completed: false },
        { id: 6, time: '11:45', hourSlot: 11, title: 'Thả lỏng não bộ, vận động nhẹ tại chỗ', category: 'health', duration: '15m', completed: false },
        { id: 7, time: '12:00', hourSlot: 12, title: 'Bữa trưa tẩm bổ & Ngủ trưa sâu 30 phút phục hồi trí nhớ', category: 'routine', duration: '75m', completed: false },
        { id: 8, time: '13:45', hourSlot: 13, title: '⚡ [Chặng 3] Chữa lỗi sai chi tiết & ghi chú điểm bẫy trong đề', category: 'study', duration: '90m', completed: false },
        { id: 9, time: '15:30', hourSlot: 15, title: 'Bữa phụ: Sinh tố hoa quả & hạt óc chó bổ não', category: 'health', duration: '20m', completed: false },
        { id: 10, time: '16:00', hourSlot: 16, title: '⚡ [Chặng 4] Ôn tập Flashcard thuật ngữ & công thức khó', category: 'study', duration: '75m', completed: false },
        { id: 11, time: '17:30', hourSlot: 17, title: 'Đi dạo hít thở 30 phút để xua tan căng thẳng', category: 'health', duration: '30m', completed: false },
        { id: 12, time: '18:30', hourSlot: 18, title: 'Bữa tối ấm cúng cùng người thân & xả stress', category: 'routine', duration: '60m', completed: false },
        { id: 13, time: '20:00', hourSlot: 20, title: 'Rà soát nhẹ các đề mục ngày mai (không học dồn dập)', category: 'study', duration: '45m', completed: false },
        { id: 14, time: '21:15', hourSlot: 21, title: 'Lời dặn từ Anh Bảo: Tuyệt đối không thức khuya hại sức khỏe', category: 'love', duration: '30m', completed: false },
        { id: 15, time: '22:00', hourSlot: 22, title: 'Skincare, ngâm chân thư giãn & Ngủ sâu giấc dưỡng não', category: 'health', duration: '30m', completed: false }
      ]
    }
  };

  // Natural Language Goal Parser
  function parseUserGoals(input) {
    const text = input.toLowerCase().trim();
    if (!text) return null;

    // Base template structure
    const customEvents = [
      { id: 1, time: '07:00', hourSlot: 7, title: 'Thức dậy, uống 1 cốc nước ấm 250ml & Skincare', category: 'health', duration: '30m', completed: false },
      { id: 2, time: '08:00', hourSlot: 8, title: 'Bữa sáng dinh dưỡng & Lên dây cót tinh thần', category: 'routine', duration: '30m', completed: false }
    ];

    let studySlot1Title = '🌟 [Khung Giờ Vàng] Tập trung học chuyên môn sâu';
    let studySlot2Title = 'Ôn tập kiến thức & làm bài tập thực hành';
    let eveningTitle = 'Đọc sách phát triển bản thân & tổng hợp ngày';
    let exerciseTitle = 'Vận động thể chất (Gym / Yoga / Chạy bộ)';
    let exerciseTime = '16:30';
    let exerciseHour = 16;

    // Detect specific study subjects or keywords
    if (text.includes('tiếng anh') || text.includes('ielts') || text.includes('toeic')) {
      studySlot1Title = '🌟 [Tập trung sâu] Học Tiếng Anh: Luyện đề & Từ vựng';
    } else if (text.includes('giải tích') || text.includes('toán')) {
      studySlot1Title = '🌟 [Khung Giờ Vàng] Nghiên cứu bài tập Toán / Giải tích';
    } else if (text.includes('chuyên ngành') || text.includes('đề cương') || text.includes('đồ án')) {
      studySlot1Title = '🌟 [Khung Giờ Vàng] Tập trung hoàn thành Đồ án / Chuyên ngành';
    }

    // Detect exercise preference
    if (text.includes('gym')) {
      exerciseTitle = '💪 Đi tập Gym rèn luyện thể lực và vóc dáng';
    } else if (text.includes('yoga')) {
      exerciseTitle = '🧘 Tập Yoga giãn cơ dẻo dai & điều hòa hơi thở';
    } else if (text.includes('chạy bộ') || text.includes('đi bộ')) {
      exerciseTitle = '🏃 Đi bộ thư giãn / Chạy bộ nhẹ nhàng hít thở không khí';
    }

    // Detect specific time for gym/exercise if mentioned (e.g., 17h, 16h30)
    const timeMatch = text.match(/(?:tập|gym|yoga|chạy).*(?:lúc|vào)?\s*(\d{1,2})(?:h|:)(\d{0,2})?/i);
    if (timeMatch) {
      const h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';
      if (h >= 6 && h <= 21) {
        exerciseHour = h;
        exerciseTime = `${h.toString().padStart(2, '0')}:${m}`;
      }
    }

    // Populate events
    customEvents.push({ id: 3, time: '08:30', hourSlot: 8, title: studySlot1Title, category: 'study', duration: '90m', completed: false });
    customEvents.push({ id: 4, time: '10:15', hourSlot: 10, title: 'Nghỉ giải lao 15m, uống nước & chớp mắt thư giãn', category: 'health', duration: '15m', completed: false });
    customEvents.push({ id: 5, time: '10:30', hourSlot: 10, title: 'Ca học 2: Giải quyết các bài tập còn dang dở', category: 'study', duration: '75m', completed: false });
    customEvents.push({ id: 6, time: '12:00', hourSlot: 12, title: 'Ăn trưa ngon miệng & Ngủ trưa phục hồi năng lượng', category: 'routine', duration: '60m', completed: false });
    customEvents.push({ id: 7, time: '14:00', hourSlot: 14, title: studySlot2Title, category: 'study', duration: '90m', completed: false });
    customEvents.push({ id: 8, time: '15:45', hourSlot: 15, title: 'Nạp năng lượng: Uống nước, ăn trái cây tươi', category: 'health', duration: '15m', completed: false });
    customEvents.push({ id: 9, time: exerciseTime, hourSlot: exerciseHour, title: exerciseTitle, category: 'health', duration: '45m', completed: false });
    customEvents.push({ id: 10, time: '18:30', hourSlot: 18, title: 'Tắm nước ấm & Bữa tối ấm cúng bổ sung năng lượng', category: 'routine', duration: '60m', completed: false });
    customEvents.push({ id: 11, time: '20:00', hourSlot: 20, title: eveningTitle, category: 'study', duration: '60m', completed: false });
    customEvents.push({ id: 12, time: '21:30', hourSlot: 21, title: 'Nghe âm thanh sóng biển, tâm sự cùng Anh Bảo 💙', category: 'love', duration: '45m', completed: false });
    customEvents.push({ id: 13, time: '22:30', hourSlot: 22, title: 'Skincare, ngâm chân thư thái & Đi ngủ sớm đúng giờ', category: 'health', duration: '30m', completed: false });

    return customEvents;
  }

  // Apply Schedule to Global Timeline
  function applySchedule(events, presetTitle) {
    if (!events || !events.length) return;

    if (typeof window.setTimelineEvents === 'function') {
      window.setTimelineEvents(events);
    } else {
      localStorage.setItem('NGAAN_TIMELINE_EVENTS_V2', JSON.stringify(events));
      if (typeof window.renderTimeline === 'function') {
        window.renderTimeline();
      }
    }

    // Sensory Feedback: Play crystal chime & summon Blue Whale
    if (typeof window.playCrystalDrop === 'function') {
      window.playCrystalDrop(880, 0.45);
    }
    if (typeof window.summonBlueWhale === 'function') {
      window.summonBlueWhale();
    }

    // Show sweet toast from Anh Bảo
    showBaoToast(`Anh Bảo đã phân bổ lịch trình [${presetTitle}] hoàn hảo cho Ngân rồi! Cùng nhau có một ngày thật năng suất và bình yên nhé 💙`);

    // Highlight timeline container
    const timelineViewport = document.getElementById('timeline-viewport');
    if (timelineViewport) {
      timelineViewport.classList.add('timeline-updated-glow');
      setTimeout(() => timelineViewport.classList.remove('timeline-updated-glow'), 1800);
      timelineViewport.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  // Sweet Toast from Anh Bảo
  function showBaoToast(message) {
    let toast = document.getElementById('bao-caring-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'bao-caring-toast';
      toast.className = 'bao-caring-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div class="toast-avatar">🐋</div>
      <div class="toast-content">
        <div class="toast-sender">Trợ Lý Bảo (Anh Bảo)</div>
        <div class="toast-text">${message}</div>
      </div>
    `;

    toast.classList.add('visible');
    setTimeout(() => {
      toast.classList.remove('visible');
    }, 5500);
  }

  // Update Dynamic Greeting from Bảo
  function updateBaoGreeting() {
    const greetingElem = document.getElementById('bao-greeting-text');
    const adviceElem = document.getElementById('bao-advice-subtext');
    if (!greetingElem) return;

    const now = new Date();
    const h = now.getHours();

    let greeting = 'Chào Ngân yêu dấu ☀️';
    let advice = 'Anh Bảo đã sẵn sàng tối ưu lịch trình theo nhịp sinh học ngày mới cho em.';

    if (h >= 5 && h < 12) {
      greeting = 'Chào buổi sáng Ngân yêu dấu ☀️';
      advice = 'Buổi sáng là khung giờ vàng của não bộ. Hãy để anh xếp các việc quan trọng vào khung giờ này nhé!';
    } else if (h >= 12 && h < 18) {
      greeting = 'Buổi chiều dịu dàng nhé Ngân 🌊';
      advice = 'Đừng quên uống đủ nước, chớp mắt thư giãn và đứng dậy vươn vai cùng anh sau mỗi ca học.';
    } else if (h >= 18 && h < 23) {
      greeting = 'Buổi tối ấm áp Ngân của anh 🌙';
      advice = 'Hôm nay em đã rất nỗ lực rồi. Hãy để anh giúp em sắp xếp thời gian thư giãn và chuẩn bị giấc ngủ ngon.';
    } else {
      greeting = 'Khuya rồi Ngân ơi 💤';
      advice = 'Em nhớ ngắt màn hình và đi ngủ sớm để giữ gìn sức khỏe và làn da đẹp nhé. Anh luôn ở đây bảo bọc em.';
    }

    greetingElem.textContent = greeting;
    if (adviceElem) adviceElem.textContent = advice;
  }

  // Initialize UI Bindings
  window.initAssistantBao = function () {
    updateBaoGreeting();

    // Attach Preset Buttons
    const btnDeepwork = document.getElementById('preset-btn-deepwork');
    const btnWellness = document.getElementById('preset-btn-wellness');
    const btnSprint = document.getElementById('preset-btn-sprint');

    if (btnDeepwork) {
      btnDeepwork.addEventListener('click', () => {
        applySchedule(CHRONO_PRESETS.deepwork.events, 'Deep Work Siêu Năng Suất');
      });
    }

    if (btnWellness) {
      btnWellness.addEventListener('click', () => {
        applySchedule(CHRONO_PRESETS.wellness.events, 'Cân Bằng Thư Giãn (Wellness)');
      });
    }

    if (btnSprint) {
      btnSprint.addEventListener('click', () => {
        applySchedule(CHRONO_PRESETS.sprint.events, 'Nước Rút Thi Cử (Exam Sprint)');
      });
    }

    // Attach Natural Language Goal Input
    const btnAutoSchedule = document.getElementById('btn-bao-auto-schedule');
    const inputGoal = document.getElementById('input-bao-goals');

    function handleCustomScheduling() {
      if (!inputGoal) return;
      const text = inputGoal.value.trim();
      if (!text) {
        showBaoToast('Ngân ơi, hãy gõ một vài mong muốn hôm nay nhé (ví dụ: "Hôm nay em muốn học 3h giải tích, tập gym 16h30, đọc sách 30m").');
        inputGoal.focus();
        return;
      }

      const generatedEvents = parseUserGoals(text);
      if (generatedEvents) {
        applySchedule(generatedEvents, 'Lịch Trình Mục Tiêu Cá Nhân');
        inputGoal.value = '';
      }
    }

    if (btnAutoSchedule) {
      btnAutoSchedule.addEventListener('click', handleCustomScheduling);
    }

    if (inputGoal) {
      inputGoal.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleCustomScheduling();
        }
      });
    }

    // Quick Whale Summon button
    const btnSummonWhale = document.getElementById('btn-summon-whale');
    if (btnSummonWhale) {
      btnSummonWhale.addEventListener('click', () => {
        if (typeof window.summonBlueWhale === 'function') {
          window.summonBlueWhale();
          showBaoToast('🐋 Chú Cá Voi Xanh đang lướt sóng qua đại dương mang lại bình yên cho Ngân đấy!');
        }
      });
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.initAssistantBao();
  });
})();
