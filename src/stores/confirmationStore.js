import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useConfirmationStore = defineStore('confirmation', () => {
  const dialog = ref(false);
  const title = ref('');
  const message = ref('');
  
  // Эти функции будут хранить коллбэки resolve/reject для промиса
  let resolvePromise = null;
  
  const open = (newTitle, newMessage) => {
    title.value = newTitle;
    message.value = newMessage;
    dialog.value = true;
    
    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const confirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
      resolvePromise = null;  // ✅ ДОБАВИТЬ: Очистка ссылки
    }
    dialog.value = false;
  };

  const cancel = () => {
    if (resolvePromise) {
      resolvePromise(false);
      resolvePromise = null;  // ✅ ДОБАВИТЬ: Очистка ссылки
    }
    dialog.value = false;
  };

  return { dialog, title, message, open, confirm, cancel };
});