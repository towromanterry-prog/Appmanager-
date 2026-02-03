// src/stores/serviceStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, query, orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; // Слушатель авторизации
import { db, auth } from '@/firebase';

export const useServiceStore = defineStore('services', () => {
  const services = ref([]);
  const loading = ref(false);
  const user = ref(null); // Текущий пользователь
  let unsubscribe = null;

  // Главная функция инициализации
  function init() {
    // Слушаем изменение статуса входа (Вход / Выход)
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;

      if (currentUser) {
        // Если вошли — подписываемся на СВОИ данные
        subscribeToUserServices(currentUser.uid);
      } else {
        // Если вышли — очищаем данные
        services.value = [];
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserServices(userId) {
    if (unsubscribe) unsubscribe();
    loading.value = true;
    
    // Путь к коллекции: users -> [ID юзера] -> services
    const userServicesRef = collection(db, 'users', userId, 'services');
    const q = query(userServicesRef, orderBy('name'));

    unsubscribe = onSnapshot(q, (snapshot) => {
      services.value = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tagIds: Array.isArray(data.tagIds) ? data.tagIds : (data.tags || [])
        };
      });
      loading.value = false;
    });
  }

  // Методы изменения данных теперь тоже используют ID юзера
  async function addService(serviceData) {
    if (!user.value) return; // Защита: нельзя писать без входа
    
    try {
      await addDoc(collection(db, 'users', user.value.uid, 'services'), {
        name: serviceData.name,
        defaultPrice: Number(serviceData.defaultPrice),
        tagIds: serviceData.tagIds || []
      });
    } catch (e) {
      console.error("Ошибка добавления:", e);
    }
  }

  async function updateService(id, serviceData) {
    if (!user.value) return;
    
    try {
      // Путь к конкретному документу: users/[uid]/services/[serviceId]
      const serviceRef = doc(db, 'users', user.value.uid, 'services', id);
      await updateDoc(serviceRef, {
        name: serviceData.name,
        defaultPrice: Number(serviceData.defaultPrice),
        tagIds: serviceData.tagIds || []
      });
    } catch (e) {
      console.error("Ошибка обновления:", e);
    }
  }

  async function deleteService(id) {
    if (!user.value) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.value.uid, 'services', id));
    } catch (e) {
      console.error("Ошибка удаления:", e);
    }
  }

  // Геттеры для UI
  function getServiceById(id) {
    return services.value.find(s => s.id === id);
  }
  
  function getServicesByTag(tagId) {
    if (!tagId) return services.value;
    return services.value.filter(s => s.tagIds && s.tagIds.includes(tagId));
  }

  const loadServices = () => {};

  // Запуск прослушивания при создании стора
  init();

  return {
    services,
    user, // Экспортируем юзера, чтобы проверять в UI, вошли мы или нет
    loading,
    loadServices,
    addService,
    updateService,
    deleteService,
    getServiceById,
    getServicesByTag
  };
});
