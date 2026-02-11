import { defineStore } from 'pinia';
import serviceService from '../services/serviceService';
import ServiceItem from '../models/ServiceItem.js';

export const useServiceStore = defineStore('serviceStore', {
  state: () => ({
    services: [],
    loading: false,
    unsubscribe: null,
    error: null
  }),

  getters: {
    // Только активные услуги (не в архиве)
    activeServices: (state) => state.services.filter(s => !s.isArchived),
    
    // Архивные услуги
    archivedServices: (state) => state.services.filter(s => s.isArchived),
    
    getServiceById: (state) => (id) => state.services.find(s => s.id === id)
  },

  actions: {
    initRealtimeUpdates() {
      if (this.unsubscribe) return; // Уже подписаны
      
      this.loading = true;
      this.unsubscribe = serviceService.subscribe((items) => {
        this.services = items;
        this.loading = false;
      });
    },

    stopRealtimeUpdates() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    },

    async addService(rawServiceData) {
      try {
        const newService = new ServiceItem(rawServiceData);
        await serviceService.create(newService);
      } catch (err) {
        console.error('Ошибка добавления услуги:', err);
        this.error = err.message;
      }
    },

    async updateService(id, rawServiceData) {
      try {
        // Создаем модель, убеждаемся что ID проставлен
        const updatedService = new ServiceItem({ ...rawServiceData, id });
        await serviceService.update(updatedService);
      } catch (err) {
        console.error('Ошибка обновления услуги:', err);
        this.error = err.message;
      }
    },

    // Логика архивации — это просто обновление поля isArchived
    async archiveService(id) {
      const service = this.getServiceById(id);
      if (service) {
        const updated = service.clone();
        updated.isArchived = true;
        updated.archivedAt = new Date();
        await this.updateService(id, updated);
      }
    },

    async unarchiveService(id) {
      const service = this.getServiceById(id);
      if (service) {
        const updated = service.clone();
        updated.isArchived = false;
        updated.archivedAt = null;
        await this.updateService(id, updated);
      }
    }
  }
});
