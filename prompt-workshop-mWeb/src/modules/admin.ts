import { computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

export type AdminInfo = {
  id: number
  username: string
  nickname?: string | null
  role: string
  status: number
  createdAt?: string
  lastLoginAt?: string | null
}

export type UserInfo = {
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

type FeedbackType = 'info' | 'success' | 'error'

export const API_BASE = 'http://localhost:3000/api'
const ADMIN_TOKEN_KEY = 'prompt_workshop_admin_token'
const ADMIN_INFO_KEY = 'prompt_workshop_admin_info'

function parseStoredAdmin() {
  const raw = localStorage.getItem(ADMIN_INFO_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminInfo
  } catch {
    localStorage.removeItem(ADMIN_INFO_KEY)
    return null
  }
}

export const adminState = reactive({
  token: localStorage.getItem(ADMIN_TOKEN_KEY) || '',
  currentAdmin: parseStoredAdmin(),
  adminList: [] as AdminInfo[],
  userList: [] as UserInfo[],
  loading: false,
  dashboardLoading: false,
  dashboardLoaded: false,
  feedbackType: 'info' as FeedbackType,
  feedbackMessage: 'Element Plus 已接入管理台，未登录访问后台时会自动跳转到登录页。',
})

export const roleLabel = computed(() => {
  if (!adminState.currentAdmin) {
    return '未登录'
  }

  return adminState.currentAdmin.role === 'super_admin' ? '超级管理员' : '普通管理员'
})

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
  adminState.feedbackMessage = message
  adminState.feedbackType = type

  if (type === 'success') {
    ElMessage.success(message)
  } else if (type === 'error') {
    ElMessage.error(message)
  }
}

function persistSession(token: string, adminInfo: AdminInfo) {
  adminState.token = token
  adminState.currentAdmin = adminInfo
  adminState.dashboardLoaded = false
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(adminInfo))
}

function persistAdminInfo(adminInfo: AdminInfo) {
  adminState.currentAdmin = adminInfo
  localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(adminInfo))
}

function clearSession() {
  adminState.token = ''
  adminState.currentAdmin = null
  adminState.adminList = []
  adminState.userList = []
  adminState.dashboardLoaded = false
  hydratedToken = ''
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_INFO_KEY)
}

export async function loginAdmin(input: { username: string; password: string }) {
  adminState.loading = true

  try {
    const data = await request<AdminLoginPayload>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    persistSession(data.token, data.adminInfo)
    setFeedback('管理台登录成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '管理台登录失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function loadDashboard(options?: { silent?: boolean }) {
  if (!adminState.token) {
    return false
  }

  adminState.dashboardLoading = true

  try {
    const [admins, users] = await Promise.all([
      request<AdminInfo[]>('/admin/admins', { method: 'GET' }, adminState.token),
      request<UserInfo[]>('/admin/users', { method: 'GET' }, adminState.token),
    ])

    adminState.adminList = admins
    adminState.userList = users
    adminState.dashboardLoaded = true
    hydratedToken = adminState.token

    const matchedAdmin = admins.find((item) => item.username === adminState.currentAdmin?.username)
    if (matchedAdmin) {
      persistAdminInfo(matchedAdmin)
    }

    if (!options?.silent) {
      setFeedback('管理台数据已刷新。', 'success')
    }

    return true
  } catch (error) {
    clearSession()

    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载管理台数据失败', 'error')
    }

    return false
  } finally {
    adminState.dashboardLoading = false
  }
}

export async function hydrateAdminSession() {
  const activeToken = adminState.token

  if (!activeToken) {
    adminState.currentAdmin = null
    adminState.dashboardLoaded = false
    hydratedToken = ''
    return false
  }

  if (adminState.currentAdmin && adminState.dashboardLoaded && hydratedToken === activeToken) {
    return true
  }

  if (hydrationPromise) {
    return hydrationPromise
  }

  hydrationPromise = loadDashboard({ silent: true })

  try {
    return await hydrationPromise
  } finally {
    hydrationPromise = null
  }
}

export async function createAdminAccount(input: {
  username: string
  password: string
  nickname: string
  role: string
}) {
  adminState.loading = true

  try {
    await request<AdminInfo>(
      '/admin/admins',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      adminState.token,
    )

    setFeedback('管理员创建成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '创建管理员失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function updateUserAccountStatus(userId: number, status: 0 | 1) {
  adminState.loading = true

  try {
    await request<UserInfo>(
      `/admin/users/${userId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      adminState.token,
    )

    setFeedback(status === 1 ? '用户已恢复正常。' : '用户已被禁用。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '更新用户状态失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export function logoutAdmin() {
  clearSession()
  setFeedback('已退出管理台。', 'info')
}
