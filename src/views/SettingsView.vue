<template>
  <v-container fluid class="settings-page bg-grey-lighten-5 pa-4">
    <div class="settings-shell">
      <!-- Header -->
      <div class="px-1 pt-1 pb-3">
        <div class="d-flex align-center ga-3">
          <div class="icon-box bg-indigo-lighten-5 text-indigo-darken-2">
            <v-icon size="20">mdi-tune</v-icon>
          </div>
          <div>
            <div class="text-caption text-medium-emphasis">Настройки</div>
            <div class="text-h6 font-weight-semibold">Настройки приложения</div>
          </div>
        </div>
      </div>

      <!-- Account / Sync -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <v-list class="py-0" lines="two">
          <v-list-item class="settings-row" :min-height="56">
            <template #prepend>
              <div class="icon-box bg-blue-lighten-5 text-blue-darken-2">
                <v-icon size="20">mdi-account-circle-outline</v-icon>
              </div>
            </template>

            <v-list-item-title>Аккаунт</v-list-item-title>

            <v-list-item-subtitle v-if="serviceStore.user">
              {{ serviceStore.user.displayName || serviceStore.user.email }}
            </v-list-item-subtitle>
            <v-list-item-subtitle v-else>
              Войдите, чтобы сохранять настройки в облако
            </v-list-item-subtitle>

            <template #append>
              <v-btn
                v-if="!serviceStore.user"
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="mdi-google"
                class="ml-2"
                @click="login"
              >
                Войти
              </v-btn>

              <v-btn
                v-else
                variant="text"
                color="error"
                icon="mdi-logout"
                @click="logout"
                aria-label="Выйти"
              />
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- Orders -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <div class="section-label px-4 pt-4 pb-2">ЗАКАЗЫ</div>

        <v-list class="py-0" lines="two">
          <!-- Required Fields dialog -->
          <v-dialog scrollable max-width="760">
            <template #activator="{ props }">
              <v-list-item v-bind="props" class="settings-row" :min-height="56">
                <template #prepend>
                  <div class="icon-box bg-light-blue-lighten-5 text-light-blue-darken-3">
                    <v-icon size="20">mdi-form-select</v-icon>
                  </div>
                </template>

                <v-list-item-title>Обязательные поля</v-list-item-title>
                <v-list-item-subtitle>Что нужно заполнить при создании заказа</v-list-item-subtitle>

                <template #append>
                  <v-icon class="chev">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>

            <template #default="{ isActive }">
              <v-card class="soft-dialog" rounded="xl">
                <v-toolbar flat class="soft-toolbar">
                  <v-btn icon="mdi-close" variant="text" @click="isActive.value = false" />
                  <v-toolbar-title>Обязательные поля</v-toolbar-title>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Готово</v-btn>
                </v-toolbar>

                <v-divider />

                <v-card-text class="pa-4">
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Выберите, какие поля должны быть обязательными при создании заказа.
                  </p>

                  <div class="required-fields-grid soft-grid">
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

                  <v-card class="soft-inner-card mt-4" rounded="xl" flat>
                    <v-card-text class="pa-4">
                      <div class="text-subtitle-2 mb-3">Дополнительное поле</div>

                      <div class="d-flex align-start ga-3 flex-wrap">
                        <v-text-field
                          v-model="settingsStore.appSettings.orderFormLastNameLabel"
                          label="Название дополнительного поля"
                          variant="outlined"
                          density="comfortable"
                          hide-details
                          class="flex-grow-1 min-w-240"
                          @update:modelValue="updateAppSettings"
                        />

                        <v-checkbox
                          v-model="settingsStore.requiredFields.lastName"
                          label="Обязательное"
                          color="primary"
                          hide-details
                          class="pt-2"
                          @change="updateRequiredFields"
                        />
                      </div>
                    </v-card-text>
                  </v-card>
                </v-card-text>
              </v-card>
            </template>
          </v-dialog>

          <v-divider />

          <!-- Statuses + Sync + Calendar dialog -->
          <v-dialog scrollable max-width="820">
            <template #activator="{ props }">
              <v-list-item v-bind="props" class="settings-row" :min-height="56">
                <template #prepend>
                  <div class="icon-box bg-deep-purple-lighten-5 text-deep-purple-darken-2">
                    <v-icon size="20">mdi-swap-horizontal-bold</v-icon>
                  </div>
                </template>

                <v-list-item-title>Статусы и календарь</v-list-item-title>
                <v-list-item-subtitle>Активные статусы, синхронизация, индикаторы</v-list-item-subtitle>

                <template #append>
                  <v-icon class="chev">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>

            <template #default="{ isActive }">
              <v-card class="soft-dialog" rounded="xl">
                <v-toolbar flat class="soft-toolbar">
                  <v-btn icon="mdi-close" variant="text" @click="isActive.value = false" />
                  <v-toolbar-title>Статусы</v-toolbar-title>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Готово</v-btn>
                </v-toolbar>

                <v-divider />

                <v-card-text class="pa-4">
                  <v-tabs
                    v-model="statusDialogTab"
                    class="soft-tabs"
                    density="comfortable"
                    color="primary"
                    grow
                  >
                    <v-tab value="statuses">Статусы</v-tab>
                    <v-tab value="sync">Синхронизация</v-tab>
                    <v-tab value="calendar">Календарь</v-tab>
                  </v-tabs>

                  <div class="mt-4">
                    <v-window v-model="statusDialogTab">
                      <!-- TAB: Statuses -->
                      <v-window-item value="statuses">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
                            <v-text-field
                              v-model="settingsStore.appSettings.additionalStatusName"
                              label="Название для статуса “Additional”"
                              variant="outlined"
                              density="comfortable"
                              hide-details
                              @update:modelValue="updateAppSettings"
                            />

                            <v-divider class="my-4" />

                            <div class="text-subtitle-2 mb-2">Активные статусы</div>

                            <div class="text-caption text-medium-emphasis mb-2">Для заказов</div>
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

                            <div class="text-caption text-medium-emphasis mb-2">Для услуг</div>
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

                            <div class="text-caption text-medium-emphasis mb-2">
                              Для “{{ settingsStore.appSettings.detailsTabLabel }}”
                            </div>
                            <div class="d-flex flex-wrap ga-2">
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
                          </v-card-text>
                        </v-card>
                      </v-window-item>

                      <!-- TAB: Sync -->
                      <v-window-item value="sync">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
                            <div class="text-subtitle-2 mb-2">Синхронизация статусов</div>

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
                          </v-card-text>
                        </v-card>
                      </v-window-item>

                      <!-- TAB: Calendar -->
                      <v-window-item value="calendar">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
                            <div class="text-subtitle-2 mb-2">Индикаторы календаря</div>
                            <p class="text-body-2 mb-4">
                              Выберите до 3-х статусов заказов, которые будут отображаться
                              в виде цветных точек в календарях.
                            </p>

                            <v-row>
                              <v-col cols="12" md="6">
                                <div class="text-caption text-medium-emphasis mb-2">Для мини-календаря</div>
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
                                  />
                                </div>
                              </v-col>

                              <v-col cols="12" md="6">
                                <div class="text-caption text-medium-emphasis mb-2">Для полного календаря</div>
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
                                  />
                                </div>
                              </v-col>
                            </v-row>
                          </v-card-text>
                        </v-card>
                      </v-window-item>
                    </v-window>
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </v-dialog>
        </v-list>
      </v-card>

      <!-- Message templates (inline, soft card) -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <div class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
          <div>
            <div class="section-label mb-0">ШАБЛОНЫ</div>
            <div class="text-body-2 text-medium-emphasis">Быстрая отправка сообщений</div>
          </div>

          <v-btn color="primary" variant="tonal" @click="openTemplateDialog()">
            <v-icon start>mdi-plus</v-icon>
            Добавить
          </v-btn>
        </div>

        <v-divider class="mx-4" />

        <v-card-text class="pt-3">
          <v-list lines="two" class="py-0" v-if="settingsStore.appSettings.messageTemplates.length">
            <v-list-item
              v-for="template in settingsStore.appSettings.messageTemplates"
              :key="template.id"
              class="settings-row"
              :min-height="56"
            >
              <v-list-item-title class="text-body-2">
                {{ template.text }}
              </v-list-item-title>

              <template #append>
                <v-btn icon="mdi-pencil" variant="text" @click="openTemplateDialog(template)" />
                <v-btn icon="mdi-delete" variant="text" color="error" @click="deleteTemplate(template.id)" />
              </template>
            </v-list-item>
          </v-list>

          <p v-else class="text-center text-medium-emphasis my-6">
            Нет сохраненных шаблонов.
          </p>
        </v-card-text>
      </v-card>

      <!-- Appearance -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <div class="section-label px-4 pt-4 pb-2">ВНЕШНИЙ ВИД</div>

        <v-list class="py-0" lines="two">
          <v-dialog scrollable max-width="560">
            <template #activator="{ props }">
              <v-list-item v-bind="props" class="settings-row" :min-height="56">
                <template #prepend>
                  <div class="icon-box bg-amber-lighten-5 text-amber-darken-3">
                    <v-icon size="20">mdi-palette</v-icon>
                  </div>
                </template>

                <v-list-item-title>Тема</v-list-item-title>
                <v-list-item-subtitle>
                  {{ themeStore.theme === 'dark' ? 'Тёмная' : 'Светлая' }}
                </v-list-item-subtitle>

                <template #append>
                  <v-icon class="chev">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>

            <template #default="{ isActive }">
              <v-card class="soft-dialog" rounded="xl">
                <v-toolbar flat class="soft-toolbar">
                  <v-btn icon="mdi-close" variant="text" @click="isActive.value = false" />
                  <v-toolbar-title>Тема</v-toolbar-title>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Готово</v-btn>
                </v-toolbar>

                <v-divider />

                <v-card-text class="pa-4">
                  <p class="text-body-2 text-medium-emphasis mb-4">
                    Выберите цветовую схему приложения.
                  </p>

                  <v-btn-toggle
                    :model-value="themeStore.theme"
                    @update:model-value="themeStore.setTheme"
                    color="primary"
                    class="soft-toggle"
                    divided
                    mandatory
                  >
                    <v-btn value="light" rounded="pill" class="flex-grow-1">
                      <v-icon start>mdi-weather-sunny</v-icon>
                      Светлая
                    </v-btn>
                    <v-btn value="dark" rounded="pill" class="flex-grow-1">
                      <v-icon start>mdi-weather-night</v-icon>
                      Тёмная
                    </v-btn>
                  </v-btn-toggle>
                </v-card-text>
              </v-card>
            </template>
          </v-dialog>
        </v-list>
      </v-card>

      <!-- Data -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <div class="section-label px-4 pt-4 pb-2">ДАННЫЕ</div>

        <v-list class="py-0" lines="two">
          <v-list-item class="settings-row" :min-height="56" @click="showClientsManager = true">
            <template #prepend>
              <div class="icon-box bg-green-lighten-5 text-green-darken-3">
                <v-icon size="20">mdi-database</v-icon>
              </div>
            </template>

            <v-list-item-title>База клиентов</v-list-item-title>
            <v-list-item-subtitle>{{ clientsStore.clients.length }} клиентов</v-list-item-subtitle>

            <template #append>
              <v-icon class="chev">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>

          <v-divider />

          <v-list-item class="settings-row" :min-height="56" @click="clearAllClients">
            <template #prepend>
              <div class="icon-box bg-red-lighten-5 text-red-darken-2">
                <v-icon size="20">mdi-delete-sweep</v-icon>
              </div>
            </template>

            <v-list-item-title>Очистить базу клиентов</v-list-item-title>
            <v-list-item-subtitle>Удалить всех клиентов (необратимо)</v-list-item-subtitle>

            <template #append>
              <v-icon class="chev">mdi-chevron-right</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-card>

      <!-- System / Extras -->
      <v-card class="soft-card mb-4" rounded="xl" elevation="1">
        <div class="section-label px-4 pt-4 pb-2">СИСТЕМА</div>

        <v-list class="py-0" lines="two">
          <v-dialog scrollable max-width="820">
            <template #activator="{ props }">
              <v-list-item v-bind="props" class="settings-row" :min-height="56">
                <template #prepend>
                  <div class="icon-box bg-teal-lighten-5 text-teal-darken-3">
                    <v-icon size="20">mdi-cog</v-icon>
                  </div>
                </template>

                <v-list-item-title>Дополнительные настройки</v-list-item-title>
                <v-list-item-subtitle>Интерфейс, поведение, свайпы</v-list-item-subtitle>

                <template #append>
                  <v-icon class="chev">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>

            <template #default="{ isActive }">
              <v-card class="soft-dialog" rounded="xl">
                <v-toolbar flat class="soft-toolbar">
                  <v-btn icon="mdi-close" variant="text" @click="isActive.value = false" />
                  <v-toolbar-title>Доп. настройки</v-toolbar-title>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Готово</v-btn>
                </v-toolbar>

                <v-divider />

                <v-card-text class="pa-4">
                  <v-tabs
                    v-model="extrasDialogTab"
                    class="soft-tabs"
                    density="comfortable"
                    color="primary"
                    grow
                  >
                    <v-tab value="general">Общее</v-tab>
                    <v-tab value="swipe">Свайпы</v-tab>
                    <v-tab value="danger">Сброс</v-tab>
                  </v-tabs>

                  <div class="mt-4">
                    <v-window v-model="extrasDialogTab">
                      <v-window-item value="general">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
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
                              v-model="settingsStore.appSettings.autoSaveFormDrafts"
                              label="Автосохранение черновиков"
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
                            <v-switch
                              v-model="settingsStore.appSettings.compactMode"
                              label="Компактный режим"
                              color="primary"
                              inset
                              @change="updateAppSettings"
                            />

                            <v-divider class="my-4" />

                            <v-text-field
                              v-model="settingsStore.appSettings.detailsTabLabel"
                              label="Название вкладки “Детали”"
                              variant="outlined"
                              density="comfortable"
                              class="mt-2"
                              @update:modelValue="updateAppSettings"
                            />
                          </v-card-text>
                        </v-card>
                      </v-window-item>

                      <v-window-item value="swipe">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
                            <div class="text-subtitle-2 mb-2">Поведение правого свайпа</div>

                            <v-switch
                              v-model="settingsStore.appSettings.swipeRightActions.resetMiniCalendar"
                              label="Сброс мини-календаря на текущий день"
                              color="primary"
                              inset
                              @change="updateAppSettings"
                            />
                            <v-switch
                              v-model="settingsStore.appSettings.swipeRightActions.closeFullCalendar"
                              label="Закрытие большого календаря"
                              color="primary"
                              inset
                              @change="updateAppSettings"
                            />
                            <v-switch
                              v-model="settingsStore.appSettings.swipeRightActions.clearSearch"
                              label="Сброс поиска"
                              color="primary"
                              inset
                              @change="updateAppSettings"
                            />
                            <v-switch
                              v-model="settingsStore.appSettings.swipeRightActions.resetStatusFilter"
                              label="Сброс фильтра по статусу"
                              color="primary"
                              inset
                              @change="updateAppSettings"
                            />
                          </v-card-text>
                        </v-card>
                      </v-window-item>

                      <v-window-item value="danger">
                        <v-card class="soft-inner-card" rounded="xl" flat>
                          <v-card-text class="pa-4">
                            <p class="text-body-2 text-medium-emphasis mb-3">
                              Действия ниже затрагивают всё приложение.
                            </p>

                            <v-btn
                              color="error"
                              variant="tonal"
                              block
                              class="soft-danger-btn"
                              @click="resetAllSettings"
                            >
                              <v-icon start>mdi-refresh</v-icon>
                              Сбросить настройки
                            </v-btn>
                          </v-card-text>
                        </v-card>
                      </v-window-item>
                    </v-window>
                  </div>
                </v-card-text>
              </v-card>
            </template>
          </v-dialog>
        </v-list>
      </v-card>

      <!-- Help / FAQ -->
      <v-card class="soft-card mb-2" rounded="xl" elevation="1">
        <div class="section-label px-4 pt-4 pb-2">СПРАВКА</div>

        <v-list class="py-0" lines="two">
          <v-dialog scrollable max-width="820">
            <template #activator="{ props }">
              <v-list-item v-bind="props" class="settings-row" :min-height="56">
                <template #prepend>
                  <div class="icon-box bg-grey-lighten-4 text-grey-darken-2">
                    <v-icon size="20">mdi-help-circle-outline</v-icon>
                  </div>
                </template>

                <v-list-item-title>FAQ</v-list-item-title>
                <v-list-item-subtitle>Ответы на частые вопросы</v-list-item-subtitle>

                <template #append>
                  <v-icon class="chev">mdi-chevron-right</v-icon>
                </template>
              </v-list-item>
            </template>

            <template #default="{ isActive }">
              <v-card class="soft-dialog" rounded="xl">
                <v-toolbar flat class="soft-toolbar">
                  <v-btn icon="mdi-close" variant="text" @click="isActive.value = false" />
                  <v-toolbar-title>FAQ</v-toolbar-title>
                  <v-spacer />
                  <v-btn variant="text" @click="isActive.value = false">Готово</v-btn>
                </v-toolbar>

                <v-divider />

                <v-card-text class="pa-4">
                  <v-expansion-panels variant="accordion" class="soft-faq">
                    <v-expansion-panel v-for="(faq, index) in faqList" :key="index">
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
            </template>
          </v-dialog>
        </v-list>
      </v-card>

      <!-- Existing dialogs kept, styled -->
      <v-dialog v-model="showClientsManager" max-width="800" scrollable>
        <v-card class="soft-dialog" rounded="xl">
          <v-toolbar flat class="soft-toolbar">
            <v-btn icon="mdi-close" variant="text" @click="showClientsManager = false" />
            <v-toolbar-title>Клиенты</v-toolbar-title>
            <v-spacer />
            <v-btn variant="text" @click="showClientsManager = false">Готово</v-btn>
          </v-toolbar>

          <v-divider />

          <v-card-text class="pa-0">
            <v-list class="py-0">
              <v-list-item
                v-for="client in clientsStore.getRecentClients(50)"
                :key="client.id"
                class="settings-row"
                :min-height="56"
              >
                <v-list-item-title>{{ client.name }}</v-list-item-title>
                <v-list-item-subtitle>{{ client.phone }} • {{ client.totalOrders }} заказов</v-list-item-subtitle>

                <template #append>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    @click="deleteClient(client.phone)"
                    aria-label="Удалить клиента"
                  />
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-dialog>

      <v-dialog v-model="templateDialog.show" max-width="520">
        <v-card class="soft-dialog" rounded="xl">
          <v-toolbar flat class="soft-toolbar">
            <v-btn icon="mdi-close" variant="text" @click="templateDialog.show = false" />
            <v-toolbar-title>
              {{ templateDialog.isEdit ? 'Редактировать' : 'Добавить' }} шаблон
            </v-toolbar-title>
            <v-spacer />

            <v-menu location="bottom end" open-on-click>
              <template #activator="{ props }">
                <v-btn v-bind="props" icon="mdi-help-circle-outline" variant="text" />
              </template>

              <v-card class="pa-2" elevation="2" rounded="lg">
                <v-card-text>
                  <p class="text-body-2"><b>%имя%</b> — имя клиента</p>
                  <p class="text-body-2"><b>%цена%</b> — общая стоимость</p>
                </v-card-text>
              </v-card>
            </v-menu>
          </v-toolbar>

          <v-divider />

          <v-card-text class="pa-4">
            <v-textarea
              v-model="templateDialog.text"
              label="Текст шаблона"
              rows="4"
              auto-grow
              variant="outlined"
              density="comfortable"
            />
          </v-card-text>

          <v-card-actions class="px-4 pb-4">
            <v-spacer />
            <v-btn variant="text" @click="templateDialog.show = false">Отмена</v-btn>
            <v-btn color="primary" variant="tonal" @click="saveTemplate">Сохранить</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </div>
  </v-container>
