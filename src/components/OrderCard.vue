<template>
  <v-card class="order-card" @click="expandCard">
    <v-card-text class="d-flex align-start oc-pad">
      <div class="flex-grow-1 oc-mr" style="min-width: 0;">
        <div class="client-info">
          <div class="font-weight-bold text-truncate" :style="{ fontSize: nameFontSize }">
            {{ displayClientName }}
          </div>

          <div
            v-if="displayClientLastName"
            class="text-on-surface-variant text-truncate"
            :style="{ fontSize: subFontSize }"
          >
            <span class="font-weight-medium">{{ displayClientLastName }}</span>
          </div>

          <div
            v-if="displayClientPhone"
            class="text-on-surface-variant text-truncate"
            :style="{ fontSize: subFontSize }"
          >
            {{ displayClientPhone }}
          </div>
        </div>
      </div>

      <div class="text-right d-flex flex-column align-end">
        <v-menu
          location="bottom end"
          content-class="status-menu-content"
          :disabled="availableOrderStatuses.length === 0"
        >
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              variant="text"
              density="comfortable"
              class="oc-status-btn"
              @click.stop="(e) => onStatusActivatorClick(e, menuProps)"
            >
              <div class="d-flex align-center status-row">
                <span class="status-dot" :style="{ backgroundColor: getStatusColor(order.status) }" />
                <span class="font-weight-medium" :style="{ fontSize: textSub }">
                  {{ getOrderStatusText(order.status) }}
                </span>
              </div>
            </v-btn>
          </template>

          <v-list density="compact" bg-color="surface">
            <v-list-item
              v-for="st in availableOrderStatuses"
              :key="st.value"
              @click="selectOrderStatus(st.value)"
            >
              <v-list-item-title>
                <div class="d-flex align-center status-row">
                  <span class="status-dot" :style="{ backgroundColor: getStatusColor(st.value) }" />
                  <span :style="{ fontSize: textSub }">{{ st.title }}</span>
                </div>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-text>

    <v-expand-transition>
      <div v-show="expanded">
        <v-divider />

        <div class="oc-pad">
          <div v-if="orderServices.length" class="oc-mb">
            <div class="font-weight-medium text-medium-emphasis oc-mb-sm" :style="{ fontSize: textCaption }">
              УСЛУГИ
            </div>

            <div
              v-for="(service, index) in orderServices"
              :key="`service-${index}`"
              class="service-item"
            >
              <div class="oc-line-name text-truncate" :style="{ fontSize: textMain }">
                {{ service.name }}
              </div>

              <div class="oc-line-right">
                <div class="oc-price" :style="{ fontSize: textMain }">{{ service.price }}₽</div>

                <v-menu
                  location="bottom end"
                  content-class="status-menu-content"
                  :disabled="availableServiceStatuses.length === 0"
                >
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      variant="text"
                      density="comfortable"
                      class="oc-status-btn"
                      @click.stop="(e) => onStatusActivatorClick(e, menuProps)"
                    >
                      <div class="d-flex align-center status-row">
                        <span class="status-dot" :style="{ backgroundColor: getStatusColor(service.status) }" />
                        <span class="font-weight-medium" :style="{ fontSize: textSub }">
                          {{ getServiceStatusText(service.status) }}
                        </span>
                      </div>
                    </v-btn>
                  </template>

                  <v-list density="compact" bg-color="surface">
                    <v-list-item
                      v-for="st in availableServiceStatuses"
                      :key="st.value"
                      @click="updateServiceStatus(index, st.value)"
                    >
                      <v-list-item-title>
                        <div class="d-flex align-center status-row">
                          <span class="status-dot" :style="{ backgroundColor: getStatusColor(st.value) }" />
                          <span :style="{ fontSize: textSub }">{{ st.title }}</span>
                        </div>
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </div>

          <div v-if="orderDetails.length" class="oc-mb">
            <div class="font-weight-medium text-medium-emphasis oc-mb-sm" :style="{ fontSize: textCaption }">
              {{ detailsLabel }}
            </div>

            <div
              v-for="(detail, index) in orderDetails"
              :key="`detail-${index}`"
              class="service-item"
            >
              <div class="oc-line-name text-truncate" :style="{ fontSize: textMain }">
                {{ detail.name }}
              </div>

              <div class="oc-line-right">
                <div class="oc-price" :style="{ fontSize: textMain }">{{ detail.price }}₽</div>

                <v-menu
                  location="bottom end"
                  content-class="status-menu-content"
                  :disabled="availableDetailStatuses.length === 0"
                >
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      variant="text"
                      density="comfortable"
                      class="oc-status-btn"
                      @click.stop="(e) => onStatusActivatorClick(e, menuProps)"
                    >
                      <div class="d-flex align-center status-row">
                        <span class="status-dot" :style="{ backgroundColor: getStatusColor(detail.status) }" />
                        <span class="font-weight-medium" :style="{ fontSize: textSub }">
                          {{ getDetailStatusText(detail.status) }}
                        </span>
                      </div>
                    </v-btn>
                  </template>

                  <v-list density="compact" bg-color="surface">
                    <v-list-item
                      v-for="st in availableDetailStatuses"
                      :key="st.value"
                      @click="updateDetailStatus(index, st.value)"
                    >
                      <v-list-item-title>
                        <div class="d-flex align-center status-row">
                          <span class="status-dot" :style="{ backgroundColor: getStatusColor(st.value) }" />
                          <span :style="{ fontSize: textSub }">{{ st.title }}</span>
                        </div>
                      </v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>
            </div>
          </div>

          <div class="d-flex justify-space-between align-center oc-mb">
            <div>
              <span class="text-medium-emphasis" :style="{ fontSize: textSub }">Дата: </span>
              <span :class="isOverdue ? 'text-error' : 'text-on-surface'" :style="{ fontSize: textMain }">
                {{ formattedOrderDate }}
              </span>
            </div>
            <div class="font-weight-bold text-primary" :style="{ fontSize: textTotal }">{{ totalAmount }}₽</div>
          </div>

          <div v-if="order.notes" class="notes-section">
            <div class="font-weight-medium text-medium-emphasis oc-mb-xs" :style="{ fontSize: textCaption }">ЗАМЕТКИ</div>
            <p class="mb-0" :style="{ fontSize: textMain }">{{ order.notes }}</p>
          </div>

          <div class="oc-mt-sm">
            <v-btn
              block
              variant="tonal"
              density="comfortable"
              prepend-icon="mdi-receipt-text-outline"
              :loading="receiptLoading"
              :disabled="receiptLoading"
              @click.stop="downloadReceiptPng"
            >
              Создать чек
            </v-btn>
          </div>
        </div>

        <v-divider />

        <v-card-actions class="oc-actions">
          <div class="d-flex align-center" style="gap: var(--s-1);">
            <!-- PHONE -->
            <v-btn
              icon="mdi-phone"
              variant="text"
              class="oc-icon-btn"
              color="on-surface-variant"
              :href="phoneHref"
              :disabled="!phoneHref"
              @click.stop="onPhoneClick"
            />

            <!-- SMS -->
            <v-btn
              icon="mdi-message-text-outline"
              variant="text"
              class="oc-icon-btn"
              color="on-surface-variant"
              :disabled="!canSendMessage"
              @click.stop="startMessage('sms')"
            />

            <!-- TELEGRAM (custom SVG) -->
            <v-btn
              icon
              variant="text"
              class="oc-icon-btn"
              color="on-surface-variant"
              :disabled="!canSendMessage"
              @click.stop="startMessage('telegram')"
            >
              <svg class="oc-svg-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  fill="currentColor"
                  d="M9.04 15.99L8.9 19.07C9.1 19.07 9.19 18.98 9.3 18.88L10.8 17.47L13.9 19.76C14.47 20.07 14.87 19.92 15.02 19.23L17.62 7.39C17.8 6.53 17.3 6.19 16.74 6.39L1.54 12.17C0.5 12.56 0.52 13.12 1.36 13.38L5.25 14.59L14.28 8.92C14.7 8.65 15.08 8.79 14.76 9.07L7.44 15.64L9.04 15.99Z"
                />
              </svg>
            </v-btn>
          </div>

          <v-spacer />

          <!-- CANCEL / RESTORE -->
          <v-btn
            :icon="isCancelled ? 'mdi-restore' : 'mdi-cancel'"
            :color="isCancelled ? 'success' : 'warning'"
            variant="text"
            class="oc-icon-btn"
            @click.stop="toggleCancelled"
          />

          <!-- DELETE (standard ConfirmationDialog via confirmationStore) -->
          <v-btn
            icon="mdi-delete"
            color="error"
            variant="text"
            class="oc-icon-btn"
            @click.stop="confirmDelete"
          />

          <!-- EDIT -->
          <v-btn
            icon="mdi-pencil"
            color="primary"
            variant="text"
            class="oc-icon-btn"
            :disabled="isCancelled"
            @click.stop="onEdit"
          />
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>

  <!-- Выбор шаблона -->
    <AppDialog v-model="templateDialogOpen" :title="templateDialogTitle" :max-width="420">
    <v-list class="oc-template-list" density="compact" bg-color="transparent">
      <v-list-item
        v-for="t in templateItems"
        :key="t.id"
        @click="pickTemplateAndSend(t)"
      >
        <v-list-item-title class="text-body-2">
          {{ t.title }}
        </v-list-item-title>
        <v-list-item-subtitle v-if="t.subtitle" class="text-caption">
          {{ t.subtitle }}
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>

    <template #actions>
      <v-btn variant="text" @click="closeTemplateDialog">Отмена</v-btn>
    </template>
  </AppDialog>
