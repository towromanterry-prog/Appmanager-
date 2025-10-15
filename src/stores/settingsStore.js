// settingsStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsStore = defineStore('settings', () => {
  const requiredFields = ref({
    clientName: true,
    phone: true,
    services: true,
    deadline: false,
    notes: false,
    lastName: false,
    details: false
  });
  
  const appSettings = ref({
    enableHapticFeedback: true,
    enablePullToRefresh: true,
    defaultOrderStatus: 'accepted',
    autoSaveFormDrafts: true,
    showCompletedOrders: true,
    compactMode: false,
    // Настройки статусов
    additionalStatusName: 'Доп. статус',
    orderStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true,
      delivered: true,
    },
    serviceStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true,
    },
    detailStatuses: {
      accepted: true,
      additional: true,
      in_progress: true,
      completed: true,
    },
    syncServiceToOrderStatus: {
      additional: true,
      in_progress: true,
      completed: true,
    },
    // НОВАЯ СТРУКТУРА - вместо 'none' | 'auto' | 'confirm'
    syncOrderToServiceStatus: {
      additional: { enabled: false, confirm: true },
      in_progress: { enabled: true, confirm: true },
      completed: { enabled: true, confirm: false },
    },
    // Поле для фамилии
    orderFormLastNameLabel: 'Фамилия',
    // Название вкладки "Детали"
    detailsTabLabel: 'Детали',
    // Поведение правого свайпа
    swipeRightActions: {
      resetMiniCalendar: true,
      closeFullCalendar: true,
      clearSearch: true,
      resetStatusFilter: true,
    },
    messageTemplates: {
      sms: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
      whatsapp: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
      telegram: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
    },
  });
  
  function loadSettings() {
    // Загрузка обязательных полей с обработкой ошибок
    try {
      const storedRequired = localStorage.getItem('requiredFields');
      if (storedRequired) {
        const parsed = JSON.parse(storedRequired);
        if (typeof parsed === 'object' && parsed !== null) {
          requiredFields.value = { ...requiredFields.value, ...parsed };
        } else {
          throw new Error('Stored requiredFields is not an object');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки requiredFields из localStorage:', error);
      localStorage.removeItem('requiredFields');
    }
    
    // Загрузка настроек приложения с обработкой ошибок
    try {
      const storedSettings = localStorage.getItem('appSettings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        if (typeof parsed === 'object' && parsed !== null) {
          // Миграция старого формата syncOrderToServiceStatus
          if (typeof parsed.syncOrderToServiceStatus === 'string') {
            const oldMode = parsed.syncOrderToServiceStatus;
            parsed.syncOrderToServiceStatus = {
              additional: { 
                enabled: oldMode !== 'none', 
                confirm: oldMode === 'confirm' 
              },
              in_progress: { 
                enabled: oldMode !== 'none', 
                confirm: oldMode === 'confirm' 
              },
              completed: { 
                enabled: oldMode !== 'none', 
                confirm: oldMode === 'confirm' 
              },
            };
          }
          appSettings.value = { ...appSettings.value, ...parsed };
        } else {
          throw new Error('Stored appSettings is not an object');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки appSettings из localStorage:', error);
      localStorage.removeItem('appSettings');
    }
  }
  
  function updateRequiredFields(fields) {
    requiredFields.value = { ...requiredFields.value, ...fields };
    localStorage.setItem('requiredFields', JSON.stringify(requiredFields.value));
  }
  
  function updateAppSettings(settings) {
    appSettings.value = { ...appSettings.value, ...settings };
    localStorage.setItem('appSettings', JSON.stringify(appSettings.value));
  }
  
  function resetSettings() {
    requiredFields.value = {
      clientName: true,
      phone: true,
      services: true,
      deadline: false,
      notes: false,
      lastName: false
    };
    
    appSettings.value = {
      enableHapticFeedback: true,
      enablePullToRefresh: true,
      defaultOrderStatus: 'accepted',
      autoSaveFormDrafts: true,
      showCompletedOrders: true,
      compactMode: false,
      additionalStatusName: 'Доп. статус',
      orderStatuses: {
        accepted: true,
        additional: true,
        in_progress: true,
        completed: true,
        delivered: true,
      },
      serviceStatuses: {
        accepted: true,
        additional: true,
        in_progress: true,
        completed: true,
      },
      syncServiceToOrderStatus: {
        additional: true,
        in_progress: true,
        completed: true,
      },
      syncOrderToServiceStatus: {
        additional: { enabled: false, confirm: true },
        in_progress: { enabled: true, confirm: true },
        completed: { enabled: true, confirm: false },
      },
      orderFormLastNameLabel: 'Фамилия',
      detailsTabLabel: 'Детали',
      swipeRightActions: {
        resetMiniCalendar: true,
        closeFullCalendar: true,
        clearSearch: true,
        resetStatusFilter: true,
      },
      messageTemplates: {
        sms: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
        whatsapp: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
        telegram: 'Здравствуйте, %имя%. Ваш заказ на сумму %цена% готов.',
      },
    };
    
    localStorage.removeItem('requiredFields');
    localStorage.removeItem('appSettings');
  }
  
  function isFieldRequired(fieldName) {
    return requiredFields.value[fieldName] || false;
  }
  
  return {
    requiredFields,
    appSettings,
    loadSettings,
    updateRequiredFields,
    updateAppSettings,
    resetSettings,
    isFieldRequired
  };
});