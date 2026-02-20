<!-- src/views/BaseSettingsView.vue -->
<template>
  <AppPage class="bs-page" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- Только вкладки -->
    <AppCard class="bs-surface-card bs-tabs-card">
      <v-tabs v-model="activeTab" bg-color="transparent" color="primary" grow density="comfortable" class="bs-tabs">
        <v-tab value="services" :style="uiTabStyle">Услуги</v-tab>
        <v-tab value="details" :style="uiTabStyle">Детали</v-tab>
      </v-tabs>
    </AppCard>

    <!-- УСЛУГИ -->
    <AppCard v-show="activeTab === 'services'" class="bs-surface-card bs-panel-card">
      <div class="bs-toolbar">
        <div class="bs-switch-pad">
          <v-switch
            :model-value="showArchivedServices"
            label="Показать архив"
            color="primary"
            hide-details
            density="compact"
            @update:model-value="onToggleShowArchivedServices"
          />
        </div>

        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openServiceDialog()">
          Добавить
        </v-btn>
      </div>

      <div v-if="servicesLoading" class="center py">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else>
        <AppEmptyState
          v-if="!displayedServices.length"
          icon="mdi-wrench"
          title="Услуг пока нет"
          description="Добавьте услугу, чтобы быстрее собирать заказ"
          action-text="Добавить услугу"
          @action="openServiceDialog()"
        />

        <v-list v-else bg-color="transparent" class="pa-0">
          <template v-for="(service, idx) in displayedServices" :key="service.id">
            <v-list-item lines="two" class="bs-item" density="comfortable">
              <template #prepend>
                <v-icon icon="mdi-wrench" size="20" style="opacity: 0.85;" />
              </template>

              <v-list-item-title class="font-weight-bold" :style="{ fontSize: textMain }">
                {{ service.name }}
              </v-list-item-title>

              <v-list-item-subtitle :style="{ fontSize: textCaption }">
                {{ formatPrice(service.defaultPrice) }}
                <span v-if="service.isArchived" class="arch">(архив)</span>
              </v-list-item-subtitle>

              <template #append>
                <div class="row" :style="{ gap: actionGap }">
                  <v-btn
                    class="bs-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    @click="openServiceDialog(service)"
                  >
                    <v-icon :size="actionIconSize" icon="mdi-pencil" />
                  </v-btn>

                  <v-btn
                    class="bs-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    :color="service.isArchived ? 'primary' : 'warning'"
                    @click="toggleServiceArchive(service)"
                  >
                    <v-icon
                      :size="actionIconSize"
                      :icon="service.isArchived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
                    />
                  </v-btn>

                  <v-btn
                    class="bs-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    color="error"
                    @click="deleteService(service)"
                  >
                    <v-icon :size="actionIconSize" icon="mdi-delete" />
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider v-if="idx < displayedServices.length - 1" class="bs-divider" />
          </template>
        </v-list>
      </div>

      <ServiceFormDialog v-model="showServiceDialog" :service="selectedService" @saved="onServiceSaved" />
    </AppCard>

    <!-- ДЕТАЛИ -->
    <AppCard v-show="activeTab === 'details'" class="bs-surface-card bs-panel-card">
      <div class="bs-toolbar">
        <div class="bs-switch-pad">
          <v-switch
            :model-value="showArchivedDetails"
            label="Показать архив"
            color="primary"
            hide-details
            density="compact"
            @update:model-value="onToggleShowArchivedDetails"
          />
        </div>

        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openDetailDialog()">
          Добавить
        </v-btn>
      </div>

      <div v-if="detailsLoading" class="center py">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else>
        <AppEmptyState
          v-if="!displayedDetails.length"
          icon="mdi-tag-outline"
          title="Деталей пока нет"
          description="Добавьте деталь, чтобы быстро подставлять в заказ"
          action-text="Добавить деталь"
          @action="openDetailDialog()"
        />

        <v-list v-else bg-color="transparent" class="pa-0">
          <template v-for="(d, idx) in displayedDetails" :key="d.id">
            <v-list-item lines="two" class="bs-item" density="comfortable">
              <template #prepend>
                <v-icon icon="mdi-tag-outline" size="20" style="opacity: 0.85;" />
              </template>

              <v-list-item-title class="font-weight-bold" :style="{ fontSize: textMain }">
                {{ d.name }}
              </v-list-item-title>

              <v-list-item-subtitle :style="{ fontSize: textCaption }">
                {{ formatPrice(d.defaultPrice) }}
                <span v-if="d.isArchived" class="arch">(архив)</span>
              </v-list-item-subtitle>

              <template #append>
                <div class="row" :style="{ gap: actionGap }">
                  <v-btn class="bs-action-btn" variant="text" icon :style="actionBtnStyle" @click="openDetailDialog(d)">
                    <v-icon :size="actionIconSize" icon="mdi-pencil" />
                  </v-btn>

                  <v-btn
                    class="bs-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    :color="d.isArchived ? 'primary' : 'warning'"
                    @click="toggleDetailArchive(d)"
                  >
                    <v-icon
                      :size="actionIconSize"
                      :icon="d.isArchived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
                    />
                  </v-btn>

                  <v-btn class="bs-action-btn" variant="text" icon :style="actionBtnStyle" color="error" @click="deleteDetail(d)">
                    <v-icon :size="actionIconSize" icon="mdi-delete" />
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider v-if="idx < displayedDetails.length - 1" class="bs-divider" />
          </template>
        </v-list>
      </div>

      <DetailFormDialog v-model="showDetailDialog" :detail="selectedDetail" @saved="onDetailSaved" />
    </AppCard>
  </AppPage>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