</template>

<script setup>
import { ref, computed, unref, inject } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import AppDialog from '@/components/ui/AppDialog.vue';

const props = defineProps({
  order: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const { triggerHapticFeedback } = useHapticFeedback();

const expanded = ref(false);

const hapticTap = () => {
  try { triggerHapticFeedback('tap'); } catch {}
};
const hapticSwipe = () => {
  try { triggerHapticFeedback('swipe'); }
  catch { hapticTap(); }
};

const notify = inject('notify', null);
const toast = (message, options = {}) => {
  try {
    if (typeof notify === 'function') return notify(message, options);
    if (notify && typeof notify === 'object') {
      const fn = notify.notify || notify.push || notify.show;
      if (typeof fn === 'function') return fn(message, options);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:toast', { detail: { message, ...options } }));
    }
  } catch {}
};

const receiptLoading = ref(false);

const orderServices = computed(() => props.order.services || []);
const orderDetails = computed(() => props.order.details || []);

// settingsStore.appSettings — computed/ref, поэтому берём unref(), иначе теряются fontSize/labels
const appSettings = computed(() => unref(settingsStore.appSettings) || settingsStore.settings?.appSettings || {});

const normalize = (s) => String(s || '').trim().toLowerCase();

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

const pickFirstDefined = (paths) => {
  for (const p of paths) {
    const v = getByPath(appSettings.value, p);
    if (v !== undefined) return v;
  }
  return undefined;
};

const getAppSetting = (key, fallback) => {
  const v = getByPath(appSettings.value, key);
  return v === undefined || v === null || v === '' ? fallback : v;
};

const currentFontSize = computed(() => {
  const savedSize = getAppSetting('fontSize');
  if (savedSize !== undefined && savedSize !== null) return Number(savedSize);
  return Number(getAppSetting('baseFontSize', 16));
});

const nameFontSize = computed(() => `${currentFontSize.value}px`);
const subFontSize = computed(() => `${Math.max(12, currentFontSize.value - 2)}px`);

const textMain = computed(() => `${currentFontSize.value}px`);
const textSub = computed(() => `${Math.max(12, currentFontSize.value - 2)}px`);
const textCaption = computed(() => `${Math.max(11, currentFontSize.value - 4)}px`);
const textTotal = computed(() => `${Math.max(14, currentFontSize.value + 4)}px`);

const formattedCheckList = computed(() => {
  const items = [...(orderServices.value || []), ...(orderDetails.value || [])];
  
  if (!items.length) return '';
  
  return items.map(item => {
    const name = item.name || item.title || 'Без названия';
    const price = formatMoney(item.price);
    return `• ${name} — ${price}${currencySymbol.value}`;
  }).join('\n');
});


const detailsLabel = computed(() => getAppSetting('detailsTabLabel', 'Детали'));

// single source colors
const getStatusColor = (status) => settingsStore.getOrderStatusColor(normalize(status));

const DEFAULT_ORDER_OPTIONS = [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'additional', title: () => getAppSetting('additionalStatusName', 'Ждет запчасти') },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
  { value: 'cancelled', title: 'Отменен' },
];

const DEFAULT_SERVICE_OPTIONS = [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'completed', title: 'Готов' },
  { value: 'cancelled', title: 'Отменен' },
];

