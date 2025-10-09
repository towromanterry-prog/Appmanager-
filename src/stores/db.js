import Dexie from 'dexie'

// Заглушки для экспорта/импорта
let exportDB, importInto
try {
  const { exportDB: _exportDB, importInto: _importInto } = require('dexie-export-import')
  exportDB = _exportDB
  importInto = _importInto
} catch (error) {
  console.warn('dexie-export-import не установлен')
  exportDB = async (db) => {
    const data = { formatName: 'dexie', data: { tables: [], data: [] } }
    return new Blob([JSON.stringify(data)], { type: 'application/json' })
  }
  importInto = async () => Promise.resolve()
}

export const db = new Dexie('MyAppDatabase', {
  chromeTransactionDurability: 'strict'
})

db.version(2).stores({
  services:    '++id,name,defaultPrice',
  orders:      '++id,createDate,status', 
  tags:        '++id,&name',
  orderItems:  '++id,orderId,serviceId,price,status,[orderId+serviceId]',
  serviceTags: '++id,serviceId,tagId,[serviceId+tagId]'
})

db.on('error', error => {
  console.error('Dexie error:', error)
})

// Расширенная защита данных
export class DataProtection {
  constructor() {
    this.backupPrefix = 'app_backup_'
    this.maxLocalBackups = 3
    this.autoBackupInterval = null
  }

  // Многоуровневая инициализация защиты
  async initComprehensiveProtection() {
    const results = {
      persistent: false,
      autoBackup: false,
      localBackup: false,
      estimate: null
    }

    try {
      // 1. Запросить постоянное хранение
      results.persistent = await this.requestPersistentStorage()
      
      // 2. Получить информацию о квоте
      results.estimate = await this.getStorageInfo()
      
      // 3. Создать начальный локальный бэкап
      results.localBackup = await this.createLocalBackup()
      
      // 4. Запустить автоматическое резервное копирование
      results.autoBackup = this.startAutoBackup()
      
      // 5. Настроить обработчики событий
      this.setupStorageEventHandlers()
      
      console.log('Защита данных инициализирована:', results)
      return results
    } catch (error) {
      console.error('Ошибка инициализации защиты:', error)
      return results
    }
  }

  // Запрос постоянного хранения с детальной проверкой
  async requestPersistentStorage() {
    if (!navigator.storage?.persist) {
      console.warn('API постоянного хранения не поддерживается')
      return false
    }

    try {
      // Проверить текущий статус
      const isPersisted = await navigator.storage.persisted()
      if (isPersisted) {
        console.log('Постоянное хранение уже активно')
        return true
      }

      // Запросить разрешение
      const granted = await navigator.storage.persist()
      if (granted) {
        console.log('✅ Постоянное хранение разрешено')
        return true
      } else {
        console.warn('❌ Постоянное хранение отклонено')
        // Показать пользователю как включить вручную
        this.showPersistentStorageHelp()
        return false
      }
    } catch (error) {
      console.error('Ошибка запроса постоянного хранения:', error)
      return false
    }
  }

  // Информация о хранилище
  async getStorageInfo() {
    if (!navigator.storage?.estimate) return null
    
    try {
      const estimate = await navigator.storage.estimate()
      const quotaMB = (estimate.quota / 1024 / 1024).toFixed(1)
      const usageMB = (estimate.usage / 1024 / 1024).toFixed(1)
      
      console.log(`Квота хранения: ${quotaMB}MB, использовано: ${usageMB}MB`)
      
      // Предупреждение при заполнении более 80%
      const usagePercent = (estimate.usage / estimate.quota) * 100
      if (usagePercent > 80) {
        console.warn(`⚠️ Хранилище заполнено на ${usagePercent.toFixed(1)}%`)
      }
      
      return { quota: estimate.quota, usage: estimate.usage, percent: usagePercent }
    } catch (error) {
      console.error('Ошибка получения информации о хранилище:', error)
      return null
    }
  }

