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

// Импорт сторов
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSearchStore } from '@/stores/searchStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';

// Импорт компонентов
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';

// Инициализация сторов
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const searchStore = useSearchStore();
const servicesStore = useServiceStore();
const clientsStore = useClientsStore();
const detailStore = useDetailStore();
const tagsStore = useTagsStore();

const route = useRoute();

// UI State
const activeTab = ref('home');
const showSearch = ref(false);

// Вычисляемые свойства для навигации
const isSearchPage = computed(() => ['home', 'clients', 'base-settings'].includes(route.name));

const currentTitle = computed(() => {
  if (route.name === 'home') return 'Мои заказы';
  if (route.name === 'clients') return 'Клиенты';
  if (route.name === 'order-edit') return 'Мои заказы';
  if (route.name === 'settings') return 'Настройки';
  if (route.name === 'base-settings') return 'Справочники';
  return '';
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

// Единый механизм масштаба шрифта: settingsStore.settings.fontSize -> --app-font-scale
const DEFAULT_FONT_SIZE = 16;

watch(
  () => settingsStore.settings?.fontSize,
  (fontSize) => {
    const size = Number(fontSize) || DEFAULT_FONT_SIZE;
    const scale = size / DEFAULT_FONT_SIZE;
    document.documentElement.style.setProperty('--app-font-scale', String(scale));
  },
  { immediate: true }
);

// Синхронизация табов
watch(() => route.path, (newPath) => {
  if (newPath === '/' || newPath.startsWith('/order')) activeTab.value = 'home';
  else if (newPath.startsWith('/clients')) activeTab.value = 'clients';
  else if (newPath.startsWith('/base-settings')) activeTab.value = 'base-settings';
  else if (newPath.startsWith('/settings')) activeTab.value = 'settings';
}, { immediate: true });

// ИНИЦИАЛИЗАЦИЯ ДАННЫХ ПРИ ЗАПУСКЕ
onMounted(async () => {
  // 1) Тема и настройки
  themeStore.loadTheme();
  await settingsStore.loadSettings();

  // 2) Realtime подписки (реальные методы из сторов)
  orderStore.initRealtimeUpdates();
  clientsStore.initRealtimeUpdates();
  servicesStore.initRealtimeUpdates();
  detailStore.initRealtimeUpdates();
  tagsStore.initRealtimeUpdates();
});
</script>

<style>
/* Глобальные стили для App.vue */
:root {
  --safe-area-bottom: env(safe-area-inset-bottom, 16px);
}

/* Фикс нижней панели для мобилок */
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
