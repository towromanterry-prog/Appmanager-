<script setup>
import { ref, computed, watch, onMounted } from 'vue';
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

// Инициализация данных перенесена в onMounted для безопасности
onMounted(() => {
  if (detailStore.details.length === 0 && detailStore.initRealtimeUpdates) {
    detailStore.initRealtimeUpdates();
  }
  if (tagsStore.tags.length === 0 && tagsStore.initRealtimeUpdates) {
    tagsStore.initRealtimeUpdates();
  }
});

const availableDetails = computed(() => {
  return detailStore.details.map(detail => ({
    ...detail,
    tagNames: getTags(detail.tagIds).map(t => t.name)
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
      tagIds: detail.tagIds || []
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
</script>

<template>
  <v-dialog v-model="dialog" max-width="600px" scrollable>
    <v-card class="detail-selection-card">
      <v-card-title class="headline">
        Выберите детали/работы
        <v-spacer></v-spacer>
        <v-text-field
          v-model="searchQuery"
          prepend-inner-icon="mdi-magnify"
          label="Поиск"
          variant="outlined"
          density="compact"
          hide-details
          class="mt-2"
        ></v-text-field>
      </v-card-title>

      <v-card-text style="max-height: 400px;">
        <v-list density="compact">
          <v-list-item
            v-for="detail in filteredDetails"
            :key="detail.id"
            @click="toggleDetail(detail)"
            :class="{ 'selected-item': isSelected(detail) }"
            class="mb-1 rounded-lg"
            variant="flat"
          >
            <template v-slot:prepend>
              <v-checkbox-btn
                :model-value="isSelected(detail)"
                @click.stop="toggleDetail(detail)"
                color="primary"
              ></v-checkbox-btn>
            </template>
            
            <v-list-item-title class="font-weight-medium">
              {{ detail.name }}
            </v-list-item-title>
            
            <v-list-item-subtitle>
              <v-chip
                v-for="tagName in detail.tagNames"
                :key="tagName"
                size="x-small"
                class="mr-1 mt-1"
                color="secondary"
                variant="tonal"
              >
                {{ tagName }}
              </v-chip>
            </v-list-item-subtitle>

            <template v-slot:append>
               <span class="text-body-2 font-weight-bold text-primary">
                 {{ detail.defaultPrice }} ₽
               </span>
            </template>
          </v-list-item>
        </v-list>
        
        <div v-if="filteredDetails.length === 0" class="text-center py-4 text-medium-emphasis">
          Ничего не найдено
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="grey-darken-1" variant="text" @click="closeModal">
          Отмена
        </v-btn>
        <v-btn color="primary" variant="elevated" @click="confirmSelection">
          Готово ({{ selected.length }})
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.detail-selection-card {
  border-radius: 16px;
}
.selected-item {
  background-color: rgb(var(--v-theme-primary), 0.1) !important;
}
</style>
