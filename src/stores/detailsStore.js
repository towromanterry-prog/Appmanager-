// src/stores/detailsStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './authStore';
import { detailsService } from '@/services/detailsService';
import { useOrderStore } from './orderStore'; // как в старом detailStore 13

export const useDetailsStore = defineStore('details', () => {
  const details = ref([]); // DetailModel[]
  const loading = ref(false);
  let unsubscribe = null;

  const auth = useAuthStore();

  async function subscribe() {
    await auth.init();
    const uid = auth.currentUserId;

    if (unsubscribe) unsubscribe();
    if (!uid) {
      details.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    unsubscribe = detailsService.subscribe(
      uid,
      (rows) => {
        details.value = rows;
        loading.value = false;
      },
      (err) => {
        console.error('Details subscribe error:', err);
        loading.value = false;
      }
    );
  }

  async function addDetail(detailData) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid) return;

    await detailsService.add(uid, {
      name: detailData.name,
      defaultPrice: Number(detailData.defaultPrice) || 0,
      category: detailData.category || '',
    });
  }

  async function updateDetail(id, detailData) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await detailsService.update(uid, id, {
      name: detailData.name,
      defaultPrice: Number(detailData.defaultPrice) || 0,
      category: detailData.category || '',
    });

    // Сохранил “как было”: хук на обновление цен в активных заказах 14
    // Если в новом orderStore появится метод — просто раскомментируешь:
    // const orderStore = useOrderStore();
    // orderStore.updateDetailPricesInActiveOrders?.(id, Number(detailData.defaultPrice) || 0);
  }

  async function deleteDetail(id) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await detailsService.delete(uid, id);
  }

  // 1-в-1 геттер из старого detailStore 15
  function getDetailById(id) {
    return details.value.find((d) => d.id === id);
  }
  
  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    details.value = [];
    loading.value = false;
  }

  return {
    details,
    loading,
    subscribe,
    addDetail,
    updateDetail,
    deleteDetail,
    getDetailById,
    
    stop,
  };
});