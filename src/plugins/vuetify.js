// src/plugins/vuetify.js
import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { aliases, mdi } from 'vuetify/iconsets/mdi';
import { IconTelegram, IconWhatsapp } from '@iconify-prerendered/vue-simple-icons';
import '@mdi/font/css/materialdesignicons.css';
import { light, dark } from '@/theme/theme';

const customAliases = {
  ...aliases,
  whatsapp: { component: IconWhatsapp },
  telegram: { component: IconTelegram },
};

const vuetify = createVuetify({
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

  defaults: {
    /**
     * Кнопки — компактные, мягкие, без “шумной” типографики.
     * Вариант НЕ форсим, чтобы не ломать текущие компоненты,
     * но даём единый “feel”.
     */
    VBtn: {
      density: 'compact',
      rounded: 'lg',
      elevation: 0,
      style: [
        'text-transform: none;',
        'letter-spacing: 0;',
        // чуть более предсказуемая высота в плотном режиме
        'min-height: 32px;',
      ].join(' '),
    },

    /**
     * Карточки — плоские, с мягким радиусом.
     * Рамку лучше держать через CSS (у тебя уже есть .v-card border в style.css),
     * поэтому здесь тень/скругление/плотность.
     */
    VCard: {
      rounded: 'lg',
      elevation: 0,
    },

    /**
     * Инпуты — единый вариант + compact + стабильная высота.
     * Цвета не задаём (не хардкодим), максимум — semantic "primary".
     */
    VTextField: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
      // стабильнее по высоте между полями
      style: '--v-input-control-height: 40px;',
    },

    VSelect: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
      style: '--v-input-control-height: 40px;',
      menuProps: { maxHeight: 360 },
    },

    VAutocomplete: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
      style: '--v-input-control-height: 40px;',
      menuProps: { maxHeight: 360 },
    },

    VTextarea: {
      variant: 'outlined',
      density: 'compact',
      rounded: 'lg',
      color: 'primary',
      hideDetails: 'auto',
      // не пытаемся сделать “одинаковую” высоту как у text-field — у textarea своя логика
      rows: 3,
    },

    /**
     * Списки/чипы — мягче и плотнее.
     */
    VList: {
      density: 'compact',
    },
    VListItem: {
      rounded: 'lg',
      density: 'compact',
    },
    VChip: {
      rounded: 'lg',
      density: 'compact',
    },

    /**
     * Toolbar / AppBar — аккуратнее по высоте и без лишней тени.
     */
    VToolbar: {
      density: 'compact',
      height: 48,
      flat: true,
    },

    VAppBar: {
      density: 'compact',
      height: 56,
      flat: true,
      elevation: 0,
    },

    /**
     * Диалоги/меню — без тяжёлых теней.
     * (elevation оставляем низким, но не 0, чтобы меню читалось над контентом)
     */
    VMenu: {
      locationStrategy: 'connected',
    },
    VDialog: {
      scrollable: true,
    },
  },
});

// чтобы settingsStore мог сделать vuetify.theme.global.name.value = 'dark'
globalThis.__vuetify = vuetify;

export default vuetify;