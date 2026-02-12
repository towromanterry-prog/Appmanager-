// src/services/authService.js
import { auth } from './firebase';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';

function normalizeUser(u) {
  if (!u) return null;
  return {
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
  };
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const cred = await signInWithPopup(auth, provider);
    return normalizeUser(cred.user);
  } catch (e) {
    const code = e?.code || '';

    // fallback для окружений, где popup нестабилен
    if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
      await signInWithRedirect(auth, provider);
      return null; // дальше будет redirect, состояние поймаем через observer
    }

    throw e;
  }
}

export async function logout() {
  await signOut(auth);
}

export function observeAuthState(cb) {
  return onAuthStateChanged(auth, (u) => cb(normalizeUser(u)));
}