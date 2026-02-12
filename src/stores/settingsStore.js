import { defineStore } from 'pinia';
import settingsService from '../services/settingsService';
import AppSettings from '../models/AppSettings'; // Импорт класса для типизации/дефолтов

export const useSettingsStore = defineStore('settingsStore', {
  state: () => ({
    settings: new AppSettings(), // Инициализируем дефолтными сразу, чтобы не было null errors
    loading: false,
    error: null
  }),

    getters: {
    // === Удобные геттеры для компонентов ===
    isDarkTheme: (state) => state.settings.theme === 'dark',
    
    // Достаем список статусов прямо из класса модели
    statusList: (state) => state.settings.statusList, 
    
    // Поиск шаблона по ID (для использования в модалках отправки сообщений)
    getTemplateById: (state) => (id) => {
      return state.settings.messageTemplates.find(t => t.id === id);
    }
  },


  actions: {
    async loadSettings() {
      this.loading = true;
      this.error = null;
      try {
        const data = await settingsService.getSettings();
        this.settings = data;
      } catch (e) {
        console.error('Store: Failed to load settings', e);
        this.error = e;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Универсальный метод обновления всего объекта
     */
    async updateSettings(newSettings) {
      const oldSettings = this.settings.clone();
      this.settings = newSettings; // Оптимистичное обновление

      try {
        await settingsService.saveSettings(newSettings);
      } catch (e) {
        console.error('Store: Failed to save settings', e);
        this.settings = oldSettings; // Роллбэк
        this.error = e;
      }
    },

    /**
     * Гранулярное обновление (для изменения одного поля)
     * Пример использования: updateField('theme', 'dark')
     */
    async updateField(key, value) {
      // 1. Проверяем, изменилось ли значение
      if (this.settings[key] === value) return;

      // 2. Оптимистичное обновление в State
      const oldValue = this.settings[key];
      this.settings[key] = value; 
      
      // Важно: если settings - это класс, лучше пересоздать инстанс для реактивности Vue
      // this.settings = new AppSettings({ ...this.settings, [key]: value }); 

      try {
        // 3. Отправляем в сервис только то, что изменилось
        await settingsService.patchSettings({ [key]: value });
      } catch (e) {
        console.error(`Store: Failed to update field ${key}`, e);
        this.settings[key] = oldValue; // Роллбэк
      }
    },

    // === Специализированные экшены (восстанавливаем старый функционал) ===
    
    toggleTheme() {
      const newTheme = this.settings.theme === 'light' ? 'dark' : 'light';
      this.updateField('theme', newTheme);
    },

    addMessageTemplate(template) {
      const newTemplates = [...this.settings.messageTemplates, template];
      this.updateField('messageTemplates', newTemplates);
    }
  }
});
