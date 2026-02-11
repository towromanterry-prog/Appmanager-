<template>
  <v-app :theme="themeStore.theme" class="app-root">
    
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
                          <v-checkbox-btn :model-value="orderStore.filterStatus?.includes(status.value)"></v-checkbox-btn>
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { auth } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Импорт сторов с ПРАВИЛЬНЫМИ путями и расширениями
import { useThemeStore } from '@/stores/themeStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useOrderStore } from '@/stores/orderStore.js';
import { useSearchStore } from '@/stores/searchStore.js';
import { useServiceStore } from '@/stores/serviceStore.js';
import { useClientsStore } from '@/stores/clientsStore.js';
import { useTagsStore } from '@/stores/tagsStore.js';

// Импорт компонентов
import ConfirmationDialog from '@/ConfirmationDialog.vue';

// Инициализация сторов
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const searchStore = useSearchStore();
const serviceStore = useServiceStore();
const clientsStore = useClientsStore();
const tagsStore = useTagsStore();

const route = useRoute();

// UI State
const isReady = ref(false);
const activeTab = ref('home');
const sortMenu = ref(false);
const showSearch = ref(false);

// Навигация и заголовки
const isHomePage = computed(() => route.name === 'home');
const isSearchPage = computed(() => ['home', 'clients', 'base-settings'].includes(route.name));
const showSortMenu = computed(() => isHomePage.value);

const currentTitle = computed(() => {
  switch (route.name) {
    case 'home': return 'Мои заказы';
    case 'clients': return 'Клиенты';
    case 'settings': return 'Настройки';
    case 'base-settings': return 'Справочники';
    case 'order-edit': return 'Мои заказы';
    default: return '';
  }
});

// Логика поиска
const openSearch = () => { showSearch.value = true; };
const closeSearch = () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
};

watch(() => route.name, () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
});

// Статусы и фильтры
const availableStatuses = computed(() => {
  const allStatuses = [
    { value: 'accepted', text: orderStore.getStatusText ? orderStore.getStatusText('accepted') : 'Принят' },
    { value: 'additional', text: orderStore.getStatusText ? orderStore.getStatusText('additional') : 'Доп.' },
    { value: 'in_progress', text: orderStore.getStatusText ? orderStore.getStatusText('in_progress') : 'В работе' },
    { value: 'completed', text: orderStore.getStatusText ? orderStore.getStatusText('completed') : 'Готов' },
    { value: 'delivered', text: orderStore.getStatusText ? orderStore.getStatusText('delivered') : 'Сдан' },
    { value: 'cancelled', text: orderStore.getStatusText ? orderStore.getStatusText('cancelled') : 'Отменен' }
  ];
  return allStatuses.filter(s => {
    if (s.value === 'cancelled') return true;
    return settingsStore.appSettings?.orderStatuses?.[s.value] ?? true;
  });
});

const toggleStatusFilter = (statusValue) => {
  if (!orderStore.filterStatus) orderStore.filterStatus = [];
  const index = orderStore.filterStatus.indexOf(statusValue);
  if (index === -1) orderStore.filterStatus.push(statusValue);
  else orderStore.filterStatus.splice(index, 1);
};

// Синхронизация табов с роутом
watch(() => route.path, (newPath) => {
  if (newPath === '/' || newPath.startsWith('/order')) activeTab.value = 'home';
  else if (newPath.startsWith('/clients')) activeTab.value = 'clients';
  else if (newPath.startsWith('/base-settings')) activeTab.value = 'base-settings';
  else if (newPath.startsWith('/settings')) activeTab.value = 'settings';
}, { immediate: true });

// Глобальная настройка шрифта
watch(() => settingsStore.appSettings?.baseFontSize, (newSize) => {
  if (newSize) {
    document.documentElement.style.fontSize = `${newSize}px`;
  }
}, { immediate: true });

// ИНИЦИАЛИЗАЦИЯ
onMounted(async () => {
  themeStore.loadTheme();
  await settingsStore.loadSettings();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      // Прокидываем юзера в сторы
      orderStore.user = user;
      clientsStore.user = user;
      serviceStore.user = user;

      // ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ИМЕНА МЕТОДОВ (initRealtimeUpdates)
      orderStore.initRealtimeUpdates();
      clientsStore.initRealtimeUpdates();
      serviceStore.initRealtimeUpdates();
      tagsStore.initRealtimeUpdates();
    }
    isReady.value = true;
  });
});
</script>

<style>
:root {
  --app-base-font-size: 16px;
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
