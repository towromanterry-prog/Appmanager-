# AGENTS.md — Appmanager

## Project
Appmanager — SPA на Vue 3 + Vite + Vuetify 3 + Pinia.
Цель текущих изменений: единый внешний вид (отступы/радиусы/типографика) и пользовательский масштаб шрифта 70%..200% без поломки лэйаута.

## Stack
- Vue 3
- Vite
- Vuetify 3
- Pinia
- LocalStorage persistence for settings

## Key files / places
- `src/main.js` — bootstrap приложения (Vuetify/Pinia/router/styles).
- `src/App.vue` — общий layout (v-app, v-app-bar, v-main).
- `src/style.css` — глобальные стили и CSS-переменные.
- `src/stores/settingsStore.js` — настройки приложения (persist в localStorage).
- `src/views/SettingsView.vue` — UI настроек.
- Views with fixed topbar offset (нужно убрать хардкод 68px):
  - `src/views/HomeView.vue`
  - `src/views/ClientsView.vue`
  - `src/views/BaseSettingsView.vue`
- `src/components/OrderCard.vue` — содержит “receipt/чек” (фиксированная ширина/px).

## Commands
- Install: `npm ci` (или `npm install`)
- Dev: `npm run dev`
- Build: `npm run build`
- Lint (если есть): `npm run lint`

## UI rules / constraints
1) **Font scale (70%..200%)**
   - Хранить как число `fontScale` (0.7..2.0) в `settingsStore`.
   - Применять глобально через CSS var на `<html>`: `--app-font-scale`.
   - Базовый root-font-size должен быть адаптивным (через `clamp(...)`) и умножаться на `--app-font-scale`.

2) **Top bar height**
   - Высота `v-app-bar` должна зависеть от fontScale (чтобы при 200% не резало контент).
   - Не использовать магическое `68px` в расчётах высоты вьюх: вместо этого CSS var `--app-topbar-height`.
   - Вьюхи должны использовать: `calc(100vh - var(--app-topbar-height, 68px))`.

3) **Receipt must stay stable**
   - В `OrderCard.vue` “receipt/чек” должен оставаться в `px` (фиксированная ширина/шрифты),
     не переводить его на `rem` и не масштабировать через общий fontScale.

4) **Spacing tokens**
   - Для унификации отступов/радиусов добавлять токены в `:root` (например `--s-1..--s-5`, `--r-1..--r-3`)
     и постепенно заменять очевидные кастомные `padding/margin/border-radius` в scoped CSS на токены.
   - Не лезть в стили Vuetify глубоко; менять только наши компоненты/вьюхи.

## PR hygiene
- Держать изменения небольшими и понятными.
- После правок обязательно прогонять `npm run build`.
- Не делать глобальный “редизайн” без явного запроса: только унификация и масштаб шрифта.