  // Создание локального бэкапа в localStorage
  async createLocalBackup() {
    try {
      const blob = await exportDB(db)
      const reader = new FileReader()
      
      return new Promise((resolve) => {
        reader.onload = () => {
          try {
            const backupKey = `${this.backupPrefix}${Date.now()}`
            const backupData = {
              timestamp: new Date().toISOString(),
              size: blob.size,
              data: reader.result
            }
            
            localStorage.setItem(backupKey, JSON.stringify(backupData))
            this.cleanOldLocalBackups()
            
            console.log(`📦 Локальный бэкап создан: ${backupKey}`)
            resolve(true)
          } catch (error) {
            console.error('Ошибка сохранения локального бэкапа:', error)
            resolve(false)
          }
        }
        
        reader.onerror = () => {
          console.error('Ошибка чтения данных для бэкапа')
          resolve(false)
        }
        
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Ошибка создания локального бэкапа:', error)
      return false
    }
  }

  // Очистка старых локальных бэкапов
  cleanOldLocalBackups() {
    try {
      const backupKeys = Object.keys(localStorage)
        .filter(key => key.startsWith(this.backupPrefix))
        .sort((a, b) => b.localeCompare(a)) // новые первыми
      
      // Удалить все, кроме последних N
      backupKeys.slice(this.maxLocalBackups).forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Удален старый бэкап: ${key}`)
      })
    } catch (error) {
      console.error('Ошибка очистки старых бэкапов:', error)
    }
  }

  // Автоматическое резервное копирование
  startAutoBackup(intervalHours = 6) {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval)
    }

    this.autoBackupInterval = setInterval(async () => {
      console.log('⏰ Выполняется автоматический бэкап...')
      await this.createLocalBackup()
    }, intervalHours * 60 * 60 * 1000)

    console.log(`🔄 Автобэкап запущен (каждые ${intervalHours}ч)`)
    return true
  }

  // Восстановление из локального бэкапа
  async restoreFromLocalBackup(backupKey = null) {
    try {
      let selectedBackup = backupKey
      
      if (!selectedBackup) {
        // Найти самый свежий бэкап
        const backupKeys = Object.keys(localStorage)
          .filter(key => key.startsWith(this.backupPrefix))
          .sort((a, b) => b.localeCompare(a))
        
        if (backupKeys.length === 0) {
          throw new Error('Локальные бэкапы не найдены')
        }
        
        selectedBackup = backupKeys[0]
      }
      
      const backupJson = localStorage.getItem(selectedBackup)
      if (!backupJson) {
        throw new Error(`Бэкап ${selectedBackup} не найден`)
      }
      
      const backup = JSON.parse(backupJson)
      const response = await fetch(backup.data)
      const blob = await response.blob()
      
      await importInto(db, blob, { clearTablesBeforeImport: true })
      
      console.log(`✅ Данные восстановлены из ${selectedBackup}`)
      return true
    } catch (error) {
      console.error('Ошибка восстановления из локального бэкапа:', error)
      return false
    }
  }

  // Настройка обработчиков событий хранилища
  setupStorageEventHandlers() {
    // Обработчик изменений в localStorage
    window.addEventListener('storage', (event) => {
      if (event.key?.startsWith(this.backupPrefix)) {
        console.log('📊 Обнаружены изменения в локальных бэкапах')
      }
    })

    // Обработчик изменений в IndexedDB
    db.on('ready', () => {
      console.log('🗄️ База данных готова к работе')
    })

    // Периодическая проверка статуса хранилища
    setInterval(async () => {
      const isPersisted = await navigator.storage?.persisted()
      if (!isPersisted) {
        console.warn('⚠️ Постоянное хранение было отозвано')
        await this.requestPersistentStorage()
      }
    }, 30 * 60 * 1000) // каждые 30 минут
  }

  // Показать пользователю помощь по включению постоянного хранения
  showPersistentStorageHelp() {
    console.log(`
📋 Для защиты данных от удаления:

Chrome/Edge:
1. Нажмите на замочек в адресной строке
2. Разрешите уведомления (если нужны)
3. Добавьте сайт в закладки
4. Регулярно используйте приложение

Firefox:
1. При запросе разрешения нажмите "Разрешить"
2. Или зайдите в Настройки → Приватность → Разрешения

Safari:
1. Добавьте сайт на главный экран
2. Регулярно используйте приложение
    `)
  }

  // Экспорт в файл для ручного сохранения
  async exportToFile(filename = null) {
    try {
      const blob = await exportDB(db)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
      const defaultName = filename || `myapp-backup-${timestamp}.db`
      
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = defaultName
      link.style.display = 'none'
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      console.log(`💾 Файл экспортирован: ${defaultName}`)
      return { success: true, filename: defaultName, size: blob.size }
    } catch (error) {
      console.error('Ошибка экспорта в файл:', error)
      return { success: false, error: error.message }
    }
  }

  // Получить список доступных локальных бэкапов
  getLocalBackups() {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(this.backupPrefix))
      .map(key => {
        try {
          const data = JSON.parse(localStorage.getItem(key))
          return {
            key,
            timestamp: data.timestamp,
            size: data.size,
            age: Date.now() - new Date(data.timestamp).getTime()
          }
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  // Остановить автобэкап
  stopAutoBackup() {
    if (this.autoBackupInterval) {
      clearInterval(this.autoBackupInterval)
      this.autoBackupInterval = null
      console.log('⏹️ Автобэкап остановлен')
    }
  }
}

// Создать экземпляр защиты данных
export const dataProtection = new DataProtection()

// Инициализация при загрузке модуля
dataProtection.initComprehensiveProtection()

// Экспорт оригинальных функций
export async function backupDatabase() {
  return await exportDB(db)
}

export async function restoreDatabase(blob) {
  await importInto(db, blob, { clearTablesBeforeImport: true })
}

export default db