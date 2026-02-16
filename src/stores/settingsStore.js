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

function isPlainObject(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v);
}

function getByPath(obj, path) {
  const parts = String(path || '').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
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

// Делает nested patch из "a.b.c" => { a: { b: { c: value } } }
function buildPatchFromPath(path, value) {
  const parts = String(path).split('.').filter(Boolean);
  if (parts.length === 0) return {};
  if (parts.length === 1) return { [parts[0]]: value };

  const root = {};
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const key = parts[i];
    if (i === parts.length - 1) {
      cur[key] = value;
    } else {
      cur[key] = isPlainObject(cur[key]) ? cur[key] : {};
      cur = cur[key];
    }
  }
  return root;
}

function mergeDeep(target, src) {
  if (!isPlainObject(target) || !isPlainObject(src)) return target;
  for (const [k, v] of Object.entries(src)) {
    if (isPlainObject(v)) {
      if (!isPlainObject(target[k])) target[k] = {};
      mergeDeep(target[k], v);
    } else {
      target[k] = v; // массивы/примитивы — заменяем целиком
    }
  }
  return target;
}

function applyTheme(themeKey) {
  const t = themeKey === 'dark' ? 'dark' : 'light';

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

function applyFontScale(scale) {
  if (typeof document === 'undefined') return;
  const n = Number(scale);
  const safe = Number.isFinite(n) && n > 0 ? n : 1;
  document.documentElement.style.setProperty('--app-font-scale', String(safe));
}

function effectiveFontPx(appSettings) {
  // В модели дефолт — baseFontSize 3,
  // а UI пишет appSettings.fontSize 4
  const raw = appSettings?.fontSize ?? appSettings?.baseFontSize ?? 16;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 16;
}

export const useSettingsStore = defineStore('settings', () => {
  const authStore = useAuthStore();

  const settings = ref(SettingsModel.defaults());
  const loading = ref(false);

  let _uid = null;
  let _unsub = null;
  let _bootstrapped = false;

  // === buffered persistence state ===
  let _lsTimer = null;

  let _flushTimer = null;
  let _flushing = false;
  let _needsFlushAfter = false;

  let _pendingUid = null;
  let _pendingPatch = {};           // nested patch object
  const _pendingPaths = new Set();  // paths like "appSettings.showCancelled"
  let _pendingWaiters = [];

  function _scheduleLocalSave(delay = 250) {
    if (typeof localStorage === 'undefined') return;
    if (_lsTimer) clearTimeout(_lsTimer);
    _lsTimer = setTimeout(() => {
      _lsTimer = null;
      _saveToLocalStorage();
    }, delay);
  }

  function _saveToLocalStorage() {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(LS_APP_SETTINGS, JSON.stringify(settings.value.appSettings));
    localStorage.setItem(LS_REQUIRED_FIELDS, JSON.stringify(settings.value.requiredFields));
    localStorage.setItem(LS_THEME, settings.value.theme);
  }

  function _loadFromLocalStorage() {
    if (typeof localStorage === 'undefined') return;

    const cachedApp = safeParse(localStorage.getItem(LS_APP_SETTINGS) || 'null');
    const cachedReq = safeParse(localStorage.getItem(LS_REQUIRED_FIELDS) || 'null');
    const cachedTheme = localStorage.getItem(LS_THEME);

    settings.value = new SettingsModel({
      theme: cachedTheme,
      appSettings: cachedApp,
      requiredFields: cachedReq,
    });

    applyTheme(settings.value.theme);
    applyFontScale(effectiveFontPx(settings.value.appSettings) / 16);
  }

  function _clearBuffered() {
    if (_lsTimer) clearTimeout(_lsTimer);
    _lsTimer = null;

    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = null;

    _pendingUid = null;
    _pendingPatch = {};
    _pendingPaths.clear();

    // чтобы await-ы не зависали
    const waiters = _pendingWaiters;
    _pendingWaiters = [];
    waiters.forEach(({ resolve }) => resolve());
  }

  function _stopRealtime() {
    if (_unsub) _unsub();
    _unsub = null;
    _uid = null;
    _clearBuffered();
  }

  async function _flushRemoteNow() {
    if (_flushing) {
      _needsFlushAfter = true;
      return;
    }

    const effectiveUid = _pendingUid || _uid || authStore.currentUserId;
    if (!effectiveUid) {
      const waiters = _pendingWaiters;
      _pendingWaiters = [];
      waiters.forEach(({ resolve }) => resolve());
      _pendingPatch = {};
      _pendingPaths.clear();
      return;
    }

    const hasPatch = isPlainObject(_pendingPatch) && Object.keys(_pendingPatch).length > 0;
    if (!hasPatch) {
      const waiters = _pendingWaiters;
      _pendingWaiters = [];
      waiters.forEach(({ resolve }) => resolve());
      return;
    }

    _flushing = true;

    const patch = _pendingPatch;
    const waiters = _pendingWaiters;

    // сбрасываем очередь ДО await, чтобы новые апдейты собирались отдельно
    _pendingPatch = {};
    _pendingWaiters = [];
    _pendingPaths.clear();

    try {
      await settingsService.updateSettings(effectiveUid, patch);
      waiters.forEach(({ resolve }) => resolve());
    } catch (e) {
      console.error('settings flush failed:', e);
      waiters.forEach(({ reject }) => reject(e));
    } finally {
      _flushing = false;
      if (_needsFlushAfter) {
        _needsFlushAfter = false;
        // без setTimeout: добиваем хвост
        _flushRemoteNow();
      }
    }
  }

  function _delayForKey(path) {
    // Тексты/много символов — дольше
    if (
      path === 'appSettings.additionalStatusName' ||
      path === 'appSettings.detailsTabLabel' ||
      path === 'appSettings.orderFormLastNameLabel'
    ) return 450;

    // Слайдер шрифта — часто дергается
    if (path === 'appSettings.fontSize') return 250;

    // По умолчанию (switch/select/checkbox)
    return 180;
  }

  function _scheduleFlush(delay) {
    if (_flushTimer) clearTimeout(_flushTimer);
    _flushTimer = setTimeout(() => {
      _flushTimer = null;
      _flushRemoteNow();
    }, delay);
  }

  const theme = computed(() => settings.value?.theme ?? 'light');
  const appSettings = computed(() => settings.value?.appSettings ?? {});
  const requiredFields = computed(() => settings.value?.requiredFields ?? {});

  const fontScale = computed(() => effectiveFontPx(settings.value?.appSettings) / 16);

  // === Order status colors (single source of truth) ===
  const DEFAULT_ORDER_STATUS_COLORS = {
    accepted: '#4F8CFF',
    in_progress: '#F2B24C',
    additional: '#7C6CFF',
    completed: '#39C37D',
    delivered: '#9AA4B2',
    cancelled: '#FF5D73',
  };

  const _normStatus = (s) => String(s || '').trim().toLowerCase();

  const orderStatusColors = computed(() => ({
    ...DEFAULT_ORDER_STATUS_COLORS,
    ...(settings.value?.orderStatusColors || {}),
    ...(settings.value?.appSettings?.orderStatusColors || {}),
  }));

  const getOrderStatusColor = (status) => {
    const key = _normStatus(status);
    return orderStatusColors.value[key] || DEFAULT_ORDER_STATUS_COLORS.delivered;
  };

  function initRealtimeUpdates(uid) {
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
        const merged = new SettingsModel({
          theme: model.theme,
          appSettings: { ...settings.value.appSettings, ...model.appSettings },
          requiredFields: { ...settings.value.requiredFields, ...model.requiredFields },
        });

        // не затираем то, что прямо сейчас правит пользователь (до flush)
        for (const p of _pendingPaths) {
          const localVal = getByPath(settings.value, p);
          if (localVal !== undefined) setByPath(merged, p, localVal);
        }

        settings.value = merged;

        _scheduleLocalSave(250);
        loading.value = false;
      },
      (err) => {
        console.warn('settings snapshot error:', err);
        loading.value = false;
      },
    );
  }

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

    watch(
      () => settings.value.theme,
      (t) => applyTheme(t),
      { immediate: true },
    );

    watch(
      () => effectiveFontPx(settings.value?.appSettings),
      (px) => applyFontScale(px / 16),
      { immediate: true },
    );
  }

  // Главное: local меняем мгновенно, а в Firestore/LS пишем буфером
  function updateSetting(key, value, uid) {
    const k = String(key);

    // оптимистично локально
    if (k.includes('.')) setByPath(settings.value, k, value);
    else settings.value[k] = value;

    if (k === 'theme') {
      settings.value.theme = value === 'dark' ? 'dark' : 'light';
      applyTheme(settings.value.theme);
    }

    // localStorage — тоже буфером (иначе фризы)
    _scheduleLocalSave(250);

    const effectiveUid = uid || _uid || authStore.currentUserId;
    if (!effectiveUid) return Promise.resolve();

    _pendingUid = effectiveUid;

    // собираем patch без dotted keys, чтобы сервис делал 1 setDoc(merge)
    _pendingPaths.add(k);
    const patch = buildPatchFromPath(k, value);
    mergeDeep(_pendingPatch, patch);

    const delay = _delayForKey(k);
    _scheduleFlush(delay);

    return new Promise((resolve, reject) => {
      _pendingWaiters.push({ resolve, reject });
    });
  }

  // === Совместимость со старым API ===
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
    _clearBuffered();

    const def = SettingsModel.defaults();
    settings.value = def;
    _saveToLocalStorage();
    applyTheme(def.theme);
    applyFontScale(effectiveFontPx(def.appSettings) / 16);

    const effectiveUid = uid || _uid || authStore.currentUserId;
    if (!effectiveUid) return;

    try {
      await settingsService.setAllSettings(effectiveUid, def);
    } catch (e) {
      console.error('resetSettings failed:', e);
    }
  }

  init();

  return {
    // state
    settings,
    loading,

    // getters-like
    theme,
    appSettings,
    requiredFields,
    fontScale,

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

    // цвета
    orderStatusColors,
    getOrderStatusColor,

    // reset
    resetSettings,
  };
});