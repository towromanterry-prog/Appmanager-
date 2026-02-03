import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

// Импорты с проверкой существования компонентов
const loadView = (view) => {
  return () => import(`@/views/${view}.vue`).catch(() => {
    console.error(`❌ Компонент ${view} не найден`);
    return import('@/views/HomeView.vue');
  });
};

const isHashHistory = typeof window !== 'undefined'
  && (window.Capacitor || window.location.protocol === 'file:');

const router = createRouter({
  history: isHashHistory
    ? createWebHashHistory(import.meta.env.BASE_URL)
    : createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
      meta: { title: 'Заказы', requiresAuth: true }
    },
    {
      path: '/order/new',
      name: 'order-new',
      component: loadView('OrderFormView'),
      meta: { title: 'Новый заказ', requiresAuth: true }
    },
    {
      path: '/order/:orderId',
      name: 'order-edit',
      component: loadView('OrderFormView'),
      meta: { title: 'Редактирование заказа', requiresAuth: true }
    },
    {
      path: '/clients',
      name: 'clients', 
      component: loadView('ClientsView'),
      meta: { title: 'Клиенты', requiresAuth: true }
    },
    {
      path: '/base-settings/:tab?',
      name: 'base-settings',
      component: loadView('BaseSettingsView'),
      meta: { title: 'Управление услугами', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: loadView('SettingsView'),
      meta: { title: 'Настройки', requiresAuth: true }
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: loadView('NotFoundView'),
      meta: { title: 'Страница не найдена' }
    }
  ]
});

// Глобальные обработчики
router.beforeEach((to, from, next) => {
  console.log(`🔄 Переход с ${from.path} на ${to.path}`);
  
  // Обновление заголовка
  if (to.meta.title) {
    document.title = `${to.meta.title} - Order Manager`;
  }
  
  next();
});

router.onError((error) => {
  console.error('❌ Ошибка роутинга:', error);
});

export default router;
