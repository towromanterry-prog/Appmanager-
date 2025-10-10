// orderStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settingsStore';
import { useConfirmationStore } from './confirmationStore';

const ORDER_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];
const SERVICE_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed'];

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([]);

  function _save() {
    localStorage.setItem('orders', JSON.stringify(orders.value));
  }

  function _load() {
    try {
      const stored = localStorage.getItem('orders');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          orders.value = parsed.map(o => ({
            ...o,
            status: o.status || 'accepted',
            createDate: o.createDate || new Date().toISOString(),
            services: (o.services || []).map(s => ({
              ...s,
              status: s.status || 'accepted'
            }))
          }));
        } else {
          throw new Error('Stored orders is not an array');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки orders из localStorage:', error);
      orders.value = [];
      localStorage.removeItem('orders');
    }
  }

  const getOrderById = computed(() => id =>
    orders.value.find(o => o.id === id)
  );

  function addOrder(orderData) {
    const settingsStore = useSettingsStore();
    const newOrder = {
      ...orderData,
      id: Date.now().toString(),
      status: settingsStore.appSettings.defaultOrderStatus || 'accepted',
      createDate: new Date().toISOString(),
      services: (orderData.services || []).map(s => ({
        ...s,
        status: settingsStore.appSettings.defaultOrderStatus || 'accepted'
      })),
      details: orderData.details || [],
      lastName: orderData.lastName || ''
    };
    orders.value.push(newOrder);
    _save();
    return newOrder;
  }

  function updateOrder(id, orderData) {
    const index = orders.value.findIndex(o => o.id === id);
    if (index !== -1) {
      const originalOrder = orders.value[index];
      orders.value[index] = {
        ...originalOrder,
        ...orderData,
        id: originalOrder.id,
        createDate: originalOrder.createDate,
        status: orderData.status !== undefined ? orderData.status : originalOrder.status,
        services: (orderData.services || originalOrder.services).map(s => ({
          ...s,
          status: s.status || 'accepted'
        })),
        details: orderData.details || originalOrder.details || [],
        lastName: orderData.lastName || ''
      };
      _save();
    }
  }

  function deleteOrder(id) {
    const index = orders.value.findIndex(o => o.id === id);
    if (index !== -1) {
      orders.value.splice(index, 1);
      _save();
    }
  }

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

  // ИЗМЕНЕНО: Исправлена логика синхронизации статуса заказа от статусов услуг.
  function _syncOrderStatusFromServices(order) {
    const settingsStore = useSettingsStore();
    const syncSettings = settingsStore.appSettings.syncServiceToOrderStatus;
    const orderStatusSettings = settingsStore.appSettings.orderStatuses;

    if (!order.services || order.services.length === 0) {
      return;
    }

    const orderStatusIndex = ORDER_STATUS_FLOW.indexOf(order.status);
    const serviceStatusIndices = order.services.map(s => SERVICE_STATUS_FLOW.indexOf(s.status));

    // Правило 1: Все услуги должны иметь статус "старше" (индекс больше), чем у заказа.
    const allServicesAreAhead = serviceStatusIndices.every(i => i > orderStatusIndex);
    if (!allServicesAreAhead) {
      return;
    }

    // Правило 2: Находим минимальный (самый "младший") статус среди услуг.
    const minServiceIndex = Math.min(...serviceStatusIndices);
    if (minServiceIndex === -1 || minServiceIndex >= ORDER_STATUS_FLOW.length) {
      return; // Защита от некорректных индексов
    }
    const newOrderStatus = ORDER_STATUS_FLOW[minServiceIndex];

    // Правило 3: Целевой статус должен быть активен в настройках статусов заказа.
    if (!orderStatusSettings[newOrderStatus]) {
      return;
    }

    // Правило 4: Для целевого статуса должна быть включена синхронизация.
    if (!syncSettings[newOrderStatus]) {
      return;
    }
    
    // Правило 5: Если все проверки пройдены, обновляем статус заказа.
    if (order.status !== newOrderStatus) {
      order.status = newOrderStatus;
    }
  }
  // КОНЕЦ ИЗМЕНЕНИЯ

  async function _syncServicesStatusFromOrder(order, newStatus) {
    const settingsStore = useSettingsStore();
    const confirmationStore = useConfirmationStore();
    // Проверка 1: Статус должен быть в SERVICE_STATUS_FLOW
    if (newStatus === 'accepted' || !SERVICE_STATUS_FLOW.includes(newStatus)) {
      return;
    }
    
    // Проверка 2: Целевой статус активен для услуг
    if (!settingsStore.appSettings.serviceStatuses[newStatus]) {
      return;
    }

    // Проверка 3: Синхронизация включена для этого статуса
    const syncConfig = settingsStore.appSettings.syncOrderToServiceStatus[newStatus];
    if (!syncConfig || !syncConfig.enabled) {
      return;
    }

    const newStatusIndex = SERVICE_STATUS_FLOW.indexOf(newStatus);

    const servicesToUpdate = order.services.filter(s => {
      const currentServiceIndex = SERVICE_STATUS_FLOW.indexOf(s.status);
      return currentServiceIndex < newStatusIndex;
    });

    if (servicesToUpdate.length === 0) {
      return;
    }

    // Проверка 4: Нужно ли подтверждение
    let applyToServices = true;
    if (syncConfig.confirm) {
      applyToServices = await confirmationStore.open(
        'Синхронизация статусов',
        `Изменить статус ${servicesToUpdate.length} услуг(и) на "${getStatusText(newStatus)}"?`
      );
    }

    if (applyToServices) {
      servicesToUpdate.forEach(s => {
        s.status = newStatus;
      });
    }
  }

  async function updateStatus(orderId, newStatus, isService = false, serviceIndex = -1) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return;

    const settingsStore = useSettingsStore();
    const confirmationStore = useConfirmationStore();
    
    const flow = isService ? SERVICE_STATUS_FLOW : ORDER_STATUS_FLOW;
    const oldStatus = isService ? order.services[serviceIndex].status : order.status;
    const oldIndex = flow.indexOf(oldStatus);
    const newIndex = flow.indexOf(newStatus);
    const activeStatuses = isService ? settingsStore.appSettings.serviceStatuses : settingsStore.appSettings.orderStatuses;
    const activeFlow = flow.filter(s => activeStatuses[s]);
    const lastActiveStatusInFlow = activeFlow[activeFlow.length - 1];
    
    // Case 1: Circular loop
    if (oldStatus === lastActiveStatusInFlow && newStatus === flow[0]) {
      const confirmed = await confirmationStore.open(
        'Начать сначала?',
        `Вы уверены, что хотите вернуть статус с "${getStatusText(oldStatus)}" на начальный статус "${getStatusText(newStatus)}"?`
      );
      if (!confirmed) return;
    }
    // Case 2: Any other downgrade
    else if (newIndex < oldIndex && oldStatus !== 'cancelled') {
      const confirmed = await confirmationStore.open(
        'Понижение статуса',
        `Вы уверены, что хотите изменить статус с "${getStatusText(oldStatus)}" на "${getStatusText(newStatus)}"?`
      );
      if (!confirmed) return;
    }

    // Update the primary status (order or service)
    if (isService) {
      order.services[serviceIndex].status = newStatus;
      _syncOrderStatusFromServices(order);
    } else {
      order.status = newStatus;
      await _syncServicesStatusFromOrder(order, newStatus);
    }

    _save();
  }

  function calculateNextStatus(currentStatus, isService = false) {
    const settingsStore = useSettingsStore();
    const flow = isService ? SERVICE_STATUS_FLOW : ORDER_STATUS_FLOW;
    const activeStatuses = isService ? settingsStore.appSettings.serviceStatuses : settingsStore.appSettings.orderStatuses;

    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex === -1) {
      return currentStatus;
    }

    // Find the next active status in the sequence.
    for (let i = currentIndex + 1; i < flow.length; i++) {
      const nextStatus = flow[i];
      if (activeStatuses[nextStatus]) {
        return nextStatus;
      }
    }

    // If no subsequent active status is found, loop back to the first status.
    if (activeStatuses[flow[0]]) {
      return flow[0];
    }

    return currentStatus;
  }

  function calculatePreviousStatus(currentStatus, isService = false) {
    const settingsStore = useSettingsStore();
    const flow = isService ? SERVICE_STATUS_FLOW : ORDER_STATUS_FLOW;
    const activeStatuses = isService ? settingsStore.appSettings.serviceStatuses : settingsStore.appSettings.orderStatuses;

    const currentIndex = flow.indexOf(currentStatus);
    if (currentIndex <= 0) {
      return currentStatus;
    }

    // Find the previous active status in the sequence.
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevStatus = flow[i];
      if (activeStatuses[prevStatus]) {
        return prevStatus;
      }
    }

    return currentStatus;
  }

  async function cancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return;
    const confirmationStore = useConfirmationStore();

    const confirmed = await confirmationStore.open('Отмена заказа', 'Вы уверены, что хотите отменить этот заказ?');
    if (!confirmed) return;
    
    order.cachedState = {
      orderStatus: order.status,
      serviceStatuses: order.services.map(s => s.status)
    };
    
    order.status = 'cancelled';
    order.services.forEach(s => s.status = 'cancelled');
    _save();
  }

  async function undoCancelOrder(orderId) {
    const order = orders.value.find(o => o.id === orderId);
    if (!order || order.status !== 'cancelled') return;

    const cachedState = order.cachedState;
    if (!cachedState) return;

    const confirmationStore = useConfirmationStore();
    const confirmed = await confirmationStore.open('Восстановление заказа', 'Вы уверены, что хотите восстановить этот заказ?');
    if (!confirmed) return;

    order.status = cachedState.orderStatus;
    order.services.forEach((service, index) => {
      service.status = cachedState.serviceStatuses[index] || 'accepted';
    });

    delete order.cachedState;
    _save();
  }

  function updateServicePricesInActiveOrders(serviceId, newPrice) {
    orders.value.forEach(order => {
      if (['accepted', 'additional', 'in_progress'].includes(order.status)) {
        order.services.forEach(service => {
          if (service.id === serviceId) {
            service.price = newPrice;
          }
        });
      }
    });
    _save();
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

  return {
    orders,
    load: _load,
    _load,
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
