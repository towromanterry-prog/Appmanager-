// src/theme/theme.js

// Светлая тема "Soft Modern"
export const light = {
  dark: false,
  colors: {
    background: '#F8F9FA', // Очень светло-серый, комфортный для глаз
    surface: '#FFFFFF',    // Карточки и панели - чисто белые для контраста
    primary: '#3A76F5',    // Спокойный, но уверенный синий
    secondary: '#EFF2F7',  // Цвет для контейнеров второго уровня (как список заказов)
    'on-background': '#212121',
    'on-surface': '#212121',
    'on-primary': '#FFFFFF',
    'on-secondary': '#212121',
    error: '#B00020',
    info: '#1976D2',
    success: '#43A047',
    warning: '#FB8C00',
    outline: '#E0E0E0', // Для границ
    'outline-variant': '#CFCFCF',
  },
};

// Темная тема "Soft Modern"
export const dark = {
  dark: true,
  colors: {
    background: '#1A1D24', // Глубокий темно-синий
    surface: '#252830',    // Панели и карточки чуть светлее фона
    primary: '#5A95FF',    // Более яркий синий для контраста на темном фоне
    secondary: '#2F333D',  // Контейнеры второго уровня
    'on-background': '#EAEAEA',
    'on-surface': '#EAEAEA',
    'on-primary': '#FFFFFF',
    'on-secondary': '#EAEAEA',
    error: '#CF6679',
    info: '#53A6E8',
    success: '#66BB6A',
    warning: '#FFB74D',
    outline: '#424242',
    'outline-variant': '#555555',
  },
};
