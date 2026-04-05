<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import MarkdownIt from 'markdown-it'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import {
  adminState,
  loadAdminArticleDetail,
  loadDashboard,
  saveArticleByAdmin,
} from '../modules/admin'

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
})

const route = useRoute()
const router = useRouter()
const editorRef = ref<HTMLTextAreaElement | null>(null)

const articleId = computed(() => {
  const rawId = Number(route.params.id)
  return Number.isInteger(rawId) && rawId > 0 ? rawId : null
})
const isEditMode = computed(() => articleId.value !== null)
const availableUsers = computed(() => adminState.userOptions.filter((item) => item.status === 1))
const defaultAuthor = computed(() => availableUsers.value[0] ?? null)
const defaultAuthorLabel = computed(() => {
  if (!defaultAuthor.value) {
    return ''
  }

  return defaultAuthor.value.nickname || defaultAuthor.value.username
})
const authorFieldHint = computed(() => {
  if (isEditMode.value) {
    return '作者可选，留空时会保留当前作者。'
  }

  if (defaultAuthorLabel.value) {
    return `作者可选，留空时会自动使用 ${defaultAuthorLabel.value}。`
  }

  return '作者可选，留空时会自动分配默认作者。'
})

const articleForm = reactive({
  userId: 0,
  title: '',
  summary: '',
  content: '',
  categoryId: 0,
  tagIds: [] as number[],
  status: 0,
})

function isRichTextHtml(content: string) {
  const trimmed = content.trim()
  return /^(?:<p\b|<div\b|<h[1-6]\b|<blockquote\b|<ul\b|<ol\b|<table\b|<pre\b)/i.test(trimmed)
}

const openingFencePattern = /^```([\w#+.-]*)?\s*$/
const closingFencePattern = /^```\s*$/
const blockElementTags = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'DL',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'LI',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'UL',
])

function getNormalizedNodeText(element: Element) {
  return (element.textContent || '').replace(/\u00a0/g, ' ')
}

function getOpeningFenceLanguage(element: Element) {
  const match = getNormalizedNodeText(element).trim().match(openingFencePattern)
  return match ? match[1] || '' : null
}

function isClosingFence(element: Element) {
  return closingFencePattern.test(getNormalizedNodeText(element).trim())
}

function normalizeRichTextCodeFences(content: string) {
  if (typeof DOMParser === 'undefined') {
    return content
  }

  const document = new DOMParser().parseFromString(content, 'text/html')

  function transformContainer(container: Element) {
    Array.from(container.children).forEach((child) => transformContainer(child))

    let elements = Array.from(container.children)
    let index = 0

    while (index < elements.length) {
      const language = getOpeningFenceLanguage(elements[index])

      if (language === null) {
        index += 1
        continue
      }

      let closingIndex = -1

      for (let cursor = index + 1; cursor < elements.length; cursor += 1) {
        if (isClosingFence(elements[cursor])) {
          closingIndex = cursor
          break
        }
      }

      if (closingIndex === -1) {
        index += 1
        continue
      }

      const pre = document.createElement('pre')
      const code = document.createElement('code')

      if (language) {
        code.className = `language-${language}`
      }

      code.textContent = elements
        .slice(index + 1, closingIndex)
        .map((element) => getNormalizedNodeText(element))
        .join('\n')

      pre.appendChild(code)
      container.insertBefore(pre, elements[index])

      for (let removeIndex = index; removeIndex <= closingIndex; removeIndex += 1) {
        const element = elements[removeIndex]

        if (element.parentNode === container) {
          container.removeChild(element)
        }
      }

      elements = Array.from(container.children)
      index += 1
    }
  }

  transformContainer(document.body)
  return document.body.innerHTML
}

function renderInlineNodes(nodes: ChildNode[]): string {
  return nodes.map((node) => renderInlineNode(node)).join('')
}

function renderInlineNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return (node.textContent || '').replace(/\u00a0/g, ' ')
  }

  if (!(node instanceof Element)) {
    return ''
  }

  switch (node.tagName) {
    case 'BR':
      return '\n'
    case 'STRONG':
    case 'B':
      return `**${renderInlineNodes(Array.from(node.childNodes)).trim()}**`
    case 'EM':
    case 'I':
      return `*${renderInlineNodes(Array.from(node.childNodes)).trim()}*`
    case 'S':
    case 'DEL':
      return `~~${renderInlineNodes(Array.from(node.childNodes)).trim()}~~`
    case 'CODE':
      return `\`${getNormalizedNodeText(node)}\``
    case 'A': {
      const label = renderInlineNodes(Array.from(node.childNodes)).trim() || node.getAttribute('href') || ''
      const href = node.getAttribute('href') || ''
      return href ? `[${label}](${href})` : label
    }
    case 'IMG': {
      const alt = node.getAttribute('alt') || 'image'
      const src = node.getAttribute('src') || ''
      return src ? `![${alt}](${src})` : ''
    }
    default:
      return renderInlineNodes(Array.from(node.childNodes))
  }
}

