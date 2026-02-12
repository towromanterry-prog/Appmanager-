// src/stores/authStore.js
import { defineStore } from 'pinia';
import * as authService from '@/services/authService';

let _initPromise = null;

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,     // null | { uid, email, displayName, photoURL }
    loading: true,  // true пока не пришёл первый onAuthStateChanged
    _unsub: null,
  }),

  getters: {
    isAuthenticated: (s) => !!s.user,
    currentUserId: (s) => s.user?.uid ?? null,
  },

  actions: {
    init() {
      if (_initPromise) return _initPromise;

      this.loading = true;

      _initPromise = new Promise((resolve) => {
        let resolved = false;

        this._unsub = authService.observeAuthState((user) => {
          this.user = user;
          this.loading = false;

          if (!resolved) {
            resolved = true;
            resolve(user);
          }
        });
      });

      return _initPromise;
    },

    async login() {
      this.loading = true;
      try {
        return await authService.loginWithGoogle();
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      this.loading = true;
      try {
        await authService.logout();
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
  },
});