<template>
  <div class="home-view-wrapper">
    <div class="filter-header px-4 py-3 d-flex align-center justify-space-between bg-surface">
      <div class="d-flex align-center" @click="showFullCalendar = true">
        <v-icon color="primary" class="mr-2">mdi-calendar-month</v-icon>

        <div v-if="selectedDate">
          <div class="text-caption text-medium-emphasis lh-1">Просмотр</div>
          <div class="text-subtitle-1 font-weight-bold lh-1 text-primary">
            {{ formatDateFull(selectedDate) }}
          </div>
        </div>
        <div v-else>
          <div class="text-subtitle-1 font-weight-bold">Все заказы</div>
        </div>

        <v-icon icon="mdi-chevron-down" size="small" class="ml-1 text-medium-emphasis"></v-icon>
      </div>

      <v-btn
        v-if="selectedDate"
        icon="mdi-close"
        variant="text"
        size="small"
        color="medium-emphasis"
        @click.stop="selectedDate = null"
      />
    </div>

    <div class="orders-list-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
      <div v-if="!isLoggedIn" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-lock-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Нужен вход</div>
        <div class="text-body-2 text-disabled mt-2">Войдите, чтобы видеть заказы.</div>
        <v-btn class="mt-4" color="primary" to="/settings">Перейти в настройки</v-btn>
      </div>

      <div v-else-if="isLoading && !orders.length" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-timer-sand</v-icon>
        <div class="text-h6 text-medium-emphasis">Загрузка...</div>
        <div class="text-body-2 text-disabled mt-2">Подготавливаем список заказов.</div>
      </div>

      <div v-else-if="viewOrders.length" class="pa-2 pb-16">
        <OrderCard
          v-for="order in viewOrders"
          :key="order.id"
          :order="order"
          @edit="editOrder"
          @delete="confirmDeleteOrder"
          class="mb-3"
        />
      </div>

      <div v-else class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-clipboard-text-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Нет заказов</div>
        <div class="text-body-2 text-disabled mt-2">
          {{ selectedDate ? 'На эту дату ничего нет' : 'Список пуст' }}
        </div>
        <v-btn v-if="selectedDate" variant="text" color="primary" class="mt-4" @click="createOrder">
          Создать на {{ formatDateShort(selectedDate) }}
        </v-btn>
      </div>
    </div>

    <transition name="calendar-slide">
      <div v-if="showFullCalendar" class="fullscreen-calendar">
        <div class="calendar-header d-flex align-center justify-space-between px-4">
          <div class="d-flex align-center">
            <span class="text-h5 font-weight-bold mr-2">{{ currentMonthName }}</span>
            <span class="text-h5 text-medium-emphasis">{{ currentYear }}</span>
          </div>
          <div class="d-flex align-center">
            <v-btn icon="mdi-chevron-left" variant="text" @click="previousMonth"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" @click="nextMonth"></v-btn>
            <v-btn icon="mdi-close" variant="text" class="ml-2" @click="showFullCalendar = false"></v-btn>
          </div>
        </div>

        <div class="weekdays-grid">
          <div v-for="day in ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']" :key="day" class="weekday-label">
            {{ day }}
          </div>
        </div>

        <div class="days-grid">
          <div
            v-for="(day, index) in flatCalendarDays"
            :key="day.date || index"
            class="day-cell"
            :class="{
              'other-month': day.otherMonth,
              'is-today': day.isToday,
              'is-selected': day.date === selectedDate
            }"
            @click="handleDayClick(day)"
          >
            <div class="day-number">{{ day.number }}</div>

            <div class="status-stack" v-if="day.date">
              <div
                v-for="(count, status) in day.orderStats.statuses"
                :key="status"
                class="status-bar"
                :class="status"
              >
                <span class="status-text">{{ getStatusLabel(status) }} {{ count }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>

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
      <OrderForm :order-id="orderToEditId" :initial-data="initialOrderData" @close="showOrderForm = false" />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/authStore';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

import OrderCard from '@/components/OrderCard.vue';
import OrderForm from '@/components/OrderForm.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const route = useRoute();
const router = useRouter();

const authStore = useAuthStore();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();

const { orders, isLoading } = storeToRefs(orderStore);
const { triggerHapticFeedback } = useHapticFeedback();

const isLoggedIn = computed(() => authStore.isAuthenticated);

const indicatorStatuses = computed(() => settingsStore.appSettings?.fullCalendarIndicatorStatuses || []);
const showCompletedOrders = computed(() => !!settingsStore.appSettings?.showCompletedOrders);

// UI
const showFullCalendar = ref(false);
const showOrderForm = ref(false);
const selectedDate = ref(null); // YYYY-MM-DD | null
const currentDate = ref(new Date());
const orderToEditId = ref(null);
const initialOrderData = ref({});

// ---- date helpers
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

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();

// ---- Calendar
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() => currentDate.value.toLocaleDateString('ru-RU', { month: 'long' }));

const flatCalendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();

  const indicatorList = indicatorStatuses.value.map((s) => String(s || '').trim()).filter(Boolean);
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

    const dayOrdersAll = orders.value.filter((o) => getOrderDateKey(o) === dateStr);

    // Учитываем showCompletedOrders так же, как и в списке
    const dayOrders = showCompletedOrders.value
      ? dayOrdersAll
      : dayOrdersAll.filter((o) => !['delivered', 'cancelled'].includes(normalizeStatus(o?.status)));

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

// ---- List
const viewOrders = computed(() => {
  // base: store getter (multi-status + search + sorting)
  let list = orderStore.filteredOrders;

  // hide completed/cancelled (если выключено)
  if (!showCompletedOrders.value) {
    const hidden = new Set(['delivered', 'cancelled']);
    list = list.filter((o) => !hidden.has(normalizeStatus(o?.status)));
  }

  // date filter from calendar
  if (selectedDate.value) {
    list = list.filter((o) => getOrderDateKey(o) === selectedDate.value);
  }

  return list;
});

// ---- Status labels (как было)
const getStatusLabel = (status) => {
  const s = normalizeStatus(status);
  const map = {
    in_progress: 'В работе',
    accepted: 'Принят',
    additional: settingsStore.appSettings?.additionalStatusName || 'Доп. статус',
    completed: 'Готов',
    delivered: 'Сдан',
    cancelled: 'Отменен',
  };
  return map[s] || s;
};

// ---- Actions
const handleDayClick = (day) => {
  triggerHapticFeedback('tap');
  selectedDate.value = day.date;
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
};

const nextMonth = () => (currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1)));
const previousMonth = () => (currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1)));

// swipe-down open
const touchStartY = ref(0);
const handleTouchStart = (e) => (touchStartY.value = e.touches[0].clientY);
const handleTouchEnd = (e) => {
  const dy = e.changedTouches[0].clientY - touchStartY.value;
  if (dy > 120 && window.scrollY < 50) {
    triggerHapticFeedback('light');
    showFullCalendar.value = true;
  }
};

// query helpers
const clearQueryParams = (keys) => {
  const q = { ...route.query };
  keys.forEach((k) => delete q[k]);
  router.replace({ query: q });
};

watch(
  () => route.query.newOrder,
  (flag) => {
    const f = Array.isArray(flag) ? flag[0] : flag;
    if (!f) return;

    const date = selectedDate.value || getLocalDateString(new Date());
    orderToEditId.value = null;

    initialOrderData.value = {
      date,
      clientId: (Array.isArray(route.query.clientId) ? route.query.clientId[0] : route.query.clientId) || '',
      clientName: (Array.isArray(route.query.clientName) ? route.query.clientName[0] : route.query.clientName) || '',
      lastName: (Array.isArray(route.query.clientLastName) ? route.query.clientLastName[0] : route.query.clientLastName) || '',
      phone: (Array.isArray(route.query.clientPhone) ? route.query.clientPhone[0] : route.query.clientPhone) || '',
    };

    showOrderForm.value = true;
    clearQueryParams(['newOrder', 'clientId', 'clientName', 'clientLastName', 'clientPhone']);
  },
  { immediate: true }
);

watch(
  () => route.query.editOrderId,
  (orderId) => {
    const id = Array.isArray(orderId) ? orderId[0] : orderId;
    if (!id) return;

    orderToEditId.value = id;
    initialOrderData.value = {};
    showOrderForm.value = true;
    clearQueryParams(['editOrderId']);
  },
  { immediate: true }
);
</script>

<style scoped>
.home-view-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.orders-list-container {
  flex-grow: 1;
  background-color: rgb(var(--v-theme-background));
  min-height: 0;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.lh-1 { line-height: 1.1; }

.fullscreen-calendar {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: rgb(var(--v-theme-surface));
  z-index: 2000;
  display: flex;
  flex-direction: column;
}

.calendar-header {
  height: 60px;
  flex-shrink: 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.weekdays-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  padding: 8px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.weekday-label {
  font-size: 14px !important;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.days-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
}

.day-cell {
  border-right: 1px solid rgba(var(--v-border-color), 0.08);
  border-bottom: 1px solid rgba(var(--v-border-color), 0.08);
  padding: 2px;
  display: flex;
  flex-direction: column;
  position: relative;
  transition: background-color 0.1s;
}

.day-cell:active { background-color: rgba(var(--v-theme-primary), 0.1); }
.day-cell.other-month { background-color: rgba(0,0,0,0.02); }
.day-cell.other-month .day-number { opacity: 0.3; }
.day-cell.is-selected { background-color: rgba(var(--v-theme-primary), 0.08); }

.day-number {
  font-size: 20px !important;
  font-weight: 700;
  margin-left: 4px;
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface));
}

.day-cell.is-today .day-number { color: rgb(var(--v-theme-primary)); }
</style>