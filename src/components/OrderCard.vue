<script setup>
import { ref, computed, nextTick } from 'vue';
import { useOrderStore } from '@/stores/orderStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useClientsStore } from '@/stores/clientsStore';
// import { useTemplateSelectionStore } from '@/stores/templateSelectionStore'; <--- УДАЛЕНО
import { useTagsStore } from '@/stores/tagsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import StatusIndicator from '@/components/common/StatusIndicator.vue';
import StatusPickerDialog from '@/components/common/StatusPickerDialog.vue';
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
const clientsStore = useClientsStore();
// const templateSelectionStore = useTemplateSelectionStore(); <--- УДАЛЕНО
const tagsStore = useTagsStore();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const { toLongDate, toShortDate } = useFormatDate();
const { triggerHapticFeedback } = useHapticFeedback();

const expanded = ref(false);
const isGeneratingReceipt = ref(false);
const receiptRef = ref(null);

// === ЛОГИКА СТАТУСОВ ===
const STATUS_PICKER_DEFAULT = {
  open: false,
  itemType: 'order',
  itemIndex: -1,
  currentStatus: 'accepted',
  activeStatuses: {}
};

const statusPicker = ref({ ...STATUS_PICKER_DEFAULT });

const statusPickerTitle = computed(() => {
  if (statusPicker.value.itemType === 'service') return 'Выберите статус услуги';
  if (statusPicker.value.itemType === 'detail') return 'Выберите статус детали';
  return 'Выберите статус заказа';
});

const getActiveStatusesByType = (itemType) => {
  if (itemType === 'service') return settingsStore.appSettings.serviceStatuses || {};
  if (itemType === 'detail') return settingsStore.appSettings.detailStatuses || {};
  return settingsStore.appSettings.orderStatuses || {};
};

const openStatusPicker = (itemType, itemIndex = -1) => {
  if (props.order.status === 'cancelled') return;

  let currentStatus = props.order.status;

  if (itemType === 'service') {
    const service = props.order.services?.[itemIndex];
    if (!service || service.status === 'cancelled') return;
    currentStatus = service.status;
  }

  if (itemType === 'detail') {
    const detail = props.order.details?.[itemIndex];
    if (!detail || detail.status === 'cancelled') return;
    currentStatus = detail.status;
  }

  statusPicker.value = {
    open: true,
    itemType,
    itemIndex,
    currentStatus,
    activeStatuses: getActiveStatusesByType(itemType)
  };
};

const applyPickedStatus = (newStatus) => {
  const picker = statusPicker.value;
  if (!newStatus || newStatus === picker.currentStatus) return;

  triggerHapticFeedback('tap');
  orderStore.updateStatus(props.order.id, newStatus, picker.itemType, picker.itemIndex);
};

// === ВЫЧИСЛЯЕМЫЕ СВОЙСТВА ===
const resolvedClient = computed(() => {
  if (!props.order.clientId) return null;
  return clientsStore.getClientById(props.order.clientId) || null;
});

const displayClientName = computed(() => {
  return resolvedClient.value?.name || props.order.clientName || '';
});

const displayClientPhone = computed(() => {
  return resolvedClient.value?.phone || props.order.phone || '';
});

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

const totalAmount = computed(() => props.order.price || 0); // Исправлено на price, так как в модели Order обычно price
const formattedDeadline = computed(() => props.order.deadline ? toLongDate(props.order.deadline) : 'Не указан');
const formattedCreateDate = computed(() => props.order.createDate ? toShortDate(props.order.createDate) : '');

const isOverdue = computed(() => {
  if (!props.order.deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(props.order.deadline) < today && props.order.status !== 'delivered' && props.order.status !== 'cancelled';
});

const formattedPhone = computed(() => {
  const source = displayClientPhone.value || props.order.phone || '';
  if (!source) return '';
  return `+${source.replace(/\D/g, '')}`;
});

const phoneHref = computed(() => (formattedPhone.value ? `tel:${formattedPhone.value}` : ''));

// === МЕТОДЫ ===
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

// === ОТПРАВКА СООБЩЕНИЙ (УПРОЩЕННАЯ) ===
const sendMessage = (service) => {
  // Простой текст по умолчанию, без модального окна выбора шаблонов
  const message = `Здравствуйте, ${displayClientName.value}. Сумма заказа: ${totalAmount.value}₽.`;

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

// === СКАЧИВАНИЕ ЧЕКА ===
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

const deleteWithHaptic = (orderId) => {
  triggerHapticFeedback('tap');
  emit('delete', orderId);
};

const editWithHaptic = (order) => {
  triggerHapticFeedback('tap');
  emit('edit', order);
};
</script>
