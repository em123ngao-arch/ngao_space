/**
 * NGAOS — FIREBASE CLOUD CONFIGURATION
 * Miễn phí vĩnh viễn với Google Firebase Firestore (Gói Spark)
 * Hỗ trợ lưu trữ cấu hình linh hoạt:
 * 1. Nhập trực tiếp qua giao diện web (lưu vào LocalStorage)
 * 2. Hoặc điền trực tiếp vào biến DEFAULT_CONFIG dưới đây
 */

(function () {
  'use strict';

  // Điền cấu hình từ Firebase Console của bạn vào đây (nếu muốn đặt mặc định)
  const DEFAULT_CONFIG = {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  };

  const STORAGE_KEY = 'NGAOS_FIREBASE_CONFIG_V1';

  window.FirebaseConfig = {
    getConfig() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.projectId) return parsed;
        }
      } catch (e) {
        console.warn('Lỗi đọc cấu hình Firebase từ storage:', e);
      }
      return DEFAULT_CONFIG;
    },

    saveConfig(config) {
      if (!config || !config.projectId) {
        throw new Error('Cấu hình Firebase phải có ít nhất Project ID và API Key.');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    },

    clearConfig() {
      localStorage.removeItem(STORAGE_KEY);
    },

    isConfigured() {
      const cfg = this.getConfig();
      return Boolean(cfg && cfg.apiKey && cfg.projectId);
    }
  };
})();
