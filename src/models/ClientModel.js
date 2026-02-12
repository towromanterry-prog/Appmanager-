// src/models/ClientModel.js
export class ClientModel {
  constructor({
    id,
    name = '',
    lastName = '',
    phone = '',
    notes = '',
    favoriteServices = [],
    lastOrderDate = null,
    totalOrders = 0,
    history = [],
    isArchived = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id ?? phone ?? '';
    this.name = name;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
    this.favoriteServices = Array.isArray(favoriteServices) ? favoriteServices : [];
    this.lastOrderDate = lastOrderDate;
    this.totalOrders = Number(totalOrders || 0);
    this.history = Array.isArray(history) ? history : [];
    this.isArchived = !!isArchived; // добавили, дефолт false
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new ClientModel({
      id: docSnap.id,
      ...data,
      phone: data.phone || docSnap.id,
      isArchived: !!data.isArchived,
    });
  }

  toFirestore() {
    return {
      name: this.name,
      lastName: this.lastName,
      phone: this.phone,
      notes: this.notes,
      favoriteServices: this.favoriteServices,
      lastOrderDate: this.lastOrderDate,
      totalOrders: this.totalOrders,
      history: this.history,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}