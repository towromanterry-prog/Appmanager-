<!-- src/components/ui/AppDialog.vue -->
<template>
  <v-dialog
    v-model="open"
    :max-width="maxWidth"
    :persistent="persistent"
    scrollable
    @click:outside="onClickOutside"
    @keydown.esc="onEsc"
  >
    <v-card
      class="app-card-pad app-dialog-card"
      :rounded="rounded"
      :elevation="0"
      variant="flat"
      color="surface"
      :border="true"
      @pointerdown.capture="onPointerDown"
    >
      <div class="app-stack" style="gap: var(--s-3);">
        <div v-if="hasTitle" style="display: flex; align-items: center; gap: var(--s-3);">
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

          <div v-if="$slots.titleActions" style="flex: 0 0 auto;">
            <slot name="titleActions" />
          </div>
        </div>

        <div class="app-stack" style="gap: var(--s-3);">
          <slot />
        </div>

        <div
          v-if="$slots.actions"
          style="display: flex; justify-content: flex-end; gap: var(--s-2); padding-top: var(--s-2);"
        >
          <slot name="actions" />
        </div>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  maxWidth: { type: [String, Number], default: 520 },
  persistent: { type: Boolean, default: false },
  rounded: { type: [String, Number], default: 'lg' },
});

const emit = defineEmits(['update:modelValue']);
const { triggerHapticFeedback } = useHapticFeedback();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const hasTitle = computed(() => !!props.title || !!props.subtitle);

// intent закрытия, чтобы не вибрировать на "программное" закрытие (например, после сохранения)
const closeIntent = ref(null); // 'cancel' | 'dismiss' | null

const isCancelTarget = (target) => {
  if (!target || typeof target.closest !== 'function') return false;

  // явная маркировка (можно использовать в любых кнопках отмены)
  if (target.closest('[data-app-cancel],[data-cancel],[data-role="cancel"]')) return true;

  const btn = target.closest('button');
  if (!btn) return false;

  const txt = String(btn.textContent || '').trim().toLowerCase();
  return txt === 'отмена' || txt.includes('отмена') || txt === 'cancel' || txt.includes('cancel');
};

const onPointerDown = (e) => {
  closeIntent.value = isCancelTarget(e.target) ? 'cancel' : null;
};

const onClickOutside = () => {
  if (props.persistent) {
    closeIntent.value = null;
    return;
  }
  closeIntent.value = 'dismiss';
};

const onEsc = () => {
  if (props.persistent) {
    closeIntent.value = null;
    return;
  }
  closeIntent.value = 'dismiss';
};

watch(
  () => open.value,
  (val, prev) => {
    if (prev === true && val === false) {
      if (closeIntent.value === 'cancel' || closeIntent.value === 'dismiss') {
        triggerHapticFeedback('tap');
      }
      closeIntent.value = null;
    }
  }
);
</script>

<style scoped>
.app-dialog-card {
  background: rgb(var(--v-theme-surface));
  padding: var(--s-4);
}
</style>