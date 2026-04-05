<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authState } from '../modules/auth'
import { contentState, loadHomeArticles, loadMeta } from '../modules/content'

const router = useRouter()

const filters = reactive({
  keyword: '',
  categoryId: 0,
})

const featuredArticle = computed(() => contentState.homeArticles[0] ?? null)
const restArticles = computed(() => contentState.homeArticles.slice(1))

function openLogin() {
  void router.push('/login')
}

function openRegister() {
  void router.push('/register')
}

function openProfile() {
  void router.push('/profile')
}

function openEditor() {
  void router.push('/editor')
}

function openArticle(articleId: number) {
  void router.push(`/articles/${articleId}`)
}

function applyFilters() {
  void loadHomeArticles({
    keyword: filters.keyword.trim() || undefined,
    categoryId: filters.categoryId || undefined,
  })
}

onMounted(() => {
  void loadMeta()
  void loadHomeArticles()
})
</script>

<template>
  <div class="user-shell">
    <section class="landing-card">
      <div class="landing-copy">
        <p class="eyebrow">Prompt Workshop Web</p>
        <h1>文章分享平台</h1>
        <p class="landing-text">
          现在首页已经切成真实内容流。你可以浏览已发布文章、按分类筛选，登录后进入个人中心，或者直接开始创作。
        </p>

        <div class="landing-actions">
          <button v-if="!authState.currentUser" class="primary-btn" type="button" @click="openLogin">立即登录</button>
          <button v-if="!authState.currentUser" class="ghost-btn" type="button" @click="openRegister">去注册</button>
          <button v-else class="primary-btn" type="button" @click="openProfile">进入个人中心</button>
          <button v-if="authState.currentUser" class="ghost-btn" type="button" @click="openEditor">写文章</button>
        </div>

        <div class="hero-pills">
          <span>已接后端文章接口</span>
          <span>支持分类筛选</span>
          <span>支持个人发布</span>
        </div>
      </div>

      <div class="landing-panel">
        <p class="status-label">推荐文章</p>
        <template v-if="featuredArticle">
          <p class="status-message">{{ featuredArticle.title }}</p>
          <p class="status-meta">
            {{ featuredArticle.summary || '这篇文章还没有填写摘要。' }}
          </p>
          <button class="ghost-btn inline-btn" type="button" @click="openArticle(featuredArticle.id)">
            阅读全文
          </button>
        </template>
        <template v-else>
          <p class="status-message">还没有已发布文章</p>
          <p class="status-meta">登录后可以先去创建第一篇文章。</p>
        </template>
      </div>
    </section>

    <main class="content-grid">
      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">内容筛选</p>
            <h2>查找文章</h2>
          </div>
        </div>

        <form class="form-grid" @submit.prevent="applyFilters">
          <label>
            <span>关键词</span>
            <input v-model.trim="filters.keyword" placeholder="搜索标题、摘要或正文" />
          </label>

          <label>
            <span>分类</span>
            <select v-model.number="filters.categoryId" class="article-select">
              <option :value="0">全部分类</option>
              <option v-for="category in contentState.categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>

          <button class="primary-btn" type="submit" :disabled="contentState.homeLoading">
            {{ contentState.homeLoading ? '加载中...' : '应用筛选' }}
          </button>
        </form>
      </section>

      <section class="panel">
        <div class="panel-head">
          <div>
            <p class="panel-kicker">分类概览</p>
            <h2>当前分类</h2>
          </div>
        </div>

        <div class="tag-cloud">
          <button
            v-for="category in contentState.categories"
            :key="category.id"
            class="chip-btn"
            type="button"
            @click="filters.categoryId = category.id; applyFilters()"
          >
            {{ category.name }}
          </button>
          <p v-if="!contentState.categories.length" class="empty-copy">当前还没有分类，可以先去管理台添加。</p>
        </div>
      </section>
    </main>

    <section class="panel article-feed-panel">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">文章流</p>
          <h2>最新发布</h2>
        </div>
      </div>

      <div v-if="restArticles.length || featuredArticle" class="article-grid">
        <article
          v-for="article in contentState.homeArticles"
          :key="article.id"
          class="article-card"
          @click="openArticle(article.id)"
        >
          <div class="article-card__meta">
            <span>{{ article.categoryName || '未分类' }}</span>
            <span>{{ article.authorNickname || article.authorUsername }}</span>
          </div>
          <h3>{{ article.title }}</h3>
          <p>{{ article.summary || '这篇文章还没有摘要，点击进入阅读全文。' }}</p>
          <div class="chip-group">
            <span v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
            <span v-if="!article.tags.length">无标签</span>
          </div>
          <div class="article-card__footer">
            <strong>{{ article.likeCount }} 赞</strong>
            <span>{{ article.favoriteCount }} 收藏</span>
            <span>{{ article.viewCount }} 浏览</span>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <p>目前还没有文章。</p>
        <p>登录后可以从个人中心或编辑页发布第一篇内容。</p>
      </div>
    </section>
  </div>
</template>
