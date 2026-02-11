import { Timestamp } from 'firebase/firestore';

export default class ServiceItem {
  constructor({
    id = null,
    name = '',
    price = 0,
    notes = '',
    isArchived = false,
    archivedAt = null,
    tagIds = [], // Если используются теги
    icon = ''
  } = {}) {
    this.id = id;
    this.name = name;
    this.notes = notes;
    this.icon = icon;
    this.isArchived = !!isArchived;
    
    // Нормализация цены (как в старом коде)
    const numericPrice = Number(price);
    this.price = Number.isFinite(numericPrice) ? numericPrice : 0;

    this.tagIds = Array.isArray(tagIds) ? tagIds : [];
    
    // Обработка даты архивации
    if (archivedAt instanceof Timestamp) {
      this.archivedAt = archivedAt.toDate();
    } else if (typeof archivedAt === 'string') {
      this.archivedAt = new Date(archivedAt);
    } else {
      this.archivedAt = archivedAt;
    }
  }

  clone() {
    return new ServiceItem({
      ...this,
      tagIds: [...this.tagIds]
    });
  }
}

export const serviceItemConverter = {
  toFirestore: (item) => {
    return {
      name: item.name,
      price: item.price,
      notes: item.notes,
      isArchived: item.isArchived,
      archivedAt: item.archivedAt ? Timestamp.fromDate(item.archivedAt) : null,
      tagIds: item.tagIds,
      icon: item.icon
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new ServiceItem({
      id: snapshot.id,
      ...data
    });
  }
};

