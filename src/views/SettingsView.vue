<template>
  <AppPage>
    <!-- global haptics (all taps) -->
    <div class="app-stack" style="gap: var(--s-4);" @click.capture="onAnyTap">
      <!-- Account -->
      <AppCard class="sv-surface-card sv-card-pad16">
        <div class="sv-row sv-row--space" style="gap: var(--s-3);">
          <div class="app-stack" style="gap: var(--s-1); min-width: 0;">
            <div :style="{ fontSize: textCaption, opacity: 0.75 }">Аккаунт</div>
            <div :style="{ fontSize: textMain, fontWeight: 600 }" class="text-truncate">
              <span v-if="authStore.user">
                {{ authStore.user.displayName || authStore.user.email }}
              </span>
              <span v-else>Войдите для синхронизации</span>
            </div>
          </div>

          <div class="sv-row" style="gap: var(--s-2); flex: 0 0 auto;">
            <v-btn
              v-if="!authStore.user"
              color="primary"
              size="small"
              prepend-icon="mdi-google"
              :loading="authStore.loading"
              @click="handleLogin"
            >
              Войти
            </v-btn>
            <v-btn
              v-else
              variant="text"
              color="error"
              size="small"
              prepend-icon="mdi-logout"
              :loading="authStore.loading"
              @click="handleLogout"
            >
              Выйти
            </v-btn>
          </div>
        </div>
      </AppCard>

      <!-- Внешний вид -->
      <AppCard class="sv-surface-card sv-acc">
        <div
          class="sv-acc-head"
          role="button"
          tabindex="0"
          v-ripple
          :aria-expanded="sections.appearance"
          @click="toggleSection('appearance')"
          @keydown.enter.prevent="toggleSection('appearance')"
          @keydown.space.prevent="toggleSection('appearance')"
        >
          <div class="sv-acc-left">
            <v-icon icon="mdi-palette-outline" size="20" />
            <div class="sv-acc-text">
              <div class="sv-acc-title" :style="{ fontSize: textTitle }">Внешний вид</div>
              <div class="sv-acc-sub" :style="{ fontSize: textCaption }">{{ appearanceHint }}</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-down" class="sv-chevron" :class="{ 'sv-chevron--open': sections.appearance }" />
        </div>

        <v-expand-transition>
          <div v-show="sections.appearance" class="sv-acc-body">
            <v-divider />
            <div class="sv-acc-pad app-stack" style="gap: var(--s-3);">
              <div class="sv-row sv-row--space" style="gap: var(--s-3);">
                <div class="app-stack" style="gap: var(--s-1);">
                  <div :style="{ fontSize: textMain, fontWeight: 600 }">Тема</div>
                  <div :style="{ fontSize: textCaption, opacity: 0.75 }">Светлая / тёмная</div>
                </div>
                <v-switch
                  :model-value="themeKey === 'dark'"
                  color="primary"
                  hide-details
                  @update:model-value="(v) => (themeKey = v ? 'dark' : 'light')"
                />
              </div>

              <div><v-divider /></div>

              <div class="sv-row sv-row--space" style="gap: var(--s-3);">
                <div class="app-stack" style="gap: var(--s-1);">
                  <div :style="{ fontSize: textMain, fontWeight: 600 }">Размер шрифта</div>
                  <div :style="{ fontSize: textCaption, opacity: 0.75 }">Масштаб интерфейса</div>
                </div>

                <div class="sv-row" style="gap: var(--s-2);">
                  <v-btn size="x-small" variant="text" icon="mdi-minus" @click.stop="decFontSize" />
                  <div class="sv-mono" :style="{ fontSize: textMain, minWidth: '4.5rem', textAlign: 'right' }">
                    {{ fontSize }}px
                  </div>
                  <v-btn size="x-small" variant="text" icon="mdi-plus" @click.stop="incFontSize" />
                </div>
              </div>

              <v-slider
                :model-value="fontSizeDraft"
                :min="12"
                :max="22"
                :step="1"
                color="primary"
                hide-details
                @update:model-value="(v) => (fontSizeDraft = v)"
                @end="commitFontSize"
              />
            </div>
          </div>
        </v-expand-transition>
      </AppCard>

      <!-- Заказы -->
      <AppCard class="sv-surface-card sv-acc">
        <div
          class="sv-acc-head"
          role="button"
          tabindex="0"
          v-ripple
          :aria-expanded="sections.orders"
          @click="toggleSection('orders')"
          @keydown.enter.prevent="toggleSection('orders')"
          @keydown.space.prevent="toggleSection('orders')"
        >
          <div class="sv-acc-left">
            <v-icon icon="mdi-clipboard-text-outline" size="20" />
            <div class="sv-acc-text">
              <div class="sv-acc-title" :style="{ fontSize: textTitle }">Заказы</div>
              <div class="sv-acc-sub" :style="{ fontSize: textCaption }">{{ ordersHint }}</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-down" class="sv-chevron" :class="{ 'sv-chevron--open': sections.orders }" />
        </div>

        <v-expand-transition>
          <div v-show="sections.orders" class="sv-acc-body">
            <v-divider />
            <div class="sv-acc-pad app-stack" style="gap: var(--s-3);">
              <div class="app-stack" style="gap: var(--s-2);">
                <v-switch v-model="showCancelled" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Показывать отменённые</span>
                  </template>
                </v-switch>

                <v-switch v-model="showCompletedOrders" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Показывать завершённые</span>
                  </template>
                </v-switch>
              </div>

              <div><v-divider /></div>

              <div class="app-stack" style="gap: var(--s-2);">
                <div :style="{ fontSize: textCaption, opacity: 0.75 }">Обязательные поля в форме заказа</div>

                <div class="sv-grid-2">
                  <v-checkbox
                    v-for="(label, key) in requiredFieldLabels"
                    :key="key"
                    :model-value="!!requiredFields[key]"
                    color="primary"
                    hide-details
                    @update:model-value="(v) => setRequiredField(key, v)"
                  >
                    <template #label>
                      <span :style="{ fontSize: textMain }">{{ label }}</span>
                    </template>
                  </v-checkbox>
                </div>

                <div class="sv-row sv-row--space" style="gap: var(--s-3);">
                  <div style="flex: 1; min-width: 0;">
                    <v-text-field v-model.lazy="orderFormLastNameLabel" hide-details>
                      <template #label>
                        <span :style="{ fontSize: textMain }">Название поля «Фамилия»</span>
                      </template>
                    </v-text-field>
                  </div>

                  <v-checkbox
                    :model-value="!!requiredFields.lastName"
                    color="primary"
                    hide-details
                    @update:model-value="(v) => setRequiredField('lastName', v)"
                  >
                    <template #label>
                      <span :style="{ fontSize: textMain }">Обязательное</span>
                    </template>
                  </v-checkbox>
                </div>
              </div>
            </div>
          </div>
        </v-expand-transition>
      </AppCard>

      <!-- Статусы и синхронизация -->
      <AppCard class="sv-surface-card sv-acc">
        <div
          class="sv-acc-head"
          role="button"
          tabindex="0"
          v-ripple
          :aria-expanded="sections.statuses"
          @click="toggleSection('statuses')"
          @keydown.enter.prevent="toggleSection('statuses')"
          @keydown.space.prevent="toggleSection('statuses')"
        >
          <div class="sv-acc-left">
            <v-icon icon="mdi-sync" size="20" />
            <div class="sv-acc-text">
              <div class="sv-acc-title" :style="{ fontSize: textTitle }">Статусы и синхронизация</div>
              <div class="sv-acc-sub" :style="{ fontSize: textCaption }">{{ statusesHint }}</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-down" class="sv-chevron" :class="{ 'sv-chevron--open': sections.statuses }" />
        </div>

        <v-expand-transition>
          <div v-show="sections.statuses" class="sv-acc-body">
            <v-divider />
            <div class="sv-acc-pad app-stack" style="gap: var(--s-3);">
              <v-text-field v-model.lazy="additionalStatusName" hide-details>
                <template #label>
                  <span :style="{ fontSize: textMain }">Название статуса «Ожидание»</span>
                </template>
              </v-text-field>

              <div class="sv-grid-2">
                <v-select
                  v-model="orderStatuses"
                  :items="orderStatusItems"
                  item-title="title"
                  item-value="value"
                  :return-object="false"
                  multiple
                  chips
                  hide-details
                  @update:model-value="hapticTap"
                  @update:menu="val => val && hapticTap()"
                >
                  <template #label>
                    <span :style="{ fontSize: textMain }">Статусы заказа (видимые)</span>
                  </template>
                </v-select>

                <v-select
                  v-model="serviceStatuses"
                  :items="serviceStatusItems"
                  item-title="title"
                  item-value="value"
                  :return-object="false"
                  multiple
                  chips
                  hide-details
                  @update:model-value="hapticTap"
                  @update:menu="val => val && hapticTap()"
                >
                  <template #label>
                    <span :style="{ fontSize: textMain }">Статусы услуг (видимые)</span>
                  </template>
                </v-select>
              </div>

              <div class="sv-grid-2">
                <v-select
                  v-model="detailStatuses"
                  :items="detailStatusItems"
                  item-title="title"
                  item-value="value"
                  :return-object="false"
                  multiple
                  chips
                  hide-details
                  @update:model-value="hapticTap"
                  @update:menu="val => val && hapticTap()"                  
                >
                  <template #label>
                    <span :style="{ fontSize: textMain }">Статусы деталей/расходников (видимые)</span>
                  </template>
                </v-select>

                <v-select
                  v-model="fullCalendarIndicatorStatuses"
                  :items="orderStatusItems"
                  item-title="title"
                  item-value="value"
                  :return-object="false"
                  multiple
                  chips
                  hide-details
                  @update:model-value="hapticTap"
                  @update:menu="val => val && hapticTap()"
                >
                  <template #label>
                    <span :style="{ fontSize: textMain }">Индикаторы в календаре</span>
                  </template>
                </v-select>
              </div>

              <div><v-divider /></div>

              <div class="sv-grid-2">
                <v-switch v-model="syncServiceToOrderStatus" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Синхронизировать статус услуги → заказа</span>
                  </template>
                </v-switch>
                <v-switch v-model="syncOrderToServiceStatus" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Синхронизировать статус заказа → услуги</span>
                  </template>
                </v-switch>
              </div>
            </div>
          </div>
        </v-expand-transition>
      </AppCard>

      <!-- Удобство -->
      <AppCard class="sv-surface-card sv-acc">
        <div
          class="sv-acc-head"
          role="button"
          tabindex="0"
          v-ripple
          :aria-expanded="sections.ux"
          @click="toggleSection('ux')"
          @keydown.enter.prevent="toggleSection('ux')"
          @keydown.space.prevent="toggleSection('ux')"
        >
          <div class="sv-acc-left">
            <v-icon icon="mdi-hand-okay" size="20" />
            <div class="sv-acc-text">
              <div class="sv-acc-title" :style="{ fontSize: textTitle }">Удобство</div>
              <div class="sv-acc-sub" :style="{ fontSize: textCaption }">{{ uxHint }}</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-down" class="sv-chevron" :class="{ 'sv-chevron--open': sections.ux }" />
        </div>

        <v-expand-transition>
          <div v-show="sections.ux" class="sv-acc-body">
            <v-divider />
            <div class="sv-acc-pad app-stack" style="gap: var(--s-3);">
              <v-text-field v-model.lazy="detailsTabLabel" hide-details>
                <template #label>
                  <span :style="{ fontSize: textMain }">Название вкладки «Детали»</span>
                </template>
              </v-text-field>

              <div class="app-stack" style="gap: var(--s-2);">
                <v-switch v-model="enablePullToRefresh" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Включить pull-to-refresh</span>
                  </template>
                </v-switch>

                <v-switch v-model="enableHapticFeedback" color="primary" hide-details>
                  <template #label>
                    <span :style="{ fontSize: textMain }">Виброотклик (если поддерживается)</span>
                  </template>
                </v-switch>
              </div>
            </div>
          </div>
        </v-expand-transition>
      </AppCard>

      <!-- Шаблоны сообщений -->
      <AppCard class="sv-surface-card sv-acc">
        <div
          class="sv-acc-head"
          role="button"
          tabindex="0"
          v-ripple
          :aria-expanded="sections.templates"
          @click="toggleSection('templates')"
          @keydown.enter.prevent="toggleSection('templates')"
          @keydown.space.prevent="toggleSection('templates')"
        >
          <div class="sv-acc-left">
            <v-icon icon="mdi-message-text-outline" size="20" />
            <div class="sv-acc-text">
              <div class="sv-acc-title" :style="{ fontSize: textTitle }">Шаблоны сообщений</div>
              <div class="sv-acc-sub" :style="{ fontSize: textCaption }">{{ templatesHint }}</div>
            </div>
          </div>
          <v-icon icon="mdi-chevron-down" class="sv-chevron" :class="{ 'sv-chevron--open': sections.templates }" />
        </div>

        <v-expand-transition>
          <div v-show="sections.templates" class="sv-acc-body">
            <v-divider />
            <div class="sv-acc-pad app-stack" style="gap: var(--s-3);">
              <div class="sv-row sv-row--space" style="gap: var(--s-3);">
                <div class="app-stack" style="gap: var(--s-1); min-width: 0;">
                  <div :style="{ fontSize: textCaption, opacity: 0.75 }">Быстрые заготовки для сообщений клиенту</div>
                  <div :style="{ fontSize: textCaption, opacity: 0.75 }">
                    В шаблонах можно использовать <span class="sv-mono">$check</span>
                  </div>
                </div>

                <!-- Dropdown menu по шаблону (v-menu) -->
                <v-menu location="bottom end" content-class="sv-menu" :close-on-content-click="true">
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      size="small"
                      color="primary"
                      prepend-icon="mdi-plus"
                      @click.stop
                    >
                      Добавить
                    </v-btn>
                  </template>

                  <v-list density="compact" bg-color="surface">
                    <v-list-item @click="() => { hapticTap(); openTemplateDialog(); }">
                      <template #prepend>
                        <v-icon icon="mdi-message-plus-outline" />
                      </template>
                      <v-list-item-title>Новый шаблон</v-list-item-title>
                    </v-list-item>

                    <v-divider />

                    <v-list-item @click="() => { hapticTap(); toggleReceiptTemplateFromMenu(); }">
                      <template #prepend>
                        <v-icon :icon="useReceiptTemplate ? 'mdi-receipt-text-check-outline' : 'mdi-receipt-text-outline'" />
                      </template>
                      <v-list-item-title>
                        {{ useReceiptTemplate ? 'Выключить шаблон чека ($check)' : 'Включить шаблон чека ($check)' }}
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <div><v-divider /></div>

              <v-list v-if="templates.length" class="pa-0 sv-templates-list" bg-color="transparent">
                <v-list-item v-for="tpl in templates" :key="tpl.id" class="px-0">
                  <v-list-item-title>
                    <span :style="{ fontSize: textMain }">{{ tpl.text }}</span>
                  </v-list-item-title>

                  <template #append>
                    <div class="sv-row" style="gap: var(--s-2);">
                      <v-btn size="x-small" variant="text" icon="mdi-pencil" @click.stop="openTemplateDialog(tpl)" />
                      <v-btn size="x-small" variant="text" color="error" icon="mdi-delete" @click.stop="deleteTemplate(tpl.id)" />
                    </div>
                  </template>
                </v-list-item>
              </v-list>

              <AppEmptyState v-else icon="mdi-message-text-outline">
                <template #title>
                  <span :style="{ fontSize: textMain, fontWeight: 600 }">Пока нет шаблонов</span>
                </template>
                <template #description>
                  <span :style="{ fontSize: textCaption, opacity: 0.8 }">Добавьте быстрые заготовки для сообщений клиенту.</span>
                </template>
              </AppEmptyState>
            </div>
          </div>
        </v-expand-transition>
      </AppCard>

      <!-- Reset -->
      <AppCard class="sv-surface-card sv-card-pad16">
        <div class="sv-row sv-row--space" style="gap: var(--s-3);">
          <div class="app-stack" style="gap: var(--s-1); min-width: 0;">
            <div :style="{ fontSize: textMain, fontWeight: 600 }">Сброс</div>
            <div :style="{ fontSize: textCaption, opacity: 0.75 }">
              Вернёт значения по умолчанию (включая облако). Это действие нельзя отменить.
            </div>
          </div>
          <v-btn data-haptic="custom" color="error" variant="tonal" @click="resetAllSettings">Сбросить</v-btn>
        </div>
      </AppCard>

      <!-- Template dialog -->
      <AppDialog
        v-model="templateDialog.show"
        :max-width="560"
        :title="templateDialog.isEdit ? 'Редактировать шаблон' : 'Новый шаблон'"
      >
        <div class="app-stack" style="gap: var(--s-3);">
          <div class="app-stack" style="gap: var(--s-1);">
            <div :style="{ fontSize: textCaption, opacity: 0.8 }">Переменные (нажмите, чтобы вставить)</div>
            <div class="sv-chip-row">
              <v-chip size="small" variant="tonal" @click="appendTemplateVar('$name')">Имя</v-chip>
              <v-chip size="small" variant="tonal" @click="appendTemplateVar('$price')">Итоговая стоимость</v-chip>
            </div>
          </div>

          <v-textarea
            v-model="templateDialog.text"
            label="Текст шаблона"
            rows="3"
            auto-grow
            max-rows="10"
            hide-details
          />
        </div>

        <template #actions>
          <v-btn variant="text" @click="() => { hapticTap(); templateDialog.show = false; }">Отмена</v-btn>
          <v-btn data-haptic="custom" color="primary" @click="saveTemplate">Сохранить</v-btn>
        </template>
      </AppDialog>
    </div>
  </AppPage>
