<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, RefreshRight } from '@element-plus/icons-vue'
import {
  adminState,
  createAdminAccount,
  createCategory,
  createTagItem,
  loadDashboard,
  logoutAdmin,
  roleLabel,
  updateArticleStatusByAdmin,
  updateCategoryItem,
  updateTagItem,
  updateUserAccountStatus,
  type AdminArticleItem,
  type CategoryItem,
  type TagItem,
} from '../modules/admin'

const router = useRouter()

const createAdminForm = reactive({
  username: '',
  password: '',
  nickname: '',
  role: 'admin',
})

const createCategoryForm = reactive({
  name: '',
  slug: '',
  sort: 0,
  status: 1,
})

const createTagForm = reactive({
  name: '',
})

const editingCategoryId = ref<number | null>(null)
const editingTagId = ref<number | null>(null)

const editingCategoryForm = reactive({
  name: '',
  slug: '',
  sort: 0,
  status: 1,
})

const editingTagForm = reactive({
  name: '',
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
  { href: '#category-list', label: '分类管理' },
  { href: '#tag-list', label: '标签管理' },
  { href: '#article-list', label: '文章审核' },
]

const publishedArticleCount = computed(
  () => adminState.articles.filter((item) => item.status === 1).length,
)

const metrics = computed(() => [
  {
    eyebrow: '管理员数量',
    value: String(adminState.adminList.length),
    label: '已接入后台账号',
    trend: '查看权限',
  },
  {
    eyebrow: '前台用户数量',
    value: String(adminState.userList.length),
    label: '当前注册用户',
    trend: '管理状态',
  },
  {
    eyebrow: '内容分类数量',
    value: String(adminState.categories.length),
    label: `标签 ${adminState.tags.length} 个`,
    trend: '维护目录',
  },
  {
    eyebrow: '已发布文章',
    value: String(publishedArticleCount.value),
    label: `总文章 ${adminState.articles.length} 篇`,
    trend: adminState.dashboardLoading ? '同步中' : '审核中',
  },
])

function formatDate(value?: string | null) {
  if (!value) {
    return '-'
  }

  return new Date(value).toLocaleString()
}

function getArticleStatusLabel(status: number) {
  if (status === 1) {
    return '已发布'
  }

  if (status === 2) {
    return '下架'
  }

  return '草稿'
}

function getArticleStatusType(status: number) {
  if (status === 1) {
    return 'success'
  }

  if (status === 2) {
    return 'danger'
  }

  return 'warning'
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

async function submitCreateCategory() {
  if (!createCategoryForm.name || !createCategoryForm.slug) {
    ElMessage.warning('请完整填写分类名称和 slug')
    return
  }

  const success = await createCategory({
    name: createCategoryForm.name.trim(),
    slug: createCategoryForm.slug.trim(),
    sort: Number(createCategoryForm.sort) || 0,
    status: createCategoryForm.status,
  })

  if (!success) {
    return
  }

  createCategoryForm.name = ''
  createCategoryForm.slug = ''
  createCategoryForm.sort = 0
  createCategoryForm.status = 1
  await refreshDashboard()
}

async function submitCreateTag() {
  if (!createTagForm.name) {
    ElMessage.warning('请输入标签名称')
    return
  }

  const success = await createTagItem({
    name: createTagForm.name.trim(),
  })

  if (!success) {
    return
  }

  createTagForm.name = ''
  await refreshDashboard()
}

function startEditCategory(category: CategoryItem) {
  editingCategoryId.value = category.id
  editingCategoryForm.name = category.name
  editingCategoryForm.slug = category.slug
  editingCategoryForm.sort = category.sort
  editingCategoryForm.status = category.status
}

function cancelEditCategory() {
  editingCategoryId.value = null
  editingCategoryForm.name = ''
  editingCategoryForm.slug = ''
  editingCategoryForm.sort = 0
  editingCategoryForm.status = 1
}

async function saveCategory(categoryId: number) {
  if (!editingCategoryForm.name || !editingCategoryForm.slug) {
    ElMessage.warning('分类名称和 slug 不能为空')
    return
  }

  const success = await updateCategoryItem(categoryId, {
    name: editingCategoryForm.name.trim(),
    slug: editingCategoryForm.slug.trim(),
    sort: Number(editingCategoryForm.sort) || 0,
    status: editingCategoryForm.status,
  })

  if (!success) {
    return
  }

  cancelEditCategory()
  await refreshDashboard()
}

function startEditTag(tag: TagItem) {
  editingTagId.value = tag.id
  editingTagForm.name = tag.name
}

function cancelEditTag() {
  editingTagId.value = null
  editingTagForm.name = ''
}

async function saveTag(tagId: number) {
  if (!editingTagForm.name) {
    ElMessage.warning('标签名称不能为空')
    return
  }

  const success = await updateTagItem(tagId, {
    name: editingTagForm.name.trim(),
  })

  if (!success) {
    return
  }

  cancelEditTag()
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

async function updateArticleStatus(article: AdminArticleItem, status: 0 | 1 | 2) {
  if (article.status === status) {
    return
  }

  const success = await updateArticleStatusByAdmin(article.id, status)

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
          管理台已切到文章平台场景，当前支持管理员、前台用户、分类、标签和文章状态管理。
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
                <span>当前管理员</span>
                <strong>{{ adminState.currentAdmin?.nickname || adminState.currentAdmin?.username || '-' }}</strong>
              </div>
              <div class="admin-summary-item">
                <span>角色</span>
                <strong>{{ roleLabel }}</strong>
              </div>
              <div class="admin-summary-item">
                <span>内容状态</span>
                <strong>{{ adminState.dashboardLoading ? '同步中' : '已连接' }}</strong>
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

              <el-button
                type="primary"
                class="admin-panel__submit"
                :icon="Plus"
                :loading="adminState.loading"
                @click="submitCreateAdmin"
              >
                创建管理员
              </el-button>
            </el-form>
          </article>

          <article class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <p class="admin-panel__eyebrow">内容目录</p>
                <h3 class="admin-panel__title">创建分类</h3>
              </div>
            </div>

            <el-form :model="createCategoryForm" label-position="top" @submit.prevent="submitCreateCategory">
              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="分类名称">
                    <el-input v-model.trim="createCategoryForm.name" placeholder="例如 前端开发" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="Slug">
                    <el-input v-model.trim="createCategoryForm.slug" placeholder="例如 frontend" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="12">
                <el-col :span="12">
                  <el-form-item label="排序值">
                    <el-input-number v-model="createCategoryForm.sort" class="admin-panel__full-width" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="状态">
                    <el-select v-model="createCategoryForm.status" class="admin-panel__full-width">
                      <el-option label="启用" :value="1" />
                      <el-option label="禁用" :value="0" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-button
                type="primary"
                class="admin-panel__submit"
                :icon="Plus"
                :loading="adminState.loading"
                @click="submitCreateCategory"
              >
                创建分类
              </el-button>
            </el-form>
          </article>

          <article class="admin-panel">
            <div class="admin-panel__head">
              <div>
                <p class="admin-panel__eyebrow">内容标签</p>
                <h3 class="admin-panel__title">创建标签</h3>
              </div>
            </div>

            <el-form :model="createTagForm" label-position="top" @submit.prevent="submitCreateTag">
              <el-form-item label="标签名称">
                <el-input v-model.trim="createTagForm.name" placeholder="例如 Vue、Node.js、产品设计" />
              </el-form-item>

              <el-button
                type="primary"
                class="admin-panel__submit"
                :icon="Plus"
                :loading="adminState.loading"
                @click="submitCreateTag"
              >
                创建标签
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

        <article id="category-list" class="admin-panel admin-panel--table">
          <div class="admin-panel__head">
            <div>
              <p class="admin-panel__eyebrow">分类管理</p>
              <h3 class="admin-panel__title">文章分类列表</h3>
            </div>
          </div>

          <el-table :data="adminState.categories" stripe empty-text="当前还没有分类">
            <el-table-column prop="name" label="名称" min-width="180">
              <template #default="{ row }">
                <template v-if="editingCategoryId === row.id">
                  <el-input v-model.trim="editingCategoryForm.name" />
                </template>
                <template v-else>
                  {{ row.name }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="slug" label="Slug" min-width="180">
              <template #default="{ row }">
                <template v-if="editingCategoryId === row.id">
                  <el-input v-model.trim="editingCategoryForm.slug" />
                </template>
                <template v-else>
                  {{ row.slug }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" min-width="120">
              <template #default="{ row }">
                <template v-if="editingCategoryId === row.id">
                  <el-input-number v-model="editingCategoryForm.sort" class="admin-table-input" />
                </template>
                <template v-else>
                  {{ row.sort }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="{ row }">
                <template v-if="editingCategoryId === row.id">
                  <el-select v-model="editingCategoryForm.status" class="admin-table-input">
                    <el-option label="启用" :value="1" />
                    <el-option label="禁用" :value="0" />
                  </el-select>
                </template>
                <template v-else>
                  <el-tag :type="row.status === 1 ? 'success' : 'info'" round>
                    {{ row.status === 1 ? '启用' : '禁用' }}
                  </el-tag>
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="220" fixed="right">
              <template #default="{ row }">
                <el-space v-if="editingCategoryId === row.id">
                  <el-button size="small" type="primary" :loading="adminState.loading" @click="saveCategory(row.id)">
                    保存
                  </el-button>
                  <el-button size="small" plain @click="cancelEditCategory">取消</el-button>
                </el-space>
                <el-button v-else size="small" plain @click="startEditCategory(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </article>

        <article id="tag-list" class="admin-panel admin-panel--table">
          <div class="admin-panel__head">
            <div>
              <p class="admin-panel__eyebrow">标签管理</p>
              <h3 class="admin-panel__title">文章标签列表</h3>
            </div>
          </div>

          <el-table :data="adminState.tags" stripe empty-text="当前还没有标签">
            <el-table-column prop="name" label="标签名称" min-width="220">
              <template #default="{ row }">
                <template v-if="editingTagId === row.id">
                  <el-input v-model.trim="editingTagForm.name" />
                </template>
                <template v-else>
                  {{ row.name }}
                </template>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="220" fixed="right">
              <template #default="{ row }">
                <el-space v-if="editingTagId === row.id">
                  <el-button size="small" type="primary" :loading="adminState.loading" @click="saveTag(row.id)">
                    保存
                  </el-button>
                  <el-button size="small" plain @click="cancelEditTag">取消</el-button>
                </el-space>
                <el-button v-else size="small" plain @click="startEditTag(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </article>

        <article id="article-list" class="admin-panel admin-panel--table">
          <div class="admin-panel__head">
            <div>
              <p class="admin-panel__eyebrow">文章管理</p>
              <h3 class="admin-panel__title">文章审核与状态维护</h3>
            </div>
          </div>

          <el-table :data="adminState.articles" stripe empty-text="当前还没有文章">
            <el-table-column prop="title" label="标题" min-width="220" />
            <el-table-column label="作者" min-width="150">
              <template #default="{ row }">
                {{ row.authorNickname || row.authorUsername }}
              </template>
            </el-table-column>
            <el-table-column label="分类" min-width="140">
              <template #default="{ row }">
                {{ row.categoryName || '未分类' }}
              </template>
            </el-table-column>
            <el-table-column label="标签" min-width="220">
              <template #default="{ row }">
                <div class="admin-tag-list">
                  <el-tag v-for="tag in row.tags" :key="tag.id" effect="plain" round>
                    {{ tag.name }}
                  </el-tag>
                  <span v-if="!row.tags.length" class="admin-muted">无标签</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" min-width="120">
              <template #default="{ row }">
                <el-tag :type="getArticleStatusType(row.status)" round>
                  {{ getArticleStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="数据" min-width="180">
              <template #default="{ row }">
                <span class="admin-muted">
                  {{ row.viewCount }} 浏览 / {{ row.likeCount }} 赞 / {{ row.favoriteCount }} 收藏
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="updatedAt" label="更新时间" min-width="180">
              <template #default="{ row }">
                {{ formatDate(row.updatedAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" min-width="250" fixed="right">
              <template #default="{ row }">
                <el-space wrap>
                  <el-button
                    size="small"
                    type="warning"
                    plain
                    :disabled="adminState.loading || row.status === 0"
                    @click="updateArticleStatus(row, 0)"
                  >
                    草稿
                  </el-button>
                  <el-button
                    size="small"
                    type="success"
                    plain
                    :disabled="adminState.loading || row.status === 1"
                    @click="updateArticleStatus(row, 1)"
                  >
                    发布
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    plain
                    :disabled="adminState.loading || row.status === 2"
                    @click="updateArticleStatus(row, 2)"
                  >
                    下架
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
