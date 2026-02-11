import { Timestamp } from 'firebase/firestore';

export class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.clientId = data.clientId || null;
    this.clientName = data.clientName || '';
    this.lastName = data.lastName || '';
    this.phone = data.phone || '';
    
    // Массивы объектов
    this.services = (data.services || []).map(s => ({ ...s })); 
    this.details = (data.details || []).map(d => ({ ...d }));
    
    // Даты: Приводим Firestore Timestamp или String к JS Date
    this.deadline = this._parseDate(data.deadline);
    this.createDate = this._parseDate(data.createDate) || new Date();
    
    this.status = data.status || 'accepted';
    this.notes = data.notes || '';
    this.totalAmount = Number(data.totalAmount) || 0;
  }

  _parseDate(value) {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value === 'string') return new Date(value);
    return null;
  }

  // Глубокое копирование
  clone() {
    return new Order({
      ...this,
      services: this.services.map(s => ({ ...s })),
      details: this.details.map(d => ({ ...d })),
      deadline: this.deadline ? new Date(this.deadline) : null,
      createDate: this.createDate ? new Date(this.createDate) : null
    });
  }
}
