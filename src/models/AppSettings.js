export default class AppSettings {
  constructor({
    id = 'global', // Обычно настройки хранятся в одном документе
    theme = 'light',
    currency = 'RUB',
    language = 'ru',
    fontSize = 16
  } = {}) {
    this.id = id;
    this.theme = theme;
    this.currency = currency;
    this.language = language;
    this.fontSize = fontSize;
  }

  clone() {
    return new AppSettings({ ...this });
  }
}

export const settingsConverter = {
  toFirestore: (settings) => ({
    theme: settings.theme,
    currency: settings.currency,
    language: settings.language,
    fontSize: settings.fontSize
  }),
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return new AppSettings({ id: snapshot.id, ...data });
  }
};