</template>

<script setup>
import { computed, inject, onActivated, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

// UI primitives
import AppPage from '@/components/ui/AppPage.vue';
import AppCard from '@/components/ui/AppCard.vue';
import AppDialog from '@/components/ui/AppDialog.vue';
import AppEmptyState from '@/components/ui/AppEmptyState.vue';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();
const { triggerHapticFeedback } = useHapticFeedback();

// notify (из App.vue через provide или через общий слой)
const injectedNotify = inject('notify', null);
function notify(message, opts = {}) {
  const payload = typeof message === 'string' ? { message, ...opts } : message;
  if (typeof injectedNotify === 'function') {
    injectedNotify(payload);
    return;
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:toast', { detail: payload }));
  }
}

// раскрывающиеся секции (не сохраняем состояние раскрытия при возврате на экран)
const DEFAULT_SECTIONS = Object.freeze({
  appearance: false,
  orders: false,
  statuses: false,
  ux: false,
  templates: false,
});

const sections = ref({ ...DEFAULT_SECTIONS });

function resetSections() {
  sections.value = { ...DEFAULT_SECTIONS };
}

onMounted(resetSections);
onActivated(resetSections);
onBeforeRouteLeave(() => resetSections());

function toggleSection(key) {
  sections.value[key] = !sections.value[key];
}

// UI state
const templateDialog = ref({ show: false, isEdit: false, id: null, text: '' });

// Labels
const requiredFieldLabels = {
  clientName: 'Имя клиента',
  phone: 'Телефон',
  services: 'Услуги',
  deadline: 'Срок (дата)',
  notes: 'Заметки',
  details: 'Детали/Расходники',
};

// ===== Bind helpers
const requiredFields = computed(() => settingsStore.settings?.requiredFields || {});
const templates = computed(() => {
  const t = settingsStore.settings?.appSettings?.messageTemplates;
  return Array.isArray(t) ? t : [];
});

function bindApp(key, fallback) {
  return computed({
    get: () => {
      const v = settingsStore.settings?.appSettings?.[key];
      return v ?? fallback;
    },
    set: (val) => settingsStore.updateSetting(`appSettings.${key}`, val),
  });
}

function bindRoot(key, fallback) {
  return computed({
    get: () => settingsStore.settings?.[key] ?? fallback,
    set: (val) => settingsStore.updateSetting(key, val),
  });
}

function setRequiredField(key, val) {
  settingsStore.updateSetting(`requiredFields.${key}`, !!val);
}

// ===== FIX: statuses normalize + fixed order =====
const ORDER_STATUS_ORDER = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];
const SERVICE_STATUS_ORDER = ['accepted', 'additional', 'in_progress', 'completed'];
const DETAIL_STATUS_ORDER = ['accepted', 'additional', 'in_progress', 'completed'];
const CALENDAR_STATUS_ORDER = ['accepted', 'additional', 'in_progress', 'completed', 'delivered'];

