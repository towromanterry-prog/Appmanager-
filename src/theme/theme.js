// src/theme/theme.js

export const light = {
  dark: false,
  colors: {
    // Нейтральный “paper” фон, не чисто-белый — меньше бликов, мягче
    background: '#FAFAFA',

    // Поверхности (карточки/панели) остаются белыми, чтобы UI “дышал”
    surface: '#FFFFFF',

    // Чуть заметный серо-голубой вариант для подложек/секций
    'surface-variant': '#F1F3F5',

    // Primary спокойный, без “кислоты”
    primary: '#4F6F8A',
    'primary-darken-1': '#425E76',

    // Вторичные — нейтральные
    secondary: '#5B616A',
    'secondary-darken-1': '#444B55',

    // Статусы можно оставить как есть (они редко доминируют в UI)
    error: '#E24A4A',
    info: '#2F7DD1',
    success: '#2FA36B',
    warning: '#C67A00',

    // Текст
    'on-background': '#101418',
    'on-surface': '#101418',

    // Границы/разделители: заметно, но мягко
    'outline-variant': '#D0D5DD',
  },
};

export const dark = {
  dark: true,
  colors: {
    // Очень тёмный, но не “уголь” — мягче для глаз
    background: '#0F1115',

    // Поверхность на шаг светлее, чтобы карточки отличались
    surface: '#151922',

    // Variant ещё на шаг — для подложек, списков, блоков
    'surface-variant': '#1C2230',

    // Primary мягкий (припылённый голубой)
    primary: '#7AA2C7',
    'primary-darken-1': '#6B92B8',

    secondary: '#AAB2BD',
    'secondary-darken-1': '#949EAB',

    error: '#FF6B6B',
    info: '#6AA9FF',
    success: '#4CC38A',
    warning: '#F2A93B',

    'on-background': '#E9EEF5',
    'on-surface': '#E9EEF5',

    // Границы/контуры в тёмной теме: читаемо, но без “грязи”
    'outline-variant': '#2D3648',
  },
};
