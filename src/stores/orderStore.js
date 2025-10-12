// orderStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useSettingsStore } from './settingsStore';
import { useConfirmationStore } from './confirmationStore';

const ORDER_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];
const SERVICE_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed'];
const DETAIL_STATUS_FLOW = ['accepted', 'additional', 'in_progress', 'completed'];

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
            })),
            details: (o.details || []).map(d => ({
              ...d,
              status: d.status || 'accepted'
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
      details: (orderData.details || []).map(d => ({
        ...d,
        status: settingsStore.appSettings.defaultOrderStatus || 'accepted'
      })),
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
        details: (orderData.details || originalOrder.details || []).map(d => ({
          ...d,
          status: d.status || 'accepted'
        })),
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

  function _syncOrderStatusFromItems(order) {
    const settingsStore = useSettingsStore();
    const allItems = [...(order.services || []), ...(order.details || [])];
    if (allItems.length === 0) return;

    const itemFlow = SERVICE_STATUS_FLOW; // Assuming services and details share the same flow
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

  async function _syncItemsStatusFromOrder(order, newStatus, itemType) {
    const settingsStore = useSettingsStore();
    const confirmationStore = useConfirmationStore();
    
    const items = order[itemType] || [];
    const itemFlow = itemType === 'services' ? SERVICE_STATUS_FLOW : DETAIL_STATUS_FLOW;
    const itemStatusesSettings = itemType === 'services'
      ? settingsStore.appSettings.serviceStatuses
      : settingsStore.appSettings.detailStatuses;
    const syncConfigRoot = settingsStore.appSettings.syncOrderToServiceStatus;
    const itemName = itemType === 'services' ? 'услуг(и)' : settingsStore.appSettings.detailsTabLabel.toLowerCase();

    if (newStatus === 'accepted' || !itemFlow.includes(newStatus) || !itemStatusesSettings[newStatus]) {
      return;
    }

    const syncConfig = syncConfigRoot[newStatus];
    if (!syncConfig || !syncConfig.enabled) {
      return;
    }

    const newStatusIndex = itemFlow.indexOf(newStatus);
    const itemsToUpdate = items.filter(item => itemFlow.indexOf(item.status) < newStatusIndex);

    if (itemsToUpdate.length === 0) return;

    let applyUpdates = true;
    if (syncConfig.confirm) {
      applyUpdates = await confirmationStore.open(
        'Синхронизация статусов',
        `Изменить статус ${itemsToUpdate.length} ${itemName} на "${getStatusText(newStatus)}"?`
      );
    }

    if (applyUpdates) {
      itemsToUpdate.forEach(item => {
        item.status = newStatus;
      });
    }
  }

  async function _syncServicesStatusFromOrder(order, newStatus) {
    await _syncItemsStatusFromOrder(order, newStatus, 'services');
  }

  async function _syncDetailsStatusFromOrder(order, newStatus) {
    await _syncItemsStatusFromOrder(order, newStatus, 'details');
  }

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

    if (isService) {
      order.services[itemIndex].status = newStatus;
      _syncOrderStatusFromServices(order);
    } else if (isDetail) {
      order.details[itemIndex].status = newStatus;
      _syncOrderStatusFromDetails(order);
    } else {
      order.status = newStatus;
      await _syncServicesStatusFromOrder(order, newStatus);
      await _syncDetailsStatusFromOrder(order, newStatus);
    }

    _save();
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
      serviceStatuses: order.services.map(s => s.status),
      detailStatuses: order.details.map(d => d.status)
    };
    
    order.status = 'cancelled';
    order.services.forEach(s => s.status = 'cancelled');
    order.details.forEach(d => d.status = 'cancelled');
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
    order.details.forEach((detail, index) => {
      detail.status = cachedState.detailStatuses[index] || 'accepted';
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
