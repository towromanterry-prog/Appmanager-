<template>
  <v-card variant="outlined" class="pa-4">
    <div v-if="selectedServices.length > 0">
      <div v-for="(service, index) in selectedServices" :key="index" class="service-item">
        <v-icon v-if="service.icon" class="mr-3 text-medium-emphasis">{{ service.icon }}</v-icon>
        <div class="flex-grow-1">
          <div class="text-body-2">{{ service.name }}</div>
        </div>
        <v-text-field
          v-model.number="service.price"
          type="number"
          variant="outlined"
          density="compact"
          prefix="₽"
          hide-details
          class="price-field"
        ></v-text-field>
        <v-btn
          icon="mdi-delete-outline"
          variant="text"
          color="grey"
          @click="removeService(index)"
        ></v-btn>
      </div>
      <v-divider class="my-3"></v-divider>
    </div>

    <div ref="searchContainer" :class="{ 'compact-margin': isCompactView }">
      <div class="d-flex align-center mb-3">
        <v-text-field
          ref="searchInputField"
          v-model="searchQuery"
          label="Найти или добавить услугу..."
          variant="outlined"
          clearable
          hide-details="auto"
          class="flex-grow-1"
          @focus="openList"
        ></v-text-field>
        <v-btn
          :icon="isListVisible ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          variant="text"
          @click="toggleList"
          class="ml-2"
        ></v-btn>
      </div>

      <v-expand-transition>
        <div v-show="isListVisible">
          <div class="d-flex flex-wrap gap-2">
            <v-chip
              v-for="service in filteredServices"
              :key="service.id"
              size="small"
              variant="outlined"
              @click="addService(service)"
            >
              <v-icon v-if="service.icon" start size="16">{{ service.icon }}</v-icon>
              {{ service.name }}
            </v-chip>
          </div>
        </div>
      </v-expand-transition>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useServiceStore } from '@/stores/serviceStore';

const serviceStore = useServiceStore();

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
});
const emit = defineEmits(['update:modelValue']);

const searchContainer = ref(null);
const searchInputField = ref(null);
const isListVisible = ref(false);

const selectedServices = ref([...props.modelValue]);
const searchQuery = ref('');

// ИЗМЕНЕНИЕ 2: Новое вычисляемое свойство для компактного вида
const isCompactView = computed(() => {
  return !isListVisible.value && selectedServices.value.length === 0;
});

const availableServices = computed(() => {
  const selectedIds = selectedServices.value.map(s => s.id);
  return serviceStore.services.filter(s => !selectedIds.includes(s.id));
});

const filteredServices = computed(() => {
  if (!searchQuery.value || searchQuery.value.trim() === '') {
    return availableServices.value;
  }
  const lowerCaseQuery = searchQuery.value.toLowerCase();
  return availableServices.value.filter(service =>
    service.name.toLowerCase().includes(lowerCaseQuery)
  );
});

const addService = (service) => {
  if (service) {
    selectedServices.value.push({
      id: service.id,
      name: service.name,
      price: service.defaultPrice,
      status: 'in_progress',
      icon: service.icon || ''
    });
    updateParent();
    searchInputField.value?.focus();
  }
};

const removeService = (index) => {
  selectedServices.value.splice(index, 1);
  updateParent();
};

const updateParent = () => {
  emit('update:modelValue', selectedServices.value);
};

const toggleList = () => {
  isListVisible.value = !isListVisible.value;
};
const openList = () => {
  if (!isListVisible.value) {
    isListVisible.value = true;
  }
};

const scrollToSearch = () => {
  nextTick(() => {
    searchContainer.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
};

watch(searchQuery, (newValue) => {
  if (newValue && !isListVisible.value) {
    isListVisible.value = true;
  }
});

watch(isListVisible, (newValue) => {
  if (newValue) {
    scrollToSearch();
  }
});

watch(() => props.modelValue, (newValue) => {
  selectedServices.value = [...newValue];
}, { deep: true });

onMounted(() => {
  if (serviceStore.services.length === 0) {
    serviceStore.loadServices();
  }
});
</script>

<style scoped>
.service-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}
.price-field {
  max-width: 120px;
}
.gap-2 {
  gap: 8px;
}

.v-expand-transition-enter-active,
.v-expand-transition-leave-active {
  transition: height 150ms ease;
}

/* ИЗМЕНЕНИЕ 3: Новый CSS-класс для отрицательного отступа */
.compact-margin {
  margin-bottom: -12px;
}
</style>
