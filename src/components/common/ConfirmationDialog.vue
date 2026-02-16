<template>
  <AppDialog 
    v-model="confirmationStore.dialog" 
    :max-width="400" 
    persistent
    :title="confirmationStore.title"
  >
    <div class="text-body-2">
      {{ confirmationStore.message }}
    </div>

    <template #actions>
      <v-btn variant="text" @click="confirmationStore.cancel()">
        {{ confirmationStore.cancelText || 'Отмена' }}
      </v-btn>
      <v-btn 
        :color="confirmationStore.color || 'primary'" 
        variant="text" 
        @click="confirmationStore.confirm()"
      >
        {{ confirmationStore.confirmText || 'ОК' }}
      </v-btn>
    </template>
  </AppDialog>
</template>

<script setup>
import { useConfirmationStore } from '@/stores/confirmationStore.js';
import AppDialog from '@/components/ui/AppDialog.vue'; // <-- Добавили импорт

const confirmationStore = useConfirmationStore();
</script>
