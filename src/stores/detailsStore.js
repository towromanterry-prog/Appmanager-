// src/stores/detailsStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './authStore';
import { detailsService } from '@/services/detailsService';

export const useDetailsStore = defineStore('details', () => {
  const details = ref([]); // DetailModel[]
  const loading = ref(false);

  const auth = useAuthStore();

  let _uid = null;
  let unsubscribe = null;

  const getUid = () => _uid || auth.currentUserId || null;

  const activeItems = computed(() => details.value.filter((d) => !d.isArchived));

  function subscribe(uidOverride) {
    const uid = uidOverride || auth.currentUserId || null;
    _uid = uid;

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
        // ВЫРЕЗАЕМ category из данных на входе, чтобы приложение её “не видело”
        details.value = (rows || []).map((row) => {
          if (!row || typeof row !== 'object') return row;
          const { category, ...rest } = row;
          return rest;
        });
        loading.value = false;
      },
      (err) => {
        console.error('Details subscribe error:', err);
        loading.value = false;
      }
    );
  }

  async function addDetail(detailData) {
    const uid = getUid();
    if (!uid) return;

    await detailsService.add(uid, {
      name: String(detailData.name || '').trim(),
      defaultPrice: Number(detailData.defaultPrice) || 0,
      isArchived: !!detailData.isArchived,
    });
  }

  async function updateDetail(id, detailData) {
    const uid = getUid();
    if (!uid || !id) return;

    await detailsService.update(uid, id, {
      name: String(detailData.name || '').trim(),
      defaultPrice: Number(detailData.defaultPrice) || 0,
    });
  }

  async function archiveDetail(id) {
    const uid = getUid();
    if (!uid || !id) return;
    await detailsService.update(uid, id, { isArchived: true });
  }

  async function unarchiveDetail(id) {
    const uid = getUid();
    if (!uid || !id) return;
    await detailsService.update(uid, id, { isArchived: false });
  }

  async function deleteDetail(id) {
    const uid = getUid();
    if (!uid || !id) return;
    await detailsService.delete(uid, id);
  }

  function getDetailById(id) {
    return details.value.find((d) => d.id === id);
  }

  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    _uid = null;
    details.value = [];
    loading.value = false;
  }

  return {
    details,
    loading,
    activeItems,

    subscribe,
    addDetail,
    updateDetail,
    deleteDetail,
    getDetailById,

    archiveDetail,
    unarchiveDetail,

    stop,
  };
});