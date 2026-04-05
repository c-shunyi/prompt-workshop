<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import { RefreshRight } from '@element-plus/icons-vue'
import { adminState, loadDashboard, logoutAdmin, refreshAdminWorkspace, roleLabel, type AdminRouteName } from '../modules/admin'

const route = useRoute()
const router = useRouter()

const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const navItems = computed(() => {
  const items = [
    { to: '/dashboard/overview', label: '控制台', visible: true },
    { to: '/dashboard/admins', label: '管理员管理', visible: adminState.currentAdmin?.role === 'super_admin' },
    { to: '/dashboard/users', label: '用户管理', visible: true },
    { to: '/dashboard/categories', label: '分类管理', visible: true },
    { to: '/dashboard/tags', label: '标签管理', visible: true },
    { to: '/dashboard/articles', label: '文章管理', visible: true },
  ]

  return items.filter((item) => item.visible)
})

const pageTitle = computed(() => (typeof route.meta.title === 'string' ? route.meta.title : '管理后台'))
const pageDescription = computed(() =>
  typeof route.meta.description === 'string' ? route.meta.description : '通过路由切换不同的管理模块。',
)

async function ensureLoaded() {
  if (adminState.dashboardLoaded) {
    return
  }

  const success = await loadDashboard({ silent: true })

  if (!success) {
    void router.replace('/login')
  }
}

async function refreshDashboard() {
  const routeName = typeof route.name === 'string' ? (route.name as AdminRouteName) : undefined
  const success = await refreshAdminWorkspace(routeName)

  if (!success) {
    void router.replace('/login')
  }
}

function logout() {
  logoutAdmin()
  void router.replace('/login')
}

onMounted(() => {
  void ensureLoaded()
})
</script>

<template>
  <div class="admin-workspace">
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__sidebar-top">
        <p class="admin-layout__brand-mark">Prompt Workshop</p>
        <h1 class="admin-layout__brand-title">内容工坊后台</h1>
        <p class="admin-layout__brand-copy">
          左侧菜单固定，右侧工作区固定，通过路由切换不同管理模块。
        </p>
      </div>

      <nav class="admin-layout__nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="admin-layout__nav-link"
          active-class="admin-layout__nav-link--active"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="admin-layout__sidebar-card">
        <p>{{ adminState.currentAdmin?.nickname || adminState.currentAdmin?.username || '管理员' }}</p>
        <span class="admin-layout__role">{{ roleLabel }}</span>
        <strong>{{ adminState.currentAdmin?.username || '未登录' }}</strong>
        <button class="admin-layout__logout" @click="logout">退出登录</button>
      </div>
    </aside>

    <main class="admin-layout__main">
      <header class="admin-layout__header">
        <div>
          <p class="admin-layout__eyebrow">Operations Desk</p>
          <h2>{{ pageTitle }}</h2>
          <p class="admin-layout__description">{{ pageDescription }}</p>
        </div>

        <div class="admin-layout__header-actions">
          <span class="admin-layout__header-meta">{{ today }}</span>
          <el-button
            type="primary"
            plain
            :icon="RefreshRight"
            :loading="adminState.dashboardLoading"
            @click="refreshDashboard"
          >
            刷新数据
          </el-button>
        </div>
      </header>

      <section class="admin-layout__content">
        <el-alert
          v-if="adminState.feedbackMessage && adminState.feedbackType === 'error'"
          :title="adminState.feedbackMessage"
          :type="adminState.feedbackType"
          show-icon
          class="admin-layout__alert"
          :closable="false"
        />

        <RouterView />
      </section>
    </main>
  </div>
</template>
