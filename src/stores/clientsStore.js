import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
// Импортируем Firebase
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '@/firebase';

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]);
  const loading = ref(false);
  const user = ref(null);
  let unsubscribe = null;

  // === 1. Инициализация и синхронизация ===
  function init() {
    onAuthStateChanged(auth, (currentUser) => {
      user.value = currentUser;
      if (currentUser) {
        subscribeToUserClients(currentUser.uid);
      } else {
        clients.value = [];
        if (unsubscribe) unsubscribe();
      }
    });
  }

  function subscribeToUserClients(userId) {
    if (unsubscribe) unsubscribe();
    loading.value = true;

    // Сортируем по имени, чтобы список был красивым
    const q = query(collection(db, 'users', userId, 'clients'), orderBy('name'));

    // onSnapshot автоматически кэширует данные локально и обновляет их из облака
    unsubscribe = onSnapshot(q, (snapshot) => {
      clients.value = snapshot.docs.map(doc => ({
        id: doc.id, // ID документа (в нашем случае это будет телефон)
        ...doc.data()
      }));
      loading.value = false;
    }, (error) => {
      console.error("Ошибка синхронизации клиентов:", error);
      loading.value = false;
    });
  }

  // === 2. Добавление или Обновление (Умная логика) ===
  async function addOrUpdateClient(clientData) {
    if (!user.value) return;

    // Извлекаем данные
    const { name, lastName = '', phone, services = [], notes = '' } = clientData;
    
    // Ищем, есть ли такой клиент уже в нашем загруженном списке
    // Используем phone как уникальный ключ
    const existingClient = clients.value.find(c => c.phone === phone);

    // Подготовка новых данных
    // Если клиент был, берем его старые счетчики, иначе начинаем с нуля
    const totalOrders = existingClient ? (existingClient.totalOrders || 0) + 1 : 1;
    
    // Логика истории (последние 10 заказов)
    const newHistoryEntry = { 
      date: new Date().toISOString(), 
      services: services 
    };
    
    let history = [];
    if (existingClient && Array.isArray(existingClient.history)) {
      history = [...existingClient.history, newHistoryEntry].slice(-10);
    } else {
      history = [newHistoryEntry];
    }

    const clientRecord = {
      name,
      lastName,
      phone,
      lastOrderDate: new Date().toISOString(),
      totalOrders,
      favoriteServices: services, // Обновляем любимые услуги последними
      notes: notes || (existingClient ? existingClient.notes : ''), // Не стираем заметки, если новые пустые
      history
    };

    try {
      // ИСПОЛЬЗУЕМ setDoc и phone как ID документа
      // Это гарантирует, что в базе не будет дублей по телефону
      await setDoc(doc(db, 'users', user.value.uid, 'clients', phone), clientRecord, { merge: true });
    } catch (e) {
      console.error("Ошибка сохранения клиента:", e);
    }
  }

  // === 3. Удаление ===
  async function deleteClient(phone) {
    if (!user.value) return;
    try {
      // Удаляем по ID (который является телефоном)
      await deleteDoc(doc(db, 'users', user.value.uid, 'clients', phone));
    } catch (e) {
      console.error("Ошибка удаления клиента:", e);
    }
  }

  // === 4. Геттеры и Поиск (Оставляем как было, работает с локальным массивом) ===
  const searchClients = computed(() => (query) => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return clients.value
      .filter(client => 
        (client.name && client.name.toLowerCase().includes(lowerQuery)) ||
        (client.phone && client.phone.includes(query))
      )
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate))
      .slice(0, 10);
  });
  
  function getClientByPhone(phone) {
    return clients.value.find(c => c.phone === phone);
  }
  
  function getClientByName(name) {
    return clients.value.find(c => c.name && c.name.toLowerCase() === name.toLowerCase());
  }
  
  function getTopClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => (b.totalOrders || 0) - (a.totalOrders || 0))
      .slice(0, limit);
  }
  
  function getRecentClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate))
      .slice(0, limit);
  }

  // Запуск при создании стора
  init();

  return {
    clients,
    loading,
    user,
    // loadClients больше не нужен, init делает это сам
    addOrUpdateClient,
    deleteClient,
    searchClients,
    getClientByPhone,
    getClientByName,
    getTopClients,
    getRecentClients
  };
});
