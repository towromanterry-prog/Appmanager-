<template>
  <v-card flat class="mb-4 bg-primary-lighten-5">
  <v-card-text class="d-flex align-center justify-space-between">
    <div v-if="serviceStore.user">
      <div class="text-subtitle-2">Вы вошли как:</div>
      <div class="text-body-2 font-weight-bold">{{ serviceStore.user.displayName || serviceStore.user.email }}</div>
    </div>
    <div v-else class="text-subtitle-2">Синхронизация отключена</div>

    <v-btn 
      v-if="!serviceStore.user" 
      color="primary" 
      prepend-icon="mdi-google"
      @click="login"
    >
      Войти
    </v-btn>
    <v-btn 
      v-else 
      variant="text" 
      color="error"
      @click="logout"
    >
      Выйти
    </v-btn>
  </v-card-text>
</v-card>
  
  <v-container class="settings-container">
    <v-card flat>
      <v-card-title class="d-flex align-center pa-6">
        <v-icon size="28" class="mr-3">mdi-tune</v-icon>
        <h1 class="text-h5 font-weight-medium">Настройки приложения</h1>
      </v-card-title>

      <v-card-text class="pa-0">
        <!-- Настройки обязательных полей -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-form-select</v-icon>
              Обязательные поля для заказов
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Выберите, какие поля должны быть обязательными при создании заказа.
                  </p>
                  
                  <div class="required-fields-grid">
                    <v-checkbox
                      v-model="settingsStore.requiredFields.clientName"
                      label="Имя клиента"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="settingsStore.requiredFields.phone"
                      label="Телефон"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="settingsStore.requiredFields.services"
                      label="Услуги"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="settingsStore.requiredFields.deadline"
                      label="Срок выполнения"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                    
                    <v-checkbox
                      v-model="settingsStore.requiredFields.notes"
                      label="Заметки"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                    <v-checkbox
                      v-model="settingsStore.requiredFields.details"
                      :label="settingsStore.appSettings.detailsTabLabel"
                      color="primary"
                      hide-details
                      @change="updateRequiredFields"
                    ></v-checkbox>
                  </div>
                  <div class="d-flex align-center mt-4">
                    <v-text-field
                      v-model="settingsStore.appSettings.orderFormLastNameLabel"
                      label="Название дополнительного поля"
                      variant="outlined"
                      dense
                      hide-details
                      class="flex-grow-1"
                      @update:modelValue="updateAppSettings"
                    ></v-text-field>
                    <v-checkbox
                      v-model="settingsStore.requiredFields.lastName"
                      label="Обязательное"
                      color="primary"
                      hide-details
                      class="ml-4"
                      @change="updateRequiredFields"
                    ></v-checkbox>
                  </div>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Управление статусами -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-swap-horizontal-bold</v-icon>
              Управление статусами
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <v-text-field
                    v-model="settingsStore.appSettings.additionalStatusName"
                    label="Название для статуса 'Additional'"
                    variant="outlined"
                    dense
                    class="mb-4"
                    @update:modelValue="updateAppSettings"
                  ></v-text-field>

                  <v-divider class="my-4"></v-divider>
                  <p class="text-subtitle-1 mb-2">Активные статусы</p>

                  <p class="text-caption text-medium-emphasis">Для заказов:</p>
                  <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-checkbox v-for="(label, key) in orderStatusLabels" :key="key"
                      v-model="settingsStore.appSettings.orderStatuses[key]"
                      :label="label"
                      :disabled="key === 'accepted'"
                      color="primary" hide-details @change="updateAppSettings"
                    ></v-checkbox>
                  </div>

                  <p class="text-caption text-medium-emphasis">Для услуг:</p>
                  <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-checkbox v-for="(label, key) in serviceStatusLabels" :key="key"
                      v-model="settingsStore.appSettings.serviceStatuses[key]"
                      :label="label"
                      :disabled="key === 'accepted'"
                      color="primary" hide-details @change="updateAppSettings"
                    ></v-checkbox>
                  </div>

                  <p class="text-caption text-medium-emphasis">Для "{{ settingsStore.appSettings.detailsTabLabel }}":</p>
                  <div class="d-flex flex-wrap ga-2 mb-4">
                    <v-checkbox v-for="(label, key) in detailStatusLabels" :key="key"
                      v-model="settingsStore.appSettings.detailStatuses[key]"
                      :label="label"
                      :disabled="key === 'accepted'"
                      color="primary" hide-details @change="updateAppSettings"
                    ></v-checkbox>
                  </div>

                  <v-divider class="my-4"></v-divider>
                  <p class="text-subtitle-1 mb-2">Синхронизация статусов</p>

                  <!-- Синхронизация услуг и деталей → заказ -->
                  <p class="text-body-2 mb-3">Автоматически менять статус заказа, если ВСЕ услуги и {{ settingsStore.appSettings.detailsTabLabel.toLowerCase() }} перешли в статус:</p>
                  <div class="sync-settings mb-4">
                    <div 
                      v-for="(label, key) in syncableServiceStatuses" 
                      :key="key"
                      class="sync-status-row"
                      :class="{ 'disabled-row': !settingsStore.appSettings.orderStatuses[key] }"
                    >
                      <v-checkbox
                        v-model="settingsStore.appSettings.syncServiceToOrderStatus[key]"
                        :label="label"
                        :disabled="!settingsStore.appSettings.orderStatuses[key]"
                        color="primary"
                        hide-details
                        @change="updateAppSettings"
                      ></v-checkbox>
                    </div>
                  </div>

                  <!-- Синхронизация заказ → услуги и детали -->
                  <v-divider class="my-4"></v-divider>
                  <p class="text-body-2 mb-3">Синхронизировать услуги и {{ settingsStore.appSettings.detailsTabLabel.toLowerCase() }} при смене статуса заказа:</p>
                  <div class="sync-settings">
                    <div 
                      v-for="(label, key) in syncableOrderStatuses" 
                      :key="key"
                      class="sync-status-row"
                      :class="{ 'disabled-row': !settingsStore.appSettings.serviceStatuses[key] }"
                    >
                      <v-checkbox
                        v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].enabled"
                        :label="label"
                        :disabled="!settingsStore.appSettings.serviceStatuses[key]"
                        color="primary"
                        hide-details
                        @change="updateAppSettings"
                      ></v-checkbox>
                      
                      <v-checkbox
                        v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].confirm"
                        label="С подтверждением"
                        :disabled="!settingsStore.appSettings.serviceStatuses[key] || 
                                   !settingsStore.appSettings.syncOrderToServiceStatus[key].enabled"
                        color="secondary"
                        hide-details
                        class="ml-8"
                        @change="updateAppSettings"
                      ></v-checkbox>
                    </div>
                  </div>

                  <v-divider class="my-4"></v-divider>
                  <p class="text-subtitle-1 mb-2">Индикаторы календаря</p>
                  <p class="text-body-2 mb-4">
                    Выберите до 3-х статусов заказов, которые будут отображаться
                    в виде цветных точек в календарях.
                  </p>

                  <v-row>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis">Для мини-календаря:</p>
                      <div class="d-flex flex-wrap ga-2">
                        <v-checkbox
                          v-for="status in activeOrderStatuses"
                          :key="status.key"
                          v-model="appSettings.miniCalendarIndicatorStatuses"
                          :label="status.label"
                          :value="status.key"
                          :disabled="
                            appSettings.miniCalendarIndicatorStatuses.length >= 3 &&
                            !appSettings.miniCalendarIndicatorStatuses.includes(status.key)
                          "
                          color="primary"
                          hide-details
                          @change="updateAppSettings"
                        ></v-checkbox>
                      </div>
                    </v-col>
                    <v-col cols="12" md="6">
                      <p class="text-caption text-medium-emphasis">Для полного календаря:</p>
                      <div class="d-flex flex-wrap ga-2">
                        <v-checkbox
                          v-for="status in activeOrderStatuses"
                          :key="status.key"
                          v-model="appSettings.fullCalendarIndicatorStatuses"
                          :label="status.label"
                          :value="status.key"
                          :disabled="
                            appSettings.fullCalendarIndicatorStatuses.length >= 3 &&
                            !appSettings.fullCalendarIndicatorStatuses.includes(status.key)
                          "
                          color="primary"
                          hide-details
                          @change="updateAppSettings"
                        ></v-checkbox>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Смена темы -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-palette</v-icon>
              Тема оформления
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Выберите цветовую схему приложения.
                  </p>
                  <v-btn-toggle
                    :model-value="themeStore.theme"
                    @update:model-value="themeStore.setTheme"
                    color="primary"
                    variant="outlined"
                    divided
                    class="d-flex"
                  >
                    <v-btn value="light" class="flex-grow-1">
                      <v-icon start>mdi-weather-sunny</v-icon>
                      Светлая
                    </v-btn>
                    <v-btn value="dark" class="flex-grow-1">
                      <v-icon start>mdi-weather-night</v-icon>
                      Темная
                    </v-btn>
                  </v-btn-toggle>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- FAQ -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-help-circle-outline</v-icon>
              Часто задаваемые вопросы (FAQ)
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <v-expansion-panels variant="inset">
                    <v-expansion-panel
                      v-for="(faq, index) in faqList"
                      :key="index"
                    >
                      <v-expansion-panel-title>
                        {{ faq.question }}
                      </v-expansion-panel-title>
                      <v-expansion-panel-text>
                        <p v-html="faq.answer"></p>
                      </v-expansion-panel-text>
                    </v-expansion-panel>
                  </v-expansion-panels>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Управление клиентами -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-account-cog</v-icon>
              Управление базой клиентов
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Настройки автокомплита и базы клиентов.
                  </p>
                  
                  <v-row>
                    <v-col cols="12" md="6">
                      <v-card variant="outlined">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="primary" class="mb-2">mdi-database</v-icon>
                          <h3 class="text-h6 mb-2">База клиентов</h3>
                          <p class="text-body-2 mb-3">
                            {{ clientsStore.clients.length }} клиентов в базе
                          </p>
                          <v-btn 
                            color="primary" 
                            variant="outlined"
                            @click="showClientsManager = true"
                          >
                            Управление
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    
                    <v-col cols="12" md="6">
                      <v-card variant="outlined">
                        <v-card-text class="text-center">
                          <v-icon size="48" color="error" class="mb-2">mdi-delete-sweep</v-icon>
                          <h3 class="text-h6 mb-2">Очистка данных</h3>
                          <p class="text-body-2 mb-3">
                            Удалить всех клиентов из базы
                          </p>
                          <v-btn 
                            color="error" 
                            variant="outlined"
                            @click="clearAllClients"
                          >
                            Очистить базу
                          </v-btn>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Шаблоны сообщений -->
        <v-expansion-panels variant="accordion" class="mb-4">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-message-cog</v-icon>
              Шаблоны сообщений
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <div class="d-flex justify-space-between align-center mb-2">
                    <p class="text-body-2 text-medium-emphasis">
                      Управляйте шаблонами для быстрой отправки сообщений.
                    </p>
                    <v-btn color="primary" @click="openTemplateDialog()">
                      <v-icon start>mdi-plus</v-icon>
                      Добавить
                    </v-btn>
                  </div>
                  <v-list lines="two" v-if="settingsStore.appSettings.messageTemplates.length">
                    <v-list-item
                      v-for="template in settingsStore.appSettings.messageTemplates"
                      :key="template.id"
                      :title="template.text"
                    >
                      <template v-slot:append>
                        <v-btn icon="mdi-pencil" variant="text" @click="openTemplateDialog(template)"></v-btn>
                        <v-btn icon="mdi-delete" variant="text" color="error" @click="deleteTemplate(template.id)"></v-btn>
                      </template>
                    </v-list-item>
                  </v-list>
                  <p v-else class="text-center text-medium-emphasis mt-4">
                    Нет сохраненных шаблонов.
                  </p>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>

        <!-- Дополнительные настройки -->
        <v-expansion-panels variant="accordion">
          <v-expansion-panel>
            <v-expansion-panel-title>
              <v-icon class="mr-3">mdi-cog</v-icon>
              Дополнительные настройки
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-card flat>
                <v-card-text>
                  <v-switch
                    v-model="settingsStore.appSettings.enableHapticFeedback"
                    label="Тактильная обратная связь"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  <v-text-field
                    v-model="settingsStore.appSettings.detailsTabLabel"
                    label="Название вкладки 'Детали'"
                    variant="outlined"
                    dense
                    class="mt-4"
                    @update:modelValue="updateAppSettings"
                  ></v-text-field>
                  
                  <v-switch
                    v-model="settingsStore.appSettings.enablePullToRefresh"
                    label="Обновление потягиванием"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  
                  <v-switch
                    v-model="settingsStore.appSettings.autoSaveFormDrafts"
                    label="Автосохранение черновиков"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  
                  <v-switch
                    v-model="settingsStore.appSettings.showCompletedOrders"
                    label="Показывать выполненные заказы"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  
                  <v-switch
                    v-model="settingsStore.appSettings.compactMode"
                    label="Компактный режим"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>

                  <v-divider class="my-4"></v-divider>

                  <p class="text-subtitle-1 mb-2">Поведение правого свайпа</p>
                  <v-switch
                    v-model="settingsStore.appSettings.swipeRightActions.resetMiniCalendar"
                    label="Сброс мини-календаря на текущий день"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  <v-switch
                    v-model="settingsStore.appSettings.swipeRightActions.closeFullCalendar"
                    label="Закрытие большого календаря"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  <v-switch
                    v-model="settingsStore.appSettings.swipeRightActions.clearSearch"
                    label="Сброс поиска"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  <v-switch
                    v-model="settingsStore.appSettings.swipeRightActions.resetStatusFilter"
                    label="Сброс фильтра по статусу"
                    color="primary"
                    inset
                    @change="updateAppSettings"
                  ></v-switch>
                  
                  <v-divider class="my-4"></v-divider>
                  
                  <v-btn
                    color="error"
                    variant="outlined"
                    @click="resetAllSettings"
                    class="mr-2"
                  >
                    <v-icon class="mr-2">mdi-refresh</v-icon>
                    Сбросить настройки
                  </v-btn>
                </v-card-text>
              </v-card>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>
    </v-card>

    <!-- Диалог управления клиентами -->
    <v-dialog v-model="showClientsManager" max-width="800">
      <v-card>
        <v-card-title>Управление клиентами</v-card-title>
        <v-card-text>
          <v-list>
            <v-list-item
              v-for="client in clientsStore.getRecentClients(50)"
              :key="client.id"
            >
              <v-list-item-title>{{ client.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ client.phone }} • {{ client.totalOrders }} заказов</v-list-item-subtitle>
              <template v-slot:append>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  @click="deleteClient(client.phone)"
                ></v-btn>
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

    <!-- Диалог редактирования шаблона -->
    <v-dialog v-model="templateDialog.show" max-width="500">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ templateDialog.isEdit ? 'Редактировать' : 'Добавить' }} шаблон</span>
          <v-menu location="bottom end" open-on-click>
            <template v-slot:activator="{ props }">
              <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text"></v-btn>
            </template>
            <v-card class="pa-2" elevation="2">
              <v-card-text>
                <p class="text-body-2"><b>%имя%</b> - имя клиента</p>
                <p class="text-body-2"><b>%цена%</b> - общая стоимость</p>
              </v-card-text>
            </v-card>
          </v-menu>
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="templateDialog.text"
            label="Текст шаблона"
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
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/stores/themeStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

