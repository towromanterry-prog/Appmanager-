// src/services/clientsService.js
import { FirestoreCrudService } from './firestoreCrudService';
import { ClientModel } from '@/models/ClientModel';

export const clientsService = new FirestoreCrudService({
  collectionKey: 'clients',
  orderByField: 'name',
  fromDoc: (docSnap) => ClientModel.fromFirestore(docSnap),
  toDoc: (model) => new ClientModel(model).toFirestore(),
});

// 1-в-1 как раньше: docId = phone, setDoc(..., {merge:true}) 7
export async function setClientByPhoneMerge(uid, phone, payload) {
  const model = new ClientModel({ ...payload, phone, id: phone });
  await clientsService.set(uid, phone, model, { merge: true });
  return phone;
}