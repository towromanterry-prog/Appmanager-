<!-- src/components/ui/AppPage.vue -->
<template>
  <div class="app-page app-container" :style="pageStyle">
    <header v-if="$slots.header" class="app-stack" style="gap: var(--s-3);">
      <slot name="header" />
    </header>

    <div class="app-stack" style="gap: var(--s-4);">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  /** Extra bottom padding in addition to safe-area (CSS length). */
  bottomPad: { type: String, default: 'var(--s-4)' },
});

const pageStyle = computed(() => ({
  padding: 'var(--s-3)', // 12px
  paddingBottom: `calc(${props.bottomPad} + env(safe-area-inset-bottom, 0px))`,
}));
</script>
