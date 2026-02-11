import { collection, onSnapshot, doc, setDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { Order } from '@/models/Order';

const converter = {
  toFirestore: (o) => o.toFirestore(),
  fromFirestore: (s, op) => new Order({ id: s.id, ...s.data(op) })
};

export const OrderService = {
  subscribe(userId, onData) {
    const q = query(collection(db, 'users', userId, 'orders').withConverter(converter), orderBy('createDate', 'desc'));
    return onSnapshot(q, (s) => onData(s.docs.map(d => d.data())));
  },
  async save(userId, order) {
    const id = order.id || Date.now().toString();
    await setDoc(doc(db, 'users', userId, 'orders', id).withConverter(converter), order);
  }
};

