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
              <v-autocomplete
                v-model="form.clientId"
                :items="clientsStore.activeClients"
                item-title="name"
                item-value="id"
                label="Выбрать клиента"
                clearable
                :loading="clientsStore.loading"
                :disabled="!clientsStore.ready"
                no-data-text="Клиенты не найдены"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :title="item.title" :subtitle="item.raw.phone || 'Телефон не указан'"></v-list-item>
                </template>
              </v-autocomplete>
              <v-alert
                v-if="isClientMissing"
                type="warning"
                variant="tonal"
                density="compact"
                class="mb-3"
              >
                Выбранный клиент еще не загружен. Подождите синхронизацию или выберите другого клиента.
              </v-alert>
              <v-text-field
                v-model="clientNameInput"
                :label="`Имя клиента ${settingsStore.isFieldRequired('clientName') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('clientName') ? [rules.required] : []"
                :readonly="Boolean(resolvedClient)"
              ></v-text-field>
              <v-text-field
                v-model="form.lastName"
                :label="`${settingsStore.appSettings.orderFormLastNameLabel} ${settingsStore.isFieldRequired('lastName') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('lastName') ? [rules.required] : []"
              ></v-text-field>
              <v-text-field
                v-model="clientPhoneInput"
                :label="`Телефон ${settingsStore.isFieldRequired('phone') ? '*' : ''}`"
                :rules="settingsStore.isFieldRequired('phone') ? [rules.required] : []"
                type="tel"
                prefix="+7"
                :readonly="Boolean(resolvedClient)"
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

              <v-autocomplete
                v-model="quickService"
                :items="serviceStore.activeServices"
                item-title="name"
                item-value="id"
                return-object
                label="Быстро добавить услугу"
                clearable
                :loading="serviceStore.loading"
                :disabled="!serviceStore.ready"
                no-data-text="Услуги не найдены"
                class="mb-3"
                @update:modelValue="handleQuickServiceSelect"
              ></v-autocomplete>

              <div v-if="form.services.length > 0" class="item-list">
                <div v-for="(service, index) in form.services" :key="`service-${index}`" class="item-card">
                  <div class="item-content">
                    <div class="item-title">{{ service.name }}</div>
                    <v-text-field
                      v-model="service.price"
                      type="number"
                      variant="underlined"
                      density="compact"
                      suffix="₽"
                      hide-details
                      class="price-input"
                    ></v-text-field>
                    <div class="tags-container">
                      <v-chip
                        v-for="tag in getServiceTags(service.id, service.tagIds)"
                        :key="tag.id"
                        :color="tag.color"
                        size="small"
                        class="mr-1"
                      >
                        {{ tag.name }}
                      </v-chip>
                    </div>
                  </div>
                  <v-btn icon="mdi-close" variant="text" size="small" @click="removeService(index)"></v-btn>
                </div>
              </div>

              <div v-else class="text-caption text-medium-emphasis">
                {{ settingsStore.isFieldRequired('services') ? 'Услуги обязательны для выбора' : 'Услуги не выбраны' }}
              </div>
            </v-col>
            
            <!-- Секция Деталей -->
            <v-col cols="12">
              <div class="d-flex justify-space-between align-center mb-2">
                <div class="text-overline">{{ settingsStore.appSettings.detailsTabLabel }} {{ settingsStore.isFieldRequired('details') ? '*' : '' }}</div>
                <v-btn
                  color="primary"
                  variant="outlined"
                  @click="isDetailModalOpen = true"
                >
                  <v-icon start>mdi-plus</v-icon>
                  Выбрать детали
                </v-btn>
              </div>

              <div v-if="form.details.length > 0" class="item-list">
                <div v-for="(detail, index) in form.details" :key="`detail-${index}`" class="item-card">
                  <div class="item-content">
                    <div class="item-title">{{ detail.name }}</div>
                    <v-text-field
                      v-model="detail.price"
                      type="number"
                      variant="underlined"
                      density="compact"
                      suffix="₽"
                      hide-details
                      class="price-input"
                    ></v-text-field>
                     <div class="tags-container">
                      <v-chip
                        v-for="tag in getDetailTags(detail.id, detail.tagIds)"
                        :key="tag.id"
                        :color="tag.color"
                        size="small"
                        class="mr-1"
                      >
                        {{ tag.name }}
                      </v-chip>
                    </div>
                  </div>
                  <v-btn icon="mdi-close" variant="text" size="small" @click="removeDetail(index)"></v-btn>
                </div>
              </div>

              <div v-else class="text-caption text-medium-emphasis">
                {{ settingsStore.isFieldRequired('details') ? 'Детали обязательны для выбора' : 'Детали не выбраны' }}
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
  <DetailSelectionModal
    v-model="isDetailModalOpen"
    :previously-selected="form.details"
    @selection-confirmed="handleDetailsSelected"
  />
