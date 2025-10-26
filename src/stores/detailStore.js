// detailStore.js
import { defineStore } from 'pinia';  
import { ref } from 'vue';  

const defaultDetails = [  
  { id: 1, name: 'Болт М8', defaultPrice: 50, tagIds: [], icon: '' },
  { id: 2, name: 'Гайка М8', defaultPrice: 30, tagIds: [], icon: '' },
  { id: 3, name: 'Шайба', defaultPrice: 10, tagIds: [], icon: '' },
];  

export const useDetailStore = defineStore('details', () => {  
  const details = ref([]);  

  function loadDetails() {
    try {
      const stored = localStorage.getItem('details');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let needsSave = false;
          details.value = parsed.map(d => {
            // Migration from 'tags' to 'tagIds'
            if (d.hasOwnProperty('tags')) {
              d.tagIds = d.tags;
              delete d.tags;
              needsSave = true;
            }
            // Ensure tagIds is always an array
            if (!Array.isArray(d.tagIds)) {
              d.tagIds = [];
            }
            d.icon = d.icon || '';
            return d;
          });
          if (needsSave) {
            saveDetails();
          }
        } else {
          throw new Error('Stored details is not an array');
        }
      } else {
        details.value = defaultDetails.map(d => ({...d}));
      }
    } catch (error) {
      console.error('Ошибка загрузки details из localStorage:', error);
      details.value = defaultDetails.map(d => ({...d}));
      localStorage.removeItem('details');
    }
  }

  function saveDetails() {  
    localStorage.setItem('details', JSON.stringify(details.value));  
  }  

  function addDetail(detailData) {  
    const newDetail = {  
      id: Date.now(),  
      name: detailData.name,  
      defaultPrice: detailData.defaultPrice,  
      tagIds: detailData.tagIds || [],
      icon: detailData.icon || ''
    };  
    details.value.push(newDetail);  
    saveDetails();  
    return newDetail;  
  }  

  function updateDetail(id, detailData) {  
    const index = details.value.findIndex(d => d.id === id);  
    if (index !== -1) {  
      details.value[index] = {  
        ...details.value[index],  
        name: detailData.name,  
        defaultPrice: detailData.defaultPrice,  
        tagIds: detailData.tagIds || [],
        icon: detailData.icon || ''
      };  
      saveDetails();  
    }  
  }  

  function deleteDetail(id) {  
    const index = details.value.findIndex(d => d.id === id);  
    if (index !== -1) {  
      details.value.splice(index, 1);  
      saveDetails();  
    }  
  }  

  function getDetailById(id) {  
    return details.value.find(d => d.id === id);  
  }

  function getPopularIcons() {
    return [
      { value: 'mdi-nut', text: 'Гайка' },
      { value: 'mdi-screw-lag', text: 'Болт' },
      { value: 'mdi-Circle-outline', text: 'Шайба' },
      { value: 'mdi-cog', text: 'Шестерня' },
      { value: 'mdi-wrench', text: 'Инструмент' },
      { value: 'mdi-tools', text: 'Инструменты' },
      { value: 'mdi-hammer-wrench', text: 'Ремонт' },
      { value: 'mdi-car-wrench', text: 'Автодеталь' },
      { value: 'mdi-chip', text: 'Электроника' },
      { value: 'mdi-package-variant', text: 'Запчасть' }
    ];
  }
  
  function getDetailsByTag(tagId) {
    if (!tagId) return details.value;
    return details.value.filter(detail => 
      detail.tagIds && detail.tagIds.includes(tagId)
    );
  }

  return {  
    details,  
    loadDetails,  
    saveDetails,  
    addDetail,  
    updateDetail,  
    deleteDetail,  
    getDetailById,
    getPopularIcons,
    getDetailsByTag
  };  
});