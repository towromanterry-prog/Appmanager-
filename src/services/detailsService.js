// src/services/detailsService.js
import { FirestoreCrudService } from './firestoreCrudService';
import { DetailModel } from '@/models/DetailModel';

export const detailsService = new FirestoreCrudService({
  collectionKey: 'details',
  orderByField: 'name',
  fromDoc: (docSnap) => DetailModel.fromFirestore(docSnap),
  toDoc: (model) => new DetailModel(model).toFirestore(),
});