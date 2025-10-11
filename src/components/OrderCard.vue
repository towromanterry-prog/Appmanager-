<template>
  <v-card class="order-card" @click="expanded = !expanded">
    <!-- Основная видимая часть -->
    <v-card-text class="d-flex align-start pa-4">
      <!-- Аватар и инфо о клиенте -->
      <div class="flex-grow-1 mr-4">
        <div class="d-flex align-center mb-2">
          <v-avatar color="primary-container" size="40" class="mr-3">
            <span class="text-on-primary-container font-weight-bold">{{ clientInitial }}</span>
          </v-avatar>
          <div class="client-info">
            <div>
                <span class="font-weight-bold text-body-1 text-on-surface text-truncate">{{ order.clientName }}</span>
                <span class="font-weight-bold text-body-1 text-on-surface">{{ order.lastName }}</span>
            </div>
            <div class="text-caption text-on-surface-variant phone-number">{{ order.phone }}</div>
          </div>
        </div>
      </div>
      <!-- Статус и действия -->
      <div class="text-right d-flex flex-column align-end">
        <StatusIndicator
          :status="order.status"
          @click.stop="changeOrderStatus"
          class="mb-2"
        />
        <div class="d-flex ga-1">
          <v-btn density="compact" icon="mdi-phone" variant="text" color="on-surface-variant" :href="`tel:${order.phone}`" @click.stop size="small"></v-btn>
          <v-btn density="compact" icon="mdi-message-text" variant="text" color="on-surface-variant" :href="`sms:${order.phone}`" @click.stop size="small"></v-btn>
          <v-btn density="compact" icon="mdi-whatsapp" variant="text" color="on-surface-variant" :href="`https://wa.me/${order.phone}`" target="_blank" @click.stop size="small"></v-btn>
          <v-btn density="compact" icon="mdi-telegram" variant="text" color="on-surface-variant" :href="`https://t.me/${order.phone}`" target="_blank" @click.stop size="small"></v-btn>
        </div>
      </div>
    </v-card-text>

    <!-- Выпадающая часть -->
    <v-expand-transition>
      <div v-show="expanded">
        <v-divider></v-divider>
        <div class="pa-4">
          <!-- Список услуг -->
          <div v-if="order.services && order.services.length" class="mb-4">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2">УСЛУГИ</div>
            <div v-for="(service, index) in order.services" :key="`service-${index}`" class="service-item">
              <span class="text-body-2">{{ service.name }}</span>
              <v-spacer></v-spacer>
              <span class="text-body-2 mr-4">{{ service.price }}₽</span>
              <StatusIndicator
                :status="service.status"
                @click.stop="changeServiceStatus(index)"
              />
            </div>
          </div>

          <!-- Список деталей -->
          <div v-if="order.details && order.details.length" class="mb-4">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2">{{ settingsStore.appSettings.detailsTabLabel }}</div>
            <div v-for="(detail, index) in order.details" :key="`detail-${index}`" class="service-item">
              <span class="text-body-2">{{ detail.name }}</span>
              <v-spacer></v-spacer>
              <span class="text-body-2 mr-4">{{ detail.price }}₽</span>
              <StatusIndicator
                :status="detail.status"
                @click.stop="changeDetailStatus(index)"
              />
            </div>
          </div>

          <!-- Дедлайн и цена -->
          <div class="d-flex justify-space-between align-center text-body-2 mb-4">
            <div>
              <span class="text-medium-emphasis">Дедлайн: </span>
              <span :class="isOverdue ? 'text-error' : 'text-on-surface'">{{ formattedDeadline }}</span>
            </div>
            <div class="text-h6 font-weight-bold text-primary">{{ totalAmount }}₽</div>
          </div>
          
          <!-- Заметки -->
          <div v-if="order.notes" class="notes-section">
             <div class="text-caption font-weight-medium text-medium-emphasis mb-1">ЗАМЕТКИ</div>
             <p class="text-body-2">{{ order.notes }}</p>
          </div>

        </div>
        <v-divider></v-divider>
        <!-- Действия -->
        <v-card-actions class="pa-2">
           <v-spacer></v-spacer>
           <v-btn
              :icon="order.status === 'cancelled' ? 'mdi-restore' : 'mdi-cancel'"
              :color="order.status === 'cancelled' ? 'success' : 'warning'"
              variant="text"
              @click.stop="handleCancelClick"
            ></v-btn>
           <v-btn icon="mdi-delete" color="error" variant="text" @click.stop="emit('delete', order.id)"></v-btn>
           <v-btn icon="mdi-pencil" color="primary" variant="text" @click.stop="emit('edit', order)" :disabled="order.status === 'cancelled'"></v-btn>
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import StatusIndicator from '@/components/common/StatusIndicator.vue';
import { useFormatDate } from '@/composables/useDateUtils';

const props = defineProps({
  order: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const { toLongDate } = useFormatDate();

const expanded = ref(false);

const clientInitial = computed(() => props.order.clientName?.charAt(0).toUpperCase() || '?');

const totalAmount = computed(() => props.order.totalAmount || 0);

const formattedDeadline = computed(() => props.order.deadline ? toLongDate(props.order.deadline) : 'Не указан');

const isOverdue = computed(() => {
  if (!props.order.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(props.order.deadline) < today && props.order.status !== 'delivered' && props.order.status !== 'cancelled';
});

const changeOrderStatus = () => {
  if (props.order.status === 'cancelled') return;
  const nextStatus = orderStore.calculateNextStatus(props.order.status, 'order');
  if (nextStatus !== props.order.status) {
    orderStore.updateStatus(props.order.id, nextStatus, 'order');
  }
};

const changeServiceStatus = (serviceIndex) => {
    const service = props.order.services[serviceIndex];
    if (service.status === 'cancelled') return;
    const nextStatus = orderStore.calculateNextStatus(service.status, 'service');
    if (nextStatus !== service.status) {
        orderStore.updateStatus(props.order.id, nextStatus, 'service', serviceIndex);
    }
};

const changeDetailStatus = (detailIndex) => {
    const detail = props.order.details[detailIndex];
    if (detail.status === 'cancelled') return;
    const nextStatus = orderStore.calculateNextStatus(detail.status, 'detail');
    if (nextStatus !== detail.status) {
        orderStore.updateStatus(props.order.id, nextStatus, 'detail', detailIndex);
    }
};

const handleCancelClick = () => {
  if (props.order.status === 'cancelled') {
    orderStore.undoCancelOrder(props.order.id);
  } else {
    orderStore.cancelOrder(props.order.id);
  }
};
</script>

<style scoped>
.order-card {
  transition: box-shadow 0.2s ease-out;
  cursor: pointer;
}
.order-card[disabled] {
  opacity: 0.7;
  pointer-events: none;
}
.text-on-primary-container {
  color: rgb(var(--v-theme-on-primary-container));
}
.service-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
}
.notes-section {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: 8px 12px;
  border-radius: 8px;
}
.client-info {
  display: block; /* Changed to block for better wrapping control */
  overflow: hidden;
  max-width: 100%;
}
.client-info > div {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.client-info .font-weight-bold.text-body-1.text-on-surface {
    display: inline; /* Allow first and last name to be on the same line if space allows */
    margin-right: 4px; /* Add space between first and last name */
}
.client-info .text-caption {
    display: block; /* Ensure phone number is on its own line */
}
.phone-number {
  margin-top: 2px;
}
</style>