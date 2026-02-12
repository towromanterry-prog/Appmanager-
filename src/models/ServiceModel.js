// src/models/ServiceModel.js

export class ServiceModel {
  constructor({
    id,
    name = '',
    defaultPrice = 0,
    tagIds = [],
    isArchived = false,
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id ?? '';
    this.name = name;
    this.defaultPrice = Number(defaultPrice || 0);
    this.tagIds = Array.isArray(tagIds) ? tagIds : [];
    this.isArchived = !!isArchived;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    const tagIds = Array.isArray(data.tagIds) ? data.tagIds : (Array.isArray(data.tags) ? data.tags : []);
    return new ServiceModel({
      id: docSnap.id,
      ...data,
      tagIds,
      isArchived: !!data.isArchived,
    });
  }

  toFirestore() {
    return {
      name: this.name,
      defaultPrice: this.defaultPrice,
      tagIds: this.tagIds,
      isArchived: this.isArchived,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}