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
 h('path', { d: 'M21.9,4.4c0,0-2-1.3-3.7-0.1c-0.1,0.1-5.1,4-7.4,6.1c-0.3,0.3-0.5,0.5-0.8,0.5c-0.3,0-0.6-0.2-0.8-0.5l-2.4-2.2 c-0.5-0.5-1.4-0.2-1.4,0.6l-0.8,5.1c0,0.6,0.5,1,1.1,0.8l3-1.8c0.2-0.1,0.5-0.1,0.7,0.1l5.4,4.1c0.5,0.4,1.2,0.2,1.4-0.4l3.1-14.7 C22.4,5.4,22.2,4.7,21.9,4.4z' })
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
