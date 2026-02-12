// src/services/orderService.js
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
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
   * Create: добавляем doc + выставляем createdAt/updatedAt на сервере
   */
  async create(uid, payload) {
    const model = payload instanceof OrderModel ? payload : new OrderModel(payload);

    const data = model.toFirestore();
    data.createdAt = data.createdAt ?? serverTimestamp();
    data.updatedAt = serverTimestamp();

    const ref = await addDoc(ordersColRef(uid), data);
    const snap = await getDoc(ref);
    return OrderModel.fromFirestore(snap);
  },

  /**
   * Upsert: setDoc с merge
   */
  async upsert(uid, orderId, payload) {
    const model = payload instanceof OrderModel ? payload : new OrderModel({ id: orderId, ...payload });

    const data = model.toFirestore();
    data.updatedAt = serverTimestamp();
    if (!data.createdAt) data.createdAt = serverTimestamp();

    await setDoc(orderDocRef(uid, orderId), data, { merge: true });
    const snap = await getDoc(orderDocRef(uid, orderId));
    return OrderModel.fromFirestore(snap);
  },

  /**
   * Update: частичный updateDoc
   */
  async update(uid, orderId, patch) {
    const data = { ...patch, updatedAt: serverTimestamp() };

    // Если в patch есть даты как Date/ISO — конвертим через модель
    const model = new OrderModel({ id: orderId, ...patch });
    const normalized = model.toFirestore();

    // ВАЖНО: берём только те поля, которые действительно пришли в patch
    // чтобы не перетирать остальное null-ами
    const out = {};
    for (const key of Object.keys(patch)) {
      out[key] = normalized[key];
    }
    out.updatedAt = serverTimestamp();

    await updateDoc(orderDocRef(uid, orderId), out);
    const snap = await getDoc(orderDocRef(uid, orderId));
    return OrderModel.fromFirestore(snap);
  },

  async remove(uid, orderId) {
    await deleteDoc(orderDocRef(uid, orderId));
  },

  async getById(uid, orderId) {
    const snap = await getDoc(orderDocRef(uid, orderId));
    return snap.exists() ? OrderModel.fromFirestore(snap) : null;
  },

  /**
   * List: разовая загрузка (если нужно)
   */
  async list(uid, { status = null } = {}) {
    let q = query(ordersColRef(uid), orderBy('date', 'desc'));

    if (status && status !== 'all') {
      q = query(ordersColRef(uid), where('status', '==', status), orderBy('date', 'desc'));
    }

    const snap = await getDocs(q);
    return snap.docs.map((d) => OrderModel.fromFirestore(d));
  },

  /**
   * Realtime: подписка на все заказы.
   * Возвращает unsubscribe().
   */
  subscribe(uid, { onChange, onError } = {}) {
    // Сортируем так, как чаще всего нужно UI (последние сверху)
    const q = query(ordersColRef(uid), orderBy('date', 'desc'));

    return onSnapshot(
      q,
      (snap) => {
        const orders = snap.docs.map((d) => OrderModel.fromFirestore(d));
        onChange?.(orders, snap);
      },
      (err) => onError?.(err),
    );
  },
};