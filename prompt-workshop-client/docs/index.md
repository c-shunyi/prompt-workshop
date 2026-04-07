---
layout: home

hero:
  name: Prompt Workshop Client
  text: 用 VitePress 搭建的提示词工坊文档站
  tagline: 聚合项目说明、构建指引与实践文档，让提示词资产更容易整理、发布和维护。
  image:
    src: /logo.svg
    alt: Prompt Workshop Logo
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/getting-started
    - theme: alt
      text: 查看结构
      link: /reference/project-structure

features:
  - title: 内容优先
    details: 直接使用 Markdown 维护项目文档、提示词模板和说明页面，写作与发布路径清晰简单。
  - title: 开发轻量
    details: 基于 VitePress，安装依赖后即可本地预览、构建静态站点并部署到任意静态托管平台。
  - title: 后续可扩展
    details: 已预留指南与参考目录，后续可以继续接入现有文档、组件示例或自定义主题能力。
---

<div class="home-intro">
  <p>
    这个站点已经具备基础首页、导航、搜索、侧边栏和自定义样式，可以直接作为
    <strong>prompt-workshop-client</strong>
    的文档前端继续迭代。
  </p>

  <div class="home-grid">
    <div class="home-card">
      <h3>适合放什么</h3>
      <p>项目介绍、使用说明、提示词模板、最佳实践、更新日志。</p>
    </div>
    <div class="home-card">
      <h3>怎么启动</h3>
      <p>进入目录后执行 <code>pnpm install</code> 与 <code>pnpm dev</code> 即可预览。</p>
    </div>
    <div class="home-card">
      <h3>怎么扩展</h3>
      <p>在 <code>docs</code> 下新增 Markdown 页面，并在配置里补充导航或侧边栏即可。</p>
    </div>
  </div>
</div>
