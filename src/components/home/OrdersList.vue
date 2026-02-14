<template>
  <div class="h-100 d-flex flex-column">
    <div class="flex-grow-1 min-h-0" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
      <div v-if="!isLoggedIn" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-lock-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Нужен вход</div>
        <div class="text-body-2 text-disabled mt-2">Войдите, чтобы видеть заказы.</div>
        <v-btn class="mt-4" color="primary" to="/settings">Перейти в настройки</v-btn>
      </div>

      <div v-else-if="isLoading && !orders.length" class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-timer-sand</v-icon>
        <div class="text-h6 text-medium-emphasis">Загрузка...</div>
        <div class="text-body-2 text-disabled mt-2">Подготавливаем список заказов.</div>
      </div>

      <div v-else-if="orders.length" class="pa-2 pb-16">
        <OrderCard
          v-for="order in orders"
          :key="order.id"
          :order="order"
          class="mb-3"
          @edit="$emit('edit', order)"
          @delete="$emit('delete', $event)"
        />
      </div>

      <div v-else class="empty-state">
        <v-icon size="64" color="surface-variant" class="mb-4">mdi-clipboard-text-outline</v-icon>
        <div class="text-h6 text-medium-emphasis">Нет заказов</div>
        <div class="text-body-2 text-disabled mt-2">
          {{ selectedDate ? 'На эту дату ничего нет' : 'Список пуст' }}
        </div>
        <v-btn v-if="selectedDate" variant="text" color="primary" class="mt-4" @click="$emit('create')">
          Создать на {{ formatDateShort(selectedDate) }}
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import OrderCard from '@/components/OrderCard.vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const props = defineProps({
  isLoggedIn: { type: Boolean, default: false },
  isLoading: { type: Boolean, default: false },
  orders: { type: Array, default: () => [] },
  selectedDate: { type: String, default: null },
  formatDateFull: { type: Function, required: true },
  formatDateShort: { type: Function, required: true },
});

defineEmits(['create', 'edit', 'delete', 'open-calendar']);

const { triggerHapticFeedback } = useHapticFeedback();

// swipe-down open calendar
const touchStartY = ref(0);
const handleTouchStart = (e) => (touchStartY.value = e.touches[0].clientY);
const handleTouchEnd = (e) => {
  const dy = e.changedTouches[0].clientY - touchStartY.value;
  if (dy > 120 && window.scrollY < 50) {
    triggerHapticFeedback('light');
    // прокидываем наверх, если захочешь включить свайп-открытие
    // emit('open-calendar')
  }
};
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
}
</style>
