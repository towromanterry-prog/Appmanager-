export default class DetailItem {
  constructor({
    id = null,
    name = '',
    defaultPrice = 0,
    category = ''
  } = {}) {
    this.id = id;
    this.name = name;
    this.category = category;
    
    // Безопасное приведение к числу
    const numericPrice = Number(defaultPrice);
    this.defaultPrice = Number.isFinite(numericPrice) ? numericPrice : 0;
  }

  // Метод для клонирования, чтобы разрывать реактивность при редактировании
  clone() {
    return new DetailItem({ ...this });
  }
}

// Конвертер для Firestore
export const detailItemConverter = {
  toFirestore: (item) => {
    return {
      name: item.name,
      defaultPrice: item.defaultPrice,
      category: item.category
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new DetailItem({
      id: snapshot.id,
      ...data
    });
  }
};

