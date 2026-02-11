import { Timestamp } from 'firebase/firestore';

export default class Client {
  constructor({
    id = null,
    name = '',
    phone = '',
    notes = '',
    createdAt = new Date()
  } = {}) {
    this.id = id;
    this.name = name;
    this.phone = phone;
    this.notes = notes;
    
    // Обработка даты
    this.createdAt = createdAt instanceof Timestamp ? createdAt.toDate() : new Date(createdAt);
  }

  clone() {
    return new Client({ ...this });
  }
}

export const clientConverter = {
  toFirestore: (client) => ({
    name: client.name,
    phone: client.phone,
    notes: client.notes,
    createdAt: Timestamp.fromDate(client.createdAt)
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Client({ id: snapshot.id, ...data });
  }
};
