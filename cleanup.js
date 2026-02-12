import fs from 'fs';
import path from 'path';

// 1. ВАШ БЕЛЫЙ СПИСОК (То, что оставляем)
const WHITE_LIST = [
  // Models (на всякий случай, хотя мы их пропускаем логикой)
  'src/models/Order.js', 'src/models/Client.js', 'src/models/Tag.js',
  'src/models/ServiceItem.js', 'src/models/DetailItem.js', 'src/models/AppSettings.js',

  // Services
  'src/services/orderService.js', 'src/services/clientService.js', 'src/services/tagService.js',
  'src/services/serviceService.js', 'src/services/detailService.js', 'src/services/settingsService.js',

  // Stores
  'src/stores/orderStore.js', 'src/stores/clientsStore.js', 'src/stores/tagsStore.js',
  'src/stores/serviceStore.js', 'src/stores/detailStore.js', 'src/stores/settingsStore.js',
  'src/stores/confirmationStore.js', 'src/stores/searchStore.js', 'src/stores/themeStore.js',

  // Components
  'src/components/OrderCard.vue',
  'src/components/OrderForm.vue',
  'src/components/ClientFormDialog.vue',
  'src/components/ServiceFormDialog.vue',
  'src/components/DetailSelectionModal.vue',
  'src/components/common/ConfirmationDialog.vue',
  
  // Views
  'src/views/HomeView.vue',
  'src/views/ClientsView.vue',
  'src/views/SettingsView.vue',
  'src/views/BaseSettingsView.vue',

  // System
  'src/App.vue',
  'src/main.js',
  'src/firebase.js',
  'src/router/index.js'
];

const LEGACY_DIR = '_LEGACY';

function moveFile(oldPath, newPath) {
  const dir = path.dirname(newPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.renameSync(oldPath, newPath);
  console.log(`Moved: ${oldPath} -> ${newPath}`);
}

function scanDir(directory) {
  if (!fs.existsSync(directory)) return;
  const files = fs.readdirSync(directory);
  
  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    // Нормализуем путь для сравнения (Windows fix)
    const relativePath = fullPath.replace(/\\/g, '/');

    if (stat.isDirectory()) {
      if (file === 'node_modules' || file === '.git' || file === LEGACY_DIR || file === 'assets' || file === 'public') continue;
      scanDir(fullPath);
    } else {
      // Игнорируем файлы конфигурации в корне (вне src)
      if (!relativePath.startsWith('src/')) continue;

      // Оставляем composables и router, если они есть
      if (relativePath.startsWith('src/composables/') || 
          relativePath.startsWith('src/router/')) {
        continue;
      }

      // Проверяем белый список
      if (WHITE_LIST.some(w => relativePath.endsWith(w) || relativePath === w)) continue;

      // Перемещаем мусор
      const legacyPath = path.join(LEGACY_DIR, relativePath);
      moveFile(fullPath, legacyPath);
    }
  }
}

console.log('--- STARTING CLEANUP ---');
if (!fs.existsSync(LEGACY_DIR)) fs.mkdirSync(LEGACY_DIR);
scanDir('src');
console.log('--- CLEANUP COMPLETE ---');
console.log(`Check the "${LEGACY_DIR}" folder.`);
