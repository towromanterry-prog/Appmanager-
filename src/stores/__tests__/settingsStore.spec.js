import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useSettingsStore } from '../settingsStore';

// Mock Firebase
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  setDoc: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe function
  getFirestore: vi.fn(),
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('@/firebase', () => ({
  db: {},
  auth: {},
}));

describe('Settings Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // Clear localStorage mock if needed
    localStorage.clear();
  });

  it('initializes with default settings', () => {
    const store = useSettingsStore();
    expect(store.appSettings.baseFontSize).toBe(16);
    expect(store.appSettings.defaultOrderStatus).toBe('accepted');
  });

  it('normalizes settings correctly (removes deprecated keys)', () => {
    const store = useSettingsStore();
    store.updateAppSettings({ compactMode: true, autoSaveFormDrafts: true });

    expect(store.appSettings.compactMode).toBeUndefined();
    expect(store.appSettings.autoSaveFormDrafts).toBeUndefined();
  });

  it('migrates syncOrderToServiceStatus from string to object', () => {
    const store = useSettingsStore();

    // Simulate loading old settings
    store.updateAppSettings({ syncOrderToServiceStatus: 'confirm' });

    const sync = store.appSettings.syncOrderToServiceStatus;
    expect(typeof sync).toBe('object');
    expect(sync.in_progress.enabled).toBe(true);
    expect(sync.in_progress.confirm).toBe(true);
    expect(sync.completed.enabled).toBe(true);
    expect(sync.completed.confirm).toBe(true);
  });

  it('merges settings correctly without losing defaults', () => {
    const store = useSettingsStore();
    const originalSize = store.appSettings.baseFontSize;

    store.updateAppSettings({ showCompletedOrders: false });

    expect(store.appSettings.showCompletedOrders).toBe(false);
    expect(store.appSettings.baseFontSize).toBe(originalSize); // Default preserved
  });

  it('manages message templates', () => {
    const store = useSettingsStore();

    store.addMessageTemplate('Hello');
    expect(store.appSettings.messageTemplates.length).toBe(1);
    expect(store.appSettings.messageTemplates[0].text).toBe('Hello');

    const id = store.appSettings.messageTemplates[0].id;
    store.updateMessageTemplate(id, 'Hi');
    expect(store.appSettings.messageTemplates[0].text).toBe('Hi');

    store.deleteMessageTemplate(id);
    expect(store.appSettings.messageTemplates.length).toBe(0);
  });
});
