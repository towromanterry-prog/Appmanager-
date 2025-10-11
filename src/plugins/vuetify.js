// plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { h } from 'vue';
import '@mdi/font/css/materialdesignicons.css';
import { light, dark } from '@/theme/theme'; // Импортируем наши новые темы

const telegramIcon = h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  height: '24px',
  width: '24px',
}, [
  h('path', { d: 'M9.78 18.65l.28-4.43.01-.01.01-.01 7.2-6.58c.31-.28.05-.79-.34-.73l-8.93 1.25c-.41.06-.59.55-.23.83l2.25 2.1.01.01.01.01 4.41-2.61c.18-.1.35.15.2.29l-5.6 5.11-1.39 4.19c-.21.63.45 1.13.97.81l2.45-1.44.01-.01.01-.01z' })
]);

const customAliases = {
  ...aliases,
  telegram: telegramIcon,
};

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases: customAliases,
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