function normalizeStatusList(input, order) {
  const src = Array.isArray(input) ? input : (input != null ? [input] : []);
  const picked = new Set();

  for (const raw of src) {
    let v = raw;
    if (v && typeof v === 'object') v = v.value ?? v.key ?? v.id;
    v = String(v ?? '').trim().toLowerCase();
    if (!v) continue;
    if (order.includes(v)) picked.add(v);
  }

  return order.filter((k) => picked.has(k));
}

function needsFix(raw, norm) {
  if (!Array.isArray(raw)) return true;
  if (raw.length !== norm.length) return true;
  for (let i = 0; i < raw.length; i++) {
    const v = raw[i];
    if (typeof v !== 'string') return true;
    if (String(v).trim().toLowerCase() !== norm[i]) return true;
  }
  return false;
}

function bindOrderedApp(key, fallback, order) {
  return computed({
    get: () => {
      const raw = settingsStore.settings?.appSettings?.[key];
      const base = raw ?? fallback;
      return normalizeStatusList(base, order);
    },
    set: (val) => settingsStore.updateSetting(`appSettings.${key}`, normalizeStatusList(val, order)),
  });
}

function ensureNormalized(key, fallback, order) {
  watch(
    () => settingsStore.settings?.appSettings?.[key],
    (raw) => {
      if (raw == null) return;
      const norm = normalizeStatusList(raw ?? fallback, order);
      if (!needsFix(raw, norm)) return;
      settingsStore.updateSetting(`appSettings.${key}`, norm);
    },
    { immediate: true, deep: true },
  );
}

