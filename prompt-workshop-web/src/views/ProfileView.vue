<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebTopNav from '../components/WebTopNav.vue'
import { authState, loadProfile, logoutUser, userDisplayName } from '../modules/auth'
import { contentState, loadMyArticles } from '../modules/content'

const router = useRouter()

function openHome() {
  void router.push('/')
}

function openArticle(articleId: number) {
  void router.push(`/articles/${articleId}`)
}

function logout() {
  logoutUser()
  void router.replace('/login')
}

onMounted(() => {
  void loadMyArticles()
})
</script>

<template>
  <div class="user-shell user-shell--wide">
    <WebTopNav active="profile" />

    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">User Center</p>
        <h1>{{ userDisplayName }}，查看你的账号与内容记录</h1>
        <p class="hero-text">前台个人用户不再提供发文入口，文章发布与编辑统一在后台文章管理中完成。</p>

        <div class="hero-pills">
          <span>当前路由：/profile</span>
          <span>历史文章：{{ contentState.myArticles.length }} 篇</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">如需新增、编辑或发布文章，请前往后台管理台操作。</p>
      </div>
    </section>

    <main class="content-grid">
      <section class="panel profile-panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">个人资料</p>
            <h2>账号信息</h2>
          </div>

          <div class="actions">
            <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
            <button class="ghost-btn" type="button" :disabled="authState.profileLoading" @click="loadProfile()">
              {{ authState.profileLoading ? '刷新中...' : '刷新资料' }}
            </button>
            <button class="ghost-btn danger" type="button" @click="logout">退出登录</button>
          </div>
        </div>

        <div v-if="authState.currentUser" class="profile-card">
          <div class="profile-avatar">{{ userDisplayName.slice(0, 1).toUpperCase() }}</div>
          <div class="profile-info">
            <h3>{{ userDisplayName }}</h3>
            <p>@{{ authState.currentUser.username }}</p>
            <p>{{ authState.currentUser.email }}</p>
            <p>{{ authState.currentUser.bio || '还没有填写个人简介。' }}</p>
          </div>

          <dl class="profile-stats">
            <div>
              <dt>用户 ID</dt>
              <dd>{{ authState.currentUser.id }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{{ authState.currentUser.status === 1 ? '正常' : '禁用' }}</dd>
            </div>
            <div>
              <dt>文章数</dt>
              <dd>{{ contentState.myArticles.length }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">内容记录</p>
            <h2>我的文章</h2>
          </div>

          <button class="ghost-btn" type="button" :disabled="contentState.myArticlesLoading" @click="loadMyArticles()">
            {{ contentState.myArticlesLoading ? '加载中...' : '刷新列表' }}
          </button>
        </div>

        <div v-if="contentState.myArticles.length" class="article-stack">
          <article v-for="article in contentState.myArticles" :key="article.id" class="article-stack__item">
            <div>
              <strong>{{ article.title }}</strong>
              <p>{{ article.summary || '暂无摘要' }}</p>
            </div>
            <div class="article-stack__actions">
              <span class="status-chip" :data-status="article.status">
                {{ article.status === 1 ? '已发布' : article.status === 0 ? '草稿' : '下架' }}
              </span>
              <button class="ghost-btn small-btn" type="button" @click="openArticle(article.id)">查看</button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <p>当前没有你的文章记录。</p>
          <p>前台个人用户不能发布文章，新增内容请在后台文章管理中完成。</p>
        </div>
      </section>
    </main>
  </div>
</template>
