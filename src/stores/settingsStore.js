import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { 
  doc, setDoc, onSnapshot 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useSettingsStore = defineStore('settings', () => {
  // === Значения по умолчанию ===
  const defaultAppSettings = {
    orderStatuses: { accepted: true, in_progress: true, completed: true, delivered: true },
    serviceStatuses: { accepted: true, in_progress: true, completed: true },
    detailStatuses: { accepted: true, in_progress: true, completed: true },
    additionalStatusName: 'Ждет запчасти',
    defaultOrderStatus: 'accepted',
    baseFontSize: 16,
    syncServiceToOrderStatus: { completed: true },
    syncOrderToServiceStatus: { 
      completed: { enabled: true, confirm: true },
      in_progress: { enabled: false, confirm: false }
    },
    messageTemplates: [],
    detailsTabLabel: 'Детали',
    orderFormLastNameLabel: 'Фамилия',
    // UI настройки (можно не синхронизировать, но удобно)
    compactMode: false,
    showCompletedOrders: true,
    swipeRightActions: {
      resetMiniCalendar: true,
      closeFullCalendar: true,
      clearSearch: true,
      resetStatusFilter: true
    },
    miniCalendarIndicatorStatuses: ['in_progress'],
    fullCalendarIndicatorStatuses: ['in_progress', 'deadline'],
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
  let unsubscribe = null;

  // === Логика сохранения ===
  
  // 1. Сохраняем в localStorage (всегда, как кэш)
  function saveToLocalStorage() {
    localStorage.setItem('appSettings', JSON.stringify(appSettings.value));
    localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
  }

  // 2. Сохраняем в Firebase (если залогинены)
  async function saveToFirebase() {
    if (!user.value) return;
    try {
      // Сохраняем всё в один документ 'settings'
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
    appSettings.value = newSettings;
    saveToLocalStorage();
    saveToFirebase(); // <-- Отправляем в облако
  }

  function updateRequiredFields(newFields) {
    requiredFields.value = newFields;
    saveToLocalStorage();
    saveToFirebase(); // <-- Отправляем в облако
  }

  // === Инициализация ===
  function init() {
    // Сначала грузим из LocalStorage (чтобы было быстро)
    const storedSettings = localStorage.getItem('appSettings');
    const storedFields = localStorage.getItem('requiredFields');

    if (storedSettings) {
      // Merge с дефолтными, чтобы новые поля не ломали старые настройки
      appSettings.value = { ...defaultAppSettings, ...JSON.parse(storedSettings) };
    }
    if (storedFields) {
      requiredFields.value = { ...defaultRequiredFields, ...JSON.parse(storedFields) };
    }

    // Потом подключаемся к Firebase
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
    
    // Слушаем документ users/{uid}/settings/general
    unsubscribe = onSnapshot(doc(db, 'users', userId, 'settings', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Если в облаке есть настройки — принимаем их (они главнее)
        if (data.appSettings) {
          appSettings.value = { ...appSettings.value, ...data.appSettings };
          localStorage.setItem('appSettings', JSON.stringify(appSettings.value)); // Обновляем локальный кэш
        }
        if (data.requiredFields) {
          requiredFields.value = { ...requiredFields.value, ...data.requiredFields };
          localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
        }
      }
    });
  }

  // Методы для работы с шаблонами (они часть appSettings)
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

  function resetSettings() {
    appSettings.value = { ...defaultAppSettings };
    requiredFields.value = { ...defaultRequiredFields };
    saveToLocalStorage();
    saveToFirebase();
  }

  init();

  return {
    appSettings,
    requiredFields,
    updateAppSettings,
    updateRequiredFields,
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    resetSettings
  };
});