const DEFAULT_DETAIL_OPTIONS = DEFAULT_SERVICE_OPTIONS;

const resolveDefaultOptions = (defaults) =>
  defaults.map((o) => ({ value: o.value, title: typeof o.title === 'function' ? o.title() : o.title }));

const _defaultStatusTitle = (value, defTitle) => {
  const k = normalize(value);
  const map = {
    accepted: 'Принят',
    in_progress: 'В работе',
    additional: getAppSetting('additionalStatusName', 'Ждет запчасти'),
    completed: 'Готов',
    delivered: 'Сдан',
    cancelled: 'Отменен',
  };
  return defTitle || map[k] || value;
};

const buildStatusConfig = (raw, defaults) => {
  const def = resolveDefaultOptions(defaults);

  const isExplicitlyEmpty =
    (Array.isArray(raw) && raw.length === 0) ||
    (typeof raw === 'string' && raw.trim() === '') ||
    (raw && typeof raw === 'object' && !Array.isArray(raw) && Object.keys(raw).length === 0);

  if (isExplicitlyEmpty) {
    return { options: [], titleMap: {}, rankMap: {}, enabled: false };
  }

  let items = [];

  if (typeof raw === 'string') {
    items = raw.split(',').map((s) => normalize(s)).filter(Boolean);
  } else if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    const entries = Object.entries(raw);

    if (entries.some(([, v]) => typeof v === 'number')) {
      items = entries
        .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
        .sort((a, b) => a[1] - b[1])
        .map(([k]) => k);
    } else {
      const enabledKeys = entries.filter(([, v]) => !!v).map(([k]) => k);
      const defOrder = def.map((o) => o.value);
      const ordered = [
        ...defOrder.filter((k) => enabledKeys.includes(k)),
        ...enabledKeys.filter((k) => !defOrder.includes(k)),
      ];
      items = ordered.map((k) => {
        const v = raw[k];
        if (typeof v === 'string') return { value: k, title: v };
        return k;
      });
    }
  }

  const normalizeObj = (x) => {
    if (!x) return null;
    if (typeof x === 'string') {
      const key = normalize(x);
      if (!key) return null;
      const defTitle = def.find((d) => d.value === key)?.title;
      return { value: key, title: _defaultStatusTitle(key, defTitle) };
    }
    if (typeof x === 'object') {
      const value = normalize(x.value ?? x.id ?? x.key ?? x.status ?? x.name);
      if (!value) return null;
      const rawTitle = x.title ?? x.label ?? x.text;
      const defTitle = def.find((d) => d.value === value)?.title;
      const title = rawTitle ? String(rawTitle) : _defaultStatusTitle(value, defTitle);
      return { value, title };
    }
    return null;
  };

  const parsed = (Array.isArray(items) ? items : []).map(normalizeObj).filter(Boolean);
  const finalOptions = parsed.length ? parsed : def;

  const titleMap = finalOptions.reduce((acc, o) => ((acc[o.value] = o.title), acc), {});
  const rankMap = finalOptions.reduce((acc, o, idx) => ((acc[o.value] = idx), acc), {});

  return { options: finalOptions, titleMap, rankMap, enabled: true };
};

