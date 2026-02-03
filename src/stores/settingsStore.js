import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

// -----------------------------
// Helpers
// -----------------------------
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function deepMerge(target, source) {
  if (!isPlainObject(target) || !isPlainObject(source)) return source;
  const out = { ...target };
  for (const [k, v] of Object.entries(source)) {
    if (isPlainObject(v) && isPlainObject(out[k])) out[k] = deepMerge(out[k], v);
    else out[k] = v;
  }
  return out;
}

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

export const useSettingsStore = defineStore('settings', () => {
  // === Значения по умолчанию ===
  const defaultAppSettings = {
    // Настройки статусов
    additionalStatusName: 'Ждет запчасти',
    orderStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true,
      delivered: true
    },
    serviceStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true
    },
    detailStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true
    },

    // Статус по умолчанию
    defaultOrderStatus: 'accepted',

    // Система шрифтов
    baseFontSize: 16,

    // Синхронизация статусов
    syncServiceToOrderStatus: {
      additional: true,
      in_progress: true,
      completed: true
    },
    syncOrderToServiceStatus: {
      additional: { enabled: false, confirm: true },
      in_progress: { enabled: true, confirm: true },
      completed: { enabled: true, confirm: false }
    },

    // Шаблоны сообщений
    messageTemplates: [],

    // Визуальные настройки
    showCompletedOrders: true,
    enableHapticFeedback: true,
    enablePullToRefresh: true,

    // Названия в UI
    detailsTabLabel: 'Детали',
    orderFormLastNameLabel: 'Фамилия',

    // Индикаторы календаря (до 3)
    miniCalendarIndicatorStatuses: ['in_progress', 'completed', 'delivered'],
    fullCalendarIndicatorStatuses: ['in_progress', 'completed', 'delivered']
  };

  const defaultRequiredFields = {
    clientName: true,
    phone: false,
    services: false,
    deadline: false,
    notes: false,
    details: false,
    lastName: false
  };

  // === State ===
  const appSettings = ref({ ...defaultAppSettings });
  const requiredFields = ref({ ...defaultRequiredFields });
  const user = ref(null);

  let isInitialized = false;
  let unsubscribe = null;

  const DEPRECATED_KEYS = new Set([
    'compactMode',
    'autoSaveFormDrafts',
    'swipeRightActions'
  ]);

  function normalizeAppSettings(input) {
    const s = isPlainObject(input) ? { ...input } : {};

    // Убираем мусор из старых версий
    for (const k of DEPRECATED_KEYS) {
      if (k in s) delete s[k];
    }

    // Миграция старого формата syncOrderToServiceStatus: 'none' | 'auto' | 'confirm'
    if (typeof s.syncOrderToServiceStatus === 'string') {
      const oldMode = s.syncOrderToServiceStatus;
      s.syncOrderToServiceStatus = {
        additional: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' },
        in_progress: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' },
        completed: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' }
      };
    }

    // Домердживаем с дефолтами, чтобы новые поля не терялись
    const merged = deepMerge(defaultAppSettings, s);

    // accepted всегда доступен
    merged.orderStatuses.accepted = true;
    merged.serviceStatuses.accepted = true;
    merged.detailStatuses.accepted = true;

    // Подстраховки по строкам
    if (typeof merged.additionalStatusName !== 'string' || !merged.additionalStatusName.trim()) {
      merged.additionalStatusName = defaultAppSettings.additionalStatusName;
    }
    if (typeof merged.detailsTabLabel !== 'string' || !merged.detailsTabLabel.trim()) {
      merged.detailsTabLabel = defaultAppSettings.detailsTabLabel;
    }
    if (typeof merged.orderFormLastNameLabel !== 'string' || !merged.orderFormLastNameLabel.trim()) {
      merged.orderFormLastNameLabel = defaultAppSettings.orderFormLastNameLabel;
    }

    // Индикаторы: уникально, максимум 3, только активные статусы
    const normalizeIndicators = (arr) => {
      if (!Array.isArray(arr)) return [];
      const uniq = [...new Set(arr)];
      // Фильтруем, оставляя только те, что включены в orderStatuses
      return uniq.filter((k) => merged.orderStatuses[k]).slice(0, 3);
    };
    merged.miniCalendarIndicatorStatuses = normalizeIndicators(merged.miniCalendarIndicatorStatuses);
    merged.fullCalendarIndicatorStatuses = normalizeIndicators(merged.fullCalendarIndicatorStatuses);

    return merged;
  }

  // === Save ===
  function saveToLocalStorage() {
    localStorage.setItem('appSettings', JSON.stringify(appSettings.value));
    localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
  }

  async function saveToFirebase() {
    if (!user.value) return;

    try {
      await setDoc(
        doc(db, 'users', user.value.uid, 'settings', 'general'),
        {
          appSettings: appSettings.value,
          requiredFields: requiredFields.value
        },
        { merge: true }
      );
    } catch (e) {
      console.error('Ошибка сохранения настроек в облако:', e);
    }
  }

  // === Update ===
  function updateAppSettings(patch) {
    const next = isPlainObject(patch) ? deepMerge(appSettings.value, patch) : appSettings.value;
    appSettings.value = normalizeAppSettings(next);
    saveToLocalStorage();
    saveToFirebase();
  }

  function updateRequiredFields(patch) {
    requiredFields.value = isPlainObject(patch)
      ? deepMerge(requiredFields.value, patch)
      : requiredFields.value;
    saveToLocalStorage();
    saveToFirebase();
  }

  // === Init ===
  function loadSettings() {
    if (isInitialized) return;
    isInitialized = true;

    // 1) Локальный кэш
    const storedSettings = safeJsonParse(localStorage.getItem('appSettings') || '');
    const storedFields = safeJsonParse(localStorage.getItem('requiredFields') || '');

    appSettings.value = normalizeAppSettings(storedSettings || defaultAppSettings);

    requiredFields.value = isPlainObject(storedFields)
      ? deepMerge(defaultRequiredFields, storedFields)
      : { ...defaultRequiredFields };

    // 2) Firebase (если залогинились)
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;

      if (currentUser) {
        subscribeToUserSettings(currentUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
        unsubscribe = null;
      }
    });
  }

  function subscribeToUserSettings(userId) {
    if (unsubscribe) unsubscribe();

    unsubscribe = onSnapshot(
      doc(db, 'users', userId, 'settings', 'general'),
      (docSnap) => {
        if (!docSnap.exists()) return;

        const data = docSnap.data();

        if (data?.appSettings && isPlainObject(data.appSettings)) {
          appSettings.value = normalizeAppSettings(deepMerge(appSettings.value, data.appSettings));
        }

        if (data?.requiredFields && isPlainObject(data.requiredFields)) {
          requiredFields.value = deepMerge(requiredFields.value, data.requiredFields);
        }

        saveToLocalStorage();
      },
      (error) => {
        console.error('Ошибка синхронизации настроек:', error);
      }
    );
  }

  // === Message templates ===
  function addMessageTemplate(text) {
    const newTemplate = { id: Date.now(), text };
    const next = {
      messageTemplates: [...(appSettings.value.messageTemplates || []), newTemplate]
    };
    updateAppSettings(next);
  }

  function updateMessageTemplate(id, text) {
    const nextList = (appSettings.value.messageTemplates || []).map((t) =>
      t.id === id ? { ...t, text } : t
    );
    updateAppSettings({ messageTemplates: nextList });
  }

  function deleteMessageTemplate(id) {
    const nextList = (appSettings.value.messageTemplates || []).filter((t) => t.id !== id);
    updateAppSettings({ messageTemplates: nextList });
  }

  function resetSettings() {
    appSettings.value = { ...defaultAppSettings };
    requiredFields.value = { ...defaultRequiredFields };
    saveToLocalStorage();
    saveToFirebase();
  }

  function isFieldRequired(fieldName) {
    return requiredFields.value[fieldName] === true;
  }

  // Авто-инициализация
  loadSettings();

  return {
    appSettings,
    requiredFields,
    loadSettings,
    updateAppSettings,
    updateRequiredFields,
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    resetSettings,
    isFieldRequired
  };
});
