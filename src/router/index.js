import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';

// Обертка для ленивой загрузки
const loadView = (view) => () => import(`@/views/${view}.vue`);

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
      component: loadView('HomeView'),
      meta: { title: 'Заказы', requiresAuth: true }
    },
    {
      path: '/order/:orderId',
      name: 'order-edit',
      // Логика редиректа на главную с открытием модалки (как было у тебя)
      redirect: (to) => ({
        path: '/',
        query: { editOrderId: to.params.orderId }
      }),
      meta: { title: 'Заказы', requiresAuth: true }
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
      meta: { title: 'Справочники', requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: loadView('SettingsView'),
      meta: { title: 'Настройки', requiresAuth: true }
    },
    // Catch-all 404
    {
      path: '/:pathMatch(.*)*',
      redirect: '/'
    }
  ]
});

router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - Order Manager`;
  }
  next();
});

export default router;
