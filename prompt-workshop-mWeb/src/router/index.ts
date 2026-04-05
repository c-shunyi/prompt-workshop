import { createRouter, createWebHistory } from 'vue-router'
import { adminState, hydrateAdminSession } from '../modules/admin'
import AdminWorkspaceLayout from '../layouts/AdminWorkspaceLayout.vue'
import AdminLoginView from '../views/AdminLoginView.vue'
import AdminAdminsView from '../views/AdminAdminsView.vue'
import AdminArticlesView from '../views/AdminArticlesView.vue'
import AdminCategoriesView from '../views/AdminCategoriesView.vue'
import AdminOverviewView from '../views/AdminOverviewView.vue'
import AdminTagsView from '../views/AdminTagsView.vue'
import AdminUsersView from '../views/AdminUsersView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'admin-login',
      component: AdminLoginView,
      meta: { guestOnly: true },
    },
    {
      path: '/dashboard',
      component: AdminWorkspaceLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/dashboard/overview',
        },
        {
          path: 'overview',
          name: 'admin-overview',
          component: AdminOverviewView,
          meta: {
            requiresAuth: true,
            title: '管理控制台',
            description: '查看后台总体状态、关键指标和快捷入口。',
          },
        },
        {
          path: 'admins',
          name: 'admin-admins',
          component: AdminAdminsView,
          meta: {
            requiresAuth: true,
            requiresSuperAdmin: true,
            title: '管理员管理',
            description: '创建管理员账号并查看已有后台账号列表。',
          },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: AdminUsersView,
          meta: {
            requiresAuth: true,
            title: '用户管理',
            description: '查看前台用户并进行启用或禁用操作。',
          },
        },
        {
          path: 'categories',
          name: 'admin-categories',
          component: AdminCategoriesView,
          meta: {
            requiresAuth: true,
            title: '分类管理',
            description: '维护文章分类、排序和可用状态。',
          },
        },
        {
          path: 'tags',
          name: 'admin-tags',
          component: AdminTagsView,
          meta: {
            requiresAuth: true,
            title: '标签管理',
            description: '维护文章标签，支持快速新增和编辑。',
          },
        },
        {
          path: 'articles',
          name: 'admin-articles',
          component: AdminArticlesView,
          meta: {
            requiresAuth: true,
            title: '文章管理',
            description: '发布、编辑、下架、删除文章，并维护文章内容状态。',
          },
        },
      ],
    },
    {
      path: '/',
      redirect: '/dashboard/overview',
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/dashboard/overview',
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

  if (to.meta.requiresSuperAdmin && adminState.currentAdmin?.role !== 'super_admin') {
    return { path: '/dashboard/overview' }
  }

  if (to.meta.guestOnly && adminState.currentAdmin) {
    return { path: '/dashboard/overview' }
  }

  return true
})

export default router