import { useSettingsStore } from '@/stores/settingsStore';
import { useServicesStore } from '@/stores/servicesStore';
import { useDetailsStore } from '@/stores/detailsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

import { useHapticFeedback } from '@/composables/useHapticFeedback';

import ServiceFormDialog from '@/components/ServiceFormDialog.vue';
import DetailFormDialog from '@/components/DetailFormDialog.vue';

import AppPage from '@/components/ui/AppPage.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const { triggerHapticFeedback } = useHapticFeedback();

const settingsStore = useSettingsStore();
const servicesStore = useServicesStore();
const detailsStore = useDetailsStore();
const confirmationStore = useConfirmationStore();

const route = useRoute();
const activeTab = ref(route.params?.tab || 'services');

const showArchivedServices = ref(false);
const showArchivedDetails = ref(false);

const showServiceDialog = ref(false);
const selectedService = ref(null);

const showDetailDialog = ref(false);
const selectedDetail = ref(null);

const servicesLoading = computed(() => servicesStore.loading);
const detailsLoading = computed(() => detailsStore.loading);

const services = computed(() => servicesStore.services || []);
const details = computed(() => detailsStore.details || []);

// ===== font logic (как в SettingsView): всегда берём fontSize, fallback на baseFontSize
const appSettings = computed(() => settingsStore.settings?.appSettings ?? {});

const getByPath = (obj, path) => {
  if (!obj) return undefined;
  const parts = String(path || '').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
};

const getAppSetting = (key, fallback) => {
  const v = getByPath(appSettings.value, key);
  return v === undefined || v === null || v === '' ? fallback : v;
};

const baseFontSize = computed(() => {
  const n = Number(getAppSetting('baseFontSize', 16));
  return Number.isFinite(n) && n > 0 ? n : 16;
});

const fontSize = computed(() => {
  const saved = getAppSetting('fontSize');
  const n = Number(saved);
  if (saved !== undefined && saved !== null && saved !== '' && Number.isFinite(n) && n > 0) return n;
  return baseFontSize.value;
});

const textMain = computed(() => `${fontSize.value}px`);
const textCaption = computed(() => `${Math.max(11, fontSize.value - 4)}px`);

// scale для иконок/тап-зон
const scale = computed(() => fontSize.value / 16);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const uiTabStyle = computed(() => ({ fontSize: textMain.value }));

const actionBtnPx = computed(() => clamp(Math.round(34 * scale.value), 32, 48));
const actionIconSize = computed(() => clamp(Math.round(20 * scale.value), 18, 28));
const actionBtnStyle = computed(() => ({
  width: `${actionBtnPx.value}px`,
  height: `${actionBtnPx.value}px`,
  minWidth: `${actionBtnPx.value}px`,
}));
const actionGap = computed(() => `${clamp(Math.round(8 * scale.value), 6, 14)}px`);

// tab haptic
watch(activeTab, (v, prev) => {
  if (v !== prev) triggerHapticFeedback('tap');
});

const onToggleShowArchivedServices = (v) => {
  showArchivedServices.value = !!v;
  triggerHapticFeedback('tap');
};

const onToggleShowArchivedDetails = (v) => {
  showArchivedDetails.value = !!v;
  triggerHapticFeedback('tap');
};

// swipe (2 вкладки)
const touch = { x: 0, y: 0 };

