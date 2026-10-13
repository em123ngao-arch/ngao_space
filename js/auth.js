/**
 * NGAOS — 2-USER AUTHENTICATION MODULE (BẢO & NGÂN)
 * Modern in-modal Fintech / OTP-style PIN pad verification.
 * Zero browser prompt() or alert() calls.
 */

(function () {
  'use strict';

  window.AuthModule = {
    activeUserId: null,
    enteredPin: '',
    isVerifying: false,

    init() {
      this.bindEvents();
      this.render();
    },

    bindEvents() {
      const userBtn = document.getElementById('btn-switch-user');
      const authModal = document.getElementById('modal-auth');
      const btnCloseAuth = document.getElementById('btn-close-modal-auth');
      const btnClosePinModal = document.getElementById('btn-close-pin-modal');
      const btnBackToUsers = document.getElementById('btn-back-to-users');
      const btnPinCancel = document.getElementById('btn-pin-cancel');
      const dotsWrapper = document.getElementById('pin-dots-wrapper');
      const hiddenInput = document.getElementById('auth-pin-input-field');

      userBtn?.addEventListener('click', () => {
        this.openSwitchModal();
      });

      btnCloseAuth?.addEventListener('click', () => {
        this.closeModal();
      });

      btnClosePinModal?.addEventListener('click', () => {
        this.closeModal();
      });

      btnBackToUsers?.addEventListener('click', () => {
        this.backToSelect();
      });

      btnPinCancel?.addEventListener('click', () => {
        this.backToSelect();
      });

      // User cards click -> Transition to PIN Pad
      const userCards = document.querySelectorAll('.auth-user-card');
      userCards.forEach(card => {
        card.addEventListener('click', () => {
          const userId = card.getAttribute('data-user-id');
          this.openPinPad(userId);
        });
      });

      // Keypad buttons
      const keypadBtns = document.querySelectorAll('.keypad-btn');
      keypadBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const key = btn.getAttribute('data-key');
          if (key) {
            this.handleInputKey(key);
          }
        });
      });

      // Focus hidden input when clicking dots
      dotsWrapper?.addEventListener('click', () => {
        hiddenInput?.focus();
      });

      // Keyboard support via hidden input and window listener
      hiddenInput?.addEventListener('input', (e) => {
        const val = hiddenInput.value.replace(/\D/g, '');
        hiddenInput.value = '';
        for (const char of val) {
          this.handleInputKey(char);
        }
      });

      window.addEventListener('keydown', (e) => {
        if (!authModal?.classList.contains('active')) return;
        const stepPin = document.getElementById('auth-step-pin');
        if (stepPin?.style.display === 'none') return;

        if (e.key >= '0' && e.key <= '9') {
          e.preventDefault();
          this.handleInputKey(e.key);
        } else if (e.key === 'Backspace') {
          e.preventDefault();
          this.handleInputKey('backspace');
        } else if (e.key === 'Escape') {
          this.closeModal();
        }
      });
    },

    openSwitchModal() {
      const modal = document.getElementById('modal-auth');
      if (modal) modal.classList.add('active');
      this.backToSelect();
      if (window.playChime) window.playChime(620, 0.15);
    },

    closeModal() {
      const modal = document.getElementById('modal-auth');
      if (modal) modal.classList.remove('active');
      this.backToSelect();
    },

    backToSelect() {
      this.activeUserId = null;
      this.enteredPin = '';
      this.isVerifying = false;

      const stepSelect = document.getElementById('auth-step-select');
      const stepPin = document.getElementById('auth-step-pin');
      if (stepSelect) stepSelect.style.display = 'flex';
      if (stepPin) stepPin.style.display = 'none';

      this.updateDotsUI();
      const feedback = document.getElementById('pin-feedback-msg');
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'pin-feedback-msg';
      }
    },

    openPinPad(userId) {
      const user = StorageManager.USERS.find(u => u.id === userId);
      if (!user) return;

      this.activeUserId = userId;
      this.enteredPin = '';
      this.isVerifying = false;

      const stepSelect = document.getElementById('auth-step-select');
      const stepPin = document.getElementById('auth-step-pin');
      const pinUserName = document.getElementById('pin-user-name');
      const pinUserAvatar = document.getElementById('pin-user-avatar');
      const hiddenInput = document.getElementById('auth-pin-input-field');

      if (pinUserName) pinUserName.textContent = user.name;
      if (pinUserAvatar) {
        if (user.id === 'ngan') {
          pinUserAvatar.className = 'auth-avatar-mini ngan-avatar';
          pinUserAvatar.innerHTML = window.AppIcons ? window.AppIcons.user : '';
        } else {
          pinUserAvatar.className = 'auth-avatar-mini bao-avatar';
          pinUserAvatar.innerHTML = window.AppIcons ? window.AppIcons.shield : '';
        }
      }

      if (stepSelect) stepSelect.style.display = 'none';
      if (stepPin) stepPin.style.display = 'flex';

      this.updateDotsUI();
      const feedback = document.getElementById('pin-feedback-msg');
      if (feedback) {
        feedback.textContent = '';
        feedback.className = 'pin-feedback-msg';
      }

      if (window.playChime) window.playChime(700, 0.12);

      // Auto focus for keyboard typing
      setTimeout(() => {
        hiddenInput?.focus();
      }, 50);
    },

    handleInputKey(key) {
      if (this.isVerifying) return;

      if (key >= '0' && key <= '9') {
        if (this.enteredPin.length < 4) {
          this.enteredPin += key;
          this.updateDotsUI();
          if (window.playChime) window.playChime(520 + this.enteredPin.length * 60, 0.08);

          if (this.enteredPin.length === 4) {
            this.verifyCurrentPin();
          }
        }
      } else if (key === 'backspace') {
        if (this.enteredPin.length > 0) {
          this.enteredPin = this.enteredPin.slice(0, -1);
          this.updateDotsUI();
          const feedback = document.getElementById('pin-feedback-msg');
          if (feedback) feedback.textContent = '';
          if (window.playChime) window.playChime(420, 0.08);
        }
      }
    },

    updateDotsUI() {
      const dotsWrapper = document.getElementById('pin-dots-wrapper');
      if (!dotsWrapper) return;

      const dots = dotsWrapper.querySelectorAll('.pin-dot');
      dots.forEach((dot, idx) => {
        if (idx < this.enteredPin.length) {
          dot.classList.add('filled');
        } else {
          dot.classList.remove('filled');
        }
      });
    },

    verifyCurrentPin() {
      this.isVerifying = true;
      const dotsWrapper = document.getElementById('pin-dots-wrapper');
      const feedback = document.getElementById('pin-feedback-msg');
      const user = StorageManager.USERS.find(u => u.id === this.activeUserId);

      const res = StorageManager.setCurrentUser(this.activeUserId, this.enteredPin);

      if (res.success) {
        // Success Animation
        dotsWrapper?.classList.add('success');
        if (feedback) {
          feedback.textContent = 'Mã PIN chính xác!';
          feedback.className = 'pin-feedback-msg success-msg';
        }
        if (window.playChime) window.playChime(780, 0.25);

        setTimeout(() => {
          dotsWrapper?.classList.remove('success');
          this.closeModal();

          this.render();
          if (window.FinanceModule) window.FinanceModule.render();
          if (window.ScheduleModule) window.ScheduleModule.render();
          if (window.ChatModule) window.ChatModule.render();

          if (window.showToast && user) {
            window.showToast(`Chào mừng ${user.name} đã quay trở lại!`, 'success');
          }
        }, 320);
      } else {
        // Error Shake Animation
        dotsWrapper?.classList.add('error', 'shake');
        if (feedback) {
          feedback.textContent = 'Mã PIN không đúng, vui lòng thử lại.';
          feedback.className = 'pin-feedback-msg';
        }
        if (window.playChime) window.playChime(260, 0.2);

        setTimeout(() => {
          dotsWrapper?.classList.remove('shake', 'error');
          this.enteredPin = '';
          this.updateDotsUI();
          this.isVerifying = false;

          const hiddenInput = document.getElementById('auth-pin-input-field');
          hiddenInput?.focus();
        }, 500);
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
