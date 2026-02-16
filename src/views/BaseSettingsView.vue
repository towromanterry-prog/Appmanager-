<template>
  <div class="base-settings-view fill-height d-flex flex-column">
    <v-tabs v-model="activeTab" bg-color="surface" color="primary" grow density="comfortable" class="border-b">
      <v-tab value="services">Услуги</v-tab>
      <v-tab value="details">Детали</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="flex-grow-1 overflow-y-auto">
      <!-- SERVICES -->
      <v-window-item value="services" class="fill-height">
        <div class="pa-4 pb-16">
          <div class="d-flex justify-end mb-2">
            <v-switch v-model="showArchivedServices" label="Показать архив" color="primary" hide-details density="compact" />
          </div>

          <div v-if="servicesLoading" class="text-center mt-4">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-list v-else bg-color="transparent" class="pa-0">
            <template v-for="service in displayedServices" :key="service.id">
              <v-card class="mb-3" flat border>
                <v-list-item lines="two" class="py-2">
                  <template #prepend>
                    <v-avatar color="primary-lighten-4" class="text-primary font-weight-bold">
                      {{ (service.name || '?')[0].toUpperCase() }}
                    </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold">
                    {{ service.name }}
                  </v-list-item-title>

                  <v-list-item-subtitle class="mt-1">
                    <span class="text-body-2 text-high-emphasis font-weight-medium">
                      {{ formatPrice(service.defaultPrice) }}
                    </span>
                  </v-list-item-subtitle>

                  <template #append>
                    <v-menu location="bottom end">
                      <template #activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props" />
                      </template>
                      <v-list>
                        <v-list-item @click="openServiceDialog(service)" prepend-icon="mdi-pencil">
                          Редактировать
                        </v-list-item>

                        <v-list-item
                          v-if="!service.isArchived"
                          @click="toggleServiceArchive(service)"
                          prepend-icon="mdi-archive-arrow-down"
                          color="warning"
                        >
                          В архив
                        </v-list-item>

                        <v-list-item
                          v-else
                          @click="toggleServiceArchive(service)"
                          prepend-icon="mdi-archive-arrow-up"
                          color="success"
                        >
                          Вернуть
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
              </v-card>
            </template>

            <div v-if="!displayedServices.length" class="text-center text-medium-emphasis mt-8">
              {{ showArchivedServices ? 'Архив пуст' : 'Список услуг пуст' }}
            </div>
          </v-list>
        </div>
      </v-window-item>

      <!-- DETAILS -->
      <v-window-item value="details" class="fill-height">
        <div class="pa-4 pb-16">
          <div v-if="detailsLoading" class="text-center mt-4">
            <v-progress-circular indeterminate color="primary" />
          </div>

          <v-list v-else bg-color="transparent" class="pa-0">
            <template v-for="(categoryDetails, category) in groupedDetails" :key="category">
              <v-list-subheader class="font-weight-bold text-uppercase text-primary mt-2">
                {{ category || 'Общие' }}
              </v-list-subheader>

              <v-card v-for="detail in categoryDetails" :key="detail.id" class="mb-2" flat border>
                <v-list-item density="comfortable">
                  <v-list-item-title class="font-weight-medium">{{ detail.name }}</v-list-item-title>
                  <v-list-item-subtitle>
                    Цена: {{ formatPrice(detail.defaultPrice) }}
                  </v-list-item-subtitle>

                  <template #append>
                    <v-btn icon="mdi-pencil" variant="text" size="small" color="medium-emphasis" @click="openDetailDialog(detail)" />
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteDetail(detail)" />
                  </template>
                </v-list-item>
              </v-card>
            </template>

            <div v-if="!details.length" class="text-center text-medium-emphasis mt-8">
              Список деталей пуст
            </div>
          </v-list>
        </div>
      </v-window-item>

    </v-window>

    <v-fab-transition>
      <v-btn
        position="fixed"
        location="bottom right"
        icon="mdi-plus"
        size="x-large"
        color="primary"
        elevation="4"
        class="mb-4 mr-4"
        style="bottom: 80px; z-index: 90;"
        @click="handleFabClick"
      />
    </v-fab-transition>

    <ServiceFormDialog v-model="showServiceDialog" :service="selectedService" @saved="onServiceSaved" />

    <v-dialog v-model="showDetailDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="px-4 pt-4">
          {{ selectedDetail ? 'Редактировать деталь' : 'Новая деталь' }}
        </v-card-title>

        <v-card-text class="px-4 py-2">
          <v-text-field v-model="detailForm.name" label="Название" variant="outlined" density="comfortable" class="mb-3" />
          <v-combobox v-model="detailForm.category" :items="categoryOptions" label="Категория" variant="outlined" density="comfortable" class="mb-3" />
          <v-text-field v-model.number="detailForm.defaultPrice" label="Цена" type="number" variant="outlined" density="comfortable" prefix="₽" />
        </v-card-text>

        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="showDetailDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" @click="saveDetail">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useServicesStore } from '@/stores/servicesStore';
