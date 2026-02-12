export default class AppSettings {
  constructor(data = {}) {
    this.id = data.id || 'user_preferences';

    // === 1. Основные настройки UI ===
    this.theme = data.theme || 'light';
    this.fontSize = data.fontSize || 16;
    this.compactMode = data.compactMode ?? false; // Компактный вид списков
    this.enableHapticFeedback = data.enableHapticFeedback ?? true; // Вибрация

    // === 2. Настройки статусов (Бизнес-логика) ===
    // Это критически важная часть, которую мы восстанавливаем
    this.orderStatuses = data.orderStatuses || { 
      accepted: 'Принят', 
      in_progress: 'В работе', 
      ready: 'Готов', 
      issued: 'Выдан' 
    };
    this.defaultOrderStatus = data.defaultOrderStatus || 'accepted';
    
    // Синхронизация статусов (если вы используете связку Заказ <-> Услуга)
    this.syncOrderToServiceStatus = data.syncOrderToServiceStatus ?? true;

    // === 3. Шаблоны сообщений ===
    this.messageTemplates = data.messageTemplates || [
      { id: 't1', title: 'Готовность', text: 'Ваш заказ готов к выдаче.' },
      { id: 't2', title: 'Уточнение', text: 'Добрый день, нужно уточнить детали заказа.' }
    ];

    // === 4. Поведение списков и календаря ===
    this.swipeRightAction = data.swipeRightAction || 'complete'; 
    this.showArchivedOrders = data.showArchivedOrders ?? false;
  }

  // Клонирование для реактивности Vue
  clone() {
    return new AppSettings({ ...this });
  }

  // Геттер для удобного перебора статусов в <select> или v-for
  get statusList() {
    return Object.entries(this.orderStatuses).map(([key, label]) => ({ key, label }));
  }
}

export const settingsConverter = {
  toFirestore: (settings) => {
    return {
      theme: settings.theme,
      fontSize: settings.fontSize,
      compactMode: settings.compactMode,
      enableHapticFeedback: settings.enableHapticFeedback,
      orderStatuses: settings.orderStatuses,
      defaultOrderStatus: settings.defaultOrderStatus,
      syncOrderToServiceStatus: settings.syncOrderToServiceStatus,
      messageTemplates: settings.messageTemplates,
      swipeRightAction: settings.swipeRightAction,
      showArchivedOrders: settings.showArchivedOrders
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new AppSettings({ id: snapshot.id, ...data });
  }
};
