<template>
  <v-card class="h-100 d-flex flex-column bg-surface">
    <v-toolbar color="surface" density="comfortable" class="border-b px-2">
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
      <v-toolbar-title class="text-h6 font-weight-bold">
        {{ isEditMode ? 'Редактирование' : 'Новый заказ' }}
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        :loading="saving"
        color="primary"
        variant="flat"
        class="px-4"
        @click="saveOrder"
      >
        Сохранить
      </v-btn>
    </v-toolbar>

    <v-card-text class="flex-grow-1 overflow-y-auto pa-4 pb-16">
      <v-form ref="form" v-model="valid">
        
        <div class="d-flex gap-2 mb-4">
          <v-select
            v-model="formData.status"
            :items="statusOptions"
            label="Статус"
            hide-details
            density="comfortable"
            variant="outlined"
            class="flex-grow-1"
          >
            <template v-slot:selection="{ item }">
              <v-chip size="small" :color="getStatusColor(item.value)" class="font-weight-bold">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>

          <v-text-field
            v-model="formData.deadline"
            label="Срок сдачи"
            type="date"
            hide-details
            density="comfortable"
            variant="outlined"
            style="max-width: 160px;"
          ></v-text-field>
        </div>

        <v-card class="mb-4 pa-3" border flat>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 text-medium-emphasis font-weight-bold">КЛИЕНТ</span>
            <v-btn
              icon="mdi-account-plus"
              size="small"
              variant="text"
              color="primary"
              @click="openClientCreate"
            ></v-btn>
          </div>
          
          <v-autocomplete
            v-model="formData.client"
            :items="clientsStore.clients"
            item-title="name"
            item-value="id" 
            return-object
            label="Выберите клиента"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            :custom-filter="clientFilter"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.phone">
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
               <span class="font-weight-bold">{{ item.raw.name }}</span>
               <span v-if="item.raw.phone" class="text-caption ml-2 text-medium-emphasis">{{ item.raw.phone }}</span>
            </template>
          </v-autocomplete>
        </v-card>

        <v-card class="mb-4 pa-3" border flat>
          <div class="text-subtitle-2 text-medium-emphasis font-weight-bold mb-2">УСЛУГИ</div>
          
          <div v-if="formData.services.length" class="mb-3 d-flex flex-column gap-2">
            <v-card
              v-for="(svc, index) in formData.services"
              :key="index"
              flat
              class="bg-grey-lighten-4 rounded-lg px-3 py-2 d-flex align-center"
            >
              <div class="flex-grow-1 overflow-hidden">
                <div class="text-body-2 font-weight-bold text-truncate">{{ svc.title }}</div>
                <div class="text-caption text-medium-emphasis">{{ svc.category }}</div>
              </div>
              
              <div class="d-flex align-center gap-2">
                <v-text-field
                  v-model.number="svc.price"
                  type="number"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="price-input text-right font-weight-bold"
                  style="width: 80px;"
                  prefix="₽"
                ></v-text-field>
                <v-btn icon="mdi-close" size="x-small" variant="text" color="medium-emphasis" @click="removeService(index)"></v-btn>
              </div>
            </v-card>
          </div>

          <v-autocomplete
            v-model="serviceToAdd"
            :items="serviceStore.activeServices"
            item-title="title"
            return-object
            label="Добавить услугу"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-plus"
            @update:model-value="addService"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="formatPrice(item.raw.price)"></v-list-item>
            </template>
          </v-autocomplete>
        </v-card>

        <v-card class="mb-4 pa-3" border flat>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 text-medium-emphasis font-weight-bold">ДЕТАЛИ / РАСХОДНИКИ</span>
            <v-btn
              icon="mdi-package-variant-closed-plus"
              size="small"
              variant="text"
              color="primary"
              @click="showDetailSelector = true"
            ></v-btn>
          </div>

          <div v-if="formData.details.length" class="d-flex flex-column gap-2">
             <v-card
              v-for="(det, index) in formData.details"
              :key="index"
              flat
              class="bg-grey-lighten-4 rounded-lg px-3 py-2 d-flex align-center"
            >
              <div class="flex-grow-1 overflow-hidden">
                <div class="text-body-2 font-weight-medium text-truncate">{{ det.title }}</div>
              </div>
              
              <div class="d-flex align-center gap-2">
                <v-text-field
                  v-model.number="det.price"
                  type="number"
                  variant="plain"
                  density="compact"
                  hide-details
                  class="price-input text-right"
                  style="width: 70px;"
                  prefix="₽"
                ></v-text-field>
                 <v-btn icon="mdi-close" size="x-small" variant="text" color="medium-emphasis" @click="removeDetail(index)"></v-btn>
              </div>
            </v-card>
          </div>
          <div v-else class="text-caption text-center text-medium-emphasis py-2">
            Нет деталей
          </div>
        </v-card>

        <v-textarea
          v-model="formData.notes"
          label="Заметки к заказу"
          variant="outlined"
          auto-grow
          rows="2"
          hide-details
          class="mb-4"
        ></v-textarea>

      </v-form>
    </v-card-text>

    <v-footer app color="surface" class="border-t pa-0 safe-area-bottom">
      <div class="d-flex align-center justify-space-between w-100 px-4 py-3">
        <div>
          <div class="text-caption text-medium-emphasis">Итоговая стоимость</div>
          <div class="text-h5 font-weight-bold text-primary">{{ formatPrice(totalPrice) }}</div>
        </div>
        </div>
    </v-footer>

    <ClientFormDialog 
      v-model="showClientDialog"
      @saved="onClientSaved"
    />
    
    <DetailSelectionModal
      v-model="showDetailSelector"
      @select="addDetail"
    />

  </v-card>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';
