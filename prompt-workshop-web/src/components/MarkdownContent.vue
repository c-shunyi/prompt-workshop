<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '../utils/markdown'

const props = withDefaults(
  defineProps<{
    content?: string | null
    emptyText?: string
  }>(),
  {
    content: '',
    emptyText: '还没有内容',
  },
)

const copyResetTimers = new WeakMap<HTMLButtonElement, number>()

function getCodeLanguageLabel(className: string) {
  const match = className.match(/language-([\w#+.-]+)/i)
  return match ? match[1].toUpperCase() : 'CODE'
}

function enhanceCodeBlocks(html: string) {
  if (!html || typeof DOMParser === 'undefined') {
    return html
  }

  const document = new DOMParser().parseFromString(html, 'text/html')
  const codeBlocks = document.body.querySelectorAll('pre')

  codeBlocks.forEach((pre) => {
    const code = pre.querySelector('code')

    if (!code) {
      return
    }

    const toolbar = document.createElement('div')
    toolbar.className = 'markdown-code-toolbar'

    const language = document.createElement('span')
    language.className = 'markdown-code-language'
    language.textContent = getCodeLanguageLabel(code.className)

    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'markdown-copy-button'
    button.textContent = '复制'
    button.setAttribute('aria-label', '复制代码')

    toolbar.appendChild(language)
    toolbar.appendChild(button)
    pre.insertBefore(toolbar, pre.firstChild)
  })

  return document.body.innerHTML
}

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return
    } catch {
      // Fall back to execCommand when clipboard permissions are unavailable.
    }
  }

  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', 'true')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(textarea)

  if (!copied) {
    throw new Error('copy failed')
  }
}

async function handleMarkdownClick(event: MouseEvent) {
  const target = event.target

  if (!(target instanceof HTMLElement)) {
    return
  }

  const button = target.closest<HTMLButtonElement>('.markdown-copy-button')

  if (!button) {
    return
  }

  const pre = button.closest('pre')
  const code = pre?.querySelector('code')
  const codeText = code?.textContent || ''

  if (!codeText) {
    return
  }

  try {
    await copyText(codeText)
    button.textContent = '已复制'
    button.dataset.state = 'copied'
  } catch {
    button.textContent = '复制失败'
    button.dataset.state = 'error'
  }

  const existingTimer = copyResetTimers.get(button)

  if (existingTimer) {
    window.clearTimeout(existingTimer)
  }

  const resetTimer = window.setTimeout(() => {
    button.textContent = '复制'
    delete button.dataset.state
  }, 1800)

  copyResetTimers.set(button, resetTimer)
}

const renderedHtml = computed(() => enhanceCodeBlocks(renderMarkdown(props.content || '')))
</script>

<template>
  <div v-if="content" class="markdown-body" v-html="renderedHtml" @click="handleMarkdownClick" />
  <div v-else class="markdown-empty">
    {{ emptyText }}
  </div>
</template>
