import { defineStore } from 'pinia';
import clientService from '../services/clientService';
import Client from '../models/Client';

export const useClientsStore = defineStore('clientsStore', {
  state: () => ({
    clients: [],
    loading: false,
    unsubscribe: null
  }),

  actions: {
    initRealtimeUpdates() {
      if (this.unsubscribe) this.unsubscribe();
      this.loading = true;
      this.unsubscribe = clientService.subscribe((clients) => {
        this.clients = clients;
        this.loading = false;
      });
    },

    async addClient(clientData) {
      const client = new Client(clientData);
      await clientService.create(client);
    },

    async updateClient(clientData) {
      const client = new Client(clientData);
      await clientService.update(client);
    },

    async deleteClient(id) {
      await clientService.delete(id);
    }
  }
});
