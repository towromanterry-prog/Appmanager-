import { Timestamp } from 'firebase/firestore';

export default class Order {
  constructor({
    id = null,
    clientName = '',
    clientId = null,
    description = '',
    price = 0,
    status = 'pending', // pending, in_progress, done, paid
    deadline = new Date(),
    createdAt = new Date(),
    serviceType = '',
    tags = [],
    photos = []
  } = {}) {
    this.id = id;
    this.clientName = clientName;
    this.clientId = clientId;
    this.description = description;
    this.price = Number(price);
    this.status = status;
    this.serviceType = serviceType;
    this.tags = Array.isArray(tags) ? tags : [];
    this.photos = Array.isArray(photos) ? photos : [];

    // Безопасная конвертация дат
    this.deadline = this._convertDate(deadline);
    this.createdAt = this._convertDate(createdAt);
  }

  _convertDate(dateValue) {
    if (!dateValue) return new Date();
    if (dateValue instanceof Timestamp) return dateValue.toDate();
    if (typeof dateValue === 'string' || typeof dateValue === 'number') return new Date(dateValue);
    return dateValue;
  }

  // Метод для клонирования объекта (чтобы не мутировать состояние напрямую)
  clone() {
    return new Order({
      ...this,
      tags: [...this.tags],
      photos: [...this.photos],
      deadline: new Date(this.deadline), // Копия даты
      createdAt: new Date(this.createdAt)
    });
  }
}

// Конвертер для Firestore
export const orderConverter = {
  toFirestore: (order) => {
    const data = {
      clientName: order.clientName,
      clientId: order.clientId,
      description: order.description,
      price: Number(order.price),
      status: order.status,
      serviceType: order.serviceType,
      tags: order.tags,
      photos: order.photos,
      deadline: Timestamp.fromDate(order.deadline),
      createdAt: Timestamp.fromDate(order.createdAt)
    };
    return data;
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Order({
      id: snapshot.id,
      ...data
    });
  }
};
