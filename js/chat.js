/**
 * NGAOS — 2-USER CHAT & LIVE STUDY MONITOR MODULE (BẢO & NGÂN)
 * Features:
 * 1. Floating Sea-Glass Chat Drawer
 * 2. Live Study Monitor: Bạn trai theo dõi thời gian thực tiến độ học tập của bạn gái
 * 3. 1-Touch Gentle Nudges: Nhắc uống nước, nghỉ mắt, ăn cơm, động viên
 * 4. Real-time Messaging: Trò chuyện 2 người mượt mà, phân biệt góc nhìn theo user
 */

(function () {
  'use strict';

  window.ChatModule = {
    isOpen: false,
    unreadCount: 0,

    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const btnToggle = document.getElementById('btn-floating-chat');
      const btnClose = document.getElementById('btn-close-chat-drawer');
      const formChat = document.getElementById('chat-input-form');
      const inputChat = document.getElementById('chat-input-text');

      btnToggle?.addEventListener('click', () => {
        this.toggleChat();
      });

      btnClose?.addEventListener('click', () => {
        this.closeChat();
      });

      // Quick Nudge Buttons
      const nudgeBtns = document.querySelectorAll('.btn-quick-nudge');
      nudgeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const nudgeType = btn.getAttribute('data-nudge');
          if (nudgeType) {
            this.sendNudge(nudgeType);
          }
        });
      });

      // Send Message Form
      formChat?.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = inputChat?.value.trim();
        if (text) {
          StorageManager.addChatMessage(text, 'text');
          inputChat.value = '';
          this.render();
          this.scrollToBottom();
          if (window.playChime) window.playChime(640, 0.15);
        }
      });
    },

    toggleChat() {
      if (this.isOpen) {
        this.closeChat();
      } else {
        this.openChat();
      }
    },

    openChat() {
      const drawer = document.getElementById('floating-chat-drawer');
      if (drawer) {
        drawer.classList.add('active');
        document.body.classList.add('chat-open');
        this.isOpen = true;
        this.unreadCount = 0;
        this.updateBadge();
        this.render();
        this.scrollToBottom();
        if (window.playChime) window.playChime(560, 0.12);

        // Auto focus input on desktop
        setTimeout(() => {
          document.getElementById('chat-input-text')?.focus();
        }, 150);
      }
    },

    closeChat() {
      const drawer = document.getElementById('floating-chat-drawer');
      if (drawer) {
        drawer.classList.remove('active');
        document.body.classList.remove('chat-open');
        this.isOpen = false;
      }
    },

    sendNudge(nudgeType) {
      const msg = StorageManager.sendQuickNudge(nudgeType);
      if (msg) {
        this.render();
        this.scrollToBottom();
        if (window.playChime) window.playChime(780, 0.22);
        if (window.showToast) {
          window.showToast(`Đã gửi lời nhắc yêu thương!`, 'success');
        }
      }
    },

    render() {
      this.renderMonitor();
      this.renderMessages();
      this.renderInputPlaceholder();
    },

    // ------------------------------------------------------------------------
    // Live Study Monitor Bar
    // ------------------------------------------------------------------------
    renderMonitor() {
      const monitorContainer = document.getElementById('chat-monitor-content');
      if (!monitorContainer) return;

      const currentUser = StorageManager.getCurrentUser();
      const studyStatus = StorageManager.getStudyStatusSummary();
      const partner = currentUser.id === 'bao' ? StorageManager.USERS[1] : StorageManager.USERS[0];

      if (currentUser.id === 'bao') {
        // Góc nhìn của Bảo: Theo dõi tiến độ học tập của Ngân
        let progressDetail = '';
        if (studyStatus.total > 0) {
          progressDetail = `
            <div class="monitor-stats-row">
              <span class="monitor-fraction">${studyStatus.completed}/${studyStatus.total} bài (${studyStatus.percent}%)</span>
              <span class="monitor-period-tag">${studyStatus.periodName}</span>
            </div>
            <div class="progress-bar-track monitor-progress-bar">
              <div class="progress-bar-fill fill-emerald" style="width: ${studyStatus.percent}%;"></div>
            </div>
            ${studyStatus.lastCompletedTitle ? `
              <div class="monitor-recent-activity">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Vừa xong: <strong>${studyStatus.lastCompletedTitle}</strong></span>
              </div>
            ` : ''}
          `;
        } else {
          progressDetail = `
            <div class="monitor-empty-text">Ngân chưa lên lịch học hôm nay. Hãy nhắn tin nhắc cô ấy nhé!</div>
          `;
        }

        monitorContainer.innerHTML = `
          <div class="monitor-card">
            <div class="monitor-header">
              <div class="monitor-user-info">
                <div class="auth-avatar-mini ngan-avatar">
                  ${window.AppIcons ? window.AppIcons.user : ''}
                </div>
                <div>
                  <h4 class="monitor-title">Tiến Độ Học Tập Của Ngân</h4>
                  <span class="monitor-sub">Cập nhật trực tiếp thời gian thực</span>
                </div>
              </div>
              <span class="live-dot-pulse" title="Đang kết nối trực tiếp"></span>
            </div>
            ${progressDetail}
          </div>
        `;
      } else {
        // Góc nhìn của Ngân: Đồng hành cùng Bảo
        monitorContainer.innerHTML = `
          <div class="monitor-card">
            <div class="monitor-header">
              <div class="monitor-user-info">
                <div class="auth-avatar-mini bao-avatar">
                  ${window.AppIcons ? window.AppIcons.shield : ''}
                </div>
                <div>
                  <h4 class="monitor-title">Bảo Đang Đồng Hành Cùng Bạn</h4>
                  <span class="monitor-sub">Tiến độ hôm nay: ${studyStatus.completed}/${studyStatus.total} việc (${studyStatus.percent}%)</span>
                </div>
              </div>
              <span class="live-dot-pulse" title="Đang kết nối trực tiếp"></span>
            </div>
            <div class="progress-bar-track monitor-progress-bar">
              <div class="progress-bar-fill fill-emerald" style="width: ${studyStatus.percent}%;"></div>
            </div>
          </div>
        `;
      }
    },

    // ------------------------------------------------------------------------
    // Messages Stream
    // ------------------------------------------------------------------------
    renderMessages() {
      const messagesList = document.getElementById('chat-messages-stream');
      if (!messagesList) return;

      const currentUser = StorageManager.getCurrentUser();
      const messages = StorageManager.getChatMessages();

      if (messages.length === 0) {
        messagesList.innerHTML = `
          <div class="chat-empty-state">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            <p>Chưa có tin nhắn nào. Bấm lời nhắc nhanh hoặc nhắn tin bên dưới để bắt đầu nhé!</p>
          </div>
        `;
        return;
      }

      messagesList.innerHTML = messages.map(msg => {
        const isMe = msg.sender === currentUser.id;
        const senderUser = StorageManager.USERS.find(u => u.id === msg.sender) || { name: msg.senderName || 'Người dùng' };
        const isNudge = msg.type === 'nudge';

        const avatarSvg = msg.sender === 'bao' 
          ? (window.AppIcons ? window.AppIcons.shield : 'B')
          : (window.AppIcons ? window.AppIcons.user : 'N');

        const avatarClass = msg.sender === 'bao' ? 'bao-avatar' : 'ngan-avatar';

        return `
          <div class="chat-msg-row ${isMe ? 'msg-outgoing' : 'msg-incoming'} ${isNudge ? 'msg-nudge-row' : ''}">
            <div class="msg-avatar ${avatarClass}" title="${senderUser.name}">
              ${avatarSvg}
            </div>
            <div class="msg-content-wrap">
              <div class="msg-meta-row">
                <span class="msg-sender-name">${isMe ? 'Bạn' : senderUser.name}</span>
                <span class="msg-time">${msg.time || ''}</span>
              </div>
              <div class="msg-bubble ${isNudge ? 'bubble-nudge' : ''}">
                ${isNudge && msg.nudgeTitle ? `<div class="nudge-bubble-badge">${msg.nudgeTitle}</div>` : ''}
                <div class="msg-text">${this.escapeHTML(msg.text)}</div>
              </div>
            </div>
          </div>
        `;
      }).join('');
    },

    renderInputPlaceholder() {
      const inputChat = document.getElementById('chat-input-text');
      const currentUser = StorageManager.getCurrentUser();
      const partnerName = currentUser.id === 'bao' ? 'Ngân' : 'Bảo';
      if (inputChat) {
        inputChat.placeholder = `Nhắn tin cho ${partnerName}...`;
      }
    },

    scrollToBottom() {
      const messagesList = document.getElementById('chat-messages-stream');
      if (messagesList) {
        setTimeout(() => {
          messagesList.scrollTop = messagesList.scrollHeight;
        }, 50);
      }
    },

    updateBadge() {
      const badge = document.getElementById('chat-badge-count');
      if (!badge) return;
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount;
        badge.style.display = 'inline-flex';
      } else {
        badge.style.display = 'none';
      }
    },

    escapeHTML(str) {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }
  };
})();
