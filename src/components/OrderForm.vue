<template>
  <div class="h-100 d-flex flex-column bg-surface">
    <v-toolbar color="surface" density="comfortable" class="border-b" style="padding-inline: var(--s-2);">
      <v-btn
        icon="mdi-close"
        variant="text"
        @click="() => { triggerHapticFeedback('tap'); $emit('close'); }"
      />
      <v-toolbar-title class="text-h6 font-weight-bold form-title">
        {{ isEditMode ? 'Редактирование' : 'Новый заказ' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn
        :loading="saving"
        color="primary"
        variant="flat"
        class="px-4"
        @click="() => { triggerHapticFeedback('important'); saveOrder(); }"
      >
        Сохранить
      </v-btn>
    </v-toolbar>

    <div class="flex-grow-1 overflow-y-auto">
      <AppPage :bottom-pad="'calc(100px + var(--s-4))'">
        <v-form ref="form" v-model="valid" class="app-stack" style="gap: var(--s-4);">
          <AppSection>
            <AppCard class="of-card-safe">
              <div class="d-flex" style="gap: var(--s-3); align-items: flex-start;">
                <v-select
                  v-model="formData.status"
                  :items="statusOptions"
                  :label="labelWithRequired('status', 'Статус')"
                  density="comfortable"
                  variant="outlined"
                  :hide-details="'auto'"
                  :rules="rulesFor('status')"
                  class="flex-grow-1 dynamic-font-input"
                  @update:menu="val => val && hapticTap()"
                  @update:model-value="hapticTap()"
                >
                  <template #selection="{ item }">
                    <div class="of-status-row">
                      <span class="status-dot" :style="statusDotStyle(item?.raw?.value ?? item?.value)" />
                      <span class="dynamic-text-body text-truncate">{{ item?.title }}</span>
                    </div>
                  </template>

                  <template #item="{ props, item }">
                    <v-list-item v-bind="props" :subtitle="null" class="dynamic-list-item">
                      <template #title>
                        <div class="of-status-row">
                          <span class="status-dot" :style="statusDotStyle(item?.raw?.value ?? item?.value)" />
                          <span class="dynamic-text-body">{{ item?.title }}</span>
                        </div>
                      </template>
                    </v-list-item>
                  </template>
                </v-select>

                <v-text-field
                  v-model="formData.date"
                  :label="labelWithRequired('date', 'Дата')"
                  type="date"
                  density="comfortable"
                  variant="outlined"
                  :hide-details="'auto'"
                  :rules="rulesFor('date')"
                  style="max-width: 170px;"
                  class="dynamic-font-input"
                  @click="hapticTap()"
                  @update:model-value="hapticTap()"
                />
              </div>
            </AppCard>
          </AppSection>

          <AppSection>
            <template #title>
              <span class="dynamic-section-title">Клиент</span>
            </template>

            <AppCard class="of-card-safe">
              <v-autocomplete
                v-model="formData.clientId"
                :items="clients"
                item-title="name"
                item-value="id"
                label="Выберите клиента"
                variant="outlined"
                density="comfortable"
                :hide-details="'auto'"
                clearable
                :custom-filter="clientFilter"
                :menu-props="menuProps"
                @update:menu="val => val && hapticTap()"
                @update:model-value="hapticTap()"
                class="dynamic-font-input"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" class="dynamic-list-item">
                    <template #title>
                      <span class="dynamic-text-body">{{ item?.raw?.name }}</span>
                    </template>
                    <template #subtitle>
                      <span class="dynamic-text-sub">{{ item?.raw?.phone }}</span>
                    </template>
                  </v-list-item>
                </template>

                <template #selection="{ item }">
                  <div class="d-flex align-center" style="gap: var(--s-2); min-width: 0;">
                    <span class="font-weight-bold text-truncate dynamic-text-body">
                      {{ item?.raw?.name || 'Клиент' }}
                    </span>
                    <span v-if="item?.raw?.phone" class="text-medium-emphasis text-no-wrap dynamic-text-sub">
                      {{ item.raw.phone }}
                    </span>
                  </div>
                </template>
              </v-autocomplete>

              <div class="d-flex" style="gap: var(--s-3); margin-top: var(--s-3);">
                <v-text-field
                  v-model="formData.clientName"
                  :label="labelWithRequired('clientName', 'Имя')"
                  variant="outlined"
                  density="comfortable"
                  :hide-details="'auto'"
                  :rules="rulesFor('clientName')"
                  @click="hapticTap()"
                  class="dynamic-font-input"
                />
                <v-text-field
                  v-model="formData.lastName"
                  :label="labelWithRequired('lastName', lastNameLabel)"
                  variant="outlined"
                  density="comfortable"
                  :hide-details="'auto'"
                  :rules="rulesFor('lastName')"
                  @click="hapticTap()"
                  class="dynamic-font-input"
                />
              </div>

              <v-text-field
                v-model="formData.phone"
                :label="labelWithRequired('phone', 'Телефон')"
                variant="outlined"
                density="comfortable"
                :hide-details="'auto'"
                :rules="rulesFor('phone')"
                inputmode="tel"
                autocomplete="tel"
                placeholder="+7 000 000 00 00"
                style="margin-top: var(--s-3);"
                class="dynamic-font-input"
                @focus="() => { ensurePhonePrefix(); hapticTap(); }"
                @update:model-value="onPhoneInput"
                @keydown="onPhoneKeydown"
              />
            </AppCard>
          </AppSection>

          <AppSection>
            <template #title>
              <span class="dynamic-section-title">Услуги</span>
            </template>

            <AppCard class="of-card-safe">
              <div v-if="formData.services.length" class="app-stack" style="gap: var(--s-2);">
                <v-card
                  v-for="(svc, index) in formData.services"
                  :key="`${svc.id || svc.name}-${index}`"
                  variant="outlined"
                  color="surface"
                  class="of-line-item of-line-item--field"
                >
                  <div class="d-flex align-center" style="gap: var(--s-3);">
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="font-weight-bold text-truncate dynamic-text-body">
                        {{ svc.name }}
                      </div>
                    </div>

                    <div class="d-flex align-center" style="gap: var(--s-2);">
                      <v-text-field
                        v-model.number="svc.price"
                        type="number"
                        variant="plain"
                        density="compact"
                        hide-details
                        class="price-input text-right dynamic-font-input"
                        style="width: 86px;"
                        prefix="₽"
                        inputmode="numeric"
                      />
                      <v-btn
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        color="medium-emphasis"
                        @click="removeService(index)"
                      />
                    </div>
                  </div>
                </v-card>
              </div>

              <v-autocomplete
                v-model="serviceToAdd"
                :items="activeServices"
                item-title="name"
                return-object
                :label="labelWithRequired('services', 'Добавить услугу')"
                variant="outlined"
                density="comfortable"
                :hide-details="'auto'"
                :rules="rulesFor('services')"
                prepend-inner-icon="mdi-plus"
                :menu-props="menuProps"
                class="dynamic-font-input"
                @update:model-value="addService"
                @update:menu="val => val && hapticTap()"
                style="margin-top: var(--s-3);"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" class="dynamic-list-item">
                    <template #subtitle>
                      <span class="dynamic-text-sub">{{ formatPrice(item.raw.defaultPrice) }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </AppCard>
          </AppSection>

          <AppSection>
            <template #title>
              <span class="dynamic-section-title">{{ detailsSectionTitle }}</span>
            </template>

            <AppCard class="of-card-safe">
              <div v-if="formData.details.length" class="app-stack" style="gap: var(--s-2);">
                <v-card
                  v-for="(det, index) in formData.details"
                  :key="`${det.id || det.name}-${index}`"
                  variant="outlined"
                  color="surface"
                  class="of-line-item of-line-item--field"
                >
                  <div class="d-flex align-center" style="gap: var(--s-3);">
                    <div class="flex-grow-1 overflow-hidden">
                      <div class="font-weight-medium text-truncate dynamic-text-body">
                        {{ det.name }}
                      </div>
                    </div>

                    <div class="d-flex align-center" style="gap: var(--s-2);">
                      <v-text-field
                        v-model.number="det.price"
                        type="number"
                        variant="plain"
                        density="compact"
                        hide-details
                        class="price-input text-right dynamic-font-input"
                        style="width: 86px;"
                        prefix="₽"
                        inputmode="numeric"
                      />
                      <v-btn
                        icon="mdi-close"
                        size="x-small"
                        variant="text"
                        color="medium-emphasis"
                        @click="removeDetail(index)"
                      />
                    </div>
                  </div>
                </v-card>
              </div>

              <v-autocomplete
                v-model="detailToAdd"
                :items="details"
                item-title="name"
                return-object
                :label="labelWithRequired('details', `Добавить ${detailsLabelLower}`)"
                variant="outlined"
                density="comfortable"
                :hide-details="'auto'"
                :rules="rulesFor('details')"
                prepend-inner-icon="mdi-plus"
                :menu-props="menuProps"
                class="dynamic-font-input"
                @update:model-value="addDetail"
                @update:menu="val => val && hapticTap()"
                style="margin-top: var(--s-3);"
              >
                <template #item="{ props, item }">
                  <v-list-item v-bind="props" class="dynamic-list-item">
                    <template #subtitle>
                      <span class="dynamic-text-sub">{{ formatPrice(item.raw.defaultPrice) }}</span>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </AppCard>
          </AppSection>

          <AppSection>
            <AppCard class="of-card-safe">
              <v-textarea
                v-model="formData.notes"
                label="Заметки к заказу"
                variant="outlined"
                auto-grow
                rows="2"
                :hide-details="'auto'"
                @click="hapticTap()"
                class="dynamic-font-input"
              />
            </AppCard>
          </AppSection>
        </v-form>
      </AppPage>
    </div>

    <v-footer app color="surface" class="border-t pa-0 safe-area-bottom">
      <div class="d-flex align-center justify-space-between w-100" style="padding: var(--s-3) var(--s-4);">
        <div>
          <div class="text-medium-emphasis dynamic-text-sub">Итоговая стоимость</div>
          <div class="font-weight-bold text-primary form-total">{{ formatPrice(totalPrice) }}</div>
        </div>
      </div>
    </v-footer>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch, inject } from 'vue';

import AppPage from '@/components/ui/AppPage.vue';
import AppSection from '@/components/ui/AppSection.vue';
import AppCard from '@/components/ui/AppCard.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

import { useOrderStore } from '@/stores/orderStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useServicesStore } from '@/stores/servicesStore';
import { useDetailsStore } from '@/stores/detailsStore';
import { useSettingsStore } from '@/stores/settingsStore';

const props = defineProps({
  orderId: { type: String, default: null },
  initialData: { type: Object, default: () => ({}) },
});
const emit = defineEmits(['close', 'saved']);

const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const servicesStore = useServicesStore();
const detailsStore = useDetailsStore();
const settingsStore = useSettingsStore();
const { triggerHapticFeedback } = useHapticFeedback();
const hapticTap = () => { try { triggerHapticFeedback('tap'); } catch {} };

const notifyInject = inject('notify', null);
const notify = (payload) => {
  if (typeof notifyInject === 'function') return notifyInject(payload);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('app:toast', { detail: typeof payload === 'string' ? { text: payload } : payload }),
    );
  }
};

