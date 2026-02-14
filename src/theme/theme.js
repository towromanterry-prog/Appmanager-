// src/theme/theme.js
// Soft-minimal palette for Vuetify (light/dark).
// Only theme colors — no business logic.

export const light = {
  dark: false,
  colors: {
    // Neutral surfaces (soft, slightly warm/gray)
    background: '#FAFAFB',
    surface: '#FFFFFF',
    'surface-variant': '#F3F4F6',

    // Text / readability
    'on-background': '#0F172A',
    'on-surface': '#0F172A',

    // Calm primary (not acidic)
    primary: '#4F6D9A',
    'on-primary': '#FFFFFF',
    'primary-darken-1': '#425C82',
    'primary-lighten-1': '#6E8AB3',

    // Secondary / accents (quiet)
    secondary: '#64748B',
    'on-secondary': '#FFFFFF',
    'secondary-darken-1': '#526175',

    // Borders / dividers (soft)
    outline: '#D4D8E1',
    'outline-variant': '#E6E8EE',

    // Status colors (kept readable, not neon)
    error: '#D64545',
    'on-error': '#FFFFFF',
    warning: '#B46A1C',
    'on-warning': '#FFFFFF',
    info: '#2B6CB0',
    'on-info': '#FFFFFF',
    success: '#2F855A',
    'on-success': '#FFFFFF',
  },
};

export const dark = {
  dark: true,
  colors: {
    // Neutral dark surfaces (no pure black, less contrast fatigue)
    background: '#0B1220',
    surface: '#0F172A',
    'surface-variant': '#141F35',

    // Text / readability
    'on-background': '#E6EAF2',
    'on-surface': '#E6EAF2',

    // Calm primary in dark mode
    primary: '#7FA2D6',
    'on-primary': '#0B1220',
    'primary-darken-1': '#6B8FC8',
    'primary-lighten-1': '#93B3E0',

    // Secondary / accents
    secondary: '#A7B1C2',
    'on-secondary': '#0B1220',
    'secondary-darken-1': '#8E98AA',

    // Borders / dividers (soft, visible on dark)
    outline: '#2A3854',
    'outline-variant': '#1F2B44',

    // Status colors (soft but visible)
    error: '#F07171',
    'on-error': '#0B1220',
    warning: '#F0A35A',
    'on-warning': '#0B1220',
    info: '#74B2E8',
    'on-info': '#0B1220',
    success: '#63C08D',
    'on-success': '#0B1220',
  },
};
