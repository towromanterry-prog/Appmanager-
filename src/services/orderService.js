import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { orderConverter } from '../models/Order';

const COLLECTION_NAME = 'orders';

class OrderService {
  constructor() {
    this.collectionRef = collection(db, COLLECTION_NAME).withConverter(orderConverter);
  }

  // Получить все заказы (одноразово)
  async getAll() {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

  // Подписка на обновления в реальном времени
  subscribe(callback) {
    const q = query(this.collectionRef, orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      callback(orders);
    });
    return unsubscribe; // Возвращаем функцию отписки
  }

  async create(orderModel) {
    const docRef = await addDoc(this.collectionRef, orderModel);
    // Возвращаем объект с присвоенным ID
    const newOrder = orderModel.clone();
    newOrder.id = docRef.id;
    return newOrder;
  }

  async update(orderModel) {
    if (!orderModel.id) throw new Error('Order ID is required for update');
    const docRef = doc(db, COLLECTION_NAME, orderModel.id).withConverter(orderConverter);
    // toFirestore вызывается автоматически конвертером, но updateDoc требует plain object иногда,
    // если мы хотим обновить только часть полей. Но с конвертером проще передать весь объект.
    await updateDoc(docRef, orderConverter.toFirestore(orderModel));
    return orderModel;
  }

  async delete(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return id;
  }
}

export default new OrderService();
