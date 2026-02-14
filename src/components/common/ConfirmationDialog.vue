<template>
  <v-dialog v-model="confirmationStore.dialog" max-width="400" persistent>
    <v-card color="surface" variant="flat" :border="true" :elevation="0">
      <v-card-title class="text-subtitle-1">{{ confirmationStore.title }}</v-card-title>
      <v-card-text class="text-body-2">{{ confirmationStore.message }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="confirmationStore.cancel()">
          {{ confirmationStore.cancelText || 'Отмена' }}
        </v-btn>
        <v-btn :color="confirmationStore.color || 'primary'" variant="text" @click="confirmationStore.confirm()">
          {{ confirmationStore.confirmText || 'ОК' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useConfirmationStore } from '@/stores/confirmationStore.js';
const confirmationStore = useConfirmationStore();
</script>