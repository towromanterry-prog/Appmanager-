import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { detailItemConverter } from '../models/DetailItem';

const COLLECTION_NAME = 'details'; // Или 'users/{uid}/details' если нужно разделение

class DetailService {
  constructor() {
    this.collectionRef = collection(db, COLLECTION_NAME).withConverter(detailItemConverter);
  }

  subscribe(callback) {
    // Сортировка по имени
    const q = query(this.collectionRef, orderBy('name'));
    
    return onSnapshot(q, (snapshot) => {
      const details = snapshot.docs.map(doc => doc.data());
      callback(details);
    });
  }

  async create(detailModel) {
    const docRef = await addDoc(this.collectionRef, detailModel);
    const newItem = detailModel.clone();
    newItem.id = docRef.id;
    return newItem;
  }

  async update(detailModel) {
    if (!detailModel.id) throw new Error('Detail ID required for update');
    const docRef = doc(db, COLLECTION_NAME, detailModel.id).withConverter(detailItemConverter);
    await updateDoc(docRef, detailItemConverter.toFirestore(detailModel));
  }

  async delete(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export default new DetailService();