const themeStore = useThemeStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const { appSettings } = storeToRefs(settingsStore);
const confirmationStore = useConfirmationStore();

const showClientsManager = ref(false);

const templateDialog = ref({
  show: false,
  isEdit: false,
  id: null,
  text: '',
});

const orderStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
  delivered: 'Сдан',
}));

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

// Для синхронизации услуги → заказ
const syncableServiceStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
}));

// Для синхронизации заказ → услуги
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

const faqList = ref([
  {
    question: 'Как создать новый заказ?',
    answer: 'Нажмите на кнопку "+" в правом нижнем углу главной страницы или выберите дату в календаре и нажмите "Добавить заказ".'
  },
  {
    question: 'Как изменить статус заказа?',
    answer: 'Нажмите на индикатор статуса в карточке заказа. Статус будет изменяться циклично: В работе → Выполнено → Сдан → В работе.'
  },
  {
    question: 'Что такое автокомплит клиентов?',
    answer: 'При вводе имени или телефона клиента система автоматически предложит существующих клиентов из базы данных для быстрого заполнения формы.'
  },
  {
    question: 'Как добавить кастомную иконку для услуги?',
    answer: 'В разделе "Услуги и теги" → "Услуги" нажмите "Редактировать" возле нужной услуги и выберите иконку из предложенных или введите код MDI иконки.'
  },
  {
    question: 'Как работает синхронизация статусов?',
    answer: 'Когда все услуги в заказе помечены как "Выполнено", заказ автоматически становится "Выполненным". При изменении статуса заказа на более высокий, все услуги также обновляются.'
  },
  {
    question: 'Можно ли восстановить удаленные данные?',
    answer: 'Нет, все данные хранятся локально в браузере. После удаления восстановление невозможно. Рекомендуется регулярно создавать резервные копии важной информации.'
  }
]);