const valid = ref(false);
const form = ref(null);
const saving = ref(false);
const isEditMode = computed(() => !!props.orderId);

const clients = computed(() => clientsStore.clients || []);
const activeServices = computed(() => servicesStore.activeItems || []);
const details = computed(() => detailsStore.details || []);

const todayStr = () => new Date().toISOString().split('T')[0];

const formData = reactive({
  status: 'accepted',
  date: todayStr(),
  notes: '',

  // NEW: связь по clientId (неизменяемый)
  clientId: null,

  // NEW: оригинальный телефон из заказа (для поддержки старых заказов)
  oldPhone: '',

  // слепок в заказе
  clientName: '',
  lastName: '',
  phone: '',

  services: [],
  details: [],
});

// === Вычисляемые свойства для масштабирования шрифта ===
const appSettings = computed(() => settingsStore.appSettings || settingsStore.settings?.appSettings || {});
const getAppSetting = (key, fallback) => {
  const v = appSettings.value?.[key];
  return v === undefined || v === null || v === '' ? fallback : v;
};

const currentFontSize = computed(() => {
  const savedSize = getAppSetting('fontSize');
  if (savedSize !== undefined && savedSize !== null) return Number(savedSize);
  return Number(getAppSetting('baseFontSize', 16));
});

const currentFontSizePx = computed(() => `${currentFontSize.value}px`);
const subFontSizePx = computed(() => `${Math.max(12, currentFontSize.value - 2)}px`);
const titleFontSizePx = computed(() => `${Math.min(24, currentFontSize.value + 4)}px`);
const totalFontSizePx = computed(() => `${Math.min(28, currentFontSize.value + 8)}px`);
const sectionTitleFontSizePx = computed(() => `${currentFontSize.value + 2}px`);
// =======================================================

