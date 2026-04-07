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
      <p class="category-panel__eyebrow">Prompt Workshop</p>
      <h2>提示词分类导航</h2>
      <p class="category-panel__lead">
        这里按主题整理了站点中的提示词内容。你可以从顶级分类逐层展开，快速找到对应的页面和提示词模板。
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
