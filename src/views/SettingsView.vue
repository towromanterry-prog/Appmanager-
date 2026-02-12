<template>
  <v-card flat color="background" class="h-100 overflow-y-auto">
    <v-card-title class="pt-4 pb-2 px-4 text-h5 font-weight-bold">
      Настройки
    </v-card-title>

    <v-card-text class="pa-0">
      <v-card flat class="mb-4 bg-primary-lighten-5 rounded-0">
        <v-card-text class="d-flex align-center justify-space-between py-3">
          <div v-if="authStore.user">
            <div class="text-caption text-medium-emphasis">Аккаунт</div>
            <div class="text-body-2 font-weight-bold">
              {{ authStore.user.displayName || authStore.user.email }}
            </div>
          </div>
          <div v-else>
            <div class="text-body-2">Синхронизация</div>
            <div class="text-caption text-medium-emphasis">Войдите для сохранения</div>
          </div>

          <v-btn
            v-if="!authStore.user"
            color="primary"
            size="small"
            prepend-icon="mdi-google"
            :loading="authStore.loading"
            @click="handleLogin"
          >
            Войти
          </v-btn>
          <v-btn
            v-else
            variant="text"
            color="error"
            size="small"
            icon="mdi-logout"
            :loading="authStore.loading"
            @click="handleLogout"
          />
        </v-card-text>
      </v-card>

      <v-expansion-panels variant="accordion" class="mb-4">
        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-form-select</v-icon>
            Обязательные поля
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <p class="text-body-2 text-medium-emphasis mb-4">
                  Выберите поля, обязательные при создании заказа.
                </p>

                <div class="required-fields-grid">
                  <v-checkbox
                    v-for="(label, key) in requiredFieldLabels"
                    :key="key"
                    v-model="settingsStore.requiredFields[key]"
                    :label="label"
                    color="primary"
                    hide-details
                    @change="onSettingChange"
                  />
                </div>
                
                <div class="d-flex align-center mt-4">
                  <v-text-field
                    v-model="settingsStore.appSettings.orderFormLastNameLabel"
                    label="Название поля 'Фамилия'"
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="flex-grow-1"
                    @update:modelValue="onSettingChange"
                  />
                  <v-checkbox
                    v-model="settingsStore.requiredFields.lastName"
                    label="Обязательное"
                    color="primary"
                    hide-details
                    class="ml-4"
                    @change="onSettingChange"
                  />
                </div>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

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
                  label="Название статуса 'Additional'"
                  variant="outlined"
                  density="compact"
                  class="mb-4"
                  @update:modelValue="onSettingChange"
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
                    @change="onSettingChange"
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
                    @change="onSettingChange"
                  />
                </div>

                <p class="text-caption text-medium-emphasis">
                  Для "{{ settingsStore.appSettings.detailsTabLabel || 'Деталей' }}":
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
                    @change="onSettingChange"
                  />
                </div>

                <v-divider class="my-4" />
                
                <p class="text-subtitle-1 mb-2">Авто-смена статуса заказа</p>
                <p class="text-body-2 mb-3 text-medium-emphasis">
                  Менять статус заказа, если ВСЕ услуги перешли в:
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
                      @change="onSettingChange"
                    />
                  </div>
                </div>

                <v-divider class="my-4" />

                <p class="text-subtitle-1 mb-2">Массовая смена услуг</p>
                <p class="text-body-2 mb-3 text-medium-emphasis">
                  При смене статуса заказа менять статус услуг:
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
                      @change="onSettingChange"
                    />
                    <v-checkbox
                      v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].confirm"
                      label="С подтверждением"
                      :disabled="!settingsStore.appSettings.serviceStatuses[key] || !settingsStore.appSettings.syncOrderToServiceStatus[key].enabled"
                      color="secondary"
                      hide-details
                      class="ml-8"
                      @change="onSettingChange"
                    />
                  </div>
                </div>

                <v-divider class="my-4" />
                
                <p class="text-subtitle-1 mb-2">Индикаторы календаря</p>
                <p class="text-body-2 mb-2 text-medium-emphasis">
                  Какие статусы показывать точками в календаре:
                </p>
                <div class="d-flex flex-column ga-2">
                  <v-checkbox
                    v-for="(label, key) in orderStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.fullCalendarIndicatorStatuses"
                    :label="label"
                    :value="key"
                    color="primary"
                    hide-details
                    @change="onSettingChange"
                  />
                </div>

              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-palette</v-icon>
            Внешний вид
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <v-btn-toggle
                  :model-value="themeStore.theme"
                  @update:model-value="handleThemeChange"
                  mandatory
                  class="d-flex justify-center w-100 mb-4"
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

                <v-text-field
                  v-model="settingsStore.appSettings.detailsTabLabel"
                  label="Название вкладки 'Детали'"
                  variant="outlined"
                  density="compact"
                  class="mt-2"
                  @update:modelValue="onSettingChange"
                />
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

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
                    Шаблоны для WhatsApp/Telegram.
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

                <v-list lines="two" v-if="settingsStore.appSettings.messageTemplates?.length">
                  <v-list-item
                    v-for="template in settingsStore.appSettings.messageTemplates"
                    :key="template.id"
                    :title="template.text"
                    class="pl-0"
                  >
                    <template #append>
                      <v-btn icon="mdi-pencil" variant="text" size="small" @click="openTemplateDialog(template)" />
                      <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteTemplate(template.id)" />
                    </template>
                  </v-list-item>
                </v-list>
                <p v-else class="text-center text-caption text-medium-emphasis py-2">Нет шаблонов</p>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel>
          <v-expansion-panel-title>
            <v-icon class="mr-3">mdi-cog</v-icon>
            Дополнительно
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-card flat>
              <v-card-text>
                <v-switch
                  v-model="settingsStore.appSettings.enableHapticFeedback"
                  label="Тактильная отдача"
                  color="primary"
                  inset
                  hide-details
                  class="mb-2"
                  @change="onSettingChange"
                />
                <v-switch
                  v-model="settingsStore.appSettings.enablePullToRefresh"
                  label="Обновление потягиванием"
                  color="primary"
                  inset
                  hide-details
                  class="mb-2"
                  @change="onSettingChange"
                />
                <v-switch
                  v-model="settingsStore.appSettings.showCompletedOrders"
                  label="Показывать выполненные"
                  color="primary"
                  inset
                  hide-details
                  @change="onSettingChange"
                />

                <v-divider class="my-4" />
                <v-btn color="error" variant="outlined" block @click="resetAllSettings">
                  Сбросить настройки
                </v-btn>
              </v-card-text>
            </v-card>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-card-text>

    <v-dialog v-model="templateDialog.show" max-width="500">
      <v-card>
        <v-card-title>
          {{ templateDialog.isEdit ? 'Редактировать' : 'Добавить' }} шаблон
        </v-card-title>
        <v-card-text>
          <v-textarea
            v-model="templateDialog.text"
            label="Текст"
            rows="3"
            auto-grow
            variant="outlined"
            hint="{client}, {id}, {sum}, {status} - переменные"
            persistent-hint
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
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useThemeStore } from '@/stores/themeStore';
import { useConfirmationStore } from '@/stores/confirmationStore';
import { useHapticFeedback } from '@/composables/useHapticFeedback';

