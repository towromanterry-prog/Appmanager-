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

        <template v-slot:append-inner>
          <v-menu
            v-if="isHomePage"
            v-model="sortMenu"
            location="bottom end"
            :close-on-content-click="false"
          >
            <template v-slot:activator="{ props }">
              <v-icon
                icon="mdi-sort-variant"
                v-bind="props"
                @mousedown.stop
                @click.stop
              ></v-icon>
            </template>

            <v-card>
              <div class="d-flex">
                <v-list dense>
                  <v-list-subheader>СТАТУС</v-list-subheader>
                  <v-list-item
                    v-for="status in availableStatuses"
                    :key="status.value"
                    @click="toggleStatusFilter(status.value)"
                  >
                    <template v-slot:prepend>
                      <v-checkbox-btn
                        :model-value="orderStore.filterStatus.includes(status.value)"
                      ></v-checkbox-btn>
                    </template>
                    <v-list-item-title>{{ status.text }}</v-list-item-title>
                  </v-list-item>
                </v-list>

                <v-divider vertical></v-divider>

                <v-list dense>
                  <v-list-subheader>СОРТИРОВКА</v-list-subheader>
                  <v-radio-group v-model="orderStore.sortBy" hide-details class="pa-2">
                    <v-radio label="По дедлайну" value="deadline"></v-radio>
                    <v-radio label="По дате создания" value="createDate"></v-radio>
                  </v-radio-group>
                </v-list>
              </div>
            </v-card>
          </v-menu>
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
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/themeStore.js';
import { useServiceStore } from '@/stores/serviceStore.js';
import { useOrderStore } from '@/stores/orderStore.js';
import { useClientsStore } from '@/stores/clientsStore.js';
import { useSettingsStore } from '@/stores/settingsStore.js';
import { useTagsStore } from '@/stores/tagsStore.js';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';

const router = useRouter();
const route = useRoute();
const searchQuery = ref('');
const drawer = ref(false);
const sortMenu = ref(false);

const isHomePage = computed(() => route.name === 'home');

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();

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
    return settingsStore.appSettings.orderStatuses[s.value];
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

const menuItems = ref([
  { title: 'Главная', icon: 'mdi-home', route: 'home' },
  { title: 'Клиенты', icon: 'mdi-account-group', route: 'clients' },
  { title: 'Базовые настройки', icon: 'mdi-cog-outline', route: 'base-settings' },
  { title: 'Настройки', icon: 'mdi-tune', route: 'settings' }
]);

const themeStore = useThemeStore();
const serviceStore = useServiceStore();
const clientsStore = useClientsStore();
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