function renderTableMarkdown(table: Element) {
  const rows = Array.from(table.querySelectorAll('tr')).map((row) =>
    Array.from(row.children).map((cell) => renderInlineNodes(Array.from(cell.childNodes)).trim()),
  )

  if (!rows.length) {
    return ''
  }

  const columnCount = Math.max(...rows.map((row) => row.length))
  const normalizedRows = rows.map((row) => [...row, ...Array(Math.max(0, columnCount - row.length)).fill('')])
  const header = normalizedRows[0]
  const body = normalizedRows.slice(1)
  const separator = Array(columnCount).fill('---')
  const lines = [
    `| ${header.join(' | ')} |`,
    `| ${separator.join(' | ')} |`,
    ...body.map((row) => `| ${row.join(' | ')} |`),
  ]

  return `${lines.join('\n')}\n\n`
}

function renderListMarkdown(list: Element, depth = 0) {
  const isOrdered = list.tagName === 'OL'
  const items = Array.from(list.children).filter((child) => child.tagName === 'LI')

  return `${items
    .map((item, index) => renderListItemMarkdown(item, depth, isOrdered ? `${index + 1}.` : '-'))
    .join('')}\n`
}

function renderListItemMarkdown(item: Element, depth: number, marker: string) {
  const indent = '  '.repeat(depth)
  const nestedLists = Array.from(item.children).filter((child) => child.tagName === 'UL' || child.tagName === 'OL')
  const inlineNodes = Array.from(item.childNodes).filter(
    (node) => !(node instanceof Element && (node.tagName === 'UL' || node.tagName === 'OL')),
  )
  const inlineText = renderInlineNodes(inlineNodes).trim()

  let result = `${indent}${marker} ${inlineText}\n`

  nestedLists.forEach((child) => {
    result += renderListMarkdown(child, depth + 1)
  })

  return result
}

function renderBlockNodes(nodes: ChildNode[]): string {
  return nodes.map((node) => renderBlockNode(node)).join('')
}