const rawOrderStatuses = computed(() =>
  pickFirstDefined(['orderStatuses', 'orderStatusOptions', 'orderStatusList', 'statuses.orders', 'statuses.order']),
);
const rawServiceStatuses = computed(() =>
  pickFirstDefined(['serviceStatuses', 'serviceStatusOptions', 'serviceStatusList', 'statuses.services', 'statuses.service']),
);
const rawDetailStatuses = computed(() =>
  pickFirstDefined(['detailStatuses', 'detailsStatuses', 'detailStatusOptions', 'detailStatusList', 'statuses.details', 'statuses.detail']),
);

const orderStatusCfg = computed(() => buildStatusConfig(rawOrderStatuses.value, DEFAULT_ORDER_OPTIONS));
const serviceStatusCfg = computed(() => buildStatusConfig(rawServiceStatuses.value, DEFAULT_SERVICE_OPTIONS));
const detailStatusCfg = computed(() => buildStatusConfig(rawDetailStatuses.value, DEFAULT_DETAIL_OPTIONS));

const availableOrderStatuses = computed(() => orderStatusCfg.value.options);
const availableServiceStatuses = computed(() => serviceStatusCfg.value.options);
const availableDetailStatuses = computed(() => detailStatusCfg.value.options);

const _fallbackStatusTitle = (key) => {
  const k = normalize(key);
  const map = {
    accepted: 'Принят',
    in_progress: 'В работе',
    additional: getAppSetting('additionalStatusName', 'Ждет запчасти'),
    completed: 'Готов',
    delivered: 'Сдан',
    cancelled: 'Отменен',
  };
  return map[k];
};

const getOrderStatusText = (status) => {
  const k = normalize(status);
  return orderStatusCfg.value.titleMap[k] || _fallbackStatusTitle(k) || k || '—';
};
const getServiceStatusText = (status) => {
  const k = normalize(status);
  return serviceStatusCfg.value.titleMap[k] || _fallbackStatusTitle(k) || k || '—';
};
const getDetailStatusText = (status) => {
  const k = normalize(status);
  return detailStatusCfg.value.titleMap[k] || _fallbackStatusTitle(k) || k || '—';
};

const syncServiceToOrderStatus = computed(() =>
  !!getAppSetting('syncServiceToOrderStatus', false) ||
  !!getAppSetting('syncServiceToOrderStatusEnabled', false),
);

const syncOrderToServiceStatus = computed(() =>
  !!getAppSetting('syncOrderToServiceStatus', false) ||
  !!getAppSetting('syncOrderToServiceStatusEnabled', false),
);

const isCancelled = computed(() => normalize(props.order.status) === 'cancelled');

const displayClientName = computed(() =>
  props.order.clientName ??
  props.order.client_name ??
  props.order.name ??
  props.order.client ??
  'Клиент',
);

const displayClientLastName = computed(() =>
  props.order.lastName ??
  props.order.last_name ??
  props.order.clientLastName ??
  '',
);

const displayClientPhone = computed(() =>
  props.order.phone ??
  props.order.clientPhone ??
  props.order.client_phone ??
  '',
);

const formattedPhone = computed(() => {
  const src = String(displayClientPhone.value || '');
  if (!src) return '';
  return `+${src.replace(/\D/g, '')}`;
});
const phoneHref = computed(() => (formattedPhone.value ? `tel:${formattedPhone.value}` : ''));

/** ===== Templates + send ===== */
const useReceiptTemplate = computed(() => !!getAppSetting('useReceiptTemplate', false));

const rawMessageTemplates = computed(() => {
  const v = getAppSetting('messageTemplates', []);
  return Array.isArray(v) ? v : [];
});

