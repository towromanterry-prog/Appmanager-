<template>
  <v-container class="settings-container pa-0"> <v-card flat class="mb-4 rounded-0">
      <v-card-title class="d-flex align-center px-4 pt-4 pb-2">
        <h1 class="text-h5 font-weight-bold">Настройки</h1>
      </v-card-title>
      
      <v-card-text class="px-4 pb-4">
        <v-card variant="tonal" color="primary" class="mb-0">
          <v-card-text class="d-flex align-center justify-space-between py-3">
            <div v-if="serviceStore.user">
              <div class="text-caption text-medium-emphasis">Аккаунт</div>
              <div class="text-body-2 font-weight-bold">{{ serviceStore.user.displayName || serviceStore.user.email }}</div>
            </div>
            <div v-else>
              <div class="text-body-2 font-weight-medium">Синхронизация</div>
              <div class="text-caption text-medium-emphasis">Войдите для сохранения данных</div>
            </div>

            <v-btn 
              v-if="!serviceStore.user" 
              color="primary" 
              variant="elevated"
              size="small"
              prepend-icon="mdi-google"
              @click="login"
            >
              Войти
            </v-btn>
            <v-btn 
              v-else 
              variant="text" 
              color="error" 
              size="small"
              icon="mdi-logout"
              @click="logout"
            ></v-btn>
          </v-card-text>
        </v-card>
      </v-card-text>
    </v-card>

    <div class="px-4 mb-6">
      <v-card 
        class="py-2" 
        variant="outlined" 
        @click="router.push('/base-settings')" 
        ripple
      >
        <v-list-item>
          <template v-slot:prepend>
            <v-avatar color="primary" variant="tonal" rounded>
              <v-icon>mdi-book-open-page-variant</v-icon>
            </v-avatar>
          </template>
          <v-list-item-title class="font-weight-medium">Справочники</v-list-item-title>
          <v-list-item-subtitle>Услуги, Детали и Теги</v-list-item-subtitle>
          <template v-slot:append>
            <v-icon color="medium-emphasis">mdi-chevron-right</v-icon>
          </template>
        </v-list-item>
      </v-card>
    </div>

    <div class="px-4">
      <p class="text-overline text-medium-emphasis mb-2">Параметры приложения</p>
      
      <v-expansion-panels variant="accordion" class="mb-16"> <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3 text-medium-emphasis">mdi-form-select</v-icon>
            Обязательные поля
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Отметьте поля, которые нельзя оставить пустыми при создании заказа.
            </p>
            <div class="d-flex flex-column gap-1">
              <v-checkbox v-model="settingsStore.requiredFields.clientName" label="Имя клиента" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-checkbox v-model="settingsStore.requiredFields.phone" label="Телефон" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-checkbox v-model="settingsStore.requiredFields.services" label="Услуги" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-checkbox v-model="settingsStore.requiredFields.deadline" label="Срок выполнения" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-checkbox v-model="settingsStore.requiredFields.notes" label="Заметки" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-checkbox v-model="settingsStore.requiredFields.details" :label="settingsStore.appSettings.detailsTabLabel" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              <v-divider class="my-2"></v-divider>
              <div class="d-flex align-center">
                <v-text-field
                  v-model="settingsStore.appSettings.orderFormLastNameLabel"
                  label="Название поля 'Фамилия'"
                  variant="outlined"
                  density="compact"
                  hide-details
                  class="flex-grow-1 mr-4"
                  @update:modelValue="updateAppSettings"
                ></v-text-field>
                <v-checkbox v-model="settingsStore.requiredFields.lastName" label="Обязательно" color="primary" hide-details density="compact" @change="updateRequiredFields"></v-checkbox>
              </div>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3 text-medium-emphasis">mdi-swap-horizontal-bold</v-icon>
            Статусы и Этапы
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-text-field
              v-model="settingsStore.appSettings.additionalStatusName"
              label="Название доп. статуса"
              variant="outlined"
              density="compact"
              class="mb-4"
              @update:modelValue="updateAppSettings"
            ></v-text-field>

            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">Активные статусы заказов</p>
            <div class="d-flex flex-wrap gap-2 mb-4">
               <v-chip
                 v-for="(label, key) in orderStatusLabels" :key="key"
                 filter
                 variant="outlined"
                 :model-value="settingsStore.appSettings.orderStatuses[key]"
                 @click="toggleOrderStatus(key)"
                 :disabled="key === 'accepted'"
                 color="primary"
                 label
               >
                 {{ label }}
               </v-chip>
            </div>

            <v-divider class="my-3"></v-divider>
            <p class="text-caption text-medium-emphasis font-weight-bold mb-2">Индикаторы в календаре</p>
            <div class="d-flex flex-wrap gap-2">
               <v-chip
                 v-for="status in activeOrderStatuses" :key="status.key"
                 filter
                 variant="outlined"
                 :model-value="settingsStore.appSettings.miniCalendarIndicatorStatuses.includes(status.key)"
                 @click="toggleCalendarIndicator(status.key)"
                 color="secondary"
                 size="small"
               >
                 {{ status.label }}
               </v-chip>
            </div>
            <div class="text-caption text-medium-emphasis mt-1">Выберите до 3-х статусов для отображения точками.</div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3 text-medium-emphasis">mdi-palette</v-icon>
            Оформление
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="d-flex gap-4">
              <v-card 
                variant="outlined" 
                class="flex-grow-1 text-center pa-4 cursor-pointer"
                :color="themeStore.theme === 'light' ? 'primary' : ''"
                @click="themeStore.setTheme('light')"
              >
                <v-icon size="32" class="mb-2">mdi-weather-sunny</v-icon>
                <div class="text-caption font-weight-bold">Светлая</div>
              </v-card>
              <v-card 
                variant="outlined" 
                class="flex-grow-1 text-center pa-4 cursor-pointer"
                :color="themeStore.theme === 'dark' ? 'primary' : ''"
                @click="themeStore.setTheme('dark')"
              >
                <v-icon size="32" class="mb-2">mdi-weather-night</v-icon>
                <div class="text-caption font-weight-bold">Темная</div>
              </v-card>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3 text-medium-emphasis">mdi-message-cog</v-icon>
            Шаблоны сообщений
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-btn block color="primary" variant="tonal" class="mb-3" @click="openTemplateDialog()">
              <v-icon start>mdi-plus</v-icon>
              Добавить шаблон
            </v-btn>
            <v-list density="compact" v-if="settingsStore.appSettings.messageTemplates.length">
              <v-list-item
                v-for="template in settingsStore.appSettings.messageTemplates"
                :key="template.id"
                class="px-0"
              >
                <v-list-item-title class="text-body-2 text-wrap">{{ template.text }}</v-list-item-title>
                <template v-slot:append>
                  <v-btn icon="mdi-pencil" variant="text" size="small" @click="openTemplateDialog(template)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteTemplate(template.id)"></v-btn>
                </template>
                <v-divider class="mt-2"></v-divider>
              </v-list-item>
            </v-list>
            <div v-else class="text-center text-caption text-medium-emphasis py-2">
              Нет сохраненных шаблонов
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3 text-medium-emphasis">mdi-account-cog</v-icon>
              Управление базой
            </v-expansion-panel-title>
            <v-expansion-panel-text>
               <div class="d-flex align-center justify-space-between mb-2">
                 <span class="text-body-2">Клиентов в базе:</span>
                 <span class="font-weight-bold">{{ clientsStore.clients.length }}</span>
               </div>
               <v-btn block variant="outlined" class="mb-3" @click="showClientsManager = true">
                 Список клиентов
               </v-btn>
               <v-btn block color="error" variant="text" @click="clearAllClients">
                 <v-icon start>mdi-delete-sweep</v-icon>
                 Очистить базу
               </v-btn>
            </v-expansion-panel-text>
         </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3 text-medium-emphasis">mdi-cog</v-icon>
            Дополнительно
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              v-model="settingsStore.appSettings.showCompletedOrders"
              label="Показывать выполненные заказы"
              color="primary"
              hide-details
              density="compact"
              class="mb-2"
              @change="updateAppSettings"
            ></v-switch>
            
            <v-switch
              v-model="settingsStore.appSettings.enableHapticFeedback"
              label="Вибрация при действиях"
              color="primary"
              hide-details
              density="compact"
              class="mb-2"
              @change="updateAppSettings"
            ></v-switch>

            <v-switch
              v-model="settingsStore.appSettings.enablePullToRefresh"
              label="Обновление потягиванием (Pull-to-refresh)"
              color="primary"
              hide-details
              density="compact"
              class="mb-4"
              @change="updateAppSettings"
            ></v-switch>
            
            <v-divider class="mb-4"></v-divider>
            
            <v-text-field
              v-model="settingsStore.appSettings.detailsTabLabel"
              label="Название вкладки 'Детали'"
              variant="outlined"
              density="compact"
              hide-details
              class="mb-4"
              @update:modelValue="updateAppSettings"
            ></v-text-field>

            <v-btn
              color="error"
              variant="tonal"
              block
              @click="resetAllSettings"
            >
              Сбросить все настройки
            </v-btn>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>

    <v-dialog v-model="showClientsManager" max-width="800">
      <v-card>
        <v-card-title>Управление клиентами</v-card-title>
        <v-card-text style="max-height: 60vh; overflow-y: auto;">
          <v-list>
            <v-list-item v-for="client in clientsStore.getRecentClients(50)" :key="client.id">
              <v-list-item-title>{{ client.name }} {{ client.lastName }}</v-list-item-title>
              <v-list-item-subtitle>{{ client.phone }}</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn icon="mdi-delete" variant="text" color="error" @click="deleteClient(client.phone)"></v-btn>
              </template>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showClientsManager = false">Закрыть</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="templateDialog.show" max-width="500">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ templateDialog.isEdit ? 'Редактировать' : 'Новый' }} шаблон</span>
        </v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2">Переменные: <b>%имя%</b>, <b>%цена%</b></div>
          <v-textarea
            v-model="templateDialog.text"
            label="Текст сообщения"
            rows="4"
            auto-grow
            variant="outlined"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="templateDialog.show = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveTemplate">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/stores/themeStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { useServiceStore } from '@/stores/serviceStore';

