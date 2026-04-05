<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { EditPen, MoreFilled, Plus, Search } from '@element-plus/icons-vue'
import {
  adminState,
  deleteArticleByAdmin,
  loadArticles,
  loadDashboard,
  updateArticleStatusByAdmin,
  type AdminArticleItem,
} from '../modules/admin'

const router = useRouter()

const filters = adminState.articleFilters

const articleStats = computed(() => adminState.articleStats)

const filterSummary = computed(() => {
  if (!filters.keyword.trim() && filters.status === -1) {
    return `共 ${adminState.articlePagination.total} 篇文章`
  }

  return `筛选结果 ${adminState.articlePagination.total} 篇`
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

function resetFilters() {
  filters.keyword = ''
  filters.status = -1
  void loadArticles({ page: 1, keyword: '', status: -1 })
}

function applyFilters() {
  void loadArticles({
    page: 1,
    keyword: filters.keyword,
    status: filters.status,
  })
}

function goCreatePage(defaultStatus = 0) {
  void router.push({
    name: 'admin-article-create',
    query: defaultStatus === 1 ? { status: '1' } : undefined,
  })
}

function goEditPage(articleId: number) {
  void router.push(`/dashboard/articles/${articleId}/edit`)
}

async function updateArticleStatus(article: AdminArticleItem, status: 0 | 1 | 2) {
  if (article.status === status) {
    return
  }

  const success = await updateArticleStatusByAdmin(article.id, status)

  if (success) {
    await loadDashboard({ silent: true })
    await loadArticles({ silent: true })
  }
}

async function removeArticle(articleId: number) {
  const success = await deleteArticleByAdmin(articleId)

  if (success) {
    await loadDashboard({ silent: true })
    const targetPage =
      adminState.articles.length === 1 && adminState.articlePagination.page > 1
        ? adminState.articlePagination.page - 1
        : adminState.articlePagination.page
    await loadArticles({ page: targetPage, silent: true })
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

function handlePageChange(page: number) {
  void loadArticles({ page })
}

function handlePageSizeChange(pageSize: number) {
  void loadArticles({ page: 1, pageSize })
}

onMounted(() => {
  void loadArticles({ silent: true })
})
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
          <el-button plain @click="goCreatePage(0)">新建草稿</el-button>
          <el-button type="primary" :icon="Plus" @click="goCreatePage(1)">创建并发布</el-button>
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
            @clear="applyFilters"
            @keyup.enter="applyFilters"
          />
          <el-select v-model="filters.status" class="admin-article-toolbar__status" @change="applyFilters">
            <el-option label="全部状态" :value="-1" />
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
            <el-option label="下架" :value="2" />
          </el-select>
          <el-button type="primary" plain :icon="Search" @click="applyFilters">查询</el-button>
          <el-button plain @click="resetFilters">重置</el-button>
        </div>
      </div>

      <p class="admin-article-toolbar__summary">
        {{ filterSummary }}
      </p>

      <div class="admin-article-table">
        <el-table
          v-loading="adminState.articlesLoading"
          :data="adminState.articles"
          stripe
          table-layout="fixed"
          empty-text="当前还没有文章"
        >
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
                <el-button size="small" plain :icon="EditPen" @click="goEditPage(row.id)">编辑</el-button>
                <el-dropdown trigger="click" @command="handleArticleCommand(row, $event)">
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
                <el-button plain @click="goCreatePage(0)">新建草稿</el-button>
                <el-button type="primary" @click="goCreatePage(1)">创建并发布</el-button>
              </el-space>
            </el-empty>
          </template>
        </el-table>
      </div>

      <div class="admin-table-pagination">
        <el-pagination
          background
          layout="total, sizes, prev, pager, next"
          :current-page="adminState.articlePagination.page"
          :page-size="adminState.articlePagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="adminState.articlePagination.total"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>
    </article>
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
