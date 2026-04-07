<script setup>
import { withBase } from 'vitepress'

defineOptions({
  name: 'CategoryTreeNode'
})

defineProps({
  node: {
    type: Object,
    required: true
  }
})
</script>

<template>
  <li class="category-node" :class="`category-node--depth-${node.depth}`">
    <details v-if="node.type === 'branch'" class="category-branch" :open="node.depth <= 1">
      <summary class="category-branch__summary">
        <span class="category-branch__title">{{ node.title }}</span>
        <span v-if="node.description" class="category-branch__description">{{ node.description }}</span>
      </summary>

      <ul class="category-branch__list">
        <CategoryTreeNode
          v-for="child in node.items"
          :key="`${child.type}-${child.title}`"
          :node="child"
        />
      </ul>
    </details>

    <a v-else class="category-leaf" :href="withBase(node.link)">
      <strong class="category-leaf__title">{{ node.title }}</strong>
      <span v-if="node.description" class="category-leaf__description">{{ node.description }}</span>
      <code class="category-leaf__file">{{ node.file }}</code>
    </a>
  </li>
</template>