</template>

<script setup>
import { reactive, computed, watch, ref } from 'vue';
import { useOrderStore } from '@/stores/orderStore.js';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback.js';
import { useDetailStore } from '@/stores/detailStore';
import ServiceSelectionModal from './ServiceSelectionModal.vue';
import DetailSelectionModal from './DetailSelectionModal.vue';

const props = defineProps({
  orderId: { type: [String, null], default: null },
  initialData: { type: Object, default: () => ({}) }
});
const emit = defineEmits(['close', 'saved']);

const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const tagsStore = useTagsStore();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const { triggerHapticFeedback } = useHapticFeedback();

const isSaving = ref(false);
const isServiceModalOpen = ref(false);
const isDetailModalOpen = ref(false);
const quickService = ref(null);

const form = reactive({
  clientId: null,
  clientName: '',
  lastName: '',
  phone: '',
  services: [],
  details: [],
  deadline: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
  notes: ''
});

const rules = {
  required: value => !!value || 'Обязательное поле',
};

const normalizePhoneDigits = (value) => {
  const digits = (value || '').replace(/\D/g, '');
  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    return digits.substring(1);
  }
  return digits.slice(0, 10);
};

const isEditing = computed(() => props.orderId !== null);
const totalAmount = computed(() => {
  const servicesTotal = form.services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const detailsTotal = form.details.reduce((sum, d) => sum + Number(d.price || 0), 0);
  return servicesTotal + detailsTotal;
});

const isFormValid = computed(() => {
  const { requiredFields } = settingsStore;
  if (form.clientId && !resolvedClient.value) return false;
  const clientNameValue = resolvedClient.value?.name || form.clientName;
  const clientPhoneValue = resolvedClient.value?.phone || form.phone;
  if (requiredFields.clientName && !clientNameValue.trim()) return false;
  if (requiredFields.lastName && !form.lastName.trim()) return false;
  if (requiredFields.phone && !clientPhoneValue.trim()) return false;
  if (requiredFields.services && form.services.length === 0) return false;
  if (requiredFields.details && form.details.length === 0) return false;
  if (requiredFields.deadline && !form.deadline) return false;
  if (requiredFields.notes && !form.notes.trim()) return false;
  return true;
});

const resolvedClient = computed(() => {
  if (!form.clientId) return null;
  return clientsStore.getClientById(form.clientId) || null;
});

const isClientMissing = computed(() => form.clientId && !resolvedClient.value);

const clientNameInput = computed({
  get: () => resolvedClient.value?.name || form.clientName,
  set: (value) => {
    if (!resolvedClient.value) form.clientName = value;
  }
});

const clientPhoneInput = computed({
  get: () => {
    if (resolvedClient.value) {
      return normalizePhoneDigits(resolvedClient.value.phone || '');
    }
    return form.phone;
  },
  set: (value) => {
    if (!resolvedClient.value) form.phone = value;
  }
});

const getTags = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.getTagById(id)).filter(Boolean);
};

const getServiceTags = (serviceId, fallbackTagIds) => {
  const liveService = serviceStore.getServiceById(serviceId);
  const tagIds = liveService ? liveService.tagIds : fallbackTagIds || [];
  return getTags(tagIds);
};

const getDetailTags = (detailId, fallbackTagIds) => {
  const liveDetail = detailStore.getDetailById(detailId);
  const tagIds = liveDetail ? liveDetail.tagIds : fallbackTagIds || [];
  return getTags(tagIds);
};

const resetForm = () => {
  Object.assign(form, { 
    clientId: null,
    clientName: '', 
    lastName: '',
    phone: '', 
    services: [], 
    details: [],
    deadline: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    notes: '' 
  });
};

