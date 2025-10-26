// stores/tagsStore.js
import { defineStore } from 'pinia';
import { ref } from 'vue';

const defaultTags = [
  { id: 1, name: 'Срочно', color: 'red' },
  { id: 2, name: 'VIP', color: 'purple' },
  { id: 3, name: 'Простое', color: 'green' },
  { id: 4, name: 'Сложное', color: 'orange' },
];

export const useTagsStore = defineStore('tags', () => {
  const tags = ref([]);

function loadTags() {
  try {
    const stored = localStorage.getItem('tags');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Дополнительная валидация - проверяем что это массив
      if (Array.isArray(parsed)) {
        tags.value = parsed;
      } else {
        throw new Error('Stored tags is not an array');
      }
    } else {
      tags.value = [...defaultTags];
    }
  } catch (error) {
    console.error('Ошибка загрузки tags из localStorage:', error);
    tags.value = [...defaultTags];
    // Очищаем поврежденные данные
    localStorage.removeItem('tags');
  }
}

  function saveTags() {
    localStorage.setItem('tags', JSON.stringify(tags.value));
  }

  function addTag(tagData) {
    const newTag = {
      id: Date.now(),
      name: tagData.name,
      color: tagData.color || 'blue'
    };
    tags.value.push(newTag);
    saveTags();
    return newTag;
  }

  function updateTag(id, tagData) {
    const tagToUpdate = tags.value.find(t => t.id === id);
    if (tagToUpdate) {
      tagToUpdate.name = tagData.name;
      tagToUpdate.color = tagData.color;
      saveTags();
    }
  }

  function deleteTag(id) {
    const index = tags.value.findIndex(t => t.id === id);
    if (index !== -1) {
      tags.value.splice(index, 1);
      saveTags();
    }
  }

  function getTagById(id) {
    return tags.value.find(t => t.id === id);
  }

  return {
    tags,
    loadTags,
    saveTags,
    addTag,
    updateTag,
    deleteTag,
    getTagById
  };
});