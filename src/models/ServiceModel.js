// src/models/ServiceModel.js

export class ServiceModel {
  constructor({
    id,
    name = '',
    defaultPrice = 0,
    isArchived = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id ?? '';
    this.name = name;
    this.defaultPrice = Number(defaultPrice || 0);
    this.isArchived = !!isArchived;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new ServiceModel({
      id: docSnap.id,
      ...data,
      isArchived: !!data.isArchived,
    });
  }

  toFirestore() {
    return {
      name: this.name,
      defaultPrice: this.defaultPrice,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}