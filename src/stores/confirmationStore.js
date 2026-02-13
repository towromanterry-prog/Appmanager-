import { defineStore } from 'pinia';

export const useConfirmationStore = defineStore('confirmation', {
  state: () => ({
    // UI ждёт именно это поле:
    dialog: false,

    title: '',
    message: '',
    confirmText: 'ОК',
    cancelText: 'Отмена',
    color: 'primary',
    resolve: null,
  }),

  actions: {
    // UI вызывает confirmationStore.open(title, message)
    open(title, message, opts = {}) {
      this.title = title || 'Подтверждение';
      this.message = message || 'Вы уверены?';
      this.confirmText = opts.confirmText || 'ОК';
      this.cancelText = opts.cancelText || 'Отмена';
      this.color = opts.color || 'primary';
      this.dialog = true;

      return new Promise((resolve) => {
        this.resolve = resolve;
      });
    },

    confirm() {
      this.dialog = false;
      this.resolve?.(true);
      this.resolve = null;
    },

    cancel() {
      this.dialog = false;
      this.resolve?.(false);
      this.resolve = null;
    },
  },
});