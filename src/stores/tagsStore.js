// src/stores/tagsStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './authStore';
import { tagsService } from '@/services/tagsService';

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([]); // TagModel[]
  const loading = ref(false);
  let unsubscribe = null;

  const auth = useAuthStore();

  async function subscribe() {
    await auth.init();
    const uid = auth.currentUserId;

    if (unsubscribe) unsubscribe();
    if (!uid) {
      tags.value = [];
      loading.value = false;
      return;
    }

    loading.value = true;
    unsubscribe = tagsService.subscribe(
      uid,
      (rows) => {
        tags.value = rows;
        loading.value = false;
      },
      (err) => {
        console.error('Tags subscribe error:', err);
        loading.value = false;
      }
    );
  }

  async function addTag(tag) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid) return;

    await tagsService.add(uid, {
      name: tag.name,
      color: tag.color || '#grey', // 1-в-1 как раньше 16
    });
  }

  async function updateTag(id, tagData) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await tagsService.update(uid, id, tagData);
  }

  async function deleteTag(id) {
    await auth.init();
    const uid = auth.currentUserId;
    if (!uid || !id) return;

    await tagsService.delete(uid, id);
  }

  // 1-в-1 геттер из старого tagsStore 17
  function getTagById(id) {
    return tags.value.find((t) => t.id === id);
  }
  
  function stop() {
    if (unsubscribe) unsubscribe();
    unsubscribe = null;
    tags.value = [];
    loading.value = false;
  }

  return {
    tags,
    loading,
    subscribe,
    addTag,
    updateTag,
    deleteTag,
    getTagById,
    
    stop,
  };
});