const lastNameLabel = computed(() => getAppSetting('orderFormLastNameLabel', 'Фамилия'));
const detailsLabel = computed(() => getAppSetting('detailsTabLabel', 'Детали'));
const detailsLabelLower = computed(() => String(detailsLabel.value || 'деталь').toLowerCase());
const detailsSectionTitle = computed(() => detailsLabel.value);

// required fields
const requiredMap = computed(() => settingsStore.requiredFields || settingsStore.settings?.requiredFields || {});
const isRequired = (key) => !!requiredMap.value?.[key];
const labelWithRequired = (key, fallback) => `${fallback}${isRequired(key) ? ' *' : ''}`;

const rulesFor = (key) => {
  if (!isRequired(key)) return [];

  if (key === 'services') {
    return [() => (Array.isArray(formData.services) && formData.services.length > 0) || 'Добавьте хотя бы одну услугу'];
  }
  if (key === 'details') {
    return [() => (Array.isArray(formData.details) && formData.details.length > 0) || `Добавьте ${detailsLabelLower.value}`];
  }
  if (key === 'phone') {
    return [
      (v) => {
        const digits = String(v ?? '').replace(/\D/g, '').replace(/^7/, '');
        return digits.length === 10 || 'Введите телефон полностью';
      },
    ];
  }

  return [(v) => String(v ?? '').trim().length > 0 || 'Обязательное поле'];
};

