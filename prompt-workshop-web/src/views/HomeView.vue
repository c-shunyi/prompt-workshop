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
            placeholder="搜索提示词..."
          />
          <button class="primary-btn site-search__button" type="submit">
            搜索
          </button>
        </form>
      </template>
    </WebTopNav>

    <section class="home-hero">
      <div class="home-hero__copy">
        <p class="eyebrow">Prompt Workshop</p>
        <h1>发现好用又有趣的 AI 提示词</h1>
        <p class="hero-text">
          一个开放的提示词收集站——汇集编程、写作、设计、娱乐等各类场景的优质提示词，帮你把 AI 用得更好。
        </p>
        <div class="hero-pills">
          <span>{{ contentState.categories.length }} 个分类</span>
          <span>{{ contentState.homeArticles.length }} 条提示词</span>
          <span>{{ authState.currentUser ? '已登录，可提交提示词' : '登录后可分享提示词' }}</span>
        </div>
      </div>

      <article v-if="featuredArticle" class="featured-story" @click="openArticle(featuredArticle.id)">
        <p class="featured-story__label">精选提示词</p>
        <h2>{{ featuredArticle.title }}</h2>
        <p>{{ featuredArticle.summary || '这条提示词暂时还没有摘要。' }}</p>
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
          <h2>提示词分类</h2>
        </div>

        <div class="category-sidebar__list">
          <button
            class="category-link"
            :class="{ 'category-link--active': selectedCategoryId === 0 }"
            type="button"
            @click="selectCategory()"
          >
            <span>全部提示词</span>
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
            {{ selectedCategory ? '点击右侧卡片查看提示词详情和使用方法。' : '选择左侧分类浏览对应场景的提示词。' }}
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
            <p>{{ article.summary || '暂无摘要，点击查看提示词详情。' }}</p>

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
          <p>{{ contentState.homeLoading ? '加载中...' : '当前分类下暂无提示词，换个分类看看？' }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
