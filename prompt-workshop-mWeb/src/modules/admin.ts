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

export type CategoryItem = {
  id: number
  name: string
  slug: string
  sort: number
  status: number
  createdAt?: string
  updatedAt?: string
}

export type TagItem = {
  id: number
  name: string
  createdAt?: string
  updatedAt?: string
}

export type DeleteCategoryResult = {
  id: number
  affectedArticles: number
}

export type ArticleTag = {
  id: number
  name: string
}

export type AdminArticleItem = {
  id: number
  userId: number
  categoryId: number | null
  title: string
  summary?: string | null
  status: number
  viewCount: number
  likeCount: number
  favoriteCount: number
  publishedAt?: string | null
  createdAt?: string
  updatedAt?: string
  authorUsername: string
  authorNickname?: string | null
  categoryName?: string | null
  tags: ArticleTag[]
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
  categories: [] as CategoryItem[],
  tags: [] as TagItem[],
  articles: [] as AdminArticleItem[],
  loading: false,
  dashboardLoading: false,
  dashboardLoaded: false,
  feedbackType: 'info' as FeedbackType,
  feedbackMessage: '',
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
  adminState.categories = []
  adminState.tags = []
  adminState.articles = []
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
    const shouldLoadAdmins = adminState.currentAdmin?.role === 'super_admin'

    const [admins, users, categories, tags, articles] = await Promise.all([
      shouldLoadAdmins
        ? request<AdminInfo[]>('/admin/admins', { method: 'GET' }, adminState.token)
        : Promise.resolve([] as AdminInfo[]),
      request<UserInfo[]>('/admin/users', { method: 'GET' }, adminState.token),
      request<CategoryItem[]>('/admin/categories', { method: 'GET' }, adminState.token),
      request<TagItem[]>('/admin/tags', { method: 'GET' }, adminState.token),
      request<AdminArticleItem[]>('/admin/articles', { method: 'GET' }, adminState.token),
    ])

    adminState.adminList = admins
    adminState.userList = users
    adminState.categories = categories
    adminState.tags = tags
    adminState.articles = articles
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

export async function createCategory(input: {
  name: string
  slug: string
  sort: number
  status: number
}) {
  adminState.loading = true

  try {
    await request<CategoryItem>(
      '/admin/categories',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      adminState.token,
    )

    setFeedback('分类创建成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '创建分类失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function updateCategoryItem(id: number, input: {
  name?: string
  slug?: string
  sort?: number
  status?: number
}) {
  adminState.loading = true

  try {
    await request<CategoryItem>(
      `/admin/categories/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      adminState.token,
    )

    setFeedback('分类更新成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '更新分类失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function deleteCategoryItem(id: number) {
  adminState.loading = true

  try {
    const result = await request<DeleteCategoryResult>(
      `/admin/categories/${id}`,
      {
        method: 'DELETE',
      },
      adminState.token,
    )

    setFeedback(
      result.affectedArticles > 0
        ? `分类删除成功，已有 ${result.affectedArticles} 篇文章改为未分类。`
        : '分类删除成功。',
      'success',
    )
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '删除分类失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function createTagItem(input: { name: string }) {
  adminState.loading = true

  try {
    await request<TagItem>(
      '/admin/tags',
      {
        method: 'POST',
        body: JSON.stringify(input),
      },
      adminState.token,
    )

    setFeedback('标签创建成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '创建标签失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function updateTagItem(id: number, input: { name: string }) {
  adminState.loading = true

  try {
    await request<TagItem>(
      `/admin/tags/${id}`,
      {
        method: 'PATCH',
        body: JSON.stringify(input),
      },
      adminState.token,
    )

    setFeedback('标签更新成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '更新标签失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function updateArticleStatusByAdmin(articleId: number, status: 0 | 1 | 2) {
  adminState.loading = true

  try {
    await request<AdminArticleItem>(
      `/admin/articles/${articleId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
      adminState.token,
    )

    setFeedback('文章状态更新成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '更新文章状态失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export function logoutAdmin() {
  clearSession()
  setFeedback('已退出管理台。', 'info')
}
