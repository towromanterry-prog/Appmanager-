import { defineStore } from 'pinia';
import settingsService from '../services/settingsService';

export const useSettingsStore = defineStore('settingsStore', {
  state: () => ({
    settings: null, // null пока не загрузится
    loading: false
  }),

  actions: {
    async loadSettings() {
      this.loading = true;
      try {
        this.settings = await settingsService.getSettings();
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        this.loading = false;
      }
    },

    async updateSettings(newSettings) {
      // Оптимистичное обновление UI
      const oldSettings = this.settings ? this.settings.clone() : null;
      this.settings = newSettings;

      try {
        await settingsService.saveSettings(newSettings);
      } catch (e) {
        console.error('Failed to save settings', e);
        this.settings = oldSettings; // Откат при ошибке
      }
    }
  }
});
