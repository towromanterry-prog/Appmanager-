<template>
  <v-app :theme="themeStore.theme" class="app-root">
    <v-app-bar app color="surface" flat density="comfortable" class="app-bar-minimal">
      <div class="d-flex align-center px-4 w-100">
        <v-scale-transition mode="out-in">
          <!-- SEARCH MODE -->
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

          <!-- NORMAL MODE -->
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

    <ConfirmationDialog />
  </v-app>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';

// Auth
import { useAuthStore } from '@/stores/authStore';

// Stores
import { useThemeStore } from '@/stores/themeStore';
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
const themeStore = useThemeStore();
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

// ВАЖНО: searchStore -> orderStore (фильтрация остаётся внутри orderStore.getters)
watch(
  () => searchStore.searchQuery,
  (q) => {
    orderStore.setSearchQuery?.(q ?? '');
  },
  { immediate: true }
);

// Статусы для фильтра (cancelled зависит от настроек)
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

  // cancelled НЕ форсим — показываем строго по настройкам (или по умолчанию true, если настроек нет)
  return allStatuses.filter((s) => (cfg?.[s.value] ?? true));
});

// Мультивыбор статусов: дергаем action стора (или fallback на прямой массив)
const toggleStatusFilter = (statusValue) => {
  if (orderStore.toggleStatusFilter) {
    orderStore.toggleStatusFilter(statusValue);
  } else {
    const index = orderStore.filterStatus.indexOf(statusValue);
    if (index === -1) orderStore.filterStatus.push(statusValue);
    else orderStore.filterStatus.splice(index, 1);
  }
  // меню НЕ закрываем, чтобы удобно нащёлкать несколько статусов
};

// Глобальное изменение шрифта (совместимо: appSettings или settings)
watch(
  () => settingsStore.settings?.fontSize ?? settingsStore.appSettings?.baseFontSize,
  (newSize) => {
    if (!newSize) return;

    document.documentElement.style.setProperty('--app-base-font-size', `${newSize}px`);

    const scale = Number(newSize) / 16;
    if (Number.isFinite(scale) && scale > 0) {
      document.documentElement.style.setProperty('--app-font-scale', String(scale));
    }
  },
  { immediate: true }
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

// Тема (локально)
themeStore.loadTheme();

// ===== Главное: user-scoped данные только при наличии UID =====
let startedForUid = null;
let startPromise = null;

async function startUserScopedData(uid) {
  if (!uid) return;
  if (startedForUid === uid) return startPromise;

  startedForUid = uid;

  startPromise = (async () => {
    // настройки
    await settingsStore.loadSettings();

    // realtime заказы: НОВЫЙ API — uid обязателен
    await orderStore.initRealtimeUpdates(uid);

    // справочники: 4 подписки
    await Promise.all([
      clientsStore.subscribe(),
      servicesStore.subscribe(),
      detailsStore.subscribe(),
      tagsStore.subscribe(),
    ]);
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
</script>

<style>
:root {
  --app-base-font-size: 16px;
  --app-font-scale: 1;
  --safe-area-bottom: env(safe-area-inset-bottom, 16px);
}

html {
  font-size: var(--app-base-font-size);
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
</style>