import ClientFormDialog from '@/components/ClientFormDialog.vue';
import DetailSelectionModal from '@/components/DetailSelectionModal.vue';

// --- PROPS ---
const props = defineProps({
  orderId: {
    type: String,
    default: null
  },
  initialData: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['close', 'saved']);

// --- STORES ---
const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
useTagsStore(); // Инит

// --- STATE ---
const valid = ref(false);
const saving = ref(false);
const isEditMode = computed(() => !!props.orderId);

// Форма
const formData = reactive({
  client: null,
  status: 'accepted',
  deadline: new Date().toISOString().split('T')[0],
  services: [], // { title, price, category, ... }
  details: [],  // { title, price, costPrice, ... }
  notes: '',
  tags: []
});

// UI State
const serviceToAdd = ref(null);
const showClientDialog = ref(false);
const showDetailSelector = ref(false);

// Опции статусов
const statusOptions = [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'additional', title: 'Ожидание' },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
  { value: 'cancelled', title: 'Отменен' },
];

// --- COMPUTED ---
const totalPrice = computed(() => {
  const servicesSum = formData.services.reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const detailsSum = formData.details.reduce((sum, d) => sum + (Number(d.price) || 0), 0);
  return servicesSum + detailsSum;
});

// --- METHODS ---
const formatPrice = (val) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val || 0);

const getStatusColor = (status) => {
  const map = {
    'in_progress': 'warning',
    'completed': 'success',
    'delivered': 'grey',
    'accepted': 'primary',
    'additional': 'purple'
  };
  return map[status] || 'grey';
};

// Фильтр для поиска клиентов
const clientFilter = (itemTitle, queryText, item) => {
  const text = queryText.toLowerCase();
  const name = item.raw.name?.toLowerCase() || '';
  const phone = item.raw.phone?.toLowerCase() || '';
  return name.includes(text) || phone.includes(text);
};

// --- LOGIC: SERVICES ---
const addService = (service) => {
  if (!service) return;
  // Копируем объект, чтобы цена была независимой
  formData.services.push({
    id: service.id, // Ссылка на оригинал (опционально)
    title: service.title,
    category: service.category,
    price: service.price,
    costPrice: 0 // У услуг обычно нет себестоимости в явном виде в заказе, но можно добавить
  });
  serviceToAdd.value = null; // Сброс
};

const removeService = (index) => {
  formData.services.splice(index, 1);
};

// --- LOGIC: DETAILS ---
const addDetail = (detail) => {
  formData.details.push({
    id: detail.id,
    title: detail.title,
    price: detail.price,
    costPrice: detail.costPrice
  });
  showDetailSelector.value = false;
};

const removeDetail = (index) => {
  formData.details.splice(index, 1);
};

// --- LOGIC: CLIENT ---
const openClientCreate = () => {
  showClientDialog.value = true;
};

const onClientSaved = (newClient) => {
  // Автоматически выбираем созданного клиента
  if (newClient) {
    formData.client = newClient;
  }
  showClientDialog.value = false;
};

// --- INIT ---
const loadOrderData = () => {
  // Если редактируем
  if (props.orderId) {
    const order = orderStore.getOrderById(props.orderId);
    if (order) {
      formData.status = order.status;
      formData.deadline = order.deadline;
      formData.notes = order.notes;
      // Восстанавливаем клиента
      if (order.clientId) {
        const client = clientsStore.getClientById(order.clientId);
        if (client) formData.client = client;
      }
      // Восстанавливаем массивы (клонируем)
      formData.services = [...(order.services || [])];
      formData.details = [...(order.details || [])];
    }
  } else {
    // Новый заказ (применяем initialData)
    if (props.initialData.deadline) formData.deadline = props.initialData.deadline;
    // Если передан клиент через query/initialData
    if (props.initialData.clientId) {
        const client = clientsStore.getClientById(props.initialData.clientId);
        if(client) formData.client = client;
    }
  }
};

// --- SAVE ---
const saveOrder = async () => {
  if (!formData.client && !props.orderId) {
    // Валидация: клиент обязателен для нового заказа? Зависит от бизнес-логики.
    // Допустим, можно без клиента (быстрый заказ), но лучше предупредить.
  }

  saving.value = true;
  try {
    const orderPayload = {
      status: formData.status,
      deadline: formData.deadline,
      notes: formData.notes,
      price: totalPrice.value,
      // Связи
      clientId: formData.client?.id || null,
      clientName: formData.client?.name || 'Гость', // Денормализация для быстрого отображения
      // Списки
      services: formData.services,
      details: formData.details
    };

    if (isEditMode.value) {
      await orderStore.updateOrder({
        id: props.orderId,
        ...orderPayload
      });
    } else {
      await orderStore.addOrder(orderPayload);
    }
    
    emit('saved');
    emit('close');
  } catch (e) {
    console.error('Ошибка сохранения:', e);
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  // Убеждаемся, что справочники загружены
  if (!clientsStore.clients.length) clientsStore.subscribeClients();
  if (!serviceStore.activeServices.length) serviceStore.initRealtimeUpdates();
  
  loadOrderData();
});
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }

/* Кастомный инпут цены без рамок, чтобы выглядел как текст */
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
