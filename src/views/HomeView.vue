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
      ></v-btn>
    </div>

    <div
      class="orders-list-container"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
    >
      <div v-if="!isLoggedIn" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-lock-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Нужен вход</div>
        <div class="text-body-2 text-disabled mt-2">Войдите, чтобы видеть заказы.</div>
        <v-btn class="mt-4" color="primary" to="/settings">Перейти в настройки</v-btn>
      </div>

      <div v-else-if="loading && !orders.length" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-timer-sand</v-icon>
        <div class="text-h6 text-medium-emphasis">Загрузка...</div>
        <div class="text-body-2 text-disabled mt-2">Подготавливаем список заказов.</div>
      </div>

      <div v-else-if="filteredOrders.length" class="pa-2 pb-16">
        <OrderCard
          v-for="order in filteredOrders"
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
        <v-btn 
          v-if="selectedDate"
          variant="text" 
          color="primary" 
          class="mt-4"
          @click="createOrder"
        >
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
      ></v-btn>
    </v-fab-transition>

    <v-dialog v-model="showOrderForm" fullscreen transition="dialog-bottom-transition">
      <OrderForm
        :order-id="orderToEditId"
        :initial-data="initialOrderData"
        @close="showOrderForm = false"
      />
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { storeToRefs } from 'pinia';
import OrderCard from '@/components/OrderCard.vue';
import OrderForm from '@/components/OrderForm.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();
const { orders, loading, user } = storeToRefs(orderStore);
const { triggerHapticFeedback } = useHapticFeedback();
const indicatorStatuses = computed(
  () => settingsStore.appSettings.fullCalendarIndicatorStatuses || []
);
const showCompletedOrders = computed(() => settingsStore.appSettings.showCompletedOrders);

// Состояние
const showFullCalendar = ref(false);
const showOrderForm = ref(false);
const selectedDate = ref(null); // Если null - показываем все
const currentDate = ref(new Date()); // Текущий месяц просмотра
const orderToEditId = ref(null);
const initialOrderData = ref({});
const isLoggedIn = computed(() => Boolean(user.value));

// Хелперы даты
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
};

const formatDateShort = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
};

const normalizeStatus = (status) => (status ?? '').trim();

const toDateObject = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return null;
};

const toDateKey = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }
  }
  const date = toDateObject(value);
  return date ? getLocalDateString(date) : null;
};

const getOrderDateKey = (order) => toDateKey(order.deadline ?? order.createDate);

// Данные для календаря
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() => 
  currentDate.value.toLocaleDateString('ru-RU', { month: 'long' })
);

// Генерация сетки 42 дня
const flatCalendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const indicatorStatusList = indicatorStatuses.value
    .map((status) => normalizeStatus(status))
    .filter(Boolean);
  const indicatorStatusSet = new Set(indicatorStatusList);
  
  // Первое число месяца
  const firstDayOfMonth = new Date(year, month, 1);
  // Определяем день недели (0-ВС, 1-ПН...)
  let dayOfWeek = firstDayOfMonth.getDay();
  // Коррекция для ПН-начала: ВС(0) -> 6, ПН(1) -> 0
  dayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  
  // Старт сетки (понедельник перед 1 числом)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(firstDayOfMonth.getDate() - dayOfWeek);

  const days = [];
  const todayStr = getLocalDateString(new Date());

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const dateStr = getLocalDateString(d);
    
    // Статистика заказов на этот день
    // Ищем заказы по deadline (или createDate)
    const dayOrders = orders.value.filter((order) => getOrderDateKey(order) === dateStr);

    const indicatorOrders = dayOrders.filter((order) => {
      const status = normalizeStatus(order.status);
      return indicatorStatusSet.has(status);
    });
    const statusCounts = indicatorOrders.reduce((acc, order) => {
      const status = normalizeStatus(order.status);
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    const statuses = {};
    indicatorStatusList.forEach((status) => {
      const count = statusCounts[status];
      if (count > 0) statuses[status] = count;
    });

    days.push({
      date: dateStr,
      number: d.getDate(),
      isToday: dateStr === todayStr,
      otherMonth: d.getMonth() !== month,
      orderStats: { total: indicatorOrders.length, statuses }
    });
  }
  return days;
});

// Фильтрация списка
const filteredOrders = computed(() => {
  let list = [...orders.value];
  
  if (!showCompletedOrders.value) {
    const hiddenStatuses = new Set(['delivered', 'cancelled']);
    list = list.filter((order) => !hiddenStatuses.has(normalizeStatus(order.status)));
  }

  if (selectedDate.value) {
    list = list.filter((order) => getOrderDateKey(order) === selectedDate.value);
  }
  
  // Сортировка: Ближайшие сверху
  return list.sort((a, b) => {
    const aDate = toDateObject(a.deadline) ?? toDateObject(a.createDate);
    const bDate = toDateObject(b.deadline) ?? toDateObject(b.createDate);
    return (aDate?.getTime() ?? 0) - (bDate?.getTime() ?? 0);
  });
});

