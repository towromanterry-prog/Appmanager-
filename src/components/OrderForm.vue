<template>
  <v-card class="h-100 d-flex flex-column bg-surface">
    <v-toolbar color="surface" density="comfortable" class="border-b px-2">
      <v-btn icon="mdi-close" variant="text" @click="$emit('close')" />
      <v-toolbar-title class="text-h6 font-weight-bold">
        {{ isEditMode ? 'Редактирование' : 'Новый заказ' }}
      </v-toolbar-title>
      <v-spacer />
      <v-btn :loading="saving" color="primary" variant="flat" class="px-4" @click="saveOrder">
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
            <template #selection="{ item }">
              <v-chip size="small" :color="getStatusColor(item.value)" class="font-weight-bold">
                {{ item.title }}
              </v-chip>
            </template>
          </v-select>

          <v-text-field
            v-model="formData.date"
            label="Дата"
            type="date"
            hide-details
            density="comfortable"
            variant="outlined"
            style="max-width: 160px;"
          />
        </div>

        <v-card class="mb-4 pa-3" border flat>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 text-medium-emphasis font-weight-bold">КЛИЕНТ</span>
          </div>

          <v-autocomplete
            v-model="formData.clientPhone"
            :items="clients"
            item-title="name"
            item-value="phone"
            label="Выберите клиента"
            variant="outlined"
            density="comfortable"
            hide-details
            clearable
            :custom-filter="clientFilter"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.phone" />
            </template>
            <template #selection="{ item }">
              <span class="font-weight-bold">{{ item.raw.name }}</span>
              <span v-if="item.raw.phone" class="text-caption ml-2 text-medium-emphasis">{{ item.raw.phone }}</span>
            </template>
          </v-autocomplete>

          <div class="d-flex gap-2 mt-3">
            <v-text-field v-model="formData.clientName" label="Имя" variant="outlined" density="comfortable" hide-details />
            <v-text-field v-model="formData.lastName" label="Фамилия" variant="outlined" density="comfortable" hide-details />
          </div>

          <v-text-field
            v-model="formData.phone"
            label="Телефон (если без клиента)"
            variant="outlined"
            density="comfortable"
            hide-details
            class="mt-3"
          />
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
                <div class="text-body-2 font-weight-bold text-truncate">{{ svc.name }}</div>
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
                />
                <v-btn icon="mdi-close" size="x-small" variant="text" color="medium-emphasis" @click="removeService(index)" />
              </div>
            </v-card>
          </div>

          <v-autocomplete
            v-model="serviceToAdd"
            :items="activeServices"
            item-title="name"
            return-object
            label="Добавить услугу"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-plus"
            @update:model-value="addService"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="formatPrice(item.raw.defaultPrice)" />
            </template>
          </v-autocomplete>
        </v-card>

        <v-card class="mb-4 pa-3" border flat>
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-subtitle-2 text-medium-emphasis font-weight-bold">ДЕТАЛИ / РАСХОДНИКИ</span>
          </div>

          <div v-if="formData.details.length" class="d-flex flex-column gap-2">
            <v-card
              v-for="(det, index) in formData.details"
              :key="index"
              flat
              class="bg-grey-lighten-4 rounded-lg px-3 py-2 d-flex align-center"
            >
              <div class="flex-grow-1 overflow-hidden">
                <div class="text-body-2 font-weight-medium text-truncate">{{ det.name }}</div>
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
                />
                <v-btn icon="mdi-close" size="x-small" variant="text" color="medium-emphasis" @click="removeDetail(index)" />
              </div>
            </v-card>
          </div>

          <v-autocomplete
            v-model="detailToAdd"
            :items="details"
            item-title="name"
            return-object
            label="Добавить деталь"
            variant="outlined"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-plus"
            class="mt-3"
            @update:model-value="addDetail"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :subtitle="formatPrice(item.raw.defaultPrice)" />
            </template>
          </v-autocomplete>
        </v-card>

        <v-textarea
          v-model="formData.notes"
          label="Заметки к заказу"
          variant="outlined"
          auto-grow
          rows="2"
          hide-details
          class="mb-4"
        />
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
  </v-card>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue';

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

const valid = ref(false);
const saving = ref(false);
const isEditMode = computed(() => !!props.orderId);

const clients = computed(() => clientsStore.clients || []);
const activeServices = computed(() => servicesStore.activeItems || []);
const details = computed(() => detailsStore.details || []);

const todayStr = () => new Date().toISOString().split('T')[0];

const formData = reactive({
  // order
  status: 'accepted',
  date: todayStr(),
  notes: '',

  // client (denormalized)
  clientPhone: null, // selected from list (docId=phone)
  clientName: '',
  lastName: '',
  phone: '',

  // lines
  services: [],
  details: [],
});

