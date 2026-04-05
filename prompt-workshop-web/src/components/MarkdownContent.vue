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

const renderedHtml = computed(() => renderMarkdown(props.content || ''))
</script>

<template>
  <div v-if="content" class="markdown-body" v-html="renderedHtml" />
  <div v-else class="markdown-empty">
    {{ emptyText }}
  </div>
</template>
