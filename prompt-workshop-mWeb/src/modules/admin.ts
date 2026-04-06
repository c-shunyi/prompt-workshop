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

export type DeleteArticleResult = {
  id: number
  title: string
}

export type DeleteTagResult = {
  id: number
  name: string
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
  content?: string
}

type ApiResponse<T> = {
  code: number
  message: string
  data: T | null
}

type PaginatedPayload<T> = {
  list: T[]
  total: number
  page: number
  pageSize: number
}

type AdminLoginPayload = {
  token: string
  adminInfo: AdminInfo
}

type FeedbackType = 'info' | 'success' | 'error'

type PaginationState = {
  page: number
  pageSize: number
  total: number
}

type AdminOverviewPayload = {
  adminTotal: number
  userTotal: number
  categoryTotal: number
  tagTotal: number
  articleTotal: number
  publishedArticleTotal: number
}

type AdminEditorOptionsPayload = {
  users: UserInfo[]
  categories: CategoryItem[]
  tags: TagItem[]
}

type AdminArticleStats = {
  total: number
  draft: number
  published: number
  archived: number
}

type AdminArticleListPayload = PaginatedPayload<AdminArticleItem> & {
  stats: AdminArticleStats
}

export type AdminRouteName =
  | 'admin-overview'
  | 'admin-admins'
  | 'admin-users'
  | 'admin-categories'
  | 'admin-tags'
  | 'admin-articles'
  | 'admin-article-create'
  | 'admin-article-edit'

export const API_BASE = 'http://localhost:3000/api'
const ADMIN_TOKEN_KEY = 'prompt_workshop_admin_token'
const ADMIN_INFO_KEY = 'prompt_workshop_admin_info'
const ADMIN_REMEMBERED_LOGIN_KEY = 'prompt_workshop_admin_remembered_login'
const DEFAULT_PAGE_SIZE = 10

function createPaginationState(): PaginationState {
  return {
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    total: 0,
  }
}

function createOverviewState(): AdminOverviewPayload {
  return {
    adminTotal: 0,
    userTotal: 0,
    categoryTotal: 0,
    tagTotal: 0,
    articleTotal: 0,
    publishedArticleTotal: 0,
  }
}

function createArticleStats(): AdminArticleStats {
  return {
    total: 0,
    draft: 0,
    published: 0,
    archived: 0,
  }
}

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

type RememberedAdminLogin = {
  username: string
  password: string
  rememberPassword: boolean
}

function createEmptyRememberedAdminLogin(): RememberedAdminLogin {
  return {
    username: '',
    password: '',
    rememberPassword: false,
  }
}

function parseStoredRememberedLogin() {
  const raw = localStorage.getItem(ADMIN_REMEMBERED_LOGIN_KEY)

  if (!raw) {
    return createEmptyRememberedAdminLogin()
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RememberedAdminLogin>

    return {
      username: typeof parsed.username === 'string' ? parsed.username : '',
      password: typeof parsed.password === 'string' ? parsed.password : '',
      rememberPassword: Boolean(parsed.rememberPassword),
    }
  } catch {
    localStorage.removeItem(ADMIN_REMEMBERED_LOGIN_KEY)
    return createEmptyRememberedAdminLogin()
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
  userOptions: [] as UserInfo[],
  categoryOptions: [] as CategoryItem[],
  tagOptions: [] as TagItem[],
  overview: createOverviewState(),
  articleStats: createArticleStats(),
  adminPagination: createPaginationState(),
  userPagination: createPaginationState(),
  categoryPagination: createPaginationState(),
  tagPagination: createPaginationState(),
  articlePagination: createPaginationState(),
  articleFilters: {
    keyword: '',
    status: -1 as -1 | 0 | 1 | 2,
  },
  loading: false,
  dashboardLoading: false,
  dashboardLoaded: false,
  adminsLoading: false,
  usersLoading: false,
  categoriesLoading: false,
  tagsLoading: false,
  articlesLoading: false,
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

function buildPath(path: string, query: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return
    }

    searchParams.set(key, String(value))
  })

  const queryString = searchParams.toString()
  return queryString ? `${path}?${queryString}` : path
}

function applyPaginationState(state: PaginationState, payload: PaginatedPayload<unknown>) {
  state.page = payload.page
  state.pageSize = payload.pageSize
  state.total = payload.total
}

function normalizeKeyword(value?: string) {
  const keyword = value?.trim()
  return keyword ? keyword : undefined
}