const router = useRouter();
const themeStore = useThemeStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const { appSettings } = storeToRefs(settingsStore);
const confirmationStore = useConfirmationStore();
const serviceStore = useServiceStore();

const showClientsManager = ref(false);
const templateDialog = ref({ show: false, isEdit: false, id: null, text: '' });

// Auth
const login = async () => {
  try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); }
};
const logout = async () => {
  try { await signOut(auth); } catch (e) { console.error(e); }
};

// Computed
const orderStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
  delivered: 'Сдан',
}));

const activeOrderStatuses = computed(() => {
  return Object.entries(orderStatusLabels.value)
    .filter(([key]) => appSettings.value.orderStatuses[key])
    .map(([key, label]) => ({ key, label }));
});

// Methods
const updateRequiredFields = () => settingsStore.updateRequiredFields(settingsStore.requiredFields);
const updateAppSettings = () => settingsStore.updateAppSettings(settingsStore.appSettings);

const toggleOrderStatus = (key) => {
  if (key === 'accepted') return;
  settingsStore.appSettings.orderStatuses[key] = !settingsStore.appSettings.orderStatuses[key];
  updateAppSettings();
};

const toggleCalendarIndicator = (key) => {
  const list = settingsStore.appSettings.miniCalendarIndicatorStatuses;
  if (list.includes(key)) {
    settingsStore.appSettings.miniCalendarIndicatorStatuses = list.filter(k => k !== key);
  } else {
    if (list.length < 3) {
      list.push(key);
    }
  }
  updateAppSettings();
};