watch(() => form.phone, (newVal, oldVal) => {
  const digits = newVal.replace(/\D/g, '');
  if (digits.length > 10) {
    form.phone = oldVal;
    return;
  }

  let formatted = '';
  if (digits.length > 0) {
    formatted = '(' + digits.substring(0, 3);
  }
  if (digits.length > 3) {
    formatted += ') ' + digits.substring(3, 6);
  }
  if (digits.length > 6) {
    formatted += '-' + digits.substring(6, 8);
  }
  if (digits.length > 8) {
    formatted += '-' + digits.substring(8, 10);
  }

  if (newVal !== formatted) {
    form.phone = formatted;
  }
});

watch([() => props.orderId, () => props.initialData], ([newId, newInitialData]) => {
  if (newId) {
    const order = orderStore.getOrderById(newId);
    if (order) {
      // Если телефон уже с кодом страны, убираем его для отображения в поле с префиксом +7
      let phone = order.phone || '';
      const digits = phone.replace(/\D/g, '');

      // Если 11 цифр и начинается с 7 или 8 - убираем первую цифру
      if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
        phone = digits.substring(1);
      } else if (digits.length === 10) {
        phone = digits;
      }
      // Форматирование применится автоматически через watcher

      Object.assign(form, {
        clientId: order.clientId || null,
        clientName: order.clientName,
        lastName: order.lastName,
        phone: phone,
        services: JSON.parse(JSON.stringify(order.services || [])),
        details: JSON.parse(JSON.stringify(order.details || [])),
        deadline: order.deadline,
        notes: order.notes,
      });
    }
  } else {
    resetForm();
    if (newInitialData && Object.keys(newInitialData).length > 0) {
      if (newInitialData.deadline) {
        form.deadline = newInitialData.deadline;
      }
      if (newInitialData.clientId) {
        form.clientId = newInitialData.clientId;
      }
      if (newInitialData.clientName) {
        form.clientName = newInitialData.clientName;
      }
      if (newInitialData.lastName) {
        form.lastName = newInitialData.lastName;
      }
      if (newInitialData.phone) {
        form.phone = normalizePhoneDigits(newInitialData.phone);
      }
    }
  }
}, { immediate: true, deep: true });

const saveOrder = async () => {
  if (!isFormValid.value) return;
  if (form.clientId && !resolvedClient.value) return;
  
  isSaving.value = true;

  const clientFromStore = resolvedClient.value;
  const normalizePhone = (value) => {
    const digits = normalizePhoneDigits(value);
    return digits ? `+7 ${digits}` : '';
  };
  const fullPhone = clientFromStore?.phone
    ? normalizePhone(clientFromStore.phone)
    : normalizePhone(form.phone);
  
  const orderData = {
    clientId: form.clientId,
    clientName: clientFromStore?.name || form.clientName,
    lastName: form.lastName,
    phone: fullPhone,
    services: form.services,
    details: form.details,
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
    triggerHapticFeedback('important');
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

const handleQuickServiceSelect = (service) => {
  if (!service) return;
  form.services.push({
    id: service.id,
    name: service.name,
    price: Number(service.price ?? 0),
    status: settingsStore.appSettings.defaultOrderStatus || 'accepted',
    icon: service.icon || '',
    tagIds: service.tagIds || []
  });
  quickService.value = null;
};

const handleServicesSelected = (selectedServices) => {
  form.services = selectedServices;
  isServiceModalOpen.value = false;
};

const removeDetail = (index) => {
  form.details.splice(index, 1);
};

const handleDetailsSelected = (selectedDetails) => {
  form.details = selectedDetails;
  isDetailModalOpen.value = false;
};

if (tagsStore.tags.length === 0) {
  tagsStore.loadTags();
}
if (detailStore.details.length === 0) {
  detailStore.loadDetails();
}
</script>

<style scoped>
.item-list {
  border: 1px solid rgba(var(--v-border-color), 0.2);
  border-radius: 4px;
  padding: 8px;
}

.item-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid rgba(var(--v-border-color), 0.1);
}

.item-card:last-child {
  border-bottom: none;
}

.item-content {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-width: 0;
}

.price-input {
  max-width: 120px;
  margin-top: 4px;
}

.item-title {
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
</style>
