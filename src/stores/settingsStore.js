import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  doc, setDoc, onSnapshot
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

// -----------------------------
// Helpers
// -----------------------------
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Deep merge: source overrides target, но вложенные plain-objects мерджатся.
 * Arrays и примитивы заменяются целиком.
 */
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
    defaultOrderStatus: 'accepted',
    baseFontSize: 16,
    // Если ВСЕ услуги/детали перешли в указанный статус — поднимаем статус заказа
    syncServiceToOrderStatus: {
      additional: true,
      in_progress: true,
      completed: true
    },
    // Если меняем статус заказа — поднимаем услуги/детали (опционально с подтверждением)
    syncOrderToServiceStatus: {
      additional: { enabled: false, confirm: true },
      in_progress: { enabled: true, confirm: true },
      completed: { enabled: true, confirm: false }
    },
    messageTemplates: [],
    detailsTabLabel: 'Детали',
    orderFormLastNameLabel: 'Фамилия',
    
    showCompletedOrders: true,
    compactMode: false,
    swipeRightActions: {
      resetMiniCalendar: true,
      closeFullCalendar: true,
      clearSearch: true,
      resetStatusFilter: true
    },

    // Индикаторы календаря (до 3)
    miniCalendarIndicatorStatuses: ['in_progress', 'completed', 'delivered'],
    fullCalendarIndicatorStatuses: ['in_progress', 'completed', 'delivered'],
    enableHapticFeedback: true,
    enablePullToRefresh: true,
    autoSaveFormDrafts: true
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

  // === Нормализация и миграции ===

  function normalizeAppSettings(settings) {
    const s = { ...settings };

    // 1) Миграция старого формата: syncOrderToServiceStatus = 'none' | 'auto' | 'confirm'
    if (typeof s.syncOrderToServiceStatus === 'string') {
      const oldMode = s.syncOrderToServiceStatus;
      s.syncOrderToServiceStatus = {
        additional: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' },
        in_progress: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' },
        completed: { enabled: oldMode !== 'none', confirm: oldMode === 'confirm' }
      };
    }

    // 2) Гарантируем наличие всех ключей статусов (и что accepted всегда включен)
    const merged = deepMerge(defaultAppSettings, s);
    merged.orderStatuses.accepted = true;
    merged.serviceStatuses.accepted = true;
    merged.detailStatuses.accepted = true;

    // 3) Подстраховка типов
    if (typeof merged.additionalStatusName !== 'string' || !merged.additionalStatusName.trim()) {
      merged.additionalStatusName = defaultAppSettings.additionalStatusName;
    }

    return merged;
  }

  // === Логика сохранения ===
  
  function saveToLocalStorage() {
    localStorage.setItem('appSettings', JSON.stringify(appSettings.value));
    localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
  }

  async function saveToFirebase() {
    if (!user.value) return;
    try {
      await setDoc(doc(db, 'users', user.value.uid, 'settings', 'general'), {
        appSettings: appSettings.value,
        requiredFields: requiredFields.value
      });
    } catch (e) {
      console.error("Ошибка сохранения настроек в облако:", e);
    }
  }

  // 3. Общая функция обновления
  function updateAppSettings(newSettings) {
    // Принимаем как полный объект, так и patch
    const next = isPlainObject(newSettings)
      ? deepMerge(appSettings.value, newSettings)
      : appSettings.value;

    appSettings.value = normalizeAppSettings(next);
    saveToLocalStorage();
    saveToFirebase(); // <-- Отправляем в облако
  }

  function updateRequiredFields(newFields) {
    requiredFields.value = deepMerge(requiredFields.value, newFields);
    saveToLocalStorage();
    saveToFirebase(); // <-- Отправляем в облако
  }

  // === Инициализация ===
  function loadSettings() {
    if (isInitialized) return;
    isInitialized = true;

    // 1) Сначала грузим из LocalStorage (чтобы было быстро)
    const storedSettingsRaw = localStorage.getItem('appSettings');
    const storedFieldsRaw = localStorage.getItem('requiredFields');
    const storedSettings = storedSettingsRaw ? safeJsonParse(storedSettingsRaw) : null;
    const storedFields = storedFieldsRaw ? safeJsonParse(storedFieldsRaw) : null;

    if (storedSettings && isPlainObject(storedSettings)) {
      appSettings.value = normalizeAppSettings(storedSettings);
    } else {
      appSettings.value = { ...defaultAppSettings };
    }

    if (storedFields && isPlainObject(storedFields)) {
      requiredFields.value = deepMerge(defaultRequiredFields, storedFields);
    } else {
      requiredFields.value = { ...defaultRequiredFields };
    }

    // 2) Потом подключаемся к Firebase
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        subscribeToUserSettings(currentUser.uid);
      } else {
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserSettings(userId) {
    if (unsubscribe) unsubscribe();
    
    unsubscribe = onSnapshot(doc(db, 'users', userId, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Если в облаке есть настройки — принимаем их (они главнее)
        if (data.appSettings) {
          appSettings.value = normalizeAppSettings(deepMerge(appSettings.value, data.appSettings));
          localStorage.setItem('appSettings', JSON.stringify(appSettings.value)); // Обновляем локальный кэш
        }
        if (data.requiredFields) {
          requiredFields.value = deepMerge(requiredFields.value, data.requiredFields);
          localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
        }
      }
    });
  }

  // === Методы ===
  function addMessageTemplate(text) {
    const newTemplate = { id: Date.now(), text };
    appSettings.value.messageTemplates.push(newTemplate);
    updateAppSettings(appSettings.value);
  }

  function updateMessageTemplate(id, text) {
    const index = appSettings.value.messageTemplates.findIndex(t => t.id === id);
    if (index !== -1) {
      appSettings.value.messageTemplates[index].text = text;
      updateAppSettings(appSettings.value);
    }
  }

  function deleteMessageTemplate(id) {
    appSettings.value.messageTemplates = appSettings.value.messageTemplates.filter(t => t.id !== id);
    updateAppSettings(appSettings.value);
  }
  
  function isFieldRequired(fieldName) {
    return requiredFields.value[fieldName] === true;
  }

  function resetSettings() {
    appSettings.value = { ...defaultAppSettings };
    requiredFields.value = { ...defaultRequiredFields };
    saveToLocalStorage();
    saveToFirebase();
  }

  // Авто-инициализация (и при этом сохраняем совместимость с App.vue, где вызывается loadSettings())
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
    isFieldRequired,
    resetSettings
  };
});
