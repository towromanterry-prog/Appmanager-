// serviceStore.js
import { defineStore } from 'pinia';  
import { ref } from 'vue';  
import { useOrderStore } from './orderStore';

const defaultServices = [  
  { id: 1, name: 'Стрижка', defaultPrice: 1500, tags: [] },  
  { id: 2, name: 'Окрашивание', defaultPrice: 5000, tags: [] },  
  { id: 3, name: 'Маникюр', defaultPrice: 2000, tags: [] },  
  { id: 4, name: 'Педикюр', defaultPrice: 2500, tags: [] },  
];

export const useServiceStore = defineStore('services', () => {  
  const services = ref([]);  

  function loadServices() {
    try {
      const stored = localStorage.getItem('services');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          services.value = parsed.map(s => ({
            ...s,
            tags: Array.isArray(s.tags) ? s.tags : []
          }));
        } else {
          throw new Error('Stored services is not an array');
        }
      } else {
        services.value = [...defaultServices];
      }
    } catch (error) {
      console.error('Ошибка загрузки services из localStorage:', error);
      services.value = [...defaultServices];
      localStorage.removeItem('services');
    }
  }

  function saveServices() {  
    localStorage.setItem('services', JSON.stringify(services.value));  
  }  

  function addService(serviceData) {  
    const newService = {  
      id: Date.now(),  
      name: serviceData.name,  
      defaultPrice: serviceData.defaultPrice,  
      tags: serviceData.tags || []
    };  
    services.value.push(newService);  
    saveServices();  
    return newService;
  }  

  function updateService(id, serviceData) {  
    const index = services.value.findIndex(s => s.id === id);
    if (index !== -1) {  
      services.value[index] = {  
        ...services.value[index],  
        name: serviceData.name,  
        defaultPrice: serviceData.defaultPrice,  
        tags: serviceData.tags || []
      };  
      saveServices();
      // Обновляем цены в активных заказах при обновлении услуги  
      const orderStore = useOrderStore();
      orderStore.updateServicePricesInActiveOrders(id, serviceData.defaultPrice);  
    }  
  }  

  function deleteService(id) {  
    const index = services.value.findIndex(s => s.id === id);
    if (index !== -1) {  
      services.value.splice(index, 1);  
      saveServices();
    }  
  }  

  function getServiceById(id) {  
    return services.value.find(s => s.id === id);
  }
  
  function getServicesByTag(tagName) {
    if (!tagName) return services.value;
    return services.value.filter(service => 
      service.tags && service.tags.includes(tagName)
    );
  }

  return {  
    services,  
    loadServices,  
    saveServices,  
    addService,  
    updateService,  
    deleteService,  
    getServiceById,
    getServicesByTag
  };
});
