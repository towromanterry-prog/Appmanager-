import { defineStore } from 'pinia';
import orderService from '../services/orderService';
import Order from '../models/Order';

export const useOrderStore = defineStore('orderStore', {
  state: () => ({
    orders: [],
    loading: false,
    error: null,
    unsubscribe: null // Храним функцию отписки
  }),

  getters: {
    getOrderById: (state) => (id) => state.orders.find(o => o.id === id),
    
    // Пример геттера: активные заказы
    activeOrders: (state) => state.orders.filter(o => o.status !== 'done' && o.status !== 'paid'),
    
    totalRevenue: (state) => state.orders.reduce((sum, order) => sum + (order.price || 0), 0)
  },

  actions: {
    // Инициализация (подписка)
    initRealtimeUpdates() {
      this.loading = true;
      // Если уже была подписка, отменяем её перед новой
      if (this.unsubscribe) this.unsubscribe();

      this.unsubscribe = orderService.subscribe((orders) => {
        this.orders = orders;
        this.loading = false;
      });
    },

    // Остановка прослушивания (например, при unmount, хотя для глобального стора редко нужно)
    stopRealtimeUpdates() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    },

    async addOrder(orderData) {
      this.loading = true;
      try {
        // orderData может быть простым объектом, превращаем в модель
        const newOrder = new Order(orderData);
        await orderService.create(newOrder);
        // При подписке список обновится сам, вручную push можно не делать
      } catch (err) {
        this.error = err.message;
        console.error("Error adding order:", err);
      } finally {
        this.loading = false;
      }
    },

    async updateOrder(orderData) {
      this.loading = true;
      try {
        const orderModel = new Order(orderData);
        await orderService.update(orderModel);
      } catch (err) {
        this.error = err.message;
        console.error("Error updating order:", err);
      } finally {
        this.loading = false;
      }
    },

    async deleteOrder(id) {
      try {
        await orderService.delete(id);
      } catch (err) {
        this.error = err.message;
        console.error("Error deleting order:", err);
      }
    }
  }
});
