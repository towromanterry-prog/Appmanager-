import { Timestamp } from 'firebase/firestore';

export class Order {
  constructor(data = {}) {
    this.id = data.id || null;
    this.clientId = data.clientId || null;
    this.clientName = data.clientName || ''; 
    this.status = data.status || 'accepted';
    this.totalAmount = Number(data.totalAmount) || 0;
    this.createDate = this._parseDate(data.createDate);
    this.deadline = this._parseDate(data.deadline);
    this.services = (data.services || []).map(s => ({ ...s }));
    this.details = (data.details || []).map(d => ({ ...d }));
  }
  _parseDate(v) {
    if (!v) return new Date();
    if (v instanceof Timestamp) return v.toDate();
    return v instanceof Date ? v : new Date(v);
  }
  clone() { return new Order({ ...this, services: this.services.map(s=>({...s})), details: this.details.map(d=>({...d})) }); }
  toFirestore() {
    const raw = { ...this };
    Object.keys(raw).forEach(k => raw[k] === undefined && delete raw[k]);
    return raw;
  }
}