import { useDetailsStore } from '@/stores/detailsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

import ServiceFormDialog from '@/components/ServiceFormDialog.vue';

const servicesStore = useServicesStore();
const detailsStore = useDetailsStore();
const confirmationStore = useConfirmationStore();

const route = useRoute();

const activeTab = ref(route.params.tab || 'services');
const showArchivedServices = ref(false);

const showServiceDialog = ref(false);
const selectedService = ref(null);

const showDetailDialog = ref(false);
const selectedDetail = ref(null);
const detailForm = reactive({
  name: '',
  category: '',
  defaultPrice: 0,
});


const servicesLoading = computed(() => servicesStore.loading);
const detailsLoading = computed(() => detailsStore.loading);

const services = computed(() => servicesStore.services || []);
const details = computed(() => detailsStore.details || []);

const displayedServices = computed(() => {
  const list = services.value;
  return showArchivedServices.value ? list.filter((s) => !!s.isArchived) : servicesStore.activeItems;
});

const groupedDetails = computed(() => {
  const groups = {};
  details.value.forEach((d) => {
    const cat = d.category || 'Прочее';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(d);
  });
  return groups;
});

const categoryOptions = computed(() => {
  const set = new Set(details.value.map((d) => d.category).filter(Boolean));
  return Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
});

const formatPrice = (value) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value || 0);

// --- Services
const openServiceDialog = (service = null) => {
  selectedService.value = service;
  showServiceDialog.value = true;
};

const onServiceSaved = async () => {
  showServiceDialog.value = false;
};

const toggleServiceArchive = async (service) => {
  const action = service.isArchived ? 'восстановить' : 'архивировать';
  const ok = await confirmationStore.open('Изменение статуса', `Вы уверены, что хотите ${action} услугу "${service.name}"?`);
  if (!ok) return;

  if (service.isArchived) await servicesStore.unarchiveService(service.id);
  else await servicesStore.archiveService(service.id);
};

// --- Details
const openDetailDialog = (detail = null) => {
  if (detail) {
    selectedDetail.value = detail;
    detailForm.name = detail.name || '';
    detailForm.category = detail.category || '';
    detailForm.defaultPrice = Number(detail.defaultPrice) || 0;
  } else {
    selectedDetail.value = null;
    detailForm.name = '';
    detailForm.category = '';
    detailForm.defaultPrice = 0;
  }
  showDetailDialog.value = true;
};

const saveDetail = async () => {
  if (!detailForm.name.trim()) return;

  if (selectedDetail.value) {
    await detailsStore.updateDetail(selectedDetail.value.id, {
      name: detailForm.name,
      category: detailForm.category,
      defaultPrice: detailForm.defaultPrice,
    });
  } else {
    await detailsStore.addDetail({
      name: detailForm.name,
      category: detailForm.category,
      defaultPrice: detailForm.defaultPrice,
    });
  }

  showDetailDialog.value = false;
};

const deleteDetail = async (detail) => {
  const ok = await confirmationStore.open('Удаление детали', `Вы уверены, что хотите удалить деталь "${detail.name}"?`);
  if (!ok) return;
  await detailsStore.deleteDetail(detail.id);
};

// --- Common
const handleFabClick = () => {
  if (activeTab.value === 'services') openServiceDialog();
  else if (activeTab.value === 'details') openDetailDialog();
};

onMounted(async () => {
  await servicesStore.subscribe();
  await detailsStore.subscribe();
});

onUnmounted(() => {
  servicesStore.stop();
  detailsStore.stop();
});
</script>

<style scoped>
.gap-2 { gap: 8px; }
</style>