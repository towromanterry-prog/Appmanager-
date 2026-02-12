import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { orderService } from '@/services/orderService';
import { Order } from '@/models/Order';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase'; // Нужно для отслеживания юзера

export const useOrderStore = defineStore('orders', () => {
  const orders = ref([]);
  const loading = ref(false);
  const filterStatus = ref([]); 
  const user = ref(null); // Текущий юзер
  let unsubscribe = null;

  // Слушаем статус авторизации глобально для этого стора
  // Это решает проблему Permission Denied
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
    if (currentUser) {
      initRealtimeUpdates();
    } else {
      if (unsubscribe) unsubscribe();
      orders.value = [];
    }
  });

  const initRealtimeUpdates = () => {
    if (unsubscribe) return; // Уже слушаем
    if (!user.value) return; // Нет прав

    loading.value = true;
    unsubscribe = orderService.subscribeToOrders((data) => {
      // Данные уже приходят как инстансы Order благодаря конвертеру в сервисе
      orders.value = data;
      loading.value = false;
    }, (error) => {
      console.error("Order subscription error:", error);
      loading.value = false;
    });
  };

  const addOrder = async (plainData) => {
    const newOrder = new Order(plainData);
    await orderService.addOrder(newOrder);
  };

  const updateOrder = async (plainData) => {
    const updatedOrder = new Order(plainData);
    await orderService.updateOrder(updatedOrder);
  };

  const deleteOrder = async (id) => {
    await orderService.deleteOrder(id);
  };

  // Метод для обратной совместимости или сложной логики статусов
  const updateStatus = async (orderId, newStatus, itemType = 'order', itemIndex = -1) => {
    const order = orders.value.find(o => o.id === orderId);
    if (!order) return;

    const orderClone = order.clone();

    if (itemType === 'order') {
      orderClone.status = newStatus;
    } else if (itemType === 'service' && itemIndex > -1) {
      if (orderClone.services[itemIndex]) orderClone.services[itemIndex].status = newStatus;
    } else if (itemType === 'detail' && itemIndex > -1) {
      if (orderClone.details[itemIndex]) orderClone.details[itemIndex].status = newStatus;
    }

    await orderService.updateOrder(orderClone);
  };

  const getOrderById = (id) => orders.value.find(o => o.id === id);

  // Хелперы (можно вынести в утилиты, но оставим здесь для совместимости с UI)
  const getStatusText = (status) => {
    const map = {
      'accepted': 'Принят',
      'additional': 'Ожидание', 
      'in_progress': 'В работе',
      'completed': 'Готов',
      'delivered': 'Сдан',
      'cancelled': 'Отменен'
    };
    return map[status] || status;
  };

  const calculateNextStatus = (currentStatus) => {
    const flow = ['accepted', 'in_progress', 'completed', 'delivered'];
    const idx = flow.indexOf(currentStatus);
    if (idx > -1 && idx < flow.length - 1) return flow[idx + 1];
    return currentStatus;
  };

  return {
    orders,
    loading,
    user,
    filterStatus,
    initRealtimeUpdates,
    addOrder,
    updateOrder,
    deleteOrder,
    updateStatus,
    getOrderById,
    getStatusText,
    calculateNextStatus
  };
});
