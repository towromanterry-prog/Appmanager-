// src/stores/servicesStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { servicesService } from '@/services/servicesService';

export const useServicesStore = defineStore('services', () => {
  const services = ref([]); // ServiceModel[]
  const loading = ref(false);

  const auth = useAuthStore();

  let _uid = null;
  let unsubscribe = null;

  const getUid = () => _uid || auth.currentUserId || null;

  const activeItems = computed(() => services.value.filter((s) => !s.isArchived));

  function subscribe(uidOverride) {
    const uid = uidOverride || auth.currentUserId || null;
    _uid = uid;

    if (unsubscribe) unsubscribe();
    if (!uid) {
      services.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    unsubscribe = servicesService.subscribe(
      uid,
      (rows) => {
        services.value = rows;
        loading.value = false;
      },
      (err) => {
        console.error('Services subscribe error:', err);
        loading.value = false;
      }
    );
  }

  async function addService(serviceData) {
    const uid = getUid();
    if (!uid) return;

    await servicesService.add(uid, {
      name: serviceData.name,
      defaultPrice: Number(serviceData.defaultPrice),
      isArchived: !!serviceData.isArchived,
    });
  }

  async function updateService(id, serviceData) {
    const uid = getUid();
    if (!uid || !id) return;

    await servicesService.update(uid, id, {
      name: serviceData.name,
      defaultPrice: Number(serviceData.defaultPrice),
    });
  }

  async function deleteService(id) {
    const uid = getUid();
    if (!uid || !id) return;

    await servicesService.delete(uid, id);
  }

  function getServiceById(id) {
    return services.value.find((s) => s.id === id);
  }

  async function archiveService(id) {
    const uid = getUid();
    if (!uid || !id) return;
    await servicesService.update(uid, id, { isArchived: true });
  }

  async function unarchiveService(id) {
    const uid = getUid();
    if (!uid || !id) return;
    await servicesService.update(uid, id, { isArchived: false });
  }

  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    _uid = null;
    services.value = [];
    loading.value = false;
  }

  return {
    services,
    loading,
    activeItems,

    subscribe,
    addService,
    updateService,
    deleteService,
    getServiceById,
    archiveService,
    unarchiveService,

    stop,
  };
});