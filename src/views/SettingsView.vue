<template>
  <v-card flat color="background" class="h-100 overflow-y-auto">
    <v-card-title class="pt-4 pb-2 px-4 text-h5 font-weight-bold">
      Настройки
    </v-card-title>

    <v-card-text class="px-4 pb-6">
      <v-alert
        v-if="settingsStore.loading"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Загружаю настройки…
      </v-alert>

      <!-- Типографика -->
      <v-card flat class="mb-4">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon class="mr-2">mdi-format-size</v-icon>
          Шрифт
        </v-card-title>
        <v-card-text>
          <div class="d-flex align-center ga-3">
            <v-btn
              icon="mdi-minus"
              variant="text"
              :disabled="!draft || draft.fontSize <= FONT_MIN"
              @click="stepFont(-1)"
            />
            <div class="flex-grow-1">
              <v-slider
                v-if="draft"
                v-model="draft.fontSize"
                :min="FONT_MIN"
                :max="FONT_MAX"
                :step="1"
                hide-details
                @end="commitFontSize"
              />
              <div class="d-flex justify-space-between text-caption text-medium-emphasis mt-1">
                <span>{{ FONT_MIN }}px</span>
                <span v-if="draft" class="font-weight-bold">{{ draft.fontSize }}px</span>
                <span>{{ FONT_MAX }}px</span>
              </div>
            </div>
            <v-btn
              icon="mdi-plus"
              variant="text"
              :disabled="!draft || draft.fontSize >= FONT_MAX"
              @click="stepFont(1)"
            />
          </div>

          <div class="mt-4">
            <div class="text-caption text-medium-emphasis mb-2">Пример текста</div>
            <div class="preview-box rounded-lg pa-3">
              <div class="text-body-2">
                Быстрая проверка масштаба: заголовки, списки, поля ввода.
              </div>
              <v-text-field
                class="mt-3"
                density="compact"
                variant="outlined"
                label="Поле ввода (пример)"
                hide-details
              />
            </div>
          </div>
        </v-card-text>
      </v-card>

      <!-- Язык и валюта -->
      <v-card flat class="mb-4">
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon class="mr-2">mdi-translate</v-icon>
          Язык и валюта
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-select
                v-if="draft"
                v-model="draft.language"
                :items="LANGUAGES"
                item-title="title"
                item-value="value"
                label="Язык"
                variant="outlined"
                density="compact"
                hide-details
                @update:model-value="commitField('language', $event)"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-if="draft"
                v-model="draft.currency"
                :items="CURRENCIES"
                item-title="title"
                item-value="value"
                label="Валюта"
                variant="outlined"
                density="compact"
                hide-details
                @update:model-value="commitField('currency', $event)"
              />
            </v-col>
          </v-row>

          <div v-if="draft" class="text-caption text-medium-emphasis mt-2">
            Сейчас: язык — <b>{{ draft.language }}</b>, валюта — <b>{{ draft.currency }}</b>
          </div>
        </v-card-text>
      </v-card>

      <!-- Тема -->
      <v-card flat>
        <v-card-title class="text-subtitle-1 font-weight-bold d-flex align-center">
          <v-icon class="mr-2">mdi-palette</v-icon>
          Тема
        </v-card-title>
        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-3">
            Выбор темы применится сразу и сохранится.
          </p>

          <v-row dense>
            <v-col
              v-for="t in themes"
              :key="t.key"
              cols="12"
              md="6"
            >
              <v-card
                class="theme-card"
                variant="outlined"
                :class="{ 'theme-card--active': currentTheme === t.key }"
                @click="setTheme(t.key)"
              >
                <v-card-text class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center ga-2">
                    <div class="text-h6">{{ t.emoji }}</div>
                    <div>
                      <div class="text-body-1 font-weight-bold">{{ t.name }}</div>
                      <div class="text-caption text-medium-emphasis">{{ t.key }}</div>
                    </div>
                  </div>

                  <div class="d-flex ga-1">
                    <span class="swatch" :style="{ background: t.colors.background }" />
                    <span class="swatch" :style="{ background: t.colors.surface }" />
                    <span class="swatch" :style="{ background: t.colors.primary }" />
                    <span class="swatch" :style="{ background: t.colors['outline-variant'] }" />
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <div class="text-caption text-medium-emphasis mt-2">
            Активная тема: <b>{{ currentTheme }}</b>
          </div>
        </v-card-text>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import AppSettings from '@/models/AppSettings';

const settingsStore = useSettingsStore();
const themeStore = useThemeStore();

const FONT_MIN = 12;
const FONT_MAX = 22;

const LANGUAGES = [
  { title: 'Русский', value: 'ru' },
  { title: 'English', value: 'en' },
];

const CURRENCIES = [
  { title: 'RUB ₽', value: 'RUB' },
  { title: 'KZT ₸', value: 'KZT' },
  { title: 'USD $', value: 'USD' },
  { title: 'EUR €', value: 'EUR' },
];

const themes = computed(() => themeStore.getThemesList());
const currentTheme = computed(() => themeStore.theme);

const draft = ref(null);

onMounted(async () => {
  // Загружаем persisted settings
  if (!settingsStore.settings && !settingsStore.loading) {
    await settingsStore.loadSettings();
  }

  // Загружаем тему из localStorage (themeStore живёт отдельно)
  themeStore.loadTheme();

  // Если settings ещё нет — используем дефолтную модель
  if (!settingsStore.settings) {
    draft.value = new AppSettings();
  } else {
    draft.value = settingsStore.settings.clone();
  }

  // Если в settings сохранена тема — применим её в themeStore приоритетно
  if (draft.value?.theme && (draft.value.theme === 'light' || draft.value.theme === 'dark')) {
    themeStore.setTheme(draft.value.theme);
  }
});

// Когда settings подтянулись/изменились — обновляем draft
watch(
  () => settingsStore.settings,
  (val) => {
    if (!val) return;
    draft.value = val.clone();

    // синхронизация темы (если settings “обогнал” localStorage)
    if (draft.value?.theme && (draft.value.theme === 'light' || draft.value.theme === 'dark')) {
      themeStore.setTheme(draft.value.theme);
    }
  }
);

function commit(nextSettings) {
  settingsStore.updateSettings(nextSettings);
}

function commitField(field, value) {
  if (!draft.value) return;
  const next = draft.value.clone();
  next[field] = value;
  draft.value = next;
  commit(next);
}

function commitFontSize() {
  if (!draft.value) return;
  const v = Number(draft.value.fontSize);
  const clamped = Math.min(FONT_MAX, Math.max(FONT_MIN, isFinite(v) ? v : 16));
  if (clamped !== draft.value.fontSize) {
    draft.value.fontSize = clamped;
  }
  commitField('fontSize', draft.value.fontSize);
}

function stepFont(delta) {
  if (!draft.value) return;
  const nextVal = Math.min(FONT_MAX, Math.max(FONT_MIN, (draft.value.fontSize || 16) + delta));
  draft.value.fontSize = nextVal;
  commitField('fontSize', nextVal);
}

function setTheme(key) {
  if (key !== 'light' && key !== 'dark') return;

  // 1) применяем тему в реальном themeStore
  themeStore.setTheme(key);

  // 2) сохраняем в settings (чтобы было единообразно в твоей модели AppSettings)
  commitField('theme', key);
}
</script>

<style scoped>
.preview-box {
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.theme-card {
  cursor: pointer;
  transition: transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease;
}

.theme-card:hover {
  transform: translateY(-1px);
}

.theme-card--active {
  border-color: rgba(79, 111, 138, 0.65);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
}

.swatch {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  display: inline-block;
}
</style>
