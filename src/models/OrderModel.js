// src/models/OrderModel.js
import { Timestamp } from 'firebase/firestore';

function toDate(value) {
  if (!value) return null;

  if (value instanceof Timestamp) return value.toDate();

  // иногда приходит объект {seconds, nanoseconds}
  if (typeof value === 'object' && value.seconds != null) {
    try {
      return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
    } catch (_) {}
  }

  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

function toTimestamp(value) {
  const d = toDate(value);
  return d ? Timestamp.fromDate(d) : null;
}

function toNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export class OrderModel {
  constructor(data = {}) {
    this.id = data.id ?? null;

    // базовые поля (оставил максимально совместимо)
    this.status = data.status ?? 'accepted';
    this.title = data.title ?? '';

    /**
     * ЖЕСТКОЕ ТРЕБОВАНИЕ:
     * Заказ связывается с клиентом через НЕИЗМЕННЫЙ clientId.
     * При этом в заказе остаётся слепок clientName/phone.
     */
    this.clientId = data.clientId ?? null;

    // слепок клиента (OrderCard работает с этим и его не трогаем)
    this.clientName = data.clientName ?? '';
    this.lastName = data.lastName ?? '';
    this.phone = data.phone ?? data.clientPhone ?? '';
    this.clientPhone = data.clientPhone ?? '';

    this.notes = data.notes ?? '';

    this.services = Array.isArray(data.services) ? data.services : [];
    this.details = Array.isArray(data.details) ? data.details : [];

    this.total = toNumber(data.total, 0);
    this.prepaid = toNumber(data.prepaid, 0);
    this.discount = toNumber(data.discount, 0);

    this.createdAt = toDate(data.createdAt);
    this.updatedAt = toDate(data.updatedAt);

    this.date = toDate(data.date);
    this.startAt = toDate(data.startAt);
    this.endAt = toDate(data.endAt);

    this.meta = data.meta && typeof data.meta === 'object' ? data.meta : {};
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new OrderModel({ id: docSnap.id, ...data });
  }

  toFirestore() {
    return {
      status: this.status,
      title: this.title,

      // ЖЕСТКОЕ ТРЕБОВАНИЕ: clientId пишем в Firestore
      clientId: this.clientId,

      // слепок клиента
      clientName: this.clientName,
      lastName: this.lastName,
      phone: this.phone,
      clientPhone: this.clientPhone,

      notes: this.notes,

      services: Array.isArray(this.services) ? this.services : [],
      details: Array.isArray(this.details) ? this.details : [],

      total: toNumber(this.total, 0),
      prepaid: toNumber(this.prepaid, 0),
      discount: toNumber(this.discount, 0),

      createdAt: this.createdAt ? toTimestamp(this.createdAt) : null,
      updatedAt: this.updatedAt ? toTimestamp(this.updatedAt) : null,

      date: this.date ? toTimestamp(this.date) : null,
      startAt: this.startAt ? toTimestamp(this.startAt) : null,
      endAt: this.endAt ? toTimestamp(this.endAt) : null,

      meta: this.meta && typeof this.meta === 'object' ? this.meta : {},
    };
  }
}