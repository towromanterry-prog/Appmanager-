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
import { serviceItemConverter } from '../models/ServiceItem.js';

const COLLECTION_NAME = 'services'; // Или 'services_catalog'

class ServiceService {
  constructor() {
    this.collectionRef = collection(db, COLLECTION_NAME).withConverter(serviceItemConverter);
  }

  // Подписка на список услуг
  subscribe(callback) {
    // Сортируем по имени, как было в старом сторе
    const q = query(this.collectionRef, orderBy('name'));
    
    return onSnapshot(q, (snapshot) => {
      const services = snapshot.docs.map(doc => doc.data());
      callback(services);
    });
  }

  async create(serviceModel) {
    const docRef = await addDoc(this.collectionRef, serviceModel);
    const newItem = serviceModel.clone();
    newItem.id = docRef.id;
    return newItem;
  }

  async update(serviceModel) {
    if (!serviceModel.id) throw new Error('Service ID required for update');
    const docRef = doc(db, COLLECTION_NAME, serviceModel.id).withConverter(serviceItemConverter);
    await updateDoc(docRef, serviceItemConverter.toFirestore(serviceModel));
  }

  // Физическое удаление (если нужно)
  async delete(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export default new ServiceService();

