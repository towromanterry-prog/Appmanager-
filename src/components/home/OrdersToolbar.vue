<template>
  <div class="d-flex align-center justify-space-between">
    <div class="d-flex align-center cursor-pointer" @click="$emit('open-calendar')">
      <v-icon color="primary" class="mr-2">mdi-calendar-month</v-icon>

      <div v-if="selectedDate">
        <div class="text-caption text-medium-emphasis lh-1">Просмотр</div>
        <div class="text-subtitle-1 font-weight-bold lh-1 text-primary">
          {{ selectedDate }}
        </div>
      </div>

      <div v-else>
        <div class="text-subtitle-1 font-weight-bold">Все заказы</div>
      </div>

      <v-icon icon="mdi-chevron-down" size="small" class="ml-1 text-medium-emphasis" />
    </div>

    <v-btn
      v-if="selectedDate"
      icon="mdi-close"
      variant="text"
      size="small"
      color="medium-emphasis"
      @click.stop="$emit('clear-date')"
    />
  </div>
</template>

<script setup>
defineProps({
  selectedDate: { type: String, default: null }, // YYYY-MM-DD | null
});

defineEmits(['open-calendar', 'clear-date']);
</script>

<style scoped>
.lh-1 { line-height: 1.1; }
.cursor-pointer { cursor: pointer; }
</style>
