// src/services/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Временно хардкод, как у тебя (потом поменяешь ключи / вынесешь в env)
const firebaseConfig = {
  apiKey: "AIzaSyA2APD_vs6XlgfbobT2gVJYjs70wOonmec",
  authDomain: "order-manager-f31c3.firebaseapp.com",
  projectId: "order-manager-f31c3",
  storageBucket: "order-manager-f31c3.firebasestorage.app",
  messagingSenderId: "280813655301",
  appId: "1:280813655301:web:b43ed03b5d923858f2936c"
};

export const firebaseApp = initializeApp(firebaseConfig);

export const db = getFirestore(firebaseApp);
export const auth = getAuth(firebaseApp);

// Офлайн режим (как у тебя)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Офлайн-режим:', err?.code || err);
});