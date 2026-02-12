import { defineStore } from 'pinia';
import detailService from '../services/detailService';
import DetailItem from '../models/DetailItem';

export const useDetailStore = defineStore('detailStore', {
  state: () => ({
    details: [],
    loading: false,
    error: null,
    unsubscribe: null
  }),

  getters: {
    getDetailById: (state) => (id) => state.details.find(d => d.id === id),
    
    // Если нужно получить уникальные категории для фильтров
    categories: (state) => [...new Set(state.details.map(d => d.category).filter(Boolean))]
  },

  actions: {
    initRealtimeUpdates() {
      if (this.unsubscribe) return;
      
      this.loading = true;
      this.unsubscribe = detailService.subscribe((items) => {
        this.details = items;
        this.loading = false;
      });
    },

    stopRealtimeUpdates() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }
    },

    async addDetail(rawDetailData) {
      this.loading = true;
      try {
        const newDetail = new DetailItem(rawDetailData);
        await detailService.create(newDetail);
      } catch (err) {
        console.error('Error adding detail:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async updateDetail(id, rawDetailData) {
      this.loading = true;
      try {
        const detailModel = new DetailItem({ ...rawDetailData, id });
        await detailService.update(detailModel);
      } catch (err) {
        console.error('Error updating detail:', err);
        this.error = err.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteDetail(id) {
      try {
        await detailService.delete(id);
      } catch (err) {
        console.error('Error deleting detail:', err);
        this.error = err.message;
      }
    }
  }
});
