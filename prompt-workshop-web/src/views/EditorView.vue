<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownContent from '../components/MarkdownContent.vue'
import WebTopNav from '../components/WebTopNav.vue'
import { contentState, loadEditableArticle, loadMeta, saveArticle } from '../modules/content'

const route = useRoute()
const router = useRouter()
const editorRef = ref<HTMLTextAreaElement | null>(null)

const articleId = computed(() => {
  const rawId = Number(route.params.id)
  return Number.isInteger(rawId) && rawId > 0 ? rawId : null
})

const form = reactive({
  title: '',
  summary: '',
  content: '# 输入标题\n\n从这里开始写你的 Markdown 正文。',
  categoryId: 0,
  tagIds: [] as number[],
  status: 0,
})

const markdownActions = [
  { label: 'H2', action: () => insertLinePrefix('## ') },
  { label: '加粗', action: () => wrapSelection('**', '**', '重点内容') },
  { label: '斜体', action: () => wrapSelection('*', '*', '强调内容') },
  { label: '引用', action: () => insertLinePrefix('> ') },
  { label: '链接', action: () => wrapSelection('[', '](https://example.com)', '链接标题') },
  { label: '代码', action: () => wrapSelection('`', '`', 'const answer = 42') },
  { label: '代码块', action: () => insertSnippet('\n```ts\nconsole.log("hello")\n```\n') },
  { label: '列表', action: () => insertSnippet('\n- 第一项\n- 第二项\n- 第三项\n') },
]

const isEditMode = computed(() => articleId.value !== null)
const wordCount = computed(() => form.content.replace(/\s+/g, '').length)
const estimatedReadMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))

function updateContent(nextValue: string, selectionStart: number, selectionEnd: number) {
  form.content = nextValue

  void nextTick(() => {
    if (!editorRef.value) {
      return
    }

    editorRef.value.focus()
    editorRef.value.setSelectionRange(selectionStart, selectionEnd)
  })
}

function wrapSelection(prefix: string, suffix = '', placeholder = '内容') {
  if (!editorRef.value) {
    form.content += `${prefix}${placeholder}${suffix}`
    return
  }

  const { selectionStart, selectionEnd, value } = editorRef.value
  const selected = value.slice(selectionStart, selectionEnd) || placeholder
  const nextValue = `${value.slice(0, selectionStart)}${prefix}${selected}${suffix}${value.slice(selectionEnd)}`
  const cursorStart = selectionStart + prefix.length
  const cursorEnd = cursorStart + selected.length

  updateContent(nextValue, cursorStart, cursorEnd)
}

function insertLinePrefix(prefix: string) {
  if (!editorRef.value) {
    form.content += `\n${prefix}标题`
    return
  }

  const { selectionStart, selectionEnd, value } = editorRef.value
  const lineStart = value.lastIndexOf('\n', selectionStart - 1) + 1
  const selected = value.slice(lineStart, selectionEnd) || '标题'
  const nextValue = `${value.slice(0, lineStart)}${prefix}${selected}${value.slice(selectionEnd)}`
  const cursorStart = lineStart + prefix.length
  const cursorEnd = cursorStart + selected.length

  updateContent(nextValue, cursorStart, cursorEnd)
}

function insertSnippet(snippet: string) {
  if (!editorRef.value) {
    form.content += snippet
    return
  }

  const { selectionStart, selectionEnd, value } = editorRef.value
  const nextValue = `${value.slice(0, selectionStart)}${snippet}${value.slice(selectionEnd)}`
  const cursor = selectionStart + snippet.length
  updateContent(nextValue, cursor, cursor)
}

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

  void router.replace(`/articles/${article.id}`)
}

function goBack() {
  void router.push('/profile')
}

onMounted(() => {
  void loadEditorData()
})
</script>

<template>
  <div class="user-shell user-shell--wide">
    <WebTopNav active="write" />

    <section class="editor-hero">
      <div>
        <p class="eyebrow">Markdown Studio</p>
        <h1>{{ isEditMode ? '编辑 Markdown 文章' : '发布新的 Markdown 文章' }}</h1>
        <p class="hero-text">
          编辑器左边写 Markdown，右边实时预览。上方工具栏提供常用格式插入，让 Markdown 发布体验更接近富文本。
        </p>
      </div>

      <div class="editor-hero__metrics">
        <span>{{ wordCount }} 字</span>
        <span>预计 {{ estimatedReadMinutes }} 分钟阅读</span>
        <span>{{ isEditMode ? '编辑模式' : '创建模式' }}</span>
      </div>
    </section>

    <section class="panel editor-shell">
      <div class="panel-head">
        <div>
          <p class="panel-kicker">发布信息</p>
          <h2>{{ isEditMode ? '更新文章内容' : '完善文章信息' }}</h2>
        </div>

        <button class="ghost-btn" type="button" @click="goBack">返回个人中心</button>
      </div>

      <form class="form-grid editor-meta-form" @submit.prevent="submit(form.status)">
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
      </form>

      <div class="editor-toolbar">
        <button
          v-for="tool in markdownActions"
          :key="tool.label"
          class="ghost-btn editor-toolbar__button"
          type="button"
          @click="tool.action"
        >
          {{ tool.label }}
        </button>
      </div>

      <div class="editor-workspace">
        <section class="editor-pane">
          <div class="editor-pane__head">
            <strong>Markdown 编辑区</strong>
            <span>支持标题、引用、链接、代码块、列表</span>
          </div>
          <textarea
            ref="editorRef"
            v-model="form.content"
            class="article-textarea article-textarea--editor"
            placeholder="输入 Markdown 正文..."
            required
          />
        </section>

        <section class="editor-pane editor-pane--preview">
          <div class="editor-pane__head">
            <strong>实时预览</strong>
            <span>保存后详情页也会按这个效果渲染</span>
          </div>
          <div class="editor-preview">
            <MarkdownContent :content="form.content" empty-text="开始输入 Markdown 后，这里会显示预览。" />
          </div>
        </section>
      </div>

      <div class="actions editor-actions">
        <button class="ghost-btn" type="button" :disabled="contentState.saving" @click="submit(0)">
          {{ contentState.saving ? '保存中...' : '保存草稿' }}
        </button>
        <button class="primary-btn compact-btn" type="submit" :disabled="contentState.saving" @click="submit(form.status)">
          {{ contentState.saving ? '提交中...' : '保存当前状态' }}
        </button>
        <button class="primary-btn" type="button" :disabled="contentState.saving" @click="submit(1)">
          {{ contentState.saving ? '发布中...' : '立即发布' }}
        </button>
      </div>
    </section>
  </div>
</template>
