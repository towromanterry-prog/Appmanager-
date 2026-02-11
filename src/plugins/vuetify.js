import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Импортируем объекты тем
import { light, dark } from '../theme/theme' 

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
      // ИСПРАВЛЕНО: используем те имена, которые импортировали (light и dark)
      light: light,
      dark: dark,
    },
  },
  // Глобальные настройки по умолчанию для компонентов (Minimal Soft)
  defaults: {
    global: {
      ripple: false, // Отключаем жесткую волну
    },
    VCard: {
      elevation: 0, 
      color: 'surface',
      // Класс для скруглений задан в CSS, но можно продублировать и тут
    },
    VBtn: {
      elevation: 0,
      variant: 'flat',
      height: 44,
      rounded: 'lg' // Скругление кнопок
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
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VAutocomplete: {
      variant: 'outlined',
      color: 'primary',
      density: 'comfortable',
      hideDetails: 'auto',
    },
    VSwitch: {
      color: 'primary',
      inset: true,
      hideDetails: 'auto',
    },
    VDialog: {
      transition: 'dialog-bottom-transition',
    },
    VMenu: {
      transition: 'scale-transition',
    }
  },
})
