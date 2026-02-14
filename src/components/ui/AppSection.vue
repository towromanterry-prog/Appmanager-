<!-- src/components/ui/AppSection.vue -->
<template>
  <section class="app-stack" style="gap: var(--s-3);">
    <div v-if="hasHeader" class="app-stack" style="gap: var(--s-2);">
      <div style="display: flex; align-items: center; gap: var(--s-3);">
        <div style="min-width: 0; flex: 1;">
          <div v-if="$slots.title" class="text-subtitle-1">
            <slot name="title" />
          </div>
          <div v-else-if="title" class="text-subtitle-1">
            {{ title }}
          </div>

          <div v-if="$slots.subtitle" class="text-body-2" style="opacity: 0.8;">
            <slot name="subtitle" />
          </div>
          <div v-else-if="subtitle" class="text-body-2" style="opacity: 0.8;">
            {{ subtitle }}
          </div>
        </div>

        <div v-if="$slots.actions" style="flex: 0 0 auto;">
          <slot name="actions" />
        </div>
      </div>
    </div>

    <div class="app-stack" style="gap: var(--s-3);">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
});

const hasHeader = computed(() => !!props.title || !!props.subtitle || !!useSlotsSafe());
function useSlotsSafe() {
  // avoids importing useSlots; template checks slots anyway
  return true;
}
</script>
