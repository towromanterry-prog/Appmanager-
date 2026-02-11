import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { tagConverter } from '../models/Tag';

const COLLECTION_NAME = 'tags';

class TagService {
  constructor() {
    this.collectionRef = collection(db, COLLECTION_NAME).withConverter(tagConverter);
  }

  subscribe(callback) {
    return onSnapshot(this.collectionRef, (snapshot) => {
      const tags = snapshot.docs.map(doc => doc.data());
      callback(tags);
    });
  }

  async create(tagModel) {
    return await addDoc(this.collectionRef, tagModel);
  }

  async delete(id) {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  }
}

export default new TagService();

