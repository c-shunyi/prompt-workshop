<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownContent from '../components/MarkdownContent.vue'
import WebTopNav from '../components/WebTopNav.vue'
import { authState } from '../modules/auth'
import { contentState, loadArticleDetail, toggleFavorite, toggleLike } from '../modules/content'

const route = useRoute()
const router = useRouter()

const articleId = computed(() => Number(route.params.id))
const article = computed(() => contentState.articleDetail)
const isOwner = computed(() => article.value && authState.currentUser?.id === article.value.userId)

async function loadCurrentArticle() {
  if (Number.isInteger(articleId.value) && articleId.value > 0) {
    await loadArticleDetail(articleId.value)
  }
}

function openHome() {
  void router.push('/')
}

function openEditor() {
  if (article.value) {
    void router.push(`/editor/${article.value.id}`)
  }
}

async function likeArticle() {
  if (article.value) {
    await toggleLike(article.value.id)
  }
}

async function favoriteArticle() {
  if (article.value) {
    await toggleFavorite(article.value.id)
  }
}

watch(
  () => route.params.id,
  () => {
    void loadCurrentArticle()
  },
)

onMounted(() => {
  void loadCurrentArticle()
})
</script>

<template>
  <div class="user-shell user-shell--wide">
    <WebTopNav />

    <section v-if="article" class="article-detail-page">
      <div class="article-detail-main">
        <div class="article-detail-hero">
          <p class="eyebrow">{{ article.categoryName || '未分类' }}</p>
          <h1 class="article-detail__title">{{ article.title }}</h1>
          <p class="article-detail__summary">{{ article.summary || '作者没有单独填写摘要，这里直接进入正文。' }}</p>

          <div class="article-detail__meta">
            <span>作者：{{ article.authorNickname || article.authorUsername }}</span>
            <span>发布时间：{{ article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '-' }}</span>
            <span>{{ article.viewCount }} 浏览</span>
          </div>

          <div class="chip-group detail-chip-group">
            <span v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
            <span v-if="!article.tags.length">无标签</span>
          </div>
        </div>

        <section class="panel article-markdown-panel">
          <MarkdownContent :content="article.content" empty-text="这篇文章还没有正文内容。" />
        </section>
      </div>

      <aside class="article-detail-side">
        <section class="panel article-side-card">
          <p class="panel-kicker">文章操作</p>
          <div class="article-detail__actions">
            <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
            <button v-if="isOwner" class="primary-btn compact-btn" type="button" @click="openEditor">编辑文章</button>
            <button class="ghost-btn" type="button" @click="likeArticle">
              {{ article.liked ? '取消点赞' : '点赞文章' }} · {{ article.likeCount }}
            </button>
            <button class="ghost-btn" type="button" @click="favoriteArticle">
              {{ article.favorited ? '取消收藏' : '收藏文章' }} · {{ article.favoriteCount }}
            </button>
          </div>
        </section>

        <section class="panel article-side-card">
          <p class="panel-kicker">阅读信息</p>
          <div class="article-side-metrics">
            <div>
              <span>点赞</span>
              <strong>{{ article.likeCount }}</strong>
            </div>
            <div>
              <span>收藏</span>
              <strong>{{ article.favoriteCount }}</strong>
            </div>
            <div>
              <span>浏览</span>
              <strong>{{ article.viewCount }}</strong>
            </div>
          </div>
        </section>
      </aside>
    </section>

    <section v-else class="panel empty-state article-stream__empty">
      <p>{{ contentState.detailLoading ? '文章加载中...' : '文章不存在或尚未发布。' }}</p>
      <p>你可以返回首页，浏览其他已发布内容。</p>
    </section>
  </div>
</template>
