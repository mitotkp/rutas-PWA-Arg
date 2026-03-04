import { createRouter, createWebHistory } from 'vue-router'
import loginView from '@/views/loginView.vue'
import DashboardView from '@/views/DashboardView.vue'
import AdminMapaView from '@/views/AdminMapaView.vue'
import { isAuthenticated } from '@/store'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: loginView
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: () => import('../views/ClientesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/clientes/:id',
      name: 'cliente-detalle',
      component: () => import('../views/ClienteDetailView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/clientes/:id',
      name: 'cliente-cuentas-por-cobrar',
      component: () => import('../views/CuentasPorCobrarView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/catalogo',
      name: 'catalogo',
      component: () => import('../views/CatalagoView.vue'),
      meta: { requiresAuth: true}
    },
    {
      path:'/pedido',
      name: 'pedido',
      component: () => import('../views/PedidoView.vue'),
      meta: { requiresAuth: true}
    },
    {
      path:'/pedidos',
      name:'pedidos',
      component: () => import('../views/PedidoListView.vue'),
      meta: { requiresAuth: true}
    },
    {
      path:'/rutas',
      name:'rutas',
      component: () => import('../views/RutasView.vue'),
      meta: { requiresAuth: true}
    },
    {
      path: '/admin-mapa',
      name: 'admin-mapa',
      component: AdminMapaView,
      meta: { requiresAuth: true }
    }
  ],
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    next({ name: 'login' });
  } 
  else if (to.name === 'login' && isAuthenticated.value) {
    next({ name: 'dashboard' });
  } 
  else {
    next();
  }
});

export default router
