# 项目结构

当前目录结构如下：

```text
prompt-workshop-client/
├─ docs/
│  ├─ .vitepress/
│  │  ├─ config.mts
│  │  └─ theme/
│  │     ├─ custom.css
│  │     └─ index.ts
│  ├─ guide/
│  │  ├─ getting-started.md
│  │  └─ index.md
│  ├─ public/
│  │  └─ logo.svg
│  ├─ reference/
│  │  └─ project-structure.md
│  └─ index.md
├─ .gitignore
└─ package.json
```

## 目录说明

- `docs/.vitepress/config.mts`：VitePress 站点配置，包含标题、导航、侧边栏和搜索
- `docs/.vitepress/theme/`：主题扩展入口与自定义样式
- `docs/public/`：静态资源目录，构建时会原样复制
- `docs/guide/`：面向使用者的文档内容
- `docs/reference/`：面向维护者的结构与约定说明

## 常见维护动作

- 新增页面：直接在 `docs` 下创建 Markdown 文件
- 加入导航：修改 `docs/.vitepress/config.mts`
- 调整视觉：修改 `docs/.vitepress/theme/custom.css`