const normalizeTemplateList = (rawList) =>
  (rawList || [])
    .map((t, idx) => {
      if (typeof t === 'string') return { id: idx, text: t };
      if (t && typeof t === 'object') return { id: t.id ?? idx, text: t.text ?? t.template ?? '' };
      return { id: idx, text: '' };
    })
    .map((t) => ({ ...t, text: String(t.text || '').trim() }))
    .filter((t) => !!t.text);

const applyTemplateTokens = (srcText) => {
  let text = String(srcText || '').replace(/\r\n/g, '\n');

  const fullName = [displayClientName.value, displayClientLastName.value]
    .filter(Boolean)
    .join(' ')
    .trim();

  // $name / $price
  text = text
    .replace(/\$name/g, fullName || displayClientName.value || 'Клиент')
    .replace(/\$price/g, `${totalAmount.value}${currencySymbol.value}`);

  // $check
  if (formattedCheckList.value) {
    text = text.replace(/\$check/g, formattedCheckList.value);
  } else {
    // если нечего показывать — убираем строку целиком
    text = text.replace(/^.*\$check.*\n?/gm, '');
  }

  return text.replace(/\n{3,}/g, '\n\n').trim();
};

const messageTemplates = computed(() => {
  const base = normalizeTemplateList(rawMessageTemplates.value);

  // Встроенный «чек» (не редактируется/не удаляется) — управляется тумблером в настройках
  const list = [...base];
  if (useReceiptTemplate.value && formattedCheckList.value) {
    list.unshift({
      id: '__receipt__',
      text: 'Ваш заказ готов:\n$check\n\nИтого: $price',
      __builtin: true,
    });
  }

  return list
    .map((t) => ({ ...t, text: applyTemplateTokens(t.text) }))
    .filter((t) => !!String(t.text || '').trim());
});

const canSendMessage = computed(() => !!formattedPhone.value && messageTemplates.value.length > 0);

const templateDialogOpen = ref(false);
const pendingChannel = ref(null); // 'sms' | 'telegram'

const templateDialogTitle = computed(() => {
  const ch = pendingChannel.value;
  if (ch === 'sms') return 'Выберите шаблон для SMS';
  if (ch === 'telegram') return 'Выберите шаблон для Telegram';
  return 'Выберите шаблон';
});

const templateItems = computed(() =>
  messageTemplates.value.map((t, i) => {
    const text = String(t.text || '').trim();
    const firstLine = (text.split('\n')[0] || '').trim();
    const title = (firstLine || `Шаблон ${i + 1}`).slice(0, 64);
    const subtitle = text.length > 64 ? text.slice(0, 140) : '';
    return { id: t.id ?? i, text, title, subtitle };
  }),
);

const buildSmsHref = (phone, body) => {
  const p = String(phone || '').trim();
  if (!p) return '';
  const b = String(body || '').trim();
  return b ? `sms:${p}?body=${encodeURIComponent(b)}` : `sms:${p}`;
};

// ✅ старый “рабочий” способ
const buildTelegramHref = (phoneDigits, text) => {
  const p = String(phoneDigits || '').replace(/\D/g, '');
  if (!p) return '';
  const t = String(text || '').trim();
  if (!t) return `https://t.me/+${p}`;
  return `https://t.me/+${p}?text=${encodeURIComponent(t)}`;
};

const sendMessage = (channel, templateText) => {
  const phone = formattedPhone.value;
  const digits = String(phone || '').replace(/\D/g, '');
  if (!phone || !digits) return;

  let text = String(templateText || '').trim();
  if (!text) return;

  if (text.startsWith('@')) text = ` ${text}`;

  const href =
    channel === 'sms'
      ? buildSmsHref(phone, text)
      : channel === 'telegram'
        ? buildTelegramHref(digits, text)
        : '';

  if (!href) return;
  if (typeof window !== 'undefined') window.location.href = href;
};

const startMessage = (channel) => {
  hapticTap();

  if (!formattedPhone.value) return;
  if (!messageTemplates.value.length) return;

  if (messageTemplates.value.length === 1) {
    sendMessage(channel, messageTemplates.value[0].text);
    return;
  }

  pendingChannel.value = channel;
  templateDialogOpen.value = true;
};

const pickTemplateAndSend = (tpl) => {
  hapticTap();

  const channel = pendingChannel.value;
  templateDialogOpen.value = false;
  pendingChannel.value = null;

  if (!channel) return;
  sendMessage(channel, tpl?.text);
};

const closeTemplateDialog = () => {
  hapticTap();
  templateDialogOpen.value = false;
  pendingChannel.value = null;
};
/** ===== /Templates + send ===== */

const toDate = (v) => {
  if (v instanceof Date) return v;
  if (v && typeof v.toDate === 'function') return v.toDate();
  if (v && typeof v.seconds === 'number') return new Date(v.seconds * 1000);
  if (v) return new Date(v);
  return null;
};

