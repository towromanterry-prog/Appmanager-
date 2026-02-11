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

    <div class="orders-list-container">
       <div v-if="filteredOrders.length" class="pa-2 pb-16">
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
         <v-icon size="64" color="surface-variant">mdi-clipboard-text-outline</v-icon>
         <div class="text-h6 mt-4">Нет заказов</div>
         <v-btn v-if="selectedDate" variant="text" color="primary" @click="createOrder">
            Создать на {{ formatDateShort(selectedDate) }}
         </v-btn>
      </div>
    </div>
    
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
import { ref, computed, inject } from 'vue';
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { storeToRefs } from 'pinia';
import OrderCard from '@/components/OrderCard.vue';
import OrderForm from '@/components/OrderForm.vue';

const route = useRoute();
const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();
const { orders } = storeToRefs(orderStore);

// Inject фильтр из App.vue
const filterStatus = inject('filterStatus', ref([]));

const showFullCalendar = ref(false);
const showOrderForm = ref(false);
const selectedDate = ref(null);
const orderToEditId = ref(null);
const initialOrderData = ref({});

const formatDateFull = (d) => d ? new Date(d).toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'}) : '';
const formatDateShort = (d) => d ? new Date(d).toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) : '';

// ... Логика дат ...
const getLocalDateString = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().split('T')[0];
};

const getOrderDateKey = (order) => {
    // Безопасное получение даты из Timestamp или Date
    const d = order.deadline instanceof Date ? order.deadline : 
              (order.deadline?.toDate ? order.deadline.toDate() : new Date(order.deadline));
    return !isNaN(d) ? getLocalDateString(d) : '';
};

const filteredOrders = computed(() => {
  let list = [...orders.value];
  
  if (selectedDate.value) {
    list = list.filter(o => getOrderDateKey(o) === selectedDate.value);
  }

  if (filterStatus.value.length) {
    list = list.filter(o => filterStatus.value.includes(o.status));
  }
  
  return list.sort((a, b) => {
      // Сортировка
      return new Date(b.createdAt) - new Date(a.createdAt);
  });
});

const createOrder = () => {
    orderToEditId.value = null;
    initialOrderData.value = { deadline: selectedDate.value || getLocalDateString(new Date()) };
    showOrderForm.value = true;
};

const editOrder = (order) => {
    orderToEditId.value = order.id;
    initialOrderData.value = {};
    showOrderForm.value = true;
};

const confirmDeleteOrder = async (id) => {
    const ok = await confirmationStore.ask({ title: 'Удалить заказ?', message: 'Это действие необратимо' });
    if(ok) await orderStore.deleteOrder(id);
};
</script>

<style scoped>
.home-view-wrapper { height: 100%; display: flex; flex-direction: column; }
.orders-list-container { flex-grow: 1; overflow-y: auto; background-color: rgb(var(--v-theme-background)); }
.empty-state { height: 50vh; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.6; }
</style>
