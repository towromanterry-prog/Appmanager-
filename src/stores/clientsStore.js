// src/stores/clientsStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';

import { clientsService, setClientByIdMerge } from '@/services/clientsService';
import { generateId } from '@/models/ClientModel';

const normalizePhone = (val) => String(val ?? '').replace(/\D/g, '').replace(/^7/, '');
const isNonEmpty = (v) => String(v ?? '').trim().length > 0;

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]); // ClientModel[]
  const loading = ref(false);

  const auth = useAuthStore();

  let _uid = null;
  let unsubscribe = null;

  const getUid = () => _uid || auth.currentUserId || null;

  const activeItems = computed(() => clients.value.filter((c) => !c.isArchived));

  /**
   * Подписка на клиентов.
   * Лучше вызывать из App.vue: clientsStore.subscribe(uid)
   */
  function subscribe(uidOverride) {
    const uid = uidOverride || auth.currentUserId || null;
    _uid = uid;

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

  /**
   * addOrUpdateClient (умный)
   * Приоритет поиска:
   * 1) по id
   * 2) по oldPhone (для старых заказов без clientId)
   * 3) по phone (защита от дублей)
   */
  async function addOrUpdateClient(clientData = {}) {
    const uid = getUid();
    if (!uid) return null;

    const {
      id = null,
      oldPhone = '',
      phone = '',
      name = '',
      lastName = '',
      services = [],
      notes = '',
      isArchived,
    } = clientData || {};

    const idStr = isNonEmpty(id) ? String(id) : null;
    const oldPhoneNorm = normalizePhone(oldPhone);
    const phoneNorm = normalizePhone(phone);

    if (!idStr && !oldPhoneNorm && !phoneNorm) return null;

    let existingClient = null;

    if (idStr) {
      existingClient = clients.value.find((c) => String(c?.id || '') === idStr) || null;
    }

    if (!existingClient && oldPhoneNorm) {
      existingClient =
        clients.value.find((c) => normalizePhone(c?.phone) === oldPhoneNorm) ||
        clients.value.find((c) => String(c?.id || '') === String(oldPhone)) ||
        null;
    }

    if (!existingClient && phoneNorm) {
      existingClient =
        clients.value.find((c) => normalizePhone(c?.phone) === phoneNorm) ||
        clients.value.find((c) => String(c?.id || '') === String(phone)) ||
        null;
    }

    const clientId = existingClient?.id || generateId('cl');

    const newHistoryEntry = {
      date: new Date().toISOString(),
      services: Array.isArray(services) ? services : [],
    };

    const history = existingClient?.history?.length
      ? [...existingClient.history, newHistoryEntry].slice(-10)
      : [newHistoryEntry];

    const clientRecord = {
      id: clientId,
      name: isNonEmpty(name) ? name : (existingClient?.name || ''),
      lastName: isNonEmpty(lastName) ? lastName : (existingClient?.lastName || ''),

      // актуальный телефон
      phone: isNonEmpty(phone) ? phone : (existingClient?.phone || oldPhone || ''),

      lastOrderDate: new Date().toISOString(),
      favoriteServices: Array.isArray(services) ? services : [],
      notes: isNonEmpty(notes) ? notes : (existingClient?.notes || ''),
      history,

      isArchived: isArchived ?? existingClient?.isArchived ?? false,
    };

    try {
      await setClientByIdMerge(uid, clientId, clientRecord);
    } catch (e) {
      console.error('Ошибка сохранения клиента:', e);
    }

    // оптимистично обновим локально
    try {
      if (existingClient) {
        const idx = clients.value.findIndex((c) => String(c?.id || '') === String(existingClient.id));
        if (idx !== -1) clients.value[idx] = { ...clients.value[idx], ...clientRecord };
      } else {
        clients.value.push(clientRecord);
      }
    } catch (_) {}

    return clientId;
  }

  // delete: принимает id ИЛИ телефон (совместимость)
  async function deleteClient(idOrPhone) {
    const uid = getUid();
    if (!uid || !isNonEmpty(idOrPhone)) return;

    const key = String(idOrPhone);
    const found =
      clients.value.find((c) => String(c?.id || '') === key) ||
      clients.value.find((c) => normalizePhone(c?.phone) === normalizePhone(key)) ||
      null;

    const clientId = found?.id || key;

    try {
      await clientsService.delete(uid, clientId);
    } catch (e) {
      console.error('Ошибка удаления клиента:', e);
    }
  }

  const searchClients = computed(() => (query) => {
    if (!query || query.length < 2) return [];
    const lowerQuery = query.toLowerCase();

    return clients.value
      .filter(
        (client) =>
          (client.name && client.name.toLowerCase().includes(lowerQuery)) ||
          (client.lastName && client.lastName.toLowerCase().includes(lowerQuery)) ||
          (client.phone && String(client.phone).includes(query))
      )
      .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0))
      .slice(0, 10);
  });

  function getClientByPhone(phone) {
    const norm = normalizePhone(phone);
    return clients.value.find((c) => normalizePhone(c?.phone) === norm);
  }

  function getClientByName(name) {
    if (!name) return undefined;
    const n = String(name).toLowerCase();
    return clients.value.find((c) => String(c?.name || '').toLowerCase() === n);
  }

  function getTopClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0))
      .slice(0, limit);
  }

  function getRecentClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => new Date(b.lastOrderDate || 0) - new Date(a.lastOrderDate || 0))
      .slice(0, limit);
  }

  async function archiveClient(idOrPhone) {
    const uid = getUid();
    if (!uid || !isNonEmpty(idOrPhone)) return;

    const key = String(idOrPhone);
    const found =
      clients.value.find((c) => String(c?.id || '') === key) ||
      clients.value.find((c) => normalizePhone(c?.phone) === normalizePhone(key)) ||
      null;

    const clientId = found?.id || key;
    await clientsService.update(uid, clientId, { isArchived: true });
  }

  async function unarchiveClient(idOrPhone) {
    const uid = getUid();
    if (!uid || !isNonEmpty(idOrPhone)) return;

    const key = String(idOrPhone);
    const found =
      clients.value.find((c) => String(c?.id || '') === key) ||
      clients.value.find((c) => normalizePhone(c?.phone) === normalizePhone(key)) ||
      null;

    const clientId = found?.id || key;
    await clientsService.update(uid, clientId, { isArchived: false });
  }

  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    _uid = null;
    clients.value = [];
    loading.value = false;
  }

  return {
    clients,
    loading,
    activeItems,

    subscribe,
    addOrUpdateClient,
    deleteClient,
    searchClients,
    getClientByPhone,
    getClientByName,
    getTopClients,
    getRecentClients,
    archiveClient,
    unarchiveClient,
    stop,
  };
});