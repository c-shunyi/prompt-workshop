<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

type UserInfo = {
  id: number
  username: string
  email: string
  nickname?: string | null
  avatar?: string | null
  bio?: string | null
  status: number
  createdAt?: string
  updatedAt?: string
  lastLoginAt?: string | null
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T | null
}

type AuthPayload = {
  token: string
  userInfo: UserInfo
}

const API_BASE = 'http://localhost:3000/api'
const USER_TOKEN_KEY = 'prompt_workshop_user_token'

const authMode = ref<'login' | 'register'>('register')
const loading = ref(false)
const profileLoading = ref(false)
const feedback = reactive({
  type: 'info' as 'info' | 'success' | 'error',
  message: '连接后端后，你可以直接在这里完成注册、登录和查看个人资料。',
})

const registerForm = reactive({
  username: '',
  email: '',
  password: '',
  nickname: '',
})

const loginForm = reactive({
  account: '',
  password: '',
})

const token = ref(localStorage.getItem(USER_TOKEN_KEY) || '')
const currentUser = ref<UserInfo | null>(null)

const authSummary = computed(() => {
  if (currentUser.value) {
    return `当前已登录：${currentUser.value.nickname || currentUser.value.username}`
  }

  return authMode.value === 'register'
    ? '创建一个前台账号，立刻进入个人中心'
    : '使用用户名或邮箱登录，继续你的内容创作'
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
  localStorage.setItem(USER_TOKEN_KEY, value)
}

function clearSession() {
  token.value = ''
  currentUser.value = null
  localStorage.removeItem(USER_TOKEN_KEY)
}

async function loadProfile() {
  if (!token.value) {
    return
  }

  profileLoading.value = true

  try {
    const profile = await request<UserInfo>('/users/me', { method: 'GET' }, token.value)
    currentUser.value = profile
    setFeedback('已同步最新的用户资料。', 'success')
  } catch (error) {
    clearSession()
    setFeedback(error instanceof Error ? error.message : '获取用户信息失败', 'error')
  } finally {
    profileLoading.value = false
  }
}

async function submitRegister() {
  loading.value = true

  try {
    const data = await request<AuthPayload>('/users/register', {
      method: 'POST',
      body: JSON.stringify(registerForm),
    })

    persistToken(data.token)
    currentUser.value = data.userInfo
    loginForm.account = data.userInfo.username
    loginForm.password = ''
    setFeedback('注册成功，已经自动登录。', 'success')
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '注册失败', 'error')
  } finally {
    loading.value = false
  }
}

async function submitLogin() {
  loading.value = true

  try {
    const data = await request<AuthPayload>('/users/login', {
      method: 'POST',
      body: JSON.stringify(loginForm),
    })

    persistToken(data.token)
    currentUser.value = data.userInfo
    setFeedback('登录成功，欢迎回来。', 'success')
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '登录失败', 'error')
  } finally {
    loading.value = false
  }
}

function logout() {
  clearSession()
  setFeedback('已退出登录。', 'info')
}

onMounted(() => {
  void loadProfile()
})
</script>

<template>
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Prompt Workshop Web</p>
        <h1>面向创作者的文章分享前台</h1>
        <p class="hero-text">
          这一端现在已经接上用户注册、登录与个人资料接口，适合先把账号系统和后续文章能力串起来。
        </p>

        <div class="hero-pills">
          <span>API：{{ API_BASE }}</span>
          <span>状态：{{ currentUser ? '已登录' : '未登录' }}</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="feedback.type">{{ feedback.message }}</p>
        <p class="status-meta">{{ authSummary }}</p>
      </div>
    </section>

    <main class="content-grid">
      <section class="panel auth-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">用户入口</p>
            <h2>{{ authMode === 'register' ? '注册账号' : '账号登录' }}</h2>
          </div>

          <div class="segmented">
            <button
              :class="['segmented-btn', { active: authMode === 'register' }]"
              type="button"
              @click="authMode = 'register'"
            >
              注册
            </button>
            <button
              :class="['segmented-btn', { active: authMode === 'login' }]"
              type="button"
              @click="authMode = 'login'"
            >
              登录
            </button>
          </div>
        </div>

        <form v-if="authMode === 'register'" class="form-grid" @submit.prevent="submitRegister">
          <label>
            <span>用户名</span>
            <input v-model.trim="registerForm.username" placeholder="例如 shunyi" required />
          </label>

          <label>
            <span>邮箱</span>
            <input v-model.trim="registerForm.email" type="email" placeholder="name@example.com" required />
          </label>

          <label>
            <span>昵称</span>
            <input v-model.trim="registerForm.nickname" placeholder="展示名称，可选" />
          </label>

          <label>
            <span>密码</span>
            <input v-model="registerForm.password" type="password" placeholder="至少先填一个开发密码" required />
          </label>

          <button class="primary-btn" type="submit" :disabled="loading">
            {{ loading ? '注册中...' : '注册并登录' }}
          </button>
        </form>

        <form v-else class="form-grid" @submit.prevent="submitLogin">
          <label>
            <span>用户名或邮箱</span>
            <input v-model.trim="loginForm.account" placeholder="用户名或邮箱均可" required />
          </label>

          <label>
            <span>密码</span>
            <input v-model="loginForm.password" type="password" placeholder="输入你的密码" required />
          </label>

          <button class="primary-btn" type="submit" :disabled="loading">
            {{ loading ? '登录中...' : '登录' }}
          </button>
        </form>
      </section>

      <section class="panel profile-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">个人中心</p>
            <h2>当前用户资料</h2>
          </div>

          <div class="actions">
            <button class="ghost-btn" type="button" :disabled="profileLoading || !token" @click="loadProfile">
              {{ profileLoading ? '刷新中...' : '刷新资料' }}
            </button>
            <button class="ghost-btn danger" type="button" :disabled="!token" @click="logout">
              退出登录
            </button>
          </div>
        </div>

        <div v-if="currentUser" class="profile-card">
          <div class="profile-avatar">
            {{ (currentUser.nickname || currentUser.username).slice(0, 1).toUpperCase() }}
          </div>

          <div class="profile-info">
            <h3>{{ currentUser.nickname || currentUser.username }}</h3>
            <p>@{{ currentUser.username }}</p>
            <p>{{ currentUser.email }}</p>
            <p>{{ currentUser.bio || '还没有填写个人简介。' }}</p>
          </div>

          <dl class="profile-stats">
            <div>
              <dt>用户 ID</dt>
              <dd>{{ currentUser.id }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ currentUser.status === 1 ? '正常' : '禁用' }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ currentUser.createdAt ? new Date(currentUser.createdAt).toLocaleString() : '-' }}</dd>
            </div>
          </dl>
        </div>

        <div v-else class="empty-state">
          <p>还没有登录用户。</p>
          <p>先注册一个账号，或者切到登录标签页使用已有账号进入。</p>
        </div>
      </section>
    </main>
  </div>
</template>
