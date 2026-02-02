<template>
  <v-app :theme="themeStore.theme" class="app-root">
    <v-app-bar app color="surface" flat density="comfortable" class="app-bar-minimal">
      <div class="d-flex align-center px-4 w-100">
        <span class="text-h6 font-weight-bold">{{ currentTitle }}</span>
        <v-spacer></v-spacer>
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
      class="app-bottom-nav"
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
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useOrderStore } from '@/stores/orderStore'; // Нужно для init
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import TemplateSelectionDialog from '@/components/TemplateSelectionDialog.vue';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const route = useRoute();

// Инициализация сторов (Firebase listeners)
useServiceStore();
useClientsStore();
useTagsStore();
useOrderStore(); 

const activeTab = ref('home');

const currentTitle = computed(() => {
  if (route.name === 'home') return 'Заказы';
  if (route.name === 'clients') return 'Клиенты';
  if (route.name === 'settings') return 'Настройки';
  return 'AppManager';
});

// === ЛОГИКА МАСШТАБИРОВАНИЯ (REM) ===
// Следим за настройкой и меняем root font-size
watch(() => settingsStore.appSettings.baseFontSize, (newSize) => {
  if (newSize) {
    document.documentElement.style.fontSize = `${newSize}px`;
  }
}, { immediate: true });

// Синхронизация табов
watch(() => route.path, (newPath) => {
  if (newPath === '/') activeTab.value = 'home';
  else if (newPath === '/clients') activeTab.value = 'clients';
  else if (newPath === '/settings') activeTab.value = 'settings';
}, { immediate: true });

onMounted(() => {
  themeStore.loadTheme();
  settingsStore.loadSettings();
});
</script>

<style>
/* Глобальные настройки */
:root {
  --app-base-font-size: 16px; /* Значение по умолчанию */
}

html {
  font-size: var(--app-base-font-size);
  /* Запрещаем выделение текста для "нативного" ощущения */
  -webkit-user-select: none;
  user-select: none; 
}

body {
  background-color: rgb(var(--v-theme-background));
  overscroll-behavior-y: none; /* Убираем эффект резинки на iOS */
}

/* Сброс Vuetify */
.v-application {
  font-size: 1rem !important;
}

/* Тонкая линия навигации */
.app-bottom-nav {
  border-top: 1px solid rgba(var(--v-border-color), 0.08);
}
.app-bar-minimal {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08) !important;
}
</style>
