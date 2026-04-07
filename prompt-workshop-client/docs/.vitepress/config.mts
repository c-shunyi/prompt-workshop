import { readFileSync } from 'node:fs'
import { defineConfig } from 'vitepress'
import { buildCategorySidebarItems, normalizeCategoryTree } from './utils/category.mjs'

const rawCategoryTree = JSON.parse(
  readFileSync(new URL('./category-tree.json', import.meta.url), 'utf8')
)
const categoryTree = normalizeCategoryTree(rawCategoryTree)
const categorySidebarItems = buildCategorySidebarItems(categoryTree)

export default defineConfig({
  title: 'Prompt Workshop',
  description: 'AI 提示词工坊文档站点',
  lang: 'zh-CN',
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
    sidebar: {
      '/guide/': [
        {
          text: '开始使用',
          items: [
            { text: '概览', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' }
          ]
        }
      ],
      '/reference/': [
        {
          text: '参考',
          items: [
            { text: '分类配置', link: '/reference/category-config' },
            { text: '项目结构', link: '/reference/project-structure' }
          ]
        }
      ],
      '/categories/': [
        {
          text: '分类',
          items: [
            { text: '分类总览', link: '/categories/' }
          ]
        },
        ...categorySidebarItems
      ]
    },
    search: {
      provider: 'local'
    },
    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2026 Prompt Workshop'
    }
  }
})
