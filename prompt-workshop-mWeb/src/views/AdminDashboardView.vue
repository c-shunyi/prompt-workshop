<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, RefreshRight } from '@element-plus/icons-vue'
import {
  adminState,
  createAdminAccount,
  loadDashboard,
  logoutAdmin,
  roleLabel,
  updateUserAccountStatus,
} from '../modules/admin'

const router = useRouter()

const createAdminForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'admin',
})

const today = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
}).format(new Date())

const sidebarNavItems = [
  { href: '#overview', label: '控制台' },
  { href: '#create-admin', label: '管理员创建' },
  { href: '#admin-list', label: '管理员列表' },
  { href: '#user-list', label: '用户管理' },
]

const metrics = computed(() => [
  {
    eyebrow: '管理员数量',
    value: String(adminState.adminList.length),
    label: '已接入后台账号',
    trend: '查看列表',
  },
  {
    eyebrow: '前台用户数量',
    value: String(adminState.userList.length),
    label: '当前注册用户',
    trend: '管理状态',
  },
  {
    eyebrow: '当前身份',
    value: roleLabel.value,
    label: adminState.currentAdmin?.nickname || adminState.currentAdmin?.username || '未登录',
    trend: '会话中',
  },
  {
    eyebrow: '数据状态',
    value: adminState.dashboardLoading ? '同步中' : '已连接',
    label: '后台接口状态',
    trend: '刷新数据',
  },
])

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

async function ensureDashboardLoaded() {
  if (adminState.dashboardLoaded) {
    return
  }

  const success = await loadDashboard({ silent: true })

  if (!success) {
    void router.replace('/login')
  }
}

async function refreshDashboard() {
  const success = await loadDashboard()

  if (!success) {
    void router.replace('/login')
  }
}

async function submitCreateAdmin() {
  if (!createAdminForm.username || !createAdminForm.password) {
    ElMessage.warning('请完整填写新管理员账号和密码')
    return
  }

  const success = await createAdminAccount(createAdminForm)

  if (!success) {
    return
  }

  createAdminForm.username = ''
  createAdminForm.password = ''
  createAdminForm.nickname = ''
  createAdminForm.role = 'admin'
  await refreshDashboard()
}

async function updateUserStatus(userId: number, status: 0 | 1) {
  const success = await updateUserAccountStatus(userId, status)

  if (!success) {
    if (!adminState.token) {
      void router.replace('/login')
    }

    return
  }

  await refreshDashboard()
}

function logout() {
  logoutAdmin()
  void router.replace('/login')
}

onMounted(() => {
  void ensureDashboardLoaded()
})
</script>

