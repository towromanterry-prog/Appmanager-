import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { db } from '@/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Detail } from '@/models/Detail';
import { createConverter } from '@/services/baseService';
import { auth } from '@/firebase';

const converter = createConverter(Detail);

export const useDetailStore = defineStore('details', () => {
  const details = ref([]);
  const loading = ref(false);
  const user = ref(auth.currentUser);
  let unsubscribe = null;

  // ИМЯ МЕТОДА ВАЖНО: Старый UI ищет loadDetails или initRealtimeUpdates
  // Лучше добавить и то и другое для совместимости
  const initRealtimeUpdates = () => {
    if (!auth.currentUser) return;
    if (unsubscribe) return;
    
    loading.value = true;
    const q = query(collection(db, 'details'), orderBy('name'));
    
    unsubscribe = onSnapshot(q.withConverter(converter), (snapshot) => {
      details.value = snapshot.docs.map(d => d.data());
      loading.value = false;
    }, (err) => {
      console.error("Detail store error", err);
      loading.value = false;
    });
  };

  // Алиас для старого UI
  const loadDetails = initRealtimeUpdates;

  const categories = computed(() => {
    const cats = new Set(details.value.map(d => d.category).filter(Boolean));
    return Array.from(cats).sort();
  });

  const getDetailById = (id) => details.value.find(d => d.id === id);

  const addDetail = async (data) => {
    const detail = new Detail(data);
    await addDoc(collection(db, 'details').withConverter(converter), detail);
  };

  const updateDetail = async (data) => {
    if (!data.id) return;
    const detail = new Detail(data);
    await updateDoc(doc(db, 'details', data.id).withConverter(converter), converter.toFirestore(detail));
  };

  const deleteDetail = async (id) => {
    await deleteDoc(doc(db, 'details', id));
  };

  return {
    details,
    loading,
    user,
    categories,
    initRealtimeUpdates,
    loadDetails, // Экспортируем алиас для фикса ошибки
    getDetailById,
    addDetail,
    updateDetail,
    deleteDetail
  };
});