const clearAllClients = async () => {
  if (await confirmationStore.open('Очистка', 'Удалить всех клиентов?')) {
    clientsStore.clients = []; // Локально, для БД нужен отдельный метод в сторе если есть
    // В текущем сторе нет метода clearAll в firebase, это демо
  }
};

const deleteClient = async (phone) => {
  const client = clientsStore.getClientByPhone(phone);
  if (await confirmationStore.open('Удаление', `Удалить ${client.name}?`)) {
    clientsStore.deleteClient(phone);
  }
};

const resetAllSettings = async () => {
  if (await confirmationStore.open('Сброс', 'Вернуть настройки по умолчанию?')) {
    settingsStore.resetSettings();
    themeStore.setTheme('light');
  }
};

const openTemplateDialog = (template = null) => {
  templateDialog.value = template 
    ? { show: true, isEdit: true, id: template.id, text: template.text }
    : { show: true, isEdit: false, id: null, text: '' };
};

const saveTemplate = () => {
  if (templateDialog.value.isEdit) settingsStore.updateMessageTemplate(templateDialog.value.id, templateDialog.value.text);
  else settingsStore.addMessageTemplate(templateDialog.value.text);
  templateDialog.value.show = false;
};

const deleteTemplate = async (id) => {
  if (await confirmationStore.open('Удаление', 'Удалить шаблон?')) {
    settingsStore.deleteMessageTemplate(id);
  }
};
</script>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 0 auto;
}
.gap-1 { gap: 4px; }
.gap-2 { gap: 8px; }
.gap-4 { gap: 16px; }
</style>
