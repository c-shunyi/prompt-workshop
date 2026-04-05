<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

type AdminInfo = {
  id: number
  username: string
  nickname?: string | null
  role: string
  status: number
  createdAt?: string
  lastLoginAt?: string | null
}

type UserInfo = {
  id: number
  username: string
  email: string
  nickname?: string | null
  avatar?: string | null
  bio?: string | null
  status: number
  createdAt?: string
  lastLoginAt?: string | null
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T | null
}

type AdminLoginPayload = {
  token: string
  adminInfo: AdminInfo
}

const API_BASE = 'http://localhost:3000/api'
const ADMIN_TOKEN_KEY = 'prompt_workshop_admin_token'

const token = ref(localStorage.getItem(ADMIN_TOKEN_KEY) || '')
const currentAdmin = ref<AdminInfo | null>(null)
const adminList = ref<AdminInfo[]>([])
const userList = ref<UserInfo[]>([])
const loading = ref(false)
const dashboardLoading = ref(false)

const feedback = reactive({
  type: 'info' as 'info' | 'success' | 'error',
  message: '先初始化一个管理员账号，然后就可以在这里管理管理员和前台用户。',
})

const loginForm = reactive({
  username: '',
  password: '',
})

const createAdminForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'admin',
})

const roleLabel = computed(() => {
  if (!currentAdmin.value) {
    return '未登录'
  }

  return currentAdmin.value.role === 'super_admin' ? '超级管理员' : '普通管理员'
})

async function request<T>(path: string, init?: RequestInit, authToken?: string) {
  const headers = new Headers(init?.headers)
  headers.set('Content-Type', 'application/json')

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || payload.code !== 0 || payload.data === null) {
    throw new Error(payload.message || '请求失败')
  }

  return payload.data
}

function setFeedback(message: string, type: 'info' | 'success' | 'error' = 'info') {
  feedback.message = message
  feedback.type = type
}

function persistToken(value: string) {
  token.value = value
  localStorage.setItem(ADMIN_TOKEN_KEY, value)
}

function clearSession() {
  token.value = ''
  currentAdmin.value = null
  adminList.value = []
  userList.value = []
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

async function submitLogin() {
  loading.value = true

  try {
    const data = await request<AdminLoginPayload>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(loginForm),
    })

    persistToken(data.token)
    currentAdmin.value = data.adminInfo
    setFeedback('管理台登录成功。', 'success')
    await loadDashboard()
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '管理台登录失败', 'error')
  } finally {
    loading.value = false
  }
}

async function loadDashboard() {
  if (!token.value) {
    return
  }

  dashboardLoading.value = true

  try {
    const [admins, users] = await Promise.all([
      request<AdminInfo[]>('/admin/admins', { method: 'GET' }, token.value),
      request<UserInfo[]>('/admin/users', { method: 'GET' }, token.value),
    ])

    adminList.value = admins
    userList.value = users
    const matchedAdmin = admins.find((item) => item.username === currentAdmin.value?.username)
    if (matchedAdmin) {
      currentAdmin.value = matchedAdmin
    }
    setFeedback('管理台数据已刷新。', 'success')
  } catch (error) {
    clearSession()
    setFeedback(error instanceof Error ? error.message : '加载管理台数据失败', 'error')
  } finally {
    dashboardLoading.value = false
  }
}

async function createAdmin() {
  loading.value = true

  try {
    await request<AdminInfo>('/admin/admins', {
      method: 'POST',
      body: JSON.stringify(createAdminForm),
    }, token.value)

    createAdminForm.username = ''
    createAdminForm.password = ''
    createAdminForm.nickname = ''
    createAdminForm.role = 'admin'
    setFeedback('管理员创建成功。', 'success')
    await loadDashboard()
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '创建管理员失败', 'error')
  } finally {
    loading.value = false
  }
}

async function updateUserStatus(userId: number, status: 0 | 1) {
  loading.value = true

  try {
    await request<UserInfo>(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }, token.value)

    setFeedback(status === 1 ? '用户已恢复正常。' : '用户已被禁用。', 'success')
    await loadDashboard()
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '更新用户状态失败', 'error')
  } finally {
    loading.value = false
  }
}

function logout() {
  clearSession()
  setFeedback('已退出管理台。', 'info')
}

onMounted(() => {
  void loadDashboard()
})
</script>

