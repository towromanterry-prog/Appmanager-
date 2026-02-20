<!-- src/views/ClientView.vue -->
<template>
  <AppPage class="cv-page">
    <AppCard class="cv-surface-card cv-panel-card">
      <div class="cv-toolbar">
        <div class="cv-switch-pad">
          <v-switch
            :model-value="showArchived"
            label="Показать архив"
            color="primary"
            hide-details
            density="compact"
            @update:model-value="onToggleShowArchived"
          />
        </div>

        <v-btn color="primary" size="small" prepend-icon="mdi-plus" @click="openClientDialog()">
          Добавить
        </v-btn>
      </div>

      <div v-if="clientsLoading" class="center py">
        <v-progress-circular indeterminate color="primary" />
      </div>

      <div v-else>
        <AppEmptyState
          v-if="!displayedClients.length"
          icon="mdi-account-group-outline"
          title="Клиентов пока нет"
          description="Добавьте клиента, чтобы быстрее оформлять заказы"
          action-text="Добавить клиента"
          @action="openClientDialog()"
        />

        <v-list v-else bg-color="transparent" class="pa-0">
          <template v-for="(c, idx) in displayedClients" :key="c.id">
            <v-list-item lines="two" class="cv-item" density="comfortable">
              <template #prepend>
                <v-icon icon="mdi-account-outline" size="20" style="opacity: 0.85;" />
              </template>

              <v-list-item-title class="font-weight-bold text-truncate" :style="{ fontSize: textMain }">
                {{ formatClientName(c) }}
              </v-list-item-title>

              <v-list-item-subtitle class="text-truncate" :style="{ fontSize: textCaption }">
                <span v-if="c.phone">{{ c.phone }}</span>
                <span v-if="c.phone && c.lastOrderDate"> · </span>
                <span v-if="c.lastOrderDate">последний заказ: {{ formatDate(c.lastOrderDate) }}</span>
                <span v-if="c.isArchived" class="arch">(архив)</span>
              </v-list-item-subtitle>

              <template #append>
                <div class="row" :style="{ gap: actionGap }">
                  <v-btn
                    class="cv-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    @click="openClientDialog(c)"
                  >
                    <v-icon :size="actionIconSize" icon="mdi-pencil" />
                  </v-btn>

                  <v-btn
                    class="cv-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    :color="c.isArchived ? 'primary' : 'warning'"
                    @click="toggleClientArchive(c)"
                  >
                    <v-icon
                      :size="actionIconSize"
                      :icon="c.isArchived ? 'mdi-archive-arrow-up' : 'mdi-archive'"
                    />
                  </v-btn>

                  <v-btn
                    class="cv-action-btn"
                    variant="text"
                    icon
                    :style="actionBtnStyle"
                    color="error"
                    @click="deleteClient(c)"
                  >
                    <v-icon :size="actionIconSize" icon="mdi-delete" />
                  </v-btn>
                </div>
              </template>
            </v-list-item>

            <v-divider v-if="idx < displayedClients.length - 1" class="cv-divider" />
          </template>
        </v-list>
      </div>

      <ClientFormDialog v-model="showClientDialog" :client="selectedClient" @saved="onClientSaved" />
    </AppCard>
  </AppPage>
</template>

<script setup>
import { ref, computed } from 'vue';

import { useSettingsStore } from '@/stores/settingsStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

import AppPage from '@/components/ui/AppPage.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

import ClientFormDialog from '@/components/ClientFormDialog.vue';

const { triggerHapticFeedback } = useHapticFeedback();

const settingsStore = useSettingsStore();
const clientsStore = useClientsStore();
const confirmationStore = useConfirmationStore();

const showArchived = ref(false);

const showClientDialog = ref(false);
const selectedClient = ref(null);

const clientsLoading = computed(() => clientsStore.loading);
const clients = computed(() => clientsStore.clients || []);

// ===== font logic (как в BaseSettingsView / SettingsView): fontSize с fallback на baseFontSize
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

// scale для иконок/тап-зон (кнопки действий)
const scale = computed(() => fontSize.value / 16);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const actionBtnPx = computed(() => clamp(Math.round(34 * scale.value), 32, 48));
const actionIconSize = computed(() => clamp(Math.round(20 * scale.value), 18, 28));
const actionBtnStyle = computed(() => ({
  width: `${actionBtnPx.value}px`,
  height: `${actionBtnPx.value}px`,
  minWidth: `${actionBtnPx.value}px`,
}));
const actionGap = computed(() => `${clamp(Math.round(8 * scale.value), 6, 14)}px`);

const displayedClients = computed(() => {
  const list = showArchived.value ? clients.value : clientsStore.activeItems;
  return [...(list || [])].sort((a, b) => new Date(b?.lastOrderDate || 0) - new Date(a?.lastOrderDate || 0));
});

const onToggleShowArchived = (v) => {
  showArchived.value = !!v;
  triggerHapticFeedback('tap');
};

const openClientDialog = (client = null) => {
  triggerHapticFeedback('tap');
  selectedClient.value = client;
  showClientDialog.value = true;
};

const onClientSaved = () => {
  showClientDialog.value = false;
  selectedClient.value = null;
};

const toggleClientArchive = async (client) => {
  triggerHapticFeedback('tap');
  const action = client.isArchived ? 'восстановить' : 'архивировать';
  const ok = await confirmationStore.open('Изменение', `Вы действительно хотите ${action} клиента?`);
  if (!ok) return;

  triggerHapticFeedback('tap');

  try {
    if (client.isArchived) await clientsStore.unarchiveClient(client.id);
    else await clientsStore.archiveClient(client.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};

const deleteClient = async (client) => {
  triggerHapticFeedback('tap');
  const ok = await confirmationStore.open('Удаление', 'Удалить этого клиента?');
  if (!ok) return;

  triggerHapticFeedback('tap');

  try {
    await clientsStore.deleteClient(client.id);
    triggerHapticFeedback('success');
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  }
};

const formatClientName = (c) => {
  const name = String(c?.name || '').trim();
  const last = String(c?.lastName || '').trim();
  const full = [name, last].filter(Boolean).join(' ');
  return full || 'Без имени';
};

const formatDate = (iso) => {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return '';
  return new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }).format(d);
};
</script>

<style scoped>
.cv-page { min-height: 100dvh; }

/* как в BaseSettingsView: surface + outline + soft shadow */
.cv-surface-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.32) !important;
  box-shadow: var(--shadow-soft);
  color: rgb(var(--v-theme-on-background));
}

/* паддинг как в настройках */
.cv-panel-card { padding: var(--s-4, 1rem) !important; }

.cv-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3, 0.75rem);
  margin-bottom: var(--s-3, 0.75rem);
}

/* небольшой отступ слева у переключателя */
.cv-switch-pad { padding-left: var(--s-2, 0.5rem); }

.cv-item { padding: var(--s-2, 0.5rem) 0; }
.cv-divider { opacity: 0.55; }

.row { display: flex; }

.center { display: grid; place-items: center; }
.py { padding: var(--s-5, 1.25rem) 0; }

.arch { margin-inline-start: var(--s-2, 0.5rem); opacity: 0.75; }

.cv-action-btn { padding: 0 !important; }
</style>