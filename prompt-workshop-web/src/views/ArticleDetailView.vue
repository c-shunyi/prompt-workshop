<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

onMounted(() => {
  void loadCurrentArticle()
})
</script>

<template>
  <div class="user-shell">
    <section v-if="article" class="panel article-detail">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">{{ article.categoryName || '未分类' }}</p>
          <h1 class="article-detail__title">{{ article.title }}</h1>
          <p class="article-detail__summary">{{ article.summary || '暂无摘要' }}</p>
        </div>

        <div class="actions">
          <button class="ghost-btn" type="button" @click="openHome">返回首页</button>
          <button v-if="isOwner" class="primary-btn compact-btn" type="button" @click="openEditor">编辑文章</button>
        </div>
      </div>

      <div class="article-detail__meta">
        <span>作者：{{ article.authorNickname || article.authorUsername }}</span>
        <span>发布时间：{{ article.publishedAt ? new Date(article.publishedAt).toLocaleString() : '-' }}</span>
        <span>{{ article.viewCount }} 浏览</span>
      </div>

      <div class="chip-group detail-chip-group">
        <span v-for="tag in article.tags" :key="tag.id">{{ tag.name }}</span>
        <span v-if="!article.tags.length">无标签</span>
      </div>

      <div class="article-detail__body">
        {{ article.content }}
      </div>

      <div class="article-detail__actions">
        <button class="ghost-btn" type="button" @click="likeArticle">
          {{ article.liked ? '取消点赞' : '点赞' }} · {{ article.likeCount }}
        </button>
        <button class="ghost-btn" type="button" @click="favoriteArticle">
          {{ article.favorited ? '取消收藏' : '收藏' }} · {{ article.favoriteCount }}
        </button>
      </div>
    </section>

    <section v-else class="panel empty-state">
      <p>{{ contentState.detailLoading ? '文章加载中...' : '文章不存在或尚未发布。' }}</p>
      <p>你可以返回首页，浏览其他已发布内容。</p>
    </section>
  </div>
</template>
