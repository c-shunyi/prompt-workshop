import { createRouter, createWebHistory } from 'vue-router'
import { adminState, hydrateAdminSession } from '../modules/admin'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import AdminLoginView from '../views/AdminLoginView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
    },
    {
      path: '/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard',
    },
  ],
})

router.beforeEach(async (to) => {
  if (adminState.token) {
    await hydrateAdminSession()
  }

  if (to.meta.requiresAuth && !adminState.currentAdmin) {
    return { path: '/login' }
  }

  if (to.meta.guestOnly && adminState.currentAdmin) {
    return { path: '/dashboard' }
  }

  return true
})

export default router
