/**
 * NGAOS — HYBRID OFFLINE-FIRST REAL-TIME CLOUD SYNC MODULE
 * Tự động đồng bộ 2 chiều tức thì giữa Bảo & Ngân qua Google Firebase Firestore
 * Hoàn toàn miễn phí 100% vĩnh viễn (Gói Google Spark)
 */

(function () {
  'use strict';

  let firestoreDb = null;
  let unsubscribeListener = null;
  let isSyncing = false;
  let lastRemoteTimestamp = 0;
  let pushDebounceTimer = null;

  window.CloudSync = {
    status: 'local', // 'local' | 'connecting' | 'connected' | 'error'

    init() {
      this.bindEvents();
      this.initFirebase();
      this.renderStatusBadge();
    },

    bindEvents() {
      const btnCloud = document.getElementById('btn-cloud-status');
      const modalCloud = document.getElementById('modal-cloud-sync');
      const btnCloseCloud = document.getElementById('btn-close-modal-cloud');
      const btnSaveCloudConfig = document.getElementById('btn-save-cloud-config');
      const btnDisconnectCloud = document.getElementById('btn-disconnect-cloud');
      const btnManualSync = document.getElementById('btn-manual-sync-now');
      const btnExportBackup = document.getElementById('btn-export-backup-now');
      const btnImportBackup = document.getElementById('btn-import-backup-now');
      const inputImportFile = document.getElementById('input-import-backup-file');

      btnCloud?.addEventListener('click', () => {
        this.openCloudModal();
      });

      btnCloseCloud?.addEventListener('click', () => {
        modalCloud?.classList.remove('active');
      });

      const btnCloseCloudX = document.getElementById('btn-close-modal-cloud-x');
      btnCloseCloudX?.addEventListener('click', () => {
        modalCloud?.classList.remove('active');
      });

      // 1-Click Backup Export
      btnExportBackup?.addEventListener('click', () => {
        if (window.StorageManager && typeof window.StorageManager.exportJSON === 'function') {
          window.StorageManager.exportJSON();
          if (window.showToast) window.showToast('Đã tải file sao lưu (.json) thành công!', 'success');
        }
      });

      // 1-Click Backup Import / Restore
      btnImportBackup?.addEventListener('click', () => {
        inputImportFile?.click();
      });

      inputImportFile?.addEventListener('change', (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          try {
            const content = evt.target.result;
            const result = window.StorageManager.importJSON(content);
            if (result && result.success) {
              if (window.FinanceModule) window.FinanceModule.render();
              if (window.ScheduleModule) window.ScheduleModule.render();
              if (window.ChatModule) {
                window.ChatModule.renderMonitor();
                window.ChatModule.renderMessages();
              }
              if (window.showToast) window.showToast('Khôi phục dữ liệu thành công!', 'success');
              this.pushCurrentState();
            } else {
              alert('Lỗi khôi phục: ' + (result?.error || 'File không hợp lệ'));
            }
          } catch (err) {
            alert('Không thể đọc file: ' + err.message);
          }
        };
        reader.readAsText(file);
        e.target.value = '';
      });

      modalCloud?.addEventListener('click', (e) => {
        if (e.target === modalCloud) {
          modalCloud.classList.remove('active');
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalCloud?.classList.contains('active')) {
          modalCloud.classList.remove('active');
        }
      });

      btnSaveCloudConfig?.addEventListener('click', () => {
        this.handleSaveConfigFromForm();
      });

      btnDisconnectCloud?.addEventListener('click', () => {
        if (confirm('Bạn có chắc muốn ngắt kết nối đám mây và quay về chế độ lưu trữ máy cục bộ?')) {
          FirebaseConfig.clearConfig();
          if (unsubscribeListener) unsubscribeListener();
          firestoreDb = null;
          this.status = 'local';
          this.renderStatusBadge();
          this.openCloudModal();
          if (window.showToast) window.showToast('Đã chuyển sang chế độ lưu trữ máy (Local)', 'info');
        }
      });

      btnManualSync?.addEventListener('click', () => {
        this.pushCurrentState();
      });
    },

    initFirebase() {
      if (!window.FirebaseConfig || !window.FirebaseConfig.isConfigured()) {
        this.status = 'local';
        this.renderStatusBadge();
        return;
      }

      if (!window.firebase || !window.firebase.initializeApp) {
        console.warn('Firebase SDK chưa được tải xong.');
        this.status = 'local';
        this.renderStatusBadge();
        return;
      }

      try {
        this.status = 'connecting';
        this.renderStatusBadge();

        const config = window.FirebaseConfig.getConfig();

        // Initialize Firebase app if not already initialized
        let app;
        if (!firebase.apps.length) {
          app = firebase.initializeApp(config);
        } else {
          app = firebase.app();
        }

        firestoreDb = firebase.firestore(app);

        // Kích hoạt Offline Persistence cho Firestore
        try {
          if (firestoreDb && typeof firestoreDb.enablePersistence === 'function') {
            firestoreDb.enablePersistence({ synchronizeTabs: true }).catch((err) => {
              if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence: Nhiều tab mở đồng thời');
              } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence không hỗ trợ trình duyệt này');
              }
            });
          }
        } catch (e) {}

        // Listen for real-time changes from Firestore
        const docRef = firestoreDb.collection('ngaos_spaces').doc('shared_data');

        if (unsubscribeListener) unsubscribeListener();

        unsubscribeListener = docRef.onSnapshot(
          (docSnap) => {
            this.status = 'connected';
            this.renderStatusBadge();

            if (docSnap.exists) {
              const remoteData = docSnap.data();
              this.handleRemoteUpdate(remoteData);
            } else {
              // Doc doesn't exist yet, push current initial state
              this.pushCurrentState();
            }
          },
          (err) => {
            console.error('Lỗi lắng nghe Firestore Snapshot:', err);
            this.status = 'error';
            this.renderStatusBadge();
          }
        );
      } catch (err) {
        console.error('Khởi tạo Firebase thất bại:', err);
        this.status = 'error';
        this.renderStatusBadge();
      }
    },

    handleRemoteUpdate(remoteData) {
      if (!remoteData || !remoteData.updatedAt || !remoteData.state) {
        // Document trên đám mây chưa có dữ liệu -> đẩy dữ liệu hiện tại lên làm gốc
        this.pushCurrentState();
        return;
      }
      if (remoteData.updatedAt <= lastRemoteTimestamp) return;

      const localState = StorageManager.getState();
      const localUpdatedAt = localState.updatedAt || 0;

      // If remote data is newer than local
      if (remoteData.updatedAt > localUpdatedAt) {
        isSyncing = true;
        lastRemoteTimestamp = remoteData.updatedAt;

        // Apply remote data into storage
        StorageManager.setState(remoteData.state);

        // Re-render UI tất cả các module
        if (window.FinanceModule) window.FinanceModule.render();
        if (window.ScheduleModule) window.ScheduleModule.render();
        if (window.ChatModule) {
          window.ChatModule.renderMonitor();
          window.ChatModule.renderMessages();
        }

        const updatedBy = remoteData.lastUpdatedBy;
        const currentUserName = StorageManager.getCurrentUser()?.name;

        if (updatedBy && updatedBy !== currentUserName && window.showToast) {
          window.showToast(`${updatedBy} vừa cập nhật dữ liệu mới qua đám mây!`, 'info');
          if (window.playChime) window.playChime(660, 0.15);
        }

        isSyncing = false;
      } else if (localUpdatedAt > remoteData.updatedAt) {
        // Local có thay đổi mới hơn khi vừa offline -> đẩy lên Firebase
        this.pushCurrentState();
      }
    },

    pushUpdate(state) {
      if (isSyncing) return;
      if (this.status !== 'connected' || !firestoreDb) return;

      try {
        const currentUser = StorageManager.getCurrentUser();
        const timestamp = Date.now();
        lastRemoteTimestamp = timestamp;

        const payload = {
          updatedAt: timestamp,
          lastUpdatedBy: currentUser?.name || 'Ẩn danh',
          state: state || StorageManager.getState()
        };

        const docRef = firestoreDb.collection('ngaos_spaces').doc('shared_data');
        docRef.set(payload, { merge: true })
          .then(() => {
            this.status = 'connected';
            this.renderStatusBadge();
          })
          .catch((e) => {
            console.warn('Lỗi đẩy dữ liệu lên Firestore:', e);
            this.status = 'error';
            this.renderStatusBadge();
          });
      } catch (e) {
        console.warn('Không thể gửi cập nhật đến Firestore:', e);
      }
    },

    pushUpdateDebounced(state) {
      if (pushDebounceTimer) clearTimeout(pushDebounceTimer);
      pushDebounceTimer = setTimeout(() => {
        this.pushUpdate(state);
      }, 800);
    },

    pushCurrentState() {
      const state = StorageManager.getState();
      this.pushUpdate(state);
      if (window.showToast) window.showToast('Đang đồng bộ dữ liệu lên đám mây Google...', 'info');
    },

    handleSaveConfigFromForm() {
      const apiKey = document.getElementById('cfg-api-key')?.value.trim();
      const projectId = document.getElementById('cfg-project-id')?.value.trim();
      const authDomain = document.getElementById('cfg-auth-domain')?.value.trim();
      const storageBucket = document.getElementById('cfg-storage-bucket')?.value.trim();
      const appId = document.getElementById('cfg-app-id')?.value.trim();

      if (!apiKey || !projectId) {
        alert('Vui lòng nhập ít nhất API Key và Project ID từ Firebase Console.');
        return;
      }

      const config = {
        apiKey,
        projectId,
        authDomain: authDomain || `${projectId}.firebaseapp.com`,
        storageBucket: storageBucket || `${projectId}.appspot.com`,
        appId: appId || ''
      };

      try {
        FirebaseConfig.saveConfig(config);
        const modal = document.getElementById('modal-cloud-sync');
        modal?.classList.remove('active');

        this.initFirebase();

        if (window.showToast) {
          window.showToast('Đã lưu cấu hình Firebase! Đang kết nối máy chủ...', 'success');
        }
      } catch (e) {
        alert('Lỗi lưu cấu hình: ' + e.message);
      }
    },

    openCloudModal() {
      const modal = document.getElementById('modal-cloud-sync');
      if (!modal) return;

      const isConfigured = FirebaseConfig.isConfigured();
      const cfg = FirebaseConfig.getConfig();

      const inputApiKey = document.getElementById('cfg-api-key');
      const inputProjectId = document.getElementById('cfg-project-id');
      const inputAuthDomain = document.getElementById('cfg-auth-domain');
      const inputStorageBucket = document.getElementById('cfg-storage-bucket');
      const inputAppId = document.getElementById('cfg-app-id');

      if (inputApiKey) inputApiKey.value = cfg.apiKey || '';
      if (inputProjectId) inputProjectId.value = cfg.projectId || '';
      if (inputAuthDomain) inputAuthDomain.value = cfg.authDomain || '';
      if (inputStorageBucket) inputStorageBucket.value = cfg.storageBucket || '';
      if (inputAppId) inputAppId.value = cfg.appId || '';

      const statusBadge = document.getElementById('modal-cloud-status-badge');
      const btnDisconnect = document.getElementById('btn-disconnect-cloud');
      const btnManualSync = document.getElementById('btn-manual-sync-now');

      if (statusBadge) {
        if (this.status === 'connected') {
          statusBadge.innerHTML = '<span class="status-dot dot-emerald"></span> Đã kết nối Firebase Firestore (Real-time)';
          statusBadge.className = 'cloud-status-pill status-connected';
          if (btnDisconnect) btnDisconnect.style.display = 'inline-flex';
          if (btnManualSync) btnManualSync.style.display = 'inline-flex';
        } else if (this.status === 'connecting') {
          statusBadge.innerHTML = '<span class="status-dot dot-amber"></span> Đang kết nối tới đám mây...';
          statusBadge.className = 'cloud-status-pill status-connecting';
        } else if (this.status === 'error') {
          statusBadge.innerHTML = '<span class="status-dot dot-rose"></span> Lỗi kết nối Firestore (Kiểm tra API Key/Rule)';
          statusBadge.className = 'cloud-status-pill status-error';
        } else {
          statusBadge.innerHTML = '<span class="status-dot dot-amber"></span> Bộ nhớ máy (Offline LocalStorage)';
          statusBadge.className = 'cloud-status-pill status-local';
          if (btnDisconnect) btnDisconnect.style.display = 'none';
          if (btnManualSync) btnManualSync.style.display = 'none';
        }
      }

      modal.classList.add('active');
    },

    renderStatusBadge() {
      const pill = document.getElementById('btn-cloud-status');
      if (!pill) return;

      let iconHtml = window.AppIcons?.shield || '☁';
      let text = 'Lưu trữ máy';
      let dotClass = 'dot-amber';

      if (this.status === 'connected') {
        text = 'Đám mây online';
        dotClass = 'dot-emerald';
      } else if (this.status === 'connecting') {
        text = 'Đang kết nối...';
        dotClass = 'dot-amber';
      } else if (this.status === 'error') {
        text = 'Lỗi kết nối';
        dotClass = 'dot-rose';
      }

      pill.innerHTML = `
        <span class="status-dot ${dotClass}"></span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
        </svg>
        <span class="cloud-pill-text">${text}</span>
      `;
    }
  };
})();
