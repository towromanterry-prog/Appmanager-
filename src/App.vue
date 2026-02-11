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
    </v-app>
</template>


  showSearch.value = false;
  searchStore.setSearchQuery('');
};

watch(() => route.name, () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
});

// Статусы для фильтра (берем из orderStore/settingsStore)
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
    // Безопасный доступ к settingsStore.appSettings
    return settingsStore.appSettings?.orderStatuses?.[s.value] ?? true;
  });

<script setup>
import { onMounted, ref } from 'vue';
import { useThemeStore } from './themeStore';
import { useSettingsStore } from './settingsStore';
import { useOrderStore } from './orderStore';
import { useClientsStore } from './clientsStore';
import { useServiceStore } from './serviceStore';
import { useTagsStore } from './tagsStore';
import { auth } from './firebase'; // Импортируем auth напрямую
import { onAuthStateChanged } from 'firebase/auth';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const serviceStore = useServiceStore();
const tagsStore = useTagsStore();

const isReady = ref(false);

onMounted(async () => {
  // 1. Загружаем тему и локальные настройки
  themeStore.loadTheme();
  await settingsStore.loadSettings();

  // 2. Слушаем авторизацию (Это "Главный рубильник")
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('User logged in:', user.uid);
      
      // Внедряем юзера в сторы, которым это важно
      // (даже если в state явно нет поля user, JS его создаст, 
      // и геттеры типа isLoggedIn заработают, если они проверяют this.user)
      orderStore.user = user;
      clientsStore.user = user;
      serviceStore.user = user;
      
      // 3. Запускаем подписки на данные (ИСПОЛЬЗУЕМ ПРАВИЛЬНЫЕ ИМЕНА МЕТОДОВ)
      orderStore.initRealtimeUpdates();
      clientsStore.initRealtimeUpdates(); // Было subscribeClients -> стало initRealtimeUpdates
      serviceStore.initRealtimeUpdates(); // Было subscribeServices -> стало initRealtimeUpdates
      tagsStore.initRealtimeUpdates();
      
    } else {
      console.log('User logged out');
      orderStore.user = null;
      clientsStore.user = null;
      // Тут можно делать unsubscribe, если нужно
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
