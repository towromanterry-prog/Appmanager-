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
              v-for="service in filteredServices"
              :key="service.id"
              :value="service.id"
              @click="toggleService(service)"
            >
              <template v-slot:prepend="{ isSelected }">
                <v-list-item-action start>
                  <v-checkbox-btn :model-value="isSelected"></v-checkbox-btn>
                </v-list-item-action>
              </template>

              <v-list-item-title>{{ service.name }}</v-list-item-title>
              <v-list-item-subtitle>
                <v-chip
                  v-for="tag in service.tags"
                  :key="tag"
                  size="x-small"
                  class="mr-1"
                >
                  {{ tag }}
                </v-chip>
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
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useServiceStore } from '@/stores/serviceStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  previouslySelected: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue', 'selection-confirmed']);

const serviceStore = useServiceStore();
const dialog = ref(props.modelValue);
const searchQuery = ref('');
const selected = ref([]);

const availableServices = computed(() => serviceStore.services);

const filteredServices = computed(() => {
  if (!searchQuery.value) {
    return availableServices.value;
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return availableServices.value.filter(service =>
    service.name.toLowerCase().includes(lowerCaseQuery) ||
    (service.tags && service.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
  );
});

const isSelected = (service) => {
  return selected.value.some(s => s.id === service.id);
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
      icon: service.icon || ''
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

// Load services if not already loaded
if (serviceStore.services.length === 0) {
  serviceStore.loadServices();
}
</script>

<style scoped>
.v-list-item-subtitle .v-chip {
  margin-top: 4px;
}
</style>