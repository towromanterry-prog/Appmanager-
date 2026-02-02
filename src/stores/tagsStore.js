import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([]);
  const user = ref(null);
  let unsubscribe = null;

  // Инициализация
  function init() {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        subscribeToUserTags(currentUser.uid);
      } else {
        tags.value = [];
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserTags(userId) {
    if (unsubscribe) unsubscribe();
    // Сортируем теги по имени
    const q = query(collection(db, 'users', userId, 'tags'), orderBy('name'));

    unsubscribe = onSnapshot(q, (snapshot) => {
      tags.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    });
  }

  async function addTag(tag) {
    if (!user.value) return;
    try {
      await addDoc(collection(db, 'users', user.value.uid, 'tags'), {
        name: tag.name,
        color: tag.color || '#grey', // Дефолтный цвет
      });
    } catch (e) {
      console.error("Ошибка добавления тега:", e);
    }
  }

  async function updateTag(id, tagData) {
    if (!user.value) return;
    try {
      await updateDoc(doc(db, 'users', user.value.uid, 'tags', id), tagData);
    } catch (e) {
      console.error("Ошибка обновления тега:", e);
    }
  }

  async function deleteTag(id) {
    if (!user.value) return;
    try {
      await deleteDoc(doc(db, 'users', user.value.uid, 'tags', id));
    } catch (e) {
      console.error("Ошибка удаления тега:", e);
    }
  }

  function getTagById(id) {
    return tags.value.find(t => t.id === id);
  }

  init();

  return {
    tags,
    addTag,
    updateTag,
    deleteTag,
    getTagById
  };
});
