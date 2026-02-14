// src/services/clientsService.js
import { doc, setDoc } from 'firebase/firestore';

import { FirestoreCrudService } from './firestoreCrudService';
import { db } from '@/services/firebase';
import { ClientModel } from '@/models/ClientModel';

export const clientsService = new FirestoreCrudService({
  collectionKey: 'clients',
  orderByField: 'name',
  fromDoc: (docSnap) => ClientModel.fromFirestore(docSnap),
  toDoc: (model) => new ClientModel(model).toFirestore(),
});

/**
 * setClientByIdMerge
 * ЖЕСТКОЕ ТРЕБОВАНИЕ:
 * - вместо setClientByPhoneMerge
 * - внутри используем напрямую setDoc(..., { merge: true })
 * - FirestoreCrudService.set() не используем
 */
export async function setClientByIdMerge(uid, clientId, payload) {
  if (!uid) throw new Error('setClientByIdMerge: uid is required');
  if (!clientId) throw new Error('setClientByIdMerge: clientId is required');

  const model = new ClientModel({ ...payload, id: clientId });

  const ref = doc(db, 'users', uid, 'clients', clientId);

  // offline-first: запись отправляем в фоне
  setDoc(ref, model.toFirestore(), { merge: true }).catch((e) => {
    console.error('Ошибка фоновой синхронизации клиента:', e);
  });

  return clientId;
}