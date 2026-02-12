<!-- src/views/SettingsView.vue -->
<template>
  <v-container class="py-4" style="max-width: 980px;">
    <div class="d-flex align-center justify-space-between mb-4">
      <div>
        <div class="text-h6">Настройки</div>
        <div class="text-body-2 text-medium-emphasis">Интерфейс, статусы и шаблоны сообщений</div>
      </div>

      <v-btn
        variant="tonal"
        :loading="settingsStore.loading"
        @click="reload"
        prepend-icon="mdi-refresh"
      >
        Обновить
      </v-btn>
    </div>

    <v-alert v-if="settingsStore.error" type="error" variant="tonal" class="mb-4">
      Не удалось загрузить или сохранить настройки. Проверь консоль/сеть.
    </v-alert>

    <!-- UI -->
    <v-row dense>
      <!-- Appearance -->
      <v-col cols="12" md="6">
        <v-card variant="flat" class="pa-4">
          <div class="text-subtitle-1 mb-3">Внешний вид</div>

          <!-- Theme -->
          <div class="mb-4">
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-body-1">Тема</div>
                <div class="text-body-2 text-medium-emphasis">Сохраняется локально и в settings</div>
              </div>

              <v-btn
                size="small"
                variant="tonal"
                @click="toggleTheme"
                prepend-icon="mdi-theme-light-dark"
              >
                Переключить
              </v-btn>
            </div>

            <v-select
              v-model="themeKey"
              :items="themesList"
              item-title="name"
              item-value="key"
              density="comfortable"
              variant="outlined"
              hide-details
            >
              <template #selection="{ item }">
                <div class="d-flex align-center ga-2">
                  <span>{{ item.raw.emoji }}</span>
                  <span>{{ item.raw.name }}</span>
                </div>
              </template>
              <template #item="{ props, item }">
                <v-list-item v-bind="props">
                  <template #title>
                    <div class="d-flex align-center ga-2">
                      <span>{{ item.raw.emoji }}</span>
                      <span>{{ item.raw.name }}</span>
                    </div>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <!-- Font size -->
          <div>
            <div class="d-flex align-center justify-space-between mb-2">
              <div>
                <div class="text-body-1">Размер шрифта</div>
                <div class="text-body-2 text-medium-emphasis">В px (применяется сразу)</div>
              </div>

              <div class="d-flex align-center ga-2">
                <v-btn
                  size="small"
                  variant="tonal"
                  icon="mdi-minus"
                  :disabled="fontSize <= FONT_MIN"
                  @click="stepFont(-1)"
                />
                <v-text-field
                  v-model.number="fontSizeInput"
                  type="number"
                  density="compact"
                  variant="outlined"
                  style="width: 92px;"
                  hide-details
                  :min="FONT_MIN"
                  :max="FONT_MAX"
                  @blur="commitFontSizeFromInput"
                  @keyup.enter="commitFontSizeFromInput"
                />
                <v-btn
                  size="small"
                  variant="tonal"
                  icon="mdi-plus"
                  :disabled="fontSize >= FONT_MAX"
                  @click="stepFont(1)"
                />
              </div>
            </div>

            <v-slider
              v-model="fontSize"
              :min="FONT_MIN"
              :max="FONT_MAX"
              :step="1"
              density="comfortable"
              hide-details
              thumb-label
            />
          </div>
        </v-card>
      </v-col>

      <!-- Behavior -->
      <v-col cols="12" md="6">
        <v-card variant="flat" class="pa-4">
          <div class="text-subtitle-1 mb-3">Поведение</div>

          <v-switch
            v-model="compactMode"
            density="comfortable"
            inset
            hide-details
            class="mb-2"
            label="Компактный режим списков"
          />

          <v-switch
            v-model="enableHapticFeedback"
            density="comfortable"
            inset
            hide-details
            class="mb-4"
            label="Вибро-отклик (haptic)"
          />

          <v-select
            v-model="swipeRightAction"
            :items="swipeActions"
            item-title="title"
            item-value="value"
            density="comfortable"
            variant="outlined"
            hide-details
            label="Действие свайпа вправо"
            class="mb-4"
          />

          <v-switch
            v-model="showArchivedOrders"
            density="comfortable"
            inset
            hide-details
            label="Показывать архивные заказы"
          />
        </v-card>
      </v-col>

      <!-- Statuses -->
      <v-col cols="12">
        <v-card variant="flat" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-1">Статусы заказов</div>
              <div class="text-body-2 text-medium-emphasis">
                Настройка подписей + дефолтного статуса
              </div>
            </div>

            <v-btn
              variant="tonal"
              size="small"
              prepend-icon="mdi-restore"
              @click="resetStatusesToDefault"
            >
              Сбросить по умолчанию
            </v-btn>
          </div>

          <v-row dense>
            <v-col cols="12" md="3" v-for="s in statusRows" :key="s.key">
              <v-text-field
                v-model="s.label"
                density="comfortable"
                variant="outlined"
                :label="`Статус: ${s.key}`"
                hide-details
                @blur="commitStatusLabel(s.key, s.label)"
                @keyup.enter="commitStatusLabel(s.key, s.label)"
              />
            </v-col>
          </v-row>

          <div class="d-flex flex-wrap align-center ga-4 mt-4">
            <v-select
              v-model="defaultOrderStatus"
              :items="statusList"
              item-title="label"
              item-value="key"
              density="comfortable"
              variant="outlined"
              hide-details
              label="Статус по умолчанию"
              style="min-width: 280px;"
            />

            <v-switch
              v-model="syncOrderToServiceStatus"
              density="comfortable"
              inset
              hide-details
              label="Синхронизировать статусы Заказ ↔ Услуга"
            />
          </div>
        </v-card>
      </v-col>

      <!-- Templates -->
      <v-col cols="12">
        <v-card variant="flat" class="pa-4">
          <div class="d-flex align-center justify-space-between mb-3">
            <div>
              <div class="text-subtitle-1">Шаблоны сообщений</div>
              <div class="text-body-2 text-medium-emphasis">Используются при отправке/уведомлениях</div>
            </div>

            <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="openAddTemplate">
              Добавить
            </v-btn>
          </div>

          <v-divider class="mb-2" />

          <v-list density="comfortable" lines="two">
            <template v-if="messageTemplates.length">
              <v-list-item
                v-for="t in messageTemplates"
                :key="t.id"
                class="rounded-lg"
              >
                <template #title>
                  <div class="d-flex align-center justify-space-between ga-2">
                    <span class="text-body-1">{{ t.title }}</span>
                    <div class="d-flex ga-1">
                      <v-btn
                        size="small"
                        variant="text"
                        icon="mdi-pencil"
                        @click="openEditTemplate(t)"
                      />
                      <v-btn
                        size="small"
                        variant="text"
                        icon="mdi-delete-outline"
                        @click="removeTemplate(t.id)"
                      />
                    </div>
                  </div>
                </template>
                <template #subtitle>
                  <div class="text-body-2 text-medium-emphasis" style="white-space: pre-wrap;">
                    {{ t.text }}
                  </div>
                </template>
              </v-list-item>
            </template>

            <v-list-item v-else>
              <v-list-item-title class="text-body-2 text-medium-emphasis">
                Пока нет шаблонов.
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>

    <!-- Template dialog -->
    <v-dialog v-model="templateDialog" max-width="720">
      <v-card class="pa-4">
        <div class="d-flex align-center justify-space-between mb-2">
          <div class="text-subtitle-1">{{ editingTemplate ? 'Редактировать шаблон' : 'Новый шаблон' }}</div>
          <v-btn icon="mdi-close" variant="text" @click="closeTemplateDialog" />
        </div>

        <v-text-field
          v-model="templateForm.title"
          density="comfortable"
          variant="outlined"
          label="Заголовок"
          class="mb-3"
        />
        <v-textarea
          v-model="templateForm.text"
          density="comfortable"
          variant="outlined"
          label="Текст"
          auto-grow
          rows="4"
        />

        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="closeTemplateDialog">Отмена</v-btn>
          <v-btn variant="tonal" @click="saveTemplate" :disabled="!templateForm.title?.trim() || !templateForm.text?.trim()">
            Сохранить
          </v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import AppSettings from '@/models/AppSettings';