export function setFeedback(message: string, type: FeedbackType = 'info') {
  adminState.feedbackType = type

  if (type === 'success') {
    adminState.feedbackMessage = ''
    ElMessage.success(message)
  } else if (type === 'error') {
    adminState.feedbackMessage = message
    ElMessage.error(message)
  } else {
    adminState.feedbackMessage = ''
    ElMessage.info(message)
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

function persistRememberedLogin(input: { username: string; password: string }, rememberPassword: boolean) {
  if (!rememberPassword) {
    localStorage.removeItem(ADMIN_REMEMBERED_LOGIN_KEY)
    return
  }

  const rememberedLogin: RememberedAdminLogin = {
    username: input.username.trim(),
    password: input.password,
    rememberPassword: true,
  }

  localStorage.setItem(ADMIN_REMEMBERED_LOGIN_KEY, JSON.stringify(rememberedLogin))
}

function resetPaginationState(state: PaginationState) {
  state.page = 1
  state.pageSize = DEFAULT_PAGE_SIZE
  state.total = 0
}

function clearSession() {
  adminState.token = ''
  adminState.currentAdmin = null
  adminState.adminList = []
  adminState.userList = []
  adminState.categories = []
  adminState.tags = []
  adminState.articles = []
  adminState.userOptions = []
  adminState.categoryOptions = []
  adminState.tagOptions = []
  adminState.overview = createOverviewState()
  adminState.articleStats = createArticleStats()
  adminState.dashboardLoaded = false
  adminState.loading = false
  adminState.dashboardLoading = false
  adminState.adminsLoading = false
  adminState.usersLoading = false
  adminState.categoriesLoading = false
  adminState.tagsLoading = false
  adminState.articlesLoading = false
  adminState.feedbackType = 'info'
  adminState.feedbackMessage = ''
  adminState.articleFilters.keyword = ''
  adminState.articleFilters.status = -1
  resetPaginationState(adminState.adminPagination)
  resetPaginationState(adminState.userPagination)
  resetPaginationState(adminState.categoryPagination)
  resetPaginationState(adminState.tagPagination)
  resetPaginationState(adminState.articlePagination)
  hydratedToken = ''
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ADMIN_INFO_KEY)
}

export function getRememberedAdminLogin() {
  return parseStoredRememberedLogin()
}

export async function loginAdmin(
  input: { username: string; password: string },
  options?: { rememberPassword?: boolean },
) {
  adminState.loading = true

  try {
    const data = await request<AdminLoginPayload>('/admin/login', {
      method: 'POST',
      body: JSON.stringify(input),
    })

    persistSession(data.token, data.adminInfo)
    persistRememberedLogin(input, Boolean(options?.rememberPassword))
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
    const [overview, editorOptions] = await Promise.all([
      request<AdminOverviewPayload>('/admin/overview', { method: 'GET' }, adminState.token),
      request<AdminEditorOptionsPayload>('/admin/editor-options', { method: 'GET' }, adminState.token),
    ])

    adminState.overview = overview
    adminState.userOptions = editorOptions.users
    adminState.categoryOptions = editorOptions.categories
    adminState.tagOptions = editorOptions.tags
    adminState.dashboardLoaded = true
    hydratedToken = adminState.token

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

export async function loadAdminAccounts(options?: {
  page?: number
  pageSize?: number
  silent?: boolean
}) {
  if (!adminState.token) {
    return false
  }

  if (adminState.currentAdmin?.role !== 'super_admin') {
    adminState.adminList = []
    resetPaginationState(adminState.adminPagination)
    return true
  }

  adminState.adminsLoading = true

  try {
    const payload = await request<PaginatedPayload<AdminInfo>>(
      buildPath('/admin/admins', {
        page: options?.page ?? adminState.adminPagination.page,
        pageSize: options?.pageSize ?? adminState.adminPagination.pageSize,
      }),
      { method: 'GET' },
      adminState.token,
    )

    adminState.adminList = payload.list
    applyPaginationState(adminState.adminPagination, payload)

    const matchedAdmin = payload.list.find((item) => item.username === adminState.currentAdmin?.username)
    if (matchedAdmin) {
      persistAdminInfo(matchedAdmin)
    }

    return true
  } catch (error) {
    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载管理员列表失败', 'error')
    }

    return false
  } finally {
    adminState.adminsLoading = false
  }
}

export async function loadUsers(options?: {
  page?: number
  pageSize?: number
  silent?: boolean
}) {
  if (!adminState.token) {
    return false
  }

  adminState.usersLoading = true

  try {
    const payload = await request<PaginatedPayload<UserInfo>>(
      buildPath('/admin/users', {
        page: options?.page ?? adminState.userPagination.page,
        pageSize: options?.pageSize ?? adminState.userPagination.pageSize,
      }),
      { method: 'GET' },
      adminState.token,
    )

    adminState.userList = payload.list
    applyPaginationState(adminState.userPagination, payload)
    return true
  } catch (error) {
    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载用户列表失败', 'error')
    }

    return false
  } finally {
    adminState.usersLoading = false
  }
}

export async function loadCategories(options?: {
  page?: number
  pageSize?: number
  silent?: boolean
}) {
  if (!adminState.token) {
    return false
  }

  adminState.categoriesLoading = true

  try {
    const payload = await request<PaginatedPayload<CategoryItem>>(
      buildPath('/admin/categories', {
        page: options?.page ?? adminState.categoryPagination.page,
        pageSize: options?.pageSize ?? adminState.categoryPagination.pageSize,
      }),
      { method: 'GET' },
      adminState.token,
    )

    adminState.categories = payload.list
    applyPaginationState(adminState.categoryPagination, payload)
    return true
  } catch (error) {
    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载分类列表失败', 'error')
    }

    return false
  } finally {
    adminState.categoriesLoading = false
  }
}

