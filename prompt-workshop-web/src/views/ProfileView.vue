<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import WebTopNav from '../components/WebTopNav.vue'
import { contentState, loadMyArticles } from '../modules/content'

const router = useRouter()

function openArticle(articleId: number) {
  void router.push(`/articles/${articleId}`)
}

onMounted(() => {
  void loadMyArticles()
})
</script>

<template>
  <div class="user-shell user-shell--wide">
    <WebTopNav active="profile" />

    <main class="content-grid single-column">
      <section class="panel">
        <div class="panel-head">
          <h2>我的文章</h2>

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
          <p>{{ contentState.myArticlesLoading ? '文章加载中...' : '当前没有文章记录。' }}</p>
        </div>
      </section>
    </main>
  </div>
</template>
