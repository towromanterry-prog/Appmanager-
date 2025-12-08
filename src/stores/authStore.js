import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = ref(localStorage.getItem('isAuthenticated') === 'true');

  function login(username, password) {
    if (username === 'admin' && password === 'admin123') {
      isAuthenticated.value = true;
      localStorage.setItem('isAuthenticated', 'true');
      return true;
    }
    return false;
  }

  function logout() {
    isAuthenticated.value = false;
    localStorage.removeItem('isAuthenticated');
  }

  return {
    isAuthenticated,
    login,
    logout
  };
});
