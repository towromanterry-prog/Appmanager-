<template>
  <div class="base-settings-view fill-height d-flex flex-column">
    <v-tabs
      v-model="activeTab"
      bg-color="surface"
      color="primary"
      grow
      density="comfortable"
      class="border-b"
    >
      <v-tab value="services">Услуги</v-tab>
      <v-tab value="details">Детали</v-tab>
      <v-tab value="tags">Теги</v-tab>
    </v-tabs>

    <v-window v-model="activeTab" class="flex-grow-1 overflow-y-auto">
      
      <v-window-item value="services" class="fill-height">
        <div class="pa-4 pb-16">
          <div class="d-flex justify-end mb-2">
            <v-switch
              v-model="showArchivedServices"
              label="Показать архив"
              color="primary"
              hide-details
              density="compact"
            ></v-switch>
          </div>

          <div v-if="serviceStore.loading" class="text-center mt-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <v-list v-else bg-color="transparent" class="pa-0">
            <template v-for="service in displayedServices" :key="service.id">
              <v-card class="mb-3" flat border>
                <v-list-item lines="two" class="py-2">
                  <template v-slot:prepend>
                     <v-avatar color="primary-lighten-4" class="text-primary font-weight-bold">
                        {{ (service.title || '?')[0].toUpperCase() }}
                     </v-avatar>
                  </template>

                  <v-list-item-title class="font-weight-bold">
                    {{ service.title }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle class="mt-1">
                    <v-chip size="x-small" class="mr-2" label>{{ service.category || 'Без категории' }}</v-chip>
                    <span class="text-body-2 text-high-emphasis font-weight-medium">
                      {{ formatPrice(service.price) }}
                    </span>
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <v-menu location="bottom end">
                      <template v-slot:activator="{ props }">
                        <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                      </template>
                      <v-list>
                        <v-list-item @click="openServiceDialog(service)" prepend-icon="mdi-pencil">
                          Редактировать
                        </v-list-item>
                        <v-list-item 
                          v-if="!service.isArchived"
                          @click="toggleServiceArchive(service)" 
                          prepend-icon="mdi-archive-arrow-down"
                          color="warning"
                        >
                          В архив
                        </v-list-item>
                        <v-list-item 
                          v-else
                          @click="toggleServiceArchive(service)" 
                          prepend-icon="mdi-archive-arrow-up"
                          color="success"
                        >
                          Вернуть
                        </v-list-item>
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
              </v-card>
            </template>
            
            <div v-if="!displayedServices.length" class="text-center text-medium-emphasis mt-8">
              {{ showArchivedServices ? 'Архив пуст' : 'Список услуг пуст' }}
            </div>
          </v-list>
        </div>
      </v-window-item>

      <v-window-item value="details" class="fill-height">
        <div class="pa-4 pb-16">
          <div v-if="detailStore.loading" class="text-center mt-4">
            <v-progress-circular indeterminate color="primary"></v-progress-circular>
          </div>

          <v-list v-else bg-color="transparent" class="pa-0">
             <template v-for="(categoryDetails, category) in groupedDetails" :key="category">
                <v-list-subheader class="font-weight-bold text-uppercase text-primary mt-2">
                  {{ category || 'Общие' }}
                </v-list-subheader>
                
                <v-card 
                  v-for="detail in categoryDetails" 
                  :key="detail.id" 
                  class="mb-2" 
                  flat 
                  border
                >
                  <v-list-item density="comfortable">
                    <v-list-item-title class="font-weight-medium">{{ detail.title }}</v-list-item-title>
                    <v-list-item-subtitle>
                      Цена: {{ formatPrice(detail.price) }} | Себест: {{ formatPrice(detail.costPrice) }}
                    </v-list-item-subtitle>
                    
                    <template v-slot:append>
                       <v-btn 
                        icon="mdi-pencil" 
                        variant="text" 
                        size="small" 
                        color="medium-emphasis"
                        @click="openDetailDialog(detail)"
                      ></v-btn>
                       <v-btn 
                        icon="mdi-delete" 
                        variant="text" 
                        size="small" 
                        color="error"
                        @click="deleteDetail(detail)"
                      ></v-btn>
                    </template>
                  </v-list-item>
                </v-card>
             </template>

             <div v-if="!detailStore.details.length" class="text-center text-medium-emphasis mt-8">
                Список деталей пуст
             </div>
          </v-list>
        </div>
      </v-window-item>

      <v-window-item value="tags" class="fill-height">
        <div class="pa-4">
          <v-card class="pa-4" flat border>
            <div class="text-subtitle-1 font-weight-bold mb-3">Управление тегами</div>
            
            <div class="d-flex gap-2 mb-4">
              <v-text-field
                v-model="newTagTitle"
                label="Новый тег"
                placeholder="Например: Срочно"
                density="compact"
                hide-details
                variant="outlined"
                @keyup.enter="createTag"
              ></v-text-field>
              <v-btn 
                color="primary" 
                height="40" 
                @click="createTag"
                :disabled="!newTagTitle.trim()"
              >
                <v-icon>mdi-plus</v-icon>
              </v-btn>
            </div>

            <div class="d-flex flex-wrap gap-2">
               <v-chip
                v-for="tag in tagsStore.tags"
                :key="tag.id"
                closable
                label
                color="primary"
                variant="tonal"
                @click:close="deleteTag(tag)"
               >
                 {{ tag.title }}
               </v-chip>
               
               <div v-if="!tagsStore.tags.length" class="text-caption text-medium-emphasis w-100 mt-2">
                 Теги пока не добавлены
               </div>
            </div>
          </v-card>
        </div>
      </v-window-item>
    </v-window>

    <v-fab-transition>
      <v-btn
        v-if="activeTab !== 'tags'"
        position="fixed"
        location="bottom right"
        icon="mdi-plus"
        size="x-large"
        color="primary"
        elevation="4"
        class="mb-4 mr-4"
        style="bottom: 80px; z-index: 90;"
        @click="handleFabClick"
      ></v-btn>
    </v-fab-transition>

    <ServiceFormDialog 
      v-model="showServiceDialog" 
      :service="selectedService"
      @saved="onServiceSaved"
    />

    <v-dialog v-model="showDetailDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="px-4 pt-4">
          {{ selectedDetail ? 'Редактировать деталь' : 'Новая деталь' }}
        </v-card-title>
        <v-card-text class="px-4 py-2">
          <v-text-field
            v-model="detailForm.title"
            label="Название"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          ></v-text-field>
          
          <v-combobox
            v-model="detailForm.category"
            :items="detailStore.categories"
            label="Категория"
            variant="outlined"
            density="comfortable"
            class="mb-3"
          ></v-combobox>

          <div class="d-flex gap-3">
            <v-text-field
              v-model.number="detailForm.price"
              label="Цена"
              type="number"
              variant="outlined"
              density="comfortable"
              prefix="₽"
            ></v-text-field>
            <v-text-field
              v-model.number="detailForm.costPrice"
              label="Себест."
              type="number"
              variant="outlined"
              density="comfortable"
              prefix="₽"
            ></v-text-field>
          </div>
        </v-card-text>
        <v-card-actions class="px-4 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDetailDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" @click="saveDetail">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import ServiceFormDialog from '@/components/ServiceFormDialog.vue';

// Сторы
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const tagsStore = useTagsStore();
const confirmationStore = useConfirmationStore();
const route = useRoute();
const router = useRouter();

// Состояние UI
const activeTab = ref(route.params.tab || 'services');
const showArchivedServices = ref(false);

// Услуги
const showServiceDialog = ref(false);
const selectedService = ref(null);

// Детали
const showDetailDialog = ref(false);
const selectedDetail = ref(null);
const detailForm = reactive({
  title: '',
  category: '',
  price: 0,
  costPrice: 0
});

// Теги
const newTagTitle = ref('');

// === COMPUTED ===

// Фильтрация услуг (Активные/Архив)
const displayedServices = computed(() => {
  return showArchivedServices.value 
    ? serviceStore.archivedServices 
    : serviceStore.activeServices;
});

// Группировка деталей по категориям
const groupedDetails = computed(() => {
  const groups = {};
  detailStore.details.forEach(detail => {
    const cat = detail.category || 'Прочее';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(detail);
  });
  return groups;
});

// === METHODS ===

const formatPrice = (value) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(value || 0);
};

