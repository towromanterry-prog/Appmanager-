<template>
  <v-dialog v-model="dialog" fullscreen transition="dialog-bottom-transition">
    <v-card>
      <v-toolbar color="primary" dark>
        <v-btn icon="mdi-close" @click="closeModal"></v-btn>
        <v-toolbar-title>Выберите услуги</v-toolbar-title>
        <v-spacer></v-spacer>
        <v-toolbar-items>
          <v-btn variant="text" @click="confirmSelection">Добавить</v-btn>
        </v-toolbar-items>
      </v-toolbar>

      <v-card-text>
        <v-container fluid>
          <v-row>
            <v-col cols="12">
              <div class="d-flex mb-4">
                <v-text-field
                  v-model="searchQuery"
                  label="Поиск по названию или тегу"
                  prepend-inner-icon="mdi-magnify"
                  variant="outlined"
                  clearable
                  hide-details
                  class="flex-grow-1"
                ></v-text-field>
                <v-btn
                  color="primary"
                  class="ml-4"
                  @click="isServiceFormVisible = true"
                  height="56"
                >
                  <v-icon>mdi-plus</v-icon>
                </v-btn>
              </div>
            </v-col>
          </v-row>

          <v-list lines="two" select-strategy="classic">
            <v-list-item
              v-for="service in filteredServices"
              :key="service.id"
              :value="service.id"
              @click="toggleService(service)"
            >
              <template v-slot:prepend="{ isSelected: isSlotSelected }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isSelected(service)"></v-checkbox-btn>
                </v-list-item-action>
              </template>

              <v-list-item-title>{{ service.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <div class="tags-container">
                  <v-chip
                    v-for="tag in getTags(service.tagIds)"
                    :key="tag.id"
                    :color="tag.color"
                    size="small"
                    class="mr-1"
                  >
                    {{ tag.name }}
                  </v-chip>
                </div>
              </v-list-item-subtitle>

              <template v-slot:append>
                <span class="text-body-1 font-weight-medium">
                  {{ service.defaultPrice }} ₽
                </span>
              </template>
            </v-list-item>
          </v-list>
        </v-container>
      </v-card-text>
    </v-card>
  </v-dialog>
  <ServiceFormDialog
    v-model="isServiceFormVisible"
    @saved="serviceStore.loadServices()"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Fuse from 'fuse.js';
import { useServiceStore } from '@/stores/serviceStore';
import { useTagsStore } from '@/stores/tagsStore';
import ServiceFormDialog from './ServiceFormDialog.vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  previouslySelected: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'selection-confirmed']);

const serviceStore = useServiceStore();
const tagsStore = useTagsStore();
const dialog = ref(props.modelValue);
const searchQuery = ref('');
const selected = ref([]);
const isServiceFormVisible = ref(false);

const availableServices = computed(() => {
  return serviceStore.services.map(service => ({
    ...service,
    tagNames: getTags(service.tagIds).map(t => t.name)
  }));
});

const fuse = computed(() => {
  return new Fuse(availableServices.value, {
    keys: ['name', 'tagNames'],
    threshold: 0.3,
  });
});

const filteredServices = computed(() => {
  if (!searchQuery.value) {
    return availableServices.value;
  }
  return fuse.value.search(searchQuery.value).map(result => result.item);
});

const isSelected = (service) => {
  return selected.value.some(s => s.id === service.id);
};

const getTags = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.tags.find(t => t.id === id)).filter(Boolean);
};

const toggleService = (service) => {
  const index = selected.value.findIndex(s => s.id === service.id);
  if (index > -1) {
    selected.value.splice(index, 1);
  } else {
    selected.value.push({
      id: service.id,
      name: service.name,
      price: service.defaultPrice,
      status: 'accepted',
      icon: service.icon || '',
      tagIds: service.tagIds || []
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
    // When opening, sync selection with what's already on the form
    selected.value = JSON.parse(JSON.stringify(props.previouslySelected));
  }
});

watch(dialog, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false);
  }
});

// Load services and tags if not already loaded
if (serviceStore.services.length === 0) {
  serviceStore.loadServices();
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