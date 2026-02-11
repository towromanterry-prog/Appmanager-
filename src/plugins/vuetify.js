// plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
// Убедись, что этот пакет установлен: npm install @iconify-prerendered/vue-simple-icons
import { IconTelegram, IconWhatsapp } from '@iconify-prerendered/vue-simple-icons';
import '@mdi/font/css/materialdesignicons.css';
import { light, dark } from '@/theme/theme'; // Импортируем наши темы

const customAliases = {
  ...aliases,
  whatsapp: {
    component: IconWhatsapp,
  },
  telegram: {
    component: IconTelegram,
  },
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
    defaultTheme: 'light',
    themes: {
      light,
      dark,
    },
  },
  // Глобальные настройки (твои defaults)
  defaults: {
    VBtn: {
      style: 'text-transform: none; letter-spacing: 0;',
      rounded: 'pill',
      elevation: 0,
    },
    VCard: {
      rounded: 'xl',
      elevation: 0,
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
