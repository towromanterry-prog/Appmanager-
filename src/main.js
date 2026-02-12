// src/main.js
import { createApp } from 'vue';
import { createPinia } from 'pinia';

// 1. Сначала стили и шрифты
import '@mdi/font/css/materialdesignicons.css';
import './style.css';

// 2. Инициализация Firebase (вместо старого ./firebase)
import './services/firebase';

// 3. Компоненты Vue
import App from './App.vue';
import router from './router/index.js';
import vuetify from './plugins/vuetify';

import { useAuthStore } from '@/stores/authStore';

async function bootstrap() {
  const app = createApp(App);

  const pinia = createPinia();
  app.use(pinia);
  app.use(router);
  app.use(vuetify);

  // ждём первый onAuthStateChanged
  const authStore = useAuthStore(pinia);
  await authStore.init();

  app.mount('#app');
}

bootstrap();