</template>

<script setup>
import { ref, computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useThemeStore } from '@/stores/themeStore';
import { useClientsStore } from '@/stores/clientsStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useConfirmationStore } from '@/stores/confirmationStore';

// === FIREBASE AUTH ===
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '@/firebase';
import { useServiceStore } from '@/stores/serviceStore';
// =====================

const themeStore = useThemeStore();
const clientsStore = useClientsStore();
const settingsStore = useSettingsStore();
const { appSettings } = storeToRefs(settingsStore);
const confirmationStore = useConfirmationStore();
const serviceStore = useServiceStore(); // Инициализация стора услуг

const showClientsManager = ref(false);

const templateDialog = ref({
  show: false,
  isEdit: false,
  id: null,
  text: '',
});

// UI-only tabs (никакой бизнес-логики не меняют)
const statusDialogTab = ref('statuses');
const extrasDialogTab = ref('general');

// === ЛОГИКА ВХОДА/ВЫХОДА ===
const login = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (e) {
    console.error("Ошибка входа:", e);
  }
};

const logout = async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error("Ошибка выхода:", e);
  }
};
// ===========================

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
/* Layout */
.settings-page {
  min-height: 100%;
}

.settings-shell {
  max-width: 900px;
  margin: 0 auto;
}

/* Soft cards */
.soft-card {
  border: none;
  background: rgb(var(--v-theme-surface));
  box-shadow:
    0 10px 30px rgba(0, 0, 0, 0.04),
    0 2px 10px rgba(0, 0, 0, 0.03);
}