// statuses
const statusOptions = computed(() => [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'additional', title: getAppSetting('additionalStatusName', 'Ждет запчасти') },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
  { value: 'cancelled', title: 'Отменен' },
]);

// colors
const _fallbackStatusColors = {
  accepted: '#4F8CFF',
  in_progress: '#F2B24C',
  additional: '#7C6CFF',
  completed: '#39C37D',
  delivered: '#9AA4B2',
  cancelled: '#FF5D73',
};
const _normStatus = (s) => String(s || '').trim().toLowerCase();

const statusDotStyle = (status) => {
  const key = _normStatus(status);
  const c =
    typeof settingsStore.getOrderStatusColor === 'function'
      ? settingsStore.getOrderStatusColor(key)
      : (_fallbackStatusColors[key] || _fallbackStatusColors.delivered);

  return { backgroundColor: c };
};

const formatPrice = (val) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val || 0);

const totalPrice = computed(() => {
  const s = formData.services.reduce((sum, x) => sum + (Number(x.price) || 0), 0);
  const d = formData.details.reduce((sum, x) => sum + (Number(x.price) || 0), 0);
  return s + d;
});

// stable dropdowns
const menuProps = computed(() => ({
  maxHeight: 320,
  attach: 'body',
  closeOnContentClick: true,
}));

