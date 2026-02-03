<template>
  <v-card flat color="background" class="h-100 overflow-y-auto">
    <v-card-title class="pt-4 pb-2 px-4 text-h5 font-weight-bold">
      Настройки
    </v-card-title>

    <v-card-text class="pa-0">
      <!-- Аккаунт -->
      <v-card flat class="mb-4 bg-primary-lighten-5 rounded-0">
        <v-card-text class="d-flex align-center justify-space-between py-3">
          <div v-if="serviceStore.user">
            <div class="text-caption text-medium-emphasis">Аккаунт</div>
            <div class="text-body-2 font-weight-bold">
              {{ serviceStore.user.displayName || serviceStore.user.email }}
            </div>
          </div>
          <div v-else>
            <div class="text-body-2">Синхронизация</div>
            <div class="text-caption text-medium-emphasis">Войдите для сохранения</div>
          </div>

          <v-btn
            v-if="!serviceStore.user"
            color="primary"
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
          />
        </v-card-text>
      </v-card>

      <!-- Справочники -->
      <v-card flat class="mb-4 rounded-0">
        <v-card-text class="d-flex align-center justify-space-between py-3">
          <div>
            <div class="text-caption text-medium-emphasis">Справочники</div>
            <div class="text-body-2 font-weight-bold">Услуги, детали, теги</div>
          </div>
          <v-btn
            color="primary"
            variant="tonal"
            size="small"
            to="/base-settings"
          >
            Открыть
          </v-btn>
        </v-card-text>
      </v-card>

      <!-- Параметры (аккордеон) -->
      <v-expansion-panels variant="accordion" class="mb-4">
        <!-- Обязательные поля -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-form-select</v-icon>
            Обязательные поля
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
                  />

                  <v-checkbox
                    v-model="settingsStore.requiredFields.phone"
                    label="Телефон"
                    color="primary"
                    hide-details
                    @change="updateRequiredFields"
                  />

                  <v-checkbox
                    v-model="settingsStore.requiredFields.services"
                    label="Услуги"
                    color="primary"
                    hide-details
                    @change="updateRequiredFields"
                  />

                  <v-checkbox
                    v-model="settingsStore.requiredFields.deadline"
                    label="Срок выполнения"
                    color="primary"
                    hide-details
                    @change="updateRequiredFields"
                  />

                  <v-checkbox
                    v-model="settingsStore.requiredFields.notes"
                    label="Заметки"
                    color="primary"
                    hide-details
                    @change="updateRequiredFields"
                  />

                  <v-checkbox
                    v-model="settingsStore.requiredFields.details"
                    :label="settingsStore.appSettings.detailsTabLabel"
                    color="primary"
                    hide-details
                    @change="updateRequiredFields"
                  />
                </div>

                <div class="d-flex align-center mt-4">
                  <v-text-field
                    v-model="settingsStore.appSettings.orderFormLastNameLabel"
                    label="Название дополнительного поля"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                    @update:modelValue="updateAppSettings"
                  />
                  <v-checkbox
                    v-model="settingsStore.requiredFields.lastName"
                    label="Обязательное"
                    color="primary"
                    hide-details
                    class="ml-4"
                    @change="updateRequiredFields"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Статусы -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-swap-horizontal-bold</v-icon>
            Статусы и синхронизация
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <v-text-field
                  v-model="settingsStore.appSettings.additionalStatusName"
                  label="Название для статуса 'Additional'"
                  variant="outlined"
                  density="compact"
                  class="mb-4"
                  @update:modelValue="updateAppSettings"
                />

                <v-divider class="my-4" />
                <p class="text-subtitle-1 mb-2">Активные статусы</p>

                <p class="text-caption text-medium-emphasis">Для заказов:</p>
                <div class="d-flex flex-wrap ga-2 mb-4">
                  <v-checkbox
                    v-for="(label, key) in orderStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.orderStatuses[key]"
                    :label="label"
                    :disabled="key === 'accepted'"
                    color="primary"
                    hide-details
                    @change="updateAppSettings"
                  />
                </div>

                <p class="text-caption text-medium-emphasis">Для услуг:</p>
                <div class="d-flex flex-wrap ga-2 mb-4">
                  <v-checkbox
                    v-for="(label, key) in serviceStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.serviceStatuses[key]"
                    :label="label"
                    :disabled="key === 'accepted'"
                    color="primary"
                    hide-details
                    @change="updateAppSettings"
                  />
                </div>

                <p class="text-caption text-medium-emphasis">
                  Для "{{ settingsStore.appSettings.detailsTabLabel }}":
                </p>
                <div class="d-flex flex-wrap ga-2 mb-4">
                  <v-checkbox
                    v-for="(label, key) in detailStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.detailStatuses[key]"
                    :label="label"
                    :disabled="key === 'accepted'"
                    color="primary"
                    hide-details
                    @change="updateAppSettings"
                  />
                </div>

                <v-divider class="my-4" />
                <p class="text-subtitle-1 mb-2">Синхронизация статусов</p>

                <p class="text-body-2 mb-3">
                  Автоматически менять статус заказа, если ВСЕ услуги и
                  {{ settingsStore.appSettings.detailsTabLabel.toLowerCase() }}
                  перешли в статус:
                </p>

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
                    />
                  </div>
                </div>

                <v-divider class="my-4" />
                <p class="text-body-2 mb-3">
                  Синхронизировать услуги и
                  {{ settingsStore.appSettings.detailsTabLabel.toLowerCase() }}
                  при смене статуса заказа:
                </p>

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
                    />

                    <v-checkbox
                      v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].confirm"
                      label="С подтверждением"
                      :disabled="
                        !settingsStore.appSettings.serviceStatuses[key] ||
                        !settingsStore.appSettings.syncOrderToServiceStatus[key].enabled
                      "
                      color="secondary"
                      hide-details
                      class="ml-8"
                      @change="updateAppSettings"
                    />
                  </div>
                </div>

                <v-divider class="my-4" />
                <p class="text-subtitle-1 mb-2">Индикаторы календаря</p>
                <p class="text-body-2 mb-4">
                  Выберите статусы заказов, которые будут отображаться точками в календаре.
                </p>

                <p class="text-caption text-medium-emphasis mb-2">Полный календарь</p>
                <div class="d-flex flex-column ga-2">
                  <v-checkbox
                    v-for="(label, key) in orderStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.fullCalendarIndicatorStatuses"
                    :label="label"
                    :value="key"
                    color="primary"
                    hide-details
                    @change="updateAppSettings"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <!-- Тема -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-palette</v-icon>
            Внешний вид и Тема
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
                  mandatory
                  class="d-flex justify-center w-100"
                  color="primary"
                  variant="outlined"
                >
                  <v-btn value="light" class="flex-grow-1">
                    <v-icon start>mdi-white-balance-sunny</v-icon>
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

        <!-- Шаблоны -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-message-cog</v-icon>
            Шаблоны сообщений
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <div class="d-flex justify-space-between align-center mb-4">
                  <p class="text-body-2 text-medium-emphasis">
                    Шаблоны для быстрой отправки сообщений в WhatsApp/Telegram.
                  </p>
                  <v-btn
                    color="primary"
                    size="small"
                    prepend-icon="mdi-plus"
                    @click="openTemplateDialog()"
                  >
                    Добавить
                  </v-btn>
                </div>

                <v-list lines="two" v-if="settingsStore.appSettings.messageTemplates.length">
                  <v-list-item
                    v-for="template in settingsStore.appSettings.messageTemplates"
                    :key="template.id"
                    :title="template.text"
                  >
                    <template #append>
                      <v-btn
                        icon="mdi-pencil"
                        variant="text"
                        @click="openTemplateDialog(template)"
                      />
                      <v-btn
                        icon="mdi-delete"
                        variant="text"
                        color="error"
                        @click="deleteTemplate(template.id)"
                      />
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

        <!-- Дополнительные -->
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-cog</v-icon>
            Дополнительно
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <p class="text-subtitle-1 mb-2">Переключатели</p>

                <v-switch
                  v-model="settingsStore.appSettings.enableHapticFeedback"
                  label="Тактильная обратная связь"
                  color="primary"
                  inset
                  @change="updateAppSettings"
                />

                <v-switch
                  v-model="settingsStore.appSettings.enablePullToRefresh"
                  label="Обновление потягиванием"
                  color="primary"
                  inset
                  @change="updateAppSettings"
                />

                <v-switch
                  v-model="settingsStore.appSettings.showCompletedOrders"
                  label="Показывать выполненные заказы"
                  color="primary"
                  inset
                  @change="updateAppSettings"
                />

                <v-divider class="my-4" />

                <p class="text-subtitle-1 mb-2">Внешний вид</p>

                <v-text-field
                  v-model="settingsStore.appSettings.detailsTabLabel"
                  label="Название вкладки 'Детали'"
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                  @update:modelValue="updateAppSettings"
                />

                <v-divider class="my-4" />

                <v-btn
                  color="error"
                  variant="outlined"
                  @click="resetAllSettings"
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

    <!-- Диалог шаблонов -->
    <v-dialog v-model="templateDialog.show" max-width="500">
      <v-card>
        <v-card-title class="d-flex justify-space-between align-center">
          <span>{{ templateDialog.isEdit ? 'Редактировать' : 'Добавить' }} шаблон</span>
          <v-menu location="bottom end" open-on-click>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text" />
            </template>
            <v-card class="pa-2" elevation="2">
              <v-card-text>
                <p class="text-caption mb-1">Доступные переменные:</p>
                <code class="text-caption">{client}</code> - Имя клиента<br>
                <code class="text-caption">{id}</code> - Номер заказа<br>
                <code class="text-caption">{status}</code> - Статус заказа<br>
                <code class="text-caption">{sum}</code> - Сумма заказа
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
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="templateDialog.show = false">Отмена</v-btn>
          <v-btn color="primary" @click="saveTemplate">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useThemeStore } from '@/stores/themeStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { useServiceStore } from '@/stores/serviceStore';