function onTouchStart(e) {
  const t = e?.touches?.[0];
  if (!t) return;
  touch.x = t.clientX;
  touch.y = t.clientY;
}

function onTouchEnd(e) {
  const t = e?.changedTouches?.[0];
  if (!t) return;

  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;

  if (Math.abs(dx) < 60) return;
  if (Math.abs(dx) < Math.abs(dy) * 1.6) return;

  if (dx < 0 && activeTab.value === 'services') activeTab.value = 'details';
  if (dx > 0 && activeTab.value === 'details') activeTab.value = 'services';
}

const displayedServices = computed(() => {
  const list = services.value;
  return showArchivedServices.value ? list : servicesStore.activeItems;
});

const displayedDetails = computed(() => {
  const list = details.value;
  const filtered = showArchivedDetails.value ? list : detailsStore.activeItems;
  return [...filtered].sort((a, b) => String(a?.name || '').localeCompare(String(b?.name || '')));
});

const formatPrice = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value || 0);

// ===== Services actions
const openServiceDialog = (service = null) => {
  triggerHapticFeedback('tap');
  selectedService.value = service;
  showServiceDialog.value = true;
};

const onServiceSaved = async () => {
  showServiceDialog.value = false;
};

const deleteService = async (service) => {
  triggerHapticFeedback('tap');
  const ok = await confirmationStore.open('Удаление', 'Удалить эту услугу?');
  if (!ok) return;

  // вибро сразу после подтверждения
  triggerHapticFeedback('tap');

  try {
    await servicesStore.deleteService(service.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};

const toggleServiceArchive = async (service) => {
  triggerHapticFeedback('tap');
  const action = service.isArchived ? 'восстановить' : 'архивировать';
  const ok = await confirmationStore.open('Изменение', `Вы действительно хотите ${action} услугу?`);
  if (!ok) return;

  // вибро сразу после подтверждения
  triggerHapticFeedback('tap');

  try {
    if (service.isArchived) await servicesStore.unarchiveService(service.id);
    else await servicesStore.archiveService(service.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};

// ===== Details actions
const openDetailDialog = (detail = null) => {
  triggerHapticFeedback('tap');
  selectedDetail.value = detail;
  showDetailDialog.value = true;
};

const onDetailSaved = () => {
  showDetailDialog.value = false;
  selectedDetail.value = null;
};

const toggleDetailArchive = async (detail) => {
  triggerHapticFeedback('tap');
  const action = detail.isArchived ? 'восстановить' : 'архивировать';
  const ok = await confirmationStore.open('Изменение', `Вы действительно хотите ${action} деталь?`);
  if (!ok) return;

  // вибро сразу после подтверждения
  triggerHapticFeedback('tap');

  try {
    if (detail.isArchived) await detailsStore.unarchiveDetail(detail.id);
    else await detailsStore.archiveDetail(detail.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};

const deleteDetail = async (detail) => {
  triggerHapticFeedback('tap');
  const ok = await confirmationStore.open('Удаление', 'Удалить эту деталь?');
  if (!ok) return;

  // вибро сразу после подтверждения
  triggerHapticFeedback('tap');

  try {
    await detailsStore.deleteDetail(detail.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};
</script>

<style scoped>
.bs-page { min-height: 100dvh; }

/* как в SettingsView: surface + outline + soft shadow */
.bs-surface-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.32) !important;
  box-shadow: var(--shadow-soft);
  color: rgb(var(--v-theme-on-background));
}

/* вкладки без лишнего паддинга */
.bs-tabs-card { padding: 0 !important; }

.bs-tabs :deep(.v-slide-group),
.bs-tabs :deep(.v-tabs-bar) {
  background: transparent !important;
}

.bs-tabs :deep(.v-tab) {
  text-transform: none;
  font-weight: 700;
}

/* контентная карточка — паддинг как в настройках */
.bs-panel-card { padding: var(--s-4, 1rem) !important; }

.bs-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3, 0.75rem);
  margin-bottom: var(--s-3, 0.75rem);
}

/* небольшой отступ слева у переключателя */
.bs-switch-pad { padding-left: var(--s-2, 0.5rem); }

.bs-item { padding: var(--s-2, 0.5rem) 0; }
.bs-divider { opacity: 0.55; }

.row { display: flex; }

.center { display: grid; place-items: center; }
.py { padding: var(--s-5, 1.25rem) 0; }

.arch { margin-inline-start: var(--s-2, 0.5rem); opacity: 0.75; }

.bs-action-btn { padding: 0 !important; }
</style>