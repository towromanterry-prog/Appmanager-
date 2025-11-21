<template>
  <v-card class="order-card" @click="expandCard">
    <!-- Основная видимая часть -->
    <v-card-text class="d-flex align-start pa-4">
      <!-- Инфо о клиенте -->
      <div class="flex-grow-1 mr-4" style="min-width: 0;">
        <div class="d-flex align-center">
          <div class="client-info">
            <div class="client-name-line">
              <span class="font-weight-bold text-truncate">{{ order.clientName }}</span>
              <span class="font-weight-bold text-truncate">{{ order.lastName }}</span>
            </div>
            <div class="text-caption text-on-surface-variant">{{ order.phone }}</div>
            <div class="text-caption text-on-surface-variant">Создан: {{ formattedCreateDate }}</div>
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

          <!-- Теги -->
          <div v-if="allTags.length" class="tags-section mb-4">
            <v-chip
              v-for="tag in allTags"
              :key="tag.id"
              :color="tag.color"
              size="small"
              class="mr-2 mb-2"
              label
            >
              {{ tag.name }}
            </v-chip>
          </div>

          <!-- Дедлайн и цена -->
          <div class="d-flex justify-space-between align-center text-body-2 mb-4">
            <div>
              <span class="text-medium-emphasis">Дедлайн: </span>
              <span :class="isOverdue ? 'text-error' : 'text-on-surface'">{{ formattedDeadline }}</span>
            </div>
            <div class="text-h6 font-weight-bold text-primary">{{ totalAmount }}₽</div>
          </div>

          <!-- Кнопка скачивания чека -->
          <v-btn
            block
            variant="outlined"
            color="primary"
            class="mb-4"
            @click.stop="downloadReceipt"
            :loading="isGeneratingReceipt"
          >
            <v-icon start>mdi-download</v-icon>
            Скачать чек
          </v-btn>
          
          <!-- Заметки -->
          <div v-if="order.notes" class="notes-section">
             <div class="text-caption font-weight-medium text-medium-emphasis mb-1">ЗАМЕТКИ</div>
             <p class="text-body-2">{{ order.notes }}</p>
          </div>

        </div>
        <v-divider></v-divider>
        <!-- Действия -->
        <v-card-actions class="pa-2">
          <v-btn icon="mdi-phone" variant="text" size="small" color="on-surface-variant" :href="`tel:${order.phone}`" @click.stop></v-btn>
          <v-btn icon="mdi-message-text" variant="text" size="small" color="on-surface-variant" @click.stop="sendMessageWithHaptic('sms')"></v-btn>
          <v-btn :icon="IconWhatsapp" variant="text" size="small" color="on-surface-variant" @click.stop="sendMessageWithHaptic('whatsapp')"></v-btn>
          <v-btn :icon="IconTelegram" variant="text" size="small" color="on-surface-variant" @click.stop="sendMessageWithHaptic('telegram')"></v-btn>
           <v-spacer></v-spacer>
           <v-btn
              :icon="order.status === 'cancelled' ? 'mdi-restore' : 'mdi-cancel'"
              :color="order.status === 'cancelled' ? 'success' : 'warning'"
              variant="text"
              size="small"
              @click.stop="handleCancelClick"
            ></v-btn>
           <v-btn icon="mdi-delete" color="error" variant="text" size="small" @click.stop="deleteWithHaptic(order.id)"></v-btn>
           <v-btn icon="mdi-pencil" color="primary" variant="text" size="small" @click.stop="editWithHaptic(order)" :disabled="order.status === 'cancelled'"></v-btn>
        </v-card-actions>
      </div>
    </v-expand-transition>

    <!-- Скрытый шаблон чека -->
    <div v-if="isGeneratingReceipt" class="receipt-wrapper">
      <div ref="receiptRef" class="receipt-container">
        <div class="receipt-title">ЧЕК</div>
        <div class="receipt-divider"></div>

        <div>Клиент: {{ order.clientName }} {{ order.lastName }}</div>
        <div>Тел: {{ formattedPhone }}</div>

        <div class="receipt-divider"></div>

        <div v-if="order.services && order.services.length">
          <div class="font-weight-bold mb-1">Услуги:</div>
          <div v-for="(service, index) in order.services" :key="`rec-serv-${index}`" class="receipt-row">
            <span>{{ service.name }}</span>
            <span>{{ service.price }}₽</span>
          </div>
        </div>

        <div v-if="order.details && order.details.length" class="mt-2">
          <div class="font-weight-bold mb-1">{{ settingsStore.appSettings.detailsTabLabel }}:</div>
          <div v-for="(detail, index) in order.details" :key="`rec-det-${index}`" class="receipt-row">
            <span>{{ detail.name }}</span>
            <span>{{ detail.price }}₽</span>
          </div>
        </div>

        <div class="receipt-divider"></div>

        <div class="receipt-row font-weight-bold" style="font-size: 14px;">
          <span>ИТОГО:</span>
          <span>{{ totalAmount }}₽</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTemplateSelectionStore } from '@/stores/templateSelectionStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import StatusIndicator from '@/components/common/StatusIndicator.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import { useFormatDate } from '@/composables/useDateUtils';
import { IconTelegram, IconWhatsapp } from '@iconify-prerendered/vue-simple-icons';
import html2canvas from 'html2canvas';

const props = defineProps({
  order: { type: Object, required: true },
});
const emit = defineEmits(['edit', 'delete']);

const orderStore = useOrderStore();
const settingsStore = useSettingsStore();
const templateSelectionStore = useTemplateSelectionStore();
const tagsStore = useTagsStore();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const { toLongDate, toShortDate } = useFormatDate();
const { triggerHapticFeedback } = useHapticFeedback();

