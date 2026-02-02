import { defineStore } from 'pinia';
import { ref } from 'vue';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useSettingsStore = defineStore('settings', () => {
  // === Значения по умолчанию (СТРОГО КАК БЫЛО) ===
  const defaultAppSettings = {
    // 1. Статусы (Раздельные настройки для каждого типа сущности)
    orderStatuses: { accepted: true, additional: true, in_progress: true, completed: true, delivered: true },
    serviceStatuses: { accepted: true, additional: true, in_progress: true, completed: true },
    detailStatuses: { accepted: true, additional: true, in_progress: true, completed: true },
    
    additionalStatusName: 'Доп. статус',
    defaultOrderStatus: 'accepted',
    
    // 2. Синхронизация (Сложная структура)
    // Услуги -> Заказ (просто boolean)
    syncServiceToOrderStatus: { 
      additional: true,
      in_progress: true, 
      completed: true 
    },
    // Заказ -> Услуги (объект с подтверждением)
    syncOrderToServiceStatus: { 
      additional: { enabled: false, confirm: true },
      in_progress: { enabled: true, confirm: true },
      completed: { enabled: true, confirm: false } 
    },
    
    // 3. UI и Тексты
    baseFontSize: 16,
    detailsTabLabel: 'Детали',
    orderFormLastNameLabel: 'Фамилия',
    
    // 4. Индикаторы календаря (Массивы строк)
    miniCalendarIndicatorStatuses: ['in_progress', 'completed', 'delivered'],
    fullCalendarIndicatorStatuses: ['in_progress', 'deadline'],
    
    // 5. Поведение
    showCompletedOrders: true,
    enableHapticFeedback: true,
    enablePullToRefresh: true,
    
    // 6. Шаблоны
    messageTemplates: [],
  };

  const defaultRequiredFields = {
    clientName: true,
    phone: true,
    services: true,
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
      console.error("Cloud save error:", e);
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

  // === Инициализация (с миграцией старых данных если нужно) ===
  function init() {
    const storedSettings = localStorage.getItem('appSettings');
    const storedFields = localStorage.getItem('requiredFields');

    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        
        // Восстановление структуры syncOrderToServiceStatus если она была повреждена или старого формата
        // (Обязательно проверяем, является ли значение объектом с полем enabled)
        if (parsed.syncOrderToServiceStatus) {
           // Простая проверка целостности
           const checkKey = 'completed';
           if (typeof parsed.syncOrderToServiceStatus[checkKey] !== 'object') {
             // Если структура битая, сбрасываем секцию синхронизации на дефолт
             parsed.syncOrderToServiceStatus = defaultAppSettings.syncOrderToServiceStatus;
           }
        }

        // Merge аккуратный
        const cleanSettings = { ...defaultAppSettings };
        Object.keys(defaultAppSettings).forEach(key => {
          if (parsed[key] !== undefined) {
            cleanSettings[key] = parsed[key];
          }
        });
        appSettings.value = cleanSettings;
      } catch (e) {
        console.error("Error parsing settings", e);
        appSettings.value = { ...defaultAppSettings };
      }
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
          appSettings.value = { ...appSettings.value, ...data.appSettings };
          saveToLocalStorage();
        }
        if (data.requiredFields) {
          requiredFields.value = { ...requiredFields.value, ...data.requiredFields };
          saveToLocalStorage();
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
