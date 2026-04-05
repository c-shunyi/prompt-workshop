<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import WebTopNav from '../components/WebTopNav.vue'
import { authState } from '../modules/auth'
import { contentState, loadHomeArticles, loadMeta } from '../modules/content'

const route = useRoute()
const router = useRouter()

const filters = reactive({
  keyword: '',
})

const selectedCategoryId = computed(() => {
  const rawValue = Number(route.query.category)
  return Number.isInteger(rawValue) && rawValue > 0 ? rawValue : 0
})

const selectedCategory = computed(
  () => contentState.categories.find((category) => category.id === selectedCategoryId.value) ?? null,
)

const featuredArticle = computed(() => contentState.homeArticles[0] ?? null)
const articleList = computed(() => contentState.homeArticles)

function openArticle(articleId: number) {
  void router.push(`/articles/${articleId}`)
}

function updateQuery(params: { categoryId?: number; keyword?: string }) {
  const nextQuery: Record<string, string> = {}

  if (params.categoryId) {
    nextQuery.category = String(params.categoryId)
  }

  if (params.keyword) {
    nextQuery.keyword = params.keyword
  }

  void router.push({
    path: '/',
    query: nextQuery,
  })
}

function selectCategory(categoryId?: number) {
  updateQuery({
    categoryId,
    keyword: filters.keyword.trim() || undefined,
  })
}

function submitSearch() {
  updateQuery({
    categoryId: selectedCategoryId.value || undefined,
    keyword: filters.keyword.trim() || undefined,
  })
}

watch(
  () => route.query,
  () => {
    filters.keyword = typeof route.query.keyword === 'string' ? route.query.keyword : ''

    void loadHomeArticles({
      keyword: filters.keyword.trim() || undefined,
      categoryId: selectedCategoryId.value || undefined,
    })
  },
  { immediate: true },
)

onMounted(() => {
  void loadMeta()
})
</script>

<template>
  <div class="user-shell user-shell--wide">
    <WebTopNav active="home">
      <template #center>
        <form class="site-search" @submit.prevent="submitSearch">
          <input
            v-model.trim="filters.keyword"
            class="site-search__input"
            placeholder="搜索标题、摘要或正文"
          />
          <button class="primary-btn site-search__button" type="submit">
            搜索
          </button>
        </form>
      </template>
    </WebTopNav>

    <section class="home-hero">
      <div class="home-hero__copy">
        <p class="eyebrow">Discover Stories</p>
        <h1>经典文章分享平台首页</h1>
        <p class="hero-text">
          顶部导航承载登录和发布入口，左侧是文章分类，右侧是当前分类下的文章内容流。现在已经按你说的结构切成真正的内容平台布局。
        </p>
        <div class="hero-pills">
          <span>分类 {{ contentState.categories.length }} 个</span>
          <span>文章 {{ contentState.homeArticles.length }} 篇</span>
          <span>{{ authState.currentUser ? '已登录创作模式' : '访客浏览模式' }}</span>
        </div>
      </div>

      <article v-if="featuredArticle" class="featured-story" @click="openArticle(featuredArticle.id)">
        <p class="featured-story__label">精选文章</p>
        <h2>{{ featuredArticle.title }}</h2>
        <p>{{ featuredArticle.summary || '这篇文章暂时还没有摘要。' }}</p>
        <div class="featured-story__meta">
          <span>{{ featuredArticle.categoryName || '未分类' }}</span>
          <span>{{ featuredArticle.authorNickname || featuredArticle.authorUsername }}</span>
          <span>{{ featuredArticle.viewCount }} 浏览</span>
        </div>
      </article>
    </section>

    <main class="home-layout">
      <aside class="category-sidebar">
        <div class="category-sidebar__head">
          <p class="panel-kicker">分类导航</p>
          <h2>文章分类</h2>
        </div>

        <div class="category-sidebar__list">
          <button
            class="category-link"
            :class="{ 'category-link--active': selectedCategoryId === 0 }"
            type="button"
            @click="selectCategory()"
          >
            <span>全部文章</span>
            <strong>{{ contentState.homeArticles.length }}</strong>
          </button>

          <button
            v-for="category in contentState.categories"
            :key="category.id"
            class="category-link"
            :class="{ 'category-link--active': selectedCategoryId === category.id }"
            type="button"
            @click="selectCategory(category.id)"
          >
            <span>{{ category.name }}</span>
            <small>{{ category.slug }}</small>
          </button>
        </div>

        <div class="category-sidebar__footer">
          <p class="status-label">当前分类</p>
          <p class="status-message">{{ selectedCategory?.name || '全部文章' }}</p>
          <p class="status-meta">
            {{ selectedCategory ? '点击右侧文章可进入详情页阅读 Markdown 正文。' : '左侧点击分类即可切换右侧内容区。' }}
          </p>
        </div>
      </aside>

      <section class="article-stream">
        <div v-if="articleList.length" class="article-list">
          <article
            v-for="article in articleList"
            :key="article.id"
            class="article-list-item"
            @click="openArticle(article.id)"
          >
            <div class="article-list-item__meta">
              <span>{{ article.categoryName || '未分类' }}</span>
              <span>{{ article.authorNickname || article.authorUsername }}</span>
              <span>{{ article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : '未发布' }}</span>
            </div>

            <h3>{{ article.title }}</h3>
            <p>{{ article.summary || '暂无摘要，点击进入阅读完整 Markdown 内容。' }}</p>

            <div class="chip-group">
              <span v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
              <span v-if="!article.tags.length">无标签</span>
            </div>

            <div class="article-list-item__footer">
              <strong>{{ article.likeCount }} 赞</strong>
              <span>{{ article.favoriteCount }} 收藏</span>
              <span>{{ article.viewCount }} 浏览</span>
            </div>
          </article>
        </div>

        <div v-else class="empty-state article-stream__empty">
          <p>{{ contentState.homeLoading ? '文章加载中...' : '当前没有文章。' }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
