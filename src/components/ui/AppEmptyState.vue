<!-- src/components/ui/AppEmptyState.vue -->
<template>
  <div class="app-stack" style="gap: var(--s-3); text-align: center; padding: var(--s-4);">
    <v-icon v-if="icon" :icon="icon" size="36" style="opacity: 0.8;" />

    <div class="app-stack" style="gap: var(--s-2);">
      <div class="text-subtitle-1">
        <slot name="title">
          {{ title }}
        </slot>
      </div>

      <div v-if="description || $slots.description" class="text-body-2" style="opacity: 0.8;">
        <slot name="description">
          {{ description }}
        </slot>
      </div>
    </div>

    <div v-if="hasAction" style="display: flex; justify-content: center; gap: var(--s-2);">
      <slot name="action">
        <v-btn
          v-if="actionText"
          :variant="actionVariant"
          :color="actionColor"
          size="small"
          @click="$emit('action')"
        >
          {{ actionText }}
        </v-btn>
      </slot>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

defineEmits(['action']);

const props = defineProps({
  icon: { type: String, default: '' }, // например: "mdi-inbox-outline"
  title: { type: String, default: 'Ничего нет' },
  description: { type: String, default: '' },
  actionText: { type: String, default: '' },
  actionVariant: { type: String, default: 'flat' },
  actionColor: { type: String, default: 'primary' },
});

const hasAction = computed(() => !!props.actionText);
</script>
