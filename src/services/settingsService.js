// src/services/settingsService.js
import { doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { SettingsModel } from '@/models/SettingsModel';

function settingsDocRef(uid) {
  return doc(db, 'users', uid, 'settings', 'general');
}

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

export async function updateSettings(uid, data) {
  if (!uid) throw new Error('settingsService.updateSettings: uid is required');
  const ref = settingsDocRef(uid);

  if (data instanceof SettingsModel) {
    return setDoc(ref, data.toFirestore(), { merge: true });
  }

  const patch = data || {};
  const keys = Object.keys(patch);
  if (keys.length === 0) return;

  const hasDottedKeys = keys.some((k) => k.includes('.'));

  if (!hasDottedKeys) {
    // ОДНА операция
    return setDoc(ref, patch, { merge: true });
  }

  // dotted keys: сначала пробуем updateDoc, а setDoc делаем только если документа нет
  try {
    return await updateDoc(ref, patch);
  } catch (e) {
    const code = e?.code || '';
    const msg = String(e?.message || '');
    const looksNotFound = code === 'not-found' || msg.toLowerCase().includes('no document');

    if (!looksNotFound) throw e;

    await setDoc(ref, {}, { merge: true });
    return updateDoc(ref, patch);
  }
}

export async function setAllSettings(uid, data) {
  if (!uid) throw new Error('settingsService.setAllSettings: uid is required');
  const ref = settingsDocRef(uid);

  const payload = data instanceof SettingsModel ? data.toFirestore() : data;
  return setDoc(ref, payload);
}