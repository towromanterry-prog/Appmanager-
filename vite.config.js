import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      autoImport: true, // Автоматически импортировать компоненты и директивы
    }),
  ],
  base: './', // Оставляем относительные пути для корректной работы после сборки
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // Включаем минификацию CSS для продакшн-сборки
    cssMinify: true,
  }
});