// adders
const serviceToAdd = ref(null);
const detailToAdd = ref(null);

const addService = (service) => {
  if (!service) return;
  hapticTap();
  formData.services.push({
    id: service.id,
    name: service.name,
    price: Number(service.defaultPrice) || 0,
    status: 'accepted',
  });
  serviceToAdd.value = null;
};

const removeService = (index) => formData.services.splice(index, 1);

const addDetail = (detail) => {
  if (!detail) return;
  hapticTap();
  formData.details.push({
    id: detail.id,
    name: detail.name,
    price: Number(detail.defaultPrice) || 0,
    status: 'accepted',
    category: detail.category || '',
  });
  detailToAdd.value = null;
};

const removeDetail = (index) => formData.details.splice(index, 1);

// client filter
const clientFilter = (itemTitle, queryText, item) => {
  const text = String(queryText || '').toLowerCase();
  const name = String(item.raw.name || '').toLowerCase();
  const last = String(item.raw.lastName || '').toLowerCase();
  const phone = String(item.raw.phone || '').toLowerCase();
  return name.includes(text) || last.includes(text) || phone.includes(text);
};

const safeArray = (arr) => (Array.isArray(arr) ? arr : []);

// phone mask
const ensurePhonePrefix = () => {
  if (!formData.phone || !String(formData.phone).startsWith('+7')) {
    formData.phone = '+7 ';
  }
};

