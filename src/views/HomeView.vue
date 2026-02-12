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
  () => settingsStore.appSettings?.fullCalendarIndicatorStatuses || []
);

const showCompletedOrders = computed(() => settingsStore.appSettings?.showCompletedOrders ?? true);

const showFullCalendar = ref(false);
const showOrderForm = ref(false);
const selectedDate = ref(null); 
const currentDate = ref(new Date()); 
const orderToEditId = ref(null);
const initialOrderData = ref({});

const isLoggedIn = computed(() => Boolean(user.value));

// Вспомогательные функции для дат
const getLocalDateString = (date) => {
  const d = new Date(date);
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

const formatDateFull = (dateStr) => {
  if (!dateStr) return '';
  const options = { day: 'numeric', month: 'long', weekday: 'long' };
  return new Date(dateStr).toLocaleDateString('ru-RU', options);
};

const formatDateShort = (date) => {
  return date.getDate();
};

const normalizeStatus = (status) => {
  const map = {
    'accepted': 'accepted',
    'pending': 'accepted', 
    'in_progress': 'in_progress',
    'work': 'in_progress',
    'ready': 'completed',
    'completed': 'completed',
    'issued': 'delivered',
    'delivered': 'delivered',
    'additional': 'additional',
    'cancelled': 'cancelled'
  };
  return map[status] || 'accepted';
};

const clearQueryParams = () => {
    router.replace({ query: null });
};

// Конвертация Date в YYYY-MM-DD
const toDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// Определяем дату для группировки заказа (deadline или createdAt)
const getOrderDateKey = (order) => {
    if (order.deadline) return order.deadline; // уже YYYY-MM-DD
    if (order.createdAt && order.createdAt.seconds) {
        const d = new Date(order.createdAt.seconds * 1000);
        return toDateKey(d);
    }
    return null;
};

// Календарь
const currentYear = computed(() => currentDate.value.getFullYear());
const currentMonthName = computed(() => {
  return currentDate.value.toLocaleDateString('ru-RU', { month: 'long' });
});

const flatCalendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = (firstDay.getDay() + 6) % 7; // Пн=0, Вс=6
  
  const days = [];
  
  // Пустые ячейки в начале
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ day: '', dateStr: '', empty: true });
  }
  
  // Дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(year, month, i);
    const dateStr = toDateKey(d);
    
    const dayOrders = orders.value.filter(o => {
        if (!showCompletedOrders.value && (normalizeStatus(o.status) === 'delivered' || normalizeStatus(o.status) === 'cancelled')) return false;
        return getOrderDateKey(o) === dateStr;
    });

    const indicators = [];
    if (dayOrders.length > 0) {
        const statusesSet = new Set(dayOrders.map(o => normalizeStatus(o.status)));
        const checkList = indicatorStatuses.value.length > 0 
           ? indicatorStatuses.value 
           : ['expired', 'today', 'additional', 'accepted', 'in_progress', 'completed', 'delivered'];

        checkList.forEach(st => {
            if (statusesSet.has(st)) indicators.push(st);
        });
    }

    days.push({
      day: i,
      date: d,
      dateStr: dateStr,
      indicators: [...new Set(indicators)].slice(0, 3) 
    });
  }
  
  return days;
});

// Фильтрация заказов для списка
const filteredOrders = computed(() => {
  let list = orders.value;

  if (orderStore.filterStatus.length > 0) {
    list = list.filter(o => orderStore.filterStatus.includes(normalizeStatus(o.status)));
  }

  if (selectedDate.value) {
    list = list.filter(o => getOrderDateKey(o) === selectedDate.value);
  } else {
     if (!showCompletedOrders.value) {
        list = list.filter(o => {
            const s = normalizeStatus(o.status);
            return s !== 'delivered' && s !== 'cancelled';
        });
     }
  }

  return list.sort((a, b) => {
    const dA = a.deadline ? new Date(a.deadline) : new Date(8640000000000000);
    const dB = b.deadline ? new Date(b.deadline) : new Date(8640000000000000);
    return dA - dB; 
  });
});

const handleDayClick = (day) => {
    if (day.empty) return;
    triggerHapticFeedback('light');
    selectedDate.value = selectedDate.value === day.dateStr ? null : day.dateStr;
};

const createOrder = () => {
    triggerHapticFeedback('medium');
    orderToEditId.value = null;
    initialOrderData.value = {};
    if (selectedDate.value) {
        initialOrderData.value.deadline = selectedDate.value;
    }
    showOrderForm.value = true;
};

const editOrder = (order) => {
    triggerHapticFeedback('light');
    orderToEditId.value = order.id;
    initialOrderData.value = { ...order };
    showOrderForm.value = true;
};

const confirmDeleteOrder = (orderId) => {
    triggerHapticFeedback('warning');
    confirmationStore.confirm(
        'Удалить заказ?',
        'Вы уверены, что хотите удалить этот заказ? Это действие необратимо.',
        () => orderStore.deleteOrder(orderId)
    );
};

const nextMonth = () => {
    triggerHapticFeedback('selection');
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1, 1);
};

