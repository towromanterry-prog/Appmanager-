// src/services/servicesService.js
import { FirestoreCrudService } from './firestoreCrudService';
import { ServiceModel } from '@/models/ServiceModel';

export const servicesService = new FirestoreCrudService({
  collectionKey: 'services',
  orderByField: 'name',
  fromDoc: (docSnap) => ServiceModel.fromFirestore(docSnap),
  toDoc: (model) => new ServiceModel(model).toFirestore(),
});