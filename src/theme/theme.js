// src/theme/theme.js

export const light = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    'surface-variant': '#F5F5F5',
    primary: '#1976D2',      // Синий (можешь поменять на свой бренд-цвет)
    'primary-darken-1': '#1565C0',
    secondary: '#424242',
    'secondary-darken-1': '#212121',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'on-background': '#000000',
    'on-surface': '#000000',
    'outline-variant': '#BDBDBD', // Нужно для границ карточек в style.css
  }
};

export const dark = {
  dark: true,
  colors: {
    background: '#121212',
    surface: '#212121',
    'surface-variant': '#424242',
    primary: '#2196F3',
    'primary-darken-1': '#1E88E5',
    secondary: '#BDBDBD',
    'secondary-darken-1': '#9E9E9E',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
    'on-background': '#FFFFFF',
    'on-surface': '#FFFFFF',
    'outline-variant': '#616161',
  }
};
