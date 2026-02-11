import { db } from '../firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { clientConverter } from '../models/Client';

const COLLECTION_NAME = 'clients';

class ClientService {
  constructor() {
    this.collectionRef = collection(db, COLLECTION_NAME).withConverter(clientConverter);
  }

  subscribe(callback) {
    const q = query(this.collectionRef, orderBy('name', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const clients = snapshot.docs.map(doc => doc.data());
      callback(clients);
    });
  }

  async create(clientModel) {
    const docRef = await addDoc(this.collectionRef, clientModel);
    const newClient = clientModel.clone();
    newClient.id = docRef.id;
    return newClient;
  }

  async update(clientModel) {
    if (!clientModel.id) throw new Error('Client ID is required');
    const docRef = doc(db, COLLECTION_NAME, clientModel.id).withConverter(clientConverter);
    await updateDoc(docRef, clientConverter.toFirestore(clientModel));
  }

  async delete(id) {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export default new ClientService();

