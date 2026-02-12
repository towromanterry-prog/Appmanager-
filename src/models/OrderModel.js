// src/models/OrderModel.js
import { Timestamp } from 'firebase/firestore';

/**
 * Нормализует даты из Firestore:
 * - Timestamp -> Date
 * - string/number -> Date (если парсится)
 * - null/undefined -> null
 */
function toDate(value) {
  if (!value) return null;

  // Firestore Timestamp (modular)
  if (value instanceof Timestamp) return value.toDate();

  // Иногда Timestamp приходит как объект { seconds, nanoseconds }
  if (typeof value === 'object' && value.seconds != null) {
    try {
      return new Timestamp(value.seconds, value.nanoseconds || 0).toDate();
    } catch (e) {
      // ignore
    }
  }

  // JS Date
  if (value instanceof Date) return value;

  // ISO string / numeric epoch
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  return null;
}

/**
 * Для записи в Firestore: Date -> Timestamp
 * (если нужно хранить в Firestore именно Timestamp)
 */
function toTimestamp(value) {
  const d = toDate(value);
  return d ? Timestamp.fromDate(d) : null;
}

/**
 * Приводит значение к числу безопасно
 */
function toNumber(value, fallback = 0) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Безопасно приводит к строке
 */
function toStringSafe(value, fallback = '') {
  if (value == null) return fallback;
  return String(value);
}

export class OrderModel {
  constructor(data = {}) {
    this.id = data.id ?? null;

    // Основные поля (оставь/расширь под свой UI)
    this.status = data.status ?? 'all'; // например: new / in_progress / done / canceled / all
    this.title = data.title ?? ''; // например: "Заказ #123" или "Клиент: ..."
    this.customerName = data.customerName ?? '';
    this.customerPhone = data.customerPhone ?? '';
    this.customerEmail = data.customerEmail ?? '';
    this.comment = data.comment ?? '';

    // Денормализация: массивы внутри документа заказа
    this.services = Array.isArray(data.services) ? data.services : [];
    this.details = Array.isArray(data.details) ? data.details : [];

    // Суммы
    this.total = toNumber(data.total, 0);
    this.prepaid = toNumber(data.prepaid, 0);
    this.discount = toNumber(data.discount, 0);

    // Даты
    // Поддерживаем несколько возможных названий полей, чтобы “не потерять” старый функционал.
    this.createdAt = toDate(data.createdAt) ?? null;
    this.updatedAt = toDate(data.updatedAt) ?? null;

    // “Дата заказа/визита” — чаще всего она нужна для календаря и HomeView
    this.date = toDate(data.date) ?? toDate(data.scheduledAt) ?? toDate(data.startAt) ?? null;
    this.startAt = toDate(data.startAt) ?? null;
    this.endAt = toDate(data.endAt) ?? null;

    // Любые дополнительные поля (чтобы не терять данные при round-trip)
    this.meta = data.meta && typeof data.meta === 'object' ? data.meta : {};
  }

  /**
   * Удобно для UI: ISO строки
   */
  get createdAtISO() {
    return this.createdAt ? this.createdAt.toISOString() : null;
  }
  get updatedAtISO() {
    return this.updatedAt ? this.updatedAt.toISOString() : null;
  }
  get dateISO() {
    return this.date ? this.date.toISOString() : null;
  }

  /**
   * Простейший вычисляемый total (если в старом проекте было “сумма из services/details”)
   * - если total уже задан вручную — оставляем.
   * - иначе считаем по services (price*qty) + details (amount/price)
   */
  get computedTotal() {
    if (Number.isFinite(this.total) && this.total > 0) return this.total;

    const sumServices = (this.services || []).reduce((acc, s) => {
      const price = toNumber(s?.price, 0);
      const qty = toNumber(s?.qty ?? s?.quantity ?? 1, 1);
      return acc + price * qty;
    }, 0);

    const sumDetails = (this.details || []).reduce((acc, d) => {
      // поддержка разных схем: amount / price / value
      const v = toNumber(d?.amount ?? d?.price ?? d?.value, 0);
      return acc + v;
    }, 0);

    const raw = sumServices + sumDetails;
    const discounted = raw - toNumber(this.discount, 0);
    return Math.max(0, discounted);
  }

  /**
   * Поисковый “haystack” — чтобы восстановить старый поиск 1-в-1
   * (можно расширить полями, которые реально есть в UI)
   */
  get searchText() {
    const parts = [
      this.id,
      this.title,
      this.status,
      this.customerName,
      this.customerPhone,
      this.customerEmail,
      this.comment,
      // services/details тоже участвуют
      ...((this.services || []).flatMap((s) => [
        s?.name,
        s?.title,
        s?.code,
        s?.category,
        s?.comment,
      ])),
      ...((this.details || []).flatMap((d) => [
        d?.name,
        d?.title,
        d?.comment,
        d?.sku,
      ])),
    ]
      .filter(Boolean)
      .map((x) => toStringSafe(x).toLowerCase());

    return parts.join(' ');
  }

  static fromFirestore(docSnap) {
    const data = docSnap.data() || {};
    return new OrderModel({ id: docSnap.id, ...data });
  }

  /**
   * В Firestore сохраняем:
   * - dates как Timestamp (надёжнее для сортировки/запросов)
   * - массивы services/details как есть (денормализация)
   */
  toFirestore() {
    return {
      status: this.status,
      title: this.title,
      customerName: this.customerName,
      customerPhone: this.customerPhone,
      customerEmail: this.customerEmail,
      comment: this.comment,

      services: Array.isArray(this.services) ? this.services : [],
      details: Array.isArray(this.details) ? this.details : [],

      total: toNumber(this.total, 0),
      prepaid: toNumber(this.prepaid, 0),
      discount: toNumber(this.discount, 0),

      createdAt: this.createdAt ? toTimestamp(this.createdAt) : null,
      updatedAt: this.updatedAt ? toTimestamp(this.updatedAt) : null,

      // Календарная дата
      date: this.date ? toTimestamp(this.date) : null,
      startAt: this.startAt ? toTimestamp(this.startAt) : null,
      endAt: this.endAt ? toTimestamp(this.endAt) : null,

      meta: this.meta && typeof this.meta === 'object' ? this.meta : {},
    };
  }
}