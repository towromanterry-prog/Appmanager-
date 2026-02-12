// src/plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
// Убедись, что этот пакет установлен: npm install @iconify-prerendered/vue-simple-icons
import { IconTelegram, IconWhatsapp } from '@iconify-prerendered/vue-simple-icons';
import '@mdi/font/css/materialdesignicons.css';
import { light, dark } from '@/theme/theme';

const customAliases = {
  ...aliases,
  whatsapp: { component: IconWhatsapp },
  telegram: { component: IconTelegram },
};

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases: customAliases,
    sets: { mdi },
  },

  theme: {
    defaultTheme: 'light',
    themes: { light, dark },
  },

  // Глобальный “soft minimal” (единое ощущение UI)
  defaults: {
    // Кнопки: спокойные, без капса, с мягкими скруглениями
    VBtn: {
      style: 'text-transform:none; letter-spacing:0;',
      elevation: 0,
      rounded: 'lg',
      height: 40,
      minWidth: 40,
      variant: 'tonal', // основной “мягкий” стиль по умолчанию
      color: 'primary',
    },

    // Карточки: плоские (бордер уже в style.css), мягкое скругление
    VCard: {
      elevation: 0,
      rounded: 'xl',
    },

    // Поля: аккуратные, компактно-удобные, без визуального шума
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      rounded: 'lg',
      hideDetails: 'auto',
    },

    // Верхние панели: плоские, “тихие”, без лишних теней
    VToolbar: {
      flat: true,
      density: 'comfortable',
    },
    VAppBar: {
      flat: true,
      elevation: 0,
      density: 'comfortable',
      color: 'surface',
    },

    // Мелочи для единого ощущения
    VListItem: {
      rounded: 'lg',
      density: 'comfortable',
    },
    VChip: {
      rounded: 'lg',
      variant: 'tonal',
    },
  },
});
