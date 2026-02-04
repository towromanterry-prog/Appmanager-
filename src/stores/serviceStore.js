// src/stores/serviceStore.js
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

const normalizePrice = (value) => {
  if (value === '' || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const mapService = (docSnap) => {
  const data = docSnap.data() || {};
  return {
    id: docSnap.id,
    name: data.name || '',
    price: normalizePrice(data.price ?? data.defaultPrice) ?? 0,
    notes: data.notes || '',
    isArchived: Boolean(data.isArchived),
    archivedAt: data.archivedAt || null,
    tagIds: Array.isArray(data.tagIds) ? data.tagIds : (data.tags || []),
    icon: data.icon || ''
  };
};

export const useServiceStore = defineStore('services', () => {
  const services = ref([]);
  const loading = ref(false);
  const ready = ref(false);
  const error = ref(null);
  const user = ref(null);
  let authUnsubscribe = null;
  let servicesUnsubscribe = null;

  const activeServices = computed(() => services.value.filter(service => !service.isArchived));
  const archivedServices = computed(() => services.value.filter(service => service.isArchived));

  const stopServicesListener = () => {
    if (servicesUnsubscribe) {
      servicesUnsubscribe();
      servicesUnsubscribe = null;
    }
  };

  const subscribeForUser = (userId) => {
    stopServicesListener();
    loading.value = true;
    error.value = null;

    const q = query(collection(db, 'users', userId, 'services'), orderBy('name'));
    servicesUnsubscribe = onSnapshot(q, (snapshot) => {
      services.value = snapshot.docs.map(mapService);
      loading.value = false;
      ready.value = true;
    }, (snapshotError) => {
      console.error('Ошибка синхронизации услуг:', snapshotError);
      error.value = snapshotError;
      loading.value = false;
      ready.value = true;
    });
  };

  const subscribeServices = () => {
    if (authUnsubscribe) return;
    loading.value = true;
    ready.value = false;
    error.value = null;

    authUnsubscribe = onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (!currentUser) {
        services.value = [];
        stopServicesListener();
        loading.value = false;
        ready.value = true;
        return;
      }
      subscribeForUser(currentUser.uid);
    });
  };

  const unsubscribeServices = () => {
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    stopServicesListener();
    services.value = [];
    loading.value = false;
    ready.value = false;
    error.value = null;
    user.value = null;
  };

  async function addService(serviceData) {
    if (!user.value) return;

    try {
      await addDoc(collection(db, 'users', user.value.uid, 'services'), {
        name: serviceData.name,
        price: normalizePrice(serviceData.price),
        notes: serviceData.notes || '',
        isArchived: false,
        archivedAt: null
      });
    } catch (e) {
      console.error('Ошибка добавления услуги:', e);
    }
  }

  async function updateService(id, serviceData) {
    if (!user.value) return;

    try {
      const serviceRef = doc(db, 'users', user.value.uid, 'services', id);
      await updateDoc(serviceRef, {
        name: serviceData.name,
        price: normalizePrice(serviceData.price),
        notes: serviceData.notes || ''
      });
    } catch (e) {
      console.error('Ошибка обновления услуги:', e);
    }
  }

  async function archiveService(id) {
    if (!user.value) return;

    try {
      const serviceRef = doc(db, 'users', user.value.uid, 'services', id);
      await updateDoc(serviceRef, {
        isArchived: true,
        archivedAt: serverTimestamp()
      });
    } catch (e) {
      console.error('Ошибка архивирования услуги:', e);
    }
  }

  async function unarchiveService(id) {
    if (!user.value) return;

    try {
      const serviceRef = doc(db, 'users', user.value.uid, 'services', id);
      await updateDoc(serviceRef, {
        isArchived: false,
        archivedAt: null
      });
    } catch (e) {
      console.error('Ошибка восстановления услуги:', e);
    }
  }

  function getServiceById(id) {
    return services.value.find(service => service.id === id);
  }

  function getServicesByTag(tagId) {
    if (!tagId) return services.value;
    return services.value.filter(service => service.tagIds && service.tagIds.includes(tagId));
  }

  const loadServices = () => subscribeServices();
  const deleteService = (id) => archiveService(id);

  return {
    services,
    activeServices,
    archivedServices,
    loading,
    ready,
    error,
    user,
    loadServices,
    subscribeServices,
    unsubscribeServices,
    addService,
    updateService,
    archiveService,
    unarchiveService,
    deleteService,
    getServiceById,
    getServicesByTag
  };
});