const updateRequiredFields = () => {
  settingsStore.updateRequiredFields(settingsStore.requiredFields);
};

const updateAppSettings = () => {
  settingsStore.updateAppSettings(settingsStore.appSettings);
};

const clearAllClients = async () => {
  const confirmed = await confirmationStore.open(
    'Очистка базы клиентов',
    'Вы уверены, что хотите удалить всех клиентов из базы данных? Это действие нельзя отменить.'
  );
  
  if (confirmed) {
    clientsStore.clients = [];
    clientsStore.saveClients();
  }
};

const deleteClient = async (phone) => {
  const client = clientsStore.getClientByPhone(phone);
  const confirmed = await confirmationStore.open(
    'Удаление клиента',
    `Вы уверены, что хотите удалить клиента "${client.name}"?`
  );
  
  if (confirmed) {
    clientsStore.deleteClient(phone);
  }
};

const resetAllSettings = async () => {
  const confirmed = await confirmationStore.open(
    'Сброс настроек',
    'Вы уверены, что хотите сбросить все настройки к значениям по умолчанию?'
  );
  
  if (confirmed) {
    settingsStore.resetSettings();
    themeStore.setTheme('light');
  }
};

const openTemplateDialog = (template = null) => {
  if (template) {
    templateDialog.value = { show: true, isEdit: true, id: template.id, text: template.text };
  } else {
    templateDialog.value = { show: true, isEdit: false, id: null, text: '' };
  }
};