export async function loadTags(options?: {
  page?: number
  pageSize?: number
  silent?: boolean
}) {
  if (!adminState.token) {
    return false
  }

  adminState.tagsLoading = true

  try {
    const payload = await request<PaginatedPayload<TagItem>>(
      buildPath('/admin/tags', {
        page: options?.page ?? adminState.tagPagination.page,
        pageSize: options?.pageSize ?? adminState.tagPagination.pageSize,
      }),
      { method: 'GET' },
      adminState.token,
    )

    adminState.tags = payload.list
    applyPaginationState(adminState.tagPagination, payload)
    return true
  } catch (error) {
    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载标签列表失败', 'error')
    }

    return false
  } finally {
    adminState.tagsLoading = false
  }
}

export async function loadArticles(options?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: -1 | 0 | 1 | 2
  silent?: boolean
}) {
  if (!adminState.token) {
    return false
  }

  adminState.articlesLoading = true

  const keyword = normalizeKeyword(options?.keyword ?? adminState.articleFilters.keyword)
  const status = options?.status ?? adminState.articleFilters.status

  try {
    const payload = await request<AdminArticleListPayload>(
      buildPath('/admin/articles', {
        page: options?.page ?? adminState.articlePagination.page,
        pageSize: options?.pageSize ?? adminState.articlePagination.pageSize,
        keyword,
        status: status === -1 ? undefined : status,
      }),
      { method: 'GET' },
      adminState.token,
    )

    adminState.articles = payload.list
    adminState.articleStats = payload.stats
    adminState.articleFilters.keyword = keyword || ''
    adminState.articleFilters.status = status
    applyPaginationState(adminState.articlePagination, payload)
    return true
  } catch (error) {
    if (!options?.silent) {
      setFeedback(error instanceof Error ? error.message : '加载文章列表失败', 'error')
    }

    return false
  } finally {
    adminState.articlesLoading = false
  }
}

export async function refreshAdminWorkspace(routeName?: string) {
  const success = await loadDashboard()

  if (!success) {
    return false
  }

  switch (routeName) {
    case 'admin-admins':
      return loadAdminAccounts()
    case 'admin-users':
      return loadUsers()
    case 'admin-categories':
      return loadCategories()
    case 'admin-tags':
      return loadTags()
    case 'admin-articles':
      return loadArticles()
    default:
      return true
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

export async function deleteTagItem(id: number) {
  adminState.loading = true

  try {
    const result = await request<DeleteTagResult>(
      `/admin/tags/${id}`,
      {
        method: 'DELETE',
      },
      adminState.token,
    )

    setFeedback(
      result.affectedArticles > 0
        ? `标签《${result.name}》删除成功，已有 ${result.affectedArticles} 篇文章移除了该标签。`
        : `标签《${result.name}》删除成功。`,
      'success',
    )
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '删除标签失败', 'error')
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

export async function loadAdminArticleDetail(articleId: number) {
  adminState.loading = true

  try {
    return await request<AdminArticleItem>(
      `/admin/articles/${articleId}`,
      {
        method: 'GET',
      },
      adminState.token,
    )
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '加载文章详情失败', 'error')
    return null
  } finally {
    adminState.loading = false
  }
}

export async function saveArticleByAdmin(input: {
  articleId?: number
  userId?: number
  title: string
  summary: string
  content: string
  categoryId?: number | null
  tagIds: number[]
  status: number
}) {
  adminState.loading = true

  try {
    await request<AdminArticleItem>(
      input.articleId ? `/admin/articles/${input.articleId}` : '/admin/articles',
      {
        method: input.articleId ? 'PATCH' : 'POST',
        body: JSON.stringify({
          userId: input.userId,
          title: input.title,
          summary: input.summary,
          content: input.content,
          categoryId: input.categoryId,
          tagIds: input.tagIds,
          status: input.status,
        }),
      },
      adminState.token,
    )

    setFeedback(input.articleId ? '文章更新成功。' : '文章创建成功。', 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '保存文章失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export async function deleteArticleByAdmin(articleId: number) {
  adminState.loading = true

  try {
    const result = await request<DeleteArticleResult>(
      `/admin/articles/${articleId}`,
      {
        method: 'DELETE',
      },
      adminState.token,
    )

    setFeedback(`文章《${result.title}》已删除。`, 'success')
    return true
  } catch (error) {
    setFeedback(error instanceof Error ? error.message : '删除文章失败', 'error')
    return false
  } finally {
    adminState.loading = false
  }
}

export function logoutAdmin() {
  clearSession()
  setFeedback('已退出管理台。', 'info')
}
