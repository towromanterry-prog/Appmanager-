<template>
  <v-container class="fill-height align-start pa-0 bg-background">
    <v-toolbar color="transparent" density="comfortable" class="px-2">
      <v-toolbar-title class="text-h5 font-weight-bold text-primary">
        Настройки
      </v-toolbar-title>
    </v-toolbar>

    <v-container class="pa-4 pt-0 h-100 overflow-y-auto">
      
      <v-card class="mb-6 pa-1 settings-card" elevation="0">
        <v-card-text class="d-flex align-center justify-space-between py-3">
          <div class="d-flex align-center">
            <v-avatar color="primary-lighten-4" class="mr-3">
              <v-icon color="primary">mdi-account</v-icon>
            </v-avatar>
            <div v-if="serviceStore.user">
              <div class="text-caption text-medium-emphasis">Аккаунт</div>
              <div class="text-body-1 font-weight-bold">
                {{ serviceStore.user.displayName || serviceStore.user.email }}
              </div>
            </div>
            <div v-else>
              <div class="text-body-1 font-weight-bold">Синхронизация</div>
              <div class="text-caption text-medium-emphasis">Войдите для сохранения</div>
            </div>
          </div>

          <v-btn
            v-if="!serviceStore.user"
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-google"
            @click="login"
            class="rounded-lg"
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

      <v-expansion-panels variant="default" class="soft-expansion-panels">
        
        <v-expansion-panel elevation="0" class="mb-2 rounded-xl border-none">
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon class="mr-3" color="primary">mdi-palette</v-icon>
            Внешний вид
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="mb-6">
              <p class="text-body-2 text-medium-emphasis mb-3">Тема оформления</p>
              <v-btn-toggle
                :model-value="themeStore.theme"
                @update:model-value="themeStore.setTheme"
                mandatory
                class="d-flex w-100 rounded-lg overflow-hidden"
                color="primary"
                variant="outlined"
                style="height: 48px;"
                divided
              >
                <v-btn value="light" class="flex-grow-1 border-none">
                  <v-icon start>mdi-white-balance-sunny</v-icon>
                  Светлая
                </v-btn>
                <v-btn value="dark" class="flex-grow-1 border-none">
                  <v-icon start>mdi-weather-night</v-icon>
                  Темная
                </v-btn>
              </v-btn-toggle>
            </div>

            <v-divider class="mb-6 opacity-20"></v-divider>

            <div class="mb-2">
              <div class="d-flex justify-space-between align-center mb-2">
                <span class="text-body-2 text-medium-emphasis">Размер шрифта</span>
                <v-chip size="small" color="primary" variant="flat" class="font-weight-bold">
                  {{ localFontSize }}px
                </v-chip>
              </div>
              
              <v-slider
                v-model="localFontSize"
                :min="12"
                :max="24"
                :step="1"
                color="primary"
                track-color="surface-variant"
                thumb-label="always"
                hide-details
                @update:model-value="updateFontSize"
              >
                <template v-slot:prepend>
                  <v-icon size="small" icon="mdi-format-font-size-decrease"></v-icon>
                </template>
                <template v-slot:append>
                  <v-icon size="small" icon="mdi-format-font-size-increase"></v-icon>
                </template>
              </v-slider>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel elevation="0" class="mb-2 rounded-xl border-none">
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon class="mr-3" color="primary">mdi-form-select</v-icon>
            Обязательные поля
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Отметьте поля, обязательные для заполнения.
            </p>

            <div class="required-fields-grid">
              <v-checkbox
                v-model="settingsStore.requiredFields.clientName"
                label="Имя клиента"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.phone"
                label="Телефон"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.services"
                label="Услуги"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.deadline"
                label="Срок выполнения"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.notes"
                label="Заметки"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.details"
                :label="settingsStore.appSettings.detailsTabLabel"
                color="primary"
                density="comfortable"
                hide-details
                @change="updateRequiredFields"
              />
            </div>

            <div class="d-flex align-center mt-4 pt-2 border-t">
              <v-text-field
                v-model="settingsStore.appSettings.orderFormLastNameLabel"
                label="Доп. поле (Фамилия)"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1 mr-4"
                @update:modelValue="updateAppSettings"
              />
              <v-checkbox
                v-model="settingsStore.requiredFields.lastName"
                label="Обязательно"
                color="primary"
                hide-details
                density="compact"
                @change="updateRequiredFields"
              />
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel elevation="0" class="mb-2 rounded-xl border-none">
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon class="mr-3" color="primary">mdi-swap-horizontal-bold</v-icon>
            Статусы и логика
          </v-expansion-panel-title>
          <v-expansion-panel-text>
             <v-text-field
                v-model="settingsStore.appSettings.additionalStatusName"
                label="Название кастомного статуса"
                variant="outlined"
                density="compact"
                class="mb-4"
                @update:modelValue="updateAppSettings"
              />

              <v-divider class="my-4" />
              <p class="text-subtitle-2 mb-2 font-weight-bold">Активные статусы</p>

              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">Заказы</p>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip 
                    v-for="(label, key) in orderStatusLabels" 
                    :key="key" 
                    variant="outlined" 
                    class="ma-1 pa-0 border-none"
                    style="border: none;"
                  >
                    <v-checkbox
                      v-model="settingsStore.appSettings.orderStatuses[key]"
                      :label="label"
                      :disabled="key === 'accepted'"
                      color="primary"
                      density="compact"
                      hide-details
                      @change="updateAppSettings"
                    />
                  </v-chip>
                </div>
              </div>
              
              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">Услуги</p>
                <div class="d-flex flex-wrap ga-2">
                   <v-checkbox
                    v-for="(label, key) in serviceStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.serviceStatuses[key]"
                    :label="label"
                    :disabled="key === 'accepted'"
                    color="primary"
                    density="compact"
                    hide-details
                    class="mr-2"
                    @change="updateAppSettings"
                  />
                </div>
              </div>

              <div class="mb-4">
                <p class="text-caption text-medium-emphasis">Детали ({{ settingsStore.appSettings.detailsTabLabel }})</p>
                <div class="d-flex flex-wrap ga-2">
                  <v-checkbox
                    v-for="(label, key) in detailStatusLabels"
                    :key="key"
                    v-model="settingsStore.appSettings.detailStatuses[key]"
                    :label="label"
                    :disabled="key === 'accepted'"
                    color="primary"
                    density="compact"
                    hide-details
                    class="mr-2"
                    @change="updateAppSettings"
                  />
                </div>
              </div>

              <v-divider class="my-4" />
              <p class="text-subtitle-2 mb-2 font-weight-bold">Авто-синхронизация</p>
              
              <p class="text-caption text-medium-emphasis mb-2">
                Менять статус ЗАКАЗА, когда все услуги в статусе:
              </p>
              <div class="sync-settings mb-4 pl-2">
                <div v-for="(label, key) in syncableServiceStatuses" :key="key">
                  <v-checkbox
                    v-if="settingsStore.appSettings.orderStatuses[key]"
                    v-model="settingsStore.appSettings.syncServiceToOrderStatus[key]"
                    :label="label"
                    color="primary"
                    density="compact"
                    hide-details
                    @change="updateAppSettings"
                  />
                </div>
              </div>

              <p class="text-caption text-medium-emphasis mb-2">
                Менять статус УСЛУГ при смене статуса заказа:
              </p>
              <div class="sync-settings pl-2">
                <div
                  v-for="(label, key) in syncableOrderStatuses"
                  :key="key"
                  class="d-flex align-center"
                >
                   <template v-if="settingsStore.appSettings.serviceStatuses[key]">
                      <v-checkbox
                        v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].enabled"
                        :label="label"
                        color="primary"
                        density="compact"
                        hide-details
                        @change="updateAppSettings"
                      />
                      <v-chip size="x-small" variant="text" v-if="settingsStore.appSettings.syncOrderToServiceStatus[key].enabled">
                        <v-checkbox
                          v-model="settingsStore.appSettings.syncOrderToServiceStatus[key].confirm"
                          label="Спросить"
                          color="secondary"
                          density="compact"
                          hide-details
                          @change="updateAppSettings"
                        />
                      </v-chip>
                   </template>
                </div>
              </div>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel elevation="0" class="mb-2 rounded-xl border-none">
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon class="mr-3" color="primary">mdi-message-cog</v-icon>
            Шаблоны сообщений
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <div class="d-flex justify-space-between align-center mb-4">
              <p class="text-caption text-medium-emphasis">
                Для WhatsApp/Telegram
              </p>
              <v-btn
                color="primary"
                size="small"
                prepend-icon="mdi-plus"
                variant="tonal"
                @click="openTemplateDialog()"
              >
                Добавить
              </v-btn>
            </div>

            <v-list lines="two" density="compact" class="bg-transparent" v-if="settingsStore.appSettings.messageTemplates.length">
              <v-list-item
                v-for="template in settingsStore.appSettings.messageTemplates"
                :key="template.id"
                class="mb-2 bg-surface rounded-lg elevation-0 border-thin"
              >
                <v-list-item-title class="text-body-2">{{ template.text }}</v-list-item-title>
                <template #append>
                  <div class="d-flex">
                    <v-btn icon="mdi-pencil" size="x-small" variant="text" @click="openTemplateDialog(template)" />
                    <v-btn icon="mdi-delete" size="x-small" variant="text" color="error" @click="deleteTemplate(template.id)" />
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-center text-caption text-medium-emphasis py-4">
              Нет шаблонов
            </p>
          </v-expansion-panel-text>
        </v-expansion-panel>

        <v-expansion-panel elevation="0" class="mb-6 rounded-xl border-none">
          <v-expansion-panel-title class="font-weight-medium">
            <v-icon class="mr-3" color="primary">mdi-cog</v-icon>
            Прочее
          </v-expansion-panel-title>
          <v-expansion-panel-text>
            <v-switch
              v-model="settingsStore.appSettings.enableHapticFeedback"
              label="Вибрация (Haptic)"
              color="primary"
              density="compact"
              inset
              hide-details
              class="mb-2"
              @change="updateAppSettings"
            />

            <v-switch
              v-model="settingsStore.appSettings.enablePullToRefresh"
              label="Pull-to-refresh"
              color="primary"
              density="compact"
              inset
              hide-details
              class="mb-2"
              @change="updateAppSettings"
            />

            <v-switch
              v-model="settingsStore.appSettings.showCompletedOrders"
              label="Показывать завершенные"
              color="primary"
              density="compact"
              inset
              hide-details
              class="mb-4"
              @change="updateAppSettings"
            />

            <v-text-field
              v-model="settingsStore.appSettings.detailsTabLabel"
              label="Название вкладки Деталей"
              variant="outlined"
              density="compact"
              @update:modelValue="updateAppSettings"
            />

            <div class="mt-6 text-center">
              <v-btn
                color="error"
                variant="tonal"
                prepend-icon="mdi-alert"
                @click="resetAllSettings"
                class="rounded-lg"
              >
                Сбросить все настройки
              </v-btn>
            </div>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </v-container>

    <v-dialog v-model="templateDialog.show" max-width="500">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="d-flex justify-space-between align-center px-0 pt-0">
          <span class="text-h6">{{ templateDialog.isEdit ? 'Редактировать' : 'Новый' }} шаблон</span>
          <v-menu location="bottom end" open-on-click>
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text" color="primary" />
            </template>
            <v-card class="pa-3 rounded-lg" elevation="4" width="200">
              <div class="text-caption font-weight-bold mb-2">Переменные:</div>
              <div class="text-caption mb-1"><code class="bg-grey-lighten-3 pa-1 rounded">{client}</code> Имя</div>
              <div class="text-caption mb-1"><code class="bg-grey-lighten-3 pa-1 rounded">{id}</code> № Заказа</div>
              <div class="text-caption mb-1"><code class="bg-grey-lighten-3 pa-1 rounded">{status}</code> Статус</div>
              <div class="text-caption"><code class="bg-grey-lighten-3 pa-1 rounded">{sum}</code> Сумма</div>
            </v-card>
          </v-menu>
        </v-card-title>
        <v-card-text class="px-0">
          <v-textarea
            v-model="templateDialog.text"
            label="Текст сообщения"
            rows="4"
            auto-grow
            variant="outlined"
            placeholder="Здравствуйте, {client}..."
          />
        </v-card-text>
        <v-card-actions class="px-0">
          <v-spacer />
          <v-btn variant="text" @click="templateDialog.show = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" @click="saveTemplate">Сохранить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'; // Добавил onMounted и watch
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

