<template>
  <v-card class="order-card" @click="expanded = !expanded">
    <!-- Основная видимая часть -->
    <v-card-text class="d-flex align-start pa-4">
      <!-- Аватар и инфо о клиенте -->
      <div class="flex-grow-1">
        <div class="d-flex align-center mb-2">
          <v-avatar color="primary-container" size="40" class="mr-3">
            <span class="text-on-primary-container font-weight-bold">{{ clientInitial }}</span>
          </v-avatar>
          <div>
            <div class="font-weight-bold text-body-1 text-on-surface">{{ order.clientName }}</div>
            <div class="text-caption text-on-surface-variant">{{ order.phone }}</div>
          </div>
        </div>
        <div class="d-flex align-center text-caption text-medium-emphasis mt-3">
          <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
          <span>{{ servicesPreview }}</span>
        </div>
      </div>
      <!-- Статус и цена -->
      <div class="text-right">
        <StatusIndicator
          :status="order.status"
          @click.stop="changeOrderStatus"
          class="mb-2 no-swipe"
        />
        <div class="text-h6 font-weight-bold text-primary">{{ totalAmount }}₽</div>
      </div>
    </v-card-text>

    <!-- Выпадающая часть -->
    <v-expand-transition>
      <div v-show="expanded">
        <v-divider></v-divider>
        <div class="pa-4">
          <!-- Список услуг -->
          <div class="mb-4">
            <div class="text-caption font-weight-medium text-medium-emphasis mb-2">УСЛУГИ</div>
            <div v-for="(service, index) in order.services" :key="index" class="service-item">
              <span class="text-body-2">{{ service.name }}</span>
              <v-spacer></v-spacer>
              <span class="text-body-2 mr-4">{{ service.price }}₽</span>
              <StatusIndicator
                :status="service.status"
                @click.stop="changeServiceStatus(index)"
                class="no-swipe"
              />
            </div>
          </div>

          <!-- Дедлайн -->
          <div class="d-flex justify-space-between align-center text-body-2 mb-4">
            <span class="text-medium-emphasis">Дедлайн:</span>
            <span :class="isOverdue ? 'text-error' : 'text-on-surface'">{{ formattedDeadline }}</span>
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
           <v-btn icon="mdi-phone" variant="text" color="on-surface-variant" :href="`tel:${order.phone}`" @click.stop></v-btn>
           <v-btn icon="mdi-message-text" variant="text" color="on-surface-variant" :href="`sms:${order.phone}`" @click.stop></v-btn>
           <v-btn icon="mdi-whatsapp" variant="text" color="on-surface-variant" :href="`https://wa.me/${order.phone}`" target="_blank" @click.stop></v-btn>
           <v-spacer></v-spacer>
           <v-btn
              :color="order.status === 'cancelled' ? 'success' : 'warning'"
              variant="text"
              @click.stop="handleCancelClick"
            >
              {{ order.status === 'cancelled' ? 'Восстановить' : 'Отменить' }}
            </v-btn>
           <v-btn color="error" variant="text" @click.stop="emit('delete', order.id)">Удалить</v-btn>
           <v-btn color="primary" variant="tonal" @click.stop="emit('edit', order)" :disabled="order.status === 'cancelled'">Редактировать</v-btn>
        </v-card-actions>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import StatusIndicator from '@/components/common/StatusIndicator.vue';
import { useFormatDate } from '@/composables/useDateUtils';

const props = defineProps({
  order: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const orderStore = useOrderStore();
const { toLongDate } = useFormatDate();

const expanded = ref(false);

const clientInitial = computed(() => props.order.clientName?.charAt(0).toUpperCase() || '?');

const servicesPreview = computed(() => {
  if (!props.order.services?.length) return 'Нет услуг';
  return props.order.services.map(s => s.name).join(', ');
});

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
  const nextStatus = orderStore.calculateNextStatus(props.order.status, false);
  if (nextStatus !== props.order.status) {
      orderStore.updateStatus(props.order.id, nextStatus, false);
  }
};

const changeServiceStatus = (serviceIndex) => {
    const service = props.order.services[serviceIndex];
    if (service.status === 'cancelled') return;
    const nextStatus = orderStore.calculateNextStatus(service.status, true);
    if (nextStatus !== service.status) {
        orderStore.updateStatus(props.order.id, nextStatus, true, serviceIndex);
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
</style>