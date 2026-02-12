<template>
  <v-text-field
    type="date"
    :model-value="modelValue"
    @update:model-value="emit('update:modelValue', $event)"
    label="Дата"
    variant="outlined"
  ></v-text-field>
</template>

<script setup>
defineProps({
  modelValue: String,
});

const emit = defineEmits(['update:modelValue']);
</script>