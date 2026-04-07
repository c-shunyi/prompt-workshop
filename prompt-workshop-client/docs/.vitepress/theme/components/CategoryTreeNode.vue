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
    <article v-if="node.type === 'branch'" class="category-card category-card--branch">
      <header class="category-card__header">
        <span class="category-card__eyebrow">
          {{ node.depth === 0 ? '顶级分类' : '子分类' }}
        </span>
        <h3 class="category-card__title">{{ node.title }}</h3>
        <p v-if="node.description" class="category-card__description">{{ node.description }}</p>
      </header>

      <ul class="category-card__children">
        <CategoryTreeNode
          v-for="child in node.items"
          :key="`${child.type}-${child.title}`"
          :node="child"
        />
      </ul>
    </article>

    <a v-else class="category-card category-card--leaf" :href="withBase(node.link)">
      <span class="category-card__eyebrow">提示词页面</span>
      <strong class="category-card__title">{{ node.title }}</strong>
      <span v-if="node.description" class="category-card__description">{{ node.description }}</span>
      <div class="category-card__footer">
        <code class="category-card__file">{{ node.file }}</code>
        <span class="category-card__action">进入页面</span>
      </div>
    </a>
  </li>
</template>
