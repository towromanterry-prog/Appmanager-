<template>
  <AppPage>
    <AppSection>
      <AppCard>
        <OrdersToolbar
          :selected-date="selectedDate"
          @open-calendar="showFullCalendar = true"
          @clear-date="setSelectedDate(null)"
        />
      </AppCard>
    </AppSection>

    <AppSection class="flex-grow-1 min-h-0">
      <AppCard class="h-100">
        <OrdersList
          :is-logged-in="isLoggedIn"
          :is-loading="isLoading"
          :orders="viewOrders"
          :selected-date="selectedDate"
          :format-date-full="formatDateFull"
          :format-date-short="formatDateShort"
          @create="createOrder"
          @edit="editOrder"
          @delete="confirmDeleteOrder"
        />
      </AppCard>
    </AppSection>

    <OrdersCalendar
      v-model:open="showFullCalendar"
      :selected-date="selectedDate"
      :current-date="currentDate"
      :flat-days="flatCalendarDays"
      :current-month-name="currentMonthName"
      :current-year="currentYear"
      :get-status-label="getStatusLabel"
      @select-day="handleDayClick"
      @prev-month="previousMonth"
      @next-month="nextMonth"
    />

    <v-fab-transition>
      <v-btn
        v-if="!showFullCalendar && isLoggedIn"
        position="fixed"
        location="bottom right"
        icon="mdi-plus"
        size="x-large"
        color="primary"
        elevation="4"
        class="mb-4 mr-4"
        style="bottom: 80px; z-index: 90;"
        @click="createOrder"
      />
    </v-fab-transition>

    <v-dialog v-model="showOrderForm" fullscreen transition="dialog-bottom-transition">
      <OrderForm
        :order-id="orderToEditId"
        :initial-data="initialOrderData"
        @close="onOrderFormClose"
        @saved="onOrderSaved"
        @created="onOrderCreated"
        @updated="onOrderUpdated"
      />
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :timeout="2200" location="bottom">
      {{ snackbar.text }}
    </v-snackbar>
  </AppPage>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

import OrdersToolbar from '@/components/home/OrdersToolbar.vue';
import OrdersCalendar from '@/components/home/OrdersCalendar.vue';
import OrdersList from '@/components/home/OrdersList.vue';

import OrderForm from '@/components/OrderForm.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import { useFormatDate } from '@/composables/useDateUtils';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();

const { isLoading } = storeToRefs(orderStore);
const { triggerHapticFeedback } = useHapticFeedback();
const { toLongDate, toShortDate } = useFormatDate();

const isLoggedIn = computed(() => authStore.isAuthenticated);

// showCancelled — берём из settingsStore (поддержка обоих вариантов структуры)
const showCancelled = computed(() => {
  const s = settingsStore?.settings;
  return !!(s?.showCancelled ?? s?.appSettings?.showCancelled ?? settingsStore?.appSettings?.showCancelled);
});

// UI
const showFullCalendar = ref(false);
const showOrderForm = ref(false);
const orderToEditId = ref(null);
const initialOrderData = ref({});

const snackbar = ref({ show: false, text: '' });
const toast = (text) => {
  snackbar.value.text = text;
  snackbar.value.show = true;
};

// ---- date helpers (YYYY-MM-DD)
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const toDateObject = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') return value.toDate();
  if (typeof value === 'object' && typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return null;
};

const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const d = toDateObject(value);
  return d ? getLocalDateString(d) : null;
};

// В новой модели приоритет: date -> startAt -> createdAt
const getOrderDateKey = (o) => toDateKey(o?.date) || toDateKey(o?.startAt) || toDateKey(o?.createdAt);

// ---- selectedDate в URL (?date=YYYY-MM-DD)
const selectedDate = ref(null); // YYYY-MM-DD | null

const setSelectedDate = (val) => {
  selectedDate.value = val;
};

watch(
  () => route.query.date,
  (qDate) => {
    const raw = Array.isArray(qDate) ? qDate[0] : qDate;
    const next = typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
    if (selectedDate.value !== next) selectedDate.value = next;
  },
  { immediate: true }
);

watch(
  selectedDate,
  (val) => {
    const nextQuery = { ...route.query };
    if (val) nextQuery.date = val;
    else delete nextQuery.date;

    // чтобы не плодить history
    router.replace({ query: nextQuery });
  },
  { flush: 'post' }
);

// ---- formatters
const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return toLongDate(d).replace(/\s*г\.\s*$/, '');
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return toShortDate(d);
};

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();

// ---- Calendar data
const currentDate = ref(new Date());
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() => currentDate.value.toLocaleDateString('ru-RU', { month: 'long' }));

