import { defineConfig } from 'vitepress'

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
            { text: '项目结构', link: '/reference/project-structure' }
          ]
        }
      ]
    },
    search: {
      provider: 'local'
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/' }
    ],
    footer: {
      message: 'Built with VitePress',
      copyright: 'Copyright © 2026 Prompt Workshop'
    }
  }
})
