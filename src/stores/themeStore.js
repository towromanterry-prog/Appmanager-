// src/stores/themeStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { light, dark } from '@/theme/theme'; // Импортируем темы для получения метаданных

export const useThemeStore = defineStore('theme', () => {
  // 'light' или 'dark'
  const theme = ref('light');

  /**
   * Загружает сохраненную тему из localStorage.
   */
  function loadTheme() {
    const savedTheme = localStorage.getItem('app-theme');
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      theme.value = savedTheme;
    }
  }

  /**
   * Устанавливает и сохраняет новую тему.
   * @param {'light' | 'dark'} newTheme 
   */
  function setTheme(newTheme) {
    if (newTheme === 'light' || newTheme === 'dark') {
      theme.value = newTheme;
      localStorage.setItem('app-theme', newTheme);
    }
  }
  
  /**
   * Переключает тему между светлой и темной.
   */
  function toggleTheme() {
    setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  // Данные для страницы настроек, чтобы показать доступные темы.
  const themesList = [
    {
      key: 'light',
      name: 'Светлая',
      emoji: '☀️',
      colors: light.colors,
      mode: 'light',
    },
    {
      key: 'dark',
      name: 'Темная',
      emoji: '🌙',
      colors: dark.colors,
      mode: 'dark',
    },
  ];

  function getThemesList() {
    return themesList;
  }

  return {
    theme,
    loadTheme,
    setTheme,
    toggleTheme,
    getThemesList,
  };
});