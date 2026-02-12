// document/Order.js
import { Timestamp } from 'firebase/firestore';

export default class Order {
  constructor({
    id = null,
    clientName = '',
    clientId = null,
    deviceModel = '',
    problemDescription = '',
    estimatedCost = 0,
    status = 'new',
    priority = 'normal',
    deadline = null,
    createdAt = new Date(),
    updatedAt = new Date(),
    tags = [],
    photos = [],
    services = [],
    details = [] 
  } = {}) {
    this.id = id;
    this.clientName = clientName;
    this.clientId = clientId;
    this.deviceModel = deviceModel;
    this.problemDescription = problemDescription;
    this.estimatedCost = estimatedCost;
    this.status = status;
    this.priority = priority;
    this.deadline = deadline ? new Date(deadline) : null;
    this.createdAt = createdAt ? new Date(createdAt) : new Date();
    this.updatedAt = updatedAt ? new Date(updatedAt) : new Date();
    this.tags = Array.isArray(tags) ? tags : [];
    this.photos = Array.isArray(photos) ? photos : [];
    
    // ИНИЦИАЛИЗАЦИЯ МАССИВОВ
    this.services = Array.isArray(services) ? services : [];
    this.details = Array.isArray(details) ? details : [];
  }

  // Метод для клонирования заказа (полезно при редактировании)
  clone() {
    return new Order({
      ...this,
      deadline: this.deadline ? new Date(this.deadline) : null,
      createdAt: this.createdAt ? new Date(this.createdAt) : null,
      updatedAt: this.updatedAt ? new Date(this.updatedAt) : null,
      tags: [...this.tags],
      photos: [...this.photos],
      services: [...this.services],
      details: [...this.details]
    });
  }
}

// Конвертер Firestore
export const orderConverter = {
  toFirestore: (order) => {
    return {
      clientName: order.clientName,
      clientId: order.clientId,
      deviceModel: order.deviceModel,
      problemDescription: order.problemDescription,
      estimatedCost: order.estimatedCost,
      status: order.status,
      priority: order.priority,
      deadline: order.deadline ? Timestamp.fromDate(order.deadline) : null,
      createdAt: order.createdAt ? Timestamp.fromDate(order.createdAt) : Timestamp.now(),
      updatedAt: Timestamp.now(),
      tags: order.tags,
      photos: order.photos,
      services: order.services, // Убеждаемся, что улетает в базу
      details: order.details    // Убеждаемся, что улетает в базу
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new Order({
      id: snapshot.id,
      ...data,
      deadline: data.deadline?.toDate() || null,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      // Гарантируем, что если поле пустое в БД, будет пустой массив
      services: data.services || [],
      details: data.details || []
    });
  }
};