const settingsStore = useSettingsStore();
const themeStore = useThemeStore();

const FONT_MIN = 12;
const FONT_MAX = 22;

const swipeActions = [
  { title: 'Завершить', value: 'complete' },
  { title: 'Архивировать', value: 'archive' },
  { title: 'Ничего', value: 'none' },
];

// --- Load ---
async function reload() {
  await settingsStore.loadSettings();
  // После загрузки — синхронизируем themeStore и применяем масштаб шрифта
  syncThemeStores();
  applyFontScale(settingsStore.settings.fontSize);
}

onMounted(async () => {
  themeStore.loadTheme();
  await reload();
});

// --- Helpers ---
function applyFontScale(px) {
  const safe = clampInt(px, FONT_MIN, FONT_MAX);
  const scale = safe / 16;
  document.documentElement.style.setProperty('--app-font-scale', String(scale));
}

function clampInt(v, min, max) {
  const n = Number.isFinite(Number(v)) ? Number(v) : min;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function syncThemeStores() {
  // Источник правды для UI темы: settings + themeStore должны совпадать
  const s = settingsStore.settings.theme;
  const t = themeStore.theme;
  if (s === 'light' || s === 'dark') {
    if (t !== s) themeStore.setTheme(s);
  } else {
    // если в settings что-то странное — приводим к themeStore
    settingsStore.updateField('theme', t.value);
  }
}

// --- Computed bindings to settingsStore.settings ---
const themesList = computed(() => themeStore.getThemesList());

const themeKey = computed({
  get: () => settingsStore.settings.theme,
  set: async (val) => {
    if (val !== 'light' && val !== 'dark') return;
    themeStore.setTheme(val);
    await settingsStore.updateField('theme', val);
  },
});

function toggleTheme() {
  const next = themeKey.value === 'light' ? 'dark' : 'light';
  themeKey.value = next;
}

const fontSize = computed({
  get: () => clampInt(settingsStore.settings.fontSize, FONT_MIN, FONT_MAX),
  set: async (val) => {
    const safe = clampInt(val, FONT_MIN, FONT_MAX);
    applyFontScale(safe);
    await settingsStore.updateField('fontSize', safe);
  },
});

const fontSizeInput = ref(16);
watch(
  () => fontSize.value,
  (v) => {
    fontSizeInput.value = v;
  },
  { immediate: true }
);

function stepFont(delta) {
  fontSize.value = clampInt(fontSize.value + delta, FONT_MIN, FONT_MAX);
}

function commitFontSizeFromInput() {
  fontSize.value = clampInt(fontSizeInput.value, FONT_MIN, FONT_MAX);
}

const compactMode = computed({
  get: () => !!settingsStore.settings.compactMode,
  set: (val) => settingsStore.updateField('compactMode', !!val),
});

const enableHapticFeedback = computed({
  get: () => !!settingsStore.settings.enableHapticFeedback,
  set: (val) => settingsStore.updateField('enableHapticFeedback', !!val),
});

const swipeRightAction = computed({
  get: () => settingsStore.settings.swipeRightAction,
  set: (val) => settingsStore.updateField('swipeRightAction', val),
});

const showArchivedOrders = computed({
  get: () => !!settingsStore.settings.showArchivedOrders,
  set: (val) => settingsStore.updateField('showArchivedOrders', !!val),
});

const syncOrderToServiceStatus = computed({
  get: () => !!settingsStore.settings.syncOrderToServiceStatus,
  set: (val) => settingsStore.updateField('syncOrderToServiceStatus', !!val),
});

const defaultOrderStatus = computed({
  get: () => settingsStore.settings.defaultOrderStatus,
  set: (val) => settingsStore.updateField('defaultOrderStatus', val),
});

const statusList = computed(() => settingsStore.settings.statusList || []);
const statusRows = computed(() => {
  // делаем реактивные копии для инпутов
  const map = settingsStore.settings.orderStatuses || {};
  return Object.entries(map).map(([key, label]) => ({ key, label }));
});

async function commitStatusLabel(key, label) {
  const next = { ...(settingsStore.settings.orderStatuses || {}) };
  next[key] = (label ?? '').toString().trim() || next[key] || key;
  await settingsStore.updateField('orderStatuses', next);
}

async function resetStatusesToDefault() {
  const defaults = new AppSettings().orderStatuses;
  await settingsStore.updateField('orderStatuses', defaults);
  // если дефолтный статус вдруг не существует — поправим
  const keys = Object.keys(defaults);
  if (!keys.includes(settingsStore.settings.defaultOrderStatus)) {
    await settingsStore.updateField('defaultOrderStatus', keys[0] || 'accepted');
  }
}

// --- Templates ---
const messageTemplates = computed(() => settingsStore.settings.messageTemplates || []);

const templateDialog = ref(false);
const editingTemplate = ref(null);

const templateForm = reactive({
  id: '',
  title: '',
  text: '',
});

function openAddTemplate() {
  editingTemplate.value = null;
  templateForm.id = `t_${Date.now()}`;
  templateForm.title = '';
  templateForm.text = '';
  templateDialog.value = true;
}

function openEditTemplate(t) {
  editingTemplate.value = t;
  templateForm.id = t.id;
  templateForm.title = t.title;
  templateForm.text = t.text;
  templateDialog.value = true;
}

function closeTemplateDialog() {
  templateDialog.value = false;
}

async function saveTemplate() {
  const title = (templateForm.title || '').trim();
  const text = (templateForm.text || '').trim();
  if (!title || !text) return;

  const current = [...(settingsStore.settings.messageTemplates || [])];
  const idx = current.findIndex(x => x.id === templateForm.id);

  const nextItem = { id: templateForm.id, title, text };
  if (idx >= 0) current.splice(idx, 1, nextItem);
  else current.unshift(nextItem);

  await settingsStore.updateField('messageTemplates', current);
  closeTemplateDialog();
}

async function removeTemplate(id) {
  const current = [...(settingsStore.settings.messageTemplates || [])];
  const next = current.filter(t => t.id !== id);
  await settingsStore.updateField('messageTemplates', next);
}
</script>

<style scoped>
/* Ничего агрессивного — пусть общий “soft minimal” ведёт стиль */
</style>