const orderDateObj = computed(() => toDate(props.order.date) || toDate(props.order.startAt) || null);

const formattedOrderDate = computed(() => {
  const d = orderDateObj.value;
  if (!d || Number.isNaN(d.getTime())) return 'Не указана';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

const totalAmount = computed(() => {
  if (props.order.total !== undefined) return props.order.total;
  if (props.order.price !== undefined) return props.order.price;
  if (typeof props.order.computedTotal === 'number') return props.order.computedTotal;

  const s = orderServices.value.reduce((acc, x) => acc + (Number(x.price) || 0), 0);
  const d = orderDetails.value.reduce((acc, x) => acc + (Number(x.price) || 0), 0);
  return s + d;
});

const isOverdue = computed(() => {
  const d = orderDateObj.value;
  if (!d || Number.isNaN(d.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const st = normalize(props.order.status);
  if (st === 'delivered' || st === 'cancelled') return false;

  const dd = new Date(d);
  dd.setHours(0, 0, 0, 0);
  return dd < today;
});

const expandCard = () => {
  hapticTap(); // вибрация и на открытие, и на закрытие
  expanded.value = !expanded.value;
};

const onStatusActivatorClick = (e, menuProps) => {
  hapticTap();
  if (menuProps?.onClick) menuProps.onClick(e);
};

const _rank = (cfg, status) => {
  const k = normalize(status);
  const r = cfg.rankMap?.[k];
  return typeof r === 'number' ? r : null;
};

const _maybePromoteOrderFromLines = (services, details) => {
  if (!syncServiceToOrderStatus.value) return null;
  if (!orderStatusCfg.value.enabled || availableOrderStatuses.value.length === 0) return null;

  const considered = [];

  if (serviceStatusCfg.value.enabled && availableServiceStatuses.value.length) {
    for (const s of services || []) {
      const k = normalize(s?.status);
      if (!k) continue;
      if (_rank(serviceStatusCfg.value, k) === null) continue;
      if (_rank(orderStatusCfg.value, k) === null) continue;
      considered.push(k);
    }
  }

  if (detailStatusCfg.value.enabled && availableDetailStatuses.value.length) {
    for (const d of details || []) {
      const k = normalize(d?.status);
      if (!k) continue;
      if (_rank(detailStatusCfg.value, k) === null) continue;
      if (_rank(orderStatusCfg.value, k) === null) continue;
      considered.push(k);
    }
  }

  if (!considered.length) return null;

  const x = considered[0];
  const allSame = considered.every((k) => k === x);
  if (!allSame) return null;

  const y = normalize(props.order.status);
  const ry = _rank(orderStatusCfg.value, y);
  const rx = _rank(orderStatusCfg.value, x);
  if (ry === null || rx === null) return null;

  return ry < rx ? x : null;
};

const _applyOrderToLines = (newOrderStatus, services, details) => {
  if (!syncOrderToServiceStatus.value) return { services, details, changed: false };
  if (!orderStatusCfg.value.enabled || availableOrderStatuses.value.length === 0) return { services, details, changed: false };

  const x = normalize(newOrderStatus);
  const rxOrder = _rank(orderStatusCfg.value, x);
  if (rxOrder === null) return { services, details, changed: false };

  let changed = false;
  let nextServices = services;
  let nextDetails = details;

  if (serviceStatusCfg.value.enabled && availableServiceStatuses.value.length) {
    const rxLine = _rank(serviceStatusCfg.value, x);
    if (rxLine !== null) {
      nextServices = (services || []).map((s) => {
        const cur = normalize(s?.status);
        const rcur = _rank(serviceStatusCfg.value, cur);
        if (rcur === null) return s;
        if (rcur < rxLine) {
          changed = true;
          return { ...s, status: x };
        }
        return s;
      });
    }
  }

  if (detailStatusCfg.value.enabled && availableDetailStatuses.value.length) {
    const rxLine = _rank(detailStatusCfg.value, x);
    if (rxLine !== null) {
      nextDetails = (details || []).map((d) => {
        const cur = normalize(d?.status);
        const rcur = _rank(detailStatusCfg.value, cur);
        if (rcur === null) return d;
        if (rcur < rxLine) {
          changed = true;
          return { ...d, status: x };
        }
        return d;
      });
    }
  }

  return { services: nextServices, details: nextDetails, changed };
};

const selectOrderStatus = async (newStatus) => {
  hapticSwipe();

  const curServices = orderServices.value;
  const curDetails = orderDetails.value;

  const synced = _applyOrderToLines(newStatus, curServices, curDetails);

  const patch = { status: newStatus };
  if (synced.changed) {
    patch.services = synced.services;
    patch.details = synced.details;
  }

  await orderStore.updateOrder(props.order.id, patch);
};

const updateServiceStatus = async (index, newStatus) => {
  hapticSwipe();

  const list = [...orderServices.value];
  if (!list[index]) return;

  list[index] = { ...list[index], status: newStatus };

  const promoted = _maybePromoteOrderFromLines(list, orderDetails.value);

  const patch = { services: list };
  if (promoted) patch.status = promoted;

  await orderStore.updateOrder(props.order.id, patch);
};

const updateDetailStatus = async (index, newStatus) => {
  hapticSwipe();

  const list = [...orderDetails.value];
  if (!list[index]) return;

  list[index] = { ...list[index], status: newStatus };

  const promoted = _maybePromoteOrderFromLines(orderServices.value, list);

  const patch = { details: list };
  if (promoted) patch.status = promoted;

  await orderStore.updateOrder(props.order.id, patch);
};


const currencySymbol = computed(() => {
  const v = getAppSetting('currencySymbol') ?? getAppSetting('currency') ?? '₽';
  const s = String(v || '').trim();
  return s || '₽';
});

const formatMoney = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  const rounded = Math.round(n);
  if (Math.abs(n - rounded) < 0.00001) return String(rounded);
  return n.toFixed(2).replace(/\.00$/, '');
};

const downloadReceiptPng = async () => {
  hapticTap();
  if (receiptLoading.value) return;

  receiptLoading.value = true;
  try {
    if (typeof document === 'undefined') return;

    const width = 420; // логические px
    const pad = 16;
    const mono =
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

    const titleSize = Math.max(18, currentFontSize.value + 4);
    const bodySize = Math.max(13, currentFontSize.value);
    const smallSize = Math.max(11, currentFontSize.value - 3);

    const lhTitle = Math.round(titleSize * 1.25);
    const lhBody = Math.round(bodySize * 1.25);
    const lhSmall = Math.round(smallSize * 1.25);

    const tmp = document.createElement('canvas');
    const tctx = tmp.getContext('2d');
    if (!tctx) return;

    const font = (weight, size) => `${weight} ${size}px ${mono}`;

    const clientFullName = [displayClientName.value, displayClientLastName.value].filter(Boolean).join(' ').trim();

    const services = orderServices.value || [];
    const details = orderDetails.value || [];
    const cur = currencySymbol.value;

    const priceStrings = [
      ...services.map((x) => `${formatMoney(x?.price)}${cur}`),
      ...details.map((x) => `${formatMoney(x?.price)}${cur}`),
      `${formatMoney(totalAmount.value)}${cur}`,
    ];

    tctx.font = font('600', bodySize);
    const maxPriceWidth = priceStrings.reduce((acc, s) => Math.max(acc, tctx.measureText(String(s)).width), 0);
    const priceCol = Math.min(130, Math.max(76, Math.ceil(maxPriceWidth) + 8));
    const gap = 12;
    const nameMaxWidth = width - pad * 2 - priceCol - gap;

    const wrapText = (ctx, text, maxWidth) => {
      const src = String(text || '').trim();
      if (!src) return ['—'];

      const words = src.split(/\s+/).filter(Boolean);
      const out = [];
      let line = '';

      const pushLine = (s) => {
        const v = String(s || '').trim();
        if (v) out.push(v);
      };

      const fits = (s) => ctx.measureText(s).width <= maxWidth;

      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (fits(test)) {
          line = test;
          continue;
        }

        if (line) pushLine(line);

        // слово слишком длинное — режем по символам
        if (!fits(w)) {
          let chunk = '';
          for (const ch of w) {
            const t = chunk + ch;
            if (fits(t)) chunk = t;
            else {
              pushLine(chunk);
              chunk = ch;
            }
          }
          line = chunk;
        } else {
          line = w;
        }
      }

      if (line) pushLine(line);
      return out.length ? out : ['—'];
    };

    const elements = [];
    let y = pad;

    const addText = (text, opts) => {
      elements.push({ type: 'text', text, ...opts, y });
      y += opts.lh;
    };

    const addHr = () => {
      y += 6;
      elements.push({ type: 'hr', y });
      y += 10;
    };

    // Заголовок
    addText('ЧЕК', {
      x: width / 2,
      align: 'center',
      font: font('700', titleSize),
      fill: '#111111',
      lh: lhTitle,
    });

    const orderId = props.order?.number || props.order?.orderNumber || props.order?.id;

    addHr();

    // Клиент/дата
    addText(`${clientFullName || '—'}`, {
      x: pad,
      align: 'left',
      font: font('400', bodySize),
      fill: '#111111',
      lh: lhBody,
    });

    addHr();

    const addSection = (title, items) => {
      addText(String(title || '').toUpperCase(), {
        x: pad,
        align: 'left',
        font: font('600', smallSize),
        fill: '#333333',
        lh: lhSmall,
      });

      if (!items?.length) {
        addText('—', { x: pad, align: 'left', font: font('400', bodySize), fill: '#111111', lh: lhBody });
        y += 2;
        return;
      }

      for (const it of items) {
        const name = it?.name ?? it?.title ?? '—';
        const price = `${formatMoney(it?.price)}${cur}`;

        tctx.font = font('400', bodySize);
        const lines = wrapText(tctx, name, nameMaxWidth);

        for (let i = 0; i < lines.length; i++) {
          const isFirst = i === 0;
          elements.push({
            type: 'row',
            left: lines[i],
            right: isFirst ? price : '',
            y,
          });
          y += lhBody;
        }
      }

      y += 4;
    };

    addSection('Услуги', services);
    addSection(detailsLabel.value || 'Детали', details);

    addHr();

    // Итого
    elements.push({
      type: 'total',
      y,
      left: 'ИТОГО',
      right: `${formatMoney(totalAmount.value)}${cur}`,
    });
    y += lhBody;

    y += 8;

    const height = Math.ceil(y + pad);

    // Рендер
    const scale = Math.max(2, (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1));
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.textBaseline = 'top';

    // фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const drawHr = (yy) => {
      ctx.save();
      ctx.strokeStyle = '#c9c9c9';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pad, yy);
      ctx.lineTo(width - pad, yy);
      ctx.stroke();
      ctx.restore();
    };

    const drawRow = (yy, left, right) => {
      ctx.font = font('400', bodySize);
      ctx.fillStyle = '#111111';
      ctx.textAlign = 'left';
      ctx.fillText(String(left || ''), pad, yy);

      if (right) {
        ctx.textAlign = 'right';
        ctx.fillText(String(right), width - pad, yy);
      }
    };

    for (const el of elements) {
      if (el.type === 'text') {
        ctx.font = el.font;
        ctx.fillStyle = el.fill || '#111111';
        ctx.textAlign = el.align || 'left';
        ctx.fillText(String(el.text || ''), el.x ?? pad, el.y);
      } else if (el.type === 'hr') {
        drawHr(el.y);
      } else if (el.type === 'row') {
        drawRow(el.y, el.left, el.right);
      } else if (el.type === 'total') {
        ctx.font = font('700', bodySize);
        ctx.fillStyle = '#111111';
        ctx.textAlign = 'left';
        ctx.fillText(String(el.left || ''), pad, el.y);

        ctx.textAlign = 'right';
        ctx.fillText(String(el.right || ''), width - pad, el.y);
      }
    }

    const dataUrl = canvas.toDataURL('image/png');

    const a = document.createElement('a');
    const safeId = String(orderId || props.order?.id || Date.now()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 24);
    a.download = `check_${safeId || 'order'}.png`;
    a.href = dataUrl;
    document.body.appendChild(a);
    a.click();
    a.remove();

    toast('Чек сохранён', { color: 'success' });
  } catch (e) {
    toast('Не удалось создать чек', { color: 'error' });
    // eslint-disable-next-line no-console
    console.error(e);
  } finally {
    receiptLoading.value = false;
  }
};

