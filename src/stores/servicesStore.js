// src/stores/servicesStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { servicesService } from '@/services/servicesService';

export const useServicesStore = defineStore('services', () => {
  const services = ref([]); // ServiceModel[]
  const loading = ref(false);
  let unsubscribe = null;

  const auth = useAuthStore();

  const activeItems = computed(() => services.value.filter((s) => !s.isArchived));

  async function subscribe() {
    await auth.init();
    const uid = auth.currentUserId;

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
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid) return;

    await servicesService.add(uid, {
      name: serviceData.name,
      defaultPrice: Number(serviceData.defaultPrice),
      tagIds: serviceData.tagIds || [],
      isArchived: !!serviceData.isArchived,
    });
  }

  async function updateService(id, serviceData) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await servicesService.update(uid, id, {
      name: serviceData.name,
      defaultPrice: Number(serviceData.defaultPrice),
      tagIds: serviceData.tagIds || [],
      // isArchived можно обновлять отдельно
    });
  }

  async function deleteService(id) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await servicesService.delete(uid, id);
  }

  // 1-в-1 геттеры из старого serviceStore 12
  function getServiceById(id) {
    return services.value.find((s) => s.id === id);
  }

  function getServicesByTag(tagId) {
    if (!tagId) return services.value;
    return services.value.filter((s) => s.tagIds && s.tagIds.includes(tagId));
  }

  // Архив (добавили)
  async function archiveService(id) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;
    await servicesService.update(uid, id, { isArchived: true });
  }

  async function unarchiveService(id) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;
    await servicesService.update(uid, id, { isArchived: false });
  }
  
  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
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
    getServicesByTag,
    archiveService,
    unarchiveService,
    
    stop,
  };
});