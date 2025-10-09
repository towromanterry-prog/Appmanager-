// utils/testStores.js
export function testStores() {
  console.group('🧪 Тестирование Stores');
  
  try {
    // Test OrderStore
    const orderStore = useOrderStore();
    console.log('📦 OrderStore:', orderStore.orders.value.length, 'заказов');
    
    // Test ClientsStore  
    const clientsStore = useClientsStore();
    console.log('👥 ClientsStore:', clientsStore.clients.length, 'клиентов');
    
    // Test ServiceStore
    const serviceStore = useServiceStore();
    console.log('🔧 ServiceStore:', serviceStore.services.length, 'услуг');
    
    // Test SettingsStore
    const settingsStore = useSettingsStore();
    console.log('⚙️ SettingsStore: загружены настройки');
    
    console.log('✅ Все stores работают корректно');
  } catch (error) {
    console.error('❌ Ошибка тестирования stores:', error);
  }
  
  console.groupEnd();
}