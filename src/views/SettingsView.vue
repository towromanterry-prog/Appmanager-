<template>
  <AppPage title="Настройки">
    <!-- Account -->
    <AppSection>
      <AppCard>
        <div class="row space-between align-center gap">
          <div>
            <div class="muted text-xs">Аккаунт</div>
            <div class="text-sm font-semibold">
              <span v-if="authStore.user">
                {{ authStore.user.displayName || authStore.user.email }}
              </span>
              <span v-else>Войдите для синхронизации</span>
            </div>
          </div>

          <div class="row gap-sm">
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
    </AppSection>

    <!-- Appearance -->
    <AppSection title="Внешний вид">
      <AppCard>
        <div class="stack">
          <div class="row space-between align-center">
            <div>
              <div class="text-sm font-semibold">Тема</div>
              <div class="muted text-xs">Светлая / тёмная</div>
            </div>
            <v-switch
              :model-value="themeKey === 'dark'"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="(v) => (themeKey = v ? 'dark' : 'light')"
            />
          </div>

          <v-divider class="my-2" />

          <div class="row space-between align-center gap">
            <div>
              <div class="text-sm font-semibold">Размер шрифта</div>
              <div class="muted text-xs">Масштаб интерфейса</div>
            </div>

            <div class="row gap-sm align-center">
              <v-btn size="x-small" variant="text" icon="mdi-minus" @click="decFontSize" />
              <div class="mono text-sm w-44 text-right">{{ fontSize }}px</div>
              <v-btn size="x-small" variant="text" icon="mdi-plus" @click="incFontSize" />
            </div>
          </div>

          <v-slider
            v-model="fontSize"
            :min="12"
            :max="22"
            :step="1"
            color="primary"
            hide-details
            class="mt-1"
          />
        </div>
      </AppCard>
    </AppSection>

    <!-- Orders -->
    <AppSection title="Заказы">
      <AppCard>
        <div class="stack">
          <v-switch
            v-model="showCancelled"
            label="Показывать отменённые"
            color="primary"
            hide-details
            density="compact"
          />
          <v-switch
            v-model="showCompletedOrders"
            label="Показывать завершённые"
            color="primary"
            hide-details
            density="compact"
          />
        </div>
      </AppCard>
    </AppSection>

    <!-- Required fields -->
    <AppSection title="Поля заказа">
      <AppCard>
        <div class="stack">
          <div class="muted text-xs">Обязательные поля в форме заказа</div>

          <div class="grid-2 gap">
            <v-checkbox
              v-for="(label, key) in requiredFieldLabels"
              :key="key"
              :model-value="!!requiredFields[key]"
              :label="label"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="(v) => setRequiredField(key, v)"
            />
          </div>

          <v-divider class="my-2" />

          <div class="row gap align-center">
            <v-text-field
              v-model="orderFormLastNameLabel"
              label="Название поля «Фамилия»"
              variant="outlined"
              density="compact"
              hide-details
              class="flex-1"
            />
            <v-checkbox
              :model-value="!!requiredFields.lastName"
              label="Обязательное"
              color="primary"
              hide-details
              density="compact"
              @update:model-value="(v) => setRequiredField('lastName', v)"
            />
          </div>
        </div>
      </AppCard>
    </AppSection>

    <!-- Statuses / sync -->
    <AppSection title="Статусы и синхронизация">
      <AppCard>
        <div class="stack">
          <v-text-field
            v-model="additionalStatusName"
            label="Название статуса «Ожидание»"
            variant="outlined"
            density="compact"
            hide-details
          />

          <div class="grid-2 gap">
            <v-select
              v-model="orderStatuses"
              label="Статусы заказа (видимые)"
              :items="orderStatusItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-select
              v-model="serviceStatuses"
              label="Статусы услуг (видимые)"
              :items="serviceStatusItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>

          <div class="grid-2 gap">
            <v-select
              v-model="detailStatuses"
              label="Статусы деталей/расходников (видимые)"
              :items="detailStatusItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              variant="outlined"
              density="compact"
              hide-details
            />
            <v-select
              v-model="fullCalendarIndicatorStatuses"
              label="Индикаторы в календаре"
              :items="orderStatusItems"
              item-title="title"
              item-value="value"
              multiple
              chips
              variant="outlined"
              density="compact"
              hide-details
            />
          </div>

          <v-divider class="my-2" />

          <div class="grid-2 gap">
            <v-switch
              v-model="syncServiceToOrderStatus"
              label="Синхронизировать статус услуги → заказа"
              color="primary"
              hide-details
              density="compact"
            />
            <v-switch
              v-model="syncOrderToServiceStatus"
              label="Синхронизировать статус заказа → услуги"
              color="primary"
              hide-details
              density="compact"
            />
          </div>
        </div>
      </AppCard>
    </AppSection>

    <!-- Details tab label -->
    <AppSection title="Подписи вкладок">
      <AppCard>
        <v-text-field
          v-model="detailsTabLabel"
          label="Название вкладки «Детали»"
          variant="outlined"
          density="compact"
          hide-details
        />
      </AppCard>
    </AppSection>

    <!-- UX -->
    <AppSection title="Удобство">
      <AppCard>
        <div class="stack">
          <v-switch
            v-model="enablePullToRefresh"
            label="Включить pull-to-refresh"
            color="primary"
            hide-details
            density="compact"
          />
          <v-switch
            v-model="enableHapticFeedback"
            label="Виброотклик (если поддерживается)"
            color="primary"
            hide-details
            density="compact"
          />
        </div>
      </AppCard>
    </AppSection>

    <!-- Message templates -->
    <AppSection title="Шаблоны сообщений">
      <AppCard>
        <div class="stack">
          <div class="row space-between align-center gap">
            <div class="muted text-xs">Быстрые заготовки для сообщений клиенту</div>
            <v-btn size="small" color="primary" prepend-icon="mdi-plus" @click="openTemplateDialog()">
              Добавить
            </v-btn>
          </div>

          <v-list v-if="templates.length" class="pa-0" bg-color="transparent">
            <v-list-item v-for="tpl in templates" :key="tpl.id" class="px-0">
              <v-list-item-title class="text-body-2">{{ tpl.text }}</v-list-item-title>
              <template #append>
                <div class="row gap-sm">
                  <v-btn size="x-small" variant="text" icon="mdi-pencil" @click="openTemplateDialog(tpl)" />
                  <v-btn size="x-small" variant="text" color="error" icon="mdi-delete" @click="deleteTemplate(tpl.id)" />
                </div>
              </template>
            </v-list-item>
          </v-list>

          <div v-else class="muted text-sm">Пока нет шаблонов.</div>
        </div>
      </AppCard>
    </AppSection>

    <!-- Danger zone -->
    <AppSection title="Сброс">
      <AppCard>
        <div class="row space-between align-center gap">
          <div>
            <div class="text-sm font-semibold">Сбросить настройки</div>
            <div class="muted text-xs">Вернёт значения по умолчанию (включая облако)</div>
          </div>
          <v-btn color="error" variant="tonal" @click="resetAllSettings">
            Сбросить
          </v-btn>
        </div>
      </AppCard>
    </AppSection>

    <!-- Template dialog -->
    <v-dialog v-model="templateDialog.show" max-width="560">
      <v-card>
        <v-card-title class="text-h6">
          {{ templateDialog.isEdit ? 'Редактировать шаблон' : 'Новый шаблон' }}
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="templateDialog.text"
            label="Текст"
            variant="outlined"
            rows="4"
            auto-grow
            hide-details
          />
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer />
          <v-btn variant="text" @click="templateDialog.show = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveTemplate">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AppPage>