// --- Услуги ---
const openServiceDialog = (service = null) => {
  selectedService.value = service; // Если null, компонент поймет что это создание
  showServiceDialog.value = true;
};

const onServiceSaved = async () => {
  // Обновление списка происходит автоматически через подписку, 
  // просто закрываем диалог, если он не закрылся сам
  showServiceDialog.value = false;
};

const toggleServiceArchive = async (service) => {
  const action = service.isArchived ? 'восстановить' : 'архивировать';
  const confirmed = await confirmationStore.open(
    'Изменение статуса',
    `Вы уверены, что хотите ${action} услугу "${service.title}"?`
  );
  
  if (confirmed) {
    if (service.isArchived) {
      await serviceStore.unarchiveService(service.id);
    } else {
      await serviceStore.archiveService(service.id);
    }
  }
};

// --- Детали ---
const openDetailDialog = (detail = null) => {
  if (detail) {
    selectedDetail.value = detail;
    detailForm.title = detail.title;
    detailForm.category = detail.category;
    detailForm.price = detail.price;
    detailForm.costPrice = detail.costPrice;
  } else {
    selectedDetail.value = null;
    detailForm.title = '';
    detailForm.category = '';
    detailForm.price = 0;
    detailForm.costPrice = 0;
  }
  showDetailDialog.value = true;
};

const saveDetail = async () => {
  if (!detailForm.title) return;

  try {
    if (selectedDetail.value) {
      // Обновление
      await detailStore.updateDetail({
        id: selectedDetail.value.id,
        ...detailForm
      });
    } else {
      // Создание
      await detailStore.addDetail(detailForm);
    }
    showDetailDialog.value = false;
  } catch (e) {
    console.error('Ошибка сохранения детали:', e);
  }
};

const deleteDetail = async (detail) => {
  const confirmed = await confirmationStore.open(
    'Удаление детали',
    `Вы уверены, что хотите удалить деталь "${detail.title}"?`
  );
  if (confirmed) {
    await detailStore.deleteDetail(detail.id);
  }
};

// --- Теги ---
const createTag = async () => {
  const title = newTagTitle.value.trim();
  if (!title) return;
  
  await tagsStore.addTag(title);
  newTagTitle.value = '';
};

const deleteTag = async (tag) => {
  const confirmed = await confirmationStore.open(
    'Удаление тега', 
    `Удалить тег "${tag.title}"?`
  );
  if (confirmed) {
    await tagsStore.removeTag(tag.id);
  }
};

// --- Общее ---
const handleFabClick = () => {
  if (activeTab.value === 'services') {
    openServiceDialog();
  } else if (activeTab.value === 'details') {
    openDetailDialog();
  }
};

// Инициализация
onMounted(() => {
  serviceStore.initRealtimeUpdates();
  detailStore.initRealtimeUpdates();
  tagsStore.initRealtimeUpdates();
});
</script>

<style scoped>
.gap-2 { gap: 8px; }
.gap-3 { gap: 12px; }
</style>
