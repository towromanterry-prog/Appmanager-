<template>
  <v-app :theme="appTheme" class="app-root">
    <v-app-bar app color="surface" flat density="comfortable" class="app-bar-minimal">
      <div class="d-flex align-center px-4 w-100">
        <v-scale-transition mode="out-in">
          <div v-if="showSearch" class="d-flex align-center flex-grow-1 w-100">
            <v-text-field
              v-model="searchStore.searchQuery"
              placeholder="Поиск..."
              variant="plain"
              density="compact"
              hide-details
              autofocus
              class="search-input"
              clearable
              @click:clear="closeSearch"
            >
              <template v-slot:prepend-inner>
                <v-icon color="primary">mdi-magnify</v-icon>
              </template>
            </v-text-field>
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeSearch"></v-btn>
          </div>

          <div v-else class="d-flex align-center flex-grow-1 w-100">
            <span class="text-h6 font-weight-bold">{{ currentTitle }}</span>
            <v-spacer></v-spacer>

            <v-btn
              v-if="isSearchPage"
              icon="mdi-magnify"
              variant="text"
              @click="openSearch"
            ></v-btn>

            <v-menu
              v-if="showSortMenu"
              v-model="sortMenu"
              location="bottom end"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-sort-variant" variant="text" v-bind="props"></v-btn>
              </template>

              <v-card min-width="250" class="rounded-xl">
                <div v-if="isHomePage">
                  <v-list dense>
                    <v-list-subheader class="text-caption font-weight-bold">СТАТУС</v-list-subheader>
                    <v-list-item
                      v-for="status in availableStatuses"
                      :key="status.value"
                      @click="toggleStatusFilter(status.value)"
                      density="compact"
                    >
                      <template v-slot:prepend>
                        <v-checkbox-btn
                          :model-value="orderStore.filterStatus.includes(status.value)"
                        ></v-checkbox-btn>
                      </template>
                      <v-list-item-title class="text-body-2">{{ status.text }}</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </div>
              </v-card>
            </v-menu>
          </div>
        </v-scale-transition>
      </div>
    </v-app-bar>

    <v-main class="app-main">
      <router-view v-slot="{ Component }">
        <v-fade-transition mode="out-in">
          <component :is="Component" />
        </v-fade-transition>
      </router-view>
    </v-main>

    <v-bottom-navigation
      v-model="activeTab"
      bg-color="surface"
      color="primary"
      grow
      class="app-bottom-nav safe-area-fix"
      elevation="0"
    >
      <v-btn value="home" to="/">
        <v-icon>mdi-calendar-check-outline</v-icon>
        <span class="text-caption mt-1">Заказы</span>
      </v-btn>

      <v-btn value="clients" to="/clients">
        <v-icon>mdi-account-group-outline</v-icon>
        <span class="text-caption mt-1">Клиенты</span>
      </v-btn>

      <v-btn value="base-settings" to="/base-settings">
        <v-icon>mdi-database-outline</v-icon>
        <span class="text-caption mt-1">Справочники</span>
      </v-btn>

      <v-btn value="settings" to="/settings">
        <v-icon>mdi-tune</v-icon>
        <span class="text-caption mt-1">Меню</span>
      </v-btn>
    </v-bottom-navigation>

    <!-- ConfirmationDialog оставляем как есть (через confirmationStore) -->
    <ConfirmationDialog />

    <!-- Global toast / snackbar layer (queue) -->
    <v-snackbar
      v-model="snackbarOpen"
      :timeout="snackbarTimeout"
      :color="snackbarColor"
      location="bottom"
      variant="tonal"
      rounded="lg"
      class="app-toast"
    >
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" icon="mdi-close" @click="snackbarOpen = false" />
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { ref, computed, watch, provide, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';

// Auth
import { useAuthStore } from '@/stores/authStore';

// Stores
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSearchStore } from '@/stores/searchStore';

import { useClientsStore } from '@/stores/clientsStore';
import { useServicesStore } from '@/stores/servicesStore';
import { useDetailsStore } from '@/stores/detailsStore';
import { useTagsStore } from '@/stores/tagsStore';

// Components
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';

// init
const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const searchStore = useSearchStore();

const clientsStore = useClientsStore();
const servicesStore = useServicesStore();
const detailsStore = useDetailsStore();
const tagsStore = useTagsStore();

const route = useRoute();

// UI State
const activeTab = ref('home');
const sortMenu = ref(false);
const showSearch = ref(false);

// Theme strictly from settingsStore
const appTheme = computed(() => (settingsStore.theme === 'dark' ? 'dark' : 'light'));

// Навигация
const isHomePage = computed(() => route.name === 'home');
const isSearchPage = computed(() => ['home', 'clients', 'base-settings'].includes(route.name));
const showSortMenu = computed(() => isHomePage.value);

const currentTitle = computed(() => {
  if (route.name === 'home') return 'Мои заказы';
  if (route.name === 'clients') return 'Клиенты';
  if (route.name === 'order-edit') return 'Мои заказы';
  if (route.name === 'settings') return 'Настройки';
  if (route.name === 'base-settings') return 'Справочники';
  return '';
});

// Поиск
const openSearch = () => {
  showSearch.value = true;
};
const closeSearch = () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
};

watch(
  () => route.name,
  () => {
    showSearch.value = false;
    searchStore.setSearchQuery('');
  }
);