// --- ЛОГИКА ШРИФТА (НОВАЯ) ---
const localFontSize = ref(16)

onMounted(() => {
  // Инициализация локального значения из стора
  if (settingsStore.appSettings?.fontSize) {
    localFontSize.value = settingsStore.appSettings.fontSize
  }
})

// Если настройки загрузились позже
watch(() => settingsStore.appSettings?.fontSize, (newVal) => {
  if (newVal) localFontSize.value = newVal
})

const updateFontSize = async (value) => {
  if (!settingsStore.appSettings) return
  
  // Обновляем стор. Т.к. updateAppSettings сохраняет весь объект appSettings,
  // мы сначала мутируем его локально (через реактивность Pinia это ок, но лучше явно)
  settingsStore.appSettings.fontSize = value
  // Сохраняем в БД/localStorage
  settingsStore.updateAppSettings(settingsStore.appSettings)
}
// -----------------------------

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
    localFontSize.value = 16; // Сброс локального слайдера
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
/* Minimal Soft Styling */
.settings-card {
  border-radius: 16px;
  background-color: rgb(var(--v-theme-surface));
  /* Тень уже задана глобально в style.css для v-card, но здесь можно усилить или убрать */
}

/* Убираем жесткие границы панелей аккордеона */
.soft-expansion-panels :deep(.v-expansion-panel) {
  background-color: transparent !important;
}

.soft-expansion-panels :deep(.v-expansion-panel-title) {
  padding: 16px;
  border-radius: 16px; 
  background-color: rgb(var(--v-theme-surface));
  margin-bottom: 8px;
  transition: all 0.2s ease;
}

/* При раскрытии убираем скругление снизу у заголовка, чтобы слился с контентом */
.soft-expansion-panels :deep(.v-expansion-panel--active .v-expansion-panel-title) {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  margin-bottom: 0;
}

.soft-expansion-panels :deep(.v-expansion-panel-text__wrapper) {
  background-color: rgb(var(--v-theme-surface));
  border-bottom-left-radius: 16px;
  border-bottom-right-radius: 16px;
  padding: 16px;
  padding-top: 0;
}

.required-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.sync-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
