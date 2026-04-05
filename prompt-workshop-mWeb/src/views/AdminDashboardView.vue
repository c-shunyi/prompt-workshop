<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Plus,
  RefreshRight,
  SwitchButton,
  User,
} from '@element-plus/icons-vue'
import {
  API_BASE,
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

const alertType = computed(() => adminState.feedbackType)

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
  <div class="admin-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <el-space direction="vertical" :size="14" fill>
          <el-tag effect="dark" round type="success" class="hero-tag">Prompt Workshop Admin</el-tag>
          <h1>Element Plus 管理台</h1>
          <p class="hero-text">
            管理台已经切到独立的 <code>/dashboard</code> 页面，未登录访问时会自动跳转到 <code>/login</code>。
          </p>
          <el-space wrap>
            <el-tag round>{{ API_BASE }}/admin</el-tag>
            <el-tag round type="info">{{ adminState.currentAdmin ? roleLabel : '未登录' }}</el-tag>
            <el-tag round type="warning">当前路由：/dashboard</el-tag>
          </el-space>
        </el-space>
      </div>

      <el-card shadow="never" class="hero-side">
        <template #header>
          <div class="panel-title">当前会话</div>
        </template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="管理员">
            {{ adminState.currentAdmin ? adminState.currentAdmin.nickname || adminState.currentAdmin.username : '未登录' }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ adminState.currentAdmin?.role || '-' }}
          </el-descriptions-item>
          <el-descriptions-item label="初始化命令">
            <code>pnpm admin:init</code>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </section>

    <el-alert
      :title="adminState.feedbackMessage"
      :type="alertType"
      show-icon
      class="status-alert"
      :closable="false"
    />

    <el-row :gutter="18" class="dashboard-grid">
      <el-col :xs="24" :lg="12">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">管理概览</div>
                <div class="panel-title">当前后台数据</div>
              </div>
              <el-button type="danger" plain :icon="SwitchButton" @click="logout">
                退出
              </el-button>
            </div>
          </template>

          <el-row :gutter="12" class="stat-row">
            <el-col :span="12">
              <el-card shadow="never" class="stat-card">
                <el-statistic title="管理员数量" :value="adminState.adminList.length" />
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="never" class="stat-card">
                <el-statistic title="前台用户数量" :value="adminState.userList.length" />
              </el-card>
            </el-col>
          </el-row>

          <el-space wrap class="dashboard-actions">
            <el-button type="primary" plain :icon="RefreshRight" :loading="adminState.dashboardLoading" @click="refreshDashboard">
              刷新后台数据
            </el-button>
            <el-tag round type="success">
              {{ adminState.currentAdmin ? `${adminState.currentAdmin.nickname || adminState.currentAdmin.username} · ${roleLabel}` : '未登录' }}
            </el-tag>
          </el-space>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">管理员管理</div>
                <div class="panel-title">创建管理员</div>
              </div>
            </div>
          </template>

          <el-form :model="createAdminForm" label-position="top" class="admin-form" @submit.prevent="submitCreateAdmin">
            <el-row :gutter="12">
              <el-col :span="12">
                <el-form-item label="用户名">
                  <el-input v-model.trim="createAdminForm.username" placeholder="新管理员用户名" :prefix-icon="User" />
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
                  <el-select v-model="createAdminForm.role" class="full-width">
                    <el-option label="普通管理员" value="admin" />
                    <el-option label="超级管理员" value="super_admin" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <el-button type="success" class="submit-btn" :icon="Plus" :loading="adminState.loading" @click="submitCreateAdmin">
              创建管理员
            </el-button>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="24">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">管理员列表</div>
                <div class="panel-title">已有后台账号</div>
              </div>
            </div>
          </template>

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
        </el-card>
      </el-col>

      <el-col :span="24">
        <el-card class="panel-card" shadow="hover">
          <template #header>
            <div class="panel-header">
              <div>
                <div class="panel-kicker">用户管理</div>
                <div class="panel-title">前台用户列表</div>
              </div>
            </div>
          </template>

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
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
