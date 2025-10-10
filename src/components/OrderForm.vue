<template>
  <v-card class="d-flex flex-column" style="height: 100vh;">
    <!-- Шапка формы -->
    <v-toolbar color="surface" flat>
      <v-btn icon="mdi-close" @click="close"></v-btn>
      <v-toolbar-title>{{ isEditing ? 'Редактировать заказ' : 'Новый заказ' }}</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-toolbar-items>
        <v-btn
          :disabled="!isFormValid"
          :loading="isSaving"
          variant="text"
          color="primary"
          @click="saveOrder"
        >
          Сохранить
        </v-btn>
      </v-toolbar-items>
    </v-toolbar>
    <v-divider></v-divider>

    <!-- Контент формы -->
    <v-card-text class="flex-grow-1" style="overflow-y: auto;">
      <v-form>
        <v-container>
          <v-row>
            <!-- Секция клиента -->
            <v-col cols="12">
              <div class="text-overline mb-2">Клиент</div>
              <v-text-field
                v-model="form.clientName"
                :label="`Имя клиента ${settingsStore.isFieldRequired('clientName') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('clientName') ? [rules.required] : []"
              ></v-text-field>
              <v-text-field
                v-model="form.lastName"
                :label="`${settingsStore.appSettings.orderFormLastNameLabel} ${settingsStore.isFieldRequired('lastName') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('lastName') ? [rules.required] : []"
              ></v-text-field>
              <v-text-field
                v-model="form.phone"
                :label="`Телефон ${settingsStore.isFieldRequired('phone') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('phone') ? [rules.required] : []"
                type="tel"
              ></v-text-field>
            </v-col>

            <!-- Секция услуг -->
            <v-col cols="12">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-overline">Услуги {{ settingsStore.isFieldRequired('services') ? '*' : '' }}</div>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="isServiceModalOpen = true"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Выбрать услуги
                </v-btn>
              </div>

              <v-chip-group v-if="form.services.length > 0" column class="mb-2">
                <v-chip
                  v-for="(service, index) in form.services"
                  :key="index"
                  closable
                  @click:close="removeService(index)"
                >
                  {{ service.name }} - {{ service.price }}₽
                </v-chip>
              </v-chip-group>

              <div v-else class="text-caption text-medium-emphasis">
                {{ settingsStore.isFieldRequired('services') ? 'Услуги обязательны для выбора' : 'Услуги не выбраны' }}
              </div>
            </v-col>
            
            <!-- Секция оплаты и сроков -->
            <v-col cols="12">
              <div class="text-overline mb-2">Оплата и сроки</div>
               <v-row>
                <v-col cols="12" sm="6">
                  <v-text-field
                    :model-value="totalAmount"
                    label="Общая сумма"
                    readonly
                    prefix="₽"
                  ></v-text-field>
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="form.deadline"
                    :label="`Дедлайн ${settingsStore.isFieldRequired('deadline') ? '*' : ''}`"
                    :rules="settingsStore.isFieldRequired('deadline') ? [rules.required] : []"
                    type="date"
                  ></v-text-field>
                </v-col>
              </v-row>
            </v-col>

            <!-- Секция дополнительно -->
            <v-col cols="12">
              <div class="text-overline mb-2">Дополнительно</div>
              <v-textarea
                v-model="form.notes"
                :label="`Примечание ${settingsStore.isFieldRequired('notes') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('notes') ? [rules.required] : []"
                rows="3"
                auto-grow
              ></v-textarea>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card-text>
  </v-card>
  <ServiceSelectionModal
    v-model="isServiceModalOpen"
    :previously-selected="form.services"
    @selection-confirmed="handleServicesSelected"
  />
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue';
import { useOrderStore } from '@/stores/orderStore.js';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import ServiceSelectionModal from './ServiceSelectionModal.vue';

const props = defineProps({
  orderId: { type: [String, null], default: null }
});
const emit = defineEmits(['close']);

const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();

const isSaving = ref(false);
const isServiceModalOpen = ref(false);

const form = reactive({
  clientName: '',
  lastName: '',
  phone: '',
  services: [],
  deadline: new Date().toISOString().split('T')[0],
  notes: ''
});

const rules = {
  required: value => !!value || 'Обязательное поле',
};

const isEditing = computed(() => props.orderId !== null);
const totalAmount = computed(() => form.services.reduce((sum, s) => sum + Number(s.price || 0), 0));

const isFormValid = computed(() => {
  const { requiredFields } = settingsStore;
  if (requiredFields.clientName && !form.clientName.trim()) return false;
  if (requiredFields.lastName && !form.lastName.trim()) return false;
  if (requiredFields.phone && !form.phone.trim()) return false;
  if (requiredFields.services && form.services.length === 0) return false;
  if (requiredFields.deadline && !form.deadline) return false;
  if (requiredFields.notes && !form.notes.trim()) return false;
  return true;
});

const resetForm = () => {
  Object.assign(form, { 
    clientName: '', 
    lastName: '',
    phone: '', 
    services: [], 
    deadline: new Date().toISOString().split('T')[0], 
    notes: '' 
  });
};

watch(() => props.orderId, (newId) => {
  if (newId) {
    const order = orderStore.getOrderById(newId);
    if (order) {
      Object.assign(form, {
        clientName: order.clientName,
        lastName: order.lastName,
        phone: order.phone,
        services: JSON.parse(JSON.stringify(order.services)), // Глубокое копирование
        deadline: order.deadline,
        notes: order.notes,
      });
    }
  } else {
    resetForm();
  }
}, { immediate: true });

const saveOrder = async () => {
  if (!isFormValid.value) return;
  
  isSaving.value = true;
  
  const orderData = {
    clientName: form.clientName,
    lastName: form.lastName,
    phone: form.phone,
    services: form.services,
    totalAmount: totalAmount.value,
    deadline: form.deadline,
    notes: form.notes,
  };

  try {
    if (isEditing.value) {
      await orderStore.updateOrder(props.orderId, orderData);
    } else {
      await orderStore.addOrder(orderData);
    }
    // Также обновляем или добавляем клиента в базу
    clientsStore.addOrUpdateClient({
      name: form.clientName,
      phone: form.phone,
      services: form.services.map(s => s.name),
    });
    close();
  } catch(e) {
    console.error("Ошибка сохранения заказа", e)
  } finally {
    isSaving.value = false;
  }
};

const close = () => {
  emit('close');
};

const removeService = (index) => {
  form.services.splice(index, 1);
};

const handleServicesSelected = (selectedServices) => {
  form.services = selectedServices;
  isServiceModalOpen.value = false;
};
</script>