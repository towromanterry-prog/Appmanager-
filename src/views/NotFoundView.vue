<template>
  <div class="not-found-view">
    <v-icon size="72" color="surface-variant" class="mb-4">mdi-alert-circle-outline</v-icon>
    <div class="text-h5 font-weight-bold">Страница не найдена</div>
    <div class="text-body-2 text-medium-emphasis mt-2">
      Проверьте адрес или вернитесь к основным разделам.
    </div>
    <div class="actions mt-6">
      <v-btn color="primary" to="/">На главную</v-btn>
      <v-btn variant="text" @click="goBack">Назад</v-btn>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.not-found-view {
  height: calc(100vh - var(--app-topbar-height, 68px));
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
}

.actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}
</style>
