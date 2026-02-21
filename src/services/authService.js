import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth } from '@/services/firebase'; // Проверьте правильность пути к вашему firebase.js

// Отслеживание состояния пользователя
export const observeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Обычный вход через Google (без календаря)
export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Ошибка авторизации Google:", error);
    throw error;
  }
};

// Выход
export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Ошибка при выходе:", error);
    throw error;
  }
};
