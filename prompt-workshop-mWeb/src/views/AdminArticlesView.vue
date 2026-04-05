<script setup lang="ts">
import { adminState, loadDashboard, updateArticleStatusByAdmin, type AdminArticleItem } from '../modules/admin'

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

async function updateArticleStatus(article: AdminArticleItem, status: 0 | 1 | 2) {
  if (article.status === status) {
    return
  }

  const success = await updateArticleStatusByAdmin(article.id, status)

  if (success) {
    await loadDashboard({ silent: true })
  }
}
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel admin-panel--table">
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
</template>
