<template>
  <AppDialog 
    v-model="dialog" 
    :max-width="500"
    :title="isEditMode ? 'Редактировать клиента' : 'Новый клиент'"
  >
    <v-form ref="formRef" @submit.prevent="save">
      <v-text-field
        v-model="form.name"
        label="Имя клиента *"
        variant="outlined"
        :rules="[v => !!v || 'Имя обязательно']"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model="form.phone"
        label="Телефон *"
        variant="outlined"
        type="tel"
        placeholder="+7"
        class="mb-3"
        :rules="[v => !!String(v || '').trim() || 'Телефон обязателен']"
      ></v-text-field>

      <v-textarea
        v-model="form.notes"
        label="Примечание"
        variant="outlined"
        rows="3"
        auto-grow
        hide-details
      ></v-textarea>
    </v-form>

    <template #actions>
      <v-btn variant="text" @click="close">Отмена</v-btn>
      <v-btn 
        color="primary" 
        :loading="saving" 
        @click="save"
      >
        Сохранить
      </v-btn>
    </template>
  </AppDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useClientsStore } from '@/stores/clientsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import AppDialog from '@/components/ui/AppDialog.vue'; // <-- Добавили импорт

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  client: { type: Object, default: null }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const clientsStore = useClientsStore();
const { triggerHapticFeedback } = useHapticFeedback();

const formRef = ref(null);
const saving = ref(false);

const form = ref({
  name: '',
  lastName: '',
  phone: '',
  notes: ''
});

const isEditMode = computed(() => !!props.client);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

watch(
  () => props.client,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || '',
        lastName: newVal.lastName || '',
        phone: newVal.phone || '',
        notes: newVal.notes || ''
      };
    } else {
      form.value = { name: '', lastName: '', phone: '', notes: '' };
    }
  },
  { immediate: true }
);

const close = () => {
  dialog.value = false;
};

const save = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  saving.value = true;
  try {
    await clientsStore.addOrUpdateClient({
      ...form.value,
    });

    triggerHapticFeedback('success');
    emit('saved');
    close();
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  } finally {
    saving.value = false;
  }
};
</script>
