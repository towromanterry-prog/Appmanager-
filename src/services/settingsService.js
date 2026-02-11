import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { settingsConverter } from '../models/AppSettings';
import AppSettings from '../models/AppSettings';

const COLLECTION_NAME = 'settings';
const DOC_ID = 'user_preferences'; // ID документа настроек

class SettingsService {
  constructor() {
    this.docRef = doc(db, COLLECTION_NAME, DOC_ID).withConverter(settingsConverter);
  }

  async getSettings() {
    const snapshot = await getDoc(this.docRef);
    if (snapshot.exists()) {
      return snapshot.data();
    } else {
      // Если настроек нет, создаем дефолтные
      const defaultSettings = new AppSettings({ id: DOC_ID });
      await this.saveSettings(defaultSettings);
      return defaultSettings;
    }
  }

  async saveSettings(settingsModel) {
    await setDoc(this.docRef, settingsModel); // setDoc создаст или перезапишет
  }
}

export default new SettingsService();

