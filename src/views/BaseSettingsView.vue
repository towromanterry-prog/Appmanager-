<template>
  <div class="base-settings-view">
    <div class="settings-container">
      <v-card flat class="mb-0">
        <div class="custom-tabs-container bg-surface">
          <div class="custom-tabs-wrapper">
            <div
              :class="['custom-tab', { active: tab === 'services' }]"
              @click="tab = 'services'"
            >
              Услуги
            </div>
            <div
              :class="['custom-tab', { active: tab === 'details' }]"
              @click="tab = 'details'"
            >
              {{ settingsStore.appSettings.detailsTabLabel }}
            </div>
            <div
              :class="['custom-tab', { active: tab === 'tags' }]"
              @click="tab = 'tags'"
            >
              Теги
            </div>
          </div>
          <div
            class="custom-slider"
            :style="{ transform: sliderTransform, width: '33.33%' }"
          ></div>
        </div>
      </v-card>

      <v-window v-model="tab" class="window-full-height">
        <!-- УСЛУГИ -->
        <v-window-item value="services" class="window-item-full-height">
          <v-card flat class="mt-2" bg-color="surface">
            <div class="d-flex align-center justify-space-between pa-2 bg-surface">
              <h3 class="text-h6">Услуги</h3>
              <v-btn color="primary" @click="openServiceDialog">
                <v-icon class="mr-2">mdi-plus</v-icon>
                 Добавить услугу
              </v-btn>
            </div>
            <v-divider class="my-0"></v-divider>

            <v-list lines="two" bg-color="surface" class="py-0">
              <template v-for="(service, index) in serviceStore.services" :key="service.id">
                <v-list-item class="px-2 py-1 my-1" density="compact">
                  <v-list-item-title class="font-weight-medium">{{ service.name }}</v-list-item-title>
                  <v-list-item-subtitle class="mb-2">{{ service.defaultPrice }}₽</v-list-item-subtitle>

                  <div class="tags-container mb-1">
                    <v-chip
                      v-for="tag in getTagsForService(service.tags)"
                      :key="tag.id"
                      :color="tag.color"
                      size="small"
                      class="mr-1"
                    >
                      {{ tag.name }}
                    </v-chip>
                  </div>

                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="editService(service)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteService(service.id)"></v-btn>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="index < serviceStore.services.length - 1" class="mx-2"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-window-item>

        <!-- ДЕТАЛИ -->
        <v-window-item value="details" class="window-item-full-height">
          <v-card flat class="mt-2" bg-color="surface">
            <div class="d-flex align-center justify-space-between pa-2 bg-surface">
              <h3 class="text-h6">Детали</h3>
              <v-btn color="primary" @click="openDetailDialog">
                <v-icon class="mr-2">mdi-plus</v-icon>
                 Добавить деталь
              </v-btn>
            </div>
            <v-divider class="my-0"></v-divider>

            <v-list lines="two" bg-color="surface" class="py-0">
              <template v-for="(detail, index) in detailStore.details" :key="detail.id">
                <v-list-item class="px-2 py-1 my-1" density="compact">
                  <v-list-item-title class="font-weight-medium">{{ detail.name }}</v-list-item-title>
                  <v-list-item-subtitle class="mb-2">{{ detail.defaultPrice }}₽</v-list-item-subtitle>

                  <div class="tags-container mb-1">
                    <v-chip
                      v-for="tag in getTagsForDetail(detail.tags)"
                      :key="tag.id"
                      :color="tag.color"
                      size="small"
                      class="mr-1"
                    >
                      {{ tag.name }}
                    </v-chip>
                  </div>

                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="editDetail(detail)"></v-btn>
                      <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteDetail(detail.id)"></v-btn>
                    </div>
                  </template>
                </v-list-item>
                <v-divider v-if="index < detailStore.details.length - 1" class="mx-2"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-window-item>

        <!-- ТЕГИ -->
        <v-window-item value="tags" class="window-item-full-height">
          <v-card flat class="mt-2" bg-color="surface">
            <div class="d-flex align-center justify-space-between pa-2 bg-surface">
              <h3 class="text-h6">Теги</h3>
              <v-btn color="primary" @click="openTagDialog">
                <v-icon class="mr-2">mdi-plus</v-icon>
                Добавить тег
              </v-btn>
            </div>
            <v-divider class="my-0"></v-divider>

            <v-list bg-color="surface" class="py-0">
              <template v-for="(tag, index) in tagsStore.tags" :key="tag.id">
                <v-list-item class="px-2 py-1 my-1" density="compact">
                  <template v-slot:prepend>
                    <v-chip
                      :color="tag.color"
                      size="small"
                    >
                      {{ tag.name }}
                     </v-chip>
                  </template>
                  <template v-slot:append>
                    <div class="d-flex align-center">
                        <v-btn icon="mdi-pencil" variant="text" size="small" @click="editTag(tag)"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteTag(tag.id)"></v-btn>
                    </div>
                  </template>
                </v-list-item>
                 <v-divider v-if="index < tagsStore.tags.length - 1" class="mx-2"></v-divider>
              </template>
            </v-list>
          </v-card>
        </v-window-item>

      </v-window>
    </div>

    <!-- ДИАЛОГ УСЛУГИ -->
    <ServiceFormDialog
      v-model="serviceDialog"
      :service="editingService"
      @saved="serviceStore.loadServices()"
    />

    <!-- ДИАЛОГ ДЕТАЛИ -->
    <v-dialog v-model="detailDialog" max-width="500">
      <v-card>
        <v-card-title>{{ editingDetail ? 'Редактировать деталь' : 'Добавить деталь' }}</v-card-title>
        <v-card-text>
          <v-form ref="detailFormRef">
            <v-text-field v-model="detailForm.name" label="Название детали" :rules="[v => !!v || 'Название обязательно']" variant="outlined" class="mb-4"></v-text-field>
            <v-text-field v-model.number="detailForm.defaultPrice" label="Цена по умолчанию" type="number" prefix="₽" :rules="[v => v > 0 || 'Цена должна быть больше 0']" variant="outlined" class="mb-4"></v-text-field>
            <v-select 
              v-model="detailForm.tags" 
              :items="availableTags" 
              item-title="name" 
              item-value="id" 
              label="Теги" 
              multiple 
              chips 
              variant="outlined"
              :menu-props="{ contentClass: 'custom-select-menu' }"
            >
              <template v-slot:selection="{ item }">
                <v-chip :color="item.raw.color" size="small">{{ item.title }}</v-chip>
              </template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" :title="null" class="my-1">
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
           <v-btn @click="detailDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveDetail">{{ editingDetail ? 'Сохранить' : 'Добавить' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ДИАЛОГ ТЕГА -->
    <v-dialog v-model="tagDialog" max-width="400">
      <v-card>
        <v-card-title>{{ editingTag ? 'Редактировать тег' : 'Добавить тег' }}</v-card-title>
        <v-card-text>
          <v-form ref="tagFormRef">
            <v-text-field v-model="tagForm.name" label="Название тега" :rules="[v => !!v || 'Название обязательно']" variant="outlined" class="mb-4"></v-text-field>
            <v-select 
              v-model="tagForm.color" 
              :items="tagColors" 
              label="Цвет тега" 
              variant="outlined"
              :menu-props="{ contentClass: 'custom-select-menu' }"
            >
              <template v-slot:selection="{ item }"><v-chip :color="item.value" size="small">{{ item.title }}</v-chip></template>
              <template v-slot:item="{ props, item }">
                <v-list-item v-bind="props" class="my-1">
                  <template v-slot:prepend><v-chip :color="item.value" size="small">{{ item.title }}</v-chip></template>
                </v-list-item>
              </template>
            </v-select>
          </v-form>
         </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="tagDialog = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveTag">{{ editingTag ? 'Сохранить' : 'Добавить' }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import ServiceFormDialog from '@/components/ServiceFormDialog.vue';

const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const tagsStore = useTagsStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();

const tab = ref('services');
const serviceDialog = ref(false);
const detailDialog = ref(false);
const tagDialog = ref(false);
const detailFormRef = ref(null);
const tagFormRef = ref(null);
const detailForm = ref({ name: '', defaultPrice: 0, tags: [] });
const tagForm = ref({ name: '', color: 'blue' });

const editingService = ref(null);
const editingDetail = ref(null);
const editingTag = ref(null);

const tagColors = [
  { title: 'Синий', value: 'blue' }, { title: 'Зеленый', value: 'green' }, { title: 'Красный', value: 'red' },
  { title: 'Оранжевый', value: 'orange' }, { title: 'Фиолетовый', value: 'purple' }, { title: 'Розовый', value: 'pink' },
  { title: 'Серый', value: 'grey' }
];
const availableTags = computed(() => tagsStore.tags);

const sliderTransform = computed(() => {
  if (tab.value === 'details') return 'translateX(100%)';
  if (tab.value === 'tags') return 'translateX(200%)';
  return 'translateX(0)';
});

const getTagsForService = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.tags.find(t => t.id === id)).filter(Boolean);
};

const getTagsForDetail = (tagIds) => {
  if (!tagIds) return [];
  return tagIds.map(id => tagsStore.tags.find(t => t.id === id)).filter(Boolean);
};

// ФУНКЦИИ УСЛУГ
const openServiceDialog = () => {
  editingService.value = null;
  serviceDialog.value = true;
};

const editService = (service) => {
  editingService.value = service;
  serviceDialog.value = true;
};

const deleteService = async (serviceId) => {
  const confirmed = await confirmationStore.open('Удаление услуги', 'Вы уверены, что хотите удалить эту услугу?');
  if (confirmed) {
    serviceStore.deleteService(serviceId);
  }
};

// ФУНКЦИИ ДЕТАЛЕЙ
const openDetailDialog = () => {
  editingDetail.value = null;
  detailForm.value = { name: '', defaultPrice: 0, tags: [] };
  detailDialog.value = true;
};

const editDetail = (detail) => {
  editingDetail.value = detail;
  detailForm.value = { name: detail.name, defaultPrice: detail.defaultPrice, tags: [...detail.tags] };
  detailDialog.value = true;
};

const saveDetail = async () => {
  const { valid } = await detailFormRef.value.validate();
  if (!valid) return;
  if (editingDetail.value) {
    detailStore.updateDetail(editingDetail.value.id, detailForm.value);
  } else {
    detailStore.addDetail(detailForm.value);
  }
  detailDialog.value = false;
};

const deleteDetail = async (detailId) => {
  const confirmed = await confirmationStore.open('Удаление детали', 'Вы уверены, что хотите удалить эту деталь?');
  if (confirmed) {
    detailStore.deleteDetail(detailId);
  }
};

// ФУНКЦИИ ТЕГОВ
const openTagDialog = () => {
  editingTag.value = null;
  tagForm.value = { name: '', color: 'blue' };
  tagDialog.value = true;
};

const editTag = (tag) => {
  editingTag.value = tag;
  tagForm.value = { name: tag.name, color: tag.color };
  tagDialog.value = true;
};

const saveTag = async () => {
  const { valid } = await tagFormRef.value.validate();
  if (!valid) return;
  if (editingTag.value) {
    tagsStore.updateTag(editingTag.value.id, tagForm.value);
  } else {
    tagsStore.addTag(tagForm.value);
  }
  tagDialog.value = false;
};

const deleteTag = async (tagId) => {
  const confirmed = await confirmationStore.open('Удаление тега', 'Вы уверены, что хотите удалить этот тег?');
  if (confirmed) {
    tagsStore.deleteTag(tagId);
  }
};

onMounted(() => {
  serviceStore.loadServices();
  detailStore.loadDetails();
  tagsStore.loadTags();
});
</script>

<style scoped>
.base-settings-view {
  height: calc(100vh - 68px);
  display: flex;
  flex-direction: column;
}

.settings-container {
  flex-grow: 1;
  min-height: 0;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  margin: 8px;
  padding: 8px;
  background-color: rgb(var(--v-theme-secondary));
  border-radius: 16px;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}

.settings-container::-webkit-scrollbar {
  display: none;
}

.settings-container .v-card {
  background-color: transparent !important;
  box-shadow: none !important;
}

.window-full-height {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.window-item-full-height {
  height: 100%;
  min-height: 0;
}

.custom-tabs-container {
  position: relative;
}

.custom-tabs-wrapper {
  display: flex;
}

.custom-tab {
  flex: 1;
  padding: 16px 24px;
  text-align: center;
  cursor: pointer;
  font-weight: 500;
  transition: color 0.3s;
  background: transparent;
  border: none;
  font-size: 0.875rem;
}

.custom-tab:hover {
  background-color: rgba(0, 0, 0, 0.04);
}

.custom-tab.active {
  color: var(--v-theme-primary);
}

.custom-slider {
  position: absolute;
  bottom: -2px;
  left: 0;
  height: 2px;
  background-color: var(--v-theme-primary);
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.tags-container {
  padding-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.custom-select-menu .v-list {
  padding: 4px 0 !important;
}

.custom-select-menu .v-list-item {
  margin: 4px 8px !important;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .custom-tab {
    padding: 12px 16px;
    font-size: 0.8rem;
  }
}
</style>