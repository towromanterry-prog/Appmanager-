<template>
  <AppDialog v-model="open" :title="editingDetail ? 'Редактировать деталь' : 'Новая деталь'" max-width="520">
    <v-form ref="formRef" @submit.prevent="save">
      <div class="app-stack" style="gap: var(--s-3);">
        <v-text-field
          v-model="form.name"
          label="Название"
          :rules="[(v) => !!String(v || '').trim() || 'Название обязательно']"
          variant="outlined"
          density="compact"
          hide-details="auto"
        />

        <v-text-field
          v-model.number="form.defaultPrice"
          label="Цена по умолчанию"
          type="number"
          variant="outlined"
          density="compact"
          hide-details
        />
      </div>
    </v-form>

    <template #actions>
      <v-btn variant="text" :disabled="isSaving" @click="closeDialog">Отмена</v-btn>
      <v-btn color="primary" :loading="isSaving" @click="save">
        {{ editingDetail ? 'Сохранить' : 'Добавить' }}
      </v-btn>
    </template>
  </AppDialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useDetailsStore } from '@/stores/detailsStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import AppDialog from '@/components/ui/AppDialog.vue';

const { triggerHapticFeedback } = useHapticFeedback();

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  detail: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'saved']);

const detailsStore = useDetailsStore();

const open = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v),
});

const formRef = ref(null);
const editingDetail = ref(null);
const form = ref({ name: '', defaultPrice: 0 });
const isSaving = ref(false);

watch(
  () => open.value,
  (val) => {
    if (!val) return;
    editingDetail.value = props.detail || null;
    form.value = {
      name: props.detail?.name || '',
      defaultPrice: Number(props.detail?.defaultPrice || 0),
    };
  }
);

const closeDialog = () => {
  open.value = false;
  triggerHapticFeedback('tap');
};

const save = async () => {
  const { valid } = await formRef.value?.validate?.();
  if (!valid) return;

  const payload = {
    name: String(form.value.name || '').trim(),
    defaultPrice: Number(form.value.defaultPrice || 0),
  };
  if (!payload.name) return;

  isSaving.value = true;
  try {
    if (editingDetail.value) {
      await detailsStore.updateDetail(editingDetail.value.id, payload);
    } else {
      await detailsStore.addDetail(payload);
    }
    triggerHapticFeedback('success');
    emit('saved');
    open.value = false;
  } catch (e) {
    console.error(e);
    triggerHapticFeedback('error');
  } finally {
    isSaving.value = false;
  }
};
</script>