</template>

<script setup>
import { computed, inject, ref } from 'vue';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

// UI primitives
import AppPage from '@/components/ui/AppPage.vue';
import AppSection from '@/components/ui/AppSection.vue';
import AppCard from '@/components/ui/AppCard.vue';

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
  // запасной вариант: событие (App.vue может слушать)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('app:notify', { detail: payload }));
  }
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

// ===== Settings bindings
const themeKey = bindRoot('theme', 'light');

const fontSize = bindApp('fontSize', 16);
function incFontSize() {
  triggerHapticFeedback('tap');
  fontSize.value = Math.min(22, Number(fontSize.value || 16) + 1);
}
function decFontSize() {
  triggerHapticFeedback('tap');
  fontSize.value = Math.max(12, Number(fontSize.value || 16) - 1);
}

const showCancelled = bindApp('showCancelled', false);
const showCompletedOrders = bindApp('showCompletedOrders', true);

const orderFormLastNameLabel = bindApp('orderFormLastNameLabel', 'Фамилия');
const additionalStatusName = bindApp('additionalStatusName', 'Ожидание');

const orderStatuses = bindApp('orderStatuses', ['accepted', 'additional', 'in_progress', 'completed', 'delivered']);
const serviceStatuses = bindApp('serviceStatuses', ['accepted', 'additional', 'in_progress', 'completed']);
const detailStatuses = bindApp('detailStatuses', ['accepted', 'additional', 'in_progress', 'completed']);
const fullCalendarIndicatorStatuses = bindApp('fullCalendarIndicatorStatuses', ['accepted', 'additional', 'in_progress']);

const syncServiceToOrderStatus = bindApp('syncServiceToOrderStatus', false);
const syncOrderToServiceStatus = bindApp('syncOrderToServiceStatus', false);

const detailsTabLabel = bindApp('detailsTabLabel', 'Детали');

const enablePullToRefresh = bindApp('enablePullToRefresh', true);
const enableHapticFeedback = bindApp('enableHapticFeedback', true);

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
  triggerHapticFeedback('tap');
  try {
    await authStore.login();
    notify('Вход выполнен', { color: 'success' });
  } catch (e) {
    console.error('Login failed', e);
    notify('Не удалось войти', { color: 'error' });
  }
};

const handleLogout = async () => {
  triggerHapticFeedback('tap');
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

const saveTemplate = () => {
  if (!String(templateDialog.value.text || '').trim()) {
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
</script>

<style scoped>
.stack { display: grid; gap: var(--s-3, 0.75rem); }
.grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.row { display: flex; }
.gap { gap: var(--s-4, 1rem); }
.gap-sm { gap: var(--s-2, 0.5rem); }
.align-center { align-items: center; }
.space-between { justify-content: space-between; }
.flex-1 { flex: 1; }
.muted { opacity: 0.75; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.font-semibold { font-weight: 600; }
.mono { font-variant-numeric: tabular-nums; }
.w-44 { width: 4.5rem; }
@media (max-width: 720px) {
  .grid-2 { grid-template-columns: 1fr; }
  .w-44 { width: 3.5rem; }
}
</style>