function renderBlockNode(node: ChildNode): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = (node.textContent || '').replace(/\u00a0/g, ' ').trim()
    return text ? `${text}\n\n` : ''
  }

  if (!(node instanceof Element)) {
    return ''
  }

  switch (node.tagName) {
    case 'H1':
    case 'H2':
    case 'H3':
    case 'H4':
    case 'H5':
    case 'H6': {
      const level = Number(node.tagName.slice(1))
      const content = renderInlineNodes(Array.from(node.childNodes)).trim()
      return content ? `${'#'.repeat(level)} ${content}\n\n` : ''
    }
    case 'P': {
      const content = renderInlineNodes(Array.from(node.childNodes)).trim()
      return content ? `${content}\n\n` : '\n'
    }
    case 'DIV': {
      const hasBlockChildren = Array.from(node.children).some((child) => blockElementTags.has(child.tagName))

      if (hasBlockChildren) {
        return renderBlockNodes(Array.from(node.childNodes))
      }

      const content = renderInlineNodes(Array.from(node.childNodes)).trim()
      return content ? `${content}\n\n` : ''
    }
    case 'PRE': {
      const codeElement = node.querySelector('code')
      const language =
        codeElement?.className.match(/language-([\w#+.-]+)/)?.[1] ||
        node.getAttribute('data-language') ||
        ''
      const codeText = (codeElement?.textContent || node.textContent || '').replace(/\u00a0/g, ' ')
      const trimmedCode = codeText.replace(/\n+$/, '')
      return `\`\`\`${language}\n${trimmedCode}\n\`\`\`\n\n`
    }
    case 'BLOCKQUOTE': {
      const content = renderBlockNodes(Array.from(node.childNodes)).trim()

      if (!content) {
        return ''
      }

      return `${content
        .split('\n')
        .map((line) => (line ? `> ${line}` : '>'))
        .join('\n')}\n\n`
    }
    case 'UL':
    case 'OL':
      return renderListMarkdown(node)
    case 'HR':
      return '---\n\n'
    case 'TABLE':
      return renderTableMarkdown(node)
    default: {
      const hasBlockChildren = Array.from(node.children).some((child) => blockElementTags.has(child.tagName))

      if (hasBlockChildren) {
        return renderBlockNodes(Array.from(node.childNodes))
      }

      const content = renderInlineNodes(Array.from(node.childNodes)).trim()
      return content ? `${content}\n\n` : ''
    }
  }
}

function convertRichTextHtmlToMarkdown(content: string) {
  if (typeof DOMParser === 'undefined') {
    return content
  }

  const normalizedHtml = normalizeRichTextCodeFences(content)
  const doc = new DOMParser().parseFromString(normalizedHtml, 'text/html')

  return renderBlockNodes(Array.from(doc.body.childNodes))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function normalizeContentForMarkdownEditor(content?: string | null) {
  const raw = (content || '').trim()

  if (!raw) {
    return ''
  }

  return isRichTextHtml(raw) ? convertRichTextHtmlToMarkdown(raw) : raw
}

const previewHtml = computed(() => markdown.render(articleForm.content || ''))
const wordCount = computed(() => articleForm.content.replace(/\s+/g, '').length)
const estimatedReadMinutes = computed(() => Math.max(1, Math.ceil(wordCount.value / 300)))
const markdownActions = [
  { label: 'H2', action: () => insertLinePrefix('## ') },
  { label: '加粗', action: () => wrapSelection('**', '**', '重点内容') },
  { label: '斜体', action: () => wrapSelection('*', '*', '强调内容') },
  { label: '引用', action: () => insertLinePrefix('> ') },
  { label: '链接', action: () => wrapSelection('[', '](https://example.com)', '链接标题') },
  { label: '代码', action: () => wrapSelection('`', '`', 'const answer = 42') },
  { label: '代码块', action: () => insertSnippet('\n```ts\nconsole.log(\"hello\")\n```\n') },
  { label: '列表', action: () => insertSnippet('\n- 第一项\n- 第二项\n- 第三项\n') },
]

function hasMeaningfulMarkdownContent(content: string) {
  const plainText = markdown
    .render(content || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, '')

  return plainText.length > 0
}

function updateContent(nextValue: string, selectionStart: number, selectionEnd: number) {
  articleForm.content = nextValue

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
    articleForm.content += `${prefix}${placeholder}${suffix}`
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
    articleForm.content += `\n${prefix}标题`
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
    articleForm.content += snippet
    return
  }

  const { selectionStart, selectionEnd, value } = editorRef.value
  const nextValue = `${value.slice(0, selectionStart)}${snippet}${value.slice(selectionEnd)}`
  const cursor = selectionStart + snippet.length

  updateContent(nextValue, cursor, cursor)
}

function resetForm() {
  articleForm.userId = 0
  articleForm.title = ''
  articleForm.summary = ''
  articleForm.content = ''
  articleForm.categoryId = 0
  articleForm.tagIds = []
  articleForm.status = Number(route.query.status) === 1 ? 1 : 0
}

async function ensureEditorData() {
  if (!adminState.dashboardLoaded) {
    const success = await loadDashboard({ silent: true })

    if (!success) {
      void router.replace('/login')
      return false
    }
  }

  return true
}

async function loadPageData() {
  resetForm()

  const ready = await ensureEditorData()

  if (!ready) {
    return
  }

  if (!isEditMode.value || !articleId.value) {
    return
  }

  const detail = await loadAdminArticleDetail(articleId.value)

  if (!detail) {
    void router.replace('/dashboard/articles')
    return
  }

  articleForm.userId = detail.userId
  articleForm.title = detail.title
  articleForm.summary = detail.summary || ''
  articleForm.content = normalizeContentForMarkdownEditor(detail.content)
  articleForm.categoryId = detail.categoryId || 0
  articleForm.tagIds = detail.tags.map((tag) => tag.id)
  articleForm.status = detail.status
}

function goBack() {
  void router.push('/dashboard/articles')
}

async function submitArticleWithStatus(status: number) {
  if (!articleForm.title || !hasMeaningfulMarkdownContent(articleForm.content)) {
    ElMessage.warning('请填写标题和正文')
    return
  }

  if (!isEditMode.value && !defaultAuthor.value && !articleForm.userId) {
    ElMessage.warning('当前没有可用的默认作者，请先创建并启用前台用户账号')
    return
  }

  articleForm.status = status

  const success = await saveArticleByAdmin({
    articleId: articleId.value || undefined,
    userId: articleForm.userId || undefined,
    title: articleForm.title.trim(),
    summary: articleForm.summary.trim(),
    content: articleForm.content,
    categoryId: articleForm.categoryId || null,
    tagIds: articleForm.tagIds,
    status: articleForm.status,
  })

  if (!success) {
    return
  }

  await loadDashboard({ silent: true })
  void router.push('/dashboard/articles')
}

onMounted(() => {
  void loadPageData()
})
</script>

<template>
  <section class="admin-page">
    <article class="admin-panel">
      <div class="admin-panel__head">
        <div>
          <p class="admin-panel__eyebrow">文章编辑</p>
          <h3 class="admin-panel__title">
            {{ isEditMode ? '编辑文章内容' : '创建新文章' }}
          </h3>
          <p class="admin-article-editor__hint">
            管理台正文已切换为 Markdown 编辑，支持实时预览和围栏代码块。
          </p>
        </div>

        <el-button plain :icon="ArrowLeft" @click="goBack">返回列表</el-button>
      </div>

      <el-form :model="articleForm" label-position="top">
        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="文章作者（可选）">
              <el-select
                v-model="articleForm.userId"
                class="admin-panel__full-width"
                filterable
                clearable
                placeholder="不选择则自动分配作者"
              >
                <el-option
                  v-for="user in availableUsers"
                  :key="user.id"
                  :label="`${user.nickname || user.username} (${user.username})`"
                  :value="user.id"
                />
              </el-select>
              <p class="admin-article-editor__hint">{{ authorFieldHint }}</p>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="发布状态">
              <el-select v-model="articleForm.status" class="admin-panel__full-width">
                <el-option label="草稿" :value="0" />
                <el-option label="发布" :value="1" />
                <el-option label="下架" :value="2" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章标题">
          <el-input v-model.trim="articleForm.title" placeholder="输入文章标题" />
        </el-form-item>

        <el-form-item label="文章摘要">
          <el-input v-model.trim="articleForm.summary" type="textarea" :rows="3" placeholder="输入文章摘要" />
        </el-form-item>

        <el-row :gutter="12">
          <el-col :span="12">
            <el-form-item label="文章分类">
              <el-select v-model="articleForm.categoryId" class="admin-panel__full-width" clearable>
                <el-option label="未分类" :value="0" />
                <el-option
                  v-for="category in adminState.categoryOptions"
                  :key="category.id"
                  :label="category.name"
                  :value="category.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文章标签">
              <el-select
                v-model="articleForm.tagIds"
                class="admin-panel__full-width"
                multiple
                collapse-tags
                collapse-tags-tooltip
              >
                <el-option
                  v-for="tag in adminState.tagOptions"
                  :key="tag.id"
                  :label="tag.name"
                  :value="tag.id"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="文章正文">
          <div class="admin-markdown-editor">
            <div class="admin-markdown-editor__meta">
              <span>{{ wordCount }} 字</span>
              <span>预计 {{ estimatedReadMinutes }} 分钟阅读</span>
            </div>

            <div class="admin-markdown-toolbar">
              <button
                v-for="tool in markdownActions"
                :key="tool.label"
                class="admin-markdown-toolbar__button"
                type="button"
                @click="tool.action"
              >
                {{ tool.label }}
              </button>
            </div>

            <div class="admin-markdown-workspace">
              <section class="admin-markdown-pane">
                <div class="admin-markdown-pane__head">
                  <strong>Markdown 编辑区</strong>
                  <span>支持标题、引用、链接、围栏代码块、列表和表格</span>
                </div>

                <textarea
                  ref="editorRef"
                  v-model="articleForm.content"
                  class="admin-markdown-textarea"
                  placeholder="输入 Markdown 正文..."
                />
              </section>

              <section class="admin-markdown-pane admin-markdown-pane--preview">
                <div class="admin-markdown-pane__head">
                  <strong>实时预览</strong>
                  <span>保存后前台也会按 Markdown 效果渲染</span>
                </div>

                <div class="admin-markdown-preview">
                  <div v-if="articleForm.content.trim()" class="admin-markdown-body" v-html="previewHtml" />
                  <div v-else class="admin-markdown-empty">开始输入 Markdown 后，这里会显示预览。</div>
                </div>
              </section>
            </div>
          </div>
          <p class="admin-article-editor__hint">
            历史富文本文章会在打开时尽量自动转换成 Markdown；代码块可以直接写成 ```ts ... ```。
          </p>
        </el-form-item>
      </el-form>

      <div class="admin-article-editor__footer">
        <el-button @click="goBack">取消</el-button>
        <el-button :loading="adminState.loading" @click="submitArticleWithStatus(0)">
          {{ isEditMode ? '保存草稿' : '创建草稿' }}
        </el-button>
        <el-button type="primary" :loading="adminState.loading" @click="submitArticleWithStatus(1)">
          {{ isEditMode ? '保存并发布' : '发布文章' }}
        </el-button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.admin-article-editor__hint {
  margin: 8px 0 0;
  color: var(--muted);
  font-size: 12px;
  line-height: 1.5;
}

.admin-markdown-editor {
  width: 100%;
  border: 1px solid rgba(42, 66, 56, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.9);
  overflow: hidden;
}

.admin-markdown-editor__meta {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  padding: 14px 16px 0;
  color: var(--muted);
  font-size: 12px;
}

.admin-markdown-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(42, 66, 56, 0.08);
  background: rgba(244, 239, 230, 0.5);
}

.admin-markdown-toolbar__button {
  border: 1px solid rgba(42, 66, 56, 0.14);
  border-radius: 999px;
  padding: 7px 14px;
  background: #fff;
  color: var(--text-main);
  font: inherit;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease;
}

.admin-markdown-toolbar__button:hover {
  transform: translateY(-1px);
  border-color: rgba(199, 106, 34, 0.45);
  box-shadow: 0 8px 20px rgba(28, 40, 33, 0.08);
}

.admin-markdown-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
}

