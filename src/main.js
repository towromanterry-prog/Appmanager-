import { createApp } from 'vue';
import { createPinia } from 'pinia';

// 1. Сначала стили и шрифты
import '@mdi/font/css/materialdesignicons.css';
import './style.css';

// 2. Инициализация Firebase (обязательно перед созданием сторов, если они дергают базу сразу)
import './firebase'; 

// 3. Компоненты Vue
import App from './App.vue';
import router from './router/index.js';
import vuetify from './plugins/vuetify';

const app = createApp(App);

// 4. Подключение плагинов
app.use(createPinia());
app.use(router);
app.use(vuetify);

app.mount('#app');
