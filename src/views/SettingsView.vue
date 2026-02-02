<template>
  <div class="settings-view-wrapper bg-background">
    <v-container class="pa-4 settings-content">
      
      <h1 class="text-h4 font-weight-bold mb-6 px-1">Настройки</h1>

      <div class="d-flex align-center mb-6 px-1">
        <v-avatar color="primary" size="64" class="mr-4 text-h5">
           {{ userInitials }}
        </v-avatar>
        <div class="flex-grow-1">
          <div v-if="serviceStore.user">
             <div class="text-h6 font-weight-bold">{{ serviceStore.user.displayName || 'Пользователь' }}</div>
             <div class="text-caption text-medium-emphasis">{{ serviceStore.user.email }}</div>
          </div>
          <div v-else>
             <div class="text-h6 font-weight-bold">Гость</div>
             <div class="text-caption text-medium-emphasis">Синхронизация отключена</div>
          </div>
        </div>
        <v-btn v-if="serviceStore.user" icon="mdi-logout" variant="tonal" color="error" @click="logout"></v-btn>
        <v-btn v-else icon="mdi-login" variant="tonal" color="primary" @click="login"></v-btn>
      </div>

      <p class="text-caption text-medium-emphasis ml-4 mb-2 font-weight-bold text-uppercase">Управление</p>
      <v-card flat class="mb-6 rounded-xl overflow-hidden settings-group">
        <v-list lines="one" class="pa-0">
          <v-list-item @click="router.push('/base-settings')" link>
            <template v-slot:prepend>
              <div class="icon-box bg-blue-lighten-4 text-blue"><v-icon>mdi-book-open-page-variant</v-icon></div>
            </template>
            <v-list-item-title>Справочники</v-list-item-title>
            <v-list-item-subtitle>Услуги, детали, теги</v-list-item-subtitle>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
          <v-divider class="ml-14"></v-divider>
          <v-list-item @click="showClientsManager = true" link>
             <template v-slot:prepend>
              <div class="icon-box bg-purple-lighten-4 text-purple"><v-icon>mdi-account-group</v-icon></div>
            </template>
            <v-list-item-title>База клиентов</v-list-item-title>
             <v-list-item-subtitle>{{ clientsStore.clients.length }} записей</v-list-item-subtitle>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
        </v-list>
      </v-card>

      <p class="text-caption text-medium-emphasis ml-4 mb-2 font-weight-bold text-uppercase">Заказы</p>
      <v-card flat class="mb-6 rounded-xl overflow-hidden settings-group">
        <v-list lines="one" class="pa-0">
          <v-list-item @click="dialogs.requiredFields = true" link>
            <template v-slot:prepend>
              <div class="icon-box bg-orange-lighten-4 text-orange"><v-icon>mdi-form-select</v-icon></div>
            </template>
            <v-list-item-title>Обязательные поля</v-list-item-title>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
          <v-divider class="ml-14"></v-divider>
          <v-list-item @click="dialogs.statuses = true" link>
            <template v-slot:prepend>
              <div class="icon-box bg-green-lighten-4 text-green"><v-icon>mdi-swap-horizontal-bold</v-icon></div>
            </template>
            <v-list-item-title>Статусы и Синхронизация</v-list-item-title>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
          <v-divider class="ml-14"></v-divider>
          <v-list-item @click="dialogs.templates = true" link>
            <template v-slot:prepend>
              <div class="icon-box bg-teal-lighten-4 text-teal"><v-icon>mdi-message-text-outline</v-icon></div>
            </template>
            <v-list-item-title>Шаблоны сообщений</v-list-item-title>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
        </v-list>
      </v-card>

      <p class="text-caption text-medium-emphasis ml-4 mb-2 font-weight-bold text-uppercase">Интерфейс</p>
      <v-card flat class="mb-6 rounded-xl overflow-hidden settings-group">
        <v-list lines="one" class="pa-0">
           <v-list-item @click="dialogs.calendar = true" link>
            <template v-slot:prepend>
              <div class="icon-box bg-indigo-lighten-4 text-indigo"><v-icon>mdi-calendar-month</v-icon></div>
            </template>
            <v-list-item-title>Календарь</v-list-item-title>
            <v-list-item-subtitle>Настройка индикаторов</v-list-item-subtitle>
            <template v-slot:append><v-icon size="small" color="medium-emphasis">mdi-chevron-right</v-icon></template>
          </v-list-item>
          
          <v-divider class="ml-14"></v-divider>

          <v-list-item>
            <template v-slot:prepend>
               <div class="icon-box bg-grey-lighten-3 text-grey-darken-3"><v-icon>mdi-theme-light-dark</v-icon></div>
            </template>
            <v-list-item-title>Темная тема</v-list-item-title>
            <template v-slot:append>
               <v-switch :model-value="themeStore.theme === 'dark'" @update:model-value="toggleTheme" color="primary" hide-details density="compact" inset></v-switch>
            </template>
          </v-list-item>

           <v-divider class="ml-14"></v-divider>

           <v-list-item>
            <template v-slot:prepend>
               <div class="icon-box bg-yellow-lighten-4 text-orange-darken-4"><v-icon>mdi-eye-check-outline</v-icon></div>
            </template>
            <v-list-item-title>Показывать выполненные</v-list-item-title>
            <template v-slot:append>
               <v-switch v-model="settingsStore.appSettings.showCompletedOrders" @change="updateAppSettings" color="primary" hide-details density="compact" inset></v-switch>
            </template>
          </v-list-item>

          <v-divider class="ml-14"></v-divider>
          <v-list-item>
            <template v-slot:prepend>
               <div class="icon-box bg-red-lighten-4 text-red"><v-icon>mdi-vibrate</v-icon></div>
            </template>
            <v-list-item-title>Вибрация</v-list-item-title>
            <template v-slot:append>
               <v-switch v-model="settingsStore.appSettings.enableHapticFeedback" @change="updateAppSettings" color="primary" hide-details density="compact" inset></v-switch>
            </template>
          </v-list-item>

           <v-divider class="ml-14"></v-divider>
          <v-list-item>
            <template v-slot:prepend>
               <div class="icon-box bg-cyan-lighten-4 text-cyan"><v-icon>mdi-refresh</v-icon></div>
            </template>
            <v-list-item-title>Pull to Refresh</v-list-item-title>
            <template v-slot:append>
               <v-switch v-model="settingsStore.appSettings.enablePullToRefresh" @change="updateAppSettings" color="primary" hide-details density="compact" inset></v-switch>
            </template>
          </v-list-item>

        </v-list>
      </v-card>

       <v-btn block variant="text" color="error" class="mb-8" @click="resetAllSettings">
         Сбросить настройки
       </v-btn>
    </v-container>

    <v-dialog v-model="dialogs.statuses" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-background">
        <v-toolbar color="surface" density="compact">
          <v-btn icon="mdi-close" @click="dialogs.statuses = false"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">Статусы и Этапы</v-toolbar-title>
        </v-toolbar>
        
        <v-card-text class="pa-0">
          <v-tabs v-model="statusTab" grow color="primary" bg-color="surface">
            <v-tab value="active">Активность</v-tab>
            <v-tab value="sync">Синхронизация</v-tab>
          </v-tabs>

          <v-window v-model="statusTab" class="pa-4">
            <v-window-item value="active">
              <v-text-field
                v-model="settingsStore.appSettings.additionalStatusName"
                label="Название доп. статуса"
                variant="outlined"
                density="comfortable"
                hide-details
                class="mb-6"
                @update:modelValue="updateAppSettings"
              ></v-text-field>

              <div class="mb-6">
                <p class="text-caption font-weight-bold mb-2">ДЛЯ ЗАКАЗОВ</p>
                <div class="d-flex flex-wrap gap-2">
                   <v-chip v-for="(label, key) in orderStatusLabels" :key="key" filter
                     variant="outlined" :model-value="settingsStore.appSettings.orderStatuses[key]"
                     @click="toggleStatus('orderStatuses', key)" :disabled="key === 'accepted'"
                     color="primary" label>
                     {{ label }}
                   </v-chip>
                </div>
              </div>

              <div class="mb-6">
                <p class="text-caption font-weight-bold mb-2">ДЛЯ УСЛУГ</p>
                <div class="d-flex flex-wrap gap-2">
                   <v-chip v-for="(label, key) in serviceStatusLabels" :key="key" filter
                     variant="outlined" :model-value="settingsStore.appSettings.serviceStatuses[key]"
                     @click="toggleStatus('serviceStatuses', key)" :disabled="key === 'accepted'"
                     color="primary" label>
                     {{ label }}
                   </v-chip>
                </div>
              </div>

              <div class="mb-6">
                <p class="text-caption font-weight-bold mb-2">ДЛЯ "{{ settingsStore.appSettings.detailsTabLabel.toUpperCase() }}"</p>
                <div class="d-flex flex-wrap gap-2">
                   <v-chip v-for="(label, key) in detailStatusLabels" :key="key" filter
                     variant="outlined" :model-value="settingsStore.appSettings.detailStatuses[key]"
                     @click="toggleStatus('detailStatuses', key)" :disabled="key === 'accepted'"
                     color="primary" label>
                     {{ label }}
                   </v-chip>
                </div>
              </div>
            </v-window-item>

            <v-window-item value="sync">
               <v-card flat class="bg-surface rounded-lg pa-3 mb-4 border">
                 <div class="text-subtitle-2 font-weight-bold mb-2">Услуги → Заказ</div>
                 <p class="text-caption text-medium-emphasis mb-3">
                   Автоматически переводить заказ в статус, когда ВСЕ услуги и детали перешли в него.
                 </p>
                 <div v-for="(label, key) in syncableServiceStatuses" :key="key" class="d-flex align-center py-1">
                    <v-checkbox-btn 
                      v-model="settingsStore.appSettings.syncServiceToOrderStatus[key]"
                      color="primary"
                      @change="updateAppSettings"
                      :disabled="!settingsStore.appSettings.orderStatuses[key]"
                    ></v-checkbox-btn>
                    <span class="text-body-2 ml-2">{{ label }}</span>
                 </div>
               </v-card>

               <v-card flat class="bg-surface rounded-lg pa-3 border">
                 <div class="text-subtitle-2 font-weight-bold mb-2">Заказ → Услуги</div>
                 <p class="text-caption text-medium-emphasis mb-3">
                   При смене статуса заказа предлагать сменить статус всех услуг.
                 </p>
                 <div v-for="(label, key) in syncableOrderStatuses" :key="key" class="mb-3">
                    <div class="d-flex align-center">
                       <v-switch
                         v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].enabled"
                         color="primary"
                         hide-details density="compact"
                         @change="updateAppSettings"
                         :disabled="!settingsStore.appSettings.serviceStatuses[key]"
                       ></v-switch>
                       <span class="text-body-2 font-weight-bold ml-2">{{ label }}</span>
                    </div>
                    <div class="ml-12 mt-1" v-if="settingsStore.appSettings.syncOrderToServiceStatus[key].enabled">
                       <v-checkbox-btn 
                         v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].confirm"
                         color="secondary"
                         density="compact"
                         @change="updateAppSettings"
                       ></v-checkbox-btn>
                       <span class="text-caption">Спрашивать подтверждение</span>
                    </div>
                 </div>
               </v-card>
            </v-window-item>
          </v-window>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.calendar" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-background">
        <v-toolbar color="surface" density="compact">
          <v-btn icon="mdi-close" @click="dialogs.calendar = false"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">Календарь</v-toolbar-title>
        </v-toolbar>
        <v-card-text class="pa-4">
           <p class="text-body-2 text-medium-emphasis mb-4">
             Выберите, какие статусы будут отображаться точками. Максимум 3.
           </p>

           <v-card flat class="bg-surface rounded-xl pa-4 mb-4">
             <div class="text-subtitle-2 font-weight-bold mb-3">Мини-календарь</div>
             <div class="d-flex flex-wrap gap-2">
               <v-chip
                 v-for="status in activeOrderStatuses" :key="status.key"
                 filter
                 variant="outlined"
                 :model-value="settingsStore.appSettings.miniCalendarIndicatorStatuses.includes(status.key)"
                 @click="toggleCalendarIndicator('mini', status.key)"
                 :disabled="!settingsStore.appSettings.miniCalendarIndicatorStatuses.includes(status.key) && settingsStore.appSettings.miniCalendarIndicatorStatuses.length >= 3"
                 color="primary"
                 label
               >
                 {{ status.label }}
               </v-chip>
             </div>
           </v-card>

           <v-card flat class="bg-surface rounded-xl pa-4">
             <div class="text-subtitle-2 font-weight-bold mb-3">Полный календарь</div>
             <div class="d-flex flex-wrap gap-2">
               <v-chip
                 v-for="status in activeOrderStatuses" :key="status.key"
                 filter
                 variant="outlined"
                 :model-value="settingsStore.appSettings.fullCalendarIndicatorStatuses.includes(status.key)"
                 @click="toggleCalendarIndicator('full', status.key)"
                 :disabled="!settingsStore.appSettings.fullCalendarIndicatorStatuses.includes(status.key) && settingsStore.appSettings.fullCalendarIndicatorStatuses.length >= 3"
                 color="secondary"
                 label
               >
                 {{ status.label }}
               </v-chip>
             </div>
           </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.requiredFields" fullscreen transition="dialog-bottom-transition">
      <v-card class="bg-background">
        <v-toolbar color="surface" density="compact">
          <v-btn icon="mdi-close" @click="dialogs.requiredFields = false"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">Обязательные поля</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-card flat class="rounded-xl overflow-hidden mb-6">
             <v-list lines="one">
                <v-list-item v-for="(label, key) in requiredFieldsMap" :key="key">
                   <v-list-item-title>{{ label }}</v-list-item-title>
                   <template v-slot:append>
                     <v-checkbox-btn v-model="settingsStore.requiredFields[key]" color="primary" @change="updateRequiredFields"></v-checkbox-btn>
                   </template>
                </v-list-item>
             </v-list>
          </v-card>
          
          <v-card flat class="rounded-xl pa-4">
            <v-text-field
                v-model="settingsStore.appSettings.orderFormLastNameLabel"
                label="Название поля 'Фамилия'"
                variant="outlined" hide-details density="compact"
                @update:modelValue="updateAppSettings"
            ></v-text-field>
             <v-text-field
                v-model="settingsStore.appSettings.detailsTabLabel"
                label="Название вкладки 'Детали'"
                variant="outlined" hide-details density="compact"
                class="mt-4"
                @update:modelValue="updateAppSettings"
            ></v-text-field>
          </v-card>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogs.templates" fullscreen transition="dialog-bottom-transition">
       <v-card class="bg-background">
        <v-toolbar color="surface" density="compact">
          <v-btn icon="mdi-close" @click="dialogs.templates = false"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">Шаблоны</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-plus" color="primary" @click="openTemplateDialog()"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
          <v-list v-if="settingsStore.appSettings.messageTemplates.length" class="bg-transparent">
             <v-card flat class="rounded-xl overflow-hidden mx-4 mt-4">
              <v-list lines="two">
                <template v-for="(template, index) in settingsStore.appSettings.messageTemplates" :key="template.id">
                   <v-list-item @click="openTemplateDialog(template)">
                      <v-list-item-title class="text-body-2">{{ template.text }}</v-list-item-title>
                      <template v-slot:append><v-icon color="medium-emphasis" size="small">mdi-chevron-right</v-icon></template>
                   </v-list-item>
                   <v-divider v-if="index < settingsStore.appSettings.messageTemplates.length - 1" class="ml-4"></v-divider>
                </template>
              </v-list>
             </v-card>
          </v-list>
          <div v-else class="text-center text-medium-emphasis mt-10">Нет шаблонов</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog v-model="templateForm.show" max-width="400">
      <v-card class="rounded-xl">
        <v-card-title class="text-center pt-4">{{ templateForm.isEdit ? 'Редактировать' : 'Новый шаблон' }}</v-card-title>
        <v-card-text>
          <div class="text-caption text-medium-emphasis mb-2 text-center">Переменные: <b>%имя%</b>, <b>%цена%</b></div>
          <v-textarea v-model="templateForm.text" placeholder="Текст..." rows="4" variant="outlined" auto-grow></v-textarea>
        </v-card-text>
        <v-card-actions class="pb-4 px-4">
           <v-btn class="flex-grow-1" variant="tonal" @click="templateForm.show = false">Отмена</v-btn>
           <v-btn class="flex-grow-1" color="primary" variant="flat" @click="saveTemplate">Сохранить</v-btn>
           <v-btn v-if="templateForm.isEdit" icon="mdi-delete" variant="text" color="error" @click="deleteTemplate"></v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showClientsManager" fullscreen transition="dialog-bottom-transition">
       <v-card class="bg-background">
        <v-toolbar color="surface" density="compact">
          <v-btn icon="mdi-close" @click="showClientsManager = false"></v-btn>
          <v-toolbar-title class="text-body-1 font-weight-bold">Клиенты</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-delete-sweep" color="error" @click="clearAllClients"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-0">
           <v-list class="bg-transparent">
             <v-card flat class="rounded-xl overflow-hidden mx-4 mt-4">
                <v-list-item v-for="(client, index) in clientsStore.getRecentClients(50)" :key="client.id">
                   <v-list-item-title>{{ client.name }} {{ client.lastName }}</v-list-item-title>
                   <v-list-item-subtitle>{{ client.phone }}</v-list-item-subtitle>
                   <template v-slot:append>
                      <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="deleteClient(client.phone)"></v-btn>
                   </template>
                   <v-divider v-if="index < clientsStore.getRecentClients(50).length - 1" class="ml-4"></v-divider>
                </v-list-item>
             </v-card>
           </v-list>
        </v-card-text>
       </v-card>
    </v-dialog>

  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/stores/themeStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useServiceStore } from '@/stores/serviceStore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';

