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
                          <v-checkbox-btn :model-value="orderStore.filterStatus.includes(status.value)"></v-checkbox-btn>
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
    <TemplateSelectionDialog />
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSearchStore } from '@/stores/searchStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useTagsStore } from '@/stores/tagsStore';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import TemplateSelectionDialog from '@/components/TemplateSelectionDialog.vue';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const searchStore = useSearchStore();
const route = useRoute();

// Инициализация
useServiceStore();
useClientsStore();
useTagsStore();
useOrderStore(); 

const activeTab = ref('home');
const sortMenu = ref(false);
const showSearch = ref(false);

const isHomePage = computed(() => route.name === 'home');
const isSearchPage = computed(() => ['home', 'clients', 'base-settings'].includes(route.name));
const showSortMenu = computed(() => isHomePage.value);

const currentTitle = computed(() => {
  if (route.name === 'home') return 'Мои заказы';
  if (route.name === 'clients') return 'Клиенты';
  if (route.name === 'order-new') return 'Новый заказ';
  if (route.name === 'order-edit') return 'Редактирование заказа';
  if (route.name === 'settings') return 'Настройки';
  if (route.name === 'base-settings') return 'Справочники';
  return '';
});

// Логика поиска
const openSearch = () => {
  showSearch.value = true;
};

const closeSearch = () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
};

// Если ушли со страницы поиска - сбрасываем
watch(() => route.name, () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
});

// Статусы для фильтра
const availableStatuses = computed(() => {
  const allStatuses = [
    { value: 'accepted', text: orderStore.getStatusText('accepted') },
    { value: 'additional', text: orderStore.getStatusText('additional') },
    { value: 'in_progress', text: orderStore.getStatusText('in_progress') },
    { value: 'completed', text: orderStore.getStatusText('completed') },
    { value: 'delivered', text: orderStore.getStatusText('delivered') },
    { value: 'cancelled', text: orderStore.getStatusText('cancelled') }
  ];
  return allStatuses.filter(s => {
    if (s.value === 'cancelled') return true;
    return settingsStore.appSettings.orderStatuses?.[s.value];
  });
});

const toggleStatusFilter = (statusValue) => {
  const index = orderStore.filterStatus.indexOf(statusValue);
  if (index === -1) {
    orderStore.filterStatus.push(statusValue);
  } else {
    orderStore.filterStatus.splice(index, 1);
  }
};

// Масштабирование
watch(() => settingsStore.appSettings.baseFontSize, (newSize) => {
  if (newSize) {
    document.documentElement.style.fontSize = `${newSize}px`;
  }
}, { immediate: true });

// Синхронизация табов
watch(() => route.path, (newPath) => {
  if (newPath === '/' || newPath.startsWith('/order')) activeTab.value = 'home';
  else if (newPath.startsWith('/clients')) activeTab.value = 'clients';
  else if (newPath.startsWith('/base-settings')) activeTab.value = 'base-settings';
  else if (newPath.startsWith('/settings')) activeTab.value = 'settings';
}, { immediate: true });

onMounted(() => {
  themeStore.loadTheme();
  settingsStore.loadSettings();
});
</script>

<style>
:root {
  --app-base-font-size: 16px;
  /* Резервный отступ, если env() не сработает (например на старых Android планшетах) */
  --safe-area-bottom: env(safe-area-inset-bottom, 16px); 
}

html {
  font-size: var(--app-base-font-size);
}

.v-application {
  font-size: 1rem !important; 
}

/* === Фикс нижней панели === */
.app-bottom-nav.safe-area-fix {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
  /* Высота = стандартные 56px + отступ снизу */
  height: calc(56px + var(--safe-area-bottom) + 8px) !important;
  /* Внутренний отступ, чтобы иконки не прилипали к низу */
  padding-bottom: calc(var(--safe-area-bottom) + 8px) !important;
}

/* Шапка */
.app-bar-minimal {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
}

/* Поле поиска в шапке */
.search-input .v-field__input {
  font-size: 1.1rem;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
