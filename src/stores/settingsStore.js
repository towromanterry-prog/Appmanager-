// src/stores/settingsStore.js
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { SettingsModel } from '@/models/SettingsModel';
import * as settingsService from '@/services/settingsService';

const LS_APP_SETTINGS = 'appSettings';
const LS_REQUIRED_FIELDS = 'requiredFields';
const LS_THEME = 'app-theme';

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function setByPath(obj, path, value) {
  const parts = String(path).split('.');
  const last = parts.pop();
  let cur = obj;
  for (const p of parts) {
    if (!cur[p] || typeof cur[p] !== 'object') cur[p] = {};
    cur = cur[p];
  }
  cur[last] = value;
}

function applyTheme(themeKey) {
  const t = themeKey === 'dark' ? 'dark' : 'light';

  // DOM
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.style.colorScheme = t;
  }

  // Vuetify (если проброшен глобально)
  const v = globalThis.__vuetify || globalThis.vuetify;
  const nameRef = v?.theme?.global?.name;
  if (nameRef && typeof nameRef.value !== 'undefined') {
    nameRef.value = t;
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const authStore = useAuthStore();

  const settings = ref(SettingsModel.defaults());
  const loading = ref(false);

  let _uid = null;
  let _unsub = null;
  let _bootstrapped = false;

  const theme = computed(() => settings.value?.theme ?? 'light');
  const appSettings = computed(() => settings.value?.appSettings ?? {});
  const requiredFields = computed(() => settings.value?.requiredFields ?? {});

  function _loadFromLocalStorage() {
    const cachedApp = safeParse(localStorage.getItem(LS_APP_SETTINGS) || 'null');
    const cachedReq = safeParse(localStorage.getItem(LS_REQUIRED_FIELDS) || 'null');
    const cachedTheme = localStorage.getItem(LS_THEME);

    settings.value = new SettingsModel({
      theme: cachedTheme,
      appSettings: cachedApp,
      requiredFields: cachedReq,
    });

    applyTheme(settings.value.theme);
  }

  function _saveToLocalStorage() {
    localStorage.setItem(LS_APP_SETTINGS, JSON.stringify(settings.value.appSettings));
    localStorage.setItem(LS_REQUIRED_FIELDS, JSON.stringify(settings.value.requiredFields));
    localStorage.setItem(LS_THEME, settings.value.theme);
  }

  function _stopRealtime() {
    if (_unsub) _unsub();
    _unsub = null;
    _uid = null;
  }

  function initRealtimeUpdates(uid) {
    // быстрый старт из кэша
    _loadFromLocalStorage();

    if (!uid) return;
    if (_uid === uid && _unsub) return;

    _uid = uid;
    if (_unsub) _unsub();

    loading.value = true;

    _unsub = settingsService.init(
      uid,
      (model) => {
        // merge: облако главнее, но кэш добавляет новые поля/дефолты
        settings.value = new SettingsModel({
          theme: model.theme,
          appSettings: { ...settings.value.appSettings, ...model.appSettings },
          requiredFields: { ...settings.value.requiredFields, ...model.requiredFields },
        });

        _saveToLocalStorage();
        applyTheme(settings.value.theme);
        loading.value = false;
      },
      (err) => {
        console.warn('settings snapshot error:', err);
        loading.value = false;
      },
    );
  }

  /**
   * Авто-инициализация (как в старом сторе): слушаем authStore.currentUserId
   * Важно: main.js уже делает await authStore.init() до mount(). 
   */
  function init() {
    if (_bootstrapped) return;
    _bootstrapped = true;

    _loadFromLocalStorage();

    watch(
      () => authStore.currentUserId,
      (uid) => {
        if (uid) initRealtimeUpdates(uid);
        else _stopRealtime();
      },
      { immediate: true },
    );

    // если тему поменяли локально (например из UI) — применяем сразу
    watch(
      () => settings.value.theme,
      (t) => applyTheme(t),
      { immediate: true },
    );
  }

  async function updateSetting(key, value, uid) {
    const k = String(key);

    // оптимистично локально
    if (k.includes('.')) setByPath(settings.value, k, value);
    else settings.value[k] = value;

    if (k === 'theme') {
      settings.value.theme = value === 'dark' ? 'dark' : 'light';
      applyTheme(settings.value.theme);
    }

    _saveToLocalStorage();

    const effectiveUid = uid || _uid || authStore.currentUserId;
    if (!effectiveUid) return;

    try {
      await settingsService.updateSettings(effectiveUid, { [k]: value });
    } catch (e) {
      console.error('updateSetting failed:', e);
    }
  }

  // === Совместимость со старым API === 3

  function updateAppSettings(newSettings, uid) {
    return updateSetting('appSettings', newSettings, uid);
  }

  function updateRequiredFields(newFields, uid) {
    return updateSetting('requiredFields', newFields, uid);
  }

  function addMessageTemplate(text, uid) {
    const templates = Array.isArray(settings.value.appSettings.messageTemplates)
      ? [...settings.value.appSettings.messageTemplates]
      : [];

    const t = String(text || '').trim();
    if (!t) return;

    templates.push({ id: Date.now(), text: t });
    return updateSetting('appSettings.messageTemplates', templates, uid);
  }

  function updateMessageTemplate(id, text, uid) {
    const templates = Array.isArray(settings.value.appSettings.messageTemplates)
      ? [...settings.value.appSettings.messageTemplates]
      : [];

    const idx = templates.findIndex((t) => t?.id === id);
    if (idx === -1) return;

    templates[idx] = { ...templates[idx], text: String(text || '').trim() };
    return updateSetting('appSettings.messageTemplates', templates, uid);
  }

  function deleteMessageTemplate(id, uid) {
    const templates = Array.isArray(settings.value.appSettings.messageTemplates)
      ? settings.value.appSettings.messageTemplates
      : [];

    return updateSetting(
      'appSettings.messageTemplates',
      templates.filter((t) => t?.id !== id),
      uid,
    );
  }

  async function resetSettings(uid) {
    const def = SettingsModel.defaults();
    settings.value = def;
    _saveToLocalStorage();
    applyTheme(def.theme);

    const effectiveUid = uid || _uid || authStore.currentUserId;
    if (!effectiveUid) return;

    try {
      // сброс в облако целиком (через merge внутри сервиса можно расширять)
      await settingsService.setAllSettings(effectiveUid, def);
    } catch (e) {
      console.error('resetSettings failed:', e);
    }
  }

  // стартуем автоматически (как раньше)
  init();

  return {
    // state
    settings,
    loading,

    // getters-like
    theme,
    appSettings,
    requiredFields,

    // realtime
    init,
    initRealtimeUpdates,
    dispose: _stopRealtime,

    // updates
    updateSetting,
    updateAppSettings,
    updateRequiredFields,

    // templates
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,

    // reset
    resetSettings,
  };
});