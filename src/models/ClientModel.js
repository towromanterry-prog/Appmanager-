// src/models/ClientModel.js

/**
 * Безопасная генерация ID:
 * crypto.randomUUID() может падать на мобильных без HTTPS (insecure context).
 * Поэтому: пробуем randomUUID -> fallback на getRandomValues -> fallback на Math.random.
 */
export function generateId(prefix = '') {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      const uuid = crypto.randomUUID(); // может throw
      return prefix ? `${prefix}_${uuid}` : uuid;
    }
  } catch (_) {}

  const alphabet = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

  const randomString = (len) => {
    // crypto.getRandomValues (если доступен)
    try {
      if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
        const bytes = new Uint8Array(len);
        crypto.getRandomValues(bytes);
        let out = '';
        for (let i = 0; i < len; i++) out += alphabet[bytes[i] % alphabet.length];
        return out;
      }
    } catch (_) {}

    // самый простой fallback
    let out = '';
    for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
    return out;
  };

  const time = Date.now().toString(36);
  const rand = randomString(16);
  const id = `${time}_${rand}`;

  return prefix ? `${prefix}_${id}` : id;
}

function looksLikePhone(value) {
  if (!value) return false;
  const s = String(value).trim();
  if (s.length < 7) return false;
  return /^[\d+\-() ]+$/.test(s);
}

export class ClientModel {
  constructor({
    id = null,

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
    // ВАЖНО: id отделён от phone
    this.id = id ?? null;

    this.name = name;
    this.lastName = lastName;
    this.phone = phone;

    this.notes = notes;
    this.favoriteServices = Array.isArray(favoriteServices) ? favoriteServices : [];
    this.lastOrderDate = lastOrderDate;
    this.totalOrders = Number(totalOrders || 0);
    this.history = Array.isArray(history) ? history : [];
    this.isArchived = !!isArchived;

    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    const docId = docSnap.id;

    // Переходная совместимость:
    // - старые документы: docId == phone, data.phone может быть пустым
    // - новые документы: docId == id, phone лежит в data.phone
    const phone = data.phone || (looksLikePhone(docId) ? docId : '');

    return new ClientModel({
      ...data,
      id: data.id || docId, // если в документе уже есть id — уважаем, иначе docId
      phone,
      isArchived: !!data.isArchived,
    });
  }

  toFirestore() {
    return {
      // ЖЕСТКОЕ ТРЕБОВАНИЕ: ID должен физически быть в документе
      id: this.id,

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