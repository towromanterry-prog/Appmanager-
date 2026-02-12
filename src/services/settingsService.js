import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'; // Добавил updateDoc
import { settingsConverter } from '../models/AppSettings';
import AppSettings from '../models/AppSettings';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'user_preferences';

class SettingsService {
  constructor() {
    this.docRef = doc(db, COLLECTION_NAME, DOC_ID).withConverter(settingsConverter);
  }

  /**
   * Загружает настройки. Если их нет в БД — создает дефолтные.
   */
  async getSettings() {
    try {
      const snapshot = await getDoc(this.docRef);
      
      if (snapshot.exists()) {
        return snapshot.data(); // Вернет экземпляр AppSettings благодаря конвертеру
      } else {
        console.log('Settings doc not found, creating default...');
        const defaultSettings = new AppSettings({ id: DOC_ID });
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error fetching settings (Service):', error);
      // В случае ошибки сети возвращаем дефолтные настройки, чтобы приложение не упало
      return new AppSettings({ id: DOC_ID }); 
    }
  }

  /**
   * Полная перезапись настроек
   */
  async saveSettings(settingsModel) {
    // Используем setDoc с merge: true, чтобы случайно не затереть поля, 
    // если модель обновилась, а в БД старая структура
    await setDoc(this.docRef, settingsModel, { merge: true });
  }

  /**
   * Частичное обновление (например, только темы), чтобы не гонять весь объект
   * Принимает простой объект: { theme: 'dark' }
   */
  async patchSettings(partialData) {
    await updateDoc(this.docRef, partialData);
  }
}

export default new SettingsService();
