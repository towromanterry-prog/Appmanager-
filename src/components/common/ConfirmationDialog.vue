<template>
  <v-dialog v-model="confirmationStore.dialog" max-width="400" persistent>
    <v-card>
      <v-card-title class="text-h5">{{ confirmationStore.title }}</v-card-title>
      <v-card-text>{{ confirmationStore.message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text @click="confirmationStore.cancel()">Отмена</v-btn>
        <v-btn color="primary" text @click="confirmationStore.confirm()">ОК</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useConfirmationStore } from '@/stores/confirmationStore.js';
const confirmationStore = useConfirmationStore();
</script>