// src/services/orderService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/services/firebase';
import { OrderModel } from '@/models/OrderModel';

function ordersColRef(uid) {
  if (!uid) throw new Error('orderService: uid is required');
  return collection(db, 'users', uid, 'orders');
}

function orderDocRef(uid, orderId) {
  if (!uid) throw new Error('orderService: uid is required');
  if (!orderId) throw new Error('orderService: orderId is required');
  return doc(db, 'users', uid, 'orders', orderId);
}

export const orderService = {
  /**
   * Create: генерируем ID локально, сохраняем в фоне (offline-first)
   */
  async create(uid, payload) {
    const model = payload instanceof OrderModel ? payload : new OrderModel(payload);

    const data = model.toFirestore();
    data.createdAt = data.createdAt ?? serverTimestamp();
    data.updatedAt = serverTimestamp();

    // 1. Генерируем ссылку и ID документа синхронно
    const newRef = doc(ordersColRef(uid));

    // 2. Отправляем запрос в кэш/сеть в фоне, НЕ блокируя выполнение через await
    setDoc(newRef, data).catch((err) => {
      console.error('Ошибка фоновой синхронизации create:', err);
    });

    // 3. Сразу возвращаем оптимистичную модель для UI
    return new OrderModel({
      id: newRef.id,
      ...data,
      // Подменяем маркеры сервера на локальное время, чтобы не было проблем с отображением до синхронизации
      createdAt: new Date(), 
      updatedAt: new Date(),
    });
  },

  /**
   * Upsert: setDoc с merge в фоне
   */
  async upsert(uid, orderId, payload) {
    const model = payload instanceof OrderModel ? payload : new OrderModel({ id: orderId, ...payload });

    const data = model.toFirestore();
    data.updatedAt = serverTimestamp();
    if (!data.createdAt) data.createdAt = serverTimestamp();

    const ref = orderDocRef(uid, orderId);

    // Выполняем запись в фоне
    setDoc(ref, data, { merge: true }).catch((err) => {
      console.error('Ошибка фоновой синхронизации upsert:', err);
    });

    return new OrderModel({
      id: orderId,
      ...data,
      updatedAt: new Date(),
      ...(data.createdAt ? {} : { createdAt: new Date() })
    });
  },

  /**
   * Update: частичный updateDoc в фоне
   */
  async update(uid, orderId, patch) {
    // Подготавливаем данные через модель, чтобы отсечь лишнее
    const model = new OrderModel({ id: orderId, ...patch });
    const normalized = model.toFirestore();

    const out = {};
    for (const key of Object.keys(patch)) {
      out[key] = Object.prototype.hasOwnProperty.call(normalized, key)
        ? normalized[key]
        : patch[key];
    }
    out.updatedAt = serverTimestamp();

    const ref = orderDocRef(uid, orderId);

    // Выполняем частичное обновление в фоне
    updateDoc(ref, out).catch((err) => {
      console.error('Ошибка фоновой синхронизации update:', err);
    });

    return new OrderModel({ id: orderId, ...patch });
  },

  /**
   * Remove: удаление в фоне
   */
  async remove(uid, orderId) {
    const ref = orderDocRef(uid, orderId);
    
    // Удаляем в фоне
    deleteDoc(ref).catch((err) => {
      console.error('Ошибка фоновой синхронизации remove:', err);
    });
  },

  /**
   * GetById: прямое чтение (в оффлайне достанет из кэша, если он там есть)
   */
  async getById(uid, orderId) {
    try {
      const snap = await getDoc(orderDocRef(uid, orderId));
      return snap.exists() ? OrderModel.fromFirestore(snap) : null;
    } catch (err) {
      console.error('Ошибка чтения getById (возможно, нет сети и кэша):', err);
      return null;
    }
  },

  /**
   * List: разовая загрузка
   */
  async list(uid, { status = null } = {}) {
    let q = query(ordersColRef(uid), orderBy('date', 'desc'));

    if (status && status !== 'all') {
      q = query(ordersColRef(uid), where('status', '==', status), orderBy('date', 'desc'));
    }

    try {
      const snap = await getDocs(q);
      return snap.docs.map((d) => OrderModel.fromFirestore(d));
    } catch (err) {
      console.error('Ошибка загрузки list:', err);
      return [];
    }
  },

  /**
   * Realtime: подписка на все заказы.
   * onSnapshot отлично работает в оффлайне, отдавая данные из локального кэша IndexedDB.
   */
  subscribe(uid, { onChange, onError } = {}) {
    const q = query(ordersColRef(uid), orderBy('date', 'desc'));

    return onSnapshot(
      q,
      // Включаем реакцию на локальные изменения (pending writes) до их отправки на сервер
      { includeMetadataChanges: true },
      (snap) => {
        const orders = snap.docs.map((d) => OrderModel.fromFirestore(d));
        onChange?.(orders, snap);
      },
      (err) => onError?.(err),
    );
  },
};