const router = useRouter();
const themeStore = useThemeStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const { appSettings } = storeToRefs(settingsStore);
const confirmationStore = useConfirmationStore();
const serviceStore = useServiceStore();

// UI State
const showClientsManager = ref(false);
const statusTab = ref('active');
const dialogs = reactive({
  requiredFields: false,
  statuses: false,
  templates: false,
  calendar: false
});
const templateForm = reactive({ show: false, isEdit: false, id: null, text: '' });

// Computeds
const userInitials = computed(() => {
  const name = serviceStore.user?.displayName;
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
});

const requiredFieldsMap = computed(() => ({
  clientName: 'Имя клиента',
  lastName: 'Фамилия (доп. поле)',
  phone: 'Телефон',
  services: 'Услуги',
  details: settingsStore.appSettings.detailsTabLabel || 'Детали',
  deadline: 'Срок выполнения',
  notes: 'Заметки'
}));

const orderStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
  delivered: 'Сдан',
}));

// Важно: Этих компютедов не было в прошлом "упрощенном" ответе
const serviceStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
}));

const detailStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
}));

const syncableServiceStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
}));

const syncableOrderStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
}));

const activeOrderStatuses = computed(() => {
  return Object.entries(orderStatusLabels.value)
    .filter(([key]) => appSettings.value.orderStatuses[key])
    .map(([key, label]) => ({ key, label }));
});

