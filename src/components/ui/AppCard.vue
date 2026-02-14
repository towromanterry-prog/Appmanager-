<!-- src/components/ui/AppCard.vue -->
<template>
  <v-card
    class="app-card-pad"
    :variant="variant"
    :rounded="rounded"
    :elevation="elevation"
    :border="border"
  >
    <slot />
  </v-card>
</template>

<script setup>
const props = defineProps({
  variant: { type: String, default: 'outlined' }, // мягкая граница
  rounded: { type: [String, Number], default: 'lg' },
  elevation: { type: [String, Number], default: 0 },
  border: { type: [Boolean, String], default: true },
});
</script>
