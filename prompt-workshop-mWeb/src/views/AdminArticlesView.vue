<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { EditPen, MoreFilled, Plus, Search } from '@element-plus/icons-vue'
import {
  adminState,
  deleteArticleByAdmin,
  loadAdminArticleDetail,
  loadDashboard,
  saveArticleByAdmin,
  updateArticleStatusByAdmin,
  type AdminArticleItem,
} from '../modules/admin'

const dialogVisible = ref(false)
const isEditMode = ref(false)
const editingArticleId = ref<number | null>(null)

const filters = reactive({
  keyword: '',
  status: -1,
})

const articleForm = reactive({
  userId: 0,
  title: '',
  summary: '',
  content: '',
  categoryId: 0,
  tagIds: [] as number[],
  status: 0,
})

const availableUsers = computed(() => adminState.userList.filter((item) => item.status === 1))
const articleStats = computed(() => ({
  total: adminState.articles.length,
  draft: adminState.articles.filter((item) => item.status === 0).length,
  published: adminState.articles.filter((item) => item.status === 1).length,
  archived: adminState.articles.filter((item) => item.status === 2).length,
}))
const filteredArticles = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()

  return adminState.articles.filter((article) => {
    const matchesStatus = filters.status === -1 || article.status === filters.status

    if (!matchesStatus) {
      return false
    }

    if (!keyword) {
      return true
    }

    const searchText = [
      article.title,
      article.summary || '',
      article.authorNickname || '',
      article.authorUsername,
      article.categoryName || '',
      article.tags.map((tag) => tag.name).join(' '),
    ]
      .join(' ')
      .toLowerCase()

    return searchText.includes(keyword)
  })
})
const filterSummary = computed(() => {
  if (!filters.keyword.trim() && filters.status === -1) {
    return `共 ${articleStats.value.total} 篇文章`
  }

  return `筛选结果 ${filteredArticles.value.length} 篇 / 总计 ${articleStats.value.total} 篇`
})

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

function getAuthorLabel(article: AdminArticleItem) {
  return article.authorNickname || article.authorUsername
}

function resetForm() {
  articleForm.userId = availableUsers.value[0]?.id ?? 0
  articleForm.title = ''
  articleForm.summary = ''
  articleForm.content = ''
  articleForm.categoryId = 0
  articleForm.tagIds = []
  articleForm.status = 0
}

function openCreateDialog(defaultStatus = 0) {
  if (!availableUsers.value.length) {
    ElMessage.warning('当前没有可用的前台用户，请先创建用户账号')
    return
  }

  resetForm()
  articleForm.status = defaultStatus
  isEditMode.value = false
  editingArticleId.value = null
  dialogVisible.value = true
}

function openPublishDialog() {
  openCreateDialog(1)
}

function resetFilters() {
  filters.keyword = ''
  filters.status = -1
}

async function openEditDialog(article: AdminArticleItem) {
  const detail = await loadAdminArticleDetail(article.id)

  if (!detail) {
    return
  }

  isEditMode.value = true
  editingArticleId.value = article.id
  articleForm.userId = detail.userId
  articleForm.title = detail.title
  articleForm.summary = detail.summary || ''
  articleForm.content = detail.content || ''
  articleForm.categoryId = detail.categoryId || 0
  articleForm.tagIds = detail.tags.map((tag) => tag.id)
  articleForm.status = detail.status
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
  isEditMode.value = false
  editingArticleId.value = null
  resetForm()
}

async function submitArticleWithStatus(status: number) {
  if (!articleForm.userId || !articleForm.title || !articleForm.content) {
    ElMessage.warning('请选择作者，并填写标题和正文')
    return
  }

  articleForm.status = status

  const success = await saveArticleByAdmin({
    articleId: editingArticleId.value || undefined,
    userId: articleForm.userId,
    title: articleForm.title.trim(),
    summary: articleForm.summary.trim(),
    content: articleForm.content,
    categoryId: articleForm.categoryId || null,
    tagIds: articleForm.tagIds,
    status: articleForm.status,
  })

  if (!success) {
    return
  }

  closeDialog()
  await loadDashboard({ silent: true })
}

