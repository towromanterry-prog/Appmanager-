// src/composables/useHapticFeedback.js
import { useSettingsStore } from '@/stores/settingsStore';

export function useHapticFeedback() {
  const settingsStore = useSettingsStore();

  const triggerHapticFeedback = (type) => {
    if (settingsStore.appSettings.enableHapticFeedback && window.navigator && 'vibrate' in window.navigator) {
      switch (type) {
        case 'tap':
          window.navigator.vibrate(20);
          break;
        case 'swipe':
          window.navigator.vibrate(50);
          break;
        case 'important':
          window.navigator.vibrate([30, 50, 30]);
          break;
        default:
          // По умолчанию легкая вибрация
          window.navigator.vibrate(20);
          break;
      }
    }
  };

  return {
    triggerHapticFeedback,
  };
}