.admin-markdown-pane {
  min-width: 0;
}

.admin-markdown-pane--preview {
  border-left: 1px solid rgba(42, 66, 56, 0.08);
  background: linear-gradient(180deg, rgba(255, 251, 245, 0.82), rgba(248, 244, 238, 0.92));
}

.admin-markdown-pane__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid rgba(42, 66, 56, 0.08);
  color: var(--muted);
  font-size: 12px;
}

.admin-markdown-pane__head strong {
  color: var(--text-main);
  font-size: 14px;
}

.admin-markdown-textarea {
  width: 100%;
  min-height: 520px;
  border: 0;
  resize: vertical;
  padding: 18px;
  background: transparent;
  color: var(--text-main);
  font: 500 14px/1.75 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  outline: 0;
}

.admin-markdown-preview {
  min-height: 520px;
}

.admin-markdown-body,
.admin-markdown-empty {
  padding: 22px 20px;
}

.admin-markdown-empty {
  color: var(--muted);
}

.admin-markdown-body :deep(*:first-child) {
  margin-top: 0;
}

.admin-markdown-body :deep(*:last-child) {
  margin-bottom: 0;
}

.admin-markdown-body :deep(h1),
.admin-markdown-body :deep(h2),
.admin-markdown-body :deep(h3),
.admin-markdown-body :deep(h4) {
  margin: 1.5em 0 0.7em;
  color: #111827;
  line-height: 1.2;
}

