<template>
  <v-chip
    :color="statusInfo.color"
    :prepend-icon="statusInfo.icon"
    :variant="variant"
    size="small"
    label
    class="status-indicator"
    style="cursor: pointer;"
    @mousedown="startPress"
    @mouseup="endPress"
    @mouseleave="cancelPress"
    @mousemove="handleMove"
    @touchstart="startPress"
    @touchend="endPress"
    @touchcancel="cancelPress"
    @touchmove="handleMove"
    @click="onClick"
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
const touchStartX = ref(0);
const touchStartY = ref(0);
const isDragging = ref(false);

const startPress = (event) => {
  isLongPress.value = false;
  isDragging.value = false;

  if (event.type === 'touchstart') {
    touchStartX.value = event.touches[0].clientX;
    touchStartY.value = event.touches[0].clientY;
  } else {
    touchStartX.value = event.clientX;
    touchStartY.value = event.clientY;
  }

  pressTimer.value = setTimeout(() => {
    isLongPress.value = true;
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }
    emit('long-press');
  }, 600);
};

const handleMove = (event) => {
  if (isDragging.value) return;

  let currentX, currentY;
  if (event.type === 'touchmove') {
    if (event.touches.length === 0) return;
    currentX = event.touches[0].clientX;
    currentY = event.touches[0].clientY;
  } else {
    // Check if the primary mouse button is pressed
    if (event.buttons !== 1) return;
    currentX = event.clientX;
    currentY = event.clientY;
  }

  const dx = Math.abs(currentX - touchStartX.value);
  const dy = Math.abs(currentY - touchStartY.value);

  if (dx > 10 || dy > 10) {
    isDragging.value = true;
    if (pressTimer.value) {
      clearTimeout(pressTimer.value);
      pressTimer.value = null;
    }
  }
};

const onClick = (event) => {
  if (isDragging.value || isLongPress.value) {
    // This was a drag or a long press, not a simple tap.
    // We do nothing, allowing the v-chip's ripple to complete
    // without triggering our custom click event.
    return;
  }
  // This was a valid tap.
  emit('click', event);
};

const endPress = (event) => {
  // Prevent the browser from firing a "ghost" click on mobile
  // after we've handled the touch event.
  if (event.type === 'touchend') {
    event.preventDefault();
  }
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  // Use a timeout to reset flags after the click event has been processed.
  setTimeout(() => {
    isLongPress.value = false;
    isDragging.value = false;
  }, 50);
};

const cancelPress = () => {
  if (pressTimer.value) {
    clearTimeout(pressTimer.value);
    pressTimer.value = null;
  }
  isLongPress.value = false;
  isDragging.value = false;
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