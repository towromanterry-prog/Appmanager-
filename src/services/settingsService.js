// src/services/settingsService.js

import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase'; // если у тебя файл лежит иначе — поправь путь импорта
import { SettingsModel } from '@/models/SettingsModel';

function settingsDocRef(uid) {
  return doc(db, 'users', uid, 'settings', 'general');
}

/**
 * Подписка на users/{uid}/settings/general
 * @param {string} uid
 * @param {(model: SettingsModel, raw: any) => void} onChange
 * @param {(err: any) => void} [onError]
 * @returns {() => void} unsubscribe
 */
export function init(uid, onChange, onError) {
  if (!uid) throw new Error('settingsService.init: uid is required');
  const ref = settingsDocRef(uid);

  return onSnapshot(
    ref,
    (snap) => {
      const raw = snap.exists() ? snap.data() : {};
      const model = SettingsModel.fromFirestore(raw);
      onChange?.(model, raw);
    },
    (err) => onError?.(err),
  );
}

/**
 * Частичное обновление.
 * - Если ключи с точкой (например "appSettings.baseFontSize") — используем updateDoc
 * - Иначе setDoc(..., { merge: true })
 */
export async function updateSettings(uid, data) {
  if (!uid) throw new Error('settingsService.updateSettings: uid is required');
  const ref = settingsDocRef(uid);

  // Если передали целиком модель — сохраняем все поля
  if (data instanceof SettingsModel) {
    return setDoc(ref, data.toFirestore(), { merge: true });
  }

  const patch = data || {};
  const keys = Object.keys(patch);
  if (keys.length === 0) return;

  const hasDottedKeys = keys.some((k) => k.includes('.'));

  if (hasDottedKeys) {
    // updateDoc требует существующий документ — гарантируем наличие
    await setDoc(ref, {}, { merge: true });
    return updateDoc(ref, patch);
  }

  return setDoc(ref, patch, { merge: true });
}