// ===== Settings bindings
const themeKey = bindRoot('theme', 'light');

const appSettings = computed(() => settingsStore.settings?.appSettings ?? {});

const getByPath = (obj, path) => {
  if (!obj) return undefined;
  const parts = String(path || '').split('.').filter(Boolean);
  let cur = obj;
  for (const p of parts) {
    if (!cur || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
};

const getAppSetting = (key, fallback) => {
  const v = getByPath(appSettings.value, key);
  return v === undefined || v === null || v === '' ? fallback : v;
};

const baseFontSize = computed(() => {
  const n = Number(getAppSetting('baseFontSize', 16));
  return Number.isFinite(n) && n > 0 ? n : 16;
});

// fontSize — то, что пользователь меняет. baseFontSize — дефолтный размер.
const fontSize = computed({
  get: () => {
    const saved = getAppSetting('fontSize');
    const n = Number(saved);
    if (saved !== undefined && saved !== null && saved !== '' && Number.isFinite(n) && n > 0) return n;
    return baseFontSize.value;
  },
  set: (val) => {
    const n = Number(val);
    const safe = Number.isFinite(n) && n > 0 ? n : baseFontSize.value;
    settingsStore.updateSetting('appSettings.fontSize', safe);
  },
});

const textMain = computed(() => `${fontSize.value}px`);
const textCaption = computed(() => `${Math.max(11, fontSize.value - 4)}px`);
const textTitle = computed(() => `${Math.max(14, fontSize.value)}px`);

// Слайдер шрифта — обновляем Store только по окончанию перетаскивания (иначе много записей в Firebase)
const fontSizeDraft = ref(fontSize.value);
watch(
  () => fontSize.value,
  (v) => {
    if (Number(fontSizeDraft.value) !== Number(v)) fontSizeDraft.value = v;
  },
);

function commitFontSize() {
  const n = Number(fontSizeDraft.value);
  if (Number.isFinite(n)) fontSize.value = n;
}

// Короткие подсказки в заголовках карточек
const appearanceHint = computed(() => {
  const theme = themeKey.value === 'dark' ? 'Тёмная' : 'Светлая';
  return `${theme} • ${fontSize.value}px`;
});

const ordersHint = computed(() => {
  const parts = [];
  parts.push(showCancelled.value ? 'Отменённые: да' : 'Отменённые: нет');
  parts.push(showCompletedOrders.value ? 'Завершённые: да' : 'Завершённые: нет');
  return parts.join(' • ');
});

const statusesHint = computed(() => {
  const sync = syncServiceToOrderStatus.value || syncOrderToServiceStatus.value ? 'Синхронизация: вкл' : 'Синхронизация: выкл';
  return sync;
});

const uxHint = computed(() => {
  const parts = [];
  parts.push(enablePullToRefresh.value ? 'Pull-to-refresh: вкл' : 'Pull-to-refresh: выкл');
  parts.push(enableHapticFeedback.value ? 'Вибро: вкл' : 'Вибро: выкл');
  return parts.join(' • ');
});

const templatesHint = computed(() => {
  const count = templates.value?.length || 0;
  const receipt = useReceiptTemplate.value ? 'Чек: вкл' : 'Чек: выкл';
  return `${count} шаблон(ов) • ${receipt}`;
});

function incFontSize() {
  fontSize.value = Math.min(22, Number(fontSize.value || baseFontSize.value) + 1);
}
function decFontSize() {
  fontSize.value = Math.max(12, Number(fontSize.value || baseFontSize.value) - 1);
}

const showCancelled = bindApp('showCancelled', false);
const showCompletedOrders = bindApp('showCompletedOrders', true);

const orderFormLastNameLabel = bindApp('orderFormLastNameLabel', 'Фамилия');
const additionalStatusName = bindApp('additionalStatusName', 'Ожидание');

const orderStatuses = bindOrderedApp('orderStatuses', ORDER_STATUS_ORDER, ORDER_STATUS_ORDER);
const serviceStatuses = bindOrderedApp('serviceStatuses', SERVICE_STATUS_ORDER, SERVICE_STATUS_ORDER);
const detailStatuses = bindOrderedApp('detailStatuses', DETAIL_STATUS_ORDER, DETAIL_STATUS_ORDER);
const fullCalendarIndicatorStatuses = bindOrderedApp(
  'fullCalendarIndicatorStatuses',
  ['accepted', 'additional', 'in_progress'],
  CALENDAR_STATUS_ORDER,
);

ensureNormalized('orderStatuses', ORDER_STATUS_ORDER, ORDER_STATUS_ORDER);
ensureNormalized('serviceStatuses', SERVICE_STATUS_ORDER, SERVICE_STATUS_ORDER);
ensureNormalized('detailStatuses', DETAIL_STATUS_ORDER, DETAIL_STATUS_ORDER);
ensureNormalized('fullCalendarIndicatorStatuses', ['accepted', 'additional', 'in_progress'], CALENDAR_STATUS_ORDER);

const syncServiceToOrderStatus = bindApp('syncServiceToOrderStatus', false);
const syncOrderToServiceStatus = bindApp('syncOrderToServiceStatus', false);

const detailsTabLabel = bindApp('detailsTabLabel', 'Детали');

const enablePullToRefresh = bindApp('enablePullToRefresh', true);
const enableHapticFeedback = bindApp('enableHapticFeedback', true);

const useReceiptTemplate = bindApp('useReceiptTemplate', false);

function toggleReceiptTemplateFromMenu() {
  useReceiptTemplate.value = !useReceiptTemplate.value;
  notify(useReceiptTemplate.value ? 'Шаблон чека включён' : 'Шаблон чека выключён', { color: 'info' });
}

// Items (select)
const orderStatusItems = computed(() => ([
  { value: 'accepted', title: 'Принят' },
  { value: 'additional', title: additionalStatusName.value || 'Ожидание' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
]));
const serviceStatusItems = computed(() => ([
  { value: 'accepted', title: 'Принят' },
  { value: 'additional', title: additionalStatusName.value || 'Ожидание' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'completed', title: 'Готов' },
]));
const detailStatusItems = computed(() => ([
  { value: 'accepted', title: 'Принят' },
  { value: 'additional', title: additionalStatusName.value || 'Ожидание' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'completed', title: 'Готов' },
]));

// ===== Actions
const handleLogin = async () => {
  try {
    await authStore.login();
    notify('Вход выполнен', { color: 'success' });
  } catch (e) {
    console.error('Login failed', e);
    notify('Не удалось войти', { color: 'error' });
  }
};

const handleLogout = async () => {
  const ok = await confirmationStore.open('Выход', 'Вы действительно хотите выйти?');
  if (!ok) return;

  try {
    await authStore.logout();
    notify('Вы вышли из аккаунта', { color: 'info' });
  } catch (e) {
    console.error('Logout failed', e);
    notify('Не удалось выйти', { color: 'error' });
  }
};

// Templates logic
const openTemplateDialog = (tpl = null) => {
  if (tpl) {
    templateDialog.value = { show: true, isEdit: true, id: tpl.id, text: tpl.text };
  } else {
    templateDialog.value = { show: true, isEdit: false, id: null, text: '' };
  }
};

function appendTemplateVar(token) {
  hapticTap();
  const cur = String(templateDialog.value.text ?? '');
  const needsSpace = cur.length > 0 && !/\s$/.test(cur);
  templateDialog.value.text = cur + (needsSpace ? ' ' : '') + token;
}

const saveTemplate = () => {
  if (!String(templateDialog.value.text || '').trim()) {
    triggerHapticFeedback('warning');
    notify('Шаблон не может быть пустым', { color: 'warning' });
    return;
  }

  if (templateDialog.value.isEdit) {
    settingsStore.updateMessageTemplate(templateDialog.value.id, templateDialog.value.text);
    notify('Шаблон обновлён', { color: 'success' });
  } else {
    settingsStore.addMessageTemplate(templateDialog.value.text);
    notify('Шаблон добавлен', { color: 'success' });
  }
  templateDialog.value.show = false;
  triggerHapticFeedback('success');
};

const deleteTemplate = async (id) => {
  const ok = await confirmationStore.open('Удалить шаблон', 'Удалить этот шаблон сообщения?');
  if (!ok) return;

  settingsStore.deleteMessageTemplate(id);
  triggerHapticFeedback('light');
  notify('Шаблон удалён', { color: 'info' });
};

const resetAllSettings = async () => {
  triggerHapticFeedback('warning');
  const ok = await confirmationStore.open(
    'Сброс настроек',
    'Вернуть все настройки к заводским значениям? Это действие нельзя отменить.',
  );
  if (!ok) return;

  try {
    await settingsStore.resetSettings();
    notify('Настройки сброшены', { color: 'success' });
    triggerHapticFeedback('success');
  } catch (e) {
    console.error('reset failed', e);
    notify('Не удалось сбросить настройки', { color: 'error' });
  }
};

// ===== Global haptics: one tap for almost any interactive click
// overlay/portal clicks (menus, selects, dialogs) are outside @click.capture
function hapticTap() {
  if (!enableHapticFeedback.value) return;
  try { triggerHapticFeedback('tap'); } catch {}
}

function onAnyTap(e) {
  if (!enableHapticFeedback.value) return;
  const el = e?.target;
  if (!el || !(el instanceof Element)) return;

  // allow custom handlers to provide their own pattern
  if (el.closest('[data-haptic="custom"], [data-haptic="off"]')) return;

  // only for interactive targets
  const interactive = el.closest(
    'button, a, input, textarea, select, [role="button"], .v-btn, .v-list-item, .v-selection-control, .v-chip',
  );
  if (!interactive) return;

  // ignore non-left click
  if (typeof e.button === 'number' && e.button !== 0) return;

  triggerHapticFeedback('tap');
}
</script>

<style scoped>
.sv-row {
  display: flex;
  align-items: center;
}

.sv-row--space {
  justify-content: space-between;
}

.sv-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--s-3);
}

/* Surface cards (match OrderCard background, keep readable text) */
.sv-surface-card {
  background: rgb(var(--v-theme-surface)) !important;
  border: 1px solid rgba(var(--v-theme-outline), 0.32) !important;
  box-shadow: var(--shadow-soft);
  color: rgb(var(--v-theme-on-background));
}

/* Account & Reset: align padding with OrderCard cards */
.sv-card-pad16 {
  padding: var(--s-4) !important;
}

/* Accordion cards */
.sv-acc {
  /* AppCard добавляет общий padding через app-card-pad — для аккордеонов он мешает */
  padding: 0 !important;
}

.sv-acc-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  width: 100%;
  padding: var(--s-4);
  cursor: pointer;
  user-select: none;
}

.sv-acc-left {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  min-width: 0;
  flex: 1;
}

.sv-acc-text {
  display: flex;
  flex-direction: column;
  gap: var(--s-1);
  min-width: 0;
}

.sv-acc-title {
  font-weight: 700;
  line-height: 1.2;
}

.sv-acc-sub {
  opacity: 0.75;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sv-acc-pad {
  padding: var(--s-4);
}

.sv-chevron {
  transition: transform 160ms ease;
  opacity: 0.9;
}

.sv-chevron--open {
  transform: rotate(180deg);
}

.sv-mono {
  font-variant-numeric: tabular-nums;
}

:deep(.sv-menu) {
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-background));
  border: 1px solid rgba(var(--v-theme-outline), 0.28);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.sv-dialog-sheet {
  border: 1px solid rgba(var(--v-theme-outline), 0.28);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  color: rgb(var(--v-theme-on-background));
}

.sv-dialog-pad {
  padding: var(--s-4);
}

.sv-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
}

.sv-templates-list {
  color: rgb(var(--v-theme-on-background));
}

@media (max-width: 720px) {
  .sv-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
