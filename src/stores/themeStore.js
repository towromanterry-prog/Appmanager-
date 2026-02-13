import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { light, dark } from '@/theme/theme';

export const useThemeStore = defineStore('theme', () => {
  const settingsStore = useSettingsStore();

  const theme = computed(() => settingsStore.theme || 'light');

  function loadTheme() {
    // settingsStore сам подхватывает localStorage + снапшоты (init уже вызывается внутри него)
    settingsStore.init?.();
  }

  function setTheme(newTheme) {
    return settingsStore.updateSetting('theme', newTheme === 'dark' ? 'dark' : 'light');
  }

  function toggleTheme() {
    return setTheme(theme.value === 'light' ? 'dark' : 'light');
  }

  const themesList = [
    { key: 'light', name: 'Светлая', emoji: '☀️', colors: light.colors, mode: 'light' },
    { key: 'dark', name: 'Темная', emoji: '🌙', colors: dark.colors, mode: 'dark' },
  ];

  function getThemesList() {
    return themesList;
  }

  return { theme, loadTheme, setTheme, toggleTheme, getThemesList };
});