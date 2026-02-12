import { defineStore } from 'pinia';
import AppSettings from '@/models/AppSettings';
import settingsService from '../services/settingsService';

const LS_KEY = 'app-settings';

function normalizeSettings(v) {
  if (!v) return new AppSettings();
  if (typeof v.clone === 'function') return v; // уже модель
  return new AppSettings(v); // plain-object -> модель
}

function persistLocal(settings) {
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        theme: settings.theme,
        currency: settings.currency,
        language: settings.language,
        fontSize: settings.fontSize,
      })
    );
  } catch (e) {
    console.warn('Failed to persist settings to localStorage', e);
  }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to read settings from localStorage', e);
    return null;
  }
}

function applyFontScale(settings) {
  if (!settings || typeof settings.fontSize !== 'number') return;
  document.documentElement.style.setProperty('--app-font-scale', String(settings.fontSize / 16));
}

export const useSettingsStore = defineStore('settingsStore', {
  state: () => ({
    settings: null,
    loading: false,
  }),

  actions: {
    async loadSettings() {
      this.loading = true;
      try {
        const remote = await settingsService.getSettings();
        const merged = remote || loadLocal();
        this.settings = normalizeSettings(merged);
      } catch (e) {
        console.error('Failed to load settings (remote). Fallback to local.', e);
        this.settings = normalizeSettings(loadLocal());
      } finally {
        this.loading = false;
        persistLocal(this.settings);
        applyFontScale(this.settings);
      }
    },

    async updateSettings(newSettings) {
      const next = normalizeSettings(newSettings);
      this.settings = next;

      // Всегда сохраняем локально (даже без входа)
      persistLocal(next);
      applyFontScale(next);

      try {
        await settingsService.saveSettings(next);
      } catch (e) {
        // Не откатываем UI — просто нет remote sync без входа
        console.warn('Failed to save settings to remote. Kept local settings.', e);
      }
    },
  },
});
