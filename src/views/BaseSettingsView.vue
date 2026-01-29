<template>
  <div class="base-settings-view d-flex flex-column">
    <div
      class="settings-container d-flex flex-column"
      @touchstart="handleTouchStart"
      @touchend="handleTouchEnd"
      @touchcancel="handleTouchCancel"
    >
      <v-card flat class="mb-0 flex-shrink-0">
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

      <v-window v-model="tab" class="flex-grow-1" style="min-height: 0;" :touch="false">
        <!-- УСЛУГИ -->
        <v-window-item value="services" class="window-item-full-height flex-grow-1">
          <div class="d-flex align-center justify-space-between pa-2 bg-surface" style="position: sticky; top: 0; z-index: 1; background-color: rgb(var(--v-theme-surface));">
            <h3 class="text-h6">Услуги</h3>
            <v-btn color="primary" @click="openServiceDialog">
              <v-icon class="mr-2">mdi-plus</v-icon>
               Добавить услугу
            </v-btn>
          </div>
          <v-divider class="my-0"></v-divider>

          <div class="list-wrapper">
            <v-card v-for="service in filteredServices" :key="service.id" class="item-card mb-2">
              <v-card-text class="pa-3">
                <div class="d-flex align-center">
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="font-weight-medium">{{ service.name }}</div>
                    <div class="text-caption text-on-surface-variant">{{ service.defaultPrice }}₽</div>
                    <div class="tags-container mt-2" v-if="service.tagIds && service.tagIds.length">
                      <v-chip
                        v-for="tag in getTagsForService(service.tagIds)"
                        :key="tag.id"
                        :color="tag.color"
                        size="x-small"
                        class="mr-1"
                      >
                        {{ tag.name }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="item-actions">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editService(service)"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteService(service.id)"></v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- ДЕТАЛИ -->
        <v-window-item value="details" class="window-item-full-height flex-grow-1">
          <div class="d-flex align-center justify-space-between pa-2 bg-surface" style="position: sticky; top: 0; z-index: 1; background-color: rgb(var(--v-theme-surface));">
            <h3 class="text-h6">Детали</h3>
            <v-btn color="primary" @click="openDetailDialog">
              <v-icon class="mr-2">mdi-plus</v-icon>
               Добавить деталь
            </v-btn>
          </div>
          <v-divider class="my-0"></v-divider>

          <div class="list-wrapper">
            <v-card v-for="detail in filteredDetails" :key="detail.id" class="item-card mb-2">
              <v-card-text class="pa-3">
                <div class="d-flex align-center">
                  <div class="flex-grow-1" style="min-width: 0;">
                    <div class="font-weight-medium">{{ detail.name }}</div>
                    <div class="text-caption text-on-surface-variant">{{ detail.defaultPrice }}₽</div>
                    <div class="tags-container mt-2" v-if="detail.tagIds && detail.tagIds.length">
                      <v-chip
                        v-for="tag in getTagsForDetail(detail.tagIds)"
                        :key="tag.id"
                        :color="tag.color"
                        size="x-small"
                        class="mr-1"
                      >
                        {{ tag.name }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="item-actions">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editDetail(detail)"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteDetail(detail.id)"></v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
        </v-window-item>

        <!-- ТЕГИ -->
        <v-window-item value="tags" class="window-item-full-height flex-grow-1">
          <div class="d-flex align-center justify-space-between pa-2 bg-surface" style="position: sticky; top: 0; z-index: 1; background-color: rgb(var(--v-theme-surface));">
            <h3 class="text-h6">Теги</h3>
            <v-btn color="primary" @click="openTagDialog">
              <v-icon class="mr-2">mdi-plus</v-icon>
              Добавить тег
            </v-btn>
          </div>
          <v-divider class="my-0"></v-divider>

          <div class="list-wrapper">
            <v-card v-for="tag in filteredTags" :key="tag.id" class="item-card mb-2">
              <v-card-text class="pa-3">
                <div class="d-flex align-center">
                  <div class="flex-grow-1">
                    <v-chip :color="tag.color" size="small">{{ tag.name }}</v-chip>
                  </div>
                  <div class="item-actions">
                    <v-btn icon="mdi-pencil" variant="text" size="small" @click="editTag(tag)"></v-btn>
                    <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteTag(tag.id)"></v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </div>
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
              v-model="detailForm.tagIds"
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
import Fuse from 'fuse.js';
import { storeToRefs } from 'pinia';
import { useServiceStore } from '@/stores/serviceStore';
import { useDetailStore } from '@/stores/detailStore';
import { useTagsStore } from '@/stores/tagsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSettingsViewStore } from '@/stores/settingsViewStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useSearchStore } from '@/stores/searchStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';
import ServiceFormDialog from '@/components/ServiceFormDialog.vue';

const { triggerHapticFeedback } = useHapticFeedback();
const serviceStore = useServiceStore();
const detailStore = useDetailStore();
const tagsStore = useTagsStore();
const settingsStore = useSettingsStore();
const settingsViewStore = useSettingsViewStore();
const confirmationStore = useConfirmationStore();
const searchStore = useSearchStore();
const { searchQuery } = storeToRefs(searchStore);
const { sortBy } = storeToRefs(settingsViewStore);

const tab = ref('services');
const serviceDialog = ref(false);
const detailDialog = ref(false);
const tagDialog = ref(false);
const detailFormRef = ref(null);
const tagFormRef = ref(null);
const detailForm = ref({ name: '', defaultPrice: 0, tagIds: [] });
const tagForm = ref({ name: '', color: 'blue' });

const editingService = ref(null);
const editingDetail = ref(null);
const editingTag = ref(null);

const touchstartX = ref(0);
const touchendX = ref(0);
const touchstartY = ref(0);
const touchendY = ref(0);
const isSwiping = ref(false);
const tabs = ['services', 'details', 'tags'];

const handleTouchStart = (e) => {
  // Игнорируем свайпы, начинающиеся на интерактивных элементах (кнопки, инпуты и т.д.)
  if (e.target.closest('.v-btn, .v-input, .v-select, .v-list-item-action')) {
    isSwiping.value = false;
    return;
  }

  isSwiping.value = true;
  touchstartX.value = e.changedTouches[0].screenX;
  touchstartY.value = e.changedTouches[0].screenY;
};

const handleTouchEnd = (e) => {
  if (!isSwiping.value) return;

  touchendX.value = e.changedTouches[0].screenX;
  touchendY.value = e.changedTouches[0].screenY;
  handleSwipe();
  isSwiping.value = false;
};

const handleTouchCancel = () => {
  isSwiping.value = false;
};

const handleSwipe = () => {
  const threshold = 50; // минимальное расстояние для свайпа
  const verticalThreshold = 100; // максимальное вертикальное отклонение

  const diffX = touchendX.value - touchstartX.value;
  const diffY = Math.abs(touchendY.value - touchstartY.value);

  // Если вертикальный скролл больше горизонтального или превышает порог, игнорируем свайп
  if (diffY > verticalThreshold || diffY > Math.abs(diffX)) return;

  const currentIndex = tabs.indexOf(tab.value);

  if (diffX < -threshold) {
    // свайп влево (следующая вкладка)
    if (currentIndex < tabs.length - 1) {
      tab.value = tabs[currentIndex + 1];
    } else {
      tab.value = tabs[0]; // Цикличный переход в начало
    }
  } else if (diffX > threshold) {
    // свайп вправо (предыдущая вкладка)
    if (currentIndex > 0) {
      tab.value = tabs[currentIndex - 1];
    } else {
      tab.value = tabs[tabs.length - 1]; // Цикличный переход в конец
    }
  }
};

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

const createFuse = (list, keys) => {
  return new Fuse(list, {
    keys,
    includeScore: true,
    threshold: 0.4,
    minMatchCharLength: 1,
  });
};

const filteredServices = computed(() => {
  let items = [...serviceStore.services];
  if (sortBy.value === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    items.sort((a, b) => b.id - a.id);
  }

  if (!searchQuery.value) {
    return items;
  }
  const fuse = createFuse(items, ['name']);
  return fuse.search(searchQuery.value).map(result => result.item);
});

const filteredDetails = computed(() => {
  let items = [...detailStore.details];
  if (sortBy.value === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    items.sort((a, b) => b.id - a.id);
  }

  if (!searchQuery.value) {
    return items;
  }
  const fuse = createFuse(items, ['name']);
  return fuse.search(searchQuery.value).map(result => result.item);
});

const filteredTags = computed(() => {
  let items = [...tagsStore.tags];
  if (sortBy.value === 'name') {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    items.sort((a, b) => b.id - a.id);
  }

  if (!searchQuery.value) {
    return items;
  }
  const fuse = createFuse(items, ['name']);
  return fuse.search(searchQuery.value).map(result => result.item);
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
    triggerHapticFeedback('important');
    serviceStore.deleteService(serviceId);
  }
};

// ФУНКЦИИ ДЕТАЛЕЙ
const openDetailDialog = () => {
  editingDetail.value = null;
  detailForm.value = { name: '', defaultPrice: 0, tagIds: [] };
  detailDialog.value = true;
};

const editDetail = (detail) => {
  editingDetail.value = detail;
  detailForm.value = { name: detail.name, defaultPrice: detail.defaultPrice, tagIds: [...detail.tagIds] };
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
  triggerHapticFeedback('important');
  detailDialog.value = false;
};

const deleteDetail = async (detailId) => {
  const confirmed = await confirmationStore.open('Удаление детали', 'Вы уверены, что хотите удалить эту деталь?');
  if (confirmed) {
    triggerHapticFeedback('important');
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
  triggerHapticFeedback('important');
  tagDialog.value = false;
};

const deleteTag = async (tagId) => {
  const confirmed = await confirmationStore.open('Удаление тега', 'Вы уверены, что хотите удалить этот тег?');
  if (confirmed) {
    triggerHapticFeedback('important');
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
.item-card {
  border-radius: 8px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: none !important;
  width: 100%;
  box-sizing: border-box;
}
.item-actions {
  display: flex;
  align-items: center;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.base-settings-view {
  height: calc(100vh - var(--app-topbar-height, 68px));
  display: flex;
  flex-direction: column;
}

.settings-container {
  flex-grow: 1;
  min-height: 0;
  margin: 8px 0;
  padding: 8px 0;
  background-color: rgb(var(--v-theme-secondary));
  border-radius: 0;
  overflow: hidden;
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05),
    0 0 0 1px rgba(0, 0, 0, 0.05);
}

:deep(.v-window__container) {
  height: 100%;
  min-height: 100%;
  flex: 1;
}

.list-wrapper {
  overflow-y: auto;
  flex-grow: 1;
  padding: 0;
}

.window-item-full-height {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.list-wrapper::-webkit-scrollbar {
  width: 4px;
}

.window-item-full-height::-webkit-scrollbar-thumb {
  background-color: rgba(0,0,0,0.2);
  border-radius: 2px;
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
