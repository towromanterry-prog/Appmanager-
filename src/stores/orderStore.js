// src/stores/orderStore.js
import { defineStore } from 'pinia';
import { orderService } from '@/services/orderService';
import { OrderModel } from '@/models/OrderModel';
import { useSearchStore } from '@/stores/searchStore';

export const useOrderStore = defineStore('order', {
  state: () => ({
    orders: /** @type {OrderModel[]} */ ([]),

    /**
     * МУЛЬТИ-СТАТУСЫ как в старом сторе:
     * - пусто => показываем всё
     * - иначе => показываем только те, что входят в массив
     */
    filterStatus: /** @type {string[]} */ ([]),

    // Поисковая строка (для совместимости)
    searchQuery: '',

    // Realtime
    _unsub: null,
    _uid: null,

    isLoading: false,
    lastError: null,
  }),

  getters: {
    /**
     * Полная логика фильтрации:
     * - по мульти-статусам (filterStatus)
     * - по поиску (берем из useSearchStore)
     */
    filteredOrders(state) {
      const searchStore = useSearchStore();
      const statuses = Array.isArray(state.filterStatus) ? state.filterStatus : [];
      const q = (searchStore.searchQuery || '').trim().toLowerCase();

      let list = Array.isArray(state.orders) ? state.orders : [];

      // 1) Фильтр по статусам
      if (statuses.length > 0) {
        const set = new Set(statuses.map((s) => String(s).toLowerCase()));
        list = list.filter((o) => set.has(String(o?.status || '').toLowerCase()));
      }

      // 2) Поиск (multi-term)
      if (q) {
        const terms = q.split(/\s+/).filter(Boolean);
        list = list.filter((o) => {
          const hay =
            o instanceof OrderModel ? o.searchText : new OrderModel(o).searchText;
          return terms.every((t) => (hay || '').includes(t));
        });
      }

      // 3) СОРТИРОВКА
      const getTime = (val) => {
        if (!val) return 0;
        if (val instanceof Date) return val.getTime();
        if (typeof val.toDate === 'function') return val.toDate().getTime();
        if (typeof val.seconds === 'number') return val.seconds * 1000;
        return 0;
      };

      const timeForList = (o) =>
        getTime(o?.startAt) ||
        getTime(o?.date) ||
        getTime(o?.createdAt) ||
        0;

      list = [...list].sort((a, b) => {
        const ta = timeForList(a);
        const tb = timeForList(b);
        if (tb !== ta) return tb - ta;

        const ca = getTime(a?.createdAt);
        const cb = getTime(b?.createdAt);
        if (cb !== ca) return cb - ca;

        const ia = String(a?.id || '');
        const ib = String(b?.id || '');
        return ia.localeCompare(ib);
      });

      return list;
    },

    /**
     * Группировка для календаря: { 'YYYY-MM-DD': OrderModel[] }
     */
    calendarOrders() {
      const map = {};

      for (const o of this.filteredOrders) {
        let dateObj = o?.date;
        // Firebase Timestamp handling
        if (dateObj && typeof dateObj.toDate === 'function') dateObj = dateObj.toDate();
        else if (dateObj && typeof dateObj.seconds === 'number') dateObj = new Date(dateObj.seconds * 1000);

        if (!(dateObj instanceof Date)) continue;

        const key = [
          dateObj.getFullYear(),
          String(dateObj.getMonth() + 1).padStart(2, '0'),
          String(dateObj.getDate()).padStart(2, '0'),
        ].join('-');

        if (!map[key]) map[key] = [];
        map[key].push(o);
      }

      for (const key of Object.keys(map)) {
        map[key].sort((a, b) => {
          const getTime = (val) => {
             if (!val) return 0;
             if (val instanceof Date) return val.getTime();
             if (typeof val.toDate === 'function') return val.toDate().getTime();
             return 0;
          };
          const at = getTime(a.startAt || a.date || a.createdAt);
          const bt = getTime(b.startAt || b.date || b.createdAt);
          return at - bt;
        });
      }

      return map;
    },

    /**
     * Статистика: сумма + счетчики
     */
    statistics() {
      const list = this.filteredOrders;

      const totalSum = list.reduce(
        (acc, o) => acc + (o?.computedTotal ?? o?.total ?? 0),
        0
      );

      const byStatus = list.reduce((acc, o) => {
        const s = (o?.status || 'unknown').toLowerCase();
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});

      return {
        count: list.length,
        totalSum,
        byStatus,
      };
    },
  },

  actions: {
    toggleStatusFilter(statusValue) {
      const v = String(statusValue || '').trim();
      if (!v) return;

      const idx = this.filterStatus.indexOf(v);
      if (idx === -1) this.filterStatus.push(v);
      else this.filterStatus.splice(idx, 1);
    },

    clearStatusFilter() {
      this.filterStatus = [];
    },

    setSearchQuery(query) {
      this.searchQuery = query ?? '';
    },

    async initRealtimeUpdates(uid) {
      if (!uid) throw new Error('orderStore.initRealtimeUpdates: uid is required');

      // uid сменился => переподписка
      if (this._unsub && this._uid !== uid) {
        this._unsub();
        this._unsub = null;
      }

      this._uid = uid;
      this.isLoading = true;
      this.lastError = null;

      if (this._unsub) {
        this.isLoading = false;
        return;
      }

      this._unsub = orderService.subscribe(uid, {
        onChange: (orders) => {
          this.orders = orders.map((o) => (o instanceof OrderModel ? o : new OrderModel(o)));
          this.isLoading = false;
        },
        onError: (err) => {
          this.lastError = err;
          this.isLoading = false;
        },
      });
    },

    stopRealtimeUpdates() {
      if (this._unsub) this._unsub();
      this._unsub = null;
      this._uid = null;
    },

    async createOrder(payload) {
      if (!this._uid) throw new Error('orderStore.createOrder: call initRealtimeUpdates(uid) first');
      return await orderService.create(this._uid, payload);
    },

    async upsertOrder(orderId, payload) {
      if (!this._uid) throw new Error('orderStore.upsertOrder: call initRealtimeUpdates(uid) first');
      return await orderService.upsert(this._uid, orderId, payload);
    },

    async updateOrder(orderId, patch) {
      if (!this._uid) throw new Error('orderStore.updateOrder: call initRealtimeUpdates(uid) first');
      return await orderService.update(this._uid, orderId, patch);
    },

    async deleteOrder(orderId) {
      if (!this._uid) throw new Error('orderStore.deleteOrder: call initRealtimeUpdates(uid) first');
      await orderService.remove(this._uid, orderId);
    },

    setOrders(list) {
      this.orders = (list || []).map((o) => (o instanceof OrderModel ? o : new OrderModel(o)));
    },
  },
});
