import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useSettingsStore = defineStore('settings', () => {
  // === Значения по умолчанию ===
  const defaultAppSettings = {
    // Статусы
    orderStatuses: { accepted: true, in_progress: true, completed: true, delivered: true },
    serviceStatuses: { accepted: true, in_progress: true, completed: true },
    detailStatuses: { accepted: true, in_progress: true, completed: true },
    additionalStatusName: 'Ждет запчасти',
    defaultOrderStatus: 'accepted',
    
    // Синхронизация статусов (оставляем логику, даже если UI скрыт)
    syncServiceToOrderStatus: { completed: true },
    syncOrderToServiceStatus: { 
      completed: { enabled: true, confirm: true },
      in_progress: { enabled: false, confirm: false }
    },
    
    // UI и Тексты
    baseFontSize: 16,
    detailsTabLabel: 'Детали',
    orderFormLastNameLabel: 'Фамилия',
    
    // Индикаторы календаря
    miniCalendarIndicatorStatuses: ['in_progress'],
    fullCalendarIndicatorStatuses: ['in_progress', 'deadline'],
    
    // Поведение
    showCompletedOrders: true,
    enableHapticFeedback: true,
    enablePullToRefresh: true,
    
    // Шаблоны сообщений
    messageTemplates: [],
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

  function updateAppSettings(newSettings) {
    appSettings.value = newSettings;
    saveToLocalStorage();
    saveToFirebase();
  }

  function updateRequiredFields(newFields) {
    requiredFields.value = newFields;
    saveToLocalStorage();
    saveToFirebase();
  }

  // === Инициализация ===
  function init() {
    const storedSettings = localStorage.getItem('appSettings');
    const storedFields = localStorage.getItem('requiredFields');

    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Чистим от старых удаленных ключей
      const cleanSettings = { ...defaultAppSettings };
      Object.keys(defaultAppSettings).forEach(key => {
        if (parsed[key] !== undefined) {
          cleanSettings[key] = parsed[key];
        }
      });
      appSettings.value = cleanSettings;
    }
    
    if (storedFields) {
      requiredFields.value = { ...defaultRequiredFields, ...JSON.parse(storedFields) };
    }

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
        if (data.appSettings) {
          const merged = { ...appSettings.value };
          Object.keys(defaultAppSettings).forEach(key => {
            if (data.appSettings[key] !== undefined) {
              merged[key] = data.appSettings[key];
            }
          });
          appSettings.value = merged;
          localStorage.setItem('appSettings', JSON.stringify(appSettings.value));
        }
        if (data.requiredFields) {
          requiredFields.value = { ...requiredFields.value, ...data.requiredFields };
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

  init();

  return {
    appSettings,
    requiredFields,
    updateAppSettings,
    updateRequiredFields,
    addMessageTemplate,
    updateMessageTemplate,
    deleteMessageTemplate,
    isFieldRequired,
    resetSettings
  };
});