// Статусы для фильтра
const availableStatuses = computed(() => {
  const allStatuses = [
    { value: 'accepted', text: orderStore.getStatusText ? orderStore.getStatusText('accepted') : 'Принят' },
    { value: 'additional', text: orderStore.getStatusText ? orderStore.getStatusText('additional') : 'Доп.' },
    { value: 'in_progress', text: orderStore.getStatusText ? orderStore.getStatusText('in_progress') : 'В работе' },
    { value: 'completed', text: orderStore.getStatusText ? orderStore.getStatusText('completed') : 'Готов' },
    { value: 'delivered', text: orderStore.getStatusText ? orderStore.getStatusText('delivered') : 'Сдан' },
    { value: 'cancelled', text: orderStore.getStatusText ? orderStore.getStatusText('cancelled') : 'Отменен' },
  ];

  const cfg =
    settingsStore.settings?.orderStatuses ??
    settingsStore.appSettings?.orderStatuses ??
    null;

  return allStatuses.filter((s) => (cfg?.[s.value] ?? true));
});

const toggleStatusFilter = (statusValue) => {
  if (orderStore.toggleStatusFilter) {
    orderStore.toggleStatusFilter(statusValue);
  } else {
    const index = orderStore.filterStatus.indexOf(statusValue);
    if (index === -1) orderStore.filterStatus.push(statusValue);
    else orderStore.filterStatus.splice(index, 1);
  }
};

// 1) Font scale: --app-font-scale = fontSize / 16
watch(
  () => settingsStore.settings?.fontSize,
  (fontSize) => {
    const fs = Number(fontSize);
    if (!Number.isFinite(fs) || fs <= 0) return;

    const scale = fs / 16;
    if (scale > 0) {
      document.documentElement.style.setProperty('--app-font-scale', String(scale));
    }
  },
  { immediate: true },
);

// Синхронизация табов
watch(
  () => route.path,
  (newPath) => {
    if (newPath === '/' || newPath.startsWith('/order')) activeTab.value = 'home';
    else if (newPath.startsWith('/clients')) activeTab.value = 'clients';
    else if (newPath.startsWith('/base-settings')) activeTab.value = 'base-settings';
    else if (newPath.startsWith('/settings')) activeTab.value = 'settings';
  },
  { immediate: true }
);

// 3) User-scoped subscriptions after auth (без несуществующих методов)
let startedForUid = null;
let startPromise = null;

async function startUserScopedData(uid) {
  if (!uid) return;
  if (startedForUid === uid) return startPromise;

  startedForUid = uid;

  startPromise = (async () => {
    try {
      // settingsStore сам подписывается на authStore.currentUserId (см. init() внутри стора)
      await Promise.all([
        orderStore.initRealtimeUpdates(uid),
        clientsStore.subscribe(uid),
        servicesStore.subscribe(uid),
        detailsStore.subscribe(uid),
        tagsStore.subscribe(uid),
      ]);
    } catch (e) {
      console.error('Ошибка инициализации данных:', e);
    }
  })();

  return startPromise;
}

function stopUserScopedData() {
  startedForUid = null;
  startPromise = null;

  orderStore.stopRealtimeUpdates?.();
  clientsStore.stop?.();
  servicesStore.stop?.();
  detailsStore.stop?.();
  tagsStore.stop?.();
}

watch(
  () => authStore.currentUserId,
  async (uid) => {
    if (!uid) {
      stopUserScopedData();
      return;
    }
    await startUserScopedData(uid);
  },
  { immediate: true }
);

// 4) Global snackbar/toast queue
const toastQueue = ref([]);
const snackbarOpen = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('surface');
const snackbarTimeout = ref(2500);

function showNextToast() {
  if (snackbarOpen.value) return;
  const next = toastQueue.value.shift();
  if (!next) return;

  snackbarText.value = next.text;
  snackbarColor.value = next.color || 'surface';
  snackbarTimeout.value = typeof next.timeout === 'number' ? next.timeout : 2500;
  snackbarOpen.value = true;
}

watch(snackbarOpen, (open) => {
  if (!open) showNextToast();
});

function notify(payload) {
  // notify('text') or notify({ text, color, timeout })
  const msg = typeof payload === 'string' ? { text: payload } : payload || {};
  const text = String(msg.text || '').trim();
  if (!text) return;

  toastQueue.value.push({
    text,
    color: msg.color,
    timeout: msg.timeout,
  });

  showNextToast();
}

// Можно inject('notify') в компонентах/вьюхах
provide('notify', notify);

// Доп. мост (не меняет контракты стор/сервисов):
// window.dispatchEvent(new CustomEvent('app:toast', { detail: { text: '...', color: 'success' } }))
let _toastHandler = null;
onMounted(() => {
  if (typeof window === 'undefined') return;
  _toastHandler = (e) => notify(e?.detail || e);
  window.addEventListener('app:toast', _toastHandler);
  globalThis.$toast = notify;
});
onBeforeUnmount(() => {
  if (typeof window === 'undefined') return;
  if (_toastHandler) window.removeEventListener('app:toast', _toastHandler);
  _toastHandler = null;
});
</script>

<style>
:root {
  --safe-area-bottom: env(safe-area-inset-bottom, 16px);
}

.v-application {
  font-size: 1rem !important;
}

.app-bottom-nav.safe-area-fix {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  height: calc(56px + var(--safe-area-bottom) + 8px) !important;
  padding-bottom: calc(var(--safe-area-bottom) + 8px) !important;
}

.app-bar-minimal {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

.search-input .v-field__input {
  font-size: 1.1rem;
  padding-top: 0;
  padding-bottom: 0;
}

.app-toast {
  margin-bottom: calc(var(--safe-area-bottom) + 8px);
}
</style>