// Методы
const getStatusLabel = (status) => {
  const normalizedStatus = normalizeStatus(status);
  const map = {
    'in_progress': 'В работе',
    'additional': settingsStore.appSettings.additionalStatusName || 'Доп. статус',
    'accepted': 'Принят',
    'completed': 'Готов',
    'delivered': 'Сдан'
  };
  return map[normalizedStatus] || normalizedStatus;
};

const handleDayClick = (day) => {
  triggerHapticFeedback('tap');
  selectedDate.value = day.date;
  showFullCalendar.value = false;
};

const createOrder = () => {
  triggerHapticFeedback('tap');
  orderToEditId.value = null;
  initialOrderData.value = { deadline: selectedDate.value || getLocalDateString(new Date()) };
  showOrderForm.value = true;
};

const editOrder = (order) => {
  orderToEditId.value = order.id;
  initialOrderData.value = {};
  showOrderForm.value = true;
};

const confirmDeleteOrder = async (orderId) => {
  const confirmed = await confirmationStore.open(
    'Удаление заказа',
    'Вы уверены, что хотите удалить этот заказ?'
  );
  if (!confirmed) return;
  await orderStore.deleteOrder(orderId);
};

const nextMonth = () => currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() + 1));
const previousMonth = () => currentDate.value = new Date(currentDate.value.setMonth(currentDate.value.getMonth() - 1));

// Свайп вниз для открытия
const touchStartY = ref(0);
const handleTouchStart = (e) => touchStartY.value = e.touches[0].clientY;
const handleTouchEnd = (e) => {
  const dy = e.changedTouches[0].clientY - touchStartY.value;
  // Если свайпнули сильно вниз и мы наверху страницы
  if (dy > 120 && window.scrollY < 50) {
    triggerHapticFeedback('light');
    showFullCalendar.value = true;
  }
};

watch(
  () => route.query.editOrderId,
  (orderId) => {
    if (!orderId) return;
    orderToEditId.value = Array.isArray(orderId) ? orderId[0] : orderId;
    initialOrderData.value = {};
    showOrderForm.value = true;
    const { editOrderId, ...rest } = route.query;
    router.replace({ query: rest });
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
  min-height: 0; /* Важно для скролла */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}

.lh-1 { line-height: 1.1; }

/* === ПОЛНОЭКРАННЫЙ КАЛЕНДАРЬ === */
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
  /* ФИКСИРОВАННЫЙ РАЗМЕР ШРИФТА ДЛЯ СЕТКИ */
  font-size: 14px !important; 
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.5);
}

.days-grid {
  flex-grow: 1;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr); /* 6 рядов */
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

.day-cell:active {
  background-color: rgba(var(--v-theme-primary), 0.1);
}

.day-cell.other-month {
  background-color: rgba(0,0,0,0.02);
}
.day-cell.other-month .day-number {
  opacity: 0.3;
}
.day-cell.is-selected {
  background-color: rgba(var(--v-theme-primary), 0.08);
}

.day-number {
  /* ФИКСИРОВАННЫЙ РАЗМЕР ЧИСЛА */
  font-size: 20px !important;
  font-weight: 700;
  margin-left: 4px;
  margin-top: 2px;
  color: rgb(var(--v-theme-on-surface));
}

.day-cell.is-today .day-number {
  color: rgb(var(--v-theme-primary));
}

/* Стек полосок */
.status-stack {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-grow: 1;
  overflow: hidden;
  margin-top: 2px;
}

.status-bar {
  height: 14px; /* Фиксированная высота */
  border-radius: 2px;
  padding: 0 2px;
  display: flex;
  align-items: center;
}

.status-text {
  /* ФИКСИРОВАННЫЙ РАЗМЕР ТЕКСТА */
  font-size: 10px !important;
  line-height: 1;
  color: white;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Цвета статусов */
.status-bar.in_progress { background-color: #FB8C00; }
.status-bar.completed { background-color: #43A047; }
.status-bar.delivered { background-color: #757575; }
.status-bar.additional { background-color: #7C4DFF; }
.status-bar.accepted { background-color: #2979FF; }

/* Анимация календаря (выезд снизу) */
.calendar-slide-enter-active,
.calendar-slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.2, 0, 0.2, 1);
}
.calendar-slide-enter-from,
.calendar-slide-leave-to {
  transform: translateY(100%);
}
</style>
