// src/stores/clientsStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { clientsService, setClientByPhoneMerge } from '@/services/clientsService';

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]);     // ClientModel[]
  const loading = ref(false);
  let unsubscribe = null;

  const auth = useAuthStore();

  // Добавлено (не ломает старое): активные неархивные
  const activeItems = computed(() => clients.value.filter((c) => !c.isArchived));

  // === 1. Подписка (как раньше onSnapshot, но через authStore/init) ===
  async function subscribe() {
    await auth.init();
    const uid = auth.currentUserId;

    if (unsubscribe) unsubscribe();
    if (!uid) {
      clients.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    unsubscribe = clientsService.subscribe(
      uid,
      (rows) => {
        clients.value = rows;
        loading.value = false;
      },
      (err) => {
        console.error('Ошибка синхронизации клиентов:', err);
        loading.value = false;
      }
    );
  }

  // === 2. Добавление или Обновление (Умная логика) — 1-в-1 со старым addOrUpdateClient === 8
  async function addOrUpdateClient(clientData) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid) return;

    const { name, lastName = '', phone, services = [], notes = '' } = clientData || {};
    if (!phone) return;

    const existingClient = clients.value.find((c) => c.phone === phone);

    const totalOrders = existingClient ? (existingClient.totalOrders || 0) + 1 : 1;

    const newHistoryEntry = {
      date: new Date().toISOString(),
      services: services,
    };

    let history = [];
    if (existingClient && Array.isArray(existingClient.history)) {
      history = [...existingClient.history, newHistoryEntry].slice(-10);
    } else {
      history = [newHistoryEntry];
    }

    const clientRecord = {
      name,
      lastName,
      phone,
      lastOrderDate: new Date().toISOString(),
      totalOrders,
      favoriteServices: services,
      notes: notes || (existingClient ? existingClient.notes : ''),
      history,
      // архив не трогаем, если не передали явно
      isArchived: clientData?.isArchived ?? existingClient?.isArchived ?? false,
    };

    try {
      await setClientByPhoneMerge(uid, phone, clientRecord);
    } catch (e) {
      console.error('Ошибка сохранения клиента:', e);
    }
  }

  // === 3. Удаление — 1-в-1 со старым deleteClient(phone) === 9
  async function deleteClient(phone) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !phone) return;

    try {
      await clientsService.delete(uid, phone);
    } catch (e) {
      console.error('Ошибка удаления клиента:', e);
    }
  }

  // === 4. Поиск (как было): sort by lastOrderDate desc + slice(0,10) === 10
  const searchClients = computed(() => (query) => {
    if (!query || query.length < 2) return [];

    const lowerQuery = query.toLowerCase();
    return clients.value
      .filter(
        (client) =>
          (client.name && client.name.toLowerCase().includes(lowerQuery)) ||
          (client.phone && String(client.phone).includes(query))
      )
      .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0))
      .slice(0, 10);
  });

  function getClientByPhone(phone) {
    return clients.value.find((c) => c.phone === phone);
  }

  function getClientByName(name) {
    if (!name) return undefined;
    return clients.value.find((c) => c.name && c.name.toLowerCase() === name.toLowerCase());
  }

  // Исправление бага старого стора: было return [.clients.value] 11
  function getTopClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
      .slice(0, limit);
  }

  function getRecentClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0))
      .slice(0, limit);
  }

  // === Архивация (добавили по твоему требованию) ===
  async function archiveClient(phone) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !phone) return;
    await clientsService.update(uid, phone, { isArchived: true });
  }

  async function unarchiveClient(phone) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !phone) return;
    await clientsService.update(uid, phone, { isArchived: false });
  }
  
  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    clients.value = [];
    loading.value = false;
  }

  return {
    clients,
    loading,

    // новый API (не мешает старому)
    activeItems,

    // старый API (1-в-1)
    subscribe,
    addOrUpdateClient,
    deleteClient,
    searchClients,
    getClientByPhone,
    getClientByName,
    getTopClients,
    getRecentClients,

    // новое (архив)
    archiveClient,
    unarchiveClient,
    
    stop,
  };
});