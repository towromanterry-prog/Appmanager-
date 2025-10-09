// stores/modelStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useModelStore = defineStore('models', () => {
  const models = ref([]);

  function loadModels() {
    try {
      const stored = localStorage.getItem('models');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          models.value = parsed;
        } else {
          throw new Error('Stored models is not an array');
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки models из localStorage:', error);
      models.value = [];
      localStorage.removeItem('models');
    }
  }

  function saveModels() {
    localStorage.setItem('models', JSON.stringify(models.value));
  }

  function addModel(modelData) {
    const newModel = {
      id: Date.now(),
      name: modelData.name,
      color: modelData.color, // <-- ДОБАВЛЕНА ЭТА СТРОКА
    };
    models.value.push(newModel);
    saveModels();
    return newModel;
  }

  function updateModel(id, modelData) {
    const index = models.value.findIndex(m => m.id === id);
    if (index !== -1) {
      models.value[index].name = modelData.name;
      models.value[index].color = modelData.color; // <-- ДОБАВЛЕНА ЭТА СТРОКА
      saveModels();
    }
  }

  function deleteModel(id) {
    const index = models.value.findIndex(m => m.id === id);
    if (index !== -1) {
      models.value.splice(index, 1);
      saveModels();
    }
  }

  return {
    models,
    loadModels,
    saveModels,
    addModel,
    updateModel,
    deleteModel,
  };
});
