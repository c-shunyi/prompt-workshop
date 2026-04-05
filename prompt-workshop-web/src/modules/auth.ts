import { computed, reactive } from 'vue'

export type UserInfo = {
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

type LoginInput = {
  account: string
  password: string
}

type RegisterInput = {
  username: string
  email: string
  password: string
  nickname?: string
}

type FeedbackType = 'info' | 'success' | 'error'

export const API_BASE = 'http://localhost:3000/api'
const USER_TOKEN_KEY = 'prompt_workshop_user_token'

export const authState = reactive({
  loading: false,
  profileLoading: false,
  feedbackType: 'info' as FeedbackType,
  feedbackMessage: '首页加载完成后会自动进入登录页，你也可以直接切换到注册。',
  token: localStorage.getItem(USER_TOKEN_KEY) || '',
  currentUser: null as UserInfo | null,
})

export const authSummary = computed(() => {
  if (authState.currentUser) {
    return `当前已登录：${authState.currentUser.nickname || authState.currentUser.username}`
  }

  return '使用用户名或邮箱登录，也可以注册一个新账号后自动进入个人中心。'
})

export const userDisplayName = computed(
  () => authState.currentUser?.nickname || authState.currentUser?.username || '创作者',
)

let hydrationPromise: Promise<boolean> | null = null
let hydratedToken = ''

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

export function setFeedback(message: string, type: FeedbackType = 'info') {
  authState.feedbackMessage = message
  authState.feedbackType = type
}

function persistToken(value: string) {
  authState.token = value
  localStorage.setItem(USER_TOKEN_KEY, value)
}

function clearSession() {
  authState.token = ''
  authState.currentUser = null
  hydratedToken = ''
  localStorage.removeItem(USER_TOKEN_KEY)
}

export async function loadProfile(options?: { silent?: boolean }) {
  if (!authState.token) {
    return false
  }

  authState.profileLoading = true

  try {
    const profile = await request<UserInfo>('/users/me', { method: 'GET' }, authState.token)
    authState.currentUser = profile
    hydratedToken = authState.token

    if (!options?.silent) {
      setFeedback('已同步最新的用户资料。', 'success')
    }

    return true
  } catch (error) {
    clearSession()

    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '获取用户信息失败', 'error')
    }

    return false
  } finally {
    authState.profileLoading = false
  }
}

export async function hydrateSession() {
  const activeToken = authState.token

  if (!activeToken) {
    authState.currentUser = null
    hydratedToken = ''
    return false
  }

  if (authState.currentUser && hydratedToken === activeToken) {
    return true
  }

  if (hydrationPromise) {
    return hydrationPromise
  }

  hydrationPromise = loadProfile({ silent: true })

  try {
    return await hydrationPromise
  } finally {
    hydrationPromise = null
  }
}

export async function loginUser(input: LoginInput) {
  authState.loading = true

  try {
    const data = await request<AuthPayload>('/users/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    persistToken(data.token)
    authState.currentUser = data.userInfo
    hydratedToken = ''
    setFeedback('登录成功，欢迎回来。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '登录失败', 'error')
    return false
  } finally {
    authState.loading = false
  }
}

export async function registerUser(input: RegisterInput) {
  authState.loading = true

  try {
    const data = await request<AuthPayload>('/users/register', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    persistToken(data.token)
    authState.currentUser = data.userInfo
    hydratedToken = ''
    setFeedback('注册成功，已经自动登录。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '注册失败', 'error')
    return false
  } finally {
    authState.loading = false
  }
}

export function logoutUser() {
  clearSession()
  setFeedback('已退出登录。', 'info')
}