const statusOptions = computed(() => [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'additional', title: settingsStore.appSettings?.additionalStatusName || 'Ожидание' },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
  { value: 'cancelled', title: 'Отменен' },
]);

const formatPrice = (val) =>
  new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(val || 0);

const getStatusColor = (status) => {
  const map = { in_progress: 'warning', completed: 'success', delivered: 'grey', accepted: 'primary', additional: 'purple' };
  return map[String(status || '').trim().toLowerCase()] || 'grey';
};

const totalPrice = computed(() => {
  const s = formData.services.reduce((sum, x) => sum + (Number(x.price) || 0), 0);
  const d = formData.details.reduce((sum, x) => sum + (Number(x.price) || 0), 0);
  return s + d;
});

// UI adders
const serviceToAdd = ref(null);
const detailToAdd = ref(null);

const addService = (service) => {
  if (!service) return;
  formData.services.push({
    id: service.id,
    name: service.name,
    price: Number(service.defaultPrice) || 0,
    status: 'accepted',
    tagIds: service.tagIds || [],
  });
  serviceToAdd.value = null;
};

const removeService = (index) => formData.services.splice(index, 1);

const addDetail = (detail) => {
  if (!detail) return;
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

const clientFilter = (itemTitle, queryText, item) => {
  const text = String(queryText || '').toLowerCase();
  const name = String(item.raw.name || '').toLowerCase();
  const last = String(item.raw.lastName || '').toLowerCase();
  const phone = String(item.raw.phone || '').toLowerCase();
  return name.includes(text) || last.includes(text) || phone.includes(text);
};

// hydrate from selected client
watch(
  () => formData.clientPhone,
  (phone) => {
    if (!phone) return;
    const c = clients.value.find((x) => x.phone === phone);
    if (!c) return;

    // 1в1: подставляем денормализованные поля как раньше
    formData.clientName = c.name || '';
    formData.lastName = c.lastName || '';
    formData.phone = c.phone || '';
  }
);

const loadOrderData = () => {
  if (props.orderId) {
    const o = (orderStore.orders || []).find((x) => x.id === props.orderId);
    if (!o) return;

    formData.status = o.status || 'accepted';

    // date может быть Date — приводим к YYYY-MM-DD
    const d = o.date instanceof Date ? o.date : o.date ? new Date(o.date) : null;
    formData.date = d && !Number.isNaN(d.getTime()) ? d.toISOString().split('T')[0] : todayStr();

    formData.notes = o.notes || '';

    formData.clientPhone = o.clientPhone || o.phone || null;
    formData.clientName = o.clientName || '';
    formData.lastName = o.lastName || '';
    formData.phone = o.phone || o.clientPhone || '';

    formData.services = Array.isArray(o.services) ? o.services.map((s) => ({ ...s })) : [];
    formData.details = Array.isArray(o.details) ? o.details.map((d) => ({ ...d })) : [];
  } else {
    // новый заказ
    if (props.initialData?.date) formData.date = props.initialData.date;
    if (props.initialData?.clientName) formData.clientName = props.initialData.clientName;
    if (props.initialData?.lastName) formData.lastName = props.initialData.lastName;
    if (props.initialData?.phone) formData.phone = props.initialData.phone;
    if (props.initialData?.clientId) formData.clientPhone = props.initialData.clientId; // если передаешь phone как id
  }
};

const saveOrder = async () => {
  saving.value = true;
  try {
    const clientPhone = formData.clientPhone || formData.phone || '';

    const payload = {
      status: formData.status,
      date: formData.date, // стор/сервис сам решит как хранить
      notes: formData.notes,

      clientPhone: clientPhone || '',
      phone: formData.phone || clientPhone || '',

      clientName: formData.clientName || 'Гость',
      lastName: formData.lastName || '',

      services: formData.services,
      details: formData.details,

      total: totalPrice.value,
    };

    if (isEditMode.value) {
      await orderStore.updateOrder(props.orderId, payload);
    } else {
      await orderStore.createOrder(payload);
    }

    // 1в1: обновляем клиента через “умную” логику (история/totalOrders/lastOrderDate)
    if (clientPhone) {
      await clientsStore.addOrUpdateClient({
        name: formData.clientName || 'Клиент',
        lastName: formData.lastName || '',
        phone: clientPhone,
        services: formData.services.map((s) => s.name),
        notes: '', // не трогаем заметки клиента
      });
    }

    emit('saved');
    emit('close');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  loadOrderData();
});
</script>

<style scoped>
.gap-2 { gap: 8px; }
.price-input :deep(.v-field__outline) { display: none; }
.price-input :deep(.v-field__input) { padding: 0; font-weight: 700; color: rgb(var(--v-theme-primary)); }
.safe-area-bottom { padding-bottom: env(safe-area-inset-bottom, 16px) !important; }
</style>