async function updateArticleStatus(article: AdminArticleItem, status: 0 | 1 | 2) {
  if (article.status === status) {
    return
  }

  const success = await updateArticleStatusByAdmin(article.id, status)

  if (success) {
    await loadDashboard({ silent: true })
  }
}

async function removeArticle(articleId: number) {
  const success = await deleteArticleByAdmin(articleId)

  if (success) {
    await loadDashboard({ silent: true })
  }
}

async function handleArticleCommand(article: AdminArticleItem, command: string | number | object) {
  if (typeof command !== 'string') {
    return
  }

  if (command === 'delete') {
    try {
      await ElMessageBox.confirm(
        '删除文章后正文、标签、点赞和收藏记录都会一起删除，确认继续吗？',
        '删除文章',
        {
          confirmButtonText: '确认删除',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } catch {
      return
    }

    await removeArticle(article.id)
    return
  }

  if (command === 'draft') {
    await updateArticleStatus(article, 0)
    return
  }

  if (command === 'publish') {
    await updateArticleStatus(article, 1)
    return
  }

  if (command === 'archive') {
    await updateArticleStatus(article, 2)
  }
}
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">文章管理</p>
          <h3 class="admin-panel__title">文章列表、筛选与创建</h3>
        </div>

        <el-space wrap>
          <el-button plain @click="openCreateDialog(0)">新建草稿</el-button>
          <el-button type="primary" :icon="Plus" @click="openPublishDialog">创建并发布</el-button>
        </el-space>
      </div>

      <div class="admin-article-toolbar">
        <div class="admin-article-toolbar__stats">
          <el-tag round effect="plain">总计 {{ articleStats.total }}</el-tag>
          <el-tag round type="warning" effect="plain">草稿 {{ articleStats.draft }}</el-tag>
          <el-tag round type="success" effect="plain">已发布 {{ articleStats.published }}</el-tag>
          <el-tag round type="danger" effect="plain">下架 {{ articleStats.archived }}</el-tag>
        </div>

        <div class="admin-article-toolbar__filters">
          <el-input
            v-model.trim="filters.keyword"
            class="admin-article-toolbar__search"
            clearable
            :prefix-icon="Search"
            placeholder="搜索标题、作者、分类或标签"
          />
          <el-select v-model="filters.status" class="admin-article-toolbar__status">
            <el-option label="全部状态" :value="-1" />
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="下架" :value="2" />
          </el-select>
          <el-button plain @click="resetFilters">重置</el-button>
        </div>
      </div>

      <p class="admin-article-toolbar__summary">
        {{ filterSummary }}
      </p>

      <div class="admin-article-table">
        <el-table :data="filteredArticles" stripe table-layout="fixed" empty-text="当前还没有文章">
          <el-table-column label="文章">
            <template #default="{ row }">
              <div class="admin-article-card">
                <strong class="admin-article-card__title">{{ row.title }}</strong>
                <p class="admin-article-card__summary">{{ row.summary || '暂无摘要' }}</p>

                <div class="admin-article-card__meta">
                  <span>{{ getAuthorLabel(row) }}</span>
                  <span>{{ row.categoryName || '未分类' }}</span>
                </div>

                <div class="admin-article-card__tags">
                  <el-tag v-for="tag in row.tags.slice(0, 3)" :key="tag.id" effect="plain" round size="small">
                    {{ tag.name }}
                  </el-tag>
                  <span v-if="row.tags.length > 3" class="admin-muted">+{{ row.tags.length - 3 }}</span>
                  <span v-if="!row.tags.length" class="admin-muted">无标签</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="96" align="center">
            <template #default="{ row }">
              <el-tag :type="getArticleStatusType(row.status)" round>
                {{ getArticleStatusLabel(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="数据" width="190">
            <template #default="{ row }">
              <div class="admin-article-metrics">
                <span>{{ row.viewCount }} 浏览 / {{ row.likeCount }} 赞 / {{ row.favoriteCount }} 收藏</span>
                <span>更新于 {{ formatDate(row.updatedAt) }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="136" align="center">
            <template #default="{ row }">
              <div class="admin-article-actions">
                <el-button size="small" plain :icon="EditPen" @click="openEditDialog(row)">编辑</el-button>
                <el-dropdown
                  trigger="click"
                  @command="handleArticleCommand(row, $event)"
                >
                  <el-button size="small" plain :icon="MoreFilled">
                    更多
                  </el-button>

                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="draft" :disabled="adminState.loading || row.status === 0">
                        设为草稿
                      </el-dropdown-item>
                      <el-dropdown-item command="publish" :disabled="adminState.loading || row.status === 1">
                        立即发布
                      </el-dropdown-item>
                      <el-dropdown-item command="archive" :disabled="adminState.loading || row.status === 2">
                        下架文章
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" :disabled="adminState.loading" divided>
                        删除文章
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </template>
          </el-table-column>

          <template #empty>
            <el-empty description="当前没有符合条件的文章">
              <el-space wrap>
                <el-button plain @click="openCreateDialog(0)">新建草稿</el-button>
                <el-button type="primary" @click="openPublishDialog">创建并发布</el-button>
              </el-space>
            </el-empty>
          </template>
        </el-table>
      </div>
    </article>

    <el-dialog
      v-model="dialogVisible"
      :title="isEditMode ? '编辑文章' : '创建文章'"
      width="860px"
      @close="closeDialog"
    >
      <el-form :model="articleForm" label-position="top">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="文章作者">
              <el-select v-model="articleForm.userId" class="admin-panel__full-width" filterable>
                <el-option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :label="`${user.nickname || user.username} (${user.username})`"
                  :value="user.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布状态">
              <el-select v-model="articleForm.status" class="admin-panel__full-width">
                <el-option label="草稿" :value="0" />
                <el-option label="发布" :value="1" />
                <el-option label="下架" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章标题">
          <el-input v-model.trim="articleForm.title" placeholder="输入文章标题" />
        </el-form-item>

        <el-form-item label="文章摘要">
          <el-input v-model.trim="articleForm.summary" type="textarea" :rows="3" placeholder="输入文章摘要" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="文章分类">
              <el-select v-model="articleForm.categoryId" class="admin-panel__full-width" clearable>
                <el-option label="未分类" :value="0" />
                <el-option
                  v-for="category in adminState.categories"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文章标签">
              <el-select v-model="articleForm.tagIds" class="admin-panel__full-width" multiple collapse-tags collapse-tags-tooltip>
                <el-option
                  v-for="tag in adminState.tags"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章正文">
          <el-input
            v-model="articleForm.content"
            type="textarea"
            :rows="16"
            placeholder="输入文章正文，支持 Markdown 内容"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button :loading="adminState.loading" @click="submitArticleWithStatus(0)">
          {{ isEditMode ? '保存草稿' : '创建草稿' }}
        </el-button>
        <el-button type="primary" :loading="adminState.loading" @click="submitArticleWithStatus(1)">
          {{ isEditMode ? '保存并发布' : '发布文章' }}
        </el-button>
      </template>
    </el-dialog>
  </section>
</template>

<style scoped>
.admin-article-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 12px;
}

.admin-article-toolbar__stats,
.admin-article-toolbar__filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.admin-article-toolbar__search {
  width: min(360px, 100%);
}

.admin-article-toolbar__status {
  width: 140px;
}

.admin-article-toolbar__summary {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 13px;
}

.admin-article-table {
  width: 100%;
}

.admin-article-card {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.admin-article-card__title {
  color: var(--text-strong);
  font-size: 15px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-article-card__summary {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
  line-height: 1.5;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.admin-article-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  color: var(--muted);
  font-size: 12px;
}

.admin-article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.admin-article-metrics {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.admin-article-actions {
  display: grid;
  gap: 8px;
}

.admin-article-actions :deep(.el-button) {
  width: 100%;
}

@media (max-width: 960px) {
  .admin-article-toolbar__search,
  .admin-article-toolbar__status {
    width: 100%;
  }

  .admin-article-toolbar__filters {
    width: 100%;
  }
}
</style>
