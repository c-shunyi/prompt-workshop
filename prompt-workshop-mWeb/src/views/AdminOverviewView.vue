<script setup lang="ts">
import { computed } from 'vue'
import { adminState, roleLabel } from '../modules/admin'

const publishedArticleCount = computed(
  () => adminState.articles.filter((item) => item.status === 1).length,
)

const metrics = computed(() => [
  {
    eyebrow: '管理员数量',
    value: String(adminState.adminList.length),
    label: '已接入后台账号',
    trend: roleLabel.value,
  },
  {
    eyebrow: '前台用户数量',
    value: String(adminState.userList.length),
    label: '当前注册用户',
    trend: '用户管理',
  },
  {
    eyebrow: '内容分类数量',
    value: String(adminState.categories.length),
    label: `标签 ${adminState.tags.length} 个`,
    trend: '内容目录',
  },
  {
    eyebrow: '已发布文章',
    value: String(publishedArticleCount.value),
    label: `总文章 ${adminState.articles.length} 篇`,
    trend: adminState.dashboardLoading ? '同步中' : '审核中',
  },
])
</script>

<template>
  <section class="admin-page">
    <section class="admin-stats">
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
        </div>

        <div class="admin-summary-list">
          <div class="admin-summary-item">
            <span>当前管理员</span>
            <strong>{{ adminState.currentAdmin?.nickname || adminState.currentAdmin?.username || '-' }}</strong>
          </div>
          <div class="admin-summary-item">
            <span>角色</span>
            <strong>{{ roleLabel }}</strong>
          </div>
          <div class="admin-summary-item">
            <span>数据同步</span>
            <strong>{{ adminState.dashboardLoading ? '同步中' : '已完成' }}</strong>
          </div>
          <div class="admin-summary-item">
            <span>当前模式</span>
            <strong>路由化工作台</strong>
          </div>
        </div>
      </article>

      <article class="admin-panel">
        <div class="admin-panel__head">
          <div>
            <p class="admin-panel__eyebrow">快捷入口</p>
            <h3 class="admin-panel__title">推荐操作</h3>
          </div>
        </div>

        <div class="admin-summary-list">
          <div class="admin-summary-item">
            <span>用户管理</span>
            <strong>/dashboard/users</strong>
          </div>
          <div class="admin-summary-item">
            <span>分类管理</span>
            <strong>/dashboard/categories</strong>
          </div>
          <div class="admin-summary-item">
            <span>标签管理</span>
            <strong>/dashboard/tags</strong>
          </div>
          <div class="admin-summary-item">
            <span>文章审核</span>
            <strong>/dashboard/articles</strong>
          </div>
        </div>
      </article>
    </section>
  </section>
</template>
