import { defineStore } from 'pinia';

export const useConfirmationStore = defineStore('confirmation', {
  state: () => ({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    color: 'primary', // Для изменения цвета кнопки (например, 'error' для удаления)
    resolve: null, // Ссылка на resolve промиса
  }),

  actions: {
    /**
     * Открывает диалог подтверждения
     * @param {Object} options - { title, message, confirmText, cancelText, color }
     * @returns {Promise<boolean>} - true если нажали "Да", false если "Нет"
     */
    ask({ title, message, confirmText, cancelText, color } = {}) {
      this.title = title || 'Подтверждение';
      this.message = message || 'Вы уверены, что хотите продолжить?';
      this.confirmText = confirmText || 'Да';
      this.cancelText = cancelText || 'Нет';
      this.color = color || 'primary';
      this.isOpen = true;

      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    },

    confirm() {
      this.isOpen = false;
      if (this.resolve) {
        this.resolve(true);
        this.resolve = null;
      }
    },

    cancel() {
      this.isOpen = false;
      if (this.resolve) {
        this.resolve(false);
        this.resolve = null;
      }
    }
  }
});
