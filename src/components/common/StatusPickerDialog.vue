<template>
  <v-dialog
    :model-value="modelValue"
    max-width="360"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-subtitle-1">{{ title }}</v-card-title>
      <v-divider />
      <v-list density="comfortable">
        <v-list-item
          v-for="option in options"
          :key="option.value"
          :title="option.title"
          :subtitle="option.subtitle"
          :disabled="option.disabled"
          :active="option.value === currentStatus"
          @click="handleSelect(option)"
        />
      </v-list>
      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">Закрыть</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { useOrderStore } from '@/stores/orderStore';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Выбор статуса'
  },
  itemType: {
    type: String,
    default: 'order'
  },
  currentStatus: {
    type: String,
    required: true
  },
  activeStatuses: {
    type: Object,
    default: () => ({})
  }
});

const emit = defineEmits(['update:modelValue', 'select']);
const orderStore = useOrderStore();

const STATUS_FLOWS = {
  order: ['accepted', 'additional', 'in_progress', 'completed', 'delivered'],
  service: ['accepted', 'additional', 'in_progress', 'completed'],
  detail: ['accepted', 'additional', 'in_progress', 'completed']
};

const options = computed(() => {
  const flow = STATUS_FLOWS[props.itemType] || STATUS_FLOWS.order;
  const baseOptions = flow.map((status) => {
    const isEnabled = Boolean(props.activeStatuses?.[status]);
    const isCurrent = status === props.currentStatus;

    return {
      value: status,
      title: orderStore.getStatusText(status),
      subtitle: !isEnabled && isCurrent ? 'Отключен в настройках' : undefined,
      disabled: !isEnabled
    };
  });

  if (!flow.includes(props.currentStatus) && props.currentStatus) {
    return [
      {
        value: props.currentStatus,
        title: `${orderStore.getStatusText(props.currentStatus)} (текущий)`,
        subtitle: 'Отключен в настройках',
        disabled: true
      },
      ...baseOptions
    ];
  }

  return baseOptions;
});

function handleSelect(option) {
  if (option.disabled || option.value === props.currentStatus) {
    return;
  }

  emit('select', option.value);
  emit('update:modelValue', false);
}
</script>
