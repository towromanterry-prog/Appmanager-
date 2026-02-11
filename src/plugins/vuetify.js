import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Используем тему из theme.js (если она экспортируется как объект)
// или настраиваем базовые цвета здесь, если нужно
import { lightTheme, darkTheme } from '../theme/theme' 

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: {
      mdi,
    },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: lightTheme,
      dark: darkTheme,
    },
  },
  // Глобальные настройки по умолчанию для компонентов (Minimal Soft)
  defaults: {
    global: {
      ripple: false, // Отключаем жесткую волну material design для мягкости
    },
    VCard: {
      elevation: 0, // Тень контролируется через CSS
      color: 'surface',
    },
    VBtn: {
      elevation: 0,
      variant: 'flat',
      height: 44,
    },
    VTextField: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto', 
    },
    VTextarea: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
    },
    VSelect: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
    },
    VAutocomplete: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
    },
    VSwitch: {
      color: 'primary',
      inset: true,
    },
    VDialog: {
      transition: 'dialog-bottom-transition',
    },
  },
})