const themeStore = useThemeStore();
const settingsStore = useSettingsStore();
const confirmationStore = useConfirmationStore();
const serviceStore = useServiceStore();

const templateDialog = ref({
  show: false,
  isEdit: false,
  id: null,
  text: ''
});

// === Вход/выход ===
const login = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    console.error('Ошибка входа:', e);
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error('Ошибка выхода:', e);
  }
};

const orderStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено',
  delivered: 'Сдан'
}));

const serviceStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено'
}));

const detailStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено'
}));

const syncableServiceStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено'
}));

const syncableOrderStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName,
  in_progress: 'В работе',
  completed: 'Выполнено'
}));

const updateRequiredFields = () => {
  settingsStore.updateRequiredFields(settingsStore.requiredFields);
};

const updateAppSettings = () => {
  settingsStore.updateAppSettings(settingsStore.appSettings);
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
    templateDialog.value = {
      show: true,
      isEdit: true,
      id: template.id,
      text: template.text
    };
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

const deleteTemplate = (id) => {
  settingsStore.deleteMessageTemplate(id);
};
</script>

<style scoped>
.required-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
}

.sync-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sync-status-row {
  display: flex;
  align-items: center;
}

.disabled-row {
  opacity: 0.6;
}
</style>