const previousMonth = () => {
    triggerHapticFeedback('selection');
    currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1, 1);
};

// Watchers
watch(() => route.query.new, (val) => {
    if (val === 'true') {
        createOrder();
        clearQueryParams();
    }
});

watch(() => route.query.edit, (val) => {
    if (val) {
        const order = orders.value.find(o => o.id === val);
        if (order) {
            editOrder(order);
        }
        clearQueryParams();
    }
});
</script>

<template>
  <div class="fill-height bg-background pb-16"> 
    <div class="px-4 pt-4 pb-2 d-flex align-center justify-space-between">
      <h2 class="text-h5 font-weight-bold text-primary">
        {{ selectedDate ? formatDateFull(selectedDate) : 'Все заказы' }}
      </h2>
      <v-btn
        icon
        variant="text"
        color="primary"
        @click="showFullCalendar = !showFullCalendar; triggerHapticFeedback('selection')"
      >
        <v-icon>{{ showFullCalendar ? 'mdi-calendar-collapse-horizontal' : 'mdi-calendar-month' }}</v-icon>
      </v-btn>
    </div>

    <v-expand-transition>
      <div v-if="showFullCalendar" class="px-2 mb-2">
        <v-sheet class="rounded-xl pa-3" elevation="2" color="surface">
           <div class="d-flex align-center justify-space-between mb-2">
              <v-btn icon density="compact" variant="text" @click="previousMonth">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
              <span class="text-subtitle-1 font-weight-bold capitalize">{{ currentMonthName }} {{ currentYear }}</span>
              <v-btn icon density="compact" variant="text" @click="nextMonth">
                <v-icon>mdi-chevron-right</v-icon>
              </v-btn>
           </div>
           
           <div class="calendar-grid">
              <div class="text-caption text-center text-grey" v-for="d in ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']" :key="d">{{d}}</div>
              
              <div 
                v-for="(day, idx) in flatCalendarDays" 
                :key="idx"
                class="calendar-day rounded-circle d-flex flex-column align-center justify-center"
                :class="{
                    'empty': day.empty,
                    'selected': selectedDate === day.dateStr,
                    'today': day.dateStr === toDateKey(new Date())
                }"
                @click="handleDayClick(day)"
              >
                  <span v-if="!day.empty" class="text-body-2">{{ day.day }}</span>
                  <div class="indicators d-flex mt-1">
                      <div 
                        v-for="ind in day.indicators" 
                        :key="ind" 
                        class="indicator-dot"
                        :class="ind"
                      ></div>
                  </div>
              </div>
           </div>
        </v-sheet>
      </div>
    </v-expand-transition>

    <div class="px-3">
       <div v-if="loading" class="d-flex justify-center mt-10">
         <v-progress-circular indeterminate color="primary"></v-progress-circular>
       </div>
       
       <template v-else>
         <div v-if="filteredOrders.length === 0" class="text-center mt-10 text-grey">
            <v-icon size="64" class="mb-2">mdi-clipboard-text-off-outline</v-icon>
            <div>Заказов нет</div>
            <v-btn v-if="selectedDate" variant="text" color="primary" class="mt-2" @click="selectedDate = null">
                Показать все
            </v-btn>
         </div>

         <transition-group name="list" tag="div">
           <OrderCard
             v-for="order in filteredOrders"
             :key="order.id"
             :order="order"
             @click="editOrder(order)"
             @delete="confirmDeleteOrder(order.id)"
           />
         </transition-group>
       </template>
    </div>

    <v-fab
      icon="mdi-plus"
      color="primary"
      location="bottom end"
      position="fixed"
      class="mb-16 mr-4"
      size="large"
      app
      @click="createOrder"
    ></v-fab>

    <!-- ИСПРАВЛЕНИЕ: Обертка v-dialog для формы -->
    <v-dialog v-model="showOrderForm" fullscreen transition="dialog-bottom-transition">
      <OrderForm
        :orderId="orderToEditId"
        :initialData="initialOrderData"
        @close="showOrderForm = false"
        @saved="showOrderForm = false"
      />
    </v-dialog>

  </div>
</template>

<style scoped>
.capitalize {
  text-transform: capitalize;
}
.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.calendar-day {
  aspect-ratio: 1;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;
}
.calendar-day.selected {
  background-color: rgb(var(--v-theme-primary));
  color: white;
  font-weight: bold;
}
.calendar-day.today {
  border: 1px solid rgb(var(--v-theme-primary));
}
.indicator-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  margin: 0 1px;
}
/* Цвета индикаторов */
.indicator-dot.expired { background-color: rgb(var(--v-theme-error)); }
.indicator-dot.accepted { background-color: rgb(var(--v-theme-info)); }
.indicator-dot.in_progress { background-color: rgb(var(--v-theme-warning)); }
.indicator-dot.completed { background-color: rgb(var(--v-theme-success)); }
.indicator-dot.additional { background-color: #9C27B0; }
.indicator-dot.delivered { background-color: grey; }

/* Анимации списка */
.list-enter-active,
.list-leave-active {
  transition: all 0.3s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
