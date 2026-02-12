// src/services/firestoreCrudService.js
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query as fsQuery,
  orderBy as fsOrderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/services/firebase';

export class FirestoreCrudService {
  /**
   * @param {object} cfg
   * @param {string} cfg.collectionKey - clients | services | details | tags
   * @param {(docSnap:any)=>any} cfg.fromDoc
   * @param {(model:any)=>object} cfg.toDoc
   * @param {string=} cfg.orderByField - поле сортировки (обычно 'name')
   */
  constructor({ collectionKey, fromDoc, toDoc, orderByField = 'name' }) {
    this.collectionKey = collectionKey;
    this.fromDoc = fromDoc;
    this.toDoc = toDoc;
    this.orderByField = orderByField;
  }

  _colRef(uid) {
    if (!uid) throw new Error('UID is required');
    return collection(db, 'users', uid, this.collectionKey);
  }

  _docRef(uid, id) {
    if (!uid) throw new Error('UID is required');
    if (!id) throw new Error('Doc id is required');
    return doc(db, 'users', uid, this.collectionKey, id);
  }

  /**
   * subscribe(uid, cb, onError) -> unsubscribe()
   */
  subscribe(uid, cb, onError) {
    const q = fsQuery(this._colRef(uid), fsOrderBy(this.orderByField));
    return onSnapshot(
      q,
      (snap) => cb(snap.docs.map((d) => this.fromDoc(d))),
      onError
    );
  }

  /**
   * add(uid, model) -> newDocId
   */
  async add(uid, model) {
    const payload = {
      ...this.toDoc(model),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const res = await addDoc(this._colRef(uid), payload);
    return res.id;
  }

  /**
   * set(uid, id, model, {merge=true}) -> void
   * Удобно для clients, где id = phone и нужен merge.
   */
  async set(uid, id, model, { merge = true } = {}) {
    const payload = {
      ...this.toDoc(model),
      updatedAt: serverTimestamp(),
    };
    await setDoc(this._docRef(uid, id), payload, { merge });
  }

  /**
   * update(uid, id, patch) -> void
   */
  async update(uid, id, patch) {
    await updateDoc(this._docRef(uid, id), {
      ...patch,
      updatedAt: serverTimestamp(),
    });
  }

  /**
   * delete(uid, id) -> void
   */
  async delete(uid, id) {
    await deleteDoc(this._docRef(uid, id));
  }
}