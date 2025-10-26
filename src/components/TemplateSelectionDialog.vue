<template>
  <v-dialog :model-value="selectionStore.isVisible" @update:model-value="selectionStore.close()" max-width="500">
    <v-card>
      <v-card-title>Выберите шаблон</v-card-title>
      <v-card-text>
        <v-list>
          <v-list-item
            v-for="template in selectionStore.templates"
            :key="template.id"
            :title="template.text"
            @click="selectionStore.selectTemplate(template)"
          ></v-list-item>
        </v-list>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="selectionStore.close()">Отмена</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useTemplateSelectionStore } from '@/stores/templateSelectionStore';

const selectionStore = useTemplateSelectionStore();
</script>