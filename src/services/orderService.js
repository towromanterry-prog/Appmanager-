import { db } from '@/firebase';
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, 
  query, orderBy 
} from 'firebase/firestore';
import { Order } from '@/models/Order';
import { createConverter } from './baseService';

const COLLECTION_NAME = 'orders';
const converter = createConverter(Order);

export const orderService = {
  subscribeToOrders(onData, onError) {
    const q = query(collection(db, COLLECTION_NAME), orderBy('createDate', 'desc'));
    
    return onSnapshot(q.withConverter(converter), (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());
      onData(orders);
    }, (error) => {
      if (onError) onError(error);
    });
  },

  async addOrder(order) {
    const colRef = collection(db, COLLECTION_NAME).withConverter(converter);
    // Используем конвертер, который сам вызовет stripReactivity
    await addDoc(colRef, order);
  },

  async updateOrder(order) {
    if (!order.id) throw new Error('Order ID is missing');
    const docRef = doc(db, COLLECTION_NAME, order.id).withConverter(converter);
    // Важно: toFirestore вызывается автоматически внутри updateDoc если передан instance,
    // но updateDoc часто требует plain object. 
    // Наш createConverter.toFirestore делает это.
    await updateDoc(docRef, converter.toFirestore(order));
  },

  async deleteOrder(orderId) {
    const docRef = doc(db, COLLECTION_NAME, orderId);
    await deleteDoc(docRef);
  }
};
