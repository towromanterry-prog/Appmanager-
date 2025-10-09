<template>
  <v-app :theme="themeStore.theme">
    <v-navigation-drawer v-model="drawer" temporary>
      <v-list>
        <v-list-item
          v-for="(item, index) in menuItems"
          :key="index"
          @click="goToRoute(item.route)"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon"></v-icon>
          </template>
          <v-list-item-title>{{ item.title }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar app color="surface" height="68" flat border>
      <v-text-field
        v-model="searchQuery"
        placeholder="Поиск..."
        variant="solo"
        bg-color="secondary"
        dense
        hide-details
        flat
        rounded="pill"
        class="full-width-search"
      >
        <template v-slot:prepend-inner>
          <v-icon
            icon="mdi-menu"
            class="burger-icon"
            @mousedown.stop
            @mouseup.stop
            @click.stop="drawer = !drawer"
          ></v-icon>
        </template>
      </v-text-field>

    </v-app-bar>

    <v-main class="app-main">
      <router-view />
    </v-main>

    <ConfirmationDialog />
  </v-app>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useThemeStore } from '@/stores/themeStore.js';
import { useServiceStore } from '@/stores/serviceStore.js';
import { useOrderStore } from '@/stores/orderStore.js';
import { useClientsStore } from '@/stores/clientsStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTagsStore } from '@/stores/tagsStore.js';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';

const router = useRouter();
const searchQuery = ref('');
const drawer = ref(false);

const menuItems = ref([
  { title: 'Главная', icon: 'mdi-home', route: 'home' },
  { title: 'Клиенты', icon: 'mdi-account-group', route: 'clients' },
  { title: 'Базовые настройки', icon: 'mdi-cog-outline', route: 'base-settings' },
  { title: 'Настройки', icon: 'mdi-tune', route: 'settings' }
]);

const themeStore = useThemeStore();
const serviceStore = useServiceStore();
const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const tagsStore = useTagsStore();

const goToRoute = (routeName) => {
  router.push({ name: routeName });
  drawer.value = false;
};

// УЛУЧШЕНИЕ: Параллельная загрузка данных для ускорения инициализации
const initializeApp = async () => {
  try {
    // Сначала загружаем тему, так как это синхронная операция
    if (themeStore.loadTheme) {
      themeStore.loadTheme();
    }
    
    // Формируем массив асинхронных операций
    const promises = [];
    if (settingsStore.loadSettings) promises.push(settingsStore.loadSettings());
    if (serviceStore.loadServices) promises.push(serviceStore.loadServices());
    if (clientsStore.loadClients) promises.push(clientsStore.loadClients());
    if (tagsStore.loadTags) promises.push(tagsStore.loadTags());
    if (orderStore.load) promises.push(orderStore.load());

    // Выполняем все загрузки одновременно
    await Promise.all(promises);
    
  } catch (error) {
    console.error('Ошибка инициализации приложения:', error);
  }
};

onMounted(initializeApp);
</script>

<style scoped>
.app-main {
  padding-bottom: 0;
}

:deep(.v-toolbar__content) {
  display: flex;
  align-items: center;
  padding: 0 16px !important;
}

.full-width-search {
  margin: 0 !important;
}

.burger-icon {
  cursor: pointer;
  margin-right: 12px;
}
</style>
