<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>{{ editingService ? 'Редактировать услугу' : 'Добавить услугу' }}</v-card-title>
      <v-card-text>
        <v-form ref="serviceFormRef" @submit.prevent="save">
          <v-text-field
            v-model="serviceForm.name"
            label="Название услуги"
            :rules="[v => !!v || 'Название обязательно']"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model="serviceForm.price"
            label="Цена"
            type="number"
            prefix="₽"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-textarea
            v-model="serviceForm.notes"
            label="Примечание"
            variant="outlined"
            rows="2"
            auto-grow
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn :disabled="isSaving" @click="closeDialog">Отмена</v-btn>
        <v-btn color="primary" :loading="isSaving" @click="save">
          {{ editingService ? 'Сохранить' : 'Добавить' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
// ИСПРАВЛЕНО: useServicesStore (было useservicesStore)
import { useServicesStore } from '@/stores/servicesStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const { triggerHapticFeedback } = useHapticFeedback();
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  service: { type: Object, default: null }
});
const emit = defineEmits(['update:modelValue', 'saved']);

// ИСПРАВЛЕНО: вызов useServicesStore
const servicesStore = useServicesStore();

const dialog = ref(props.modelValue);
const serviceFormRef = ref(null);
const serviceForm = ref({ name: '', price: '', notes: '' });
const editingService = ref(null);
const isSaving = ref(false);

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    if (props.service) {
      editingService.value = props.service;
      serviceForm.value = {
        name: props.service.name || '',
        price: props.service.price ?? '',
        notes: props.service.notes || ''
      };
    } else {
      editingService.value = null;
      serviceForm.value = { name: '', price: '', notes: '' };
    }
  }
});

watch(dialog, (newVal) => {
  if (!newVal) {
    emit('update:modelValue', false);
  }
});

const closeDialog = () => {
  dialog.value = false;
};

const save = async () => {
  const { valid } = await serviceFormRef.value.validate();
  if (!valid) return;

  isSaving.value = true;
  try {
    if (editingService.value) {
      await servicesStore.updateService(editingService.value.id, serviceForm.value);
    } else {
      await servicesStore.addService(serviceForm.value);
    }
    triggerHapticFeedback('success');
    emit('saved');
    closeDialog();
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  } finally {
    isSaving.value = false;
  }
};
</script>
