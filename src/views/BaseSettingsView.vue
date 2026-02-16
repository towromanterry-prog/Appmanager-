<template>
  <AppPage title="Справочники">
    <AppSection>
      <AppCard>
        <v-tabs
          v-model="activeTab"
          bg-color="transparent"
          color="primary"
          grow
          density="comfortable"
          class="tabs"
        >
          <v-tab value="services">Услуги</v-tab>
          <v-tab value="details">Детали</v-tab>
        </v-tabs>
      </AppCard>
    </AppSection>

    <v-window v-model="activeTab" class="window">
      <!-- SERVICES -->
      <v-window-item value="services">
        <AppSection title="Услуги">
          <AppCard>
            <div class="row space-between align-center gap-sm mb">
              <v-switch
                v-model="showArchivedServices"
                label="Показать архив"
                color="primary"
                hide-details
                density="compact"
              />
              <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openServiceDialog()">
                Добавить
              </v-btn>
            </div>

            <div v-if="servicesLoading" class="center py">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <v-list v-else bg-color="transparent" class="pa-0">
              <template v-for="service in displayedServices" :key="service.id">
                <v-card class="mb-3" flat border>
                  <v-list-item lines="two" class="py-2">
                    <template #prepend>
                      <v-avatar color="primary-lighten-4" class="mr-3">
                        <v-icon icon="mdi-wrench" />
                      </v-avatar>
                    </template>

                    <v-list-item-title class="text-body-2 font-weight-bold">
                      {{ service.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ formatPrice(service.price) }}
                      <span v-if="service.isArchived" class="ml-2 muted">(архив)</span>
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="row gap-sm">
                        <v-btn
                          size="x-small"
                          variant="text"
                          icon="mdi-pencil"
                          @click="openServiceDialog(service)"
                        />
                        <v-btn
                          size="x-small"
                          variant="text"
                          :color="service.isArchived ? 'primary' : 'warning'"
                          :icon="service.isArchived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
                          @click="toggleServiceArchive(service)"
                        />
                      </div>
                    </template>
                  </v-list-item>
                </v-card>
              </template>
            </v-list>
          </AppCard>
        </AppSection>

        <ServiceFormDialog
          v-model="showServiceDialog"
          :service="selectedService"
          @saved="onServiceSaved"
        />
      </v-window-item>

      <!-- DETAILS -->
      <v-window-item value="details">
        <AppSection title="Детали">
          <AppCard>
            <div class="row space-between align-center gap-sm mb">
              <div class="muted text-xs">Группировка по категориям</div>
              <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openDetailDialog()">
                Добавить
              </v-btn>
            </div>

            <div v-if="detailsLoading" class="center py">
              <v-progress-circular indeterminate color="primary" />
            </div>

            <div v-else class="stack">
              <div v-for="(items, cat) in groupedDetails" :key="cat">
                <div class="text-sm font-semibold mb-2">{{ cat }}</div>

                <v-card v-for="d in items" :key="d.id" class="mb-2" flat border>
                  <v-list-item class="py-2">
                    <v-list-item-title class="text-body-2 font-weight-bold">
                      {{ d.name }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-caption">
                      {{ formatPrice(d.defaultPrice) }}
                    </v-list-item-subtitle>

                    <template #append>
                      <div class="row gap-sm">
                        <v-btn size="x-small" variant="text" icon="mdi-pencil" @click="openDetailDialog(d)" />
                        <v-btn
                          size="x-small"
                          variant="text"
                          color="error"
                          icon="mdi-delete"
                          @click="deleteDetail(d)"
                        />
                      </div>
                    </template>
                  </v-list-item>
                </v-card>
              </div>
            </div>

            <!-- Detail dialog (оставил на вашей логике) -->
            <v-dialog v-model="showDetailDialog" max-width="560">
              <v-card>
                <v-card-title class="text-h6">
                  {{ selectedDetail ? 'Редактировать деталь' : 'Новая деталь' }}
                </v-card-title>
                <v-card-text>
                  <div class="stack">
                    <v-text-field
                      v-model="detailForm.name"
                      label="Название"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <v-combobox
                      v-model="detailForm.category"
                      :items="categoryOptions"
                      label="Категория"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                    <v-text-field
                      v-model.number="detailForm.defaultPrice"
                      label="Цена по умолчанию"
                      type="number"
                      variant="outlined"
                      density="compact"
                      hide-details
                    />
                  </div>
                </v-card-text>
                <v-card-actions class="px-4 pb-4">
                  <v-spacer />
                  <v-btn variant="text" @click="showDetailDialog = false">Отмена</v-btn>
                  <v-btn color="primary" @click="saveDetail">Сохранить</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </AppCard>
        </AppSection>
      </v-window-item>
    </v-window>
  </AppPage>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRoute } from 'vue-router';

import { useServicesStore } from '@/stores/servicesStore';
import { useDetailsStore } from '@/stores/detailsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

import ServiceFormDialog from '@/components/ServiceFormDialog.vue';

// UI primitives
import AppPage from '@/components/ui/AppPage.vue';
import AppSection from '@/components/ui/AppSection.vue';
import AppCard from '@/components/ui/AppCard.vue';

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
  const ok = await confirmationStore.open('Изменение', `Вы действительно хотите ${action} услугу?`);
  if (!ok) return;

  await servicesStore.update(service.id, { isArchived: !service.isArchived });
};

// --- Details
const openDetailDialog = (detail = null) => {
  selectedDetail.value = detail;
  detailForm.name = detail?.name || '';
  detailForm.category = detail?.category || '';
  detailForm.defaultPrice = Number(detail?.defaultPrice || 0);
  showDetailDialog.value = true;
};

const saveDetail = async () => {
  const payload = {
    name: String(detailForm.name || '').trim(),
    category: String(detailForm.category || '').trim(),
    defaultPrice: Number(detailForm.defaultPrice || 0),
  };

  if (!payload.name) return;

  if (selectedDetail.value) {
    await detailsStore.update(selectedDetail.value.id, payload);
  } else {
    await detailsStore.add(payload);
  }

  showDetailDialog.value = false;
  selectedDetail.value = null;
};

const deleteDetail = async (detail) => {
  const ok = await confirmationStore.open('Удаление', 'Удалить эту деталь?');
  if (!ok) return;
  await detailsStore.remove(detail.id);
};

onMounted(() => {
  // если нужно — можно синхронизировать таб с роутом
});
onUnmounted(() => {});
</script>

<style scoped>
.window { padding-bottom: var(--s-6, 1.5rem); }
.tabs { border-bottom: 1px solid rgba(0,0,0,0.06); }
.stack { display: grid; gap: var(--s-3, 0.75rem); }
.row { display: flex; }
.gap-sm { gap: var(--s-2, 0.5rem); }
.align-center { align-items: center; }
.space-between { justify-content: space-between; }
.flex-1 { flex: 1; }
.mb { margin-bottom: var(--s-3, 0.75rem); }
.mb-2 { margin-bottom: var(--s-2, 0.5rem); }
.muted { opacity: 0.75; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.font-semibold { font-weight: 600; }
.center { display: grid; place-items: center; }
.py { padding: var(--s-5, 1.25rem) 0; }
</style>
