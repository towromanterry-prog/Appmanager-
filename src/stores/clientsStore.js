import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { clientService } from '@/services/clientService';
import { Client } from '@/models/Client';
import { auth } from '@/firebase';

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]);
  const loading = ref(false);
  const user = ref(auth.currentUser);
  let unsubscribe = null;

  // Алиас для совместимости со старым UI
  const subscribeClients = () => {
    // Простейшая защита: если нет юзера, не грузим
    // (Хотя лучше реактивно, как в OrderStore, но для старта хватит)
    if (!auth.currentUser) return; 

    if (unsubscribe) return;
    loading.value = true;
    unsubscribe = clientService.subscribeToClients((data) => {
      clients.value = data;
      loading.value = false;
    });
  };

  const activeClients = computed(() => clients.value.filter(c => !c.isArchived));

  const addClient = async (data) => {
    const client = new Client(data);
    await clientService.addClient(client);
  };

  const updateClient = async (id, data) => {
    const client = new Client({ id, ...data });
    await clientService.updateClient(client);
  };

  const archiveClient = async (id) => {
    const client = clients.value.find(c => c.id === id);
    if (client) {
      await updateClient(id, { ...client, isArchived: true });
    }
  };

  const unarchiveClient = async (id) => {
    const client = clients.value.find(c => c.id === id);
    if (client) {
      await updateClient(id, { ...client, isArchived: false });
    }
  };

  const getClientById = (id) => clients.value.find(c => c.id === id);

  return {
    clients,
    activeClients,
    loading,
    user,
    subscribeClients, // UI вызывает именно это имя
    addClient,
    updateClient,
    archiveClient,
    unarchiveClient,
    getClientById
  };
});
