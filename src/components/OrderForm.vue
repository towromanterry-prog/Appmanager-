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
                prefix="+"
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

              <div v-if="form.services.length > 0" class="item-list">
                <div v-for="(service, index) in servicesWithLiveTags" :key="`service-${index}`" class="item-card">
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
                        v-for="tag in getTags(service.tagIds)"
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
                <div v-for="(detail, index) in detailsWithLiveTags" :key="`detail-${index}`" class="item-card">
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
                        v-for="tag in getTags(detail.tagIds)"
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
import { useRoute } from 'vue-router';
import { useOrderStore } from '@/stores/orderStore.js';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import ServiceSelectionModal from './ServiceSelectionModal.vue';
import DetailSelectionModal from './DetailSelectionModal.vue';

const props = defineProps({
  orderId: { type: [String, null], default: null }
});
const emit = defineEmits(['close']);

const orderStore = useOrderStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const tagsStore = useTagsStore();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();

const isSaving = ref(false);
const isServiceModalOpen = ref(false);
const isDetailModalOpen = ref(false);

const form = reactive({
  clientName: '',
  lastName: '',
  phone: '',
  services: [],
  details: [],
  deadline: new Date().toISOString().split('T')[0],
  notes: ''
});

const rules = {
  required: value => !!value || 'Обязательное поле',
};

const isEditing = computed(() => props.orderId !== null);
const totalAmount = computed(() => {
  const servicesTotal = form.services.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const detailsTotal = form.details.reduce((sum, d) => sum + Number(d.price || 0), 0);
  return servicesTotal + detailsTotal;
});

const isFormValid = computed(() => {
  const { requiredFields } = settingsStore;
  if (requiredFields.clientName && !form.clientName.trim()) return false;
  if (requiredFields.lastName && !form.lastName.trim()) return false;
  if (requiredFields.phone && !form.phone.trim()) return false;
  if (requiredFields.services && form.services.length === 0) return false;
  if (requiredFields.details && form.details.length === 0) return false;
  if (requiredFields.deadline && !form.deadline) return false;
  if (requiredFields.notes && !form.notes.trim()) return false;
  return true;
});

const servicesWithLiveTags = computed(() => {
  return form.services.map(service => {
    const liveService = serviceStore.getServiceById(service.id);
    return {
      ...service,
      tagIds: liveService ? liveService.tagIds : service.tagIds || []
    };
  });
});

const detailsWithLiveTags = computed(() => {
  return form.details.map(detail => {
    const liveDetail = detailStore.getDetailById(detail.id);
    return {
      ...detail,
      tagIds: liveDetail ? liveDetail.tagIds : detail.tagIds || []
    };
  });
});

const getTags = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.getTagById(id)).filter(Boolean);
};

const resetForm = () => {
  Object.assign(form, { 
    clientName: '', 
    lastName: '',
    phone: '', 
    services: [], 
    details: [],
    deadline: new Date().toISOString().split('T')[0], 
    notes: '' 
  });
};

watch(() => form.phone, (newVal, oldVal) => {
  const digits = newVal.replace(/\D/g, '');
  if (digits.length > 11) {
    form.phone = oldVal;
    return;
  }

  let formatted = '';
  if (digits.length > 0) {
    formatted = digits.substring(0, 1);
  }
  if (digits.length > 1) {
    formatted += ' (' + digits.substring(1, 4);
  }
  if (digits.length > 4) {
    formatted += ') ' + digits.substring(4, 7);
  }
  if (digits.length > 7) {
    formatted += '-' + digits.substring(7, 9);
  }
  if (digits.length > 9) {
    formatted += '-' + digits.substring(9, 11);
  }

  if (newVal !== formatted) {
    form.phone = formatted;
  }
});

watch(() => props.orderId, (newId) => {
  if (newId) {
    const order = orderStore.getOrderById(newId);
    if (order) {
      Object.assign(form, {
        clientName: order.clientName,
        lastName: order.lastName,
        phone: order.phone,
        services: JSON.parse(JSON.stringify(order.services || [])),
        details: JSON.parse(JSON.stringify(order.details || [])),
        deadline: order.deadline,
        notes: order.notes,
      });
    }
  } else {
    resetForm();
    const route = useRoute();
    if (route.query.clientName || route.query.clientPhone) {
        form.clientName = route.query.clientName;
        form.lastName = route.query.clientLastName;
        form.phone = route.query.clientPhone;
    }
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
    clientsStore.addOrUpdateClient({
      name: form.clientName,
      lastName: form.lastName,
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
if (serviceStore.services.length === 0) {
  serviceStore.loadServices();
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