const authStore = useAuthStore();
const settingsStore = useSettingsStore();
const themeStore = useThemeStore();
const confirmationStore = useConfirmationStore();
const { triggerHapticFeedback } = useHapticFeedback();

// UI State
const templateDialog = ref({ show: false, isEdit: false, id: null, text: '' });

// Labels
const requiredFieldLabels = {
  clientName: 'Имя клиента',
  phone: 'Телефон',
  services: 'Услуги',
  deadline: 'Срок (дата)',
  notes: 'Заметки',
  details: 'Детали/Расходники'
};

const orderStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName || 'Ожидание',
  in_progress: 'В работе',
  completed: 'Готов',
  delivered: 'Сдан'
}));

const serviceStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName || 'Ожидание',
  in_progress: 'В работе',
  completed: 'Готов'
}));

const detailStatusLabels = computed(() => ({
  accepted: 'Принят',
  additional: settingsStore.appSettings.additionalStatusName || 'Ожидание',
  in_progress: 'В работе',
  completed: 'Готов'
}));

const syncableServiceStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName || 'Ожидание',
  in_progress: 'В работе',
  completed: 'Готов'
}));

const syncableOrderStatuses = computed(() => ({
  additional: settingsStore.appSettings.additionalStatusName || 'Ожидание',
  in_progress: 'В работе',
  completed: 'Готов'
}));


// Actions
const handleLogin = async () => {
  triggerHapticFeedback('tap');
  try {
    await authStore.login();
  } catch (e) {
    console.error('Login failed', e);
  }
};

const handleLogout = async () => {
  triggerHapticFeedback('tap');
  const ok = await confirmationStore.open('Выход', 'Вы действительно хотите выйти?');
  if (ok) await authStore.logout();
};

const handleThemeChange = (val) => {
  triggerHapticFeedback('light');
  themeStore.setTheme(val);
};

const onSettingChange = () => {
  triggerHapticFeedback('selection');
  settingsStore.updateAppSettings(settingsStore.appSettings);
  settingsStore.updateRequiredFields(settingsStore.requiredFields);
};

const resetAllSettings = async () => {
  triggerHapticFeedback('warning');
  const ok = await confirmationStore.open(
    'Сброс настроек', 
    'Вернуть все настройки к заводским значениям? Это действие нельзя отменить.'
  );
  if (ok) {
    await settingsStore.resetSettings();
    themeStore.setTheme('light');
    triggerHapticFeedback('success');
  }
};

// Templates logic
const openTemplateDialog = (tpl = null) => {
  if (tpl) {
    templateDialog.value = { show: true, isEdit: true, id: tpl.id, text: tpl.text };
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
  triggerHapticFeedback('success');
};

const deleteTemplate = async (id) => {
  const ok = await confirmationStore.open('Удалить шаблон', 'Удалить этот шаблон сообщения?');
  if (ok) {
    settingsStore.deleteMessageTemplate(id);
    triggerHapticFeedback('light');
  }
};
</script>

<style scoped>
.required-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
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
