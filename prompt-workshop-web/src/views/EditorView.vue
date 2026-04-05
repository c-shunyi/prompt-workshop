<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { contentState, loadEditableArticle, loadMeta, saveArticle } from '../modules/content'

const route = useRoute()
const router = useRouter()

const articleId = computed(() => {
  const rawId = Number(route.params.id)
  return Number.isInteger(rawId) && rawId > 0 ? rawId : null
})

const form = reactive({
  title: '',
  summary: '',
  content: '',
  categoryId: 0,
  tagIds: [] as number[],
  status: 0,
})

const isEditMode = computed(() => articleId.value !== null)

async function loadEditorData() {
  await loadMeta()

  if (!articleId.value) {
    return
  }

  const article = await loadEditableArticle(articleId.value)

  if (!article) {
    return
  }

  form.title = article.title
  form.summary = article.summary || ''
  form.content = article.content || ''
  form.categoryId = article.categoryId || 0
  form.tagIds = article.tags.map((tag) => tag.id)
  form.status = article.status
}

async function submit(status: number) {
  const article = await saveArticle({
    articleId: articleId.value || undefined,
    title: form.title,
    summary: form.summary,
    content: form.content,
    categoryId: form.categoryId || null,
    tagIds: form.tagIds,
    status,
  })

  if (!article) {
    return
  }

  void router.replace('/profile')
}

function goBack() {
  void router.push('/profile')
}

onMounted(() => {
  void loadEditorData()
})
</script>

<template>
  <div class="user-shell">
    <section class="hero-card">
      <div class="hero-copy">
        <p class="eyebrow">Article Editor</p>
        <h1>{{ isEditMode ? '编辑文章' : '写一篇新文章' }}</h1>
        <p class="hero-text">
          支持草稿保存和直接发布。文章分类、标签和状态都已经接入后端接口。
        </p>
      </div>

      <div class="status-panel">
        <p class="status-label">编辑说明</p>
        <p class="status-message">{{ isEditMode ? '当前是编辑模式' : '当前是创建模式' }}</p>
        <p class="status-meta">保存草稿不会进入首页，直接发布后会在首页公开展示。</p>
      </div>
    </section>

    <section class="panel editor-panel">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">创作区</p>
          <h2>{{ isEditMode ? '完善你的文章' : '开始创作' }}</h2>
        </div>

        <button class="ghost-btn" type="button" @click="goBack">返回个人中心</button>
      </div>

      <form class="form-grid editor-form" @submit.prevent="submit(form.status)">
        <label>
          <span>标题</span>
          <input v-model.trim="form.title" placeholder="输入文章标题" required />
        </label>

        <label>
          <span>摘要</span>
          <input v-model.trim="form.summary" placeholder="一句话概括文章内容" />
        </label>

        <div class="editor-row">
          <label>
            <span>分类</span>
            <select v-model.number="form.categoryId" class="article-select">
              <option :value="0">未分类</option>
              <option v-for="category in contentState.categories" :key="category.id" :value="category.id">
                {{ category.name }}
              </option>
            </select>
          </label>

          <label>
            <span>状态</span>
            <select v-model.number="form.status" class="article-select">
              <option :value="0">草稿</option>
              <option :value="1">发布</option>
              <option :value="2">下架</option>
            </select>
          </label>
        </div>

        <label>
          <span>标签</span>
          <div class="tag-selector">
            <label v-for="tag in contentState.tags" :key="tag.id" class="check-chip">
              <input v-model="form.tagIds" type="checkbox" :value="tag.id" />
              <span>{{ tag.name }}</span>
            </label>
            <p v-if="!contentState.tags.length" class="empty-copy">当前还没有标签，可以先去管理台创建。</p>
          </div>
        </label>

        <label>
          <span>正文</span>
          <textarea v-model="form.content" class="article-textarea" placeholder="输入文章正文..." required />
        </label>

        <div class="actions">
          <button class="ghost-btn" type="button" :disabled="contentState.saving" @click="submit(0)">
            {{ contentState.saving ? '保存中...' : '保存草稿' }}
          </button>
          <button class="primary-btn compact-btn" type="submit" :disabled="contentState.saving">
            {{ contentState.saving ? '提交中...' : '保存当前状态' }}
          </button>
          <button class="primary-btn" type="button" :disabled="contentState.saving" @click="submit(1)">
            {{ contentState.saving ? '发布中...' : '立即发布' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>