// Индикаторные статусы (как было), безопасно — если настроек нет
const indicatorStatuses = computed(() => {
  const s = settingsStore?.settings;
  return (
    s?.fullCalendarIndicatorStatuses ||
    s?.appSettings?.fullCalendarIndicatorStatuses ||
    settingsStore?.appSettings?.fullCalendarIndicatorStatuses ||
    []
  );
});

const flatCalendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const indicatorList = (indicatorStatuses.value || []).map((s) => String(s || '').trim()).filter(Boolean);
  const indicatorSet = new Set(indicatorList.map((s) => s.toLowerCase()));

  const firstDayOfMonth = new Date(year, month, 1);
  let dayOfWeek = firstDayOfMonth.getDay();
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  const todayStr = getLocalDateString(new Date());

  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = getLocalDateString(d);

    const dayOrdersAll = orderStore.filteredOrders.filter((o) => getOrderDateKey(o) === dateStr);

    // showCancelled влияет и на календарь (чтобы совпадало со списком)
    const dayOrders = showCancelled.value
      ? dayOrdersAll
      : dayOrdersAll.filter((o) => normalizeStatus(o?.status) !== 'cancelled');

    const indicatorOrders = dayOrders.filter((o) => indicatorSet.has(normalizeStatus(o?.status)));

    const statusCounts = indicatorOrders.reduce((acc, o) => {
      const st = normalizeStatus(o?.status);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    const statuses = {};
    indicatorList.forEach((stRaw) => {
      const st = stRaw.toLowerCase();
      const c = statusCounts[st];
      if (c > 0) statuses[st] = c;
    });

    days.push({
      date: dateStr,
      number: d.getDate(),
      isToday: dateStr === todayStr,
      otherMonth: d.getMonth() !== month,
      orderStats: { total: indicatorOrders.length, statuses },
    });
  }

  return days;
});

// ---- List (обязательно от orderStore.filteredOrders + уважать showCancelled)
const viewOrders = computed(() => {
  let list = orderStore.filteredOrders;

  if (!showCancelled.value) {
    list = list.filter((o) => normalizeStatus(o?.status) !== 'cancelled');
  }

  if (selectedDate.value) {
    list = list.filter((o) => getOrderDateKey(o) === selectedDate.value);
  }

  return list;
});

// ---- Status labels
const getStatusLabel = (status) => {
  const s = normalizeStatus(status);
  const map = {
    in_progress: 'В работе',
    accepted: 'Принят',
    additional: settingsStore?.settings?.additionalStatusName || settingsStore?.appSettings?.additionalStatusName || 'Доп. статус',
    completed: 'Готов',
    delivered: 'Сдан',
    cancelled: 'Отменен',
  };
  return map[s] || s;
};

// ---- Actions
const handleDayClick = (day) => {
  triggerHapticFeedback('tap');
  setSelectedDate(day.date);
  showFullCalendar.value = false;
};

const createOrder = () => {
  triggerHapticFeedback('tap');
  orderToEditId.value = null;
  initialOrderData.value = { date: selectedDate.value || getLocalDateString(new Date()) };
  showOrderForm.value = true;
};

const editOrder = (order) => {
  orderToEditId.value = order.id;
  initialOrderData.value = {};
  showOrderForm.value = true;
};

const confirmDeleteOrder = async (orderId) => {
  const ok = await confirmationStore.open('Удаление заказа', 'Вы уверены, что хотите удалить этот заказ?');
  if (!ok) return;

  await orderStore.deleteOrder(orderId);

  if (orderToEditId.value === orderId) {
    showOrderForm.value = false;
    orderToEditId.value = null;
    initialOrderData.value = {};
  }

  toast('Удалено');
};

const nextMonth = () => (currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1)));
const previousMonth = () => (currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1)));

// ---- OrderForm hooks (на случай разных emit-ов)
const onOrderCreated = () => toast('Заказ создан');
const onOrderUpdated = () => toast('Сохранено');
const onOrderSaved = (payload) => {
  // Если OrderForm шлёт что-то вроде { mode: 'create' | 'update' }
  const mode = payload?.mode;
  if (mode === 'create') toast('Заказ создан');
  else if (mode === 'update') toast('Сохранено');
  else {
    // fallback по контексту
    toast(orderToEditId.value ? 'Сохранено' : 'Заказ создан');
  }
};

const onOrderFormClose = (payload) => {
  // payload опционален — просто закрываем
  showOrderForm.value = false;

  // если вдруг close сообщает результат
  if (payload?.action === 'created') toast('Заказ создан');
  if (payload?.action === 'updated') toast('Сохранено');
  if (payload?.action === 'deleted') toast('Удалено');
};
</script>