// Actions
const login = async () => { try { await signInWithPopup(auth, googleProvider); } catch (e) { console.error(e); } };
const logout = async () => { try { await signOut(auth); } catch (e) { console.error(e); } };
const toggleTheme = () => themeStore.toggleTheme();
const updateAppSettings = () => settingsStore.updateAppSettings(settingsStore.appSettings);
const updateRequiredFields = () => settingsStore.updateRequiredFields(settingsStore.requiredFields);

// Умный тоггл статусов с указанием категории
const toggleStatus = (category, key) => {
  if (key === 'accepted') return;
  settingsStore.appSettings[category][key] = !settingsStore.appSettings[category][key];
  updateAppSettings();
};

const toggleCalendarIndicator = (type, key) => {
  const list = type === 'mini' 
    ? settingsStore.appSettings.miniCalendarIndicatorStatuses 
    : settingsStore.appSettings.fullCalendarIndicatorStatuses;
  
  const index = list.indexOf(key);
  if (index !== -1) {
    // Удаляем
    list.splice(index, 1);
  } else {
    // Добавляем если < 3
    if (list.length < 3) {
      list.push(key);
    }
  }
  updateAppSettings();
};

// Шаблоны
const openTemplateDialog = (template = null) => {
  if (template) {
    templateForm.isEdit = true;
    templateForm.id = template.id;
    templateForm.text = template.text;
  } else {
    templateForm.isEdit = false;
    templateForm.id = null;
    templateForm.text = '';
  }
  templateForm.show = true;
};
const saveTemplate = () => {
  if (templateForm.isEdit) settingsStore.updateMessageTemplate(templateForm.id, templateForm.text);
  else settingsStore.addMessageTemplate(templateForm.text);
  templateForm.show = false;
};
const deleteTemplate = async () => {
  if (await confirmationStore.open('Удаление', 'Удалить этот шаблон?')) {
    settingsStore.deleteMessageTemplate(templateForm.id);
    templateForm.show = false;
  }
};

// Клиенты
const clearAllClients = async () => {
  if (await confirmationStore.open('Внимание', 'Удалить ВСЕХ клиентов из локального списка?')) {
    clientsStore.clients = [];
  }
};
const deleteClient = async (phone) => {
  if (await confirmationStore.open('Удаление', 'Удалить клиента?')) {
    clientsStore.deleteClient(phone);
  }
};
const resetAllSettings = async () => {
  if (await confirmationStore.open('Сброс', 'Вернуть все настройки к заводским?')) {
    settingsStore.resetSettings();
    themeStore.setTheme('light');
  }
};
</script>

<style scoped>
.settings-view-wrapper {
  min-height: 100%;
  padding-bottom: 40px;
}
.settings-content {
  max-width: 600px;
  margin: 0 auto;
}
.icon-box {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
}
.settings-group {
  border: 1px solid rgba(var(--v-border-color), 0.05);
}
.gap-2 { gap: 8px; }
.border { border: 1px solid rgba(var(--v-border-color), 0.12); }
</style>
