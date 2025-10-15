import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettingsViewStore = defineStore('settingsView', () => {
  const sortBy = ref('name'); // 'name' or 'id'

  return {
    sortBy,
  };
});