const formatRuPhone = (raw) => {
  const s = String(raw ?? '');
  let digits = s.replace(/\D/g, '');

  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.startsWith('7')) digits = digits.slice(1);

  digits = digits.slice(0, 10);

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 8);
  const p4 = digits.slice(8, 10);

  let out = '+7';
  if (p1) out += ` ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  if (!digits) out += ' ';

  return out;
};

const onPhoneInput = (val) => {
  formData.phone = formatRuPhone(val);
};

const onPhoneKeydown = (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};

/**
 * При выборе клиента из списка — подставляем данные.
 * (Это ок: выбор возможен только когда список уже прогружен)
 */
watch(
  () => formData.clientId,
  (id) => {
    if (!id) return;
    const c = (clients.value || []).find((x) => x.id === id);
    if (!c) return;

    formData.clientName = c.name || '';
    formData.lastName = c.lastName || '';
    formData.phone = formatRuPhone(c.phone || '');
  }
);

/**
 * loadOrderData
 * ЖЕСТКОЕ ТРЕБОВАНИЕ:
 * - НЕ ищем id по массиву clients (чтобы избежать гонки загрузки)
 * - просто берем то, что уже есть в заказе (clientId + слепок)
 */
const loadOrderData = () => {
  if (props.orderId) {
    const o = (orderStore.orders || []).find((x) => x.id === props.orderId);
    if (!o) return;

    formData.status = o.status || 'accepted';

    let d = o.date;
    if (d && typeof d.toDate === 'function') d = d.toDate();
    else if (typeof d === 'string') d = new Date(d);

    formData.date = d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : todayStr();
    formData.notes = o.notes || '';

    // NEW: неизменяемая связь
    formData.clientId = o.clientId || null;

    // NEW: оригинальный телефон из заказа (для поиска клиента в сторе)
    formData.oldPhone = o.phone || o.clientPhone || '';

    // слепок
    formData.clientName = o.clientName || '';
    formData.lastName = o.lastName || '';
    formData.phone = formatRuPhone(o.phone || o.clientPhone || '');

    formData.services = safeArray(o.services).map((s) => ({ ...s }));
    formData.details = safeArray(o.details).map((d2) => ({ ...d2 }));
  } else {
    if (props.initialData?.date) formData.date = props.initialData.date;
    if (props.initialData?.clientName) formData.clientName = props.initialData.clientName;
    if (props.initialData?.lastName) formData.lastName = props.initialData.lastName;
    if (props.initialData?.phone) formData.phone = formatRuPhone(props.initialData.phone);

    // если внешне передали clientId — уважаем
    if (props.initialData?.clientId) formData.clientId = props.initialData.clientId;
  }
};

const saveOrder = async () => {
  const res = await form.value?.validate?.();
  const ok = typeof res === 'object' ? res.valid : !!res;

  if (!ok) {
    notify({ text: 'Заполните обязательные поля', color: 'warning' });
    return;
  }

  saving.value = true;
  try {
    // 1) Сначала обновляем/создаем клиента и получаем clientId
    const resolvedClientId = await clientsStore.addOrUpdateClient({
      id: formData.clientId || null,
      oldPhone: formData.oldPhone || '',
      phone: formData.phone || '',
      name: formData.clientName || 'Клиент',
      lastName: formData.lastName || '',
      services: formData.services.map((s) => s.name),
      notes: '',
    });

    const clientId = resolvedClientId || formData.clientId || null;

    // 2) Пишем заказ со связью clientId + слепком
    const snapshotPhone = formData.phone || formData.oldPhone || '';

    const payload = {
      status: formData.status,
      date: formData.date,
      notes: formData.notes,

      // NEW: связь
      clientId,

      // слепок (OrderCard работает с ним)
      clientName: formData.clientName || 'Гость',
      lastName: formData.lastName || '',
      phone: snapshotPhone,
      clientPhone: snapshotPhone,

      services: formData.services,
      details: formData.details,
      total: totalPrice.value,
    };

    if (isEditMode.value) {
      await orderStore.updateOrder(props.orderId, payload);
      notify({ text: 'Сохранено', color: 'success' });
    } else {
      await orderStore.createOrder(payload);
      notify({ text: 'Заказ создан', color: 'success' });
    }

    emit('saved');
    emit('close');
  } catch (e) {
    console.error('Order save failed:', e);
    notify({ text: 'Ошибка сохранения', color: 'error' });
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadOrderData();
});
</script>

<style scoped>
:deep(.dynamic-font-input .v-field__input) {
  font-size: v-bind('currentFontSizePx') !important;
}
:deep(.dynamic-font-input .v-label) {
  font-size: v-bind('currentFontSizePx') !important;
}

:deep(.dynamic-list-item .v-list-item-title) {
  font-size: v-bind('currentFontSizePx') !important;
}
:deep(.dynamic-list-item .v-list-item-subtitle) {
  font-size: v-bind('subFontSizePx') !important;
}

.dynamic-text-body {
  font-size: v-bind('currentFontSizePx') !important;
}
.dynamic-text-sub {
  font-size: v-bind('subFontSizePx') !important;
}

.dynamic-section-title {
  font-size: v-bind('sectionTitleFontSizePx') !important;
  line-height: 1.2;
}
.form-title {
  font-size: v-bind('titleFontSizePx') !important;
}
.form-total {
  font-size: v-bind('totalFontSizePx') !important;
}

.of-card-safe {
  overflow: visible;
}

.of-status-row {
  display: inline-flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex: 0 0 auto;
  box-shadow: 0 0 0 2px rgba(var(--v-theme-surface), 0.9);
}

.of-line-item {
  padding: var(--s-3);
  border-radius: var(--radius-lg);
}

.of-line-item--field {
  background: rgb(var(--v-theme-surface)) !important;
  border-color: rgba(var(--v-theme-outline-variant), 0.55) !important;
  color: rgb(var(--v-theme-on-surface)) !important;
}

.price-input :deep(.v-field__outline) {
  display: none;
}
.price-input :deep(.v-field__input) {
  padding: 0;
  font-weight: 700;
  color: rgb(var(--v-theme-primary));
}

.safe-area-bottom {
  padding-bottom: env(safe-area-inset-bottom, 16px) !important;
}
</style>