// serviceStore.js
import { defineStore } from 'pinia';  
import { ref } from 'vue';  
import { useOrderStore } from './orderStore';

const defaultServices = [  
  { id: 1, name: 'Стрижка', defaultPrice: 1500, tagIds: [] },
  { id: 2, name: 'Окрашивание', defaultPrice: 5000, tagIds: [] },
  { id: 3, name: 'Маникюр', defaultPrice: 2000, tagIds: [] },
  { id: 4, name: 'Педикюр', defaultPrice: 2500, tagIds: [] },
];

export const useServiceStore = defineStore('services', () => {  
  const services = ref([]);  

  function loadServices() {
    try {
      const stored = localStorage.getItem('services');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let needsSave = false;
          services.value = parsed.map(s => {
            // Migration from 'tags' to 'tagIds'
            if (s.hasOwnProperty('tags')) {
              s.tagIds = s.tags;
              delete s.tags;
              needsSave = true;
            }
            // Ensure tagIds is always an array
            if (!Array.isArray(s.tagIds)) {
              s.tagIds = [];
            }
            return s;
          });
          if (needsSave) {
            saveServices();
          }
        } else {
          throw new Error('Stored services is not an array');
        }
      } else {
        services.value = defaultServices.map(s => ({...s}));
      }
    } catch (error) {
      console.error('Ошибка загрузки services из localStorage:', error);
      services.value = defaultServices.map(s => ({...s}));
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
      tagIds: serviceData.tagIds || []
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
        tagIds: serviceData.tagIds || []
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
  
  function getServicesByTag(tagId) {
    if (!tagId) return services.value;
    return services.value.filter(service => 
      service.tagIds && service.tagIds.includes(tagId)
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