.section-label {
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(var(--v-theme-on-surface), 0.55);
}

.settings-row {
  border-radius: 16px;
}

.chev {
  opacity: 0.55;
}

/* Icon box */
.icon-box {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  display: grid;
  place-items: center;
}

/* Required fields */
.required-fields-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
}

.soft-grid :deep(.v-selection-control) {
  min-height: 44px; /* touch target */
}

/* Dialog */
.soft-dialog {
  border: none;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.14),
    0 4px 18px rgba(0, 0, 0, 0.08);
}

.soft-toolbar {
  background: rgb(var(--v-theme-surface));
}

.soft-inner-card {
  background: rgba(var(--v-theme-surface-variant), 0.35);
}

/* Tabs: soft pill style */
.soft-tabs :deep(.v-slide-group__content) {
  gap: 10px;
}

.soft-tabs :deep(.v-tab) {
  border-radius: 999px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  min-height: 44px;
}

.soft-tabs :deep(.v-tab--selected) {
  background: rgba(var(--v-theme-primary), 0.12);
}

/* Toggle group */
.soft-toggle {
  width: 100%;
  border-radius: 999px;
  background: rgba(var(--v-theme-surface-variant), 0.35);
  padding: 6px;
}

.soft-toggle :deep(.v-btn) {
  min-height: 44px;
}

/* Sync rows (original logic & disable behavior kept) */
.sync-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sync-status-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  border-radius: 14px;
  transition: background-color 0.2s;
  background: rgba(var(--v-theme-surface-variant), 0.25);
}

.sync-status-row:hover:not(.disabled-row) {
  background: rgba(var(--v-theme-primary), 0.06);
}

.disabled-row {
  opacity: 0.55;
  background: rgba(128, 128, 128, 0.10);
}

.disabled-row :deep(.v-checkbox) {
  pointer-events: none;
}

/* Danger button */
.soft-danger-btn {
  min-height: 48px;
  border-radius: 16px;
}

/* Small helpers */
.min-w-240 {
  min-width: 240px;
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
