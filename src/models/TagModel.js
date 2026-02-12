// src/models/TagModel.js
export class TagModel {
  constructor({
    id,
    name = '',
    color = '#grey', // как было в старом tagsStore 6
    createdAt = null,
    updatedAt = null,
  } = {}) {
    this.id = id ?? '';
    this.name = name;
    this.color = color || '#grey';
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new TagModel({ id: docSnap.id, ...data });
  }

  toFirestore() {
    return {
      name: this.name,
      color: this.color,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}