const onPhoneClick = () => hapticTap();

const toggleCancelled = async () => {
  hapticTap();
  const next = isCancelled.value ? 'accepted' : 'cancelled';
  await orderStore.updateOrder(props.order.id, { status: next });
};

const onEdit = () => {
  hapticTap();
  emit('edit', props.order);
};

const confirmDelete = () => {
  hapticTap();
  emit('delete', props.order.id);
};

</script>

<style scoped>
.order-card { transition: box-shadow 0.2s ease-out; cursor: pointer; }
.client-info { overflow: hidden; }

.oc-pad { padding: var(--s-4); }
.oc-mr { margin-right: var(--s-4); }
.oc-mb { margin-bottom: var(--s-4); }
.oc-mb-sm { margin-bottom: var(--s-2); }
.oc-mb-xs { margin-bottom: var(--s-1); }
.oc-mt-sm { margin-top: var(--s-3); }
.oc-actions { padding: var(--s-2); }

.service-item {
  display: flex;
  align-items: center;
  gap: var(--s-3);
  padding: var(--s-1) 0;
}

.oc-line-name {
  flex: 1 1 auto;
  min-width: 0;
}

.oc-line-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  gap: var(--s-3);
}

.oc-price { white-space: nowrap; }

.notes-section {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: var(--s-2) var(--s-3);
  border-radius: var(--radius);
}

.status-row { gap: var(--s-1); }
.status-dot { width: 10px; height: 10px; border-radius: 999px; flex: 0 0 auto; }
.oc-status-btn { padding-inline: var(--s-2); min-height: 32px; }

:deep(.status-menu-content) {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgba(var(--v-theme-outline), 0.28);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

/* Иконки крупнее + удобный hit-area */
.oc-icon-btn {
  width: 44px;
  min-width: 44px;
  height: 44px;
}

:deep(.oc-icon-btn .v-icon) {
  font-size: 26px;
}

.oc-svg-icon {
  width: 26px;
  height: 26px;
  display: block;
}

/* Лист шаблонов в диалоге */
.oc-template-sheet {
  border: 1px solid rgba(var(--v-theme-outline), 0.28);
  border-radius: var(--radius-lg);
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}

.oc-template-list {
  max-height: 52vh;
  overflow: auto;
}
</style>