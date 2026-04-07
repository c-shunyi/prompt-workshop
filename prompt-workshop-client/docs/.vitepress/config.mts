import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitepress'
import { buildCategorySidebarItems, collectSidebarPrefixes, normalizeCategoryTree } from './utils/category.mjs'

const rawCategoryTree = JSON.parse(
  readFileSync(new URL('./category-tree.json', import.meta.url), 'utf8')
)
const categoryTree = normalizeCategoryTree(rawCategoryTree)
const categorySidebarItems = buildCategorySidebarItems(categoryTree)
const categorySidebar = [
  {
    text: '分类',
    items: [
      { text: '分类总览', link: '/categories/' }
    ]
  },
  ...categorySidebarItems
]
const categorySidebarPrefixes = collectSidebarPrefixes(categoryTree)
const sidebar = Object.fromEntries(
  ['/categories/', ...categorySidebarPrefixes].map((prefix) => [prefix, categorySidebar])
)

export default defineConfig({
  title: 'Prompt Workshop',
  description: 'AI 提示词工坊文档站点',
  lang: 'zh-CN',
  appearance: true,
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    logo: '/logo.svg',
    nav: [
      { text: '首页', link: '/' },
      { text: '分类', link: '/categories/' },
      { text: '指南', link: '/guide/' },
      { text: '参考', link: '/reference/project-structure' }
    ],
    sidebar,
    search: {
      provider: 'local'
    },
    darkModeSwitchLabel: '主题切换',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2026 Prompt Workshop'
    }
  }
})
