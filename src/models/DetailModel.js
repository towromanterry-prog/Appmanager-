// src/models/DetailModel.js

export class DetailModel {
  constructor({
    id,
    name = '',
    defaultPrice = 0,
    category = '',
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id ?? '';
    this.name = name;
    this.defaultPrice = Number(defaultPrice || 0);
    this.category = category;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new DetailModel({ id: docSnap.id, ...data });
  }

  toFirestore() {
    return {
      name: this.name,
      defaultPrice: this.defaultPrice,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}