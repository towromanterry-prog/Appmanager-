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
      />

      <v-text-field
        v-model="form.phone"
        label="Телефон *"
        variant="outlined"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="+7 000 000 00 00"
        class="mb-3"
        :rules="[v => !!String(v || '').trim() || 'Телефон обязателен']"
        @focus="() => { ensurePhonePrefix(); }"
        @update:model-value="onPhoneInput"
        @keydown="onPhoneKeydown"
      />
    </v-form>

    <template #actions>
      <v-btn variant="text" @click="close">Отмена</v-btn>
      <v-btn color="primary" :loading="saving" @click="save">
        Сохранить
      </v-btn>
    </template>
  </AppDialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { useClientsStore } from '@/stores/clientsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import AppDialog from '@/components/ui/AppDialog.vue';

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
});

const isEditMode = computed(() => !!props.client);

const dialog = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

// ===== phone mask (как в OrderForm) =====
const formatRuPhone = (raw) => {
  const s = String(raw ?? '');
  let digits = s.replace(/\D/g, '');

  if (digits.startsWith('8')) digits = '7' + digits.slice(1);
  if (digits.startsWith('7')) digits = digits.slice(1);

  digits = digits.slice(0, 10);

  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6, 8);
  const p4 = digits.slice(8, 10);

  let out = '+7';
  if (p1) out += ` ${p1}`;
  if (p2) out += ` ${p2}`;
  if (p3) out += ` ${p3}`;
  if (p4) out += ` ${p4}`;
  if (!digits) out += ' ';

  return out;
};

const ensurePhonePrefix = () => {
  // если уже что-то введено (в т.ч. "8..." / "7...") — просто отформатируем,
  // если пусто — поставим "+7 "
  const current = String(form.value.phone ?? '');
  form.value.phone = current.trim() ? formatRuPhone(current) : '+7 ';
};

const onPhoneInput = (val) => {
  form.value.phone = formatRuPhone(val);
};

const onPhoneKeydown = (e) => {
  const allowed = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End'];
  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
};
// ===== /phone mask =====

watch(
  () => props.client,
  (newVal) => {
    if (newVal) {
      form.value = {
        name: newVal.name || '',
        lastName: newVal.lastName || '',
        phone: newVal.phone ? formatRuPhone(newVal.phone) : '',
      };
    } else {
      form.value = { name: '', lastName: '', phone: '' };
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