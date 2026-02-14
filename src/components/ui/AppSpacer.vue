<!-- src/components/ui/AppSpacer.vue -->
<template>
  <div
    aria-hidden="true"
    :style="spacerStyle"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** CSS length: e.g. "var(--s-3)", "12px", "1rem" */
  size: { type: String, default: 'var(--s-3)' },
  /** "y" = vertical, "x" = horizontal */
  axis: { type: String, default: 'y' },
});

const spacerStyle = computed(() => {
  if (props.axis === 'x') return { width: props.size, height: '1px', flex: `0 0 ${props.size}` };
  return { height: props.size, width: '1px', flex: `0 0 ${props.size}` };
});
</script>