const expanded = ref(false);
const isGeneratingReceipt = ref(false);
const receiptRef = ref(null);

const allTags = computed(() => {
  const tagIds = new Set();

  (props.order.services || []).forEach(serviceInOrder => {
    const masterService = serviceStore.getServiceById(serviceInOrder.id);
    if (masterService && masterService.tagIds) {
      masterService.tagIds.forEach(id => tagIds.add(id));
    }
  });

  (props.order.details || []).forEach(detailInOrder => {
    const masterDetail = detailStore.getDetailById(detailInOrder.id);
    if (masterDetail && masterDetail.tagIds) {
      masterDetail.tagIds.forEach(id => tagIds.add(id));
    }
  });

  return Array.from(tagIds).map(id => tagsStore.getTagById(id)).filter(Boolean);
});

const totalAmount = computed(() => props.order.totalAmount || 0);

const formattedDeadline = computed(() => props.order.deadline ? toLongDate(props.order.deadline) : 'Не указан');

const formattedCreateDate = computed(() => props.order.createDate ? toShortDate(props.order.createDate) : '');

const isOverdue = computed(() => {
  if (!props.order.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(props.order.deadline) < today && props.order.status !== 'delivered' && props.order.status !== 'cancelled';
});

const expandCard = () => {
  triggerHapticFeedback('tap');
  expanded.value = !expanded.value;
};

const changeOrderStatus = () => {
  triggerHapticFeedback('tap');
  if (props.order.status === 'cancelled') return;
  const nextStatus = orderStore.calculateNextStatus(props.order.status, 'order');
  if (nextStatus !== props.order.status) {
    orderStore.updateStatus(props.order.id, nextStatus, 'order');
  }
};

const changeServiceStatus = (serviceIndex) => {
    triggerHapticFeedback('tap');
    const service = props.order.services[serviceIndex];
    if (service.status === 'cancelled') return;
    const nextStatus = orderStore.calculateNextStatus(service.status, 'service');
    if (nextStatus !== service.status) {
        orderStore.updateStatus(props.order.id, nextStatus, 'service', serviceIndex);
    }
};

const changeDetailStatus = (detailIndex) => {
    triggerHapticFeedback('tap');
    const detail = props.order.details[detailIndex];
    if (detail.status === 'cancelled') return;
    const nextStatus = orderStore.calculateNextStatus(detail.status, 'detail');
    if (nextStatus !== detail.status) {
        orderStore.updateStatus(props.order.id, nextStatus, 'detail', detailIndex);
    }
};

const handleCancelClick = () => {
  triggerHapticFeedback('tap');
  if (props.order.status === 'cancelled') {
    orderStore.undoCancelOrder(props.order.id);
  } else {
    orderStore.cancelOrder(props.order.id);
  }
};

const formattedPhone = computed(() => {
  if (!props.order.phone) return '';
  return `+${props.order.phone.replace(/\D/g, '')}`;
});

const downloadReceipt = async () => {
  triggerHapticFeedback('tap');
  isGeneratingReceipt.value = true;
  await nextTick();

  if (receiptRef.value) {
    try {
      const canvas = await html2canvas(receiptRef.value, {
        scale: 2,
        logging: false,
        backgroundColor: '#ffffff',
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `receipt_${props.order.id}.png`;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Error generating receipt:', e);
    }
  }

  isGeneratingReceipt.value = false;
};

const sendMessage = async (service) => {
  const templates = settingsStore.appSettings.messageTemplates;
  let selectedTemplate;

  if (templates.length > 1) {
    selectedTemplate = await templateSelectionStore.open(templates);
    if (!selectedTemplate) return; // User cancelled
  } else if (templates.length === 1) {
    selectedTemplate = templates[0];
  } else {
    selectedTemplate = { text: '' }; // No templates, use empty message
  }

  const message = selectedTemplate.text
    .replace('%имя%', props.order.clientName)
    .replace('%цена%', totalAmount.value);

  let url;
  switch (service) {
    case 'sms':
      url = `sms:${formattedPhone.value}?&body=${encodeURIComponent(message)}`;
      break;
    case 'whatsapp':
      url = `https://wa.me/${formattedPhone.value}?text=${encodeURIComponent(message)}`;
      break;
    case 'telegram':
      url = `https://t.me/${formattedPhone.value}?text=${encodeURIComponent(message)}`;
      break;
  }

  if (url) {
    window.open(url, '_blank');
  }
};

const sendMessageWithHaptic = (service) => {
  triggerHapticFeedback('tap');
  sendMessage(service);
};

const deleteWithHaptic = (orderId) => {
  triggerHapticFeedback('tap');
  emit('delete', orderId);
};

const editWithHaptic = (order) => {
  triggerHapticFeedback('tap');
  emit('edit', order);
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
  overflow: hidden;
}
.client-name-line {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  line-height: 1.2;
  gap: 0 0.25em; /* Добавляем небольшой отступ между именем и фамилией */
}

.client-name-line .text-truncate {
  /* Позволяет элементу усекаться, если он слишком длинный, но не заставляет его занимать всю ширину */
  min-width: 0;
}

/* Receipt Styles */
.receipt-wrapper {
  position: fixed;
  left: -9999px;
  top: 0;
  pointer-events: none;
}

.receipt-container {
  width: 300px;
  background: white;
  color: black;
  padding: 20px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.4;
}

.receipt-divider {
  border-top: 1px dashed black;
  margin: 10px 0;
}

.receipt-row {
  display: flex;
  justify-content: space-between;
}

.receipt-title {
  text-align: center;
  font-weight: bold;
  font-size: 16px;
  margin-bottom: 10px;
}
</style>