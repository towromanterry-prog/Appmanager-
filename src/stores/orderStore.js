// src/stores/orderStore.js
import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { useSettingsStore } from './settingsStore';
import { useConfirmationStore } from './confirmationStore';

// === FIREBASE IMPORTS ===
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';
// ========================

const ORDER_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];
const SERVICE_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed'];
const DETAIL_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed'];

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([]);
  const filterStatus = ref([]);
  const sortBy = ref('deadline');
  
  const loading = ref(false);
  const user = ref(null);
  let unsubscribe = null;

  // === 1. ИНИЦИАЛИЗАЦИЯ (Вместо _load) ===
  function init() {
    // Восстанавливаем настройку сортировки локально
    const storedSortBy = localStorage.getItem('orders_sortBy');
    if (storedSortBy) sortBy.value = storedSortBy;

    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        subscribeToUserOrders(currentUser.uid);
      } else {
        orders.value = [];
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserOrders(userId) {
    if (unsubscribe) unsubscribe();
    loading.value = true;

    // Сортируем по дате создания, чтобы список не скакал
    const q = query(collection(db, 'users', userId, 'orders'), orderBy('createDate', 'desc'));

    unsubscribe = onSnapshot(q, (snapshot) => {
      orders.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loading.value = false;
    }, (error) => {
      console.error("Ошибка получения заказов:", error);
      loading.value = false;
    });
  }

  watch(sortBy, (newSortBy) => {
    localStorage.setItem('orders_sortBy', newSortBy);
  });

  // === 2. ГЛАВНАЯ ФУНКЦИЯ СОХРАНЕНИЯ ===
  // Заменяет старый _save(). Сохраняет конкретный заказ в облако.
  async function saveOrderToFirebase(order) {
    if (!user.value || !order || !order.id) return;
    
    // Создаем глубокую копию, чтобы убрать реактивность Vue перед отправкой
    const orderData = JSON.parse(JSON.stringify(order));
    
    try {
      await setDoc(doc(db, 'users', user.value.uid, 'orders', order.id), orderData);
    } catch (e) {
      console.error("Ошибка сохранения заказа:", e);
    }
  }

  const getOrderById = computed(() => id =>
    orders.value.find(o => o.id === id)
  );

  // === 3. ДЕЙСТВИЯ (ACTIONS) ===

  async function addOrder(orderData) {
    if (!user.value) return;

    const settingsStore = useSettingsStore();
    const id = Date.now().toString(); // Генерируем ID здесь
    
    const newOrder = {
      ...orderData,
      id: id,
      status: settingsStore.appSettings.defaultOrderStatus || 'accepted',
      createDate: new Date().toISOString(),
      services: (orderData.services || []).map(s => ({
        ...s,
        status: settingsStore.appSettings.defaultOrderStatus || 'accepted'
      })),
      details: (orderData.details || []).map(d => ({
        ...d,
        status: settingsStore.appSettings.defaultOrderStatus || 'accepted'
      })),
      lastName: orderData.lastName || ''
    };

    // Просто сохраняем в базу. onSnapshot сам добавит его в orders.value
    await saveOrderToFirebase(newOrder);
    return newOrder;
  }

  async function updateOrder(id, orderData) {
    // Находим локальную копию, чтобы не ломать логику ссылок
    const index = orders.value.findIndex(o => o.id === id);
    if (index !== -1) {
      const originalOrder = orders.value[index];
      
      // Обновляем объект
      const updatedOrder = {
        ...originalOrder,
        ...orderData,
        id: originalOrder.id,
        createDate: originalOrder.createDate,
        status: orderData.status !== undefined ? orderData.status : originalOrder.status,
        services: (orderData.services || originalOrder.services).map(s => ({
          ...s,
          status: s.status || 'accepted'
        })),
        details: (orderData.details || originalOrder.details || []).map(d => ({
          ...d,
          status: d.status || 'accepted'
        })),
        lastName: orderData.lastName || ''
      };

      // Отправляем в базу
      await saveOrderToFirebase(updatedOrder);
    }
  }

  async function deleteOrder(id) {
    if (!user.value) return;
    try {
      await deleteDoc(doc(db, 'users', user.value.uid, 'orders', id));
    } catch (e) {
      console.error("Ошибка удаления заказа:", e);
    }
  }

  // === 4. ЛОГИКА СТАТУСОВ (Осталась без изменений, только сохранение) ===

  function getStatusText(status) {
    const settingsStore = useSettingsStore();
    const statusMap = {
      accepted: 'Принят',
      additional: settingsStore.appSettings.additionalStatusName || 'Доп. статус',
      in_progress: 'В работе',
      completed: 'Выполнено',
      delivered: 'Сдан',
      cancelled: 'Отменен'
    };
    return statusMap[status] || status;
  }

  // Вспомогательные функции синхронизации (Без изменений)
  function _syncOrderStatusFromItems(order) {
    const settingsStore = useSettingsStore();
    const allItems = [...(order.services || []), ...(order.details || [])];
    if (allItems.length === 0) return;

    const itemFlow = SERVICE_STATUS_FLOW; 
    const syncSettings = settingsStore.appSettings.syncServiceToOrderStatus;

    const orderStatusSettings = settingsStore.appSettings.orderStatuses;
    const orderStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
    const itemStatusIndices = allItems.map(item => itemFlow.indexOf(item.status));

    const allItemsAreAhead = itemStatusIndices.every(i => i > orderStatusIndex);
    if (!allItemsAreAhead) return;

    const minItemIndex = Math.min(...itemStatusIndices);
    if (minItemIndex === -1 || minItemIndex >= ORDER_STATUS_FLOW.length) return;

    const newOrderStatus = ORDER_STATUS_FLOW[minItemIndex];

    if (!orderStatusSettings[newOrderStatus] || !syncSettings[newOrderStatus]) {
      return;
    }

    if (order.status !== newOrderStatus) {
      order.status = newOrderStatus;
    }
  }

  function _syncOrderStatusFromServices(order) {
    _syncOrderStatusFromItems(order);
  }

  function _syncOrderStatusFromDetails(order) {
    _syncOrderStatusFromItems(order);
  }

  async function _syncItemsStatusFromOrderUnified(order, newStatus) {
    const settingsStore = useSettingsStore();
    const confirmationStore = useConfirmationStore();
    const syncConfigRoot = settingsStore.appSettings.syncOrderToServiceStatus;

    if (newStatus === 'accepted' || !syncConfigRoot[newStatus] || !syncConfigRoot[newStatus].enabled) {
      return;
    }

    const servicesToUpdate = (order.services || []).filter(item => {
      const isStatusConfigured = settingsStore.appSettings.serviceStatuses[newStatus];
      const canUpdate = SERVICE_STATUS_FLOW.indexOf(item.status) < SERVICE_STATUS_FLOW.indexOf(newStatus);
      return isStatusConfigured && canUpdate;
    });

    const detailsToUpdate = (order.details || []).filter(item => {
      const isStatusConfigured = settingsStore.appSettings.detailStatuses[newStatus];
      const canUpdate = DETAIL_STATUS_FLOW.indexOf(item.status) < DETAIL_STATUS_FLOW.indexOf(newStatus);
      return isStatusConfigured && canUpdate;
    });

    if (servicesToUpdate.length === 0 && detailsToUpdate.length === 0) {
      return;
    }

    let applyUpdates = true;
    if (syncConfigRoot[newStatus].confirm) {
      const serviceName = 'услуг(и)';
      const detailName = settingsStore.appSettings.detailsTabLabel.toLowerCase();

      const parts = [];
      if (servicesToUpdate.length > 0) parts.push(`${servicesToUpdate.length} ${serviceName}`);
      if (detailsToUpdate.length > 0) parts.push(`${detailsToUpdate.length} ${detailName}`);

      const message = `Изменить статус ${parts.join(' и ')} на "${getStatusText(newStatus)}"?`;

      applyUpdates = await confirmationStore.open('Синхронизация статусов', message);
    }

    if (applyUpdates) {
      servicesToUpdate.forEach(item => { item.status = newStatus; });
      detailsToUpdate.forEach(item => { item.status = newStatus; });
    }
  }

  // Главная функция обновления статуса
  async function updateStatus(orderId, newStatus, itemType = 'order', itemIndex = -1) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return;

    const settingsStore = useSettingsStore();
    const confirmationStore = useConfirmationStore();

    const isService = itemType === 'service';
    const isDetail = itemType === 'detail';
    
    let flow, oldStatus, activeStatuses;

    if (isService) {
      flow = SERVICE_STATUS_FLOW;
      oldStatus = order.services[itemIndex].status;
      activeStatuses = settingsStore.appSettings.serviceStatuses;
    } else if (isDetail) {
      flow = DETAIL_STATUS_FLOW;
      oldStatus = order.details[itemIndex].status;
      activeStatuses = settingsStore.appSettings.detailStatuses;
    } else { // order
      flow = ORDER_STATUS_FLOW;
      oldStatus = order.status;
      activeStatuses = settingsStore.appSettings.orderStatuses;
    }

    const oldIndex = flow.indexOf(oldStatus);
    const newIndex = flow.indexOf(newStatus);
    const activeFlow = flow.filter(s => activeStatuses[s]);
    const lastActiveStatusInFlow = activeFlow[activeFlow.length - 1];
    
    if (oldStatus === lastActiveStatusInFlow && newStatus === flow[0]) {
      const confirmed = await confirmationStore.open('Начать сначала?', `Вы уверены, что хотите вернуть статус с "${getStatusText(oldStatus)}" на начальный статус "${getStatusText(newStatus)}"?`);
      if (!confirmed) return;
    } else if (newIndex < oldIndex && oldStatus !== 'cancelled') {
      const confirmed = await confirmationStore.open('Понижение статуса', `Вы уверены, что хотите изменить статус с "${getStatusText(oldStatus)}" на "${getStatusText(newStatus)}"?`);
      if (!confirmed) return;
    }

    // Применяем изменения к локальному объекту
    if (isService) {
      order.services[itemIndex].status = newStatus;
      _syncOrderStatusFromServices(order);
    } else if (isDetail) {
      order.details[itemIndex].status = newStatus;
      _syncOrderStatusFromDetails(order);
    } else {
      order.status = newStatus;
      await _syncItemsStatusFromOrderUnified(order, newStatus);
    }

    // СОХРАНЯЕМ В FIREBASE
    await saveOrderToFirebase(order);
  }

  function calculateNextStatus(currentStatus, itemType = 'order') {
    const settingsStore = useSettingsStore();
    let flow, activeStatuses;

    if (itemType === 'service') {
      flow = SERVICE_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.serviceStatuses;
    } else if (itemType === 'detail') {
      flow = DETAIL_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.detailStatuses;
    } else {
      flow = ORDER_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.orderStatuses;
    }

    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1) return currentStatus;

    for (let i = currentIndex + 1; i < flow.length; i++) {
      const nextStatus = flow[i];
      if (activeStatuses[nextStatus]) return nextStatus;
    }

    if (activeStatuses[flow[0]]) return flow[0];
    return currentStatus;
  }

  function calculatePreviousStatus(currentStatus, itemType = 'order') {
    const settingsStore = useSettingsStore();
    let flow, activeStatuses;

    if (itemType === 'service') {
      flow = SERVICE_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.serviceStatuses;
    } else if (itemType === 'detail') {
      flow = DETAIL_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.detailStatuses;
    } else {
      flow = ORDER_STATUS_FLOW;
      activeStatuses = settingsStore.appSettings.orderStatuses;
    }

    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex <= 0) return currentStatus;

    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevStatus = flow[i];
      if (activeStatuses[prevStatus]) return prevStatus;
    }

    return currentStatus;
  }

  async function cancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return;
    const confirmationStore = useConfirmationStore();

    const confirmed = await confirmationStore.open('Отмена заказа', 'Вы уверены, что хотите отменить этот заказ?');
    if (!confirmed) return;
    
    const services = order.services || [];
    const details = order.details || [];
    const servicesCache = services.map((service) => ({ id: service.id, status: service.status }));
    const detailsCache = details.map((detail) => ({ id: detail.id, status: detail.status }));
    const hasServiceWithoutId = services.some((service) => !service.id);
    const hasDetailWithoutId = details.some((detail) => !detail.id);

    order.cachedState = {
      v: 2,
      orderStatus: order.status,
      services: servicesCache,
      details: detailsCache,
      ...(hasServiceWithoutId ? { serviceStatuses: services.map((service) => service.status) } : {}),
      ...(hasDetailWithoutId ? { detailStatuses: details.map((detail) => detail.status) } : {})
    };
    
    order.status = 'cancelled';
    order.services.forEach(s => s.status = 'cancelled');
    order.details.forEach(d => d.status = 'cancelled');
    
    await saveOrderToFirebase(order);
  }

  async function undoCancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order || order.status !== 'cancelled') return;

    const cachedState = order.cachedState;
    if (!cachedState) return;

    const confirmationStore = useConfirmationStore();
    const confirmed = await confirmationStore.open('Восстановление заказа', 'Вы уверены, что хотите восстановить этот заказ?');
    if (!confirmed) return;

    const restoreStatuses = (items, cachedItems, legacyStatuses) => {
      const cachedList = Array.isArray(cachedItems) ? cachedItems : [];
      const statusMap = new Map(cachedList.map((item) => [item.id, item.status]));
      items.forEach((item, index) => {
        const statusById = item?.id ? statusMap.get(item.id) : undefined;
        const statusByIndex = cachedList[index]?.status;
        const status = statusById ?? statusByIndex ?? legacyStatuses?.[index];
        item.status = status || 'accepted';
      });
    };

    order.status = cachedState.orderStatus || 'accepted';
    restoreStatuses(order.services || [], cachedState.services, cachedState.serviceStatuses);
    restoreStatuses(order.details || [], cachedState.details, cachedState.detailStatuses);

    // Удаляем кэш из объекта перед сохранением, или оставляем null
    delete order.cachedState;
    
    await saveOrderToFirebase(order);
  }

  async function updateServicePricesInActiveOrders(serviceId, newPrice) {
    // В Firestore нет массового обновления "одним запросом" для разных документов.
    // Нужно пройтись по всем активным заказам.
    
    const activeOrders = orders.value.filter(o => 
      ['accepted', 'additional', 'in_progress'].includes(o.status)
    );

    for (const order of activeOrders) {
      let changed = false;
      order.services.forEach(service => {
        if (service.id === serviceId) {
          service.price = newPrice;
          changed = true;
        }
      });
      
      if (changed) {
        await saveOrderToFirebase(order);
      }
    }
  }

  const ordersByDate = computed(() => (date) => {
    return orders.value.filter(order => {
      const orderDate = new Date(order.deadline || order.createDate);
      const targetDate = new Date(date);
      return orderDate.toDateString() === targetDate.toDateString();
    });
  });

  const ordersByStatus = computed(() => (status) => {
    return orders.value.filter(order => order.status === status);
  });

  function getOrderStats() {
    const stats = {
      total: orders.value.length,
      accepted: 0,
      additional: 0,
      in_progress: 0,
      completed: 0,
      delivered: 0,
      cancelled: 0,
    };
    orders.value.forEach(o => {
      if (stats[o.status] !== undefined) {
        stats[o.status]++;
      }
    });
    return stats;
  }

  // Запуск инициализации
  init();

  return {
    orders,
    filterStatus,
    sortBy,
    loading,
    user,
    // load больше не нужен, но для совместимости оставим пустышку или ссылку на init
    load: init, 
    addOrder,
    updateOrder,
    deleteOrder,
    updateStatus,
    calculateNextStatus,
    calculatePreviousStatus,
    cancelOrder,
    undoCancelOrder,
    updateServicePricesInActiveOrders,
    getOrderById,
    ordersByDate,
    ordersByStatus,
    getOrderStats,
    getStatusText
  };
});
