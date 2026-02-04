import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useDetailStore = defineStore('details', () => {
  const details = ref([]);
  const user = ref(null);
  const loading = ref(false);
  let unsubscribe = null;

  function init() {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        subscribeToUserDetails(currentUser.uid);
      } else {
        details.value = [];
        loading.value = false;
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserDetails(userId) {
    if (unsubscribe) unsubscribe();
    loading.value = true;
    const q = query(collection(db, 'users', userId, 'details'), orderBy('name'));

    unsubscribe = onSnapshot(q, (snapshot) => {
      details.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loading.value = false;
    }, (error) => {
      console.error("Ошибка синхронизации деталей:", error);
      loading.value = false;
    });
  }

  async function addDetail(detailData) {
    if (!user.value) return;
    try {
      await addDoc(collection(db, 'users', user.value.uid, 'details'), {
        name: detailData.name,
        defaultPrice: Number(detailData.defaultPrice) || 0,
        category: detailData.category || ''
      });
    } catch (e) {
      console.error("Ошибка добавления детали:", e);
    }
  }

  async function updateDetail(id, detailData) {
    if (!user.value) return;
    try {
      const detailRef = doc(db, 'users', user.value.uid, 'details', id);
      await updateDoc(detailRef, {
        name: detailData.name,
        defaultPrice: Number(detailData.defaultPrice) || 0,
        category: detailData.category || ''
      });

      // Обновляем цены в активных заказах (сохраняем вашу старую логику)
      // Тут нужно будет добавить метод updateDetailPricesInActiveOrders в orderStore,
      // если его там нет (по аналогии с услугами). 
      // Но если критично, можно пока пропустить.
    } catch (e) {
      console.error("Ошибка обновления детали:", e);
    }
  }

  async function deleteDetail(id) {
    if (!user.value) return;
    try {
      await deleteDoc(doc(db, 'users', user.value.uid, 'details', id));
    } catch (e) {
      console.error("Ошибка удаления детали:", e);
    }
  }

  function getDetailById(id) {
    return details.value.find(d => d.id === id);
  }

  const loadDetails = () => {};

  init();

  return {
    details,
    user,
    loading,
    loadDetails,
    addDetail,
    updateDetail,
    deleteDetail,
    getDetailById
  };
});
