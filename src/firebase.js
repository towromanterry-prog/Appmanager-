// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth'; // <-- Добавили

// Твои настройки из консоли
const firebaseConfig = {
  apiKey: "AIzaSyA2APD_vs6XlgfbobT2gVJYjs70wOonmec",
  authDomain: "order-manager-f31c3.firebaseapp.com",
  projectId: "order-manager-f31c3",
  storageBucket: "order-manager-f31c3.firebasestorage.app",
  messagingSenderId: "280813655301",
  appId: "1:280813655301:web:b43ed03b5d923858f2936c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); // <-- Инициализируем Auth
const googleProvider = new GoogleAuthProvider(); // <-- Провайдер Google

// Офлайн режим
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Офлайн-режим:', err.code);
});

export { db, auth, googleProvider };