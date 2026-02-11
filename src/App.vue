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
              v-if="isHomePage"
              v-model="sortMenu"
              location="bottom end"
              :close-on-content-click="false"
            >
              <template v-slot:activator="{ props }">
                <v-btn icon="mdi-sort-variant" variant="text" v-bind="props"></v-btn>
              </template>
              <v-card min-width="250" class="rounded-xl">
                 <div>
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
  </v-app>
</template>

<script setup>
import { onMounted, ref, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/store/themeStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useOrderStore } from '@/store/orderStore';
import { useClientsStore } from '@/store/clientsStore';
import { useServiceStore } from '@/store/serviceStore';
import { useTagsStore } from '@/store/tagsStore';
import { useSearchStore } from '@/store/searchStore';
import { auth } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import ConfirmationDialog from '@/components/ConfirmationDialog.vue';

// Инициализация сторов
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const serviceStore = useServiceStore();
const tagsStore = useTagsStore();
const searchStore = useSearchStore();

const route = useRoute();

// Состояние UI
const isReady = ref(false);
const activeTab = ref('home');
const showSearch = ref(false);
const sortMenu = ref(false);

// --- Логика заголовка и поиска ---

const currentTitle = computed(() => {
  switch (route.name) {
    case 'Home': return 'Заказы';
    case 'Clients': return 'Клиенты';
    case 'BaseSettings': return 'Справочники';
    case 'Settings': return 'Меню';
    default: return 'AppManager';
  }
});

const isSearchPage = computed(() => {
  return ['Home', 'Clients'].includes(route.name);
});

const isHomePage = computed(() => route.name === 'Home');

const openSearch = () => {
  showSearch.value = true;
};

const closeSearch = () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
};

// Сброс поиска при смене страницы
watch(() => route.name, () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
});

// --- Логика фильтров (статусы) ---

const availableStatuses = computed(() => {
  const allStatuses = [
    { value: 'new', text: orderStore.getStatusText ? orderStore.getStatusText('new') : 'Новый' }, // Добавил 'new', так как он обычно есть
    { value: 'accepted', text: orderStore.getStatusText ? orderStore.getStatusText('accepted') : 'Принят' },
    { value: 'additional', text: orderStore.getStatusText ? orderStore.getStatusText('additional') : 'Доп.' },
    { value: 'in_progress', text: orderStore.getStatusText ? orderStore.getStatusText('in_progress') : 'В работе' },
    { value: 'completed', text: orderStore.getStatusText ? orderStore.getStatusText('completed') : 'Готов' },
    { value: 'delivered', text: orderStore.getStatusText ? orderStore.getStatusText('delivered') : 'Сдан' },
    { value: 'cancelled', text: orderStore.getStatusText ? orderStore.getStatusText('cancelled') : 'Отменен' }
  ];
  
  return allStatuses.filter(s => {
    if (s.value === 'cancelled') return true;
    // Безопасный доступ к настройкам
    return settingsStore.appSettings?.orderStatuses?.[s.value] ?? true;
  });
});

const toggleStatusFilter = (statusValue) => {
  // Предполагаем, что в orderStore есть такой метод или доступ к массиву
  if (orderStore.toggleStatusFilter) {
      orderStore.toggleStatusFilter(statusValue);
  } else {
      // Фолбэк, если метода нет (напрямую меняем массив, если это допустимо в твоем сторе)
      const index = orderStore.filterStatus.indexOf(statusValue);
      if (index === -1) {
          orderStore.filterStatus.push(statusValue);
      } else {
          orderStore.filterStatus.splice(index, 1);
      }
  }
};

// --- Инициализация и Авторизация (Главный фикс) ---

onMounted(async () => {
  // 1. Загружаем тему и настройки
  themeStore.loadTheme();
  await settingsStore.loadSettings();

  // 2. Слушаем авторизацию
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User logged in:', user.uid);
      
      // Передаем пользователя в сторы
      orderStore.user = user;
      clientsStore.user = user;
      serviceStore.user = user;
      
      // 3. Запускаем подписки (initRealtimeUpdates)
      orderStore.initRealtimeUpdates();
      clientsStore.initRealtimeUpdates();
      serviceStore.initRealtimeUpdates();
      tagsStore.initRealtimeUpdates();
      
    } else {
      console.log('User logged out');
      orderStore.user = null;
      clientsStore.user = null;
      serviceStore.user = null;
    }
    
    isReady.value = true;
  });
});
</script>

<style>
/* Глобальные стили для App.vue */
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
