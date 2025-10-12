// plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { mdiTelegram } from '@mdi/js';
import { h } from 'vue';
import '@mdi/font/css/materialdesignicons.css';
import { light, dark } from '@/theme/theme'; // Импортируем наши новые темы

const customAliases = {
  ...aliases,
  telegram: mdiTelegram,
};

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      telegram: mdiTelegram,
    },
    sets: {
      mdi,
    },
  },
  // Настройка тем
  theme: {
    defaultTheme: 'light', // Тема по умолчанию
    themes: {
      light, // Используем импортированную светлую тему
      dark,  // Используем импортированную темную тему
    },
  },
  // Глобальные настройки для компонентов в стиле Material 3
  defaults: {
    VBtn: {
      style: 'text-transform: none; letter-spacing: 0;',
      rounded: 'pill',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
      // Убираем border: true, так как теперь управляем этим через глобальный CSS
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
    },
    VListItem: {
       rounded: 'lg'
    },
    VChip: {
      rounded: 'lg',
    },
  },
});
