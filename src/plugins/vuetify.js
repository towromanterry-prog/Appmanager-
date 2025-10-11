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
  h('path', { d: 'M9.78,18.65L10.26,14.21L18.73,5.72C19.12,5.33 18.67,4.88 18.28,5.27L5.81,16.28C5.37,16.72 5.86,17.41 6.39,17.22L8.83,16.32L15.25,10.05C15.5,9.82 15.2,9.53 14.95,9.77L9.78,18.65Z' })
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
