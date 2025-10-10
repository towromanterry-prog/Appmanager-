<template>
  <v-dialog v-model="dialog" max-width="500">
    <v-card>
      <v-card-title>{{ editingService ? 'Редактировать услугу' : 'Добавить услугу' }}</v-card-title>
      <v-card-text>
        <v-form ref="serviceFormRef">
          <v-text-field
            v-model="serviceForm.name"
            label="Название услуги"
            :rules="[v => !!v || 'Название обязательно']"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-text-field
            v-model.number="serviceForm.defaultPrice"
            label="Цена по умолчанию"
            type="number"
            prefix="₽"
            :rules="[v => v > 0 || 'Цена должна быть больше 0']"
            variant="outlined"
            class="mb-4"
          ></v-text-field>
          <v-select
            v-model="serviceForm.tags"
            :items="availableTags"
            item-title="name"
            item-value="id"
            label="Теги"
            multiple
            chips
            variant="outlined"
          >
            <template v-slot:selection="{ item }">
              <v-chip :color="item.raw.color" size="small">{{ item.title }}</v-chip>
            </template>
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="null">
                <template v-slot:prepend>
                  <v-chip :color="item.raw.color" size="small">{{ item.raw.name }}</v-chip>
                </template>
              </v-list-item>
            </template>
          </v-select>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn @click="closeDialog">Отмена</v-btn>
        <v-btn color="primary" @click="save">{{ editingService ? 'Сохранить' : 'Добавить' }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { useServiceStore } from '@/stores/serviceStore';
import { useTagsStore } from '@/stores/tagsStore';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  service: { type: Object, default: null }
});
const emit = defineEmits(['update:modelValue', 'saved']);

const serviceStore = useServiceStore();
const tagsStore = useTagsStore();

const dialog = ref(props.modelValue);
const serviceFormRef = ref(null);
const serviceForm = ref({ name: '', defaultPrice: 0, tags: [] });
const editingService = ref(null);

const availableTags = computed(() => tagsStore.tags);

watch(() => props.modelValue, (newVal) => {
  dialog.value = newVal;
  if (newVal) {
    if (props.service) {
      editingService.value = props.service;
      serviceForm.value = { ...props.service };
    } else {
      editingService.value = null;
      serviceForm.value = { name: '', defaultPrice: 0, tags: [] };
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

  if (editingService.value) {
    serviceStore.updateService(editingService.value.id, serviceForm.value);
  } else {
    serviceStore.addService(serviceForm.value);
  }
  emit('saved');
  closeDialog();
};

if (tagsStore.tags.length === 0) {
  tagsStore.loadTags();
}
</script>