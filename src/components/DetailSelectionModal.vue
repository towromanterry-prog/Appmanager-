<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="closeModal"></v-btn>
        <v-toolbar-title>Выберите детали</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn variant="text" @click="confirmSelection">Добавить</v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="searchQuery"
                label="Поиск по названию или тегу"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                clearable
                hide-details
              ></v-text-field>
            </v-col>
          </v-row>

          <v-list lines="two" select-strategy="classic">
            <v-list-item
              v-for="detail in filteredDetails"
              :key="detail.id"
              :value="detail.id"
              @click="toggleDetail(detail)"
            >
              <template v-slot:prepend="{ isSelected: isSlotSelected }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isSelected(detail)"></v-checkbox-btn>
                </v-list-item-action>
              </template>

              <v-list-item-title>{{ detail.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  v-for="tag in getTags(detail.tags)"
                  :key="tag.id"
                  :color="tag.color"
                  size="x-small"
                  class="mr-1"
                >
                  {{ tag.name }}
                </v-chip>
              </v-list-item-subtitle>

              <template v-slot:append>
                <span class="text-body-1 font-weight-medium">
                  {{ detail.defaultPrice }} ₽
                </span>
              </template>
            </v-list-item>
          </v-list>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Fuse from 'fuse.js';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  previouslySelected: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'selection-confirmed']);

const detailStore = useDetailStore();
const tagsStore = useTagsStore();
const dialog = ref(props.modelValue);
const searchQuery = ref('');
const selected = ref([]);

const availableDetails = computed(() => {
  return detailStore.details.map(detail => ({
    ...detail,
    tagNames: getTags(detail.tags).map(t => t.name)
  }));
});

const fuse = computed(() => {
  return new Fuse(availableDetails.value, {
    keys: ['name', 'tagNames'],
    threshold: 0.3,
  });
});

const filteredDetails = computed(() => {
  if (!searchQuery.value) {
    return availableDetails.value;
  }
  return fuse.value.search(searchQuery.value).map(result => result.item);
});

const isSelected = (detail) => {
  return selected.value.some(s => s.id === detail.id);
};

const getTags = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.tags.find(t => t.id === id)).filter(Boolean);
};

const toggleDetail = (detail) => {
  const index = selected.value.findIndex(s => s.id === detail.id);
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value.push({
      id: detail.id,
      name: detail.name,
      price: detail.defaultPrice,
      status: 'accepted',
      tags: detail.tags || []
    });
  }
};

const confirmSelection = () => {
  emit('selection-confirmed', selected.value);
  closeModal();
};

const closeModal = () => {
  dialog.value = false;
};

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    selected.value = JSON.parse(JSON.stringify(props.previouslySelected));
  }
});

watch(dialog, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false);
  }
});

if (detailStore.details.length === 0) {
  detailStore.loadDetails();
}
if (tagsStore.tags.length === 0) {
  tagsStore.loadTags();
}
</script>

<style scoped>
.v-list-item-subtitle .v-chip {
  margin-top: 4px;
}
</style>