/**
 * NGAOS — 2-USER AUTHENTICATION MODULE (BẢO & NGÂN)
 * Private, lightweight authentication specifically for 2 partners
 * Features:
 * - Active profile indicator on header with vector avatars
 * - Switch user modal with PIN verification
 * - Role-tailored experience (Bảo: Người đồng hành, Ngân: Chủ nhân không gian)
 */

(function () {
  'use strict';

  window.AuthModule = {
    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const userBtn = document.getElementById('btn-switch-user');
      const authModal = document.getElementById('modal-auth');
      const btnCloseAuth = document.getElementById('btn-close-modal-auth');

      userBtn?.addEventListener('click', () => {
        this.openSwitchModal();
      });

      btnCloseAuth?.addEventListener('click', () => {
        authModal?.classList.remove('active');
      });

      // User selection cards inside modal
      const userCards = document.querySelectorAll('.auth-user-card');
      userCards.forEach(card => {
        card.addEventListener('click', () => {
          const userId = card.getAttribute('data-user-id');
          this.promptLogin(userId);
        });
      });
    },

    openSwitchModal() {
      const modal = document.getElementById('modal-auth');
      if (modal) modal.classList.add('active');
      if (window.playChime) window.playChime(620, 0.15);
    },

    promptLogin(userId) {
      const user = StorageManager.USERS.find(u => u.id === userId);
      if (!user) return;

      const pin = prompt(`Nhập mã PIN bảo mật cho ${user.name}:`, '');
      if (pin === null) return; // cancel

      const res = StorageManager.setCurrentUser(userId, pin);
      if (res.success) {
        const modal = document.getElementById('modal-auth');
        if (modal) modal.classList.remove('active');

        this.render();
        if (window.FinanceModule) window.FinanceModule.render();
        if (window.ScheduleModule) window.ScheduleModule.render();

        if (window.showToast) {
          window.showToast(`Chào mừng ${user.name} đã quay trở lại!`, 'success');
        }
        if (window.playChime) window.playChime(780, 0.25);
      } else {
        alert(res.message || 'Mã PIN không đúng, vui lòng thử lại.');
      }
    },

    render() {
      const currentUser = StorageManager.getCurrentUser();

      // Update header profile button
      const userAvatar = document.getElementById('header-user-avatar');
      const userName = document.getElementById('header-user-name');
      const userRole = document.getElementById('header-user-role');

      if (userAvatar && window.AppIcons) {
        userAvatar.innerHTML = currentUser.id === 'bao' ? window.AppIcons.shield : window.AppIcons.user;
      }
      if (userName) userName.textContent = currentUser.name;
      if (userRole) userRole.textContent = currentUser.role;

      // Update care note message based on user
      const careText = document.getElementById('care-note-text');
      if (careText) {
        if (currentUser.id === 'bao') {
          careText.textContent = 'Bảo đang đồng hành cùng Ngân';
        } else {
          careText.textContent = 'Hôm nay học tốt nhé em bé';
        }
      }
    }
  };
})();
