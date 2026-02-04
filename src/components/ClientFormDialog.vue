<template>
  <v-dialog v-model="dialogValue" max-width="520">
    <v-card>
      <v-card-title class="text-h6 font-weight-bold">
        {{ client ? 'Редактировать клиента' : 'Новый клиент' }}
      </v-card-title>
      <v-card-text>
        <v-form ref="formRef" @submit.prevent="handleSubmit">
          <v-text-field
            v-model="form.name"
            label="Имя клиента *"
            :rules="[rules.required]"
            required
          ></v-text-field>
          <v-text-field
            v-model="form.phone"
            label="Телефон"
            placeholder="+7 900 123-45-67"
          ></v-text-field>
          <v-textarea
            v-model="form.notes"
            label="Примечание"
            rows="2"
            auto-grow
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">Отмена</v-btn>
        <v-btn color="primary" @click="handleSubmit">Сохранить</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  client: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'save']);

const dialogValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const formRef = ref(null);
const form = ref({
  name: '',
  phone: '',
  notes: ''
});

const rules = {
  required: (value) => Boolean(value && value.trim()) || 'Обязательное поле'
};

const resetForm = () => {
  form.value = {
    name: '',
    phone: '',
    notes: ''
  };
};

watch(
  () => props.client,
  (client) => {
    if (client) {
      form.value = {
        name: client.name || '',
        phone: client.phone || '',
        notes: client.notes || ''
      };
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

const close = () => {
  dialogValue.value = false;
};

const handleSubmit = async () => {
  const isValid = await formRef.value?.validate();
  if (!isValid?.valid) return;
  emit('save', { ...form.value });
  close();
};
</script>