const saveTemplate = () => {
  if (templateDialog.value.isEdit) {
    settingsStore.updateMessageTemplate(templateDialog.value.id, templateDialog.value.text);
  } else {
    settingsStore.addMessageTemplate(templateDialog.value.text);
  }
  templateDialog.value.show = false;
};

const deleteTemplate = async (id) => {
  const confirmed = await confirmationStore.open(
    'Удаление шаблона',
    'Вы уверены, что хотите удалить этот шаблон?'
  );
  if (confirmed) {
    settingsStore.deleteMessageTemplate(id);
  }
};
</script>

<style scoped>
.settings-container {
  max-width: 900px;
  margin: 0 auto;
}

.required-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

/* Стили для секции синхронизации */
.sync-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-status-row {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.sync-status-row:hover:not(.disabled-row) {
  background-color: rgba(var(--v-theme-primary), 0.05);
}

.disabled-row {
  opacity: 0.5;
  background-color: rgba(128, 128, 128, 0.1);
}

.disabled-row .v-checkbox {
  pointer-events: none;
}

@media (max-width: 600px) {
  .required-fields-grid {
    grid-template-columns: 1fr;
  }
  
  .sync-status-row {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .sync-status-row .ml-8 {
    margin-left: 0 !important;
    margin-top: 8px;
  }
}
</style>