<template>
  <div class="admin-shell">
    <header class="hero-card">
      <div>
        <p class="eyebrow">Prompt Workshop mWeb Admin</p>
        <h1>轻量管理台</h1>
        <p class="hero-text">
          当前已接上管理员登录、管理员列表、前台用户列表与状态切换。后续可以在这里继续扩文章、评论、审核模块。
        </p>
      </div>

      <div class="hero-side">
        <p class="hero-tip">后端接口</p>
        <strong>{{ API_BASE }}/admin</strong>
        <p class="hero-tip">当前身份</p>
        <strong>{{ currentAdmin ? `${currentAdmin.nickname || currentAdmin.username} · ${roleLabel}` : '未登录' }}</strong>
      </div>
    </header>

    <section class="notice-bar" :data-type="feedback.type">
      <span>{{ feedback.message }}</span>
      <code>初始化管理员命令：pnpm admin:init</code>
    </section>

    <main class="dashboard-grid">
      <section class="panel login-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">管理员入口</p>
            <h2>登录管理台</h2>
          </div>
          <button class="ghost-btn" type="button" :disabled="!token" @click="logout">退出</button>
        </div>

        <form class="form-grid" @submit.prevent="submitLogin">
          <label>
            <span>管理员用户名</span>
            <input v-model.trim="loginForm.username" placeholder="默认可用 admin" required />
          </label>

          <label>
            <span>密码</span>
            <input v-model="loginForm.password" type="password" placeholder="默认可用 123456" required />
          </label>

          <button class="primary-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录管理台' }}
          </button>
        </form>

        <div class="metrics">
          <article>
            <span>管理员数量</span>
            <strong>{{ adminList.length }}</strong>
          </article>
          <article>
            <span>前台用户数量</span>
            <strong>{{ userList.length }}</strong>
          </article>
        </div>
      </section>

      <section class="panel create-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">管理员管理</p>
            <h2>创建管理员</h2>
          </div>
          <button class="ghost-btn" type="button" :disabled="dashboardLoading || !token" @click="loadDashboard">
            {{ dashboardLoading ? '刷新中...' : '刷新' }}
          </button>
        </div>

        <form class="form-grid compact" @submit.prevent="createAdmin">
          <label>
            <span>用户名</span>
            <input v-model.trim="createAdminForm.username" placeholder="新管理员用户名" required />
          </label>

          <label>
            <span>昵称</span>
            <input v-model.trim="createAdminForm.nickname" placeholder="例如 内容运营" />
          </label>

          <label>
            <span>密码</span>
            <input v-model="createAdminForm.password" type="password" placeholder="设置登录密码" required />
          </label>

          <label>
            <span>角色</span>
            <select v-model="createAdminForm.role">
              <option value="admin">普通管理员</option>
              <option value="super_admin">超级管理员</option>
            </select>
          </label>

          <button class="primary-btn" type="submit" :disabled="loading || !token">
            {{ loading ? '提交中...' : '创建管理员' }}
          </button>
        </form>
      </section>

      <section class="panel table-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">管理员列表</p>
            <h2>已有后台账号</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>昵称</th>
                <th>角色</th>
                <th>状态</th>
                <th>最后登录</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="admin in adminList" :key="admin.id">
                <td>{{ admin.username }}</td>
                <td>{{ admin.nickname || '-' }}</td>
                <td>{{ admin.role }}</td>
                <td>{{ admin.status === 1 ? '启用' : '禁用' }}</td>
                <td>{{ admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '-' }}</td>
              </tr>
              <tr v-if="!adminList.length">
                <td colspan="5" class="empty-cell">登录后即可查看管理员列表</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel table-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">用户管理</p>
            <h2>前台用户列表</h2>
          </div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>用户名</th>
                <th>邮箱</th>
                <th>昵称</th>
                <th>状态</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in userList" :key="user.id">
                <td>{{ user.username }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.nickname || '-' }}</td>
                <td>
                  <span :class="['status-tag', user.status === 1 ? 'ok' : 'off']">
                    {{ user.status === 1 ? '正常' : '禁用' }}
                  </span>
                </td>
                <td>{{ user.createdAt ? new Date(user.createdAt).toLocaleString() : '-' }}</td>
                <td>
                  <div class="row-actions">
                    <button
                      class="ghost-btn mini"
                      type="button"
                      :disabled="loading || !token || user.status === 1"
                      @click="updateUserStatus(user.id, 1)"
                    >
                      启用
                    </button>
                    <button
                      class="ghost-btn mini danger"
                      type="button"
                      :disabled="loading || !token || user.status === 0"
                      @click="updateUserStatus(user.id, 0)"
                    >
                      禁用
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="!userList.length">
                <td colspan="6" class="empty-cell">登录后即可查看前台用户列表</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>
