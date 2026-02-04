<template>
  <div class="order-form-view">
    <div v-if="!isLoggedIn" class="empty-state">
      <v-icon size="64" color="surface-variant" class="mb-4">mdi-lock-outline</v-icon>
      <div class="text-h6 text-medium-emphasis">Нужен вход</div>
      <div class="text-body-2 text-disabled mt-2">
        Войдите в аккаунт, чтобы создать или изменить заказ.
      </div>
      <v-btn class="mt-4" color="primary" to="/settings">Перейти в настройки</v-btn>
    </div>

    <OrderForm
      v-else
      :order-id="orderId"
      @close="handleClose"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useOrderStore } from '@/stores/orderStore';
import OrderForm from '@/components/OrderForm.vue';

const route = useRoute();
const router = useRouter();
const orderStore = useOrderStore();
const { user } = storeToRefs(orderStore);

const isLoggedIn = computed(() => Boolean(user.value));
const orderId = computed(() => route.params.orderId ?? null);

const handleClose = () => {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.replace('/');
  }
};
</script>

<style scoped>
.order-form-view {
  height: calc(100vh - var(--app-topbar-height, 68px));
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}
</style>
