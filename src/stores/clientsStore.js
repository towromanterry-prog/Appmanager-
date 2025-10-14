// clientsStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useClientsStore = defineStore('clients', () => {
  const clients = ref([]);
  const sortBy = ref('name');
  
function loadClients() {
  try {
    const stored = localStorage.getItem('clientsDatabase');
    if (stored) {
      let parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        // Простая миграция для добавления lastName
        parsed = parsed.map(client => {
          if (client.name && !client.lastName) {
            const nameParts = client.name.split(' ');
            client.lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
            client.name = nameParts[0] || '';
          }
          return client;
        });
        clients.value = parsed;
      } else {
        throw new Error('Stored clients is not an array');
      }
    }
  } catch (error) {
    console.error('Ошибка загрузки clients из localStorage:', error);
    clients.value = [];
    localStorage.removeItem('clientsDatabase');
  }
}
  
  function saveClients() {
    localStorage.setItem('clientsDatabase', JSON.stringify(clients.value));
  }
  
  function addOrUpdateClient(clientData) {
    const { name, lastName = '', phone, services = [], notes = '' } = clientData;
    
    const existingIndex = clients.value.findIndex(c => c.phone === phone);
    
    const clientRecord = {
      id: phone,
      name,
      lastName,
      phone,
      lastOrderDate: new Date().toISOString(),
      totalOrders: existingIndex >= 0 ? clients.value[existingIndex].totalOrders + 1 : 1,
      favoriteServices: services,
      notes,
      history: existingIndex >= 0 ? 
        [...clients.value[existingIndex].history, { date: new Date().toISOString(), services }].slice(-10) :
        [{ date: new Date().toISOString(), services }]
    };
    
    if (existingIndex >= 0) {
      // Обновляем запись, сохраняя некоторые старые значения
      const oldRecord = clients.value[existingIndex];
      clients.value[existingIndex] = {
        ...oldRecord,
        ...clientRecord,
        totalOrders: oldRecord.totalOrders + 1,
        history: [...oldRecord.history, { date: new Date().toISOString(), services }].slice(-10)
      };
    } else {
      clients.value.push(clientRecord);
    }
    
    saveClients();
  }
  
  // Поиск клиентов для автокомплита
  const searchClients = computed(() => (query) => {
    if (!query || query.length < 2) return [];
    
    const lowerQuery = query.toLowerCase();
    return clients.value
      .filter(client => 
        client.name.toLowerCase().includes(lowerQuery) ||
        client.phone.includes(query)
      )
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate))
      .slice(0, 10);
  });
  
  function getClientByPhone(phone) {
    return clients.value.find(c => c.phone === phone);
  }
  
  function getClientByName(name) {
    return clients.value.find(c => c.name.toLowerCase() === name.toLowerCase());
  }
  
  function deleteClient(phone) {
    const index = clients.value.findIndex(c => c.phone === phone);
    if (index >= 0) {
      clients.value.splice(index, 1);
      saveClients();
    }
  }
  
  function getTopClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, limit);
  }
  
  function getRecentClients(limit = 10) {
    return [...clients.value]
      .sort((a, b) => new Date(b.lastOrderDate) - new Date(a.lastOrderDate))
      .slice(0, limit);
  }
  
  return {
    clients,
    sortBy,
    loadClients,
    addOrUpdateClient,
    searchClients,
    getClientByPhone,
    getClientByName,
    deleteClient,
    getTopClients,
    getRecentClients
  };
});