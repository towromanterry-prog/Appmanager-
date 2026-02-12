// src/models/SettingsModel.js

export const DEFAULT_THEME = 'light';

export const DEFAULT_APP_SETTINGS = {
  orderStatuses: { accepted: true, in_progress: true, completed: true, delivered: true },
  serviceStatuses: { accepted: true, in_progress: true, completed: true },
  detailStatuses: { accepted: true, in_progress: true, completed: true },
  additionalStatusName: 'Ждет запчасти',
  defaultOrderStatus: 'accepted',
  baseFontSize: 16,
  syncServiceToOrderStatus: { completed: true },
  syncOrderToServiceStatus: {
    completed: { enabled: true, confirm: true },
    in_progress: { enabled: false, confirm: false },
  },
  messageTemplates: [],
  detailsTabLabel: 'Детали',
  orderFormLastNameLabel: 'Фамилия',
  // UI настройки
  compactMode: false,
  showCompletedOrders: true,
  swipeRightActions: {
    resetMiniCalendar: true,
    closeFullCalendar: true,
    clearSearch: true,
    resetStatusFilter: true,
  },
  miniCalendarIndicatorStatuses: ['in_progress'],
  fullCalendarIndicatorStatuses: ['in_progress', 'deadline'],
  enableHapticFeedback: true,
  enablePullToRefresh: true,
  autoSaveFormDrafts: true,
};

export const DEFAULT_REQUIRED_FIELDS = {
  clientName: true,
  phone: false,
  services: false,
  deadline: false,
  notes: false,
  details: false,
  lastName: false,
};

function safeObject(v) {
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
}

function mergeShallow(defaults, incoming) {
  const inc = safeObject(incoming);
  if (!inc) return { ...defaults };
  return { ...defaults, ...inc };
}

function normalizeTheme(v) {
  return v === 'dark' ? 'dark' : 'light';
}

export class SettingsModel {
  constructor({
    theme = DEFAULT_THEME,
    requiredFields = DEFAULT_REQUIRED_FIELDS,
    appSettings = DEFAULT_APP_SETTINGS,
  } = {}) {
    this.theme = normalizeTheme(theme);
    this.requiredFields = mergeShallow(DEFAULT_REQUIRED_FIELDS, requiredFields);
    this.appSettings = mergeShallow(DEFAULT_APP_SETTINGS, appSettings);
  }

  toFirestore() {
    return {
      theme: normalizeTheme(this.theme),
      requiredFields: this.requiredFields,
      appSettings: this.appSettings,
    };
  }

  static fromFirestore(data) {
    const d = safeObject(data) || {};
    return new SettingsModel({
      theme: normalizeTheme(d.theme),
      requiredFields: mergeShallow(DEFAULT_REQUIRED_FIELDS, d.requiredFields),
      appSettings: mergeShallow(DEFAULT_APP_SETTINGS, d.appSettings),
    });
  }

  static defaults() {
    return new SettingsModel();
  }
}