<template>
  <div class="admin-layout">
    <aside class="admin-layout__sidebar">
      <div class="admin-layout__sidebar-top">
        <p class="admin-layout__brand-mark">Prompt Workshop</p>
        <h1 class="admin-layout__brand-title">内容工坊后台</h1>
        <p class="admin-layout__brand-copy">
          风格参考 travel/manage，采用深色侧栏和浅色工作区，便于后续继续扩展更多后台模块。
        </p>
      </div>

      <nav class="admin-layout__nav">
        <a
          v-for="item in sidebarNavItems"
          :key="item.href"
          :href="item.href"
          class="admin-layout__nav-link"
        >
          {{ item.label }}
        </a>
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
          <h2>管理控制台</h2>
        </div>

        <div class="admin-layout__header-meta">
          <span>{{ today }}</span>
        </div>
      </header>

      <section class="admin-layout__content">
        <el-alert
          :title="adminState.feedbackMessage"
          :type="adminState.feedbackType"
          show-icon
          class="admin-layout__alert"
          :closable="false"
        />

        <section id="overview" class="admin-stats">
          <article v-for="metric in metrics" :key="metric.eyebrow" class="admin-stat-card">
            <div class="admin-stat-card__eyebrow">{{ metric.eyebrow }}</div>
            <div class="admin-stat-card__value">{{ metric.value }}</div>
            <div class="admin-stat-card__footer">
              <span>{{ metric.label }}</span>
              <strong>{{ metric.trend }}</strong>
            </div>
          </article>
        </section>

        <section class="admin-panels">
          <article class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <p class="admin-panel__eyebrow">会话概览</p>
                <h3 class="admin-panel__title">当前后台状态</h3>
              </div>

              <el-button
                type="primary"
                plain
                :icon="RefreshRight"
                :loading="adminState.dashboardLoading"
                @click="refreshDashboard"
              >
                刷新
              </el-button>
            </div>

            <div class="admin-summary-list">
              <div class="admin-summary-item">
                <span>当前路由</span>
                <strong>/dashboard</strong>
              </div>
              <div class="admin-summary-item">
                <span>管理员</span>
                <strong>{{ adminState.currentAdmin?.nickname || adminState.currentAdmin?.username || '-' }}</strong>
              </div>
              <div class="admin-summary-item">
                <span>角色</span>
                <strong>{{ roleLabel }}</strong>
              </div>
              <div class="admin-summary-item">
                <span>初始化命令</span>
                <strong>pnpm admin:init</strong>
              </div>
            </div>
          </article>

          <article id="create-admin" class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <p class="admin-panel__eyebrow">管理员管理</p>
                <h3 class="admin-panel__title">创建管理员</h3>
              </div>
            </div>

            <el-form :model="createAdminForm" label-position="top" @submit.prevent="submitCreateAdmin">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="用户名">
                    <el-input v-model.trim="createAdminForm.username" placeholder="新管理员用户名" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="昵称">
                    <el-input v-model.trim="createAdminForm.nickname" placeholder="例如 内容运营" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="密码">
                    <el-input v-model="createAdminForm.password" type="password" show-password placeholder="设置登录密码" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="角色">
                    <el-select v-model="createAdminForm.role" class="admin-panel__full-width">
                      <el-option label="普通管理员" value="admin" />
                      <el-option label="超级管理员" value="super_admin" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-button type="primary" class="admin-panel__submit" :icon="Plus" :loading="adminState.loading" @click="submitCreateAdmin">
                创建管理员
              </el-button>
            </el-form>
          </article>
        </section>

        <article id="admin-list" class="admin-panel admin-panel--table">
          <div class="admin-panel__head">
            <div>
              <p class="admin-panel__eyebrow">管理员列表</p>
              <h3 class="admin-panel__title">已有后台账号</h3>
            </div>
          </div>

          <el-table :data="adminState.adminList" stripe empty-text="登录后即可查看管理员列表">
            <el-table-column prop="username" label="用户名" min-width="140" />
            <el-table-column prop="nickname" label="昵称" min-width="140">
              <template #default="{ row }">
                {{ row.nickname || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" min-width="140" />
            <el-table-column prop="status" label="状态" min-width="110">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" round>
                  {{ row.status === 1 ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="lastLoginAt" label="最后登录" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.lastLoginAt) }}
              </template>
            </el-table-column>
          </el-table>
        </article>

        <article id="user-list" class="admin-panel admin-panel--table">
          <div class="admin-panel__head">
            <div>
              <p class="admin-panel__eyebrow">用户管理</p>
              <h3 class="admin-panel__title">前台用户列表</h3>
            </div>
          </div>

          <el-table :data="adminState.userList" stripe empty-text="登录后即可查看前台用户列表">
            <el-table-column prop="username" label="用户名" min-width="140" />
            <el-table-column prop="email" label="邮箱" min-width="220" />
            <el-table-column prop="nickname" label="昵称" min-width="140">
              <template #default="{ row }">
                {{ row.nickname || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="{ row }">
                <el-tag :type="row.status === 1 ? 'success' : 'danger'" round>
                  {{ row.status === 1 ? '正常' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="180" fixed="right">
              <template #default="{ row }">
                <el-space>
                  <el-button
                    size="small"
                    type="success"
                    plain
                    :disabled="adminState.loading || row.status === 1"
                    @click="updateUserStatus(row.id, 1)"
                  >
                    启用
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :disabled="adminState.loading || row.status === 0"
                    @click="updateUserStatus(row.id, 0)"
                  >
                    禁用
                  </el-button>
                </el-space>
              </template>
            </el-table-column>
          </el-table>
        </article>
      </section>
    </main>
  </div>
</template>
