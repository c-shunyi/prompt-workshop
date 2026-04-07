<script setup>
import rawCategoryTree from '../../category-tree.json'
import { countLeafPages, normalizeCategoryTree } from '../../utils/category.mjs'
import CategoryTreeNode from './CategoryTreeNode.vue'

const categoryTree = normalizeCategoryTree(rawCategoryTree)
const topLevelCount = categoryTree.length
const leafPageCount = countLeafPages(categoryTree)
</script>

<template>
  <section class="category-panel">
    <header class="category-panel__header">
      <p class="category-panel__eyebrow">JSON 驱动分类</p>
      <h2>文档分类总览</h2>
      <p class="category-panel__lead">
        当前页面内容来自 <code>docs/.vitepress/category-tree.json</code>。你只需要维护一份 JSON，
        分类页和“分类”侧边栏都会跟着一起更新。
      </p>
      <div class="category-panel__stats">
        <span>{{ topLevelCount }} 个顶级分类</span>
        <span>{{ leafPageCount }} 个末级页面</span>
      </div>
    </header>

    <ul class="category-tree">
      <CategoryTreeNode
        v-for="node in categoryTree"
        :key="`${node.type}-${node.title}`"
        :node="node"
      />
    </ul>
  </section>
</template>
