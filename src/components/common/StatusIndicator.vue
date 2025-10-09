<template>
  <v-chip
    :color="statusInfo.color"
    :prepend-icon="statusInfo.icon"
    :variant="variant"
    size="small"
    label
    class="status-indicator"
    style="cursor: pointer;"
    @mousedown.stop="startPress"
    @mouseup.stop="endPress"
    @mouseleave="cancelPress"
    @touchstart.prevent.stop="startPress"
    @touchend.prevent.stop="endPress"
    @touchcancel.prevent="cancelPress"
    @click.stop.prevent
  >
    {{ statusInfo.text }}
  </v-chip>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useOrderStore } from '@/stores/orderStore';

const props = defineProps({
  status: {
    type: String,
    required: true,
  },
  variant: {
    type: String,
    default: 'tonal'
  }
});

const emit = defineEmits(['click', 'long-press']);

const orderStore = useOrderStore();
const pressTimer = ref(null);
const isLongPress = ref(false);

const startPress = (event) => {
  isLongPress.value = false;
  pressTimer.value = setTimeout(() => {
    isLongPress.value = true;
    // Добавляем вибрацию при долгом тапе (если поддерживается)
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    emit('long-press');
  }, 600);
};

const endPress = (event) => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  
  // Эмитим click только если это НЕ был долгий тап
  if (!isLongPress.value) {
    emit('click', event);
  }
  
  // Сбрасываем флаг
  setTimeout(() => {
    isLongPress.value = false;
  }, 100);
};

const cancelPress = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  isLongPress.value = false;
};

const statusInfo = computed(() => {
  const text = orderStore.getStatusText(props.status);
  switch (props.status) {
    case 'accepted':
      return { text, color: 'primary', icon: 'mdi-inbox-arrow-down' };
    case 'additional':
      return { text, color: 'deep-purple-accent-2', icon: 'mdi-progress-question' };
    case 'in_progress':
      return { text, color: 'warning', icon: 'mdi-progress-wrench' };
    case 'completed':
      return { text, color: 'info', icon: 'mdi-progress-check' };
    case 'delivered':
      return { text, color: 'success', icon: 'mdi-check-decagram' };
    case 'cancelled':
      return { text, color: 'error', icon: 'mdi-cancel' };
    default:
      return { text: 'Неизвестно', color: 'grey', icon: 'mdi-help-circle' };
  }
});
</script>

<style scoped>
.status-indicator {
  min-width: 100px;
  justify-content: center;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  touch-action: manipulation;
}
</style>