import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTemplateSelectionStore = defineStore('templateSelection', () => {
  const isVisible = ref(false);
  const templates = ref([]);
  let resolvePromise = null;

  const open = (templateList) => {
    templates.value = templateList;
    isVisible.value = true;
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const selectTemplate = (template) => {
    if (resolvePromise) {
      resolvePromise(template);
    }
    isVisible.value = false;
    templates.value = [];
    resolvePromise = null;
  };

  const close = () => {
    if (resolvePromise) {
      resolvePromise(null);
    }
    isVisible.value = false;
    templates.value = [];
    resolvePromise = null;
  };

  return {
    isVisible,
    templates,
    open,
    selectTemplate,
    close,
  };
});