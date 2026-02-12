<template>
  <v-card class="order-card" @click="expandCard">
    <v-card-text class="d-flex align-start pa-4">
      <div class="flex-grow-1 mr-4" style="min-width: 0;">
        <div class="client-info">
          <div class="client-name-line">
            <span class="font-weight-bold text-truncate">{{ displayClientName }}</span>
            <span v-if="displayClientLastName" class="font-weight-bold text-truncate ml-1">{{ displayClientLastName }}</span>
          </div>
          <div class="text-caption text-on-surface-variant">{{ displayClientPhone }}</div>
          <div class="text-caption text-on-surface-variant">Создан: {{ formattedCreateDate }}</div>
        </div>
      </div>

      <div class="text-right d-flex flex-column align-end">
        <v-menu location="bottom end">
          <template #activator="{ props }">
            <v-chip
              v-bind="props"
              :color="getStatusColor(order.status)"
              size="small"
              class="mb-2 font-weight-bold"
              @click.stop
            >
              {{ getStatusText(order.status) }}
            </v-chip>
          </template>

          <v-list density="compact">
            <v-list-item
              v-for="st in availableOrderStatuses"
              :key="st.value"
              @click="updateOrderStatus(st.value)"
            >
              <v-list-item-title>{{ st.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </div>
    </v-card-text>

    <v-expand-transition>
      <div v-show="expanded">
        <v-divider />

        <div class="pa-4">
          <div v-if="(order.services || []).length" class="mb-4">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2">УСЛУГИ</div>

            <div v-for="(service, index) in order.services" :key="`service-${index}`" class="service-item">
              <span class="text-body-2">{{ service.name }}</span>
              <v-spacer />
              <span class="text-body-2 mr-4">{{ service.price }}₽</span>

              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-icon v-bind="props" :color="getStatusColor(service.status)" size="small" @click.stop>
                    mdi-circle
                  </v-icon>
                </template>
                <v-list density="compact">
                  <v-list-item v-for="st in availableLineStatuses" :key="st.value" @click="updateServiceStatus(index, st.value)">
                    <v-list-item-title>{{ st.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

          <div v-if="(order.details || []).length" class="mb-4">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2">
              {{ detailsLabel }}
            </div>

            <div v-for="(detail, index) in order.details" :key="`detail-${index}`" class="service-item">
              <span class="text-body-2">{{ detail.name }}</span>
              <v-spacer />
              <span class="text-body-2 mr-4">{{ detail.price }}₽</span>

              <v-menu location="bottom end">
                <template #activator="{ props }">
                  <v-icon v-bind="props" :color="getStatusColor(detail.status)" size="small" @click.stop>
                    mdi-circle
                  </v-icon>
                </template>
                <v-list density="compact">
                  <v-list-item v-for="st in availableLineStatuses" :key="st.value" @click="updateDetailStatus(index, st.value)">
                    <v-list-item-title>{{ st.title }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </div>
          </div>

          <div class="d-flex justify-space-between align-center text-body-2 mb-4">
            <div>
              <span class="text-medium-emphasis">Дата: </span>
              <span :class="isOverdue ? 'text-error' : 'text-on-surface'">{{ formattedOrderDate }}</span>
            </div>
            <div class="text-h6 font-weight-bold text-primary">{{ totalAmount }}₽</div>
          </div>

          <div v-if="order.notes" class="notes-section">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-1">ЗАМЕТКИ</div>
            <p class="text-body-2">{{ order.notes }}</p>
          </div>
        </div>

        <v-divider />

        <v-card-actions class="pa-2">
          <v-btn
            icon="mdi-phone"
            variant="text"
            size="small"
            color="on-surface-variant"
            :href="phoneHref"
            :disabled="!phoneHref"
            @click.stop
          />
          <v-spacer />

          <v-btn
            :icon="isCancelled ? 'mdi-restore' : 'mdi-cancel'"
            :color="isCancelled ? 'success' : 'warning'"
            variant="text"
            size="small"
            @click.stop="toggleCancelled"
          />

          <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click.stop="emitDelete" />
          <v-btn icon="mdi-pencil" color="primary" variant="text" size="small" @click.stop="emitEdit" :disabled="isCancelled" />
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const props = defineProps({
  order: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const { triggerHapticFeedback } = useHapticFeedback();

const expanded = ref(false);

const detailsLabel = computed(() => settingsStore.appSettings?.detailsTabLabel || 'Детали');

const normalize = (s) => String(s || '').trim().toLowerCase();

const getStatusColor = (status) => {
  const map = {
    in_progress: 'warning',
    completed: 'success',
    delivered: 'grey',
    accepted: 'primary',
    additional: 'purple',
    cancelled: 'error',
  };
  return map[normalize(status)] || 'grey';
};

const getStatusText = (status) => {
  const map = {
    in_progress: 'В работе',
    completed: 'Готов',
    delivered: 'Сдан',
    accepted: 'Принят',
    additional: settingsStore.appSettings?.additionalStatusName || 'Ожидание',
    cancelled: 'Отменен',
  };
  return map[normalize(status)] || status;
};

const availableOrderStatuses = computed(() => [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'additional', title: settingsStore.appSettings?.additionalStatusName || 'Ожидание' },
  { value: 'completed', title: 'Готов' },
  { value: 'delivered', title: 'Сдан' },
  { value: 'cancelled', title: 'Отменен' },
]);

const availableLineStatuses = computed(() => [
  { value: 'accepted', title: 'Принят' },
  { value: 'in_progress', title: 'В работе' },
  { value: 'completed', title: 'Готов' },
  { value: 'cancelled', title: 'Отменен' },
]);

const isCancelled = computed(() => normalize(props.order.status) === 'cancelled');

const displayClientName = computed(() => props.order.clientName || props.order.name || 'Клиент');
const displayClientLastName = computed(() => props.order.lastName || '');
const displayClientPhone = computed(() => props.order.phone || props.order.clientPhone || '');

const formattedPhone = computed(() => {
  const src = String(displayClientPhone.value || '');
  if (!src) return '';
  return `+${src.replace(/\D/g, '')}`;
});
const phoneHref = computed(() => (formattedPhone.value ? `tel:${formattedPhone.value}` : ''));

const toDate = (v) => (v instanceof Date ? v : v ? new Date(v) : null);

const orderDateObj = computed(() => toDate(props.order.date) || toDate(props.order.startAt) || null);
const createdDateObj = computed(() => toDate(props.order.createdAt) || null);

const formattedOrderDate = computed(() => {
  const d = orderDateObj.value;
  if (!d || Number.isNaN(d.getTime())) return 'Не указана';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

const formattedCreateDate = computed(() => {
  const d = createdDateObj.value;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
});

const totalAmount = computed(() => {
  const direct = props.order.computedTotal ?? props.order.total;
  if (typeof direct === 'number') return direct;

  const s = (props.order.services || []).reduce((acc, x) => acc + (Number(x.price) || 0), 0);
  const d = (props.order.details || []).reduce((acc, x) => acc + (Number(x.price) || 0), 0);
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
  triggerHapticFeedback('tap');
  expanded.value = !expanded.value;
};

const updateOrderStatus = async (newStatus) => {
  triggerHapticFeedback('tap');
  await orderStore.updateOrder(props.order.id, { status: newStatus });
};

const updateServiceStatus = async (index, newStatus) => {
  triggerHapticFeedback('tap');
  const list = Array.isArray(props.order.services) ? [...props.order.services] : [];
  if (!list[index]) return;
  list[index] = { ...list[index], status: newStatus };
  await orderStore.updateOrder(props.order.id, { services: list });
};

const updateDetailStatus = async (index, newStatus) => {
  triggerHapticFeedback('tap');
  const list = Array.isArray(props.order.details) ? [...props.order.details] : [];
  if (!list[index]) return;
  list[index] = { ...list[index], status: newStatus };
  await orderStore.updateOrder(props.order.id, { details: list });
};

const toggleCancelled = async () => {
  const next = isCancelled.value ? 'accepted' : 'cancelled';
  await updateOrderStatus(next);
};

const emitDelete = () => emit('delete', props.order.id);
const emitEdit = () => emit('edit', props.order);
</script>

<style scoped>
.order-card { transition: box-shadow 0.2s ease-out; cursor: pointer; }
.service-item { display: flex; align-items: center; padding: 4px 0; }
.notes-section { background-color: rgba(var(--v-theme-on-surface), 0.05); padding: 8px 12px; border-radius: 8px; }
.client-info { overflow: hidden; }
.client-name-line { display: flex; flex-wrap: wrap; align-items: baseline; line-height: 1.2; }
.receipt-wrapper { position: fixed; left: -9999px; top: 0; }
.receipt-container { width: 300px; background: white; color: black; padding: 20px; font-family: monospace; font-size: 12px; }
.receipt-divider { border-top: 1px dashed black; margin: 10px 0; }
.receipt-row { display: flex; justify-content: space-between; }
.receipt-title { text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 10px; }

.order-card { cursor: pointer; }
.service-item { display: flex; align-items: center; padding: 4px 0; }
.notes-section { background-color: rgba(var(--v-theme-on-surface), 0.05); padding: 8px 12px; border-radius: 8px; }
.client-info { overflow: hidden; }
.client-name-line { display: flex; flex-wrap: wrap; align-items: baseline; line-height: 1.2; }
</style>