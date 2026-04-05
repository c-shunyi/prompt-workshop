import { createRouter, createWebHistory } from 'vue-router'
import { authState, hydrateSession } from '../modules/auth'
import ArticleDetailView from '../views/ArticleDetailView.vue'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import ProfileView from '../views/ProfileView.vue'
import RegisterView from '../views/RegisterView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/articles/:id',
      name: 'article-detail',
      component: ArticleDetailView,
    },
    {
      path: '/editor',
      redirect: '/profile',
    },
    {
      path: '/editor/:id',
      redirect: '/profile',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: RegisterView,
      meta: { guestOnly: true },
    },
    {
      path: '/profile',
      name: 'profile',
      component: ProfileView,
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

router.beforeEach(async (to) => {
  if (authState.token) {
    await hydrateSession()
  }

  if (to.meta.requiresAuth && !authState.currentUser) {
    return { path: '/login' }
  }

  if (to.meta.guestOnly && authState.currentUser) {
    return { path: '/profile' }
  }

  return true
})

export default router
