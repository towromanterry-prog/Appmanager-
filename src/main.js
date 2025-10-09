import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router/index.js';
import vuetify from './plugins/vuetify'; // 👈 Подключаем наш плагин Vuetify
import './style.css';
import '@mdi/font/css/materialdesignicons.css'; // 👈 Импортируем иконки

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(vuetify); // 👈 Регистрируем Vuetify в приложении

app.mount('#app');