.admin-markdown-body :deep(h1) {
  font-size: 1.9rem;
}

.admin-markdown-body :deep(h2) {
  font-size: 1.5rem;
  padding-bottom: 0.35em;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.admin-markdown-body :deep(p),
.admin-markdown-body :deep(ul),
.admin-markdown-body :deep(ol),
.admin-markdown-body :deep(pre),
.admin-markdown-body :deep(blockquote),
.admin-markdown-body :deep(table) {
  margin: 1em 0;
}

.admin-markdown-body :deep(ul),
.admin-markdown-body :deep(ol) {
  padding-left: 1.4em;
}

.admin-markdown-body :deep(li + li) {
  margin-top: 0.45em;
}

.admin-markdown-body :deep(a) {
  color: #b45309;
  text-decoration: none;
}

.admin-markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.admin-markdown-body :deep(blockquote) {
  padding: 12px 16px;
  border-left: 4px solid rgba(199, 106, 34, 0.4);
  background: rgba(199, 106, 34, 0.08);
  color: #6a4a2d;
}

.admin-markdown-body :deep(pre) {
  overflow-x: auto;
  padding: 16px;
  border-radius: 18px;
  background: #102033;
  color: #eff6ff;
}

.admin-markdown-body :deep(code) {
  padding: 0.14em 0.4em;
  border-radius: 8px;
  background: rgba(16, 32, 51, 0.07);
  font-family: 'SFMono-Regular', 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.92em;
}

.admin-markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.admin-markdown-body :deep(table) {
  width: 100%;
  border-collapse: collapse;
}

.admin-markdown-body :deep(th),
.admin-markdown-body :deep(td) {
  border: 1px solid rgba(42, 66, 56, 0.12);
  padding: 10px 12px;
  text-align: left;
}

.admin-markdown-body :deep(hr) {
  border: 0;
  border-top: 1px solid rgba(15, 23, 42, 0.08);
  margin: 1.8em 0;
}

.admin-article-editor__footer {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 20px;
}

@media (max-width: 1100px) {
  .admin-markdown-workspace {
    grid-template-columns: 1fr;
  }

  .admin-markdown-pane--preview {
    border-left: 0;
    border-top: 1px solid rgba(42, 66, 56, 0.08);
  }
}
</style>
