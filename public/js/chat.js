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
    notifyTimer: null,
    originalDocTitle: '',

    init() {
      this.originalDocTitle = document.title;
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const btnToggle = document.getElementById('btn-floating-chat');
      const btnClose = document.getElementById('btn-close-chat-drawer');
      const formChat = document.getElementById('chat-input-form');
      const inputChat = document.getElementById('chat-input-text');
      const notifyCard = document.getElementById('messenger-notify-card');
      const btnDismissNotify = document.getElementById('btn-dismiss-notify');

      btnToggle?.addEventListener('click', () => {
        this.toggleChat();
      });

      btnClose?.addEventListener('click', () => {
        this.closeChat();
      });

      // Click on Messenger notification card opens chat drawer
      notifyCard?.addEventListener('click', (e) => {
        if (e.target.closest('#btn-dismiss-notify')) {
          e.stopPropagation();
          this.hideMessengerNotification();
          return;
        }
        this.openChat();
      });

      btnDismissNotify?.addEventListener('click', (e) => {
        e.stopPropagation();
        this.hideMessengerNotification();
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

      // Quick Heart Button
      const btnHeart = document.getElementById('btn-quick-heart');
      btnHeart?.addEventListener('click', () => {
        this.sendNudge('miss');
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

        // Reset Messenger notifications when chat is opened
        this.unreadCount = 0;
        this.updateBadge();
        this.hideMessengerNotification();
        if (this.originalDocTitle) {
          document.title = this.originalDocTitle;
        }

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

    // ------------------------------------------------------------------------
    // Messenger-Style Incoming Notifications (Messenger Pop-up & Unread Badge)
    // ------------------------------------------------------------------------
    handleIncomingMessage(msg) {
      if (this.isOpen) {
        // Đang mở chat -> Tự động nạp tin nhắn mới và cuộn xuống
        this.renderMessages();
        this.scrollToBottom();
        if (window.playChime) window.playChime(640, 0.12);
      } else {
        // Đang đóng chat -> Tăng số đếm chưa đọc & hiện Messenger Notification Pop-up
        this.unreadCount++;
        this.updateBadge();
        this.showMessengerNotification(msg);

        // Chuông báo Messenger ngọt ngào
        if (window.playMessengerChime) {
          window.playMessengerChime();
        } else if (window.playChime) {
          window.playChime(784, 0.15);
        }

        // Nhấp nháy tiêu đề tab trình duyệt
        const sender = StorageManager.USERS.find(u => u.id === msg.sender) || { name: 'Người ấy' };
        document.title = `(${this.unreadCount}) ${sender.name} vừa nhắn! • NgaOS`;
      }
    },

    showMessengerNotification(msg) {
      const notifyCard = document.getElementById('messenger-notify-card');
      const avatarEl = document.getElementById('notify-avatar');
      const nameEl = document.getElementById('notify-sender-name');
      const snippetEl = document.getElementById('notify-message-snippet');
      const timeEl = document.getElementById('notify-time-label');

      if (!notifyCard) return;

      const sender = StorageManager.USERS.find(u => u.id === msg.sender) || { name: 'Người ấy', avatarUrl: `assets/avatars/${msg.sender}.png` };

      if (avatarEl) {
        const avatarUrl = sender.avatarUrl || (msg.sender === 'bao' ? 'assets/avatars/bao.png' : 'assets/avatars/ngan.png');
        avatarEl.className = `auth-avatar-mini ${msg.sender}-avatar`;
        avatarEl.innerHTML = `<img src="${avatarUrl}" class="auth-avatar-mini-photo" alt="${sender.name}">`;
      }

      if (nameEl) nameEl.textContent = sender.name;
      if (timeEl) timeEl.textContent = msg.time || 'vừa xong';

      if (snippetEl) {
        if (msg.type === 'nudge' && msg.nudgeTitle) {
          snippetEl.innerHTML = `<strong style="color: var(--ocean-blue);">[${msg.nudgeTitle}]</strong> ${this.escapeHTML(msg.text)}`;
        } else {
          snippetEl.textContent = msg.text || '';
        }
      }

      // Kích hoạt hiển thị nổi
      notifyCard.classList.add('show');

      // Tự động ẩn sau 7 giây
      if (this.notifyTimer) clearTimeout(this.notifyTimer);
      this.notifyTimer = setTimeout(() => {
        this.hideMessengerNotification();
      }, 7000);
    },

    hideMessengerNotification() {
      const notifyCard = document.getElementById('messenger-notify-card');
      if (notifyCard) {
        notifyCard.classList.remove('show');
      }
      if (this.notifyTimer) {
        clearTimeout(this.notifyTimer);
        this.notifyTimer = null;
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
      this.renderHeader();
      this.renderMessages();
      this.renderInputPlaceholder();
      this.updateFloatingBtnUI();
    },

    renderHeader() {
      const currentUser = StorageManager.getCurrentUser();
      const partner = currentUser.id === 'bao' ? StorageManager.USERS[1] : StorageManager.USERS[0];

      const headerPartnerName = document.getElementById('chat-header-partner-name');
      const headerAvatarImg = document.getElementById('chat-header-avatar-img');
      const headerSubText = document.getElementById('chat-header-sub-text');

      if (headerPartnerName) headerPartnerName.textContent = partner.name;
      if (headerAvatarImg) {
        headerAvatarImg.src = partner.avatarUrl || (partner.id === 'bao' ? 'assets/avatars/bao.png' : 'assets/avatars/ngan.png');
        headerAvatarImg.alt = partner.name;
      }
      if (headerSubText) {
        headerSubText.textContent = partner.id === 'ngan' ? 'Em bé má bánh bao của anh' : 'Anh người yêu đồng hành của em';
      }
    },

    updateFloatingBtnUI() {
      const currentUser = StorageManager.getCurrentUser();
      const partner = currentUser.id === 'bao' ? StorageManager.USERS[1] : StorageManager.USERS[0];

      const floatingAvatarImg = document.getElementById('floating-chat-avatar-img');
      const floatingSub = document.getElementById('floating-chat-btn-sub');

      if (floatingAvatarImg) {
        floatingAvatarImg.src = partner.avatarUrl || (partner.id === 'bao' ? 'assets/avatars/bao.png' : 'assets/avatars/ngan.png');
        floatingAvatarImg.alt = partner.name;
      }
      if (floatingSub) {
        floatingSub.textContent = `Với ${partner.name}`;
      }
    },

    // ------------------------------------------------------------------------
    // Chat Monitor (Removed for privacy & focus)
    // ------------------------------------------------------------------------
    renderMonitor() {
      // Intentionally empty
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
        const partner = currentUser.id === 'bao' ? StorageManager.USERS[1] : StorageManager.USERS[0];
        messagesList.innerHTML = `
          <div class="chat-empty-state">
            <div class="empty-state-avatar-wrap">
              <img src="${partner.avatarUrl}" class="empty-state-avatar-img" alt="${partner.name}">
            </div>
            <div class="empty-state-title">Chưa có tin nhắn nào với ${partner.name}</div>
            <p>Bấm một lời nhắc nhanh bên trên hoặc gửi tin nhắn ngọt ngào để bắt đầu nhé!</p>
          </div>
        `;
        return;
      }

      messagesList.innerHTML = messages.map(msg => {
        const isMe = msg.sender === currentUser.id;
        const senderUser = StorageManager.USERS.find(u => u.id === msg.sender) || { 
          name: msg.senderName || 'Người dùng',
          avatarUrl: `assets/avatars/${msg.sender}.png`
        };
        const isNudge = msg.type === 'nudge';
        const avatarUrl = senderUser.avatarUrl || `assets/avatars/${msg.sender}.png`;
        const avatarClass = msg.sender === 'bao' ? 'bao-avatar' : 'ngan-avatar';

        return `
          <div class="chat-msg-row ${isMe ? 'msg-outgoing' : 'msg-incoming'} ${isNudge ? 'msg-nudge-row' : ''}">
            <div class="msg-avatar ${avatarClass}" title="${senderUser.name}">
              <img src="${avatarUrl}" class="msg-avatar-photo" alt="${senderUser.name}">
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
