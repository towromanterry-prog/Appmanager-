<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/firebase';

// Импорт сторов
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSearchStore } from '@/stores/searchStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useDetailStore } from '@/stores/detailStore';

// Импорт компонентов
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';

// Инициализация сторов
const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const orderStore = useOrderStore();
const searchStore = useSearchStore();
const servicesStore = useServiceStore();
const clientsStore = useClientsStore();
const tagsStore = useTagsStore();
const detailStore = useDetailStore();

const route = useRoute();

// UI State
const activeTab = ref('home');
const sortMenu = ref(false);
const showSearch = ref(false);

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

const openSearch = () => { showSearch.value = true; };
const closeSearch = () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
};

watch(() => route.name, () => {
  showSearch.value = false;
  searchStore.setSearchQuery('');
});

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
  const index = orderStore.filterStatus.indexOf(statusValue);
  if (index === -1) orderStore.filterStatus.push(statusValue);
  else orderStore.filterStatus.splice(index, 1);
};

// Следим за изменением шрифта
watch(() => settingsStore.appSettings?.baseFontSize, (newSize) => {
  if (newSize) {
    document.documentElement.style.fontSize = `${newSize}px`;
  }
}, { immediate: true });

// Следим за роутом для активного таба
watch(() => route.path, (newPath) => {
  if (newPath === '/' || newPath.startsWith('/order')) activeTab.value = 'home';
  else if (newPath.startsWith('/clients')) activeTab.value = 'clients';
  else if (newPath.startsWith('/base-settings')) activeTab.value = 'base-settings';
  else if (newPath.startsWith('/settings')) activeTab.value = 'settings';
}, { immediate: true });

onMounted(() => {
  themeStore.loadTheme();

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('Пользователь авторизован:', user.email);
      
      // ВАЖНО: Обновляем пользователя во всех сторах, чтобы интерфейс знал, что мы вошли
      if (orderStore) orderStore.user = user;
      if (clientsStore) clientsStore.user = user;
      if (servicesStore) servicesStore.user = user;
      
      // Загружаем настройки
      await settingsStore.loadSettings();

      // Инициализируем слушатели Firebase
      if (orderStore.initRealtimeUpdates) orderStore.initRealtimeUpdates();
      if (clientsStore.initRealtimeUpdates) clientsStore.initRealtimeUpdates();
      if (servicesStore.initRealtimeUpdates) servicesStore.initRealtimeUpdates();
      if (tagsStore.initRealtimeUpdates) tagsStore.initRealtimeUpdates();
      if (detailStore.initRealtimeUpdates) detailStore.initRealtimeUpdates();

    } else {
      console.log('Пользователь не авторизован');
      // Очищаем пользователя в сторах при выходе
      if (orderStore) orderStore.user = null;
      if (clientsStore) clientsStore.user = null;
      if (servicesStore) servicesStore.user = null;
      
      // Здесь можно вызвать методы очистки данных (unsubscribe), если они реализованы в сторах
    }
  });
});
</script>

<template>
  <v-app>
    <v-app-bar app color="surface" elevation="1" density="compact">
      <v-app-bar-title class="text-h6 font-weight-bold pl-2">
        {{ currentTitle }}
      </v-app-bar-title>
      
      <v-spacer></v-spacer>

      <template v-if="isHomePage">
        <v-btn icon @click="openSearch">
          <v-icon>mdi-magnify</v-icon>
        </v-btn>
        
        <v-menu
          v-model="sortMenu"
          :close-on-content-click="false"
          location="bottom end"
        >
          <template v-slot:activator="{ props }">
            <v-btn icon v-bind="props">
              <v-icon>mdi-filter-variant</v-icon>
            </v-btn>
          </template>
          <v-card min-width="200" class="pa-2 rounded-lg">
             <v-card-title class="text-subtitle-2 pb-1">Фильтр статусов</v-card-title>
             <v-divider class="mb-2"></v-divider>
             <div v-for="status in availableStatuses" :key="status.value">
               <v-checkbox
                 :model-value="orderStore.filterStatus.includes(status.value)"
                 @update:model-value="toggleStatusFilter(status.value)"
                 :label="status.text"
                 density="compact"
                 hide-details
                 color="primary"
                 class="ma-0 pa-0"
               ></v-checkbox>
             </div>
          </v-card>
        </v-menu>
      </template>

      <template v-else-if="isSearchPage">
        <v-btn icon @click="openSearch">
           <v-icon>mdi-magnify</v-icon>
        </v-btn>
      </template>
    </v-app-bar>

    <v-dialog v-model="showSearch" fullscreen transition="dialog-top-transition">
      <v-card class="rounded-0">
        <v-toolbar color="surface" elevation="1">
          <v-btn icon @click="closeSearch">
            <v-icon>mdi-arrow-left</v-icon>
          </v-btn>
          <v-text-field
            v-model="searchStore.searchQuery"
            placeholder="Поиск..."
            variant="plain"
            hide-details
            autofocus
            clearable
            class="ml-2"
          ></v-text-field>
        </v-toolbar>
        <v-card-text class="pa-4 text-center text-grey">
          Введите текст для поиска...
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-main class="bg-background">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>

    <v-bottom-navigation
      v-model="activeTab"
      grow
      color="primary"
      mode="shift"
      elevation="4"
    >
      <v-btn value="home" to="/">
        <v-icon>mdi-clipboard-list-outline</v-icon>
        <span>Заказы</span>
      </v-btn>

      <v-btn value="clients" to="/clients">
        <v-icon>mdi-account-group-outline</v-icon>
        <span>Клиенты</span>
      </v-btn>

      <v-btn value="base-settings" to="/base-settings">
        <v-icon>mdi-database-cog-outline</v-icon>
        <span>База</span>
      </v-btn>

      <v-btn value="settings" to="/settings">
        <v-icon>mdi-cog-outline</v-icon>
        <span>Настройки</span>
      </v-btn>
    </v-bottom-navigation>

    <ConfirmationDialog />
  </v-app>
</template>

<style>
/* Глобальные стили для переходов */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
