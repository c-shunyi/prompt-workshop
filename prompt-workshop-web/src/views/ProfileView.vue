<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authState, loadProfile, logoutUser, userDisplayName } from '../modules/auth'
import { contentState, loadMyArticles } from '../modules/content'

const router = useRouter()

function openHome() {
  void router.push('/')
}

function openEditor(articleId?: number) {
  void router.push(articleId ? `/editor/${articleId}` : '/editor')
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
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">User Center</p>
        <h1>{{ userDisplayName }}，开始管理你的内容</h1>
        <p class="hero-text">这里不再只是资料展示页，现在已经接上“我的文章”和“继续创作”能力。</p>

        <div class="hero-pills">
          <span>当前路由：/profile</span>
          <span>我的文章：{{ contentState.myArticles.length }} 篇</span>
        </div>
      </div>

      <div class="status-panel">
        <p class="status-label">当前提示</p>
        <p class="status-message" :data-type="authState.feedbackType">{{ authState.feedbackMessage }}</p>
        <p class="status-meta">发布草稿和正式发布都可以在编辑页完成。</p>
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
            <button class="primary-btn compact-btn" type="button" @click="openEditor()">新建文章</button>
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
            <p class="panel-kicker">创作入口</p>
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
              <button class="primary-btn small-btn" type="button" @click="openEditor(article.id)">编辑</button>
            </div>
          </article>
        </div>
        <div v-else class="empty-state">
          <p>你还没有创建文章。</p>
          <p>点击上面的“新建文章”，可以直接开始写第一篇内容。</p>
        </div>
      </section>
    </main>
  </div>
</template>
