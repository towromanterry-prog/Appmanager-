// src/services/tagsService.js
import { FirestoreCrudService } from './firestoreCrudService';
import { TagModel } from '@/models/TagModel';

export const tagsService = new FirestoreCrudService({
  collectionKey: 'tags',
  orderByField: 'name',
  fromDoc: (docSnap) => TagModel.fromFirestore(docSnap),
  toDoc: (model) => new TagModel(model).toFirestore(),
});