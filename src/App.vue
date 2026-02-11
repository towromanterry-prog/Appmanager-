<template>
  <v-app :theme="themeStore.theme" class="app-root bg-background">
    
    <v-app-bar app color="surface" flat density="comfortable" class="app-bar-minimal">
      <div class="d-flex align-center px-4 w-100">
        <v-scale-transition mode="out-in">
          
          <div v-if="searchStore.isActive" class="d-flex align-center flex-grow-1 w-100">
            <v-text-field
              v-model="searchStore.query"
              placeholder="Поиск..."
              variant="plain"
              density="compact"
              hide-details
              autofocus
              class="search-input"
              clearable
              prepend-inner-icon="mdi-magnify"
              @click:clear="closeSearch"
            ></v-text-field>
            <v-btn icon="mdi-close" variant="text" size="small" @click="closeSearch"></v-btn>
          </div>

          <div v-else class="d-flex align-center flex-grow-1 w-100">
            <span class="text-h6 font-weight-bold text-primary">{{ currentTitle }}</span>
            <v-spacer></v-spacer>
            
            <v-btn 
              v-if="showSearchBtn" 
              icon="mdi-magnify" 
              variant="text" 
              color="primary"
              @click="openSearch"
            ></v-btn>

            </div>

        </v-scale-transition>
      </div>
    </v-app-bar>

    <v-main>
      <div class="fill-height pb-16"> <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </v-main>

    <v-bottom-navigation
      grow
      color="primary"
      class="app-bottom-nav safe-area-fix"
      elevation="0"
      bg-color="surface"
      v-model="activeTab"
    >
      <v-btn to="/" value="orders">
        <v-icon>mdi-clipboard-list-outline</v-icon>
        <span>Заказы</span>
      </v-btn>

      <v-btn to="/clients" value="clients">
        <v-icon>mdi-account-group-outline</v-icon>
        <span>Клиенты</span>
      </v-btn>

      <v-btn to="/settings" value="settings">
        <v-icon>mdi-cog-outline</v-icon>
        <span>Настройки</span>
      </v-btn>
    </v-bottom-navigation>

    <ConfirmationDialog 
      v-model="confirmationStore.isVisible"
      :title="confirmationStore.options.title"
      :message="confirmationStore.options.message"
      :confirm-text="confirmationStore.options.confirmText"
      :cancel-text="confirmationStore.options.cancelText"
      :color="confirmationStore.options.color"
      @confirm="confirmationStore.confirm"
      @cancel="confirmationStore.cancel"
    />
  </v-app>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from 'vuetify'

// Stores (4 Layer Architecture)
import { useSettingsStore } from '@/stores/settingsStore'
import { useThemeStore } from '@/stores/themeStore'
import { useConfirmationStore } from '@/stores/confirmationStore'
import { useSearchStore } from '@/stores/searchStore'
import { useOrderStore } from '@/stores/orderStore'
import { useClientsStore } from '@/stores/clientsStore'
// Если есть serviceStore, добавь: import { useServiceStore } from '@/stores/serviceStore'

const route = useRoute()
const theme = useTheme()

// Init Stores
const settingsStore = useSettingsStore()
const themeStore = useThemeStore()
const confirmationStore = useConfirmationStore()
const searchStore = useSearchStore()
const orderStore = useOrderStore()
const clientsStore = useClientsStore()

// --- WIRING: ИНИЦИАЛИЗАЦИЯ ---
onMounted(async () => {
  // 1. Загрузка настроек и темы
  await settingsStore.loadSettings()
  themeStore.initTheme(theme)

  // 2. Инициализация данных (Realtime listeners)
  // Проверяем наличие методов, т.к. сторы заморожены, но мы должны их вызвать
  if (orderStore.initRealtimeUpdates) orderStore.initRealtimeUpdates()
  if (orderStore.subscribeOrders) orderStore.subscribeOrders() // На случай если метод называется так
  
  if (clientsStore.subscribeClients) clientsStore.subscribeClients()
})

// --- ЛОГИКА ШРИФТА (ДИНАМИЧЕСКАЯ) ---
watch(() => settingsStore.appSettings?.fontSize, (newSize) => {
  if (newSize) {
    document.documentElement.style.fontSize = `${newSize}px`
  }
}, { immediate: true })

// --- ЛОГИКА ИНТЕРФЕЙСА ---
const activeTab = ref('orders')

// Вычисляем заголовок на основе текущего роута
const currentTitle = computed(() => {
  switch (route.name) {
    case 'home': return 'Мои заказы'
    case 'clients': return 'Список клиентов'
    case 'settings': return 'Настройки'
    default: return 'AppManager'
  }
})

// Показывать кнопку поиска только на страницах списков
const showSearchBtn = computed(() => {
  return ['home', 'clients'].includes(route.name)
})

// Методы поиска
const openSearch = () => {
  searchStore.isActive = true
  // searchStore.query = '' // Опционально: очищать при открытии
}

const closeSearch = () => {
  searchStore.isActive = false
  searchStore.query = ''
}
</script>

<style scoped>
/* Глобальные стили для App.vue */
:root {
  --app-base-font-size: 16px;
  --safe-area-bottom: env(safe-area-inset-bottom, 16px); 
}

/* Переход страниц */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Minimal Soft App Bar */
.app-bar-minimal {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.05);
  box-shadow: 0 2px 10px rgba(0,0,0,0.03) !important;
}

/* Bottom Nav Fixes */
.app-bottom-nav {
  border-top: 1px solid rgba(var(--v-border-color), 0.05);
  padding-bottom: var(--safe-area-bottom);
  height: calc(56px + var(--safe-area-bottom)) !important;
}

.search-input :deep(.v-field__input) {
  padding-top: 0;
  padding-bottom: 0;
  min-